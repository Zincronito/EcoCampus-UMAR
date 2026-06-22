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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { recordService } from "../services/authService";
import RecordDetailModal from "./RecordDetailModal";

interface RecordItem {
  id: string;
  gross_weight: number | null;
  net_weight: number | null;
  fill_level: string;
  physical_state: string;
  condition: string;
  separation_level: string;
  created_at: string;
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
    const labels: { [key: string]: string } = {
      "0": "Vacio",
      "1": "<25%",
      "2": "25-50%",
      "3": "50-75%",
      "4": ">75%",
      "5": "Desbordado",
    };
    return labels[level] || level;
  };

  // Filtrar registros
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
        <ActivityIndicator size="large" color="#1a5f3d" />
        <Text style={styles.loadingText}>Cargando historial...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onLogout} style={styles.headerLeft}>
          <Text style={styles.backArrow}>{"\u2190"}</Text>
          <Text style={styles.headerTitle}>EcoCampus</Text>
        </TouchableOpacity>
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

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.mainTitle}>Historial de Residuos</Text>

        {/* Buscador */}
        <Text style={styles.searchLabel}>BUSCAR REGISTRO</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="ID, Tipo o Fecha..."
            placeholderTextColor="#9ca3af"
            value={searchText}
            onChangeText={setSearchText}
          />
          <TouchableOpacity style={styles.searchBtn}>
            <Text style={styles.searchIcon}>{"\uD83D\uDD0D"}</Text>
          </TouchableOpacity>
        </View>

        {/* Lista de registros */}
        {filteredRecords.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay reportes</Text>
            <Text style={styles.emptySubtext}>
              Tus reportes apareceran aqui
            </Text>
          </View>
        ) : (
          filteredRecords.map((record) => (
            <View key={record.id} style={styles.recordCard}>
              {/* Header del card */}
              <View style={styles.recordHeader}>
                <Text style={styles.categoryName}>
                  {record.category?.name.toUpperCase() || "SIN CATEGORIA"}
                </Text>
                <View style={styles.dateBadge}>
                  <Text style={styles.dateText}>
                    {formatDate(record.created_at)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.colorIndicator,
                    { backgroundColor: record.category?.color || "#808080" },
                  ]}
                />
              </View>

              {/* ID del contenedor */}
              <Text style={styles.containerCode}>
                #{record.container?.container_code || "N/A"}
              </Text>

              {/* Linea separadora */}
              <View style={styles.separator} />

              {/* Datos */}
              <View style={styles.dataRow}>
                <View style={styles.dataCol}>
                  <Text style={styles.dataLabel}>NIVEL DE LLENADO</Text>
                  <Text style={styles.dataValue}>
                    {record.fill_level} ({getFillLevelLabel(record.fill_level)})
                  </Text>
                </View>
                <View style={styles.dataDivider} />
                <View style={styles.dataCol}>
                  <Text style={styles.dataLabel}>PESO NETO</Text>
                  <Text style={[
                    styles.dataValue,
                    record.net_weight === null && styles.dataValueEmpty
                  ]}>
                    {record.net_weight !== null
                      ? `${record.net_weight.toFixed(1)} kg`
                      : "Sin registrar"
                    }
                  </Text>
                </View>
              </View>

              {/* Badge de incidencia si aplica */}
              {record.incident && (
                <View style={styles.incidentBadge}>
                  <Text style={styles.incidentBadgeText}>
                    {"\u26A0"} Con incidencia
                  </Text>
                </View>
              )}

              {/* Boton ver detalles */}
              <TouchableOpacity
                style={styles.detailsBtn}
                onPress={() => setSelectedRecord(record)}
              >
                <Text style={styles.detailsBtnText}>VER DETALLES {"\u2192"}</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* Boton cargar mas */}
        <TouchableOpacity style={styles.loadMoreBtn} onPress={loadRecords}>
          <Text style={styles.loadMoreText}>
            {"\u21BB"} ACTUALIZAR REGISTROS
          </Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={onSwitchToScan}>
          <Text style={styles.tabIcon}>{"\u2630"}</Text>
          <Text style={styles.tabText}>ESCANEAR</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabItem, styles.tabActive]}>
          <Text style={styles.tabIconActive}>{"\u27F2"}</Text>
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
  searchLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  searchRow: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#000",
    borderRadius: 6,
    padding: 10,
    color: "#000",
    fontSize: 13,
  },
  searchBtn: {
    backgroundColor: "#1e3a8a",
    borderWidth: 2,
    borderColor: "#000",
    borderRadius: 6,
    padding: 10,
    width: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  searchIcon: {
    fontSize: 18,
    color: "#fff",
  },
  recordCard: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#000",
    borderRadius: 6,
    padding: 14,
    marginBottom: 16,
  },
  recordHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
    flex: 1,
  },
  dateBadge: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  dateText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#000",
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "#000",
  },
  containerCode: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 10,
  },
  separator: {
    height: 1,
    backgroundColor: "#d1d5db",
    marginVertical: 8,
  },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  dataCol: {
    flex: 1,
  },
  dataDivider: {
    width: 1,
    backgroundColor: "#d1d5db",
    marginHorizontal: 12,
  },
  dataLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#6b7280",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  dataValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  dataValueEmpty: {
    color: "#9ca3af",
    fontStyle: "italic",
    fontSize: 13,
  },
  incidentBadge: {
    backgroundColor: "#fef3c7",
    borderWidth: 1,
    borderColor: "#f59e0b",
    borderRadius: 4,
    padding: 8,
    marginBottom: 12,
    alignItems: "center",
  },
  incidentBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#92400e",
  },
  detailsBtn: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#000",
    borderRadius: 6,
    padding: 12,
    alignItems: "center",
  },
  detailsBtnText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#000",
    letterSpacing: 0.5,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6b7280",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: "#9ca3af",
  },
  loadMoreBtn: {
    backgroundColor: "#1e3a8a",
    borderWidth: 2,
    borderColor: "#000",
    borderRadius: 6,
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },
  loadMoreText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#fff",
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
    fontSize: 11,
    fontWeight: "bold",
    color: "#000",
    marginTop: 2,
    letterSpacing: 0.5,
  },
  tabTextActive: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 2,
    letterSpacing: 0.5,
  },
});