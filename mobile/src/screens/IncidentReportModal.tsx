import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { incidentService, recordService } from "../services/authService";

interface IncidentReportModalProps {
  visible: boolean;
  containerId: string;
  collectorId: string;
  formData: {
    gross_weight: number;
    net_weight: number;
    fill_level: string;
    physical_state: string;
    condition: string[];
    separation_level: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function IncidentReportModal({
  visible,
  containerId,
  collectorId,
  formData,
  onClose,
  onSuccess,
}: IncidentReportModalProps) {
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const quickTags = [
    { id: "escombros", label: "Escombros mezclados", color: "#fff" },
    { id: "bolsas", label: "Bolsas mal cerradas", color: "#dbeafe" },
    { id: "organicos", label: "Orgánicos en plásticos", color: "#bbf7d0" },
    { id: "vidrio", label: "Vidrio roto", color: "#fecaca" },
  ];

  const handleVoicePress = () => {
    Alert.alert(
      "Función no disponible en Expo Go",
      "El reconocimiento de voz requiere un build de producción. Por ahora, escribe la descripción a mano o usa una sugerencia rápida.",
      [{ text: "Entendido" }]
    );
  };

  const handlePhotoPress = () => {
    Alert.alert(
      "Próximamente",
      "La captura de fotos estará disponible en la siguiente versión.",
      [{ text: "Entendido" }]
    );
  };

  const handleQuickTag = (tagLabel: string) => {
    setDescription(tagLabel);
  };

  const handleSendIncident = async () => {
    if (!description.trim()) {
      Alert.alert("Error", "Escribe una descripción para la incidencia");
      return;
    }

    try {
      setSubmitting(true);

      const recordPayload = {
        gross_weight: formData.gross_weight,
        net_weight: formData.net_weight,
        fill_level: formData.fill_level,
        physical_state: formData.physical_state,
        condition: formData.condition.join(","),
        separation_level: formData.separation_level,
        container_id: containerId,
        collector_id: collectorId,
      };

      const savedRecord = await recordService.create(recordPayload as any);

      const incidentPayload = {
        description: description.trim(),
        quick_tag: description,
        photo_url: null,
        container_id: containerId,
        reported_by_id: collectorId,
        collection_record_id: savedRecord.id,
      };

      await incidentService.create(incidentPayload as any);

      Alert.alert("Éxito", "Incidencia y reporte guardados correctamente");
      setDescription("");
      onSuccess();
      onClose();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Error al guardar");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerLeft}>
            <Text style={styles.backArrow}>{"\u2190"}</Text>
            <Text style={styles.headerTitle}>Reportar Incidencia</Text>
          </TouchableOpacity>
          <Text style={styles.statusText}>EN LINEA</Text>
        </View>

        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.mainTitle}>Rellene los capos</Text>

          {/* EVIDENCIA Y REPORTE */}
          <Text style={styles.sectionTitle}>Evidencia y Reporte</Text>
          <View style={styles.evidenceRow}>
            <TouchableOpacity style={styles.photoBox} onPress={handlePhotoPress}>
              <Text style={styles.evidenceIcon}>{"\uD83D\uDCF7"}</Text>
              <Text style={styles.evidenceLabel}>FOTO</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.voiceBox} onPress={handleVoicePress}>
              <Text style={styles.evidenceIcon}>{"\uD83C\uDFA4"}</Text>
              <Text style={[styles.evidenceLabel, { color: "#fff" }]}>VOZ</Text>
            </TouchableOpacity>
          </View>

          {/* DESCRIPCION DETALLADA */}
          <Text style={styles.sectionTitle}>Descripción Detallada</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Añade más detalles sobre la incidencia..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />

          {/* SUGERENCIAS RAPIDAS */}
          <Text style={styles.sectionTitle}>Sugerencias Rápidas</Text>
          <View style={styles.tagsGrid}>
            {quickTags.map((tag) => (
              <TouchableOpacity
                key={tag.id}
                style={[
                  styles.tagBtn,
                  { backgroundColor: tag.color },
                  description === tag.label && styles.tagBtnSelected,
                ]}
                onPress={() => handleQuickTag(tag.label)}
              >
                <Text style={styles.tagLabel}>{tag.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* BOTON ENVIAR */}
          <TouchableOpacity
            style={[styles.sendBtn, submitting && styles.btnDisabled]}
            onPress={handleSendIncident}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.sendBtnText}>ENVIAR REPORTE</Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* TAB BAR */}
        <View style={styles.tabBar}>
          <TouchableOpacity style={styles.tabItem}>
            <Text style={styles.tabIcon}>{"\u2630"}</Text>
            <Text style={styles.tabText}>ESCANEAR</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem}>
            <Text style={styles.tabIcon}>{"\u27F2"}</Text>
            <Text style={styles.tabText}>HISTORIAL</Text>
          </TouchableOpacity>
        </View>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 2,
    borderBottomColor: "#000",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
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
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1e40af",
    letterSpacing: 0.5,
  },
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 10,
    marginTop: 12,
  },
  evidenceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8,
  },
  photoBox: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#000",
    borderRadius: 6,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
  },
  voiceBox: {
    flex: 1,
    backgroundColor: "#dc2626",
    borderWidth: 2,
    borderColor: "#000",
    borderRadius: 6,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
  },
  evidenceIcon: {
    fontSize: 38,
    marginBottom: 6,
  },
  evidenceLabel: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#000",
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#000",
    borderRadius: 6,
    padding: 12,
    color: "#000",
    fontSize: 13,
    textAlignVertical: "top",
    minHeight: 100,
  },
  tagsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  tagBtn: {
    width: "48%",
    borderWidth: 2,
    borderColor: "#000",
    borderRadius: 6,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 70,
  },
  tagBtnSelected: {
    borderWidth: 4,
    borderColor: "#1e40af",
  },
  tagLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
  },
  sendBtn: {
    backgroundColor: "#1e3a8a",
    padding: 16,
    borderRadius: 6,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#000",
    marginTop: 8,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  sendBtnText: {
    color: "#fff",
    fontSize: 16,
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
  tabIcon: {
    fontSize: 20,
    color: "#000",
  },
  tabText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#000",
    marginTop: 2,
    letterSpacing: 0.5,
  },
});