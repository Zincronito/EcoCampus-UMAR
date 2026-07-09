import { API_URL } from "../config";

// ────────────────────────────────────────────────────────────
// AUTENTICACIÓN
// ────────────────────────────────────────────────────────────

export const authService = {
  login: async (employeeId: string, pin: string) => {
    try {
      console.log("Intentando login con fetch a:", `${API_URL}/auth/login`);

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId,
          pin,
        }),
      });

      console.log("Status:", response.status);
      const data = await response.json();
      console.log("Response:", data);

      if (!response.ok) {
        throw new Error(data.detail || "Error de autenticación");
      }

      // Guardar token en localStorage
      // Guardar token en AsyncStorage
      if (data.token) {
        try {
          const AsyncStorage = require("@react-native-async-storage/async-storage").default;
          await AsyncStorage.setItem("token", data.token);
          await AsyncStorage.setItem("user", JSON.stringify(data.user));
        } catch (e) {
          console.warn("Error al guardar en AsyncStorage:", e);
        }
      }

      return data;
    } catch (error: any) {
      console.error("Error de login:", error.message);
      throw error;
    }
  },

  getToken: () => {
    const AsyncStorage = require("@react-native-async-storage/async-storage").default;
    return AsyncStorage.getItem("token");
  },

  getUser: async (): Promise<any> => {
    const AsyncStorage = require("@react-native-async-storage/async-storage").default;
    const user = await AsyncStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },
  logout: () => {
    const AsyncStorage = require("@react-native-async-storage/async-storage").default;
    AsyncStorage.multiRemove(["token", "user"]);
  },
};

// ────────────────────────────────────────────────────────────
// CONTENEDORES
// ────────────────────────────────────────────────────────────

export const containerService = {
  getAll: async () => {
    try {
      console.log("Obteniendo contenedores...");

      const response = await fetch(`${API_URL}/containers`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Error al obtener contenedores");
      }

      const data = await response.json();
      console.log("Contenedores:", data);
      return data;
    } catch (error: any) {
      console.error("Error al obtener contenedores:", error.message);
      throw error;
    }
  },

  getById: async (containerId: string) => {
    try {
      const response = await fetch(`${API_URL}/containers/${containerId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Contenedor no encontrado");
      }

      return await response.json();
    } catch (error: any) {
      console.error("Error al obtener contenedor:", error.message);
      throw error;
    }
  },
  getByCode: async (containerCode: string) => {
  try {
    console.log("📦 Buscando contenedor por codigo:", containerCode);

    const response = await fetch(
      `${API_URL}/containers/code/${containerCode}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Contenedor "${containerCode}" no encontrado`);
      }
      throw new Error("Error al buscar contenedor");
    }

    const data = await response.json();
    console.log("Contenedor encontrado:", data);
    return data;
  } catch (error: any) {
    console.error("Error al buscar contenedor:", error.message);
    throw error;
  }
},
};

// ────────────────────────────────────────────────────────────
// REPORTES DE RECOLECCIÓN
// ────────────────────────────────────────────────────────────

export const recordService = {
  create: async (recordData: {
    gross_weight: number;
    net_weight?: number;
    fill_level: string;
    condition: string;
    separation_level: string;
    container_id: string;
    collector_id: string;
    synced_from_offline?: boolean;
    device_recorded_at?: string;
  }) => {
    try {
      console.log("Creando reporte de recolección...", recordData);

      const response = await fetch(`${API_URL}/records`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(recordData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Error al crear reporte");
      }

      const data = await response.json();
      console.log("eporte creado:", data);
      return data;
    } catch (error: any) {
      console.error("Error al crear reporte:", error.message);
      throw error;
    }
  },

  getAll: async () => {
    try {
      console.log("Obteniendo reportes...");

      const response = await fetch(`${API_URL}/records`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Error al obtener reportes");
      }

      const data = await response.json();
      console.log("Reportes:", data);
      return data;
    } catch (error: any) {
      console.error("Error al obtener reportes:", error.message);
      throw error;
    }
  },

  getByCollector: async (collectorId: string) => {
    try {
      console.log("Obteniendo reportes del recolector...");

      const response = await fetch(`${API_URL}/records/collector/${collectorId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Error al obtener reportes");
      }

      const data = await response.json();
      console.log("Reportes del recolector:", data);
      return data;
    } catch (error: any) {
      console.error("Error:", error.message);
      throw error;
    }
  },
};

// ────────────────────────────────────────────────────────────
// INCIDENTES
// ────────────────────────────────────────────────────────────

export const incidentService = {
  create: async (incidentData: {
    description: string;
    quick_tag?: string;
    photo_url?: string;
    container_id: string;
    reported_by_id: string;
    collection_record_id?: string;
  }) => {
    try {
      console.log("Reportando incidente...", incidentData);

      const response = await fetch(`${API_URL}/incidents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(incidentData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Error al reportar incidente");
      }

      const data = await response.json();
      console.log("Incidente reportado:", data);
      return data;
    } catch (error: any) {
      console.error("Error al reportar incidente:", error.message);
      throw error;
    }
  },

  getAll: async () => {
    try {
      console.log("Obteniendo incidentes...");

      const response = await fetch(`${API_URL}/incidents`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Error al obtener incidentes");
      }

      const data = await response.json();
      console.log("Incidentes:", data);
      return data;
    } catch (error: any) {
      console.error("Error al obtener incidentes:", error.message);
      throw error;
    }
  },

  getByContainer: async (containerId: string) => {
    try {
      const response = await fetch(`${API_URL}/incidents/container/${containerId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Error al obtener incidentes");
      }

      return await response.json();
    } catch (error: any) {
      console.error("Error:", error.message);
      throw error;
    }
  },

  updateStatus: async (incidentId: string, newStatus: string) => {
    try {
      const response = await fetch(`${API_URL}/incidents/${incidentId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ new_status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar incidente");
      }

      return await response.json();
    } catch (error: any) {
      console.error("Error:", error.message);
      throw error;
    }
  },
};

// UPLOAD A MINÍO
// ────────────────────────────────────────────────────────────

export const fileService = {
  uploadIncidentPhoto: async (photoUri: string) => {
    try {
      console.log("Subiendo foto a MinIO...", photoUri);

      // FORMA CORRECTA PARA REACT NATIVE
      const formData = new FormData();
      formData.append("file", {
        uri: photoUri,
        type: "image/jpeg",
        name: "incident_photo.jpg",
      } as any);

      // POST a /incidents/upload-photo
      const uploadResponse = await fetch(`${API_URL}/incidents/upload-photo`, {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.detail || "Error al subir foto");
      }

      const data = await uploadResponse.json();
      console.log("Foto subida:", data.photo_url);
      
      return data.photo_url; // URL pública de MinIO

    } catch (error: any) {
      console.error("Error al subir foto:", error.message);
      throw error;
    }
  },
};