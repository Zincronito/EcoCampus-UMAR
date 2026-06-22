import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

interface SubmitSuccessScreenProps {
  data: {
    container_code: string;
    category_name: string;
    weight: number;
    weight_recorded: boolean;
    has_incident: boolean;
    timestamp: string;
  };
  onNewScan: () => void;
  onSwitchToHistory: () => void;
}

export default function SubmitSuccessScreen({
  data,
  onNewScan,
  onSwitchToHistory,
}: SubmitSuccessScreenProps) {
  const formatDateTime = (isoDate: string) => {
    const date = new Date(isoDate);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${day}/${month}/${year} - ${hours}:${minutes}`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gestion de res...</Text>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={false}
      >
        {/* Icono de éxito */}
        <View style={styles.iconContainer}>
          <View style={styles.successIcon}>
            <Text style={styles.checkmark}>{"\u2713"}</Text>
          </View>
        </View>

        {/* Título */}
        <Text style={styles.title}>¡ENVÍO{"\n"}EXITOSO!</Text>

        <Text style={styles.subtitle}>
          La información del contenedor ha sido registrada correctamente en el
          sistema.
        </Text>

        {/* Resumen de Registro */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>RESUMEN DE REGISTRO</Text>
          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Contenedor:</Text>
            <Text style={styles.summaryValue}>{data.container_code}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Residuo:</Text>
            <Text style={styles.summaryValue}>{data.category_name}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Peso:</Text>
            <Text style={[
              styles.summaryValue,
              !data.weight_recorded && styles.summaryValueEmpty
            ]}>
              {data.weight_recorded
                ? `${data.weight.toFixed(1)} kg`
                : "No registrado"
              }
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Fecha y hora:</Text>
            <Text style={styles.summaryValue}>
              {formatDateTime(data.timestamp)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Incidencia:</Text>
            <View
              style={[
                styles.incidentBadge,
                {
                  backgroundColor: data.has_incident ? "#fef3c7" : "#dcfce7",
                  borderColor: data.has_incident ? "#f59e0b" : "#10b981",
                },
              ]}
            >
              <Text
                style={[
                  styles.incidentText,
                  { color: data.has_incident ? "#92400e" : "#166534" },
                ]}
              >
                {data.has_incident ? "\u26A0 SI" : "\u2713 NO"}
              </Text>
            </View>
          </View>
        </View>

        {/* Botón Nuevo Escaneo */}
        <TouchableOpacity style={styles.newScanBtn} onPress={onNewScan}>
          <Text style={styles.newScanText}>REALIZAR NUEVO ESCANEO</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, styles.tabActive]}
          onPress={onNewScan}
        >
          <Text style={styles.tabIconActive}>{"\u2630"}</Text>
          <Text style={styles.tabTextActive}>ESCANEAR</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={onSwitchToHistory}>
          <Text style={styles.tabIcon}>{"\u27F2"}</Text>
          <Text style={styles.tabText}>HISTORIAL</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e8e6f5",
  },
  header: {
    backgroundColor: "#ffffff",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#000",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e40af",
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    padding: 20,
    paddingTop: 30,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  successIcon: {
    width: 110,
    height: 110,
    backgroundColor: "#86efac",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#000",
  },
  checkmark: {
    fontSize: 70,
    color: "#15803d",
    fontWeight: "bold",
  },
  title: {
    fontSize: 38,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 44,
  },
  subtitle: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 19,
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#000",
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#000",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#d1d5db",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  summaryValue: {
    fontSize: 14,
    color: "#000",
    fontWeight: "500",
    textAlign: "right",
    flex: 1,
    marginLeft: 12,
  },
  incidentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  incidentText: {
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  newScanBtn: {
    backgroundColor: "#1e3a8a",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#000",
  },
  newScanText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 2,
    borderTopColor: "#000",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
  },
  tabActive: {
    backgroundColor: "#000",
  },
  tabIcon: {
    fontSize: 20,
    color: "#000",
  },
  tabIconActive: {
    fontSize: 20,
    color: "#fff",
  },
  tabText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#000",
    marginTop: 2,
    letterSpacing: 0.5,
  },
  tabTextActive: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 2,
    letterSpacing: 0.5,
  },
  summaryValueEmpty: {
    color: "#9ca3af",
    fontStyle: "italic",
  },
});