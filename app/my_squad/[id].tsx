import { MaterialIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BASE_URL } from "../../config";
import { useAuth } from "../../context/AuthContext";

interface Transfer {
  id: number;
  season: number;
  from_team_name: string | null;
  to_team_name: string;
  amount: number;
  transfer_date: string;
  is_loan: boolean;
  loan_gameweek: number | null;
  is_loan_end: boolean;
  description: string | null;
}

interface TransferWindow {
  id: number;
  season: string;
  year: number;
  is_active: boolean;
  is_contract_open: boolean;
}

interface PlayerDetail {
  id: number;
  full_name: string;
  photo: string;
  club_name: string;
  position: string;
  team_name: string;
  base_price: number;
  points: number;
  contract_renew_bonus: number;
  contract_expiry: string | null;
  is_academy_player: boolean;
  weekly_wage: number;
  full_season_wage: number;
  bonus_earning: number
  transfer_history: Transfer[];
}

export default function PlayerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [player, setPlayer] = useState<PlayerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const { fetchWithAuth } = useAuth();
  const [windows, setWindows] = useState<TransferWindow[]>([]);
  const [selectedWindowId, setSelectedWindowId] = useState<number | null>(null);

  // const hasActiveWindow = windows.some((w) => w.is_active); (Currently not used)
  const hasContractOpenWindow = windows.some((w) => w.is_contract_open);

  useEffect(() => {
    const loadWindows = async () => {
      const res = await fetchWithAuth(`${BASE_URL}/api/transfer-windows/`);
      if (res.ok) {
        const data = await res.json();
        setWindows(data);
      }
    };
    loadWindows();
  }, []);

  useEffect(() => {
    fetch(`${BASE_URL}/api/playerdetails/${id}/`)
      .then((res) => res.json())
      .then((data) => setPlayer(data))
      .catch((err) => console.error("Error fetching player:", err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  if (!player) {
    return (
      <View style={styles.center}>
        <Text>Player not found</Text>
      </View>
    );
  }

  // === Actions ===
  const handleToggleAcademy = async () => {
    Alert.alert(
      "Confirm Action",
      player?.is_academy_player
        ? "Move this player to the Main Team?"
        : "Move this player to the Academy?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            try {
              const res = await fetchWithAuth(
                `${BASE_URL}/api/players/${id}/toggle-academy/`,
                { method: "POST" }
              );
              if (!res.ok) {
                const errorData = await res.json();
                if (errorData.error === "Player is locked and cannot be toggled") {
                  alert("Player is Locked. Try on Next Transfer.");
                } else {
                  alert("Toggle failed: " + errorData.error);
                }
                return;
              }
              const data = await res.json();
              setPlayer((prev) =>
                prev ? { ...prev, is_academy_player: data.is_academy_player } : prev
              );
              alert("Player moved successfully!");
            } catch (err) {
              console.error("Toggle academy error:", err);
            }
          },
        },
      ]
    );
  };

  const handleExtendContract = async () => {
    if (!selectedWindowId) {
      alert("Please select a transfer window first");
      return;
    }

    Alert.alert(
      "Extend Contract",
      "Are you sure you want to extend this player's contract?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            try {
              const res = await fetchWithAuth(
                `${BASE_URL}/api/players/${id}/extend-contract/`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ transfer_window_id: Number(selectedWindowId) }),
                }
              );
              if (!res.ok) {
                const errorData = await res.json();
                const message =
                  errorData.error || errorData.detail || "Unknown error occurred";
                alert("Contract extension failed:\n" + message);
                return;
              }
              const data = await res.json();
              setPlayer((prev) =>
                prev ? { ...prev, contract_expiry: data.contract_expiry, contract_renew_bonus: data.contract_renew_bonus } : prev
              );
              alert("Contract extended successfully!");
            } catch (err) {
              console.error("Extend contract error:", err);
            }
          },
        },
      ]
    );
  };

  const handleReleasePlayer = async () => {
    Alert.alert(
      "Release Player",
      "Are you sure you want to release this player? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Release",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await fetchWithAuth(
                `${BASE_URL}/api/players/${id}/release_player/`,
                { method: "POST" }
              );
              if (!res.ok) {
                const errorData = await res.json();
                alert("Release failed: " + (errorData.error || "Unknown error"));
                return;
              }
              alert("Player released successfully!");
              setPlayer((prev) =>
                prev ? { ...prev, team_name: "Free Agent" } : prev
              );
            } catch (err) {
              console.error("Release player error:", err);
            }
          },
        },
      ]
    );
  };

  return (
    <LinearGradient colors={["#e0f2ff", "#ffffff"]} style={{ flex: 1 }}>
      <FlatList
        data={player.transfer_history || []}
        keyExtractor={(t) => t.id.toString()}
        ListHeaderComponent={
          <View>
            <ImageBackground
              source={{ uri: "https://i.ibb.co/YD9RrM5/football-bg.jpg" }}
              style={styles.headerBg}
              imageStyle={{ borderRadius: 16 }}
            >
              {/* 🔴 Red gradient overlay if player is unavailable */}
              {player.weekly_wage === 0 && (
                <LinearGradient
                  colors={["rgba(255,0,0,0.6)", "rgba(255,0,0,0.1)", "transparent"]}
                  style={StyleSheet.absoluteFillObject}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                />
              )}
              <View style={styles.topCard}>
                <Image
                  source={{ uri: `${BASE_URL}${player.photo}` }}
                  style={styles.playerPhoto}
                />
                <View style= {{width: "100%", height: 2,backgroundColor: "#818181ff", elevation: 2, marginBottom: 10,}}></View>
                <Text style={styles.playerName}>{player.full_name}</Text>
                <Text style={styles.playerSub}>
                  {player.position} • {player.team_name}
                </Text>
              </View>
            </ImageBackground>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Player Information</Text>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Club</Text>
                <Text style={styles.value}>{player.club_name || "Unknown"}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Base Price</Text>
                <Text style={styles.value}>{player.base_price}M</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Weekly Wage</Text>
                <Text style={styles.value}>{player.weekly_wage.toFixed(3)}M</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Full Season Wage</Text>
                <Text style={styles.value}>{player.full_season_wage.toFixed(2)}M</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Fantasy Points</Text>
                <Text style={styles.value}>{player.points}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Bonus Earned: </Text>
                <Text style={styles.value}>{player.bonus_earning}M</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Contract Renew Cost</Text>
                <Text style={styles.value}>{player.contract_renew_bonus}M</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Contract Expiry</Text>
                <Text style={styles.value}>
                  {player.contract_expiry || "N/A"}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Academy Player</Text>
                <Text style={styles.value}>
                  {player.is_academy_player ? "Yes" : "No"}
                </Text>
              </View>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: "#1976d2" },
                  !hasContractOpenWindow && { opacity: 0.5 },
                ]}
                disabled={!handleExtendContract}
                onPress={handleToggleAcademy}
              >
                <MaterialIcons
                  name="swap-horiz"
                  size={20}
                  color="white"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.actionText}>
                  {player.is_academy_player ? "To Main Team" : "To Academy"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "#d32f2f" }]}
                onPress={handleReleasePlayer}
              >
                <MaterialIcons
                  name="logout"
                  size={20}
                  color="white"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.actionText}>Release</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Contract Extension</Text>
              <Picker
                selectedValue={selectedWindowId ?? 0}
                onValueChange={(itemValue) =>
                  setSelectedWindowId(itemValue === 0 ? null : Number(itemValue))
                }
                enabled={hasContractOpenWindow}
                style={{color:'#8b8b8bff'}}
              >
                <Picker.Item label="Select Contract Length..." value={0} />
                {windows.map((w) => (
                  <Picker.Item
                    key={w.id}
                    label={`${w.season} ${w.year}${w.is_active ? " (Active)" : ""}`}
                    value={w.id}
                  />
                ))}
              </Picker>

              <TouchableOpacity
                style={[
                  styles.extendButton,
                  (!selectedWindowId || !hasContractOpenWindow) && { opacity: 0.6 },
                ]}
                disabled={!selectedWindowId || !hasContractOpenWindow}
                onPress={handleExtendContract}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>
                  Extend Contract
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.cardTitle}>Transfer History</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.transferCard}>
            <Text style={styles.transferText}>
              {item.from_team_name || "Free Agent"} → {item.to_team_name}
            </Text>
            <Text style={styles.transferMeta}>
              Fee: {item.amount ? `${item.amount}M` : "Free"} • {" "}
              {new Date(item.transfer_date).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
              {item.is_loan && (
              <Text style={styles.loanTag}> • Loan (GW {item.loan_gameweek || "-"})</Text>
            )}
            {item.is_loan_end && <Text style={styles.loanEndTag}>Loan End</Text>}
            </Text>
            <Text style={{fontStyle:"italic", marginTop:4}}>
              Clause: {item.description || "None"}
            </Text>
          </View>
        )}
        contentContainerStyle={{ padding: 16 }}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerBg: { width: "100%", height: 260, marginBottom: 12 },
  topCard: { alignItems: "center", marginTop: 80 },
  playerPhoto: {
    width: 130,
    height: 170,
  },
  playerName: { fontSize: 22, fontWeight: "700", color: "#000" },
  playerSub: { fontSize: 14, color: "#444" },
  card: {
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 16,
    borderRadius: 16,
    marginTop: 50,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: "600", marginBottom: 8, color: "#222" },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  label: { color: "#666", fontSize: 13 },
  value: { fontWeight: "500", color: "#222" },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 4,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    marginHorizontal: 4,
  },
  actionText: { color: "white", fontWeight: "600" },
  extendButton: {
    backgroundColor: "#388e3c",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  sectionHeader: { marginTop: 18 },
  transferCard: {
    backgroundColor: "#f8f8f8",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  transferText: { fontSize: 15, fontWeight: "600" },
  transferMeta: { fontSize: 13, color: "#666" },
  loanTag: { color: "#f57c00", fontWeight: "500" },
  loanEndTag: { color: "#d32f2f", fontWeight: "600" },
});
