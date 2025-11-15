import { Tabs } from "expo-router";

export default function TeamTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true, // show stack header if you want
        tabBarLabelStyle: { fontSize: 12 },
        lazy: true,
      }}
    >
      <Tabs.Screen
        name="team_overview"
        options={{ title: "Matches" }}
      />
      <Tabs.Screen
        name="Ma"
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
