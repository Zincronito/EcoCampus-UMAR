import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { offlineQueue, QueuedItem } from './offlineQueue';
import { API_URL } from '../config';

let isSyncing = false;
let listeners: Array<(count: number) => void> = [];

/** Obtiene el token de auth guardado */
async function getAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem('token');
}

/** Helper para hacer requests autenticados */
async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const token = await getAuthToken();
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    let detail = '';
    try {
      const errorBody = await response.json();
      detail = errorBody.detail ? JSON.stringify(errorBody.detail) : JSON.stringify(errorBody);
    } catch {
      // No pudo parsear JSON
    }
    throw new Error(`HTTP ${response.status}: ${detail || response.statusText}`);
  }
  return response.json();
}

export const syncService = {
  /** Verifica si hay conexión a internet */
  async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return !!(state.isConnected && state.isInternetReachable);
  },

  /** Suscribe un listener para saber cuando cambia el contador de pendientes */
  onQueueChange(callback: (count: number) => void): () => void {
    listeners.push(callback);
    return () => {
      listeners = listeners.filter((l) => l !== callback);
    };
  },

  /** Notifica a los listeners del contador actual */
  async notifyListeners(): Promise<void> {
    const count = await offlineQueue.count();
    listeners.forEach((cb) => cb(count));
  },

  /** Sube una foto local y devuelve la URL remota */
  async uploadPhoto(uri: string): Promise<string> {
    const token = await getAuthToken();
    const formData = new FormData();
    formData.append('file', {
      uri,
      name: `photo_${Date.now()}.jpg`,
      type: 'image/jpeg',
    } as any);

    const response = await fetch(`${API_URL}/incidents/upload-photo`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Error subiendo foto: HTTP ${response.status}`);
    }
    const data = await response.json();
    // El backend devuelve { photo_url, filename }
    if (!data.photo_url) {
      throw new Error("El backend no devolvió photo_url");
    }
    return data.photo_url;
  },

  /** Procesa un item de la cola */
  async processItemWithResult(item: QueuedItem): Promise<{ success: boolean; remoteId?: string }> {
    try {
      let payloadToSend = { ...item.payload };

      // Detectar si el payload trae una URI local de foto (file://...)
      const hasLocalPhoto = payloadToSend.photo_url?.startsWith('file://');

      if (hasLocalPhoto) {
        console.log(`📸 Subiendo foto local del item ${item.id}...`);
        try {
          const remotePhotoUrl = await this.uploadPhoto(payloadToSend.photo_url);
          payloadToSend.photo_url = remotePhotoUrl;
          console.log(`✅ Foto subida: ${remotePhotoUrl}`);
        } catch (photoError) {
          console.error(`❌ Falló subida de foto:`, photoError);
          return { success: false };
        }
      }

      // Si es una incidencia con collection_record_id local todavía, esperar
      if (item.type === 'incident' && payloadToSend.collection_record_id?.startsWith?.('local_')) {
        console.warn(`⏸️ Incidencia ${item.id} apunta a un record local que aún no se ha subido. Esperando...`);
        return { success: false };
      }

      // Enviamos el registro/incidencia
      console.log(`📤 Enviando a ${item.endpoint}:`, JSON.stringify(payloadToSend));
      const result = await apiRequest(item.endpoint, {
        method: 'POST',
        body: JSON.stringify(payloadToSend),
      });
      console.log(`✅ Respuesta del backend:`, result);

      return { success: true, remoteId: result?.id };
    } catch (error) {
      console.error(`Error procesando item ${item.id}:`, error);
      return { success: false };
    }
  },

  // Alias compatible con la interfaz anterior
  async processItem(item: QueuedItem): Promise<boolean> {
    const result = await this.processItemWithResult(item);
    return result.success;
  },

  /** Procesa TODOS los items pendientes en la cola */
  /** Procesa TODOS los items pendientes en la cola */
  async flushQueue(): Promise<{ success: number; failed: number }> {
    if (isSyncing) {
      console.log('Ya hay una sincronización en curso');
      return { success: 0, failed: 0 };
    }

    const online = await this.isOnline();
    if (!online) {
      console.log('Sin conexión, no se puede sincronizar');
      return { success: 0, failed: 0 };
    }

    isSyncing = true;
    let success = 0;
    let failed = 0;

    try {
      const queue = await offlineQueue.getAll();
      // Ordenar: primero records, luego incidents (que dependen de records)
      queue.sort((a, b) => {
        if (a.type === 'record' && b.type !== 'record') return -1;
        if (a.type !== 'record' && b.type === 'record') return 1;
        return 0;
      });
      console.log(`📤 Sincronizando ${queue.length} items pendientes (ordenados):`);
      queue.forEach((it, idx) => {
        console.log(`  ${idx + 1}. [${it.type}] ${it.id} → ${it.endpoint}${it.payload?.collection_record_id ? ' (record_id=' + it.payload.collection_record_id + ')' : ''}`);
      });

      // Mapa de reemplazos de IDs locales → remotos (para incidencias dentro del mismo flush)
      const idReplacements: Record<string, string> = {};

      for (const item of queue) {
        // Si un item ha fallado más de 5 veces, lo saltamos
        if (item.retries >= 5) {
          console.warn(`Item ${item.id} excedió reintentos, saltando`);
          failed++;
          continue;
        }

        // Aplicar reemplazos de IDs pendientes ANTES de procesar
        const workingItem = { ...item };
        if (workingItem.payload?.collection_record_id && idReplacements[workingItem.payload.collection_record_id]) {
          const localId = workingItem.payload.collection_record_id;
          const remoteId = idReplacements[localId];
          console.log(`🔀 Aplicando reemplazo en item ${workingItem.id}: ${localId} → ${remoteId}`);
          workingItem.payload = { ...workingItem.payload, collection_record_id: remoteId };
        }

        // ⭐ Eliminar del storage ANTES de procesar para evitar duplicados
        await offlineQueue.remove(item.id);

        const result = await this.processItemWithResult(workingItem);
        if (result.success) {
          success++;
          // Si el item era un record y devolvió un UUID real, guardar el reemplazo
          if (workingItem.type === 'record' && result.remoteId && workingItem.id.startsWith('local_')) {
            idReplacements[workingItem.id] = result.remoteId;
            console.log(`💾 ID mapeado en memoria: ${workingItem.id} → ${result.remoteId}`);
          }
        } else {
          // Si falla, lo volvemos a meter en la cola con retries incrementado
          const requeuedItem = { ...item, retries: item.retries + 1 };
          await offlineQueue.requeue(requeuedItem);
          failed++;
        }
      }

      await this.notifyListeners();
      console.log(`✅ Sincronización completa: ${success} OK, ${failed} fallos`);
    } finally {
      isSyncing = false;
    }

    return { success, failed };
  },

  /** Inicia el escuchador de red que dispara sync cuando vuelve internet */
  startAutoSync(): () => void {
    console.log('🔄 Iniciando auto-sync de cola offline');

    let lastState: boolean | null = null;
    let debounceTimer: any = null;

    const unsubscribe = NetInfo.addEventListener(async (state) => {
      const isOnline = !!(state.isConnected && state.isInternetReachable);

      // Solo actuamos si el estado cambió de offline a online
      if (isOnline && lastState !== true) {
        lastState = true;

        // Debounce: esperamos 1 segundo para evitar disparos múltiples
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
          console.log('📶 Internet estable detectado, sincronizando cola...');
          await this.flushQueue();
        }, 1000);
      } else if (!isOnline) {
        lastState = false;
      }
    });

    return unsubscribe;
  },
};