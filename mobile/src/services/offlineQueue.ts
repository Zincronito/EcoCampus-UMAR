import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'offline_queue';

export interface QueuedItem {
  id: string;              // ID temporal local
  type: 'record' | 'incident';
  endpoint: string;         // ej: '/records'
  payload: any;             // datos a enviar
  photoUri?: string;        // URI local de foto (si aplica)
  createdAt: string;
  retries: number;
}

export const offlineQueue = {
  /** Agrega un item a la cola */
  async add(item: Omit<QueuedItem, 'id' | 'createdAt' | 'retries'>): Promise<QueuedItem> {
    const queue = await this.getAll();
    const newItem: QueuedItem = {
      ...item,
      id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      retries: 0,
    };
    queue.push(newItem);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    console.log(`💾 Item guardado en cola. Total: ${queue.length}`);
    return newItem;
  },

  /** Obtiene todos los items pendientes */
  async getAll(): Promise<QueuedItem[]> {
    const data = await AsyncStorage.getItem(QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  },

  /** Cuenta items pendientes */
  async count(): Promise<number> {
    const queue = await this.getAll();
    return queue.length;
  },

  /** Elimina un item por ID */
  async remove(id: string): Promise<void> {
    const queue = await this.getAll();
    const filtered = queue.filter((item) => item.id !== id);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
  },

  /** Incrementa contador de reintentos */
  async incrementRetries(id: string): Promise<void> {
    const queue = await this.getAll();
    const updated = queue.map((item) =>
      item.id === id ? { ...item, retries: item.retries + 1 } : item
    );
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
  },

  /** Limpia toda la cola (para debug) */
  async clear(): Promise<void> {
    await AsyncStorage.removeItem(QUEUE_KEY);
  },
  /** Vuelve a meter un item en la cola (para reintentos) */
  async requeue(item: QueuedItem): Promise<void> {
    const queue = await this.getAll();
    queue.push(item);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  },
  /** Reemplaza IDs locales por IDs remotos en todos los items pendientes */
  async replaceLocalId(localId: string, remoteId: string): Promise<void> {
    const queue = await this.getAll();
    const updated = queue.map((item) => {
      const payload = { ...item.payload };
      // Reemplaza collection_record_id si coincide
      if (payload.collection_record_id === localId) {
        payload.collection_record_id = remoteId;
      }
      return { ...item, payload };
    });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
  },
};