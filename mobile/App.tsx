import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoginScreen from "./src/screens/LoginScreen";
import WelcomeScreen from "./src/screens/WelcomeScreen";
import CollectionScreen from "./src/screens/CollectionScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import SubmitSuccessScreen from "./src/screens/SubmitSuccessScreen";

type ScreenType = "welcome" | "scan" | "history" | "success";

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

  useEffect(() => {
    checkSession();
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
          setCurrentScreen("scan");
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
      setCurrentScreen("scan");
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
  };

  const handleWelcomeContinue = () => {
    setCurrentScreen("scan");
  };

  const handleSubmitSuccess = (data: SuccessData) => {
    setSuccessData(data);
    setCurrentScreen("success");
  };

  const handleNewScan = () => {
    setSuccessData(null);
    setCurrentScreen("scan");
  };

  const switchToScan = () => setCurrentScreen("scan");
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

  if (currentScreen === "success" && successData) {
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
      <HistoryScreen onSwitchToScan={switchToScan} onLogout={handleLogout} />
    );
  }

  return (
    <CollectionScreen
      onLogout={handleLogout}
      onSwitchToHistory={switchToHistory}
      onSubmitSuccess={handleSubmitSuccess}
    />
  );
}