import { BASE_URL } from "@/config";
import { Picker } from "@react-native-picker/picker";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Match {
  id: number;
  home_team: number;
  away_team: number;
  home_team_name: string;
  away_team_name: string;
  home_score: number | null;
  away_score: number | null;
  round: { round_number: number; date: string }; // 👈 added
}

interface Season {
  id: number;
  season_name: string;
}

interface SeasonStat {
  wins: number;
  draws: number;
  losses: number;
  win_percentage: number;
}

export default function MatchesTab({ teamId }: { teamId: string }) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [opponents, setOpponents] = useState<{ id: string; name: string }[]>([
    { id: "all", name: "All Opponents" },
  ]);
  const [selectedOpponent, setSelectedOpponent] = useState("all");

  const [stats, setStats] = useState<SeasonStat | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSeasons();
  }, [teamId]);

  useEffect(() => {
    if (selectedSeason) {
      fetchSeasonData(selectedSeason, selectedOpponent);
    }
  }, [selectedSeason, selectedOpponent]);

  const fetchSeasons = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/seasons/`);
      const data = await res.json();
      setSeasons(data);
      if (data.length > 0) setSelectedSeason(data[0].id);
    } catch (err) {
      console.error("Error fetching seasons", err);
    }
  };

  const fetchSeasonData = async (seasonId: number, opponentId: string) => {
    try {
      setLoading(true);
      const url =
        `${BASE_URL}/api/season/${seasonId}/team/${teamId}/details/` +
        (opponentId && opponentId !== "all"
          ? `?opponent_team_id=${opponentId}`
          : "");
      const res = await fetch(url);
      const data = await res.json();
      setStats(data.stats);
      setMatches(data.matches);

      // collect opponents dynamically
      const opps = [
        { id: "all", name: "All Opponents" },
        ...Array.from(
          new Map(
            data.matches.map((m: Match) => {
              const isHome = m.home_team === Number(teamId);
              return [
                isHome ? m.away_team : m.home_team,
                isHome ? m.away_team_name : m.home_team_name,
              ];
            })
          ).entries()
        ).map(([id, name]) => ({ id: String(id), name })),
      ];
      setOpponents(opps);
    } catch (err) {
      console.error("Error fetching matches", err);
    } finally {
      setLoading(false);
    }
  };

  const getMatchColor = (match: Match): string => {
    if (match.home_score === null || match.away_score === null)
      return "#f9f9f9";
    const isHome = match.home_team === Number(teamId);
    const myScore = isHome ? match.home_score : match.away_score;
    const oppScore = isHome ? match.away_score : match.home_score;
    if (myScore > oppScore) return "#bdf4b4"; // green = win
    if (myScore < oppScore) return "#f7c0c0"; // red = loss
    return "#e4e4e4"; // gray = draw
  };

  const renderMatch = ({ item }: { item: Match }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.matchCard, { backgroundColor: getMatchColor(item) }]}
    >
      <View style={styles.matchHeader}>
        <Text style={styles.roundText}>
          🏆 GW{item.round?.round_number ?? "-"}
        </Text>
        <Text style={styles.dateText}>
          📅 {item.round?.date ? item.round.date : "No Date"}
        </Text>
      </View>

      <Text style={styles.matchText}>
        {item.home_team_name}{" "}
        <Text style={styles.scoreText}>
          {item.home_score ?? "-"} : {item.away_score ?? "-"}
        </Text>{" "}
        {item.away_team_name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Match History</Text>
      <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-around" }}>
        <View>
          <Text style={styles.label}>Select Season</Text>
          <View style={styles.pickerBox}>
            <Picker
              selectedValue={selectedSeason}
              onValueChange={(val) => setSelectedSeason(val)}
              style={styles.picker}
            >
              {seasons.map((s) => (
                <Picker.Item key={s.id} label={s.season_name} value={s.id} />
              ))}
            </Picker>
          </View>
        </View>
        

        {/* Opponent Picker */}
        <View>
          <Text style={styles.label}>Filter by Opponent</Text>
            <View style={styles.pickerBox}>
              <Picker
                selectedValue={selectedOpponent}
                onValueChange={(val) => setSelectedOpponent(val)}
                style={styles.picker}
              >
                {opponents.map((opp) => (
                  <Picker.Item key={opp.id} label={opp.name} value={opp.id} />
                ))}
              </Picker>
            </View>
          </View>
      </View>

      {/* Stats */}
      {stats && (
        <View style={styles.statsBox}>
          <Text style={styles.statsTitle}>📊 Team Stats</Text>
          <View style={styles.statsRow}>
            <Text style={styles.statText}>Wins: {stats.wins}</Text>
            <Text style={styles.statText}>Draws: {stats.draws}</Text>
            <Text style={styles.statText}>Losses: {stats.losses}</Text>
            <Text style={styles.statText}>
              Win %: {stats.win_percentage?.toFixed(1)}%
            </Text>
          </View>
        </View>
      )}

      {/* Matches */}
      {loading ? (
        <ActivityIndicator size="large" color="#007aff" style={{ marginTop: 20 }} />
      ) : matches.length > 0 ? (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMatch}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      ) : (
        <Text style={styles.noMatchText}>No matches found.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fafafa" },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginVertical: 10,
    color: "#222",
  },
  label: {
    fontWeight: "600",
    marginTop: 8,
    color: "#333",
  },
  pickerBox: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginVertical: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    width: 180,
  },
  picker: {
    height: 50,
  },
  statsBox: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    marginVertical: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
    color: "#333",
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statText: {
    width: "48%",
    fontSize: 15,
    marginVertical: 2,
  },
  matchCard: {
    padding: 14,
    borderRadius: 12,
    marginVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  matchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  roundText: { fontWeight: "700", color: "#333" },
  dateText: { fontWeight: "500", color: "#666" },
  matchText: {
    fontSize: 16,
    textAlign: "center",
    fontWeight: "500",
    color: "#222",
  },
  scoreText: {
    fontWeight: "700",
    fontSize: 16,
    color: "#000",
  },
  noMatchText: {
    textAlign: "center",
    marginTop: 20,
    color: "#777",
  },
});
