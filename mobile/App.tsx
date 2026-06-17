import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoginScreen from "./src/screens/LoginScreen";
import CollectionScreen from "./src/screens/CollectionScreen";
import HistoryScreen from "./src/screens/HistoryScreen";

type TabType = "scan" | "history";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<TabType>("scan");

  // Verificar si hay sesión activa al iniciar
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (token) {
        setLoggedIn(true);
      }
    } catch (error) {
      console.error("Error al verificar sesión:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = async (result: any) => {
    setLoggedIn(true);
    setCurrentTab("scan");
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("userToken");
    await AsyncStorage.removeItem("user");
    setLoggedIn(false);
    setCurrentTab("scan");
  };

  const switchToScan = () => setCurrentTab("scan");
  const switchToHistory = () => setCurrentTab("history");

  if (loading) {
    return null; // O un splash screen
  }

  if (!loggedIn) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // Mostrar pantalla según pestaña activa
  if (currentTab === "history") {
    return (
      <HistoryScreen
        onSwitchToScan={switchToScan}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <CollectionScreen
      onLogout={handleLogout}
      onSwitchToHistory={switchToHistory}
    />
  );
}