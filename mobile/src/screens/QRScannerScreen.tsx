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
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { containerService } from "../services/authService";

interface QRScannerScreenProps {
  onContainerDetected: (container: any) => void;
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

  const searchContainer = async (code: string) => {
    try {
      setSearching(true);
      const container = await containerService.getByCode(code.trim());
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
      Alert.alert("Error", "Ingresa un código de contenedor");
      return;
    }

    setManualInputVisible(false);
    await searchContainer(manualCode);
    setManualCode("");
  };

  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text style={styles.loadingText}>Cargando cámara...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onLogout}>
            <Text style={styles.backArrow}>{"\u2190"}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>GESTION DE RE..</Text>
          <Text style={styles.statusText}>EN LINEA</Text>
        </View>

        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Permiso de Cámara</Text>
          <Text style={styles.permissionText}>
            Necesitamos acceso a la cámara para escanear los códigos QR de los
            contenedores.
          </Text>
          <TouchableOpacity
            style={styles.permissionBtn}
            onPress={requestPermission}
          >
            <Text style={styles.permissionBtnText}>OTORGAR PERMISO</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.manualBtn}
            onPress={() => setManualInputVisible(true)}
          >
            <Text style={styles.manualBtnText}>
              INGRESAR ID MANUALMENTE {"\u270E"}
            </Text>
          </TouchableOpacity>
        </View>

        {renderManualInputModal()}
      </View>
    );
  }

  function renderManualInputModal() {
    return (
      <Modal
        visible={manualInputVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setManualInputVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ingresar ID del Contenedor</Text>
            <Text style={styles.modalHint}>
              Ejemplo: CONT-HUA-001
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="CONT-XXX-XXX"
              placeholderTextColor="#9ca3af"
              value={manualCode}
              onChangeText={setManualCode}
              autoCapitalize="characters"
              autoFocus
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => {
                  setManualInputVisible(false);
                  setManualCode("");
                }}
              >
                <Text style={styles.modalBtnTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnConfirm]}
                onPress={handleManualSubmit}
              >
                <Text style={styles.modalBtnText}>Buscar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onLogout}>
          <Text style={styles.backArrow}>{"\u2190"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>GESTION DE RE..</Text>
        <Text style={styles.statusText}>EN LINEA</Text>
      </View>

      <View style={styles.scannerContent}>
        <Text style={styles.mainTitle}>Escáner de Contenedor</Text>
        <Text style={styles.subtitle}>
          Alinee el código QR del contenedor dentro del marco.
        </Text>

        {/* Marco de cámara */}
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
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.searchingText}>Buscando contenedor...</Text>
            </View>
          )}
        </View>

        {/* Botón Ingresar Manualmente */}
        <TouchableOpacity
          style={styles.manualBtnInline}
          onPress={() => setManualInputVisible(true)}
        >
          <Text style={styles.manualBtnInlineText}>
            INGRESAR ID MANUALMENTE {"\u270E"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tabItem, styles.tabActive]}>
          <Text style={styles.tabIconActive}>{"\u2630"}</Text>
          <Text style={styles.tabTextActive}>ESCANEAR</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={onSwitchToHistory}>
          <Text style={styles.tabIcon}>{"\u27F2"}</Text>
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
  backArrow: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e40af",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    flex: 1,
    textAlign: "center",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1e40af",
    letterSpacing: 0.5,
  },
  scannerContent: {
    flex: 1,
    padding: 16,
    alignItems: "center",
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
  },
  cameraContainer: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#000",
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
    borderWidth: 2,
    borderColor: "#000",
    marginBottom: 20,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  scanFrame: {
    width: "70%",
    aspectRatio: 1,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: "#3b82f6",
    borderWidth: 4,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  searchingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  searchingText: {
    color: "#fff",
    marginTop: 10,
    fontSize: 14,
    fontWeight: "bold",
  },
  manualBtnInline: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#000",
    borderRadius: 6,
    padding: 14,
    width: "100%",
    alignItems: "center",
  },
  manualBtnInlineText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#000",
    letterSpacing: 0.5,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 12,
    textAlign: "center",
  },
  permissionText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  permissionBtn: {
    backgroundColor: "#1e3a8a",
    padding: 14,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#000",
    marginBottom: 12,
  },
  permissionBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  manualBtn: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#000",
  },
  manualBtnText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#000",
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    borderWidth: 2,
    borderColor: "#000",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 6,
  },
  modalHint: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 14,
    fontStyle: "italic",
  },
  modalInput: {
    backgroundColor: "#f3f4f6",
    borderWidth: 2,
    borderColor: "#000",
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    color: "#000",
    marginBottom: 20,
    fontWeight: "bold",
  },
  modalBtnRow: {
    flexDirection: "row",
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#000",
  },
  modalBtnCancel: {
    backgroundColor: "#fff",
  },
  modalBtnConfirm: {
    backgroundColor: "#1e3a8a",
  },
  modalBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  modalBtnTextCancel: {
    color: "#000",
    fontSize: 14,
    fontWeight: "bold",
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