import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { recordService } from "../services/authService";
import RecordDetailModal from "./RecordDetailModal";
import { BackHandler } from "react-native";
import {
  ArrowLeft,
  Search,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  ScanLine,
  RotateCcw,
} from "lucide-react-native";
import NetworkStatusBadge from "../components/NetworkStatusBadge";

interface RecordItem {
  id: string;
  gross_weight: number | null;
  net_weight: number | null;
  fill_level: string;
  physical_state: string;
  condition: string;
  separation_level: string;
  created_at: string;
  is_weight_recorded: boolean;
  is_weight_estimated: boolean; // Solo añadimos esta línea aquí
  container: {
    id: string;
    container_code: string;
    volume_liters: number;
    tare_weight: number;
  } | null;
  category: {
    id: string;
    name: string;
    color: string;
  } | null;
  location: {
    name: string;
    sector: string;
    campus: string;
  } | null;
  incident: {
    id: string;
    description: string;
    quick_tag: string;
    status: string;
  } | null;
}

export default function HistoryScreen({ onSwitchToScan, onLogout }: any) {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<RecordItem | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    loadRecords();

    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, []);
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      onSwitchToScan();
      return true; // Previene el comportamiento por defecto
    });
    return () => backHandler.remove();
  }, [onSwitchToScan]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const userData = await AsyncStorage.getItem("user");
      if (!userData) {
        Alert.alert("Error", "No se encontró el usuario");
        return;
      }
      const user = JSON.parse(userData);
      const data = await recordService.getByCollector(user.id);
      setRecords(data);
    } catch (error: any) {
      Alert.alert("Error", "No se pudieron cargar los reportes");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    if (date.toDateString() === today.toDateString()) {
      return `Hoy, ${hours}:${minutes}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Ayer, ${hours}:${minutes}`;
    } else {
      const day = date.getDate().toString().padStart(2, "0");
      const month = date.toLocaleString("es-MX", { month: "short" });
      return `${day} ${month}`;
    }
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

  const filteredRecords = records.filter((record) => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();
    return (
      record.container?.container_code.toLowerCase().includes(search) ||
      record.category?.name.toLowerCase().includes(search) ||
      formatDate(record.created_at).toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Cargando historial...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Limpio */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onSwitchToScan} style={styles.headerLeft} activeOpacity={0.7}>
          <ArrowLeft size={24} color="#1e293b" strokeWidth={2.5} style={{ marginRight: 8 }} />
          <Text style={styles.headerTitle}>EcoCampus</Text>
        </TouchableOpacity>
        <NetworkStatusBadge />
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.mainTitle}>Historial de Registros</Text>

        {/* Buscador Modernizado */}
        <Text style={styles.searchLabel}>BUSCAR REGISTRO</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="ID, Tipo o Fecha..."
            placeholderTextColor="#94a3b8"
            value={searchText}
            onChangeText={setSearchText}
          />
          <TouchableOpacity style={styles.searchBtn} activeOpacity={0.8}>
            <Search size={20} color="#ffffff" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Lista de registros */}
        {filteredRecords.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Search size={40} color="#cbd5e1" strokeWidth={2} style={{ marginBottom: 16 }} />
            <Text style={styles.emptyText}>No hay reportes</Text>
            <Text style={styles.emptySubtext}>
              Tus registros recientes aparecerán aquí
            </Text>
          </View>
        ) : (
          filteredRecords.map((record) => (
            <View key={record.id} style={styles.recordCard}>
              {/* Header del card */}
              <View style={styles.recordHeader}>
                <Text style={styles.categoryName}>
                  {record.category?.name.toUpperCase() || "SIN CATEGORÍA"}
                </Text>
                <View style={styles.dateBadge}>
                  <Text style={styles.dateText}>
                    {formatDate(record.created_at)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.colorIndicator,
                    { backgroundColor: record.category?.color || "#cbd5e1" },
                  ]}
                />
              </View>

              {/* ID del contenedor */}
              <Text style={styles.containerCode}>
                #{record.container?.container_code || "N/A"}
              </Text>

              {/* Línea separadora */}
              <View style={styles.separator} />

              {/* Datos */}
              <View style={styles.dataRow}>
                <View style={styles.dataCol}>
                  <Text style={styles.dataLabel}>NIVEL DE LLENADO</Text>
                  <Text style={styles.dataValue}>
                    {getFillLevelLabel(record.fill_level)}
                  </Text>
                </View>
                <View style={styles.dataDivider} />
                <View style={styles.dataCol}>
                  <Text style={styles.dataLabel}>PESO NETO</Text>
                  <Text
                    style={[
                      styles.dataValue,
                      record.net_weight === null && styles.dataValueEmpty,
                    ]}
                  >
                    {record.net_weight !== null
                      ? `${record.net_weight.toFixed(1)} kg`
                      : "Sin registrar"}
                  </Text>
                </View>
              </View>

              {/* Badge de incidencia si aplica */}
              {record.incident && (
                <View style={styles.incidentBadge}>
                  <AlertTriangle size={14} color="#b45309" strokeWidth={2.5} style={{ marginRight: 6 }} />
                  <Text style={styles.incidentBadgeText}>
                    Con incidencia reportada
                  </Text>
                </View>
              )}

              {/* Botón ver detalles */}
              <TouchableOpacity
                style={styles.detailsBtn}
                onPress={() => setSelectedRecord(record)}
                activeOpacity={0.7}
              >
                <Text style={styles.detailsBtnText}>VER DETALLES</Text>
                <ChevronRight size={18} color="#64748b" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* Botón cargar más */}
        <TouchableOpacity style={styles.loadMoreBtn} onPress={loadRecords} activeOpacity={0.8}>
          <RefreshCw size={18} color="#ffffff" strokeWidth={2.5} style={{ marginRight: 8 }} />
          <Text style={styles.loadMoreText}>
            ACTUALIZAR REGISTROS
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Tab Bar conservado de tu versión original */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={onSwitchToScan} activeOpacity={0.7}>
          <ScanLine size={22} color="#000000" strokeWidth={2.5} />
          <Text style={styles.tabText}>ESCANEAR</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabItem, styles.tabActive]} activeOpacity={1}>
          <RotateCcw size={22} color="#ffffff" strokeWidth={2.5} />
          <Text style={styles.tabTextActive}>HISTORIAL</Text>
        </TouchableOpacity>
      </View>

      {/* Modal de detalle */}
      {selectedRecord && (
        <RecordDetailModal
          visible={!!selectedRecord}
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc", // Fondo claro y moderno
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
    fontSize: 18,
    fontWeight: "800",
    color: "#1e293b",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 10,
    paddingVertical: 6,
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
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  searchLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748b",
    marginBottom: 8,
    letterSpacing: 1,
  },
  searchRow: {
    flexDirection: "row",
    marginBottom: 24,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "500",
  },
  searchBtn: {
    backgroundColor: "#2563eb",
    borderRadius: 10,
    width: 54,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  recordCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  recordHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#475569",
    flex: 1,
    letterSpacing: 0.5,
  },
  dateBadge: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 10,
  },
  dateText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
  },
  colorIndicator: {
    width: 14,
    height: 14,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  containerCode: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 16,
  },
  separator: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginBottom: 16,
  },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  dataCol: {
    flex: 1,
  },
  dataDivider: {
    width: 1,
    backgroundColor: "#f1f5f9",
    marginHorizontal: 16,
  },
  dataLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94a3b8",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  dataValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1e293b",
  },
  dataValueEmpty: {
    color: "#94a3b8",
    fontStyle: "italic",
    fontSize: 14,
    fontWeight: "600",
  },
  incidentBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7", // Amarillo claro
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  incidentBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#b45309",
    letterSpacing: 0.5,
  },
  detailsBtn: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  detailsBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#475569",
    letterSpacing: 0.5,
    marginRight: 6,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    marginTop: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#64748b",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
  },
  loadMoreBtn: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderTopWidth: 2,
    borderTopColor: "#000000",
    paddingBottom: Platform.OS === "ios" ? 20 : 0,
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