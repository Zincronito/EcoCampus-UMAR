import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoginScreen from "./src/screens/LoginScreen";
import WelcomeScreen from "./src/screens/WelcomeScreen";
import QRScannerScreen from "./src/screens/QRScannerScreen";
import ScanSuccessScreen from "./src/screens/ScanSuccessScreen";
import CollectionScreen from "./src/screens/CollectionScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import SubmitSuccessScreen from "./src/screens/SubmitSuccessScreen";
import { syncService } from "./src/services/syncService";

type ScreenType =
  | "welcome"
  | "scanner"
  | "scanSuccess"
  | "collection"
  | "history"
  | "submitSuccess";

interface SuccessData {
  container_code: string;
  category_name: string;
  weight: number;
  has_incident: boolean;
  timestamp: string;
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<ScreenType>("welcome");
  const [user, setUser] = useState<any>(null);
  const [successData, setSuccessData] = useState<SuccessData | null>(null);
  const [selectedContainer, setSelectedContainer] = useState<any>(null);

  useEffect(() => {
    checkSession();
  }, []);

  //iniciar auto-sync de la cola offline cuando la app se arranca
  useEffect(() => {
    const unsubscribe = syncService.startAutoSync();
    return () => unsubscribe();
  }, []);

  const checkSession = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const userData = await AsyncStorage.getItem("user");

      if (token) {
        setLoggedIn(true);
        if (userData) {
          setUser(JSON.parse(userData));
        }

        const hideWelcome = await AsyncStorage.getItem("hideWelcomeScreen");
        if (hideWelcome === "true") {
          setCurrentScreen("scanner");
        } else {
          setCurrentScreen("welcome");
        }
      }
    } catch (error) {
      console.error("Error al verificar sesión:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = async (result: any) => {
    setLoggedIn(true);
    setUser(result.user);

    const hideWelcome = await AsyncStorage.getItem("hideWelcomeScreen");
    if (hideWelcome === "true") {
      setCurrentScreen("scanner");
    } else {
      setCurrentScreen("welcome");
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("userToken");
    await AsyncStorage.removeItem("user");
    setLoggedIn(false);
    setUser(null);
    setCurrentScreen("welcome");
    setSuccessData(null);
    setSelectedContainer(null);
  };

  const handleWelcomeContinue = () => {
    setCurrentScreen("scanner");
  };

  const handleContainerDetected = (container: any) => {
    setSelectedContainer(container);
    setCurrentScreen("scanSuccess");
  };

  const handleScanSuccessContinue = () => {
    setCurrentScreen("collection");
  };

  const handleScanCancel = () => {
    setSelectedContainer(null);
    setCurrentScreen("scanner");
  };

  const handleSubmitSuccess = (data: SuccessData) => {
    setSuccessData(data);
    setSelectedContainer(null);
    setCurrentScreen("submitSuccess");
  };

  const handleNewScan = () => {
    setSuccessData(null);
    setSelectedContainer(null);
    setCurrentScreen("scanner");
  };

  const switchToScanner = () => {
    setSelectedContainer(null);
    setCurrentScreen("scanner");
  };

  const switchToHistory = () => setCurrentScreen("history");

  if (loading) {
    return null;
  }

  if (!loggedIn) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  if (currentScreen === "welcome") {
    return <WelcomeScreen user={user} onContinue={handleWelcomeContinue} />;
  }

  if (currentScreen === "scanner") {
    return (
      <QRScannerScreen
        onContainerDetected={handleContainerDetected}
        onSwitchToHistory={switchToHistory}
        onLogout={handleLogout}
      />
    );
  }

  if (currentScreen === "scanSuccess" && selectedContainer) {
    return (
      <ScanSuccessScreen
        container={selectedContainer}
        onContinue={handleScanSuccessContinue}
        onCancel={handleScanCancel}
        onSwitchToHistory={switchToHistory}
      />
    );
  }

  if (currentScreen === "collection" && selectedContainer) {
    return (
      <CollectionScreen
        onLogout={handleLogout}
        onSwitchToHistory={switchToHistory}
        onSubmitSuccess={handleSubmitSuccess}
        preselectedContainer={selectedContainer}
        onBackToScanner={switchToScanner}
      />
    );
  }

  if (currentScreen === "submitSuccess" && successData) {
    return (
      <SubmitSuccessScreen
        data={successData}
        onNewScan={handleNewScan}
        onSwitchToHistory={switchToHistory}
      />
    );
  }

  if (currentScreen === "history") {
    return (
      <HistoryScreen onSwitchToScan={switchToScanner} onLogout={handleLogout} />
    );
  }

  return <QRScannerScreen
    onContainerDetected={handleContainerDetected}
    onSwitchToHistory={switchToHistory}
    onLogout={handleLogout}
  />;
}