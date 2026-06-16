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
import { Svg, Path, G } from "react-native-svg";
import { authService } from "../services/authService";

// Logo de reciclaje (SVG)
const RecycleLogo = () => (
  <Svg width="80" height="80" viewBox="0 0 64 64">
    <G fill="#1e40af">
      <Path d="M32 4 L40 18 L24 18 Z" />
      <Path d="M52 38 L60 52 L44 52 Z" />
      <Path d="M12 38 L20 52 L4 52 Z" />
      <Path d="M28 22 L36 22 L36 30 L42 30 L32 42 L22 30 L28 30 Z" fillOpacity="0.7" />
    </G>
  </Svg>
);

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
      await AsyncStorage.setItem("userToken", result.token);
      await AsyncStorage.setItem("user", JSON.stringify(result.user));
      onLoginSuccess(result);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.outerContainer}>
      <View style={styles.card}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <RecycleLogo />
        </View>

        {/* Titulo */}
        <Text style={styles.title}>Gestion de</Text>
        <Text style={styles.title}>residuos</Text>
        <Text style={styles.subtitle}>Acceso de Empleado</Text>

        {/* ID */}
        <Text style={styles.label}>ID DE EMPLEADO</Text>
        <View style={styles.inputContainer}>
          <View style={styles.iconBox}>
            <Text style={styles.iconText}>ID</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Ingrese su ID"
            value={employeeId}
            onChangeText={setEmployeeId}
            editable={!loading}
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* PIN */}
        <Text style={styles.label}>CONTRASEÑA / PIN</Text>
        <View style={styles.inputContainer}>
          <View style={styles.iconBox}>
            <Text style={styles.iconText}>***</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Ingrese su PIN"
            value={pin}
            onChangeText={setPin}
            secureTextEntry
            editable={!loading}
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Boton ENTRAR */}
        <TouchableOpacity
          style={[styles.buttonPrimary, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>ENTRAR</Text>
          )}
        </TouchableOpacity>

        {/* Boton AYUDA */}
        <TouchableOpacity style={styles.buttonHelp}>
          <Text style={styles.buttonHelpText}>AYUDA / SOPORTE</Text>
        </TouchableOpacity>

        {/* Boton GOOGLE */}
        <TouchableOpacity style={styles.buttonGoogle}>
          <View style={styles.googleIconContainer}>
            <Text style={styles.googleG}>G</Text>
          </View>
          <Text style={styles.buttonGoogleText}>CONTINUAR CON{"\n"}GOOGLE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: "#e8e6f5",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#9ca3af",
    padding: 30,
    width: "100%",
    maxWidth: 400,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 38,
    fontWeight: "bold",
    textAlign: "center",
    color: "#000000",
    lineHeight: 42,
    fontFamily: "serif",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#6b7280",
    marginTop: 12,
    marginBottom: 30,
  },
  label: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 8,
    marginTop: 10,
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#d1d5db",
    marginBottom: 8,
  },
  iconBox: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#e5e7eb",
  },
  iconText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#6b7280",
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#000000",
  },
  buttonPrimary: {
    backgroundColor: "#1e3a8a",
    paddingVertical: 16,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1e3a8a",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  buttonHelp: {
    backgroundColor: "#15803d",
    paddingVertical: 16,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#15803d",
  },
  buttonHelpText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  buttonGoogle: {
    backgroundColor: "#ffffff",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#000000",
  },
  googleIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  googleG: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4285F4",
  },
  buttonGoogleText: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 1,
    textAlign: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});