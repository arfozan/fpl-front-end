// app/_layout.tsx
import { Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "../context/AuthContext";

function AuthenticatedLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      {user ? <Stack.Screen name="myteam" /> : <Stack.Screen name="login" />}
      <Stack.Screen
        name="free-agent-screen"
        options={{
          title: "Free Agents",
          headerBackTitle: "Back",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: "Settings",
          headerBackTitle: "Back",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="squad"
        options={{
          title: "Settings",
          headerBackTitle: "Back",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="transfer"
        options={{
          title: "Make Transfer",
          headerBackTitle: "Back",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="available_players"
        options={{
          title: "Players",
          headerBackTitle: "Back",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="IncomingRequest"
        options={{
          title: "Transfer Request ",
          headerBackTitle: "Back",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: "Make Transfer Request ",
          headerBackTitle: "Back",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="news/[id]"
        options={{
          title: "News",
          headerBackTitle: "Back",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="create_news"
        options={{
          title: "Write a News",
          headerBackTitle: "Back",
          headerShown: true,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthenticatedLayout />
    </AuthProvider>
  );
}
