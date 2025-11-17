import { BASE_URL } from "@/config";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useAuth } from "../context/AuthContext";

interface TransferRequest {
  id: number;
  player_name: string;
  to_team_name: string;
  amount: string;
  is_loan: boolean;
  loan_gameweek?: number;
  message?: string;
}

interface LoanedPlayer {
  id: number;
  player_name: string;
  loan_gameweek: number;
  loan_from_team: string;
  transfer_id: number;
  extension_id?: number;
  requested_gameweek?: number;
}

interface LoanExtension {
  id: number;
  player_name: string;
  from_team_name: string;
  to_team_name: string;
  current_gameweek: number;
  requested_gameweek: number;
  new_loan_gameweek: number;
  transfer_id: number;
  requested_by_name?: string;
}

type SectionType = "incoming" | "outgoing" | "loaned" | "extension";

export default function TransferRequestsScreen() {
  const { fetchWithAuth, user } = useAuth();
  const [teamId, setTeamId] = useState<number | null>(null);
  const [incoming, setIncoming] = useState<TransferRequest[]>([]);
  const [outgoing, setOutgoing] = useState<TransferRequest[]>([]);
  const [loanedPlayers, setLoanedPlayers] = useState<LoanedPlayer[]>([]);
  const [loanExtensions, setLoanExtensions] = useState<LoanExtension[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [newGWInput, setNewGWInput] = useState("");
  const [amountInput, setAmountInput] = useState("");


  const myTeamName = user?.name?.trim().toLowerCase() || "";

  useEffect(() => { loadTeam(); }, []);
  useEffect(() => { if (teamId) { fetchRequests(teamId); fetchLoanData(); } }, [teamId]);

  const loadTeam = async () => {
    try {
      const res = await fetchWithAuth(`${BASE_URL}/api/my-team/`);
      if (res.ok) setTeamId((await res.json()).id);
    } catch (err) { console.error(err); }
  };

  const fetchRequests = async (id: number) => {
    setLoading(true);
    try {
      const [incomingRes, outgoingRes] = await Promise.all([
        fetchWithAuth(`${BASE_URL}/api/transfer-requests/?type=outgoing&status=PENDING`),
        fetchWithAuth(`${BASE_URL}/api/transfer-requests/?type=incoming&status=PENDING`),
      ]);
      if (incomingRes.ok) setIncoming(await incomingRes.json());
      if (outgoingRes.ok) setOutgoing(await outgoingRes.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchLoanData = async () => {
    try {
      const [loanedRes, extensionRes] = await Promise.all([
        fetchWithAuth(`${BASE_URL}/api/my-loaned-players/`),
        fetchWithAuth(`${BASE_URL}/api/loan-extension-requests/`),
      ]);
      if (loanedRes.ok) setLoanedPlayers(await loanedRes.json());
      if (extensionRes.ok) setLoanExtensions(await extensionRes.json());
    } catch (err) { console.error(err); }
  };

  const handleAccept = async (id: number) => {
    const res = await fetchWithAuth(`${BASE_URL}/api/transfer-requests/${id}/accept/`, { method: "POST" });
    if (!res.ok) { Alert.alert("Error", (await res.json()).detail || ""); return; }
    Alert.alert("✅ Accepted"); if (teamId) fetchRequests(teamId);
  };

  const handleRejectOrCancel = async (id: number) => {
    const res = await fetchWithAuth(`${BASE_URL}/api/transfer-requests/${id}/reject/`, { method: "POST" });
    if (res.ok) { Alert.alert("Done"); if (teamId) fetchRequests(teamId); }
  };

  const handleRequestExtension = async (transferId: number, newGW: number, newAmount: number) => {
    const res = await fetchWithAuth(`${BASE_URL}/api/loan-extension-requests/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transfer: transferId, new_loan_gameweek: newGW, amount: newAmount }),
    });
    if (res.ok) { Alert.alert("Extension Requested"); fetchLoanData(); } 
    else { Alert.alert("Error", (await res.json()).detail || ""); }
  };

  const handleApproveExtension = async (id: number) => {
    const res = await fetchWithAuth(`${BASE_URL}/api/loan-extension-requests/${id}/approve/`, { method: "POST" });
    if (res.ok) { Alert.alert("Approved"); fetchLoanData(); }
  };

  const handleRejectExtension = async (id: number) => {
    const res = await fetchWithAuth(`${BASE_URL}/api/loan-extension-requests/${id}/reject/`, { method: "POST" });
    if (res.ok) { Alert.alert("Rejected"); fetchLoanData(); }
  };

  const handleCancelExtension = async (extensionId: number) => {
    try {
      const res = await fetchWithAuth(`${BASE_URL}/api/loan-extension-requests/${extensionId}/cancel/`, { method: "POST" });
      if (res.ok) { Alert.alert("Extension Cancelled"); fetchLoanData(); } 
      else { Alert.alert("Error", (await res.json()).detail || ""); }
    } catch { Alert.alert("Error", "Something went wrong"); }
  };

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;

  const sections = [
    { title: "Incoming Requests", data: incoming, type: "incoming" as SectionType },
    { title: "Outgoing Requests", data: outgoing, type: "outgoing" as SectionType },
    { title: "Loaned Players", data: loanedPlayers, type: "loaned" as SectionType },
    { title: "Loan Extension Requests", data: loanExtensions, type: "extension" as SectionType },
  ];

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item, index) => `${item.id}-${index}`}
      contentContainerStyle={{ paddingBottom: 50, backgroundColor: "#f7f8fa" }}
      stickySectionHeadersEnabled
      ListEmptyComponent={<Text style={styles.empty}>No transfer requests</Text>}
      renderSectionHeader={({ section: { title } }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>{title}</Text>
        </View>
      )}
      renderItem={({ item, section }) => {
        const cardStyles = [styles.card, { marginBottom: 10 }];
        // ---- Loaned Players ----
        if (section.type === "loaned") {
          return (
            <View style={cardStyles}>
              <Text style={styles.playerName}>{item.player_name}</Text>
              <Text>Loan until GW {item.loan_gameweek}</Text>
              <Text>Parent Team: {item.loan_from_team}</Text>
              {item.extension_id ? (
                <>
                  <Text style={styles.extensionText}>
                    ⏳ Extension requested until GW {item.requested_gameweek}
                  </Text>
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: "#e76f51" }]}
                    onPress={() => handleCancelExtension(item.extension_id)}
                  >
                    <Text style={styles.buttonText}>Cancel Extension Request</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => {
                    setSelectedPlayerId(item.transfer_id);
                    setModalVisible(true);
                  }}
                >
                  <Text style={styles.buttonText}>Request Extension</Text>
                </TouchableOpacity>
              )}

              <Modal
                transparent
                visible={modalVisible}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <Text style={{ fontWeight: "bold" }}>New Loan Gameweek</Text>
                    <TextInput
                      keyboardType="numeric"
                      value={newGWInput}
                      onChangeText={setNewGWInput}
                      style={styles.input}
                    />

                    <Text style={{ fontWeight: "bold", marginTop: 10 }}>Amount</Text>
                    <TextInput
                      keyboardType="numeric"
                      value={amountInput}
                      onChangeText={setAmountInput}
                      style={styles.input}
                    />

                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginTop: 20,
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => setModalVisible(false)}
                        style={[styles.button, { backgroundColor: "#aaa" }]}
                      >
                        <Text style={styles.buttonText}>Cancel</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          if (selectedPlayerId) {
                            handleRequestExtension(
                              selectedPlayerId,
                              Number(newGWInput),
                              Number(amountInput) || 0
                            );
                            setModalVisible(false);
                            setNewGWInput("");
                            setAmountInput("");
                          }
                        }}
                        style={styles.button}
                      >
                        <Text style={styles.buttonText}>OK</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>
            </View>
          );
        }

        // ---- Loan Extension Requests ----
        if (section.type === "extension") {
          if (item.to_team_name?.trim().toLowerCase() === myTeamName || item.requested_by_name?.trim().toLowerCase() === myTeamName) return null;
          return (
            <View style={cardStyles}>
              <Text style={styles.playerName}>{item.player_name} ({item.to_team_name})</Text>
              <Text>Current GW: {item.current_gameweek}</Text>
              <Text>Requested until GW: {item.new_loan_gameweek}</Text>
              <Text>Amount: {item.amount}</Text>
              <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                <TouchableOpacity style={styles.approveButton} onPress={() => handleApproveExtension(item.id)}>
                  <Text style={styles.buttonText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.rejectButton} onPress={() => handleRejectExtension(item.id)}>
                  <Text style={styles.buttonText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }

        // ---- Default Transfer Requests ----
        return (
          <View style={cardStyles}>
            <Text style={styles.playerName}>{item.player_name} → {item.to_team_name}</Text>
            <Text>Offer: {item.amount}</Text>
            {item.is_loan && <Text>Loan until GW {item.loan_gameweek}</Text>}
            {item.message && <Text style={styles.message}>Message: {item.message}</Text>}
            <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
              {section.type === "incoming" ? (
                <>
                  <TouchableOpacity style={styles.approveButton} onPress={() => handleAccept(item.id)}>
                    <Text style={styles.buttonText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectButton} onPress={() => handleRejectOrCancel(item.id)}>
                    <Text style={styles.buttonText}>Reject</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={styles.rejectButton} onPress={() => handleRejectOrCancel(item.id)}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    backgroundColor: "#b8a68bff",
    marginTop: 10,
    borderRadius: 8,
    marginHorizontal: 10,
    elevation: 4,
  },
  sectionHeaderText: { fontSize: 20, fontWeight: "bold", padding: 10, alignSelf: "center", color: "#fff" },
  card: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginHorizontal: 10, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  playerName: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  message: { fontStyle: "italic", color: "#555" },
  button: { backgroundColor: "#2a9d8f", padding: 8, borderRadius: 8, alignItems: "center", marginTop: 6 },
  approveButton: { backgroundColor: "#2a9d8f", padding: 8, borderRadius: 8, flex: 1, alignItems: "center" },
  rejectButton: { backgroundColor: "#e76f51", padding: 8, borderRadius: 8, flex: 1, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "700" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 8, marginTop: 10 },
  modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#00000099" },
  modalContent: { width: 300, padding: 20, backgroundColor: "white", borderRadius: 12 },
  empty: { textAlign: "center", marginTop: 20, fontSize: 16, color: "#555" },
  extensionText: { fontStyle: "italic", color: "#555", marginBottom: 4 },

});