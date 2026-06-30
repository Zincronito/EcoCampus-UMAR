/**
 * Cliente HTTP para el backend FastAPI
 * Maneja autenticacion automatica via cookies
 */

import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// Instancia de axios con configuracion base
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 segundos
});

// Interceptor: Agrega el token a cada peticion
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // En el cliente, leemos el token de las cookies
    if (typeof window !== "undefined") {
      const token = getTokenFromCookie();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor: Maneja errores globalmente
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Si hay un error 401 (no autorizado), redirigir al login
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        clearAuth();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// FUNCIONES DE AUTH (COOKIES)

const TOKEN_COOKIE_NAME = "ecocampus_token";
const USER_COOKIE_NAME = "ecocampus_user";

/**
 * Lee el token de las cookies (lado del cliente).
 */
export function getTokenFromCookie(): string | null {
  if (typeof window === "undefined") return null;

  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === TOKEN_COOKIE_NAME) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * Guarda el token en cookies (expira en 7 dias).
 */
export function setTokenCookie(token: string): void {
  if (typeof window === "undefined") return;

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 7);

  document.cookie = `${TOKEN_COOKIE_NAME}=${encodeURIComponent(token)}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
}

/**
 * Guarda los datos del usuario en cookies.
 */
export function setUserCookie(user: any): void {
  if (typeof window === "undefined") return;

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 7);

  document.cookie = `${USER_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(user))}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
}

/**
 * Lee los datos del usuario de las cookies.
 */
export function getUserFromCookie(): any | null {
  if (typeof window === "undefined") return null;

  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === USER_COOKIE_NAME) {
      try {
        return JSON.parse(decodeURIComponent(value));
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * Borra todas las cookies de autenticacion.
 */
export function clearAuth(): void {
  if (typeof window === "undefined") return;

  document.cookie = `${TOKEN_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  document.cookie = `${USER_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

// SERVICIOS (LLAMADAS AL BACKEND)
/**
 * Login: autentica al usuario y guarda el token.
 */
export async function login(employeeId: string, pin: string) {
  try {
    const response = await api.post("/auth/login", {
      employeeId: employeeId,  // ← camelCase como espera el backend
      pin: pin,
    });

    const { token, user } = response.data;  // ← El backend devuelve "token", no "access_token"

    // Validar que sea admin
    if (user.role !== "admin") {
      return {
        success: false,
        message: "Solo los administradores pueden acceder al dashboard",
      };
    }

    // Guardar token y datos del usuario
    setTokenCookie(token);
    setUserCookie(user);

    return { success: true, user };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.detail || "Error al iniciar sesion",
    };
  }
}

/**
 * Logout: borra las cookies y redirige.
 */
export function logout() {
  clearAuth();
  window.location.href = "/login";
}

/**
 * Categorias.
 */
export const categoriesAPI = {
  getAll: async (onlyActive: boolean = true) => {
    const response = await api.get(`/categories?only_active=${onlyActive}`);
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post("/categories", data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.patch(`/categories/${id}`, data);
    return response.data;
  },

  updateDensity: async (id: string, density: number) => {
    const response = await api.patch(`/categories/${id}/density`, {
      density_kg_per_liter: density,
    });
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/categories/${id}`);
  },
};

/**
 * Contenedores.
 */
/**
 * Campus.
 */
export const campusAPI = {
  getAll: async (onlyActive: boolean = true) => {
    const response = await api.get(`/campus?only_active=${onlyActive}`);
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/campus/${id}`);
    return response.data;
  },
};

/**
 * Ubicaciones.
 */
export const locationsAPI = {
  getAll: async (onlyActive: boolean = true, campusId?: string) => {
    const params = new URLSearchParams();
    params.append("only_active", String(onlyActive));
    if (campusId) {
      params.append("campus_id", campusId);
    }
    const response = await api.get(`/locations?${params.toString()}`);
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/locations/${id}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post("/locations", data);
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.patch(`/locations/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    await api.delete(`/locations/${id}`);
  },
};

/**
 * Contenedores.
 */
export const containersAPI = {
  getAll: async (onlyActive: boolean = true, locationId?: string, wasteCategoryId?: string) => {
    const params = new URLSearchParams();
    params.append("only_active", String(onlyActive));
    if (locationId) {
      params.append("location_id", locationId);
    }
    if (wasteCategoryId) {
      params.append("waste_category_id", wasteCategoryId);
    }
    const response = await api.get(`/containers?${params.toString()}`);
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/containers/${id}`);
    return response.data;
  },
  
  getByCode: async (code: string) => {
    const response = await api.get(`/containers/code/${code}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post("/containers", data);
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.patch(`/containers/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    await api.delete(`/containers/${id}`);
  },

  getNextCode: async (campusId: string) => {
    const response = await api.get(`/containers/next-code/${campusId}`);
    return response.data;
  },
};

/**
 * Reportes.
 */
export const recordsAPI = {
  getAll: async () => {
    const response = await api.get("/records");
    return response.data;
  },

  getByCollector: async (collectorId: string) => {
    const response = await api.get(`/records/collector/${collectorId}`);
    return response.data;
  },
};