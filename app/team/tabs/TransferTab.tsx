import { FlatList, StyleSheet, Text, View } from "react-native";

interface Transfer {
  id: number;
  season: number;
  season_name?: string;
  from_team_name: string;
  to_team_name: string;
  player_name: string;
  amount: number;
  transfer_date: string;
  is_loan: boolean;
  loan_gameweek?: number | null;
  is_loan_end?: boolean;
  description?: string | null;
}

interface TeamDetail {
  team_name: string;
}

export default function TransfersTab({
  team,
  transfers,
}: {
  team: TeamDetail;
  transfers: Transfer[];
}) {
  const currentTeamName = team?.team_name;

  const renderTransfer = ({ item }: { item: Transfer }) => {
    let label = "";
    let otherTeam = "";
    let badgeColor = "#007bff";
    let badgeText = "Transfer";

    if (currentTeamName === item.from_team_name) {
      otherTeam = item.to_team_name;
      if (item.is_loan_end) {
        label = `End of Loan, Back to ${otherTeam}`;
        badgeColor = "#f44336";
        badgeText = "Loan End";
      } else if (item.is_loan) {
        label = `Loaned Out To: ${otherTeam}`;
        badgeColor = "#ff9800";
        badgeText = "Loan Out";
      } else {
        label = `To: ${otherTeam}`;
        badgeColor = "#e53935"; // 🔴 Red for Transfer Out
        badgeText = "Transfer Out";
      }
    } else if (currentTeamName === item.to_team_name) {
      otherTeam = item.from_team_name;
      if (item.is_loan_end) {
        label = `Back from Loan (${otherTeam})`;
        badgeColor = "#4caf50";
        badgeText = "Loan Return";
      } else if (item.is_loan) {
        label = `Loaned In from ${otherTeam}`;
        badgeColor = "#ffc107";
        badgeText = "Loan In";
      } else {
        label = `From: ${otherTeam}`;
        badgeColor = "#2196f3"; // 🟦 Blue for Transfer In
        badgeText = "Transfer In";
      }
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.badge, { backgroundColor: badgeColor }]}>
            <Text style={styles.badgeText}>{badgeText}</Text>
          </View>
          <Text style={styles.dateText}>
            {new Date(item.transfer_date).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </Text>
        </View>

        <Text style={styles.playerName}>{item.player_name}</Text>
        <Text style={styles.transferText}>{label}</Text>
        <Text style={{fontStyle:"italic"}}>Clause: {item.description}</Text>

        <View style={styles.footer}>
          <Text style={styles.amount}>
            💰 {item.amount ? `${item.amount}M` : "Free Transfer"}
          </Text>
          {item.loan_gameweek && (
            <Text style={styles.loanGW}>🕓 GW {item.loan_gameweek}</Text>
          )}
        </View>

        {item.season_name && (
          <Text style={styles.seasonTag}>Season {item.season_name}</Text>
        )}
      </View>
    );
  };

  return (
    <FlatList
      data={transfers}
      keyExtractor={(t) => t.id.toString()}
      renderItem={renderTransfer}
      contentContainerStyle={{ padding: 12 }}
      ListEmptyComponent={
        <Text style={styles.emptyText}>No transfers found.</Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 16,
    marginVertical: 8,
    borderRadius: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badge: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  badgeText: { color: "#fff", fontWeight: "600", fontSize: 12 },
  dateText: { fontSize: 12, color: "#777" },
  playerName: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 10,
    color: "#222",
  },
  transferText: {
    fontSize: 15,
    color: "#444",
    marginTop: 4,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  amount: { fontWeight: "600", color: "#333" },
  loanGW: { color: "#666" },
  seasonTag: {
    fontSize: 12,
    color: "#999",
    marginTop: 8,
    textAlign: "right",
  },
  emptyText: {
    textAlign: "center",
    color: "#888",
    fontStyle: "italic",
    marginTop: 20,
  },
});
