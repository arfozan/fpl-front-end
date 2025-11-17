import { BASE_URL } from "@/config";
import { Picker } from "@react-native-picker/picker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";

export default function PlayerDetail() {
  const { id } = useLocalSearchParams<{ playerId: string }>();
  const { fetchWithAuth, user } = useAuth();
  const [player, setPlayer] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [isLoan, setIsLoan] = useState(false);
  const [loanGameweek, setLoanGameweek] = useState("");
  const [message, setMessage] = useState("");

  const playerId = Number(id);

  useEffect(() => {
    const load = async () => {
      const res = await fetchWithAuth(
        `${BASE_URL}/api/playerdetails/${playerId}/`
      );
      if (res.ok) setPlayer(await res.json());
    };
    load();
  }, [playerId]);

  const sendTransferRequest = async () => {
    const body: any = {
      player: playerId,
      amount: parseFloat(amount),
      is_loan: isLoan,
      message,
    };
    if (isLoan) body.loan_gameweek = parseInt(loanGameweek, 10);

    const res = await fetchWithAuth(
      `${BASE_URL}/api/transfer-requests/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (res.ok) {
      Alert.alert("✅ Success", "Transfer request sent!");
      router.back();
    } else {
      const errorData = await res.json();
      let errorMessage = "Failed to send transfer request";
      if (typeof errorData.detail === "string") {
        errorMessage = errorData.detail;
      } else if (typeof errorData === "object") {
        errorMessage = Object.entries(errorData)
          .map(([key, value]) => `${key}: ${(value as string[]).join(", ")}`)
          .join("\n");
      }
      Alert.alert("Error", errorMessage);
    }
  };

  if (!player) return <Text style={styles.loading}>Loading...</Text>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.playerName}>{player.full_name}</Text>
        <Text style={styles.detailText}>
          Current Team: {player.team_name || "Free Agent"}
        </Text>

        <TextInput
          placeholder="Offer Amount"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          style={styles.input}
          placeholderTextColor={"#797979ff"}
        />

        <View style={styles.row}>
          <Text style={styles.label}>Loan deal?</Text>
          <Switch value={isLoan} onValueChange={setIsLoan} />
        </View>

        {isLoan && (
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={loanGameweek}
              onValueChange={(value) => setLoanGameweek(value.toString())}
              style={styles.picker}
              dropdownIconColor={"#000000ff"}
            >
              {Array.from({ length: 38 - 7 + 1 }, (_, i) => i + 7).map((gw) => (
                <Picker.Item key={gw} label={`Gameweek ${gw}`} value={gw} />
              ))}
            </Picker>
          </View>
        )}

        <TextInput
          placeholder="Message / other clauses"
          value={message}
          onChangeText={setMessage}
          style={[styles.input, { height: 100}]}
          placeholderTextColor={"#797979ff"}
          multiline
        />

        <TouchableOpacity style={styles.sendButton} onPress={sendTransferRequest}>
          <Text style={styles.sendButtonText}>Send Offer</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#f7f8fa" },
  loading: { textAlign: "center", marginTop: 40, fontSize: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  playerName: { fontSize: 22, fontWeight: "700", marginBottom: 8, color: "#1d296bff" },
  detailText: { fontSize: 16, marginBottom: 12, color: "#444" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#f9f9f9",
  },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 12, justifyContent: "space-between" },
  label: { fontSize: 16 },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
    backgroundColor: "#f9f9f9",
  },
  picker: { height: 50, width: "100%", color: "#000000ff"},
  sendButton: {
    backgroundColor: "#2a9d8f",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  sendButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});