import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authService } from "../services/authService";

export default function LoginScreen({ onLoginSuccess }: any) {
  const [employeeId, setEmployeeId] = useState("ADMIN-001");
  const [pin, setPin] = useState("1234");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!employeeId || !pin) {
      Alert.alert("Error", "Por favor completa todos los campos");
      return;
    }

    setLoading(true);
    try {
      const result = await authService.login(employeeId, pin);
      
      // Guardar token en AsyncStorage
      await AsyncStorage.setItem("userToken", result.token);
      await AsyncStorage.setItem("user", JSON.stringify(result.user));

      Alert.alert("Éxito", `¡Bienvenido ${result.user.fullName}!`);
      onLoginSuccess(result);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.error || "Error al iniciar sesión"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌿 EcoCampus</Text>
      <Text style={styles.subtitle}>Gestión de Residuos</Text>

      <TextInput
        style={styles.input}
        placeholder="ID de Empleado"
        value={employeeId}
        onChangeText={setEmployeeId}
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="PIN"
        value={pin}
        onChangeText={setPin}
        secureTextEntry
        editable={!loading}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Iniciar Sesión</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.hint}>Demo: ADMIN-001 / PIN: 1234</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#1a5f3d",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    color: "#666",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  button: {
    backgroundColor: "#1a5f3d",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  hint: {
    textAlign: "center",
    marginTop: 20,
    color: "#999",
    fontSize: 12,
  },
});