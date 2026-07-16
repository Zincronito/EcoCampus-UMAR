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
  Platform,
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
  console.log("🎨 CollectionScreen RENDERIZADO");
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

  // Validar si el formulario esta completo
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
    console.log("🚀 handleSubmit iniciado");
    const error = validateForm();
    if (error) {
      console.log("❌ Validación falló:", error);
      Alert.alert("Error", error);
      return;
    }

    try {
      setSubmitting(true);
      console.log("📝 Preparando payload...");

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
      console.log("📤 Payload listo, llamando a recordService.create...");

      // Usar la info que ya tenemos del contenedor (evita llamada extra)
      const categoryName = (selectedContainer as any)?.waste_category?.name || "Sin categoria";
      console.log("🎯 Antes de recordService.create con payload:", payload);
      await recordService.create(payload);
      console.log("✅ recordService.create completado");
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
        <ActivityIndicator size="large" color="#2563eb" />
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
      {/* Header moderno y limpio */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBackToScanner} style={styles.backButton}>
          <ArrowLeft size={24} color="#1e293b" strokeWidth={2.5} />
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
            {isOnline ? "EN LÍNEA" : "SIN CONEXIÓN"}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.mainTitle}>Registro de Recolección</Text>

        {/* PESO - PREGUNTA */}
        <View style={styles.cardBox}>
          <Text style={styles.cardTitle}>¿Vas a pesar el contenedor?</Text>
          <Text style={styles.cardHint}>
            Tara del contenedor: {selectedContainer.tare_weight} kg
          </Text>

          <View style={styles.weighDecisionRow}>
            <TouchableOpacity
              style={[
                styles.weighBtn,
                willWeigh === true ? styles.weighBtnYes : styles.weighBtnInactive,
              ]}
              onPress={() => setWillWeigh(true)}
              activeOpacity={0.7}
            >
              {willWeigh === true && <Check size={18} color="#ffffff" strokeWidth={3} style={{ marginRight: 6 }} />}
              <Text style={[styles.weighBtnText, willWeigh === true && { color: "#ffffff" }]}>SÍ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.weighBtn,
                willWeigh === false ? styles.weighBtnNo : styles.weighBtnInactive,
              ]}
              onPress={() => {
                setWillWeigh(false);
                setWeightInput("");
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.weighBtnText, willWeigh === false && { color: "#ffffff" }]}>NO</Text>
            </TouchableOpacity>
          </View>

          {willWeigh === true && (
            <View style={styles.weightInputContainer}>
              <Text style={styles.weightInputLabel}>Peso bruto total (kg)</Text>
              <TextInput
                style={styles.weightInput}
                value={weightInput}
                onChangeText={setWeightInput}
                keyboardType="decimal-pad"
                placeholder="Ej: 25.5"
                placeholderTextColor="#94a3b8"
              />
              {weightInput !== "" && getWeightNumber() > 0 && getWeightNumber() <= selectedContainer.tare_weight && (
                <View style={styles.warningBox}>
                  <AlertTriangle size={14} color="#ef4444" strokeWidth={2.5} style={{ marginRight: 6 }} />
                  <Text style={styles.warningText}>
                    El peso debe ser mayor que la tara ({selectedContainer.tare_weight} kg)
                  </Text>
                </View>
              )}
              {weightInput !== "" && getWeightNumber() > selectedContainer.tare_weight && (
                <View style={styles.successBox}>
                  <Text style={styles.netWeightHint}>
                    Peso neto del residuo: {(getWeightNumber() - selectedContainer.tare_weight).toFixed(2)} kg
                  </Text>
                </View>
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
                fillLevel === "empty" && styles.boxSelected,
              ]}
              onPress={() => setFillLevel("empty")}
              activeOpacity={0.8}
            >
              <Text style={styles.fillNumber}>0</Text>
              <Text style={styles.fillLabel}>Vacío</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.fillBox,
                { backgroundColor: "#84cc16" },
                fillLevel === "quarter" && styles.boxSelected,
              ]}
              onPress={() => setFillLevel("quarter")}
              activeOpacity={0.8}
            >
              <Text style={styles.fillNumber}>1</Text>
              <Text style={styles.fillLabel}>{"<"}25%</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.fillBox,
                { backgroundColor: "#eab308" },
                fillLevel === "half" && styles.boxSelected,
              ]}
              onPress={() => setFillLevel("half")}
              activeOpacity={0.8}
            >
              <Text style={styles.fillNumber}>2</Text>
              <Text style={styles.fillLabel}>25-50%</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.fillBox,
                { backgroundColor: "#f97316" },
                fillLevel === "three_quarter" && styles.boxSelected,
              ]}
              onPress={() => setFillLevel("three_quarter")}
              activeOpacity={0.8}
            >
              <Text style={styles.fillNumber}>3</Text>
              <Text style={styles.fillLabel}>50-75%</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.fillBox,
                { backgroundColor: "#ef4444" },
                fillLevel === "full" && styles.boxSelected,
              ]}
              onPress={() => setFillLevel("full")}
              activeOpacity={0.8}
            >
              <Text style={styles.fillNumber}>4</Text>
              <Text style={styles.fillLabel}>{">"}75%</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.desbordadoBtn,
              fillLevel === "overflow" && styles.boxSelected,
            ]}
            onPress={() => setFillLevel("overflow")}
            activeOpacity={0.8}
          >
            <AlertTriangle size={18} color="#ffffff" strokeWidth={2.5} style={{ marginRight: 8 }} />
            <Text style={styles.desbordadoText}>5 - Desbordado</Text>
          </TouchableOpacity>
        </View>

        {/* ESTADO FISICO */}
        <View style={styles.cardBox}>
          <Text style={styles.cardTitle}>Estado físico del contenedor</Text>
          <Text style={styles.cardHint}>Puedes seleccionar varias opciones</Text>

          <TouchableOpacity
            style={[
              styles.conditionBtn,
              { backgroundColor: "#10b981" },
              physicalStates.includes("buen_estado") && styles.boxSelected,
            ]}
            onPress={() => togglePhysicalState("buen_estado")}
            activeOpacity={0.8}
          >
            <Text style={styles.conditionText}>
              {physicalStates.includes("buen_estado") ? "✓ " : ""}Buen estado
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.conditionBtn,
              { backgroundColor: "#eab308" },
              physicalStates.includes("tapa_rota") && styles.boxSelected,
            ]}
            onPress={() => togglePhysicalState("tapa_rota")}
            activeOpacity={0.8}
          >
            <Text style={styles.conditionText}>
              {physicalStates.includes("tapa_rota") ? "✓ " : ""}Tapa rota
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.conditionBtn,
              { backgroundColor: "#ef4444" },
              physicalStates.includes("contenedor_roto") && styles.boxSelected,
            ]}
            onPress={() => togglePhysicalState("contenedor_roto")}
            activeOpacity={0.8}
          >
            <Text style={styles.conditionText}>
              {physicalStates.includes("contenedor_roto") ? "✓ " : ""}Contenedor roto
            </Text>
          </TouchableOpacity>
        </View>

        {/* CONDICIONES */}
        <View style={styles.cardBox}>
          <Text style={styles.cardTitle}>Condiciones del entorno</Text>
          <Text style={styles.cardHint}>Puedes seleccionar varias opciones</Text>

          <TouchableOpacity
            style={[
              styles.conditionBtn,
              { backgroundColor: "#10b981" },
              conditions.includes("tapado") && styles.boxSelected,
            ]}
            onPress={() => toggleCondition("tapado")}
            activeOpacity={0.8}
          >
            <Text style={styles.conditionText}>
              {conditions.includes("tapado") ? "✓ " : ""}Tapado
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.conditionBtn,
              { backgroundColor: "#eab308" },
              conditions.includes("destapado") && styles.boxSelected,
            ]}
            onPress={() => toggleCondition("destapado")}
            activeOpacity={0.8}
          >
            <Text style={styles.conditionText}>
              {conditions.includes("destapado") ? "✓ " : ""}Destapado
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.conditionBtn,
              { backgroundColor: "#f97316" },
              conditions.includes("fauna") && styles.boxSelected,
            ]}
            onPress={() => toggleCondition("fauna")}
            activeOpacity={0.8}
          >
            <Text style={styles.conditionText}>
              {conditions.includes("fauna") ? "✓ " : ""}Presencia de fauna nociva
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.conditionBtn,
              { backgroundColor: "#f97316" },
              conditions.includes("huele_mal") && styles.boxSelected,
            ]}
            onPress={() => toggleCondition("huele_mal")}
            activeOpacity={0.8}
          >
            <Text style={styles.conditionText}>
              {conditions.includes("huele_mal") ? "✓ " : ""}Mal olor perceptible
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.conditionBtn,
              { backgroundColor: "#ef4444" },
              conditions.includes("desbordado") && styles.boxSelected,
            ]}
            onPress={() => toggleCondition("desbordado")}
            activeOpacity={0.8}
          >
            <Text style={styles.conditionText}>
              {conditions.includes("desbordado") ? "✓ " : ""}Desbordamiento
            </Text>
          </TouchableOpacity>
        </View>

        {/* NIVEL DE SEPARACION */}
        <View style={styles.cardBox}>
          <Text style={styles.cardTitle}>Nivel de separación en la fuente</Text>
          
          <TouchableOpacity
            style={[
              styles.separationBtn,
              { backgroundColor: "#10b981" },
              separationLevel === "0" && styles.boxSelected,
            ]}
            onPress={() => setSeparationLevel("0")}
            activeOpacity={0.8}
          >
            <Text style={styles.separationTitle}>Nivel 0 - Excelente</Text>
            <Text style={styles.separationDesc}>Cumplimiento total, 0% contaminantes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.separationBtn,
              { backgroundColor: "#eab308" },
              separationLevel === "1" && styles.boxSelected,
            ]}
            onPress={() => setSeparationLevel("1")}
            activeOpacity={0.8}
          >
            <Text style={styles.separationTitle}>Nivel 1 - Aceptable</Text>
            <Text style={styles.separationDesc}>Presencia mínima ({"<"}10% volumen)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.separationBtn,
              { backgroundColor: "#f97316" },
              separationLevel === "2" && styles.boxSelected,
            ]}
            onPress={() => setSeparationLevel("2")}
            activeOpacity={0.8}
          >
            <Text style={styles.separationTitle}>Nivel 2 - Deficiente</Text>
            <Text style={styles.separationDesc}>Mezcla evidente (10% - 50% error)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.separationBtn,
              { backgroundColor: "#ef4444" },
              separationLevel === "3" && styles.boxSelected,
            ]}
            onPress={() => setSeparationLevel("3")}
            activeOpacity={0.8}
          >
            <Text style={styles.separationTitle}>Nivel 3 - Crítico</Text>
            <Text style={styles.separationDesc}>Contaminado ({">"}50% volumen)</Text>
          </TouchableOpacity>
        </View>

        {/* BOTON REPORTAR INCIDENCIA */}
        <TouchableOpacity
          style={[
            styles.incidentBtn,
            !isFormComplete && { opacity: 0.6 }
          ]}
          onPress={handleOpenIncident}
          activeOpacity={0.8}
        >
          <AlertTriangle size={20} color="#ffffff" strokeWidth={2.5} style={{ marginRight: 8 }} />
          <Text style={styles.incidentText}>REPORTAR INCIDENCIA</Text>
        </TouchableOpacity>

        {/* BOTON SIGUIENTE */}
        <TouchableOpacity
          style={[styles.nextBtn, submitting && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.nextText}>ENVIAR REPORTE</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Tab Bar conservado de tu versión original */}
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

      {selectedContainer && user && (
        <IncidentReportModal
          visible={incidentModalVisible}
          containerId={selectedContainer.id}
          collectorId={user.id}
          containerCode={selectedContainer.container_code}
          categoryName={(selectedContainer as any)?.waste_category?.name || "Sin categoria"}
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
    backgroundColor: "#f8fafc", // Blanquito
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 12,
    color: "#64748b",
    fontSize: 15,
    fontWeight: "500",
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
    elevation: 3,
    zIndex: 10,
  },
  backButton: {
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
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#475569",
    letterSpacing: 0.5,
  },
  scrollContent: {
    flex: 1,
    padding: 20,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  cardBox: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
  },
  cardHint: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 16,
  },
  weighDecisionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  weighBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  weighBtnInactive: {
    backgroundColor: "#f1f5f9",
    borderColor: "#e2e8f0",
    borderWidth: 1,
  },
  weighBtnYes: {
    backgroundColor: "#2563eb",
  },
  weighBtnNo: {
    backgroundColor: "#64748b",
  },
  weighBtnText: {
    color: "#64748b",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  weightInputContainer: {
    marginTop: 20,
  },
  weightInputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 8,
  },
  weightInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    padding: 14,
    fontSize: 20,
    color: "#0f172a",
    fontWeight: "700",
    textAlign: "center",
  },
  warningBox: {
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  warningText: {
    color: "#dc2626",
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  successBox: {
    backgroundColor: "#ecfdf5",
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    alignItems: "center",
  },
  netWeightHint: {
    color: "#059669",
    fontSize: 13,
    fontWeight: "700",
  },
  noWeighInfo: {
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  noWeighText: {
    color: "#475569",
    fontSize: 13,
    textAlign: "center",
    fontWeight: "500",
  },
  fillLevelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  fillBox: {
    flex: 1,
    height: 70,
    marginHorizontal: 3,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 3,
    borderColor: "transparent",
  },
  boxSelected: {
    borderColor: "#1e293b", // Borde oscuro elegante para estados seleccionados
  },
  fillNumber: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 20,
  },
  fillLabel: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },
  desbordadoBtn: {
    backgroundColor: "#ef4444",
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "transparent",
  },
  desbordadoText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  conditionBtn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 3,
    borderColor: "transparent",
  },
  conditionText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  separationBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 3,
    borderColor: "transparent",
  },
  separationTitle: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  separationDesc: {
    color: "#ffffff",
    fontSize: 12,
    marginTop: 2,
    opacity: 0.9,
  },
  incidentBtn: {
    backgroundColor: "#ef4444",
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  incidentText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  nextBtn: {
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
  btnDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  nextText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 1,
  },
  // Tab Bar original conservado
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