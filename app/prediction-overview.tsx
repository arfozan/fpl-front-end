import { BASE_URL } from "@/config";
import { useAuth } from "@/context/AuthContext";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

export default function PredictionOverview() {
  const { user, fetchWithAuth } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [rounds, setRounds] = useState<number[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>("");
  const [selectedRound, setSelectedRound] = useState<number | null>(null);

  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    loadSeasons();
  }, []);

  const loadSeasons = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/seasons/`);
      const json = await res.json();

      setSeasons(json);
      setSelectedSeason(json.find((s: any) => s.is_season_active)?.season_name);
    } catch (e) {
      console.log("Failed to load seasons", e);
    }
  };

  useEffect(() => {
    if (selectedSeason) loadRounds();
  }, [selectedSeason]);

  const loadRounds = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/rounds/?season=${selectedSeason}`);
      const json = await res.json();

      const nums = json.map((r: any) => r.round_number);
      setRounds(nums);
      setSelectedRound(nums[0] || null);
    } catch (e) {
      console.log("Failed loading rounds");
    }
  };

  useEffect(() => {
    if (selectedSeason && selectedRound != null) loadOverview();
  }, [selectedSeason, selectedRound]);

  const loadOverview = async () => {
    try {
      setLoading(true);

      const res = await fetchWithAuth(
        `${BASE_URL}/api/prediction/overview/?season=${selectedSeason}&round=${selectedRound}`
      );
      const json = await res.json();

      setLeaderboard(json.leaderboard || []);
      setPredictions(json.predictions || []);
    } catch (e) {
      console.log("Error loading overview", e);
    }
    setLoading(false);
  };

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 18, fontWeight: "600" }}>
          Log in to view predictions overview.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen}>
      <Text style={styles.header}>Prediction Overview</Text>

      {/* ✅ Season Picker */}
      <View style={styles.pickerBox}>
        <Text style={styles.pickerLabel}>Season</Text>
        <Picker
          selectedValue={selectedSeason}
          onValueChange={(v) => setSelectedSeason(v)}
        >
          {seasons.map((s: any) => (
            <Picker.Item key={s.id} label={s.season_name} value={s.season_name} />
          ))}
        </Picker>
      </View>

      {/* ✅ Round Picker */}
      <View style={styles.pickerBox}>
        <Text style={styles.pickerLabel}>Gameweek</Text>
        <Picker
          selectedValue={selectedRound}
          onValueChange={(v) => setSelectedRound(v)}
        >
          {rounds.map((r) => (
            <Picker.Item key={r} label={`GW${r}`} value={r} />
          ))}
        </Picker>
      </View>

      {/* -----------------------------------------------------
         ✅ LEADERBOARD
         ----------------------------------------------------- */}
      <Text style={styles.sectionTitle}>Leaderboard</Text>

      {leaderboard.map((row: any, index: number) => (
        <View key={index} style={styles.leaderCard}>
          <Text style={styles.rank}>{index + 1}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.teamName}>{row.manager_name}</Text>
            <Text style={styles.statText}>
              Correct: {row.correct_predictions} | Wrong: {row.wrong_predictions}
            </Text>
          </View>
          <Text style={styles.accuracy}>{row.accuracy_percent}%</Text>
        </View>
      ))}

      {/* -----------------------------------------------------
         ✅ ALL PREDICTIONS
         ----------------------------------------------------- */}
      <Text style={styles.sectionTitle}>All Predictions (GW{selectedRound})</Text>

      {predictions.map((p, i) => (
        <View key={i} style={styles.predCard}>
          <Text style={styles.predMatch}>
            {p.manager_name}'s Prediction
          </Text>
          <Text style={styles.matchText}>
            {p.home} vs {p.away}
          </Text>

          <Text style={styles.choiceText}>Pick: {p.choice}</Text>

          <View style={styles.resultRow}>
            {p.is_correct === true && <Text style={styles.tick}>✔ Correct</Text>}
            {p.is_correct === false && <Text style={styles.cross}>✖ Wrong</Text>}
            {p.is_correct === null && (
              <Text style={{ fontWeight: "600" }}>In progress</Text>
            )}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 14, backgroundColor: "#f5f5f5" },
  header: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    marginVertical: 12,
    color: "#0a3d62",
  },

  pickerBox: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 8,
    marginBottom: 10,
  },
  pickerLabel: { fontWeight: "700", marginBottom: 6 },

  sectionTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "800",
    color: "#192a56",
  },

  leaderCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    marginTop: 8,
    elevation: 2,
  },
  rank: {
    fontSize: 22,
    fontWeight: "900",
    marginRight: 12,
    width: 32,
    textAlign: "center",
    color: "#e84118",
  },
  teamName: { fontSize: 16, fontWeight: "700" },
  statText: { fontSize: 13, color: "#555" },
  accuracy: { fontSize: 18, fontWeight: "800", color: "#009432" },

  predCard: {
    backgroundColor: "#dff9fb",
    borderLeftWidth: 4,
    borderLeftColor: "#22a6b3",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  predMatch: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
  matchText: { fontSize: 14, marginBottom: 4 },
  choiceText: { fontWeight: "600", marginBottom: 4 },

  resultRow: { flexDirection: "row", alignItems: "center" },
  tick: { color: "#009432", fontWeight: "800", marginLeft: 4 },
  cross: { color: "#e84118", fontWeight: "800", marginLeft: 4 },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
