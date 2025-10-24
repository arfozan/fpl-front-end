import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { Dimensions, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View, } from "react-native";
import { SceneMap, TabBar, TabView } from "react-native-tab-view";
import { BASE_URL } from "../../config";

interface Team {
  id: number;
  name: string;
  logo: string;
  manager_name: string;
  current_balance: number;
  forecast_end_balance: number;
}

interface Player {
  id: number;
  full_name: string;
  position: string;
  team_name: string;
}

const initialLayout = { width: Dimensions.get("window").width };

export default function TeamsScreen() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "teams", title: "Teams" },
    { key: "players", title: "Players" },
  ]);

  useEffect(() => {
    fetch(`${BASE_URL}/api/team-summary/`)
      .then((res) => res.json())
      .then((data) => setTeams(data))
      .catch((err) => console.error("Error fetching teams:", err));

    fetch(`${BASE_URL}/api/players/`)
      .then((res) => res.json())
      .then((data) => setPlayers(data))
      .catch((err) => console.error("Error fetching players:", err));
  }, []);

  // ----------- TEAMS TAB ----------
  const renderTeam = ({ item }: { item: Team }) => (
    <Link href={`/team/${item.id}`} asChild>
      <TouchableOpacity style={styles.card}>
        <Image source={{ uri: item.logo }} style={styles.logo} resizeMode="contain" />
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.manager}>Manager: {item.manager_name}</Text>
        <Text style={styles.balance}>Balance: {item.current_balance.toFixed(2)}</Text>
        <Text style={styles.balance}>Forecast: {item.forecast_end_balance.toFixed(2)}</Text>
      </TouchableOpacity>
    </Link>
  );

  const TeamsTab = () => (
    <FlatList
      data={teams}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderTeam}
      numColumns={2}
      contentContainerStyle={{ padding: 10 }}
    />
  );

  // ----------- PLAYERS TAB ----------
  const renderPlayer = ({ item }: { item: Player }) => (
    <Link href={`/team/player/${item.id}`} asChild>
      <TouchableOpacity style={styles.playerCard}>
        <View>
          <Text style={styles.playerName}>{item.full_name}</Text>
          <Text style={styles.playerInfo}>
            {item.position} • {item.team_name}
          </Text>
        </View>
      </TouchableOpacity>
    </Link>
  );

  const PlayersTab = () => {
    const [search, setSearch] = useState("");

    const filteredPlayers = players.filter((p) =>
      p.full_name.toLowerCase().includes(search.toLowerCase())
    );

    return (
      <View style={{ flex: 1 }}>
        <TextInput
          placeholder="Search players..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchBox}
        />
        <FlatList
          data={filteredPlayers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderPlayer}
          contentContainerStyle={{ padding: 10 }}
          keyboardShouldPersistTaps="handled"
        />
      </View>
    );
  };

  // ----------- RENDER SCENES ----------
  const renderScene = SceneMap({
    teams: TeamsTab,
    players: PlayersTab,
  });

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      initialLayout={initialLayout}
      renderTabBar={(props) => (
        <TabBar
          {...props}
          indicatorStyle={{ backgroundColor: "white" }}
          style={{ backgroundColor: "#1e40af" }}
        />
      )}
    />
  );
}

const cardWidth = (Dimensions.get("window").width / 2) - 24;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: "#f8f9fa",
  },
  card: {
    width: cardWidth,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    margin: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: "center",
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
  },
  manager: {
    fontSize: 12,
    color: "#555",
    textAlign: "center",
  },
  balance: {
    fontSize: 13,
    marginTop: 6,
    color: "#007BFF",
    fontWeight: "500",
  },

  playerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 10,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  playerPhoto: { width: 50, height: 50, marginRight: 10 },
  playerName: { fontSize: 16, fontWeight: "600" },
  playerInfo: { fontSize: 12, color: "#666" },

  searchBox: {
    backgroundColor: "white",
    padding: 10,
    margin: 10,
    borderRadius: 8,
    borderColor: "#ddd",
    borderWidth: 1,
  },
});
