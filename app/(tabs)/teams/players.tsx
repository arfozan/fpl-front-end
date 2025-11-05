import { Link } from "expo-router";
import { useEffect, useState } from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { BASE_URL } from "../../../config";

interface Player {
  id: number;
  full_name: string;
  position: string;
  team_name: string;
}

export default function PlayersScreen() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`${BASE_URL}/api/players/`)
      .then((res) => res.json())
      .then((data) => setPlayers(data))
      .catch((err) => console.error("Error fetching players:", err));
  }, []);

  const filteredPlayers = players.filter((p) =>
    p.full_name.toLowerCase().includes(search.toLowerCase())
  );

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
}

const styles = StyleSheet.create({
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
