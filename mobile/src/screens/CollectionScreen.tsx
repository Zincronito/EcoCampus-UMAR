import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { containerService, recordService } from "../services/authService";
import IncidentReportModal from "./IncidentReportModal";

interface Container {
  id: string;
  container_code: string;
  volume_liters: number;
  tare_weight: number;
  location_id: string;
}

export default function CollectionScreen({ onLogout }: any) {
  const [containers, setContainers] = useState<Container[]>([]);
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(true);

  // Formulario
  const [weight, setWeight] = useState(0);
  const [fillLevel, setFillLevel] = useState<string>("");
  const [physicalStates, setPhysicalStates] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [separationLevel, setSeparationLevel] = useState<string>("");

  // Modal de incidencias
  const [incidentModalVisible, setIncidentModalVisible] = useState(false);

  useEffect(() => {
    loadContainers();
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

  const loadContainers = async () => {
    try {
      setLoading(true);
      const data = await containerService.getAll();
      setContainers(data);
    } catch (error: any) {
      Alert.alert("Error", "No se pudieron cargar los contenedores");
    } finally {
      setLoading(false);
    }
  };

  const incrementWeight = () => setWeight(weight + 1);
  const decrementWeight = () => {
    if (weight > 0) setWeight(weight - 1);
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

  // Validar si el formulario está completo (para feedback visual)
  const isFormComplete =
    weight > 0 &&
    fillLevel !== "" &&
    physicalStates.length > 0 &&
    conditions.length > 0 &&
    separationLevel !== "";

  const handleOpenIncident = () => {
    // Validar que el formulario esté completo antes de permitir reportar incidencia
    if (weight === 0) {
      Alert.alert(
        "Formulario incompleto",
        "Antes de reportar una incidencia, completa el peso del contenedor"
      );
      return;
    }

    if (!fillLevel) {
      Alert.alert(
        "Formulario incompleto",
        "Antes de reportar una incidencia, selecciona el nivel de llenado"
      );
      return;
    }

    if (physicalStates.length === 0) {
      Alert.alert(
        "Formulario incompleto",
        "Antes de reportar una incidencia, selecciona el estado físico"
      );
      return;
    }

    if (conditions.length === 0) {
      Alert.alert(
        "Formulario incompleto",
        "Antes de reportar una incidencia, selecciona al menos una condición"
      );
      return;
    }

    if (!separationLevel) {
      Alert.alert(
        "Formulario incompleto",
        "Antes de reportar una incidencia, selecciona el nivel de separación"
      );
      return;
    }

    // Si todo está completo, abrir el modal
    setIncidentModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!selectedContainer || !user) {
      Alert.alert("Error", "Selecciona un contenedor primero");
      return;
    }

    if (weight === 0) {
      Alert.alert("Error", "Ingresa el peso del contenedor");
      return;
    }

    if (!fillLevel) {
      Alert.alert("Error", "Selecciona el nivel de llenado");
      return;
    }

    if (physicalStates.length === 0) {
      Alert.alert("Error", "Selecciona el estado fisico del contenedor");
      return;
    }

    if (conditions.length === 0) {
      Alert.alert("Error", "Selecciona al menos una condicion");
      return;
    }

    if (!separationLevel) {
      Alert.alert("Error", "Selecciona el nivel de separacion");
      return;
    }

    try {
      setSubmitting(true);

      const netWeight = weight - selectedContainer.tare_weight;

      const payload = {
        gross_weight: weight,
        net_weight: netWeight,
        fill_level: fillLevel,
        physical_state: physicalStates.join(","),
        condition: conditions.join(","),
        separation_level: separationLevel,
        container_id: selectedContainer.id,
        collector_id: user.id,
      };

      await recordService.create(payload);

      Alert.alert("Exito", "Reporte enviado correctamente", [
        {
          text: "OK",
          onPress: () => {
            setSelectedContainer(null);
            setWeight(0);
            setFillLevel("");
            setPhysicalStates([]);
            setConditions([]);
            setSeparationLevel("");
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Error al enviar reporte");
    } finally {
      setSubmitting(false);
    }
  };

  const handleIncidentSuccess = () => {
    // Después de reportar incidencia, volver a lista de contenedores
    setSelectedContainer(null);
    setWeight(0);
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

  // Pantalla de seleccion de contenedor
  if (!selectedContainer) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onLogout}>
            <Text style={styles.backArrow}>{"\u2190"}</Text>
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
          <Text style={styles.sectionTitle}>Selecciona un contenedor</Text>
          {containers.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.containerCard}
              onPress={() => setSelectedContainer(item)}
            >
              <Text style={styles.containerCode}>{item.container_code}</Text>
              <Text style={styles.containerInfo}>
                Volumen: {item.volume_liters}L | Tara: {item.tare_weight}kg
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.tabBar}>
          <TouchableOpacity style={[styles.tabItem, styles.tabActive]}>
            <Text style={styles.tabIconActive}>{"\u2630"}</Text>
            <Text style={styles.tabTextActive}>ESCANEAR</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem}>
            <Text style={styles.tabIcon}>{"\u27F2"}</Text>
            <Text style={styles.tabText}>HISTORIAL</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Formulario
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSelectedContainer(null)}>
          <Text style={styles.backArrow}>{"\u2190"}</Text>
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

        {/* PESO */}
        <View style={styles.cardBox}>
          <Text style={styles.cardTitle}>Peso (kg)</Text>
          <View style={styles.weightRow}>
            <TouchableOpacity style={styles.btnMinus} onPress={decrementWeight}>
              <Text style={styles.btnSymbol}>-</Text>
            </TouchableOpacity>
            <Text style={styles.weightValue}>{weight}</Text>
            <TouchableOpacity style={styles.btnPlus} onPress={incrementWeight}>
              <Text style={styles.btnSymbol}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* NIVEL DE LLENADO (escala 0-5) */}
        <View style={styles.cardBox}>
          <Text style={styles.cardTitle}>Nivel de Llenado</Text>

          <View style={styles.fillLevelRow}>
            <TouchableOpacity
              style={[
                styles.fillBox,
                { backgroundColor: "#10b981" },
                fillLevel === "0" && styles.fillBoxSelected,
              ]}
              onPress={() => setFillLevel("0")}
            >
              <Text style={styles.fillNumber}>0</Text>
              <Text style={styles.fillLabel}>Vacio</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.fillBox,
                { backgroundColor: "#84cc16" },
                fillLevel === "1" && styles.fillBoxSelected,
              ]}
              onPress={() => setFillLevel("1")}
            >
              <Text style={styles.fillNumber}>1</Text>
              <Text style={styles.fillLabel}>{"<"}25%</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.fillBox,
                { backgroundColor: "#eab308" },
                fillLevel === "2" && styles.fillBoxSelected,
              ]}
              onPress={() => setFillLevel("2")}
            >
              <Text style={styles.fillNumber}>2</Text>
              <Text style={styles.fillLabel}>25-50%</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.fillBox,
                { backgroundColor: "#f97316" },
                fillLevel === "3" && styles.fillBoxSelected,
              ]}
              onPress={() => setFillLevel("3")}
            >
              <Text style={styles.fillNumber}>3</Text>
              <Text style={styles.fillLabel}>50-75%</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.fillBox,
                { backgroundColor: "#ef4444" },
                fillLevel === "4" && styles.fillBoxSelected,
              ]}
              onPress={() => setFillLevel("4")}
            >
              <Text style={styles.fillNumber}>4</Text>
              <Text style={styles.fillLabel}>{">"}75%</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.desbordadoBtn,
              fillLevel === "5" && styles.desbordadoBtnSelected,
            ]}
            onPress={() => setFillLevel("5")}
          >
            <Text style={styles.desbordadoText}>{"\u26A0"} 5 - Desbordado</Text>
          </TouchableOpacity>
        </View>

        {/* ESTADO FISICO (multi-select con logica) */}
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

        {/* CONDICIONES (multi-select) */}
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
          <Text style={styles.incidentText}>{"\u26A0"} REPORTAR INCIDENCIA</Text>
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
          <Text style={styles.tabIconActive}>{"\u2630"}</Text>
          <Text style={styles.tabTextActive}>ESCANEAR</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Text style={styles.tabIcon}>{"\u27F2"}</Text>
          <Text style={styles.tabText}>HISTORIAL</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL DE INCIDENCIAS */}
      {selectedContainer && user && (
        <IncidentReportModal
          visible={incidentModalVisible}
          containerId={selectedContainer.id}
          collectorId={user.id}
          formData={{
            gross_weight: weight,
            net_weight: weight - selectedContainer.tare_weight,
            fill_level: fillLevel,
            physical_state: physicalStates.join(","),
            condition: conditions,  // ← SIN hacer join(), solo el array
            separation_level: separationLevel,
          }}
          onClose={() => setIncidentModalVisible(false)}
          onSuccess={handleIncidentSuccess}
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
  backArrow: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000",
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#000",
  },
  containerCard: {
    backgroundColor: "#fff",
    borderRadius: 6,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#000",
  },
  containerCode: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  containerInfo: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
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
  weightRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  btnMinus: {
    width: 70,
    height: 70,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
  },
  btnPlus: {
    width: 70,
    height: 70,
    backgroundColor: "#dc2626",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
  },
  btnSymbol: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#fff",
  },
  weightValue: {
    fontSize: 50,
    fontWeight: "bold",
    color: "#000",
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
    alignItems: "center",
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
    alignItems: "center",
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
    paddingVertical: 14,
  },
  tabActive: {
    backgroundColor: "#000",
  },
  tabIcon: {
    fontSize: 20,
    color: "#000",
  },
  tabIconActive: {
    fontSize: 20,
    color: "#fff",
  },
  tabText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#000",
    marginTop: 2,
  },
  tabTextActive: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 2,
  },
});