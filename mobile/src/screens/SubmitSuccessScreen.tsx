import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import {
  CheckCircle2,
  ScanLine,
  RotateCcw,
  ArrowRight,
  AlertTriangle,
  Check,
} from "lucide-react-native";

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
      {/* Header Limpio */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SISTEMA DE RECOLECCIÓN</Text>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={false}
      >
        {/* Icono de éxito principal */}
        <View style={styles.iconContainer}>
          <View style={styles.successIcon}>
            <CheckCircle2 size={60} color="#ffffff" strokeWidth={3} />
          </View>
        </View>

        {/* Título */}
        <Text style={styles.title}>¡Registro Exitoso!</Text>

        <Text style={styles.subtitle}>
          La información del contenedor ha sido procesada y guardada correctamente en la base de datos.
        </Text>

        {/* Resumen de Registro */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>RESUMEN DE OPERACIÓN</Text>
          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>ID Contenedor:</Text>
            <Text style={[styles.summaryValue, styles.codeText]}>
              {data.container_code}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tipo de Residuo:</Text>
            <Text style={styles.summaryValue}>{data.category_name}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Peso Neto:</Text>
            <Text
              style={[
                styles.summaryValue,
                !data.weight_recorded && styles.summaryValueEmpty,
              ]}
            >
              {data.weight_recorded
                ? `${data.weight.toFixed(2)} kg`
                : "No registrado"}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Fecha y Hora:</Text>
            <Text style={styles.summaryValue}>
              {formatDateTime(data.timestamp)}
            </Text>
          </View>

          <View style={[styles.summaryRow, styles.lastSummaryRow]}>
            <Text style={styles.summaryLabel}>Incidencia Reportada:</Text>
            <View
              style={[
                styles.incidentBadge,
                {
                  backgroundColor: data.has_incident ? "#fef2f2" : "#ecfdf5",
                  borderColor: data.has_incident ? "#fca5a5" : "#6ee7b7",
                },
              ]}
            >
              {data.has_incident ? (
                <AlertTriangle size={14} color="#dc2626" strokeWidth={3} style={{ marginRight: 4 }} />
              ) : (
                <Check size={14} color="#059669" strokeWidth={3} style={{ marginRight: 4 }} />
              )}
              <Text
                style={[
                  styles.incidentText,
                  { color: data.has_incident ? "#dc2626" : "#059669" },
                ]}
              >
                {data.has_incident ? "SÍ" : "NO"}
              </Text>
            </View>
          </View>
        </View>

        {/* Botón Nuevo Escaneo */}
        <TouchableOpacity 
          style={styles.newScanBtn} 
          onPress={onNewScan}
          activeOpacity={0.8}
        >
          <Text style={styles.newScanText}>REALIZAR NUEVO ESCANEO</Text>
          <ArrowRight size={20} color="#ffffff" strokeWidth={2.5} style={{ marginLeft: 8 }} />
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Tab Bar Consistente */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, styles.tabActive]}
          onPress={onNewScan}
          activeOpacity={1}
        >
          <ScanLine size={22} color="#ffffff" strokeWidth={2.5} />
          <Text style={styles.tabTextActive}>ESCANEAR</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={onSwitchToHistory}
          activeOpacity={0.7}
        >
          <RotateCcw size={22} color="#000000" strokeWidth={2.5} />
          <Text style={styles.tabText}>HISTORIAL</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc", // Fondo claro y moderno
  },
  header: {
    backgroundColor: "#ffffff",
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1e293b",
    letterSpacing: 1,
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    padding: 24,
    paddingTop: 40,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  successIcon: {
    width: 96,
    height: 96,
    backgroundColor: "#10b981", // Verde moderno
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#0f172a",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  summaryCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#475569",
    letterSpacing: 1,
    marginBottom: 12,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  lastSummaryRow: {
    borderBottomWidth: 0,
    paddingBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
  },
  summaryValue: {
    fontSize: 15,
    color: "#0f172a",
    fontWeight: "700",
    textAlign: "right",
    flex: 1,
    marginLeft: 12,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? "Courier" : "monospace",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: "hidden",
  },
  summaryValueEmpty: {
    color: "#94a3b8",
    fontStyle: "italic",
    fontWeight: "500",
  },
  incidentBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  incidentText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  newScanBtn: {
    backgroundColor: "#2563eb", // Azul principal
    paddingVertical: 18,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  newScanText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderTopWidth: 2,
    borderTopColor: "#000000",
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  tabActive: {
    backgroundColor: "#000000",
  },
  tabText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#000000",
    marginTop: 6,
    letterSpacing: 0.5,
  },
  tabTextActive: {
    fontSize: 10,
    fontWeight: "800",
    color: "#ffffff",
    marginTop: 6,
    letterSpacing: 0.5,
  },
});