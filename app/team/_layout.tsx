import { Stack } from "expo-router";

export default function TeamLayout() {
  return (
    
    <Stack>
      {/* List screen (Teams) */}
      <Stack.Screen name="team" options={{ title: "Teams" }} />
      <Stack.Screen
        name="[id]"
        options={{
          headerBackTitle: "Back", // shows "Back" text (iOS)
        }}
      />
      <Stack.Screen name="player/[id]" options={{ title: "Player Details" }} />
    </Stack>
  );
}