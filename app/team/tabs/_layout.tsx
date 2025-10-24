import { Tabs } from "expo-router";

export default function TeamTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true, // show stack header if you want
        tabBarLabelStyle: { fontSize: 12 },
      }}
    >
      <Tabs.Screen
        name="MatchesTab"
        options={{ title: "Matches" }}
      />
      <Tabs.Screen
        name="SquadTab"
        options={{ title: "Squad" }}
      />
      <Tabs.Screen
        name="TransferTab"
        options={{ title: "Transfers" }}
      />
    </Tabs>
  );
}
