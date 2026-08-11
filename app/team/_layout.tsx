import { Stack } from "expo-router";

export default function TeamLayout() {
  return (
    <Stack>
      <Stack.Screen name="team" options={{ title: "Teams" }} />

      <Stack.Screen
        name="[id]"
        options={{
          title: "Team",          
          headerBackTitle: "Back",
        }}
      />

      <Stack.Screen
        name="player/[id]"
        options={{ title: "Player Details" }}
      />
    </Stack>
  );
}