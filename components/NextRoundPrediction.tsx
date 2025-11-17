import { BASE_URL } from "@/config";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function PredictionSection() {
  const router = useRouter();
  const { fetchWithAuth, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<any>(null);
  const [selected, setSelected] = useState<Record<number, string | null>>({});

  // ✅ Load only when user is ready
  useEffect(() => {
    if (user !== undefined) load();
  }, [user]);

  const load = async () => {
    if (!user) {
      setDashboard(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetchWithAuth(`${BASE_URL}/api/prediction/dashboard/`);
      const json = await res.json();

      setDashboard(json);

      if (json.next_round?.matches) {
        const init: any = {};
        json.next_round.matches.forEach((m: any) => (init[m.id] = null));
        setSelected(init);
      }
    } catch {
      Alert.alert("Error", "Failed loading prediction data");
    }
    setLoading(false);
  };

  const choose = (matchId: number, choice: string) => {
    setSelected((p) => ({
      ...p,
      [matchId]: p[matchId] === choice ? null : choice,
    }));
  };

  const submit = async () => {
    const picks = Object.entries(selected)
      .filter(([_, c]) => c !== null)
      .map(([mid, c]) => ({
        match: Number(mid),
        choice: c,
      }));

    if (picks.length === 0) {
      Alert.alert("Warning", "Select at least one prediction");
      return;
    }

    const res = await fetchWithAuth(`${BASE_URL}/api/prediction/next-round/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ predictions: picks }),
    });

    const json = await res.json();
    if (!res.ok) return Alert.alert("Error", json.error || "Could not submit");

    Alert.alert("Success", "Prediction submitted");
    load();
  };

  // ✅ Not logged in
  if (!user) {
    return (
      <View style={styles.loginBox}>
        <ImageBackground
          source={require("../assets/images/bg.png")}
          style={styles.bg}
        >
          <Text style={styles.titleWhite}>Prediction Game</Text>
          <Text style={styles.loginPrompt}>
            Log in to participate and earn weekly bonuses.
          </Text>
        </ImageBackground>
      </View>
    );
  }

  // ✅ Loading
  if (loading) {
    return (
      <View style={{ margin: 20 }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const current = dashboard?.current_round;
  const next = dashboard?.next_round;
  const totalBonus = dashboard?.total_bonus ?? "0.00";
  const gw = dashboard?.season?.current_gameweek ?? 0;

  return (
    <View style={styles.container}>
      <Text style={styles.titleWhite}>Prediction Game</Text>

      <View style={styles.innerBox}>
        <Text style={styles.totalBonus}>
          Total Bonus: {totalBonus}M
        </Text>

        {/* ✅ CURRENT ROUND */}
        {current ? (
          <View style={styles.section}>
            <Text style={styles.subtitle}>
              Gameweek {current.round_number} Results
            </Text>

            <Text style={styles.roundBonus}>
              Round Bonus: {current.round_bonus ?? "0.00"}M
            </Text>

            {current.predictions.map((p: any) => (
              <View key={p.match_id} style={styles.card}>
                <Text style={styles.match}>
                  {p.home} vs {p.away}
                </Text>
                <Text style={styles.pick}>Your Pick: {p.choice}</Text>

                {p.status === "in_progress" && (
                  <Text style={styles.inProgress}>Match in progress...</Text>
                )}

                {p.status === "finished" && (
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                  <Text style={p.is_correct ? styles.correct : styles.wrong}>
                    {p.is_correct ? `Correct +${p.reward}M` : `Wrong ${p.reward}M`}
                  </Text>

                  <Text style={p.is_correct ? styles.tickIcon : styles.crossIcon}>
                    {p.is_correct ? "✔" : "✖"}
                  </Text>
                </View>
              )}
              </View>
            ))}
          </View>
        ) : (
          gw > 1 && (
            <View style={styles.missedBox}>
              <Text style={styles.missedText}>
                You did not participate in Gameweek {gw}.
              </Text>
            </View>
          )
        )}

        {/* NEXT ROUND — MAKE PREDICTIONS */}
        {next && !next.already_submitted && next.matches && (
          <View style={styles.section}>
            <Text style={styles.subtitle}>
              Predict Gameweek {next.round_number}
            </Text>

            {next.matches.map((m: any) => (
              <View key={m.id} style={styles.card}>
                <Text style={styles.match}>
                  {m.home_team_name} vs {m.away_team_name}
                </Text>

                <View style={styles.row}>
                  {["HOME", "DRAW", "AWAY"].map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.btn, selected[m.id] === c && styles.activeBtn]}
                      onPress={() => choose(m.id, c)}
                    >
                      <Text>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.submit} onPress={submit}>
              <Text style={styles.submitText}>Submit Prediction</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* NEXT ROUND — ALREADY SUBMITTED */}
        {next && next.already_submitted && (
          <View style={styles.section}>
            <Text style={styles.subtitle}>
              Gameweek {next.round_number} - Your Picks
            </Text>

            {next.submitted.map((p: any) => (
              <View key={p.match_id} style={styles.card}>
                <Text>{p.home} vs {p.away}</Text>
                <Text>Your Pick: {p.choice}</Text>
              </View>
            ))}
          </View>
        )}
        <TouchableOpacity
            style={styles.submit}
            onPress={() => router.push("/prediction-overview")}
          >
            <Text style={styles.submitText}>View All Predictions</Text>
          </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 12,
    backgroundColor: "#0a3161",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  titleWhite: {
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    color: "#ffcc00", 
    marginTop: 6,
    marginBottom: 12,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },

  bg: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  loginBox: {
    borderRadius: 14,
    overflow: "hidden",
    margin: 12,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  loginPrompt: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginTop: 8,
    fontWeight: "600",
  },

  innerBox: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
  },

  totalBonus: {
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 10,
    color: "#0a3161",
  },

  section: {
    marginBottom: 22,
    marginTop: 18,
    borderRadius: 10,
  },

  subtitle: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 10,
    color: "#0a3161",
    textTransform: "uppercase",
  },

  roundBonus: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    color: "#228b22", // green turf color
    marginBottom: 8,
  },

  missedBox: {
    backgroundColor: "#fde4e4",
    padding: 12,
    borderRadius: 10,
    elevation: 2,
  },

  missedText: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    color: "#cc0000",
  },

  card: {
    backgroundColor: "#f8f9ff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  match: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 6,
    color: "#0a3161",
  },

  pick: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
    color: "#333",
  },

  inProgress: {
    marginTop: 4,
    fontWeight: "700",
    color: "#d97a00", // amber sports highlight
  },

  correct: {
    marginTop: 4,
    color: "#00b140", // neon green like scoreboards
    fontWeight: "800",
  },

  wrong: {
    marginTop: 4,
    color: "#d10000", // bold sports red
    fontWeight: "800",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  btn: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: "#0a3161",
    borderRadius: 8,
    width: 80,
    alignItems: "center",
    backgroundColor: "#e8ecff",
  },

  activeBtn: {
    backgroundColor: "#0a3161",
    borderColor: "#ffcc00",
  },

  submit: {
    backgroundColor: "#ffcc00",
    padding: 14,
    borderRadius: 10,
    marginTop: 12,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  submitText: {
    color: "#0a3161",
    textAlign: "center",
    fontWeight: "900",
    fontSize: 16,
    textTransform: "uppercase",
  },

  tickIcon: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: "900",
    color: "#00b140", // neon score green
  },

  crossIcon: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: "900",
    color: "#d10000", // sports red
  },
});
