import { BASE_URL } from "@/config";
import { useAuth } from "@/context/AuthContext";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function PredictionOverview() {
  const { user, fetchWithAuth } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [rounds, setRounds] = useState<any[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>("");
  const [selectedRound, setSelectedRound] = useState<string | number>("all");

  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);

  // ----------------------------------------
  // LOAD SEASONS
  // ----------------------------------------
  useEffect(() => {
    if (!user) return;
    loadSeasons();
  }, []);

  const loadSeasons = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/seasons/`);
      const json = await res.json();

      setSeasons(json);
      setSelectedSeason(
        json.find((s: any) => s.is_season_active)?.season_name || ""
      );
    } catch (e) {
      console.log("Failed to load seasons", e);
    }
  };

  // ----------------------------------------
  // LOAD ROUNDS
  // ----------------------------------------
  useEffect(() => {
    if (selectedSeason) loadRounds();
  }, [selectedSeason]);

  const loadRounds = async () => {
    try {
      const res = await fetch(
        `${BASE_URL}/api/rounds/?season=${selectedSeason}`
      );
      const json = await res.json();

      const nums = json.map((r: any) => r.round_number);
      setRounds(["all", ...nums]); // "all" first
      setSelectedRound("all");
    } catch (e) {
      console.log("Failed loading rounds", e);
    }
  };

  // ----------------------------------------
  // LOAD PREDICTIONS
  // ----------------------------------------
  useEffect(() => {
    if (selectedSeason && selectedRound != null) loadOverview();
  }, [selectedSeason, selectedRound]);

  const loadOverview = async () => {
    try {
      setLoading(true);

      const roundParam =
        selectedRound === "all" ? "" : `&round=${selectedRound}`;

      const res = await fetchWithAuth(
        `${BASE_URL}/api/prediction/overview/?season=${selectedSeason}${roundParam}`
      );

      const json = await res.json();

      setLeaderboard(json.leaderboard || []);
      setPredictions(json.predictions || []);
    } catch (e) {
      console.log("Error loading overview", e);
    }
    setLoading(false);
  };

  // ----------------------------------------
  // GROUP PREDICTIONS BY ROUND (for "all")
  // ----------------------------------------
  const groupedPredictions = useMemo(() => {
    if (selectedRound !== "all") {
      return { [selectedRound]: predictions };
    }

    const grouped: Record<string, any[]> = {};

    predictions.forEach((p) => {
      if (!grouped[p.round_number]) grouped[p.round_number] = [];
      grouped[p.round_number].push(p);
    });

    return grouped;
  }, [predictions, selectedRound]);

  // ----------------------------------------
  // RENDERING
  // ----------------------------------------
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
    <ScrollView style={styles.screen}
      contentContainerStyle={{ paddingBottom: 60 }}
    >
      <Text style={styles.header}>Prediction Overview</Text>
      {/* ------------------ PICKERS ------------------ */}
      <View style={styles.filtersRow}>
        <View style={styles.filterBox}>
          <Picker
            selectedValue={selectedSeason}
            onValueChange={(v) => setSelectedSeason(v)}
            style={styles.picker}
            itemStyle={styles.pickerItem}
            dropdownIconColor="#000"
          >
            {seasons.map((s: any) => (
              <Picker.Item key={s.id} label={s.season_name} value={s.season_name} color="#000" />
            ))}
          </Picker>
        </View>

        <View style={styles.filterBox}>
          <Picker
            selectedValue={selectedRound}
            onValueChange={(v) => setSelectedRound(v)}
            style={styles.picker}
            itemStyle={styles.pickerItem}
            dropdownIconColor="#000"
          >
            <Picker.Item label="All Gameweeks" value="all" color="#000" />
            {rounds
              .filter((r) => r !== "all")
              .map((r) => (
                <Picker.Item key={r} label={`Gameweek ${r}`} value={r} color="#000" />
              ))}
          </Picker>
        </View>
      </View>

      {/* ------------------ LEADERBOARD ------------------ */}
      <Text style={styles.sectionTitle}>Leaderboard</Text>

      {leaderboard.map((row: any, index: number) => (
        <View key={index} style={styles.leaderCard}>
          <View style={styles.rankCircle}>
            <Text style={styles.rankText}>{index + 1}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.managerName}>{row.manager_name}</Text>
            <Text style={styles.statText}>
              {row.correct_predictions} correct • {row.wrong_predictions} wrong
            </Text>
          </View>

          <Text style={styles.accuracy}>
            {row.accuracy_percent}%
          </Text>
        </View>
      ))}

      {/* ------------------ PREDICTIONS ------------------ */}
      <Text style={styles.sectionTitle}>Predictions</Text>

      {Object.entries(groupedPredictions).map(([round, items]) => (
        <View key={round} style={styles.roundCard}>
          <Text style={styles.roundTitle}>Gameweek {round}</Text>

          {items.map((p, i) => (
            <View key={i} style={styles.predCard}>
              <Text style={styles.predHeader}>{p.manager_name}</Text>
              <Text style={styles.matchText}>
                {p.home} vs {p.away}
              </Text>

              <Text style={styles.choice}>Pick: {p.choice}</Text>

              <View style={styles.resultRow}>
                {p.is_correct === true && (
                  <Text style={styles.correct}>✔ Correct</Text>
                )}
                {p.is_correct === false && (
                  <Text style={styles.wrong}>✖ Wrong</Text>
                )}
                {p.is_correct === null && (
                  <Text style={styles.pending}>In progress</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

// ----------------------------------------------------------
// STYLES
// ----------------------------------------------------------
const styles = StyleSheet.create({
  screen: { padding: 14, backgroundColor: "#eef2f3" },

  header: {
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 14,
    color: "#012a4a",
  },

  filtersRow: {
  flexDirection: "row",
  gap: 10,
  marginBottom: 12,
},

filterBox: {
  flex: 1,
  backgroundColor: "#fff",
  borderRadius: 8,
  borderWidth: 1,
  borderColor: "#c9c9c9",
  height: 48,             
  justifyContent: "center",
},

picker: {
  height: 100,             // <<< MUST match container height
  color: "#000",
  paddingHorizontal: 4,   // <<< pushes text away from edge
},

pickerItem: {
  fontSize: 15,           
  height: 48,            
},

  row: {
    flexDirection: "row",
    gap: 12,
  },

  pickerBox: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#c8c8c8",
  },

  sectionTitle: {
    marginTop: 22,
    fontSize: 20,
    fontWeight: "800",
    color: "#1a535c",
  },

  // Leaderboard
  leaderCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    marginTop: 10,
    elevation: 2,
  },
  rankCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ff6b6b",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  rankText: { color: "#fff", fontWeight: "900", fontSize: 16 },
  managerName: { fontSize: 16, fontWeight: "700" },
  statText: { fontSize: 13, color: "#777" },
  accuracy: {
    fontSize: 18,
    fontWeight: "900",
    color: "#2ba84a",
  },

  // Round Card
  roundCard: {
    backgroundColor: "#ffffff",
    marginTop: 16,
    borderRadius: 16,
    padding: 14,
    borderLeftWidth: 5,
    borderLeftColor: "#3d5af1",
    elevation: 1,
  },
  roundTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#3d5af1",
    marginBottom: 8,
  },
  predCard: {
    backgroundColor: "#f1f9ff",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d1e7ff",
    marginTop: 10,
  },
  predHeader: { fontWeight: "700", fontSize: 15, marginBottom: 4 },
  matchText: { fontSize: 14, marginBottom: 4, color: "#34495e" },
  choice: { fontWeight: "700", color: "#0d6efd", marginBottom: 4 },

  resultRow: { flexDirection: "row", alignItems: "center" },
  correct: { color: "#2ba84a", fontWeight: "800" },
  wrong: { color: "#ff4757", fontWeight: "800" },
  pending: { color: "#555", fontWeight: "600" },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  pickerLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#555",
    marginLeft: 4,
    marginBottom: -4, // Pull label closer
  },
});
