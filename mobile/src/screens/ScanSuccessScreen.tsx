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
  ArrowLeft,
  CheckCircle2,
  Trash2,
  ScanLine,
  RotateCcw,
  ChevronRight,
} from "lucide-react-native";

// Interfaz de tipado estricto intacta
interface ScanSuccessScreenProps {
  container: {
    id: string;
    container_code: string;
    tare_weight: number;
    volume_liters: number;
    status: string;
    waste_category?: {
      name: string;
      color: string;
    };
    location?: {
      name: string;
      sector: string;
      campus: {
        id?: string;
        name: string;
        code: string;
      };
    };
  };
  onContinue: () => void;
  onCancel: () => void;
  onSwitchToHistory: () => void;
}

export default function ScanSuccessScreen({
  container,
  onContinue,
  onCancel,
  onSwitchToHistory,
}: ScanSuccessScreenProps) {
  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      active: "OPERATIVO",
      inactive: "INACTIVO",
      maintenance: "MANTENIMIENTO",
    };
    return labels[status] || status.toUpperCase();
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      active: "#dcfce7", // Verde muy suave
      inactive: "#fee2e2", // Rojo muy suave
      maintenance: "#fef3c7", // Amarillo/Ambar muy suave
    };
    return colors[status] || "#f3f4f6";
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.iconButton}>
          <ArrowLeft size={24} color="#1e293b" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>EcoCampus UMAR</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={false}
      >
        {/* Icono de éxito */}
        <View style={styles.iconContainer}>
          <View style={styles.successIcon}>
            <CheckCircle2 size={64} color="#ffffff" strokeWidth={2.5} />
          </View>
        </View>

        {/* Título */}
        <Text style={styles.title}>¡Escaneo Exitoso!</Text>

        {/* Card de contenedor detectado */}
        <View style={styles.containerCard}>
          <View style={styles.cardHeader}>
            <Trash2 size={22} color="#1e3a8a" strokeWidth={2.5} style={{ marginRight: 8 }} />
            <Text style={styles.cardTitle}>Datos del Contenedor</Text>
          </View>

          <View style={styles.cardDivider} />

          {/* Datos del contenedor */}
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>UBICACIÓN</Text>
            <Text style={styles.dataValue} numberOfLines={1}>
              {container.location?.name || "N/A"}
            </Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>SECTOR</Text>
            <Text style={styles.dataValue} numberOfLines={1}>
              {container.location?.sector || "N/A"}
            </Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>CAMPUS</Text>
            <Text style={styles.dataValue} numberOfLines={1}>
              {container.location?.campus?.name || "N/A"}
            </Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>TIPO DE RESIDUO</Text>
            <View style={styles.categoryRow}>
              <View
                style={[
                  styles.colorDot,
                  { backgroundColor: container.waste_category?.color || "#808080" },
                ]}
              />
              <Text style={styles.dataValue}>
                {container.waste_category?.name || "N/A"}
              </Text>
            </View>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>ESTADO ACTUAL</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(container.status) },
              ]}
            >
              <Text style={styles.statusText}>
                {getStatusLabel(container.status)}
              </Text>
            </View>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>PESO EN VACÍO (TARA)</Text>
            <Text style={styles.dataValue}>
              {container.tare_weight.toFixed(1)} kg
            </Text>
          </View>

          <View style={[styles.dataRow, styles.lastDataRow]}>
            <Text style={styles.dataLabel}>ID INTERNO</Text>
            <Text style={[styles.dataValue, styles.codeText]}>
              {container.container_code}
            </Text>
          </View>
        </View>

        <Text style={styles.infoMessage}>
          El contenedor ha sido identificado correctamente y está listo para recibir tu reporte de recolección.
        </Text>

        {/* Botones */}
        <TouchableOpacity style={styles.continueBtn} onPress={onContinue} activeOpacity={0.8}>
          <Text style={styles.continueBtnText}>CONTINUAR</Text>
          <ChevronRight size={20} color="#ffffff" strokeWidth={2.5} style={{ marginLeft: 6 }} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
          <Text style={styles.cancelBtnText}>CANCELAR OPERACIÓN</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Tab Bar conservando tu diseño exacto */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tabItem, styles.tabActive]} activeOpacity={1}>
          <ScanLine size={22} color="#ffffff" strokeWidth={2.5} />
          <Text style={styles.tabTextActive}>ESCANEAR</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={onSwitchToHistory} activeOpacity={0.7}>
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
    backgroundColor: "#f8fafc", // Fondo blanquito/gris claro
  },
  header: {
    backgroundColor: "#ffffff",
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3, // Sombra sutil en lugar de borde negro
  },
  iconButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18, // Letra más grande
    fontWeight: "800",
    color: "#0f172a",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    padding: 20,
    paddingTop: 32,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  successIcon: {
    width: 90,
    height: 90,
    backgroundColor: "#22c55e",
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    // Se eliminó el borde negro
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#000000",
    textAlign: "center",
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  containerCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0", // Borde gris muy sutil
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#000000",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginBottom: 8,
  },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  lastDataRow: {
    borderBottomWidth: 0,
    paddingBottom: 4,
  },
  dataLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6b7280",
    letterSpacing: 0.8,
    flex: 1,
  },
  dataValue: {
    fontSize: 14,
    color: "#000000",
    fontWeight: "700",
    textAlign: "right",
    flex: 1.5,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? "Courier" : "monospace",
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    flex: 1.5,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: "#000000",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#000000",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#000000",
    letterSpacing: 0.5,
  },
  infoMessage: {
    fontSize: 14,
    color: "#4b5563",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
    paddingHorizontal: 12,
    fontWeight: "500",
  },
  continueBtn: {
    backgroundColor: "#2563eb", // Azul moderno del escáner
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  continueBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 1,
  },
  cancelBtn: {
    backgroundColor: "#f1f5f9", // Gris muy clarito
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cancelBtnText: {
    color: "#475569", // Texto gris oscuro elegante
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderTopWidth: 2,
    borderTopColor: "#000000",
    paddingBottom: Platform.OS === 'ios' ? 20 : 0, // Ajuste para el safe area de iOS
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