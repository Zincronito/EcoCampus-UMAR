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
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  ArrowLeft,
  Camera,
  Mic,
  X,
  Send,
  ScanLine,
  RotateCcw,
} from "lucide-react-native";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { incidentService, recordService, containerService, fileService } from "../services/authService";

interface IncidentReportModalProps {
  visible: boolean;
  containerId: string;
  collectorId: string;
  containerCode: string;
  categoryName: string;
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
  categoryName,
  formData,
  onClose,
  onSuccess,
  onSubmitSuccess,
}: IncidentReportModalProps) {
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  // Animación del micrófono
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const quickTags = [
    { id: "escombros", label: "Escombros mezclados", color: "#f1f5f9" },
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
          toValue: 1.15,
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
      ExpoSpeechRecognitionModule.stop();
      return;
    }

    try {
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!result.granted) {
        Alert.alert(
          "Permiso denegado",
          "Necesitamos acceso al micrófono para usar voz a texto"
        );
        return;
      }

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
      Alert.alert("Dato requerido", "Por favor escribe una descripción para la incidencia.");
      return;
    }

    try {
      setSubmitting(true);

      let photoUrl: string | null = null;
      if (photoUri) {
        try {
          photoUrl = await fileService.uploadIncidentPhoto(photoUri);
        } catch (photoError: any) {
          Alert.alert("Error", "No se pudo subir la foto: " + photoError.message);
          setSubmitting(false);
          return;
        }
      }

      const recordPayload = {
        gross_weight: formData.gross_weight > 0 ? formData.gross_weight : null,
        net_weight: formData.net_weight > 0 ? formData.net_weight : null,
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
        photo_url: photoUrl,
        container_id: containerId,
        reported_by_id: collectorId,
        collection_record_id: savedRecord.id,
      };

      await incidentService.create(incidentPayload as any);

      setDescription("");
      setPhotoUri(null);
      onClose();

      onSubmitSuccess({
        container_code: containerCode,
        category_name: categoryName,
        weight: formData.net_weight,
        weight_recorded: formData.gross_weight > 0,
        has_incident: true,
        photo_url: photoUrl,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      Alert.alert("Error", error.message || "Error al guardar el reporte");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header Moderno */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerLeft} activeOpacity={0.7}>
            <ArrowLeft size={24} color="#1e293b" strokeWidth={2.5} style={{ marginRight: 8 }} />
            <Text style={styles.headerTitle}>Reportar Incidencia</Text>
          </TouchableOpacity>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>EN LÍNEA</Text>
          </View>
        </View>

        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.mainTitle}>Rellene los campos requeridos</Text>

          {/* EVIDENCIA Y REPORTE */}
          <Text style={styles.sectionTitle}>EVIDENCIA VISUAL Y AUDIO</Text>
          <View style={styles.evidenceRow}>
            <TouchableOpacity
              style={[styles.photoBox, photoUri && styles.photoBoxWithImage]}
              onPress={handleTakePhoto}
              activeOpacity={0.8}
            >
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photoPreview} />
              ) : (
                <>
                  <Camera size={34} color="#64748b" strokeWidth={2} style={{ marginBottom: 8 }} />
                  <Text style={styles.evidenceLabel}>TOMAR FOTO</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.voiceBox, isListening && styles.voiceBoxActive]}
              onPress={handleVoicePress}
              activeOpacity={0.8}
            >
              <Animated.View style={{ transform: [{ scale: pulseAnim }], marginBottom: 8 }}>
                <Mic size={34} color="#ffffff" strokeWidth={2.5} />
              </Animated.View>
              <Text style={styles.voiceLabel}>
                {isListening ? "ESCUCHANDO..." : "DICTAR POR VOZ"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Botón eliminar foto */}
          {photoUri && (
            <TouchableOpacity
              style={styles.removePhotoBtn}
              onPress={handleRemovePhoto}
              activeOpacity={0.7}
            >
              <X size={14} color="#dc2626" strokeWidth={3} style={{ marginRight: 6 }} />
              <Text style={styles.removePhotoText}>Eliminar fotografía</Text>
            </TouchableOpacity>
          )}

          {/* DESCRIPCION DETALLADA */}
          <Text style={styles.sectionTitle}>DESCRIPCIÓN DETALLADA</Text>
          <View style={styles.textInputContainer}>
            <TextInput
              style={[
                styles.textInput,
                isListening && styles.textInputListening,
              ]}
              placeholder="Escriba o dicte los detalles de la incidencia..."
              placeholderTextColor="#94a3b8"
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

          {/* SUGERENCIAS RÁPIDAS */}
          <Text style={styles.sectionTitle}>ETIQUETAS RÁPIDAS</Text>
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
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.tagLabel,
                  description === tag.label && styles.tagLabelSelected
                ]}>
                  {tag.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* BOTON ENVIAR */}
          <TouchableOpacity
            style={[styles.sendBtn, submitting && styles.btnDisabled]}
            onPress={handleSendIncident}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Send size={18} color="#ffffff" strokeWidth={2.5} style={{ marginRight: 8 }} />
                <Text style={styles.sendBtnText}>ENVIAR REPORTE</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>

        
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc", // Fondo limpio
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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1e293b",
    letterSpacing: 0.5,
  },
  statusBadge: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#2563eb",
    letterSpacing: 0.5,
  },
  scrollContent: {
    flex: 1,
    padding: 24,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748b",
    marginBottom: 12,
    letterSpacing: 1,
  },
  evidenceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 12,
  },
  photoBox: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#cbd5e1",
    borderStyle: "dashed", // Borde punteado moderno para carga de imágenes
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    height: 140,
    overflow: "hidden",
  },
  photoBoxWithImage: {
    borderStyle: "solid",
    borderColor: "#e2e8f0",
    borderWidth: 1,
    padding: 0,
  },
  photoPreview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  voiceBox: {
    flex: 1,
    backgroundColor: "#ef4444", // Rojo moderno
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 130,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  voiceBoxActive: {
    backgroundColor: "#b91c1c", // Rojo más oscuro cuando escucha
  },
  evidenceLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748b",
    letterSpacing: 0.5,
  },
  voiceLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  removePhotoBtn: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    alignSelf: "flex-start",
    paddingHorizontal: 16,
  },
  removePhotoText: {
    color: "#dc2626",
    fontSize: 13,
    fontWeight: "700",
  },
  textInputContainer: {
    position: "relative",
    marginBottom: 24,
  },
  textInput: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    padding: 16,
    color: "#0f172a",
    fontSize: 15,
    textAlignVertical: "top",
    minHeight: 120,
    fontWeight: "500",
  },
  textInputListening: {
    borderColor: "#ef4444",
    borderWidth: 2,
    backgroundColor: "#fef2f2",
  },
  listeningIndicator: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ef4444",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  listeningDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ffffff",
    marginRight: 6,
  },
  listeningText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  tagsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  tagBtn: {
    width: "48%",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 70,
  },
  tagBtnSelected: {
    borderWidth: 2,
    borderColor: "#2563eb",
  },
  tagLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
    textAlign: "center",
  },
  tagLabelSelected: {
    color: "#1e3a8a",
    fontWeight: "800",
  },
  sendBtn: {
    backgroundColor: "#2563eb",
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
  btnDisabled: {
    opacity: 0.6,
  },
  sendBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 1,
  },
});