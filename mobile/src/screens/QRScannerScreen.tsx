import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
// Nota: Ajusté la ruta del import asumiendo que containerService tiene su propio archivo
import { containerService } from "../services/authService";
import {
  ArrowLeft,
  Edit3,
  ScanLine,
  RotateCcw,
  Camera,
  LogOut,
} from "lucide-react-native";
import NetworkStatusBadge from "../components/NetworkStatusBadge";
import { RefreshCw } from "lucide-react-native";
import { catalogService } from "../services/catalogService";
// Interfaces de tipado de datos estrictas para la entrada
export interface ContainerData {
  id: string;
  code: string;
  category?: string;
  location?: string;
}

interface QRScannerScreenProps {
  onContainerDetected: (container: ContainerData) => void;
  onSwitchToHistory: () => void;
  onLogout: () => void;
}

export default function QRScannerScreen({
  onContainerDetected,
  onSwitchToHistory,
  onLogout,
}: QRScannerScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [searching, setSearching] = useState(false);
  const [manualInputVisible, setManualInputVisible] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned || searching) return;

    setScanned(true);
    await searchContainer(data);
  };
  const handleLogout = () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro de que quieres cerrar sesión? Los datos pendientes de sincronización no se perderán.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: onLogout,
        },
      ]
    );
  };
  const handleRefreshCatalog = async () => {
    try {
      setRefreshing(true);
      const result = await catalogService.downloadAll();
      if (result.success) {
        Alert.alert("Catálogo actualizado", "Los contenedores se han actualizado correctamente.");
      } else {
        Alert.alert("Sin conexión", "No se pudo actualizar el catálogo. Verifica tu conexión.");
      }
    } catch (error: any) {
      Alert.alert("Error", "No se pudo actualizar: " + error.message);
    } finally {
      setRefreshing(false);
    }
  };

  const searchContainer = async (code: string) => {
    try {
      setSearching(true);
      const container: ContainerData = await containerService.getByCode(code.trim());
      onContainerDetected(container);
    } catch (error: any) {
      Alert.alert(
        "Contenedor no encontrado",
        error.message || `No se encontró el código "${code}"`,
        [
          {
            text: "Intentar de nuevo",
            onPress: () => {
              setScanned(false);
              setSearching(false);
            },
          },
        ]
      );
    } finally {
      setSearching(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualCode.trim()) {
      Alert.alert("Dato requerido", "Por favor ingresa un código de contenedor válido.");
      return;
    }

    setManualInputVisible(false);
    await searchContainer(manualCode);
    setManualCode("");
  };

  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Iniciando módulo de cámara...</Text>
      </View>
    );
  }

  // Renderizado del Modal extraído para mayor limpieza
  const renderManualInputModal = () => (
    <Modal
      visible={manualInputVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setManualInputVisible(false)}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Ingreso Manual de ID</Text>
          <Text style={styles.modalHint}>
            Ejemplo de formato: CONT-HUA-001
          </Text>
          <TextInput
            style={styles.modalInput}
            placeholder="CONT-XXX-XXX"
            placeholderTextColor="#9ca3af"
            value={manualCode}
            onChangeText={setManualCode}
            autoCapitalize="characters"
            autoCorrect={false}
            autoFocus
          />
          <View style={styles.modalBtnRow}>
            <TouchableOpacity
              style={[styles.modalBtn, styles.modalBtnCancel]}
              onPress={() => {
                setManualInputVisible(false);
                setManualCode("");
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.modalBtnTextCancel}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, styles.modalBtnConfirm]}
              onPress={handleManualSubmit}
              activeOpacity={0.7}
            >
              <Text style={styles.modalBtnTextConfirm}>Buscar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleLogout} style={styles.backButton}>
            <LogOut size={22} color="#ef4444" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>SISTEMA DE ESCANEO</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>EN LÍNEA</Text>
          </View>
        </View>

        <View style={styles.permissionContainer}>
          <View style={styles.iconCircle}>
            <Camera size={32} color="#2563eb" strokeWidth={2} />
          </View>
          <Text style={styles.permissionTitle}>Acceso a Cámara</Text>
          <Text style={styles.permissionText}>
            Para registrar la recolección, necesitamos acceso a la cámara y así escanear los códigos QR de los contenedores.
          </Text>
          <TouchableOpacity
            style={styles.buttonPrimary}
            onPress={requestPermission}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonPrimaryText}>HABILITAR CÁMARA</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleLogout} style={styles.backButton}>
          <LogOut size={22} color="#ef4444" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SISTEMA DE ESCANEO</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TouchableOpacity onPress={handleRefreshCatalog} disabled={refreshing}>
            <RefreshCw
              size={20}
              color={refreshing ? "#94a3b8" : "#3b82f6"}
              strokeWidth={2.5}
            />
          </TouchableOpacity>
          <NetworkStatusBadge />
        </View>
      </View>

      <View style={styles.scannerContent}>
        <View style={styles.textContainer}>
          <Text style={styles.mainTitle}>Escáner de Contenedor</Text>
          <Text style={styles.subtitle}>
            Alinee el código QR dentro del marco para detectarlo automáticamente.
          </Text>
        </View>

        {/* Marco de cámara */}
        <View style={styles.cameraWrapper}>
          <View style={styles.cameraContainer}>
            <CameraView
              style={styles.camera}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ["qr"],
              }}
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            />

            {/* Overlay con marco de escaneo */}
            <View style={styles.overlay}>
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.cornerTopLeft]} />
                <View style={[styles.corner, styles.cornerTopRight]} />
                <View style={[styles.corner, styles.cornerBottomLeft]} />
                <View style={[styles.corner, styles.cornerBottomRight]} />
              </View>
            </View>

            {/* Indicador de búsqueda */}
            {searching && (
              <View style={styles.searchingOverlay}>
                <ActivityIndicator size="large" color="#ffffff" />
                <Text style={styles.searchingText}>Consultando base de datos...</Text>
              </View>
            )}
          </View>
        </View>

        {/* Botón Ingresar Manualmente */}
        <TouchableOpacity
          style={styles.manualBtnInline}
          onPress={() => setManualInputVisible(true)}
          activeOpacity={0.7}
        >
          <Edit3 size={18} color="#2563eb" strokeWidth={2.5} style={{ marginRight: 8 }} />
          <Text style={styles.manualBtnInlineText}>INGRESAR ID MANUALMENTE</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Bar */}
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

      {renderManualInputModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc", // Gris azulado súper claro
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 16,
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
    zIndex: 10, // Para que la sombra se vea sobre el contenido
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1e293b",
    flex: 1,
    textAlign: "center",
    letterSpacing: 1,
  },
  statusBadge: {
    backgroundColor: "#eff6ff", // Fondo azul claro
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
  scannerContent: {
    flex: 1,
    padding: 24,
    alignItems: "center",
  },
  textContainer: {
    width: "100%",
    marginBottom: 24,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0f172a",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
  },
  cameraWrapper: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 32,
  },
  cameraContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)", // Fondo semi-transparente para enfocar el centro
  },
  scanFrame: {
    width: "65%",
    aspectRatio: 1,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#ffffff",
    borderWidth: 5,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 12,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 12,
  },
  searchingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  searchingText: {
    color: "#ffffff",
    marginTop: 16,
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  manualBtnInline: {
    backgroundColor: "#eff6ff", // Fondo azul sutil
    borderRadius: 12,
    paddingVertical: 16,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  manualBtnInlineText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2563eb",
    letterSpacing: 0.5,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 12,
    textAlign: "center",
  },
  permissionText: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  buttonPrimary: {
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonPrimaryText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 8,
    textAlign: "center",
  },
  modalHint: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 20,
    textAlign: "center",
  },
  modalInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#0f172a",
    marginBottom: 24,
    fontWeight: "600",
    textAlign: "center",
  },
  modalBtnRow: {
    flexDirection: "row",
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnCancel: {
    backgroundColor: "#f1f5f9",
  },
  modalBtnConfirm: {
    backgroundColor: "#2563eb",
  },
  modalBtnTextCancel: {
    color: "#475569",
    fontSize: 15,
    fontWeight: "700",
  },
  modalBtnTextConfirm: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
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