import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { API_URL } from '../config';

const CATALOG_KEYS = {
  containers: 'catalog_containers',
  categories: 'catalog_categories',
  campuses: 'catalog_campuses',
  locations: 'catalog_locations',
  lastSync: 'catalog_last_sync',
};

/** Obtiene el token */
async function getAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem('token');
}

/** Helper para hacer requests */
async function apiGet(endpoint: string): Promise<any> {
  const token = await getAuthToken();
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export const catalogService = {
  /** Descarga TODOS los catálogos y los guarda en local */
  async downloadAll(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📥 Descargando catálogo completo...');

      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        return { success: false, error: 'Sin conexión' };
      }

      // Descarga en paralelo (más rápido)
      const [containers, categories, campuses, locations] = await Promise.all([
        apiGet('/containers'),
        apiGet('/categories?only_active=true'),
        apiGet('/campus?only_active=true'),
        apiGet('/locations?only_active=true'),
      ]);

      // Guarda en AsyncStorage
      await AsyncStorage.multiSet([
        [CATALOG_KEYS.containers, JSON.stringify(containers)],
        [CATALOG_KEYS.categories, JSON.stringify(categories)],
        [CATALOG_KEYS.campuses, JSON.stringify(campuses)],
        [CATALOG_KEYS.locations, JSON.stringify(locations)],
        [CATALOG_KEYS.lastSync, new Date().toISOString()],
      ]);

      console.log(
        `✅ Catálogo descargado: ${containers.length} contenedores, ${categories.length} categorías, ${campuses.length} campus, ${locations.length} ubicaciones`
      );

      return { success: true };
    } catch (error: any) {
      console.error('❌ Error descargando catálogo:', error.message);
      return { success: false, error: error.message };
    }
  },

  /** Obtiene todos los contenedores desde caché local */
  async getContainers(): Promise<any[]> {
    const data = await AsyncStorage.getItem(CATALOG_KEYS.containers);
    return data ? JSON.parse(data) : [];
  },

  /** Busca un contenedor por su código en caché local */
  async findContainerByCode(code: string): Promise<any | null> {
    const containers = await this.getContainers();
    return containers.find((c: any) => c.container_code === code) || null;
  },

  /** Busca un contenedor por ID en caché local */
  async findContainerById(id: string): Promise<any | null> {
    const containers = await this.getContainers();
    return containers.find((c: any) => c.id === id) || null;
  },

  /** Obtiene todas las categorías */
  async getCategories(): Promise<any[]> {
    const data = await AsyncStorage.getItem(CATALOG_KEYS.categories);
    return data ? JSON.parse(data) : [];
  },

  /** Obtiene todos los campus */
  async getCampuses(): Promise<any[]> {
    const data = await AsyncStorage.getItem(CATALOG_KEYS.campuses);
    return data ? JSON.parse(data) : [];
  },

  /** Obtiene todas las ubicaciones */
  async getLocations(): Promise<any[]> {
    const data = await AsyncStorage.getItem(CATALOG_KEYS.locations);
    return data ? JSON.parse(data) : [];
  },

  /** Obtiene la fecha de última sincronización */
  async getLastSync(): Promise<Date | null> {
    const data = await AsyncStorage.getItem(CATALOG_KEYS.lastSync);
    return data ? new Date(data) : null;
  },

  /** Verifica si el catálogo está vacío (necesita primera descarga) */
  async isEmpty(): Promise<boolean> {
    const containers = await this.getContainers();
    return containers.length === 0;
  },

  /** Limpia todo el catálogo (útil al hacer logout) */
  async clear(): Promise<void> {
    await AsyncStorage.multiRemove([
      CATALOG_KEYS.containers,
      CATALOG_KEYS.categories,
      CATALOG_KEYS.campuses,
      CATALOG_KEYS.locations,
      CATALOG_KEYS.lastSync,
    ]);
    console.log('🗑️ Catálogo local limpiado');
  },
};