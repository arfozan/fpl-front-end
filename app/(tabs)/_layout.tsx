import { BASE_URL } from "@/config";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { Image } from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function TabLayout() {
  const { user, fetchWithAuth } = useAuth();
  const [contractAlerts, setContractAlerts] = useState(0);

  useEffect(() => {
    if (!user) return;

    fetchWithAuth(`${BASE_URL}/api/my-team-players/`)
      .then((res) => res.json())
      .then((data) => setContractAlerts(data.expiring_contracts_count || 0))
      .catch(() => setContractAlerts(0));
  }, [user]);

  // ✅ Custom logo on the header
  const headerRight = () => (
    <Image
      source={require("../../assets/images/fhpl_logo.png")}
      style={{ width: 30, height: 30, marginRight: 15 }}
      resizeMode="contain"
    />
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "#8e8e93",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "News",
          headerRight,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="newspaper-outline" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="teams"
        options={{
          title: "Teams",
          headerRight,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="soccer" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="season"
        options={{
          title: "Seasons",
          headerRight,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="earth-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarBadge: contractAlerts > 0 ? contractAlerts : undefined,
          headerRight,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
