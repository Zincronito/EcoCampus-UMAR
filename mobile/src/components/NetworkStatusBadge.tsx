import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import NetInfo from "@react-native-community/netinfo";

interface NetworkStatusBadgeProps {
  style?: any;
  compact?: boolean; // Si true, solo muestra el punto sin texto
}

export default function NetworkStatusBadge({ style, compact = false }: NetworkStatusBadgeProps) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Estado inicial
    NetInfo.fetch().then((state) => {
      setIsOnline(!!(state.isConnected && state.isInternetReachable));
    });

    // Listener continuo
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(!!(state.isConnected && state.isInternetReachable));
    });

    return () => unsubscribe();
  }, []);

  return (
    <View style={[styles.badge, style]}>
      <View
        style={[
          styles.dot,
          { backgroundColor: isOnline ? "#10b981" : "#ef4444" },
        ]}
      />
      {!compact && (
        <Text style={styles.text}>{isOnline ? "EN LÍNEA" : "SIN CONEXIÓN"}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  text: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
    letterSpacing: 0.5,
  },
});