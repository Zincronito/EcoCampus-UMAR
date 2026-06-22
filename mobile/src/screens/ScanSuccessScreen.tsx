import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import {
  Menu,
  User,
  CheckCircle2,
  Trash2,
  ScanLine,
  RotateCcw,
  ChevronRight,
} from "lucide-react-native";

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
      campus: string;
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
      active: "#dcfce7",
      inactive: "#fee2e2",
      maintenance: "#fef3c7",
    };
    return colors[status] || "#f3f4f6";
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel}>
          <Menu size={24} color="#000" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>EcoCampus UMAR</Text>
        <User size={24} color="#000" strokeWidth={2.5} />
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={false}
      >
        {/* Icono de éxito */}
        <View style={styles.iconContainer}>
          <View style={styles.successIcon}>
            <CheckCircle2 size={80} color="#fff" strokeWidth={2.5} />
          </View>
        </View>

        {/* Título */}
        <Text style={styles.title}>¡Escaneo Exitoso!</Text>

        {/* Card de contenedor detectado */}
        <View style={styles.containerCard}>
          <View style={styles.cardHeader}>
            <Trash2 size={22} color="#1e40af" strokeWidth={2} style={{ marginRight: 8 }} />
            <Text style={styles.cardTitle}>Contenedor Detectado</Text>
          </View>

          <View style={styles.cardDivider} />

          {/* Datos del contenedor */}
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>UBICACIÓN</Text>
            <Text style={styles.dataValue}>
              {container.location?.name || "N/A"}
            </Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>SECTOR</Text>
            <Text style={styles.dataValue}>
              {container.location?.sector || "N/A"}
            </Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>CAMPUS</Text>
            <Text style={styles.dataValue}>
              {container.location?.campus || "N/A"}
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
            <Text style={styles.dataLabel}>ESTADO</Text>
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
            <Text style={styles.dataLabel}>PESO EN VACÍO</Text>
            <Text style={styles.dataValue}>
              {container.tare_weight.toFixed(1)} kg
            </Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>ID</Text>
            <Text style={[styles.dataValue, styles.codeText]}>
              {container.container_code}
            </Text>
          </View>
        </View>

        <Text style={styles.infoMessage}>
          El contenedor está listo para recibir tu reporte. Por favor, asegúrate
          de cerrar la tapa al finalizar.
        </Text>

        {/* Botones */}
        <TouchableOpacity style={styles.continueBtn} onPress={onContinue}>
          <Text style={styles.continueBtnText}>CONTINUAR</Text>
          <ChevronRight size={20} color="#fff" strokeWidth={2.5} style={{ marginLeft: 6 }} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelBtnText}>CANCELAR</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tabItem, styles.tabActive]}>
          <ScanLine size={20} color="#fff" strokeWidth={2.5} />
          <Text style={styles.tabTextActive}>ESCANEAR</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={onSwitchToHistory}>
          <RotateCcw size={20} color="#000" strokeWidth={2.5} />
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 2,
    borderBottomColor: "#000",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    flex: 1,
    textAlign: "center",
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
    marginBottom: 16,
  },
  successIcon: {
    width: 110,
    height: 110,
    backgroundColor: "#22c55e",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#000",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
    marginBottom: 24,
  },
  containerCard: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#000",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#d1d5db",
    marginBottom: 12,
  },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  dataLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#6b7280",
    letterSpacing: 0.5,
    flex: 1,
  },
  dataValue: {
    fontSize: 14,
    color: "#000",
    fontWeight: "600",
    textAlign: "right",
  },
  codeText: {
    fontFamily: "monospace",
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#000",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#000",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#000",
    letterSpacing: 0.5,
  },
  infoMessage: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 19,
    paddingHorizontal: 10,
  },
  continueBtn: {
    backgroundColor: "#1e3a8a",
    padding: 16,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#000",
    marginBottom: 10,
  },
  continueBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  cancelBtn: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#000",
  },
  cancelBtnText: {
    color: "#000",
    fontSize: 14,
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
    justifyContent: "center",
    paddingVertical: 12,
  },
  tabActive: {
    backgroundColor: "#000",
  },
  tabText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#000",
    marginTop: 4,
    letterSpacing: 0.5,
  },
  tabTextActive: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 4,
    letterSpacing: 0.5,
  },
});