import { Link } from "expo-router";
import { useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity
} from "react-native";
import { BASE_URL } from "../../../config";

interface Team {
  id: number;
  name: string;
  logo: string;
  manager_name: string;
  current_balance: number;
  forecast_end_balance: number;
}

const cardWidth = Dimensions.get("window").width / 2 - 24;

export default function TeamsScreen() {
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    fetch(`${BASE_URL}/api/team-summary/`)
      .then((res) => res.json())
      .then((data) => setTeams(data))
      .catch((err) => console.error("Error fetching teams:", err));
  }, []);

  const renderTeam = ({ item }: { item: Team }) => (
    <Link href={`/team/${item.id}`} asChild>
      <TouchableOpacity style={styles.card}>
        <Image
          source={{ uri: item.logo }}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.manager}>Manager: {item.manager_name}</Text>
        <Text style={styles.balance}>
          Balance: {item.current_balance.toFixed(2)}
        </Text>
        <Text style={styles.balance}>
          Predicted Balance: {item.forecast_end_balance.toFixed(2)}
        </Text>
      </TouchableOpacity>
    </Link>
  );

  return (
    <FlatList
      data={teams}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderTeam}
      numColumns={2}
      contentContainerStyle={{ padding: 10 }}
    />
  );
}

const styles = StyleSheet.create({
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
  logo: { width: 80, height: 80, marginBottom: 8 },
  name: { fontSize: 16, fontWeight: "600", textAlign: "center" },
  manager: { fontSize: 12, color: "#555", textAlign: "center" },
  balance: {
    fontSize: 13,
    marginTop: 6,
    color: "#007BFF",
    fontWeight: "500",
  },
});
