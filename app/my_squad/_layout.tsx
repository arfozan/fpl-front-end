
import { Stack } from "expo-router";

export default function TeamLayout() {
  return (
    <Stack>
      {/* List screen (Teams) */}
      <Stack.Screen name="team" options={{ title: "Teams" }} />
      <Stack.Screen
        name="[id]"
        options={{
          title: "",
          headerBackTitle: "Back", // shows "Back" text (iOS)
        }}
      />
    </Stack>
  );
}