import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { containerService, recordService } from "../services/authService";
import IncidentReportModal from "./IncidentReportModal";
import {
  ArrowLeft,
  ScanLine,
  RotateCcw,
  AlertTriangle,
  Check,
} from "lucide-react-native";

interface Container {
  id: string;
  container_code: string;
  volume_liters: number;
  tare_weight: number;
  location_id: string;
}

export default function CollectionScreen({
  onLogout,
  onSwitchToHistory,
  onSubmitSuccess,
  preselectedContainer,
  onBackToScanner,
}: any) {
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(
    preselectedContainer || null
  );
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(true);

  // Formulario
  const [willWeigh, setWillWeigh] = useState<boolean | null>(null);
  const [weightInput, setWeightInput] = useState<string>("");
  const [fillLevel, setFillLevel] = useState<string>("");
  const [physicalStates, setPhysicalStates] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [separationLevel, setSeparationLevel] = useState<string>("");

  // Modal de incidencias
  const [incidentModalVisible, setIncidentModalVisible] = useState(false);

  useEffect(() => {
    loadUser();

    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error("Error al cargar usuario:", error);
    }
  };

  const togglePhysicalState = (value: string) => {
    setPhysicalStates((prev) => {
      if (prev.includes(value)) {
        return prev.filter((s) => s !== value);
      }

      if (value === "buen_estado") {
        return ["buen_estado"];
      }

      if (value === "tapa_rota" || value === "contenedor_roto") {
        return [...prev.filter((s) => s !== "buen_estado"), value];
      }

      return [...prev, value];
    });
  };

  const toggleCondition = (value: string) => {
    setConditions((prev) => {
      if (prev.includes(value)) {
        return prev.filter((c) => c !== value);
      }

      if (value === "tapado" && prev.includes("destapado")) {
        return [...prev.filter((c) => c !== "destapado"), "tapado"];
      }
      if (value === "destapado" && prev.includes("tapado")) {
        return [...prev.filter((c) => c !== "tapado"), "destapado"];
      }

      return [...prev, value];
    });
  };

  // Parsear el peso ingresado a numero flotante
  const getWeightNumber = (): number => {
    const num = parseFloat(weightInput.replace(",", "."));
    return isNaN(num) ? 0 : num;
  };

  // Validar si el formulario esta completo (para feedback visual del boton incidencia)
  const isFormComplete = (() => {
    if (willWeigh === null) return false;
    if (willWeigh === true) {
      const w = getWeightNumber();
      if (w === 0 || w <= (selectedContainer?.tare_weight || 0)) return false;
    }
    return (
      fillLevel !== "" &&
      physicalStates.length > 0 &&
      conditions.length > 0 &&
      separationLevel !== ""
    );
  })();

  const validateForm = (): string | null => {
    if (!selectedContainer || !user) {
      return "Selecciona un contenedor primero";
    }

    if (willWeigh === null) {
      return "Indica si vas a pesar el contenedor";
    }

    if (willWeigh === true) {
      const weight = getWeightNumber();
      if (weight === 0) {
        return "Ingresa el peso del contenedor";
      }
      if (weight <= selectedContainer.tare_weight) {
        return `El peso (${weight} kg) debe ser mayor que la tara del contenedor (${selectedContainer.tare_weight} kg).`;
      }
    }

    if (!fillLevel) {
      return "Selecciona el nivel de llenado";
    }

    if (physicalStates.length === 0) {
      return "Selecciona el estado fisico del contenedor";
    }

    if (conditions.length === 0) {
      return "Selecciona al menos una condicion";
    }

    if (!separationLevel) {
      return "Selecciona el nivel de separacion";
    }

    return null;
  };

  const handleOpenIncident = () => {
    const error = validateForm();
    if (error) {
      Alert.alert("Formulario incompleto", error);
      return;
    }
    setIncidentModalVisible(true);
  };

  const handleSubmit = async () => {
    const error = validateForm();
    if (error) {
      Alert.alert("Error", error);
      return;
    }

    try {
      setSubmitting(true);

      const weight = willWeigh ? getWeightNumber() : null;
      const netWeight = weight ? weight - selectedContainer!.tare_weight : null;

      const payload: any = {
        gross_weight: weight,
        net_weight: netWeight,
        fill_level: fillLevel,
        physical_state: physicalStates.join(","),
        condition: conditions.join(","),
        separation_level: separationLevel,
        container_id: selectedContainer!.id,
        collector_id: user.id,
      };

      const containerData = await containerService.getById(selectedContainer!.id);
      const categoryName = containerData?.waste_category?.name || "Sin categoria";

      await recordService.create(payload);

      const containerCode = selectedContainer!.container_code;
      setSelectedContainer(null);
      setWillWeigh(null);
      setWeightInput("");
      setFillLevel("");
      setPhysicalStates([]);
      setConditions([]);
      setSeparationLevel("");

      onSubmitSuccess({
        container_code: containerCode,
        category_name: categoryName,
        weight: netWeight || 0,
        weight_recorded: weight !== null,
        has_incident: false,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      Alert.alert("Error", error.message || "Error al enviar reporte");
    } finally {
      setSubmitting(false);
    }
  };

  const handleIncidentSuccess = () => {
    setSelectedContainer(null);
    setWillWeigh(null);
    setWeightInput("");
    setFillLevel("");
    setPhysicalStates([]);
    setConditions([]);
    setSeparationLevel("");
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1a5f3d" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  if (!selectedContainer) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>No hay contenedor seleccionado</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBackToScanner}>
          <ArrowLeft size={24} color="#1e40af" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>EcoCampus</Text>
        <View style={styles.statusBadge}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isOnline ? "#10b981" : "#ef4444" },
            ]}
          />
          <Text style={styles.statusText}>
            {isOnline ? "EN LINEA" : "SIN CONEXION"}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContent}>
        <Text style={styles.mainTitle}>Mediciones de Carga</Text>

        {/* PESO - PREGUNTA*/}
        <View style={styles.cardBox}>
          <Text style={styles.cardTitle}>¿Vas a pesar el contenedor?</Text>
          <Text style={styles.cardHint}>
            Tara del contenedor: {selectedContainer.tare_weight} kg
          </Text>

          <View style={styles.weighDecisionRow}>
            <TouchableOpacity
              style={[
                styles.weighBtn,
                styles.weighBtnYes,
                willWeigh === true && styles.weighBtnSelected,
              ]}
              onPress={() => setWillWeigh(true)}
            >
              <Check size={20} color="#fff" strokeWidth={2.5} style={{ marginRight: 6 }} />
              <Text style={styles.weighBtnText}>SI</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.weighBtn,
                styles.weighBtnNo,
                willWeigh === false && styles.weighBtnSelected,
              ]}
              onPress={() => {
                setWillWeigh(false);
                setWeightInput("");
              }}
            >
              <Text style={styles.weighBtnText}>NO</Text>
            </TouchableOpacity>
          </View>

          {willWeigh === true && (
            <View style={styles.weightInputContainer}>
              <Text style={styles.weightInputLabel}>Peso (kg)</Text>
              <TextInput
                style={styles.weightInput}
                value={weightInput}
                onChangeText={setWeightInput}
                keyboardType="decimal-pad"
                placeholder="Ej: 25.5"
                placeholderTextColor="#9ca3af"
              />
              {weightInput !== "" && getWeightNumber() > 0 && getWeightNumber() <= selectedContainer.tare_weight && (
                <View style={styles.warningBox}>
                  <AlertTriangle size={14} color="#dc2626" strokeWidth={2.5} style={{ marginRight: 6 }} />
                  <Text style={styles.warningText}>
                    El peso debe ser mayor que la tara ({selectedContainer.tare_weight} kg)
                  </Text>
                </View>
              )}
              {weightInput !== "" && getWeightNumber() > selectedContainer.tare_weight && (
                <Text style={styles.netWeightHint}>
                  Peso neto del residuo: {(getWeightNumber() - selectedContainer.tare_weight).toFixed(2)} kg
                </Text>
              )}
            </View>
          )}

          {willWeigh === false && (
            <View style={styles.noWeighInfo}>
              <Text style={styles.noWeighText}>
                El peso no se registrará en este reporte.
              </Text>
            </View>
          )}
        </View>

        {/* NIVEL DE LLENADO */}
        <View style={styles.cardBox}>
          <Text style={styles.cardTitle}>Nivel de Llenado</Text>

          <View style={styles.fillLevelRow}>
            <TouchableOpacity
              style={[
                styles.fillBox,
                { backgroundColor: "#10b981" },
                fillLevel === "empty" && styles.fillBoxSelected,  // ← CAMBIAR
              ]}
              onPress={() => setFillLevel("empty")}
            >
              <Text style={styles.fillNumber}>0</Text>
              <Text style={styles.fillLabel}>Vacio</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.fillBox,
                { backgroundColor: "#84cc16" },
                fillLevel === "quarter" && styles.fillBoxSelected,  // ← CAMBIAR
              ]}
              onPress={() => setFillLevel("quarter")}
            >
              <Text style={styles.fillNumber}>1</Text>
              <Text style={styles.fillLabel}>{"<"}25%</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.fillBox,
                { backgroundColor: "#eab308" },
                fillLevel === "half" && styles.fillBoxSelected,  // ← CAMBIAR
              ]}
              onPress={() => setFillLevel("half")}
            >
              <Text style={styles.fillNumber}>2</Text>
              <Text style={styles.fillLabel}>25-50%</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.fillBox,
                { backgroundColor: "#f97316" },
                fillLevel === "three_quarter" && styles.fillBoxSelected,  // ← CAMBIAR
              ]}
              onPress={() => setFillLevel("three_quarter")}
            >
              <Text style={styles.fillNumber}>3</Text>
              <Text style={styles.fillLabel}>50-75%</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.fillBox,
                { backgroundColor: "#ef4444" },
                fillLevel === "full" && styles.fillBoxSelected,  // ← CAMBIAR
              ]}
              onPress={() => setFillLevel("full")}
            >
              <Text style={styles.fillNumber}>4</Text>
              <Text style={styles.fillLabel}>{">"}75%</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.desbordadoBtn,
              fillLevel === "overflow" && styles.desbordadoBtnSelected,  // ← CAMBIAR
            ]}
            onPress={() => setFillLevel("overflow")}
          >
            <AlertTriangle size={20} color="#fff" strokeWidth={2.5} style={{ marginRight: 8 }} />
            <Text style={styles.desbordadoText}>5 - Desbordado</Text>
          </TouchableOpacity>
        </View>

        {/* ESTADO FISICO */}
        <View style={styles.cardBox}>
          <Text style={styles.cardTitle}>Estado fisico del contenedor</Text>
          <Text style={styles.cardHint}>Puedes seleccionar varias opciones</Text>

          <TouchableOpacity
            style={[
              styles.conditionBtn,
              { backgroundColor: "#10b981" },
              physicalStates.includes("buen_estado") && styles.conditionBtnSelected,
            ]}
            onPress={() => togglePhysicalState("buen_estado")}
          >
            <Text style={styles.conditionText}>
              {physicalStates.includes("buen_estado") ? "\u2713 " : ""}Buen estado
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.conditionBtn,
              { backgroundColor: "#eab308" },
              physicalStates.includes("tapa_rota") && styles.conditionBtnSelected,
            ]}
            onPress={() => togglePhysicalState("tapa_rota")}
          >
            <Text style={styles.conditionText}>
              {physicalStates.includes("tapa_rota") ? "\u2713 " : ""}Tapa rota
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.conditionBtn,
              { backgroundColor: "#ef4444" },
              physicalStates.includes("contenedor_roto") && styles.conditionBtnSelected,
            ]}
            onPress={() => togglePhysicalState("contenedor_roto")}
          >
            <Text style={styles.conditionText}>
              {physicalStates.includes("contenedor_roto") ? "\u2713 " : ""}Contenedor roto
            </Text>
          </TouchableOpacity>
        </View>

        {/* CONDICIONES */}
        <View style={styles.cardBox}>
          <Text style={styles.cardTitle}>¿En que condiciones esta el contenedor?</Text>
          <Text style={styles.cardHint}>Puedes seleccionar varias opciones</Text>

          <TouchableOpacity
            style={[
              styles.conditionBtn,
              { backgroundColor: "#10b981" },
              conditions.includes("tapado") && styles.conditionBtnSelected,
            ]}
            onPress={() => toggleCondition("tapado")}
          >
            <Text style={styles.conditionText}>
              {conditions.includes("tapado") ? "\u2713 " : ""}Tapado
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.conditionBtn,
              { backgroundColor: "#eab308" },
              conditions.includes("destapado") && styles.conditionBtnSelected,
            ]}
            onPress={() => toggleCondition("destapado")}
          >
            <Text style={styles.conditionText}>
              {conditions.includes("destapado") ? "\u2713 " : ""}Destapado
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.conditionBtn,
              { backgroundColor: "#f97316" },
              conditions.includes("fauna") && styles.conditionBtnSelected,
            ]}
            onPress={() => toggleCondition("fauna")}
          >
            <Text style={styles.conditionText}>
              {conditions.includes("fauna") ? "\u2713 " : ""}Presencia de fauna nociva
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.conditionBtn,
              { backgroundColor: "#f97316" },
              conditions.includes("huele_mal") && styles.conditionBtnSelected,
            ]}
            onPress={() => toggleCondition("huele_mal")}
          >
            <Text style={styles.conditionText}>
              {conditions.includes("huele_mal") ? "\u2713 " : ""}Huele mal
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.conditionBtn,
              { backgroundColor: "#dc2626" },
              conditions.includes("desbordado") && styles.conditionBtnSelected,
            ]}
            onPress={() => toggleCondition("desbordado")}
          >
            <Text style={styles.conditionText}>
              {conditions.includes("desbordado") ? "\u2713 " : ""}Desbordado
            </Text>
          </TouchableOpacity>
        </View>

        {/* NIVEL DE SEPARACION */}
        <View style={styles.cardBox}>
          <Text style={styles.cardTitle}>¿Cual es el nivel de separacion?</Text>
          <TouchableOpacity
            style={[
              styles.separationBtn,
              { backgroundColor: "#10b981" },
              separationLevel === "0" && styles.separationBtnSelected,
            ]}
            onPress={() => setSeparationLevel("0")}
          >
            <Text style={styles.separationTitle}>Nivel 0 o Excelente</Text>
            <Text style={styles.separationDesc}>cumplimiento total, 0% contaminantes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.separationBtn,
              { backgroundColor: "#eab308" },
              separationLevel === "1" && styles.separationBtnSelected,
            ]}
            onPress={() => setSeparationLevel("1")}
          >
            <Text style={styles.separationTitle}>Nivel 1 o Aceptable</Text>
            <Text style={styles.separationDesc}>presencia minima ({"<"}10% volumen)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.separationBtn,
              { backgroundColor: "#f97316" },
              separationLevel === "2" && styles.separationBtnSelected,
            ]}
            onPress={() => setSeparationLevel("2")}
          >
            <Text style={styles.separationTitle}>Nivel 2 o Deficiente</Text>
            <Text style={styles.separationDesc}>mezcla evidente (10% - 50% error)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.separationBtn,
              { backgroundColor: "#ef4444" },
              separationLevel === "3" && styles.separationBtnSelected,
            ]}
            onPress={() => setSeparationLevel("3")}
          >
            <Text style={styles.separationTitle}>Nivel 3 o Critico</Text>
            <Text style={styles.separationDesc}>Contaminado ({">"}50% volumen)</Text>
          </TouchableOpacity>
        </View>

        {/* BOTON REPORTAR INCIDENCIA */}
        <TouchableOpacity
          style={[
            styles.incidentBtn,
            !isFormComplete && { opacity: 0.5 }
          ]}
          onPress={handleOpenIncident}
        >
          <AlertTriangle size={20} color="#fff" strokeWidth={2.5} style={{ marginRight: 8 }} />
          <Text style={styles.incidentText}>REPORTAR INCIDENCIA</Text>
        </TouchableOpacity>

        {/* BOTON SIGUIENTE */}
        <TouchableOpacity
          style={[styles.nextBtn, submitting && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.nextText}>SIGUIENTE {"\u2192"}</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>

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

      {selectedContainer && user && (
        <IncidentReportModal
          visible={incidentModalVisible}
          containerId={selectedContainer.id}
          collectorId={user.id}
          containerCode={selectedContainer.container_code}
          formData={{
            gross_weight: willWeigh ? getWeightNumber() : 0,
            net_weight: willWeigh ? getWeightNumber() - selectedContainer.tare_weight : 0,
            fill_level: fillLevel,
            physical_state: physicalStates.join(","),
            condition: conditions,
            separation_level: separationLevel,
          }}
          onClose={() => setIncidentModalVisible(false)}
          onSuccess={handleIncidentSuccess}
          onSubmitSuccess={onSubmitSuccess}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e8e6f5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e8e6f5",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
  header: {
    backgroundColor: "#ffffff",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000",
    flex: 1,
    marginLeft: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#000",
    letterSpacing: 0.5,
  },
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  mainTitle: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 20,
  },
  cardBox: {
    backgroundColor: "#ffffff",
    borderWidth: 3,
    borderColor: "#000",
    borderRadius: 6,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    color: "#000",
    textAlign: "center",
    marginBottom: 4,
  },
  cardHint: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 12,
    fontStyle: "italic",
  },
  weighDecisionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  weighBtn: {
    flex: 1,
    padding: 18,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#000",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  weighBtnYes: {
    backgroundColor: "#10b981",
  },
  weighBtnNo: {
    backgroundColor: "#6b7280",
  },
  weighBtnSelected: {
    borderWidth: 4,
    borderColor: "#1e40af",
  },
  weighBtnText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  weightInputContainer: {
    marginTop: 8,
  },
  weightInputLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 6,
  },
  weightInput: {
    backgroundColor: "#f3f4f6",
    borderWidth: 2,
    borderColor: "#000",
    borderRadius: 6,
    padding: 14,
    fontSize: 24,
    color: "#000",
    fontWeight: "bold",
    textAlign: "center",
  },
  warningBox: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#dc2626",
    borderRadius: 4,
    padding: 8,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  warningText: {
    color: "#dc2626",
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  netWeightHint: {
    color: "#059669",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 10,
  },
  noWeighInfo: {
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
    padding: 10,
    marginTop: 8,
  },
  noWeighText: {
    color: "#6b7280",
    fontSize: 13,
    textAlign: "center",
    fontStyle: "italic",
  },
  fillLevelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  fillBox: {
    flex: 1,
    height: 70,
    marginHorizontal: 2,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#000",
  },
  fillBoxSelected: {
    borderWidth: 4,
    borderColor: "#1e40af",
  },
  fillNumber: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 22,
  },
  fillLabel: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  desbordadoBtn: {
    backgroundColor: "#dc2626",
    padding: 16,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#000",
  },
  desbordadoBtnSelected: {
    borderWidth: 4,
    borderColor: "#1e40af",
  },
  desbordadoText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  conditionBtn: {
    padding: 16,
    borderRadius: 4,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "#000",
  },
  conditionBtnSelected: {
    borderWidth: 4,
    borderColor: "#1e40af",
  },
  conditionText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  separationBtn: {
    padding: 14,
    borderRadius: 4,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "#000",
  },
  separationBtnSelected: {
    borderWidth: 4,
    borderColor: "#1e40af",
  },
  separationTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
  },
  separationDesc: {
    color: "#fff",
    fontSize: 11,
    marginTop: 2,
  },
  incidentBtn: {
    backgroundColor: "#dc2626",
    padding: 18,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#000",
  },
  incidentText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  nextBtn: {
    backgroundColor: "#1e3a8a",
    padding: 18,
    borderRadius: 4,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#000",
  },
  btnDisabled: {
    opacity: 0.6,
  },
  nextText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
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