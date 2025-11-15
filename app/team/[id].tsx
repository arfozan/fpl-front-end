import { BASE_URL } from "@/config";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useLayoutEffect, useState } from "react";
import { ActivityIndicator, Dimensions, Text, View } from "react-native";
import { TabView } from "react-native-tab-view";

import MatchesTab from "./tabs/MatchesTab";
import SquadTab from "./tabs/SquadTab";
import TeamOverview from "./tabs/team_overview";
import TransfersTab from "./tabs/TransferTab";

const initialLayout = { width: Dimensions.get("window").width };

export default function TeamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [team, setTeam] = useState<any>(null);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "team_overview", title: "Summary" },
    { key: "team", title: "Squad" },
    { key: "transfers", title: "Transfers" },
    { key: "matches", title: "Matches" },
  ]);

  const navigation = useNavigation();

  useEffect(() => {
    Promise.all([
      fetch(`${BASE_URL}/api/team/${id}/`).then((res) => res.json()),
      fetch(`${BASE_URL}/api/team/${id}/transfers/`).then((res) => res.json()),
    ])
      .then(([teamData, transferData]) => {
        setTeam(teamData);
        setTransfers(transferData);
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Set the header title dynamically
  useLayoutEffect(() => {
    if (team) {
      navigation.setOptions({
        title: team.name, // now will replace [id] in header
      });
    }
  }, [team, navigation]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!team) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Team not found</Text>
      </View>
    );
  }

  const renderScene = ({ route }: { route: { key: string } }) => {
    switch (route.key) {
      case "team_overview":
        return <TeamOverview teamId={id} />;
      case "team":
        return <SquadTab team={team} />;
      case "transfers":
        return <TransfersTab team={team} transfers={transfers} />;
      case "matches":
        return <MatchesTab teamId={id} />;
      default:
        return null;
    }
  };

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      initialLayout={initialLayout}
    />
  );
}