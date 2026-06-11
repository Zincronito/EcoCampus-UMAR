import React, { useState, useEffect } from "react";
import { View, Text } from "react-native";
//import AsyncStorage from "@react-native-async-storage/async-storage";
import LoginScreen from "./src/screens/LoginScreen";

// export default function App() {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     checkToken();
//   }, []);

//   const checkToken = async () => {
//     try {
//       const token = await AsyncStorage.getItem("userToken");
//       const userData = await AsyncStorage.getItem("user");
//       if (token && userData) {
//         setUser(JSON.parse(userData));
//       }
//     } catch (error) {
//       console.error("Error checking token:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) {
//     return (
//       <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//         <Text>Cargando...</Text>
//       </View>
//     );
//   }

//   if (!user) {
//     return <LoginScreen onLoginSuccess={(userData) => setUser(userData)} />;
//   }

//   return (
//     <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//       <Text style={{ fontSize: 20 }}>¡Bienvenido {user.fullName}!</Text>
//       <Text>Rol: {user.role}</Text>
//     </View>
//   );
// }

export default function App() {
  const [user, setUser] = useState(null);

  if (!user) {
    return <LoginScreen onLoginSuccess={(userData) => setUser(userData)} />;
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 20 }}>¡Bienvenido {user.fullName}!</Text>
      <Text>Rol: {user.role}</Text>
    </View>
  );
}