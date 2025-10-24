import { BASE_URL } from "@/config";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";

interface TransferRequest {
  id: number;
  player_name: string;
  to_team_name: string;
  amount: string;
  is_loan: boolean;
  loan_gameweek?: number;
}

export default function TransferRequests() {
  const { user, fetchWithAuth } = useAuth();
  const [requests, setRequests] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetchWithAuth(
        `${BASE_URL}/api/transfer-requests/?status=PENDING&from_team=${user.id}`
      );
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (err) {
      console.error("Error fetching requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const handleAccept = async (id: number) => {
    try {
      const res = await fetchWithAuth(
        `${BASE_URL}/api/transfer-requests/${id}/accept/`,
        { method: "POST" }
      );
      if (!res.ok) {
        const err = await res.json();
        Alert.alert("Error", err.detail || JSON.stringify(err));
        return;
      }
      Alert.alert("✅ Success", "Transfer accepted!");
      fetchRequests();
    } catch (err) {
      console.error("Accept error:", err);
    }
  };

  const handleReject = async (id: number) => {
    try {
      const res = await fetchWithAuth(
        `${BASE_URL}/api/transfer-requests/${id}/reject/`,
        { method: "POST" }
      );
      if (res.ok) {
        Alert.alert("❌ Rejected");
        fetchRequests();
      }
    } catch (err) {
      console.error("Reject error:", err);
    }
  };

  if (loading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1d296bff" />
      </View>
    );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📩 Incoming Transfer Requests</Text>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", color: "#777", marginTop: 40 }}>
            No pending requests
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.playerName}>{item.player_name}</Text>
            <Text style={styles.detailText}>➡️ To: {item.to_team_name}</Text>
            <Text style={styles.detailText}>Offer: {item.amount}</Text>
            {item.is_loan && (
              <Text style={styles.detailText}>
                📅 Loan until GW {item.loan_gameweek}
              </Text>
            )}

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptBtn]}
                onPress={() => handleAccept(item.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.btnText}>Accept</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.rejectBtn]}
                onPress={() => handleReject(item.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.btnText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f7f8fa" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    color: "#1d296bff",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  playerName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1d296bff",
    marginBottom: 6,
  },
  detailText: { fontSize: 15, color: "#444", marginVertical: 1 },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 5,
  },
  acceptBtn: { backgroundColor: "#2a9d8f" },
  rejectBtn: { backgroundColor: "#e63946" },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
