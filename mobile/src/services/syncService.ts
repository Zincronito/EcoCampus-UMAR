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
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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
    return data.url;
  },

  /** Procesa un item de la cola */
  async processItem(item: QueuedItem): Promise<boolean> {
    try {
      // Si tiene foto local, primero la subimos
      let photoUrl: string | undefined;
      if (item.photoUri) {
        photoUrl = await this.uploadPhoto(item.photoUri);
      }

      // Preparamos el payload final con la URL de foto (si aplica)
      const finalPayload = photoUrl
        ? { ...item.payload, photo_url: photoUrl }
        : item.payload;

      // Enviamos el registro
      await apiRequest(item.endpoint, {
        method: 'POST',
        body: JSON.stringify(finalPayload),
      });
      return true;
    } catch (error) {
      console.error(`Error procesando item ${item.id}:`, error);
      return false;
    }
  },

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
      console.log(`🔍 Items encontrados en cola: ${JSON.stringify(queue.map(i => ({ id: i.id, endpoint: i.endpoint })))}`);
      console.log(`📤 Sincronizando ${queue.length} items pendientes...`);

      for (const item of queue) {
        // Si un item ha fallado más de 5 veces, lo saltamos
        if (item.retries >= 5) {
          console.warn(`Item ${item.id} excedió reintentos, saltando`);
          failed++;
          continue;
        }

        const ok = await this.processItem(item);
        if (ok) {
          await offlineQueue.remove(item.id);
          success++;
        } else {
          await offlineQueue.incrementRetries(item.id);
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

    const unsubscribe = NetInfo.addEventListener(async (state) => {
      if (state.isConnected && state.isInternetReachable) {
        console.log('📶 Internet detectado, sincronizando cola...');
        await this.flushQueue();
      }
    });

    return unsubscribe;
  },
};