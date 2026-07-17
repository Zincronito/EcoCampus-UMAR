import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Svg, Path, G } from "react-native-svg";
import { Feather } from "@expo/vector-icons";
import { authService } from "../services/authService";
import {catalogService} from "../services/catalogService";

// Interfaces para tipado estricto
interface LoginResult {
  token: string;
  user: any;
}

interface LoginScreenProps {
  onLoginSuccess: (result: LoginResult) => void;
}

// Logo de reciclaje (SVG)
const RecycleLogo = () => (
  <Svg width="70" height="70" viewBox="0 0 64 64">
    <G fill="#16a34a">
      <Path d="M32 4 L40 18 L24 18 Z" />
      <Path d="M52 38 L60 52 L44 52 Z" />
      <Path d="M12 38 L20 52 L4 52 Z" />
      <Path d="M28 22 L36 22 L36 30 L42 30 L32 42 L22 30 L28 30 Z" fillOpacity="0.8" />
    </G>
  </Svg>
);

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [employeeId, setEmployeeId] = useState("ADMIN-001");
  const [pin, setPin] = useState("1234");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!employeeId || !pin) {
      Alert.alert("Campos incompletos", "Por favor completa todos los datos para continuar.");
      return;
    }

    setLoading(true);
    try {
      const result = await authService.login(employeeId, pin);
      await AsyncStorage.setItem("userToken", result.token);
      await AsyncStorage.setItem("user", JSON.stringify(result.user));

      // Descargar catálogo (contenedores, categorías, campus) para uso offline
      console.log("📥 Descargando catálogo para uso offline...");
      const catalogResult = await catalogService.downloadAll();
      if (!catalogResult.success) {
        console.warn("⚠️ No se pudo descargar el catálogo:", catalogResult.error);
        // No bloqueamos el login si falla el catálogo, solo avisamos
      }

      onLoginSuccess(result);
    } catch (error: any) {
      Alert.alert("Acceso Denegado", error.message || "Credenciales incorrectas o problema de conexión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.outerContainer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.card}>
        {/* Encabezado */}
        <View style={styles.headerContainer}>
          <View style={styles.logoContainer}>
            <RecycleLogo />
          </View>
          <Text style={styles.title}>EcoCampus</Text>
          <Text style={styles.subtitle}>Acceso Operativo</Text>
        </View>

        {/* Campo ID */}
        <Text style={styles.label}>ID DE EMPLEADO</Text>
        <View style={styles.inputContainer}>
          <View style={styles.iconBox}>
            <Feather name="user" size={18} color="#6b7280" />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Ej. ADMIN-001"
            value={employeeId}
            onChangeText={setEmployeeId}
            editable={!loading}
            placeholderTextColor="#9ca3af"
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </View>

        {/* Campo PIN */}
        <Text style={styles.label}>PIN DE SEGURIDAD</Text>
        <View style={styles.inputContainer}>
          <View style={styles.iconBox}>
            <Feather name="lock" size={18} color="#6b7280" />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Ingrese su PIN"
            value={pin}
            onChangeText={setPin}
            secureTextEntry
            editable={!loading}
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
          />
        </View>

        {/* Botón ENTRAR */}
        <TouchableOpacity
          style={[styles.buttonPrimary, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>INICIAR SESIÓN</Text>
          )}
        </TouchableOpacity>

        {/* Botón AYUDA */}
        <TouchableOpacity style={styles.buttonHelp} activeOpacity={0.7}>
          <Feather name="help-circle" size={16} color="#4b5563" style={styles.helpIcon} />
          <Text style={styles.buttonHelpText}>Necesito ayuda con mi acceso</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: "#f3f4f6", // Un gris muy suave y moderno
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 32,
    width: "100%",
    maxWidth: 400,
    // Sistema de sombras para iOS y Android
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoContainer: {
    marginBottom: 16,
    backgroundColor: "#f0fdf4", // Fondo sutil verde detrás del logo
    padding: 16,
    borderRadius: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    color: "#111827",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    color: "#6b7280",
    marginTop: 4,
    fontWeight: "500",
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
    marginTop: 12,
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 12,
  },
  iconBox: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#e5e7eb",
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#111827",
  },
  buttonPrimary: {
    backgroundColor: "#16a34a", // Verde profesional
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    marginBottom: 16,
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  buttonHelp: {
    flexDirection: "row",
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  helpIcon: {
    marginRight: 8,
  },
  buttonHelpText: {
    color: "#4b5563",
    fontSize: 14,
    fontWeight: "500",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});