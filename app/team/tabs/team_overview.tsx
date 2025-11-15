import { BASE_URL } from "@/config";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Player {
  id: number;
  full_name: string;
  photo: string;
  club_name: string;
  position: string;
  base_price: number;
  points: number;
}

interface Rank {
  season: string;
  league_rank: number | null;
  ucl_rank: number | null;
}

interface Achievement {
    blon_count: number;
    blon_winning_season: string[];
    league_champion: string | null;
    league_runner_up: string | null;
    ucl_champion: string | null;
    ucl_runner_up: string | null;
    ranks: Rank[];
}

interface TeamOverview {
  team_name: string;
  logo: string;
  total_weekly_wage: number;
  forecast_end_balance: number;
  current_balance: number;
  current_wage_cost: number;
  total_yearly_wage: number;
  total_players: number;
  academy_players: number;
  achievements: Achievement[];
  manager_name: string;
  manager_photo: string;
  top_players: Player[];
}


export default function TeamOverview({ teamId }: { teamId: string }) {
  const router = useRouter();
  const [data, setData] = useState<TeamOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) return;

    const fetchData = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/team/${teamId}/overview`);
        setData(res.data);
      } catch (error) {
        console.error("Error fetching team overview:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [teamId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <Text>Failed to load team data.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Team Header */}
      <View style={styles.headerCard}>
        <Image source={{ uri: data.logo }} style={styles.teamLogo} />
        <View style={{ flex: 1,alignItems:"flex-end"}}>
          <Text style={styles.teamName}>{data.team_name}</Text>
          <Text style={styles.manager}>Manager: {data.manager_name}</Text>
          <View style={styles.balanceBox}>
            <Text style={styles.balanceText}>Current Balance: {data.current_balance.toFixed(2)}M</Text>
            <Text style={styles.balanceText}>Forecast: {data.forecast_end_balance.toFixed(2)}M</Text>
            <Text style={styles.balanceText}>Wage/Week: {data.total_weekly_wage.toFixed(3)}</Text>
            <Text style={styles.balanceText}>Current Wage Cost: {data.current_wage_cost.toFixed(2)}</Text>
            <Text style={styles.balanceText}>Total Yearly Wage: {data.total_yearly_wage.toFixed(2)}</Text>
            <Text style={styles.balanceText}>Total Players: {data.total_players} (Academy: {data.academy_players})</Text>
          </View>
        </View>
      </View>

      {/* Top Players */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⭐ Top Players</Text>
        <FlatList
          data={data.top_players}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.playerCard}
              onPress={() => router.push(`/team/player/${item.id}`)}
            >
              <Image source={{ uri: item.photo }} style={styles.playerPhoto} />
              <View style={{ flex: 1 }}>
                <Text style={styles.playerName}>{item.full_name}</Text>
                <Text style={styles.playerSub}>
                  {item.position} • {item.club_name}
                </Text>
                <Text style={styles.playerSub}>
                  Points: {item.points} | Base: {item.base_price}M
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>

{/* BLON Card */}
        {data.achievements?.length > 0 && data.achievements[0] && (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>🥇 BLON Achievements</Text>
            {data.achievements.map((a, i) => (
            <View key={i} style={styles.blonCard}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Image
                    source={{ uri: data.manager_photo }}
                    style={styles.managerPhoto}
                />
                    <View style={{ marginLeft: 10 }}>
                        {a.blon_count > 0 ? (
                            <Text>{a.blon_count}X Ballon d'Or Winner</Text>
                        ) : (
                        <Text style={{ fontSize: 16, fontWeight: "600", color: "#888" }}>
                            No Ballon d'Or yet
                        </Text>
                        )}
                        <Text style={styles.managerName}>{data.manager_name}</Text>
                        {/* Winning Seasons */}
                        {a.blon_winning_season ? (
                        <Text style={{ marginTop: 6 }}>
                            ({a.blon_winning_season})
                        </Text>
                        ) : (
                        <Text style={{ marginTop: 6, color: "#888" }}>
                            None
                        </Text>
                        )}
                    </View>
                </View>
            </View>
            ))}
        </View>
        )}

        {/* League & UCL Achievements */}
        {data.achievements?.length > 0 && (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏆 League & UCL Achievements</Text>
            {data.achievements.map((a, i) => (
            <View key={i} style={styles.achievementCard}>
                <Text>League Champion: {a.league_champion || "—"}</Text>
                <Text>Runner Up: {a.league_runner_up || "—"}</Text>
                <Text>UCL Champion: {a.ucl_champion || "—"}</Text>
                <Text>UCL Runner Up: {a.ucl_runner_up || "—"}</Text>

                {a.ranks?.length > 0 && (
                <>
                    <Text style={styles.sectionSubtitle}>Recent Ranks:</Text>
                    {a.ranks.map((r, idx) => (
                    <Text key={idx}>
                        {r.season}: League {r.league_rank ?? "—"} | UCL{" "}
                        {r.ucl_rank ?? "—"}
                    </Text>
                    ))}
                </>
                )}
            </View>
            ))}
        </View>
        )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: "#f9f9f9",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    elevation: 2,
  },
  teamLogo: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 12,
  },
  teamName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
  },
  manager: {
    fontSize: 15,
    color: "#666",
  },
  balanceBox: {
    marginTop: 8,
  },
  balanceText: {
    fontSize: 14,
    color: "#333",
    alignSelf: "flex-end",
  },
  section: {
    marginBottom: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    color: "#111",
  },
  sectionSubtitle: {
    fontWeight: "600",
    marginTop: 6,
  },
  achievementCard: {
    backgroundColor: "#f3f3f3",
    borderRadius: 10,
    padding: 10,
    marginTop: 5,
  },
  playerCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    marginVertical: 5,
    elevation: 1,
  },
  playerPhoto: {
    width: 40,
    height: 55,
    borderRadius: 2,
    marginRight: 10,
  },
  playerName: {
    fontSize: 16,
    fontWeight: "600",
  },
  playerSub: {
    color: "#666",
    fontSize: 13,
  },
    blonCard: {
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    padding: 10,
    marginVertical: 6,
    elevation: 1,
  },
  managerPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  managerName: {
    fontSize: 16,
    fontWeight: "600",
  },
});
