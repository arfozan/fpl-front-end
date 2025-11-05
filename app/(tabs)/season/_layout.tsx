import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { withLayoutContext } from "expo-router";

const { Navigator } = createMaterialTopTabNavigator();
export const Tabs = withLayoutContext(Navigator);

export default function SeasonLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#007AFF",
        tabBarIndicatorStyle: { backgroundColor: "#007AFF" },
        tabBarStyle: { backgroundColor: "#fff" },
        tabBarLabelStyle: { fontWeight: "600" },
        lazy: true,
      }}
    >
        <Tabs.Screen name="index" options={{ title: "League Table" }}/>
        <Tabs.Screen name="matches" options={{ title: "Matches" }}/>
        <Tabs.Screen name="bonus" options={{ title: "Bonus Earned" }}/>
    </Tabs>
    
  );
}
