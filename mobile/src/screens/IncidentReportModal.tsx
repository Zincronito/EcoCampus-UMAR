import React, { useState, useRef } from "react";
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
  Image,
  Animated,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  ArrowLeft,
  Camera,
  Mic,
  X,
  Send,
} from "lucide-react-native";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { incidentService, recordService, containerService } from "../services/authService";

interface IncidentReportModalProps {
  visible: boolean;
  containerId: string;
  collectorId: string;
  containerCode: string;
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
  onSubmitSuccess: (data: any) => void;
}

export default function IncidentReportModal({
  visible,
  containerId,
  collectorId,
  containerCode,
  formData,
  onClose,
  onSuccess,
  onSubmitSuccess,
}: IncidentReportModalProps) {
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  // Animacion del microfono
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const quickTags = [
    { id: "escombros", label: "Escombros mezclados", color: "#fff" },
    { id: "bolsas", label: "Bolsas mal cerradas", color: "#dbeafe" },
    { id: "organicos", label: "Orgánicos en plásticos", color: "#bbf7d0" },
    { id: "vidrio", label: "Vidrio roto", color: "#fecaca" },
  ];

  // Eventos del reconocimiento de voz
  useSpeechRecognitionEvent("start", () => {
    setIsListening(true);
    startPulseAnimation();
  });

  useSpeechRecognitionEvent("end", () => {
    setIsListening(false);
    stopPulseAnimation();
  });

  useSpeechRecognitionEvent("result", (event) => {
    const text = event.results[0]?.transcript;

    if (text) {
      setDescription(text);
    }
  });

  useSpeechRecognitionEvent("error", (event) => {
    console.log("Error de voz:", event.error, event.message);
    setIsListening(false);
    stopPulseAnimation();
    Alert.alert("Error", "No se pudo procesar la voz: " + event.message);
  });

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const handleVoicePress = async () => {
    if (isListening) {
      // Si esta escuchando, detener
      ExpoSpeechRecognitionModule.stop();
      return;
    }

    try {
      // Pedir permisos
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!result.granted) {
        Alert.alert(
          "Permiso denegado",
          "Necesitamos acceso al micrófono para usar voz a texto"
        );
        return;
      }

      // Iniciar reconocimiento
      ExpoSpeechRecognitionModule.start({
        lang: "es-MX",
        interimResults: true,
        continuous: true,
        requiresOnDeviceRecognition: false,
        addsPunctuation: true,
      });
    } catch (error: any) {
      console.error("Error al iniciar voz:", error);
      Alert.alert("Error", "No se pudo acceder al micrófono");
    }
  };

  const handleTakePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permiso denegado",
          "Necesitamos acceso a la cámara para tomar fotos de evidencia."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error: any) {
      console.error("Error al tomar foto:", error);
      Alert.alert("Error", "No se pudo abrir la cámara");
    }
  };

  const handleRemovePhoto = () => {
    Alert.alert(
      "Eliminar foto",
      "¿Estás seguro que quieres eliminar la foto?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => setPhotoUri(null),
        },
      ]
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

      // Obtener info del contenedor para la pantalla de exito
      const containerData = await containerService.getById(containerId);
      const categoryName = containerData?.waste_category?.name || "Sin categoria";

      const savedRecord = await recordService.create(recordPayload as any);

      const incidentPayload = {
        description: description.trim(),
        quick_tag: description,
        photo_url: photoUri || null,
        container_id: containerId,
        reported_by_id: collectorId,
        collection_record_id: savedRecord.id,
      };

      await incidentService.create(incidentPayload as any);

      // Limpiar estado
      setDescription("");
      setPhotoUri(null);
      onClose();

      // Navegar a pantalla de exito
      onSubmitSuccess({
        container_code: containerCode,
        category_name: categoryName,
        weight: formData.net_weight,
        has_incident: true,
        timestamp: new Date().toISOString(),
      });
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
            <ArrowLeft size={22} color="#1e40af" strokeWidth={2.5} style={{ marginRight: 8 }} />
            <Text style={styles.headerTitle}>Reportar Incidencia</Text>
          </TouchableOpacity>
          <Text style={styles.statusText}>EN LINEA</Text>
        </View>

        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.mainTitle}>Rellene los campos</Text>

          {/* EVIDENCIA Y REPORTE */}
          <Text style={styles.sectionTitle}>Evidencia y Reporte</Text>
          <View style={styles.evidenceRow}>
            <TouchableOpacity
              style={[styles.photoBox, photoUri && styles.photoBoxWithImage]}
              onPress={handleTakePhoto}
            >
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photoPreview} />
              ) : (
                <>
                  <Camera size={38} color="#000" strokeWidth={2} style={{ marginBottom: 6 }} />
                  <Text style={styles.evidenceLabel}>FOTO</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.voiceBox, isListening && styles.voiceBoxActive]}
              onPress={handleVoicePress}
            >
              <Animated.View style={{ transform: [{ scale: pulseAnim }], marginBottom: 6 }}>
                <Mic size={38} color="#fff" strokeWidth={2} />
              </Animated.View>
              <Text style={[styles.evidenceLabel, { color: "#fff" }]}>
                {isListening ? "ESCUCHANDO..." : "VOZ"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Boton eliminar foto */}
          {photoUri && (
            <TouchableOpacity
              style={styles.removePhotoBtn}
              onPress={handleRemovePhoto}
            >
              <X size={14} color="#dc2626" strokeWidth={2.5} style={{ marginRight: 6 }} />
              <Text style={styles.removePhotoText}>Eliminar foto</Text>
            </TouchableOpacity>
          )}

          {/* DESCRIPCION DETALLADA */}
          <Text style={styles.sectionTitle}>Descripción Detallada</Text>
          <View style={styles.textInputContainer}>
            <TextInput
              style={[
                styles.textInput,
                isListening && styles.textInputListening,
              ]}
              placeholder="Añade más detalles sobre la incidencia..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
              editable={!isListening}
            />
            {isListening && (
              <View style={styles.listeningIndicator}>
                <View style={styles.listeningDot} />
                <Text style={styles.listeningText}>Escuchando...</Text>
              </View>
            )}
          </View>

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
              <>
                <Send size={18} color="#fff" strokeWidth={2.5} style={{ marginRight: 8 }} />
                <Text style={styles.sendBtnText}>ENVIAR REPORTE</Text>
              </>
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
    overflow: "hidden",
  },
  photoBoxWithImage: {
    padding: 0,
  },
  photoPreview: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
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
  voiceBoxActive: {
    backgroundColor: "#991b1b",
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
  removePhotoBtn: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#dc2626",
    borderRadius: 4,
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  removePhotoText: {
    color: "#dc2626",
    fontSize: 12,
    fontWeight: "bold",
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
    margin: 16,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#000",
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
  textInputContainer: {
    position: "relative",
  },
  textInputListening: {
    borderColor: "#dc2626",
    borderWidth: 3,
    backgroundColor: "#fef2f2",
  },
  listeningIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dc2626",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  listeningDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
    marginRight: 6,
  },
  listeningText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
});