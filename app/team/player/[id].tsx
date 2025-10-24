import { BASE_URL } from "@/config";
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  View
} from "react-native";

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

interface PlayerDetail {
  id: number;
  full_name: string;
  photo: string;
  club_name: string;
  position: string;
  team_name: string;
  base_price: number;
  contract_renew_bonus: number;
  contract_expiry: string | null;
  is_academy_player: boolean;
  weekly_wage: number;
  full_season_wage: number;
  bonus_earning: number;
  transfer_history: Transfer[];
}

export default function PlayerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [player, setPlayer] = useState<PlayerDetail | null>(null);
  const [loading, setLoading] = useState(true);

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
        <ActivityIndicator size="large" />
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

  return (
    <FlatList
      data={player.transfer_history || []}
      keyExtractor={(t) => t.id.toString()}
      ListHeaderComponent={
        <View>
          {/* Gradient Header */}
          <ExpoLinearGradient
            colors={["#1d296b", "#3c4aad", "#6c7bff"]}
            style={styles.headerGradient}
          >
            <Image
              source={{ uri: `${BASE_URL}${player.photo}` }}
              style={styles.playerPhoto}
            />
            <View style= {{width:"95%", height:1, backgroundColor: "#ffff", marginBottom: 12}}></View>
            <Text style={styles.playerName}>{player.full_name}</Text>
            <Text style={styles.playerSub}>
              {player.position} • {player.team_name}
            </Text>
          </ExpoLinearGradient>

          {/* Player Info Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Player Information</Text>
            <Text style={styles.infoText}>Club: {player.club_name || "Unknown"}</Text>
            <Text style={styles.infoText}>Base Price: {player.base_price}M</Text>
            <Text style={styles.infoText}>Weekly Wage: {player.weekly_wage.toFixed(2)}M</Text>
            <Text style={styles.infoText}>
              Full Season Wage: {player.full_season_wage.toFixed(2)}M
            </Text>
            <Text style={styles.infoText}>Bonus Earning: {player.bonus_earning}M</Text>
            <Text style={styles.infoText}>
              Contract Renew Cost: {player.contract_renew_bonus}M
            </Text>
            <Text style={styles.infoText}>
              Contract Expiry: {player.contract_expiry || "N/A"}
            </Text>
            <Text style={styles.infoText}>
              Academy Player: {player.is_academy_player ? "Yes" : "No"}
            </Text>
          </View>

          {/* Transfer History Title */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>Transfer History</Text>
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.transferCard}>
          <View style={styles.transferRowTop}>
            <Text style={styles.transferTeams}>
              {item.from_team_name || "Free Agent"} → {item.to_team_name}
            </Text>
            <Text style={styles.transferDate}>
              {new Date(item.transfer_date).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.transferRowBottom}>
            <Text style={styles.transferAmount}>
              {item.amount ? `${item.amount}M` : "Free"}
            </Text>

            {item.is_loan && (
              <Text style={styles.loanBadge}>
                Loan (GW {item.loan_gameweek || "-"})
              </Text>
            )}
            {item.is_loan_end && (
              <Text style={styles.loanEndBadge}>Loan End</Text>
            )}
          </View>
          <Text style={{fontStyle:"italic", marginTop:4}}>
              {item.description || "None"}
            </Text>
        </View>
      )}
      contentContainerStyle={{ padding: 16 }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  headerGradient: {
    width: "100%",
    height: 300,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    elevation: 3,
  },
  playerPhoto: {
    width: 160,
    height: 210,
    borderRadius: 10,
    borderColor: "#fff",
  },
  playerName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  playerSub: {
    fontSize: 15,
    color: "#f0f0f0",
    marginBottom: 12,
  },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    marginBottom: 20,
  },
  cardTitle: { fontSize: 17, fontWeight: "bold", marginBottom: 12, color: "#1d296b" },
  infoText: { fontSize: 14, color: "#333", marginVertical: 2 },

  sectionHeader: {
    marginTop: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#1d296b",
    paddingLeft: 8,
  },
  sectionHeaderText: { fontSize: 16, fontWeight: "bold", color: "#1d296b" },

  transferCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  transferRowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  transferRowBottom: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  transferTeams: { fontSize: 15, fontWeight: "600" },
  transferDate: { fontSize: 12, color: "#666" },
  transferAmount: { fontSize: 14, fontWeight: "bold", marginRight: 8 },
  loanBadge: {
    fontSize: 12,
    color: "orange",
    fontWeight: "600",
    backgroundColor: "#fff3e0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  loanEndBadge: {
    fontSize: 12,
    color: "red",
    fontWeight: "600",
    backgroundColor: "#ffe6e6",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
});
