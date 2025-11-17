import RefreshableWrapper from "@/components/RefreshableWrapper";
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

const SCREEN_WIDTH = Dimensions.get("window").width;
const cardWidth = (SCREEN_WIDTH - 10 * 2 - 10) / 2; 

export default function TeamsScreen() {
  const [teams, setTeams] = useState<Team[]>([]);

  const refreshTeams = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/team-summary/`);
      const data = await res.json();
      setTeams(data);
    } catch (err) {
      console.error("Error refreshing teams:", err);
    }
  };

  useEffect(() => {
    refreshTeams();    // ← load automatically on first render
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
          Forecast: {item.forecast_end_balance.toFixed(2)}
        </Text>
      </TouchableOpacity>
    </Link>
  );

  return (
    <RefreshableWrapper onRefresh={refreshTeams}>
      <FlatList
        data={teams}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderTeam}
        numColumns={2}
        contentContainerStyle={{ paddingHorizontal: 10, paddingTop: 10 }}
        columnWrapperStyle={{ justifyContent: "center" }}
      />
    </RefreshableWrapper>
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
