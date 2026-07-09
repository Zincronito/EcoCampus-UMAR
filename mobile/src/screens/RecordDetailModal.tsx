import React from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

interface RecordDetailModalProps {
  visible: boolean;
  record: any;
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
  console.log("RECORD COMPLETO:", JSON.stringify(record, null, 2));
  console.log("NET_WEIGHT:", record.net_weight);
  console.log("IS_WEIGHT_ESTIMATED:", record.is_weight_estimated);

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
      "3": "Nivel 3 - Critico",
    };
    return labels[level] || level;
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerLeft}>
            <Text style={styles.backArrow}>{"\u2190"}</Text>
            <Text style={styles.headerTitle}>Detalle del Reporte</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* INFORMACION GENERAL */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>INFORMACION GENERAL</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.label}>Contenedor:</Text>
                <Text style={styles.value}>
                  {record.container?.container_code || "N/A"}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Categoria:</Text>
                <Text style={styles.value}>
                  {record.category?.name || "N/A"}
                </Text>
              </View>
              {record.location && (
                <>
                  <View style={styles.row}>
                    <Text style={styles.label}>Ubicacion:</Text>
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
                </>
              )}
              <View style={styles.row}>
                <Text style={styles.label}>Fecha:</Text>
                <Text style={styles.value}>
                  {formatFullDate(record.created_at)}
                </Text>
              </View>
            </View>
          </View>

          {/* MEDICIONES */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MEDICIONES</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.label}>Peso bruto:</Text>
                <Text style={[
                  styles.value,
                  record.gross_weight === null && styles.valueEmpty
                ]}>
                  {record.gross_weight !== null
                    ? `${record.gross_weight.toFixed(1)} kg`
                    : "No registrado"
                  }
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Peso neto:</Text>
                <View style={styles.weightContainer}>
                  <Text style={[
                    styles.value,
                    !record.net_weight && styles.valueEmpty
                  ]}>
                    {record.net_weight ? `${record.net_weight.toFixed(2)} kg` : "No registrado"}
                  </Text>
                  {record.is_weight_estimated && (
                    <Text style={styles.badgeEstimated}>Estimado</Text>
                  )}
                </View>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Tara:</Text>
                <Text style={styles.value}>
                  {record.container?.tare_weight.toFixed(1) || "N/A"} kg
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Nivel de llenado:</Text>
                <Text style={styles.value}>
                  {getFillLevelLabel(record.fill_level)}
                </Text>
              </View>
            </View>
          </View>

          {/* ESTADO DEL CONTENEDOR */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ESTADO DEL CONTENEDOR</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.label}>Estado fisico:</Text>
                <Text style={styles.value}>
                  {getPhysicalStateLabel(record.physical_state)}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Condiciones:</Text>
                <Text style={styles.value}>
                  {getConditionLabel(record.condition)}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Separacion:</Text>
                <Text style={styles.value}>
                  {getSeparationLabel(record.separation_level)}
                </Text>
              </View>
            </View>
          </View>

          {/* INCIDENCIA (si aplica) */}
          {record.incident && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {"\u26A0"} INCIDENCIA REPORTADA
              </Text>
              <View style={[styles.card, styles.incidentCard]}>
                <View style={styles.row}>
                  <Text style={styles.label}>Descripcion:</Text>
                  <Text style={styles.value}>
                    {record.incident.description}
                  </Text>
                </View>
                {record.incident.quick_tag && (
                  <View style={styles.row}>
                    <Text style={styles.label}>Tipo:</Text>
                    <Text style={styles.value}>{record.incident.quick_tag}</Text>
                  </View>
                )}
                <View style={styles.row}>
                  <Text style={styles.label}>Estado:</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          record.incident.status === "open"
                            ? "#ef4444"
                            : record.incident.status === "in_progress"
                              ? "#f59e0b"
                              : "#10b981",
                      },
                    ]}
                  >
                    <Text style={styles.statusText}>
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
          )}

          <View style={{ height: 30 }} />
        </ScrollView>

        {/* Boton cerrar */}
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>CERRAR</Text>
        </TouchableOpacity>
      </View>
    </Modal>
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
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  backArrow: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e40af",
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e40af",
  },
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#000",
    borderRadius: 6,
    padding: 14,
  },
  incidentCard: {
    backgroundColor: "#fef3c7",
    borderColor: "#f59e0b",
  },
  row: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  label: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "600",
    width: 130,
  },
  value: {
    fontSize: 13,
    color: "#000",
    fontWeight: "500",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 0.5,
  },
  closeBtn: {
    backgroundColor: "#1e3a8a",
    padding: 16,
    margin: 16,
    borderRadius: 6,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#000",
  },
  closeBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  valueEmpty: {
    color: "#9ca3af",
    fontStyle: "italic",
  },
  weightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flex:1,
  },
  badgeEstimated: {
    backgroundColor: '#fbbf24',
    color: '#92400e',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 8,  // ← Cambiar gap por marginLeft
  }
});