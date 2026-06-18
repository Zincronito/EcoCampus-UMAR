import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface WelcomeScreenProps {
  user: any;
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
      icon: "\uD83D\uDCCB",
      iconColor: "#1e40af",
      title: "Registro Obligatorio",
      description:
        "Realice el llenado obligatorio al momento de iniciar la recolección en cada sector.",
      accentColor: "#1e40af",
    },
    {
      icon: "\uD83D\uDCCA",
      iconColor: "#1e40af",
      title: "Datos Numéricos",
      description:
        "Asegúrese de ingresar únicamente valores numéricos en los campos de peso (kg).",
      accentColor: "#1e40af",
    },
    {
      icon: "\u26A0",
      iconColor: "#dc2626",
      title: "Control de Residuos",
      description:
        "En caso de detectar una mala separación en la fuente, registrelo de inmediato en el apartado de incidencias.",
      accentColor: "#dc2626",
    },
    {
      icon: "\uD83D\uDCF7",
      iconColor: "#1e40af",
      title: "Evidencia Fotográfica",
      description:
        "Es de carácter necesario adjuntar una foto de evidencia del contenedor en la sección de reportar incidencia.",
      accentColor: "#1e40af",
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Text style={styles.logoIcon}>{"\uD83C\uDF3F"}</Text>
          </View>
        </View>

        {/* Título */}
        <Text style={styles.title}>Bienvenido, Operador</Text>
        <Text style={styles.subtitle}>
          Prepare su equipo y siga los protocolos de recolección de EcoCampus
        </Text>

        {/* Protocolos */}
        {protocols.map((protocol, index) => (
          <View key={index} style={styles.protocolCard}>
            <View
              style={[
                styles.protocolAccent,
                { backgroundColor: protocol.accentColor },
              ]}
            />
            <View style={styles.protocolContent}>
              <View style={styles.protocolHeader}>
                <Text
                  style={[styles.protocolIcon, { color: protocol.iconColor }]}
                >
                  {protocol.icon}
                </Text>
                <Text style={styles.protocolTitle}>{protocol.title}</Text>
              </View>
              <Text style={styles.protocolDescription}>
                {protocol.description}
              </Text>
            </View>
          </View>
        ))}

        {/* Checkbox no mostrar */}
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setDoNotShowAgain(!doNotShowAgain)}
        >
          <View
            style={[
              styles.checkbox,
              doNotShowAgain && styles.checkboxChecked,
            ]}
          >
            {doNotShowAgain && <Text style={styles.checkmark}>{"\u2713"}</Text>}
          </View>
          <Text style={styles.checkboxLabel}>
            No volver a mostrar este mensaje
          </Text>
        </TouchableOpacity>

        {/* Operador activo */}
        <View style={styles.operatorCard}>
          <View style={styles.operatorAvatar}>
            <Text style={styles.operatorAvatarText}>
              {user?.fullName?.charAt(0).toUpperCase() || "?"}
            </Text>
          </View>
          <View style={styles.operatorInfo}>
            <Text style={styles.operatorLabel}>OPERADOR ACTIVO</Text>
            <Text style={styles.operatorName}>
              {user?.fullName || "Sin nombre"}
            </Text>
          </View>
        </View>

        {/* Botón Siguiente */}
        <TouchableOpacity style={styles.nextBtn} onPress={handleContinue}>
          <Text style={styles.nextBtnText}>Siguiente {"\u2192"}</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    padding: 20,
    paddingTop: 60,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoBox: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#93c5fd",
  },
  logoIcon: {
    fontSize: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 19,
  },
  protocolCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 14,
    overflow: "hidden",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  protocolAccent: {
    width: 4,
  },
  protocolContent: {
    flex: 1,
    padding: 14,
  },
  protocolHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  protocolIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  protocolTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    flex: 1,
  },
  protocolDescription: {
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 17,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    paddingVertical: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#9ca3af",
    borderRadius: 4,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  checkboxChecked: {
    backgroundColor: "#1e3a8a",
    borderColor: "#1e3a8a",
  },
  checkmark: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  checkboxLabel: {
    fontSize: 13,
    color: "#374151",
  },
  operatorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 14,
    marginBottom: 20,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  operatorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#10b981",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  operatorAvatarText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  operatorInfo: {
    flex: 1,
  },
  operatorLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#10b981",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  operatorName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
  nextBtn: {
    backgroundColor: "#10b981",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  nextBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
    letterSpacing: 0.3,
  },
});