import {
    createMaterialTopTabNavigator,
    MaterialTopTabNavigationEventMap,
    MaterialTopTabNavigationOptions,
} from "@react-navigation/material-top-tabs";
import { ParamListBase, TabNavigationState } from "@react-navigation/native";
import { withLayoutContext } from "expo-router";

const { Navigator } = createMaterialTopTabNavigator();

export const Tabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof Navigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(Navigator);

export default function TeamsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#fff",
        tabBarIndicatorStyle: { backgroundColor: "#fff" },
        tabBarStyle: { backgroundColor: "#1e40af" },
        tabBarLabelStyle: { fontWeight: "600" },
        lazy: true, // ✅ only load tabs when needed
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Teams" }} />
      <Tabs.Screen name="players" options={{ title: "Players" }} />
    </Tabs>
  );
}
