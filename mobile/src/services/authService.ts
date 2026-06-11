import { API_URL } from "../config";

export const authService = {
  login: async (employeeId: string, pin: string) => {
    try {
      console.log("🔐 Intentando login con fetch a:", `${API_URL}/auth/login`);
      
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

      console.log("📝 Status:", response.status);
      const data = await response.json();
      console.log("✅ Response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Error de autenticación");
      }

      return data;
    } catch (error: any) {
      console.error("❌ Error de login:", error.message);
      throw error;
    }
  },
};