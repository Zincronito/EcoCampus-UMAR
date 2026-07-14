import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Leaf,
  ClipboardList,
  BarChart3,
  AlertTriangle,
  Camera,
  ChevronRight,
  Check,
} from "lucide-react-native";

interface User {
  id?: string;
  fullName: string;
  employeeId?: string;
  role?: string;
}

interface WelcomeScreenProps {
  user: User;
  onContinue: () => void;
}

export default function WelcomeScreen({ user, onContinue }: WelcomeScreenProps) {
  const [doNotShowAgain, setDoNotShowAgain] = useState(false);

  const handleContinue = async () => {
    if (doNotShowAgain) {
      await AsyncStorage.setItem("hideWelcomeScreen", "true");
    }
    onContinue();
  };

  const protocols = [
    {
      Icon: ClipboardList,
      iconColor: "#2563eb", // Azul profesional
      title: "Registro Obligatorio",
      description:
        "Realice el llenado obligatorio al momento de iniciar la recolección en cada sector.",
      accentColor: "#2563eb",
    },
    {
      Icon: BarChart3,
      iconColor: "#2563eb",
      title: "Datos Numéricos",
      description:
        "Asegúrese de ingresar únicamente valores numéricos en los campos de peso (kg).",
      accentColor: "#2563eb",
    },
    {
      Icon: AlertTriangle,
      iconColor: "#ef4444", // Rojo de alerta mantenido por UX
      title: "Control de Residuos",
      description:
        "En caso de detectar una mala separación en la fuente, repórtelo de inmediato en incidencias.",
      accentColor: "#ef4444",
    },
    {
      Icon: Camera,
      iconColor: "#2563eb",
      title: "Evidencia Fotográfica",
      description:
        "Es obligatorio adjuntar una fotografía clara del contenedor al registrar cualquier incidencia.",
      accentColor: "#2563eb",
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={false}
      >
        {/* Encabezado */}
        <View style={styles.headerContainer}>
          <View style={styles.logoBox}>
            <Leaf size={32} color="#2563eb" strokeWidth={2.5} />
          </View>
          <Text style={styles.title}>Bienvenido, Operador</Text>
          <Text style={styles.subtitle}>
            Prepare su equipo y siga los protocolos de seguridad y registro de EcoCampus.
          </Text>
        </View>

        {/* Tarjeta del Operador */}
        <View style={styles.operatorCard}>
          <View style={styles.operatorAvatar}>
            <Text style={styles.operatorAvatarText}>
              {user?.fullName?.charAt(0).toUpperCase() || "?"}
            </Text>
          </View>
          <View style={styles.operatorInfo}>
            <Text style={styles.operatorLabel}>OPERADOR ACTIVO</Text>
            <Text style={styles.operatorName}>
              {user?.fullName || "Sin nombre registrado"}
            </Text>
          </View>
        </View>

        {/* Lista de Protocolos */}
        <View style={styles.protocolsContainer}>
          {protocols.map((protocol, index) => {
            const IconComponent = protocol.Icon;
            return (
              <View key={index} style={styles.protocolCard}>
                <View
                  style={[
                    styles.protocolAccent,
                    { backgroundColor: protocol.accentColor },
                  ]}
                />
                <View style={styles.protocolContent}>
                  <View style={styles.protocolHeader}>
                    <View style={styles.iconWrapper}>
                      <IconComponent size={22} color={protocol.iconColor} strokeWidth={2} />
                    </View>
                    <Text style={styles.protocolTitle}>{protocol.title}</Text>
                  </View>
                  <Text style={styles.protocolDescription}>
                    {protocol.description}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Checkbox No Mostrar */}
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setDoNotShowAgain(!doNotShowAgain)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.checkbox,
              doNotShowAgain && styles.checkboxChecked,
            ]}
          >
            {doNotShowAgain && <Check size={16} color="#ffffff" strokeWidth={3} />}
          </View>
          <Text style={styles.checkboxLabel}>
            Comprendo los protocolos. No volver a mostrar.
          </Text>
        </TouchableOpacity>

        {/* Botón Principal */}
        <TouchableOpacity 
          style={styles.buttonPrimary} 
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>COMENZAR TURNO</Text>
          <ChevronRight size={20} color="#ffffff" strokeWidth={2.5} style={{ marginLeft: 8 }} />
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#eff6ff", // Fondo azul claro
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0f172a",
    textAlign: "center",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "500",
  },
  operatorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  operatorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#1e293b", // Gris oscuro corporativo
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  operatorAvatarText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
  },
  operatorInfo: {
    flex: 1,
  },
  operatorLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748b",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  operatorName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  protocolsContainer: {
    marginBottom: 8,
  },
  protocolCard: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  protocolAccent: {
    width: 5,
  },
  protocolContent: {
    flex: 1,
    padding: 16,
  },
  protocolHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  iconWrapper: {
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  protocolTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    flex: 1,
  },
  protocolDescription: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 24,
    paddingVertical: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    borderRadius: 6,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  checkboxChecked: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
  },
  buttonPrimary: {
    backgroundColor: "#2563eb", // Azul principal
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});