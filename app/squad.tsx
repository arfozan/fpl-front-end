import RefreshableWrapper from "@/components/RefreshableWrapper";
import { BASE_URL } from "@/config";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../context/AuthContext";

type Player = {
  id: number;
  full_name: string;
  position: string;
  photo?: string | null;
  weekly_wage?: number;
  is_loan?: boolean;
  is_academy_player?: boolean;
  loan_from_team_name?: string | null;
  contract_expiry?: number | null;
  // ...other fields from serializer
};

export default function Squad() {
  const { user, fetchWithAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const POSITION_LABELS: Record<string, string> = {
  GK: "Goalkeepers",
  DF: "Defenders",
  MF: "Midfielders",
  FW: "Forwards",
  };

  const POSITION_ORDER: Record<string, number> = {
    GK: 1,
    DF: 2,
    MF: 3,
    FW: 4,
  };

  function groupPlayersByPosition(players: Player[]) {
    const grouped: Record<string, Player[]> = {};

    for (const player of players) {
      if (!grouped[player.position]) {
        grouped[player.position] = [];
      }
      grouped[player.position].push(player);
    }

    // Sort by POSITION_ORDER
    return Object.keys(grouped)
      .sort((a, b) => (POSITION_ORDER[a] || 99) - (POSITION_ORDER[b] || 99))
      .map((pos) => ({
        title: POSITION_LABELS[pos] || pos,
        data: grouped[pos],
      }));
  }
  type PlayerGroup = {
    title: string;
    data: Player[];
  };

  const [players, setPlayers] = useState<PlayerGroup[]>([]);
  const [groupedPlayers, setGroupedPlayers] = useState<{
    main: { title: string; data: Player[] }[];
    academy: { title: string; data: Player[] }[];
  }>({ main: [], academy: [] });

  const loadPlayers = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${BASE_URL}/api/my-team-players/`);
      if (!res.ok) {
        console.error("Failed to fetch players:", res.status);
        return;
      }

      const data = await res.json();
      const playersList = Array.isArray(data) ? data : data.players ?? [];

      const academyPlayers = playersList.filter(p => p.is_academy_player);
      const mainPlayers = playersList.filter(p => !p.is_academy_player);

      setGroupedPlayers({
        main: groupPlayersByPosition(mainPlayers),
        academy: groupPlayersByPosition(academyPlayers),
      });
    } catch (err) {
      console.error("Error loading players:", err);
    } finally {
      setLoading(false);
    }
  };

// ✅ Now just call it here
useEffect(() => {
  if (user) loadPlayers();
}, [user]);


  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  return (
    <RefreshableWrapper onRefresh={{loadPlayers}}>
      <LinearGradient
        colors={['#d6bb42ff', '#9e1818ff']} // startColor, endColor
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}
        >
        <Image
          source={{ uri: user.logo }}
          style={styles.teamLogo}
          resizeMode="contain"
        />
        <Text style={styles.teamName}>{user.name}</Text>
      </LinearGradient>
      <View style={{ backgroundColor: "#608ed3ff", padding: 12, borderRadius: 12, marginBottom: 16, elevation: 2, marginLeft:10, marginRight:10 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 8, textAlign: "center" }}>Main Squad</Text>
        {groupedPlayers.main.map((group) => (
          <View key={group.title} style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 6 }}>{group.title}</Text>
            {group.data.map((item) => (
              <Link key={item.id} href={`/my_squad/${item.id}`} asChild>
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor:
                      item.weekly_wage === 0
                      ? "#ff4d4d" // 🔴 strong red: unavailable
                      : !item.contract_expiry
                      ? "#fdd054ff" // 🔸 light red: no contract yet
                      : "#fff", // ✅ normal
                    padding: 10,
                    marginBottom: 8,
                    borderRadius: 8,
                    elevation: 2,
                  }}
                >
                  {item.photo && (
                    <Image
                      source={{ uri: item.photo }}
                      style={{
                        width: 30,
                        height: 50,
                        borderRadius: 2,
                        marginRight: 10,
                      }}
                    />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "bold" }}>{item.full_name}</Text>
                    <Text>
                      Expire : {item.contract_expiry}{item.weekly_wage ? ` || Wage: ${item.weekly_wage}` : ""}
                    </Text>
                    {item.is_loan && item.loan_from_team_name && (
                      <Text style={{ color: "#666" }}>Loaned from {item.loan_from_team_name}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              </Link>
            ))}
          </View>
        ))}
      </View>

      {/* Academy Card */}
      <View style={{ backgroundColor: "#e2863aff", padding: 12, borderRadius: 12, marginLeft:10, marginRight:10, elevation: 2, marginBottom: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 8, textAlign: "center"}}>Academy Player</Text>
        {groupedPlayers.academy.map((group) => (
          <View key={group.title} style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 6 }}>{group.title}</Text>
            {group.data.map((item) => (
              <Link key={item.id} href={`/my_squad/${item.id}`} asChild>
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor:
                      item.weekly_wage === 0
                      ? "#ff4d4d"
                      : !item.contract_expiry
                      ? "#fdd054ff"
                      : "#fff",
                    padding: 10,
                    marginBottom: 8,
                    borderRadius: 8,
                  }}
                >
                  {item.photo && (
                    <Image
                      source={{ uri: item.photo }}
                      style={{
                        width: 30,
                        height: 50,
                        borderRadius: 2,
                        marginRight: 10,
                      }}
                    />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "bold" }}>{item.full_name}</Text>
                    <Text>
                      {item.position} {item.weekly_wage ? `• Wage: ${item.weekly_wage}` : ""}
                    </Text>
                  </View>
                </TouchableOpacity>
              </Link>
            ))}
          </View>
        ))}
        </View>
    </RefreshableWrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 300,
    height: 200,
    backgroundColor: '#fff',
    borderRadius: 20,
    elevation: 4, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    justifyContent: 'center', // Vertically center text
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 10,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 1,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 100,
    elevation: 10,
    width: "100%",
    justifyContent: "center",
    marginBottom: 20,
    alignSelf: 'center',
  },
  teamLogo: {
    width: 50,
    height: 50,
    marginRight: 12,
  },
  teamName: {
    fontSize: 20,
    fontWeight: "700",
  },
});
