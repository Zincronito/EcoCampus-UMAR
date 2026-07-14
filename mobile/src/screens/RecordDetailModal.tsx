import React from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { ArrowLeft, AlertTriangle } from "lucide-react-native";

interface Record {
  created_at: string;
  gross_weight: number | null;
  net_weight: number | null;
  is_weight_estimated: boolean;
  fill_level: string;
  physical_state: string;
  condition: string;
  separation_level: string;
  container?: {
    container_code: string;
    tare_weight: number;
  } | null;
  category?: {
    name: string;
  } | null;
  location?: {
    name: string;
    sector: string;
    campus: string;
  } | null;
  incident?: {
    description: string;
    quick_tag: string;
    status: string;
  } | null;
}

interface RecordDetailModalProps {
  visible: boolean;
  record: Record | null;
  onClose: () => void;
}

export default function RecordDetailModal({
  visible,
  record,
  onClose,
}: RecordDetailModalProps) {
  if (!record) return null;

  const formatFullDate = (isoDate: string) => {
    const date = new Date(isoDate);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${day}/${month}/${year} - ${hours}:${minutes}`;
  };

  const getFillLevelLabel = (level: string) => {
    const levelMap: { [key: string]: string } = {
      "empty": "0 (Vacío)",
      "quarter": "1 (<25%)",
      "half": "2 (50%)",
      "three_quarter": "3 (75%)",
      "full": "4 (>75%)",
      "overflow": "5 (Desbordado)",
      "0": "0 (Vacío)",
      "1": "1 (<25%)",
      "2": "2 (50%)",
      "3": "3 (75%)",
      "4": "4 (>75%)",
      "5": "5 (Desbordado)",
    };
    return levelMap[level] || level;
  };

  const getPhysicalStateLabel = (state: string) => {
    if (!state) return "N/A";
    const labels: { [key: string]: string } = {
      buen_estado: "Buen estado",
      tapa_rota: "Tapa rota",
      contenedor_roto: "Contenedor roto",
    };
    return state
      .split(",")
      .map((s) => labels[s.trim()] || s)
      .join(", ");
  };

  const getConditionLabel = (condition: string) => {
    if (!condition) return "N/A";
    const labels: { [key: string]: string } = {
      tapado: "Tapado",
      destapado: "Destapado",
      fauna: "Presencia de fauna nociva",
      huele_mal: "Huele mal",
      desbordado: "Desbordado",
    };
    return condition
      .split(",")
      .map((c) => labels[c.trim()] || c)
      .join(", ");
  };

  const getSeparationLabel = (level: string) => {
    const labels: { [key: string]: string } = {
      "0": "Nivel 0 - Excelente",
      "1": "Nivel 1 - Aceptable",
      "2": "Nivel 2 - Deficiente",
      "3": "Nivel 3 - Crítico",
    };
    return labels[level] || level;
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.iconButton} activeOpacity={0.7}>
            <ArrowLeft size={24} color="#1e293b" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalle del Reporte</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>INFORMACIÓN GENERAL</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.label}>Contenedor:</Text>
                <Text style={[styles.value, styles.codeText]}>
                  {record.container?.container_code ? record.container.container_code : "N/A"}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Categoría:</Text>
                <Text style={styles.value}>
                  {record.category?.name ? record.category.name : "N/A"}
                </Text>
              </View>
              
              {record.location ? (
                <View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Ubicación:</Text>
                    <Text style={styles.value}>{record.location.name}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Sector:</Text>
                    <Text style={styles.value}>{record.location.sector}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Campus:</Text>
                    <Text style={styles.value}>{record.location.campus}</Text>
                  </View>
                </View>
              ) : null}

              <View style={[styles.row, styles.lastRow]}>
                <Text style={styles.label}>Fecha:</Text>
                <Text style={styles.value}>
                  {record.created_at ? formatFullDate(record.created_at) : "N/A"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MEDICIONES REGISTRADAS</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.label}>Peso bruto:</Text>
                <Text style={[styles.value, record.gross_weight === null ? styles.valueEmpty : {}]}>
                  {record.gross_weight !== null ? `${record.gross_weight.toFixed(2)} kg` : "No registrado"}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Peso neto:</Text>
                <View style={styles.weightContainer}>
                  <Text style={[styles.value, record.net_weight === null ? styles.valueEmpty : {}]}>
                    {record.net_weight !== null ? `${record.net_weight.toFixed(2)} kg` : "No registrado"}
                  </Text>
                  {record.is_weight_estimated ? (
                    <Text style={styles.badgeEstimated}>Estimado</Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Tara contenedor:</Text>
                <Text style={styles.value}>
                  {record.container?.tare_weight ? `${record.container.tare_weight.toFixed(2)} kg` : "N/A"}
                </Text>
              </View>
              <View style={[styles.row, styles.lastRow]}>
                <Text style={styles.label}>Nivel de llenado:</Text>
                <Text style={styles.value}>
                  {record.fill_level ? getFillLevelLabel(record.fill_level) : "N/A"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ESTADO OPERATIVO</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.label}>Estado físico:</Text>
                <Text style={styles.value}>
                  {getPhysicalStateLabel(record.physical_state)}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Condiciones entorno:</Text>
                <Text style={styles.value}>
                  {getConditionLabel(record.condition)}
                </Text>
              </View>
              <View style={[styles.row, styles.lastRow]}>
                <Text style={styles.label}>Separación en fuente:</Text>
                <Text style={styles.value}>
                  {getSeparationLabel(record.separation_level)}
                </Text>
              </View>
            </View>
          </View>

          {record.incident ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: "#dc2626" }]}>
                INCIDENCIA REPORTADA
              </Text>
              <View style={[styles.card, styles.incidentCard]}>
                <View style={styles.incidentHeader}>
                  <AlertTriangle size={18} color="#dc2626" strokeWidth={2.5} style={{ marginRight: 8 }} />
                  <Text style={styles.incidentTitle}>Detalle del Problema</Text>
                </View>
                
                <View style={styles.row}>
                  <Text style={styles.label}>Descripción:</Text>
                  <Text style={styles.value}>
                    {record.incident.description ? record.incident.description : "Sin descripción"}
                  </Text>
                </View>
                
                {record.incident.quick_tag ? (
                  <View style={styles.row}>
                    <Text style={styles.label}>Etiqueta rápida:</Text>
                    <Text style={styles.value}>{record.incident.quick_tag}</Text>
                  </View>
                ) : null}
                
                <View style={[styles.row, styles.lastRow]}>
                  <Text style={styles.label}>Estado del ticket:</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          record.incident.status === "open"
                            ? "#fee2e2"
                            : record.incident.status === "in_progress"
                            ? "#fef3c7"
                            : "#dcfce7",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            record.incident.status === "open"
                              ? "#dc2626"
                              : record.incident.status === "in_progress"
                              ? "#d97706"
                              : "#16a34a",
                        },
                      ]}
                    >
                      {record.incident.status === "open"
                        ? "ABIERTA"
                        : record.incident.status === "in_progress"
                        ? "EN PROCESO"
                        : "RESUELTA"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ) : null}

          <View style={{ height: 40 }} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.closeBtnText}>CERRAR DETALLE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    backgroundColor: "#ffffff",
    paddingTop: Platform.OS === "ios" ? 50 : 40,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  iconButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1e293b",
    flex: 1,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  scrollContent: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748b",
    marginBottom: 8,
    letterSpacing: 1,
    marginLeft: 4,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  incidentCard: {
    backgroundColor: "#fff1f2",
    borderColor: "#fecdd3",
  },
  incidentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#fecdd3",
  },
  incidentTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#be123c",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  lastRow: {
    borderBottomWidth: 0,
    paddingBottom: 4,
  },
  label: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: "#0f172a",
    fontWeight: "600",
    flex: 1.5,
    textAlign: "right",
  },
  codeText: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: "hidden",
  },
  valueEmpty: {
    color: "#94a3b8",
    fontStyle: "italic",
    fontWeight: "500",
  },
  weightContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    flex: 1.5,
  },
  badgeEstimated: {
    backgroundColor: "#fef3c7",
    color: "#d97706",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 10,
    fontWeight: "800",
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  footer: {
    backgroundColor: "#ffffff",
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  closeBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  closeBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 1,
  },
});