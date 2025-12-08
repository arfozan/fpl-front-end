import { BASE_URL } from "@/config";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
import Animated, { FadeInUp, FadeOut } from "react-native-reanimated";
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
  amount?: string;
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
    Alert.alert("✅ Accepted");
    if (teamId) fetchRequests(teamId);
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
    { title: "Incoming Requests", empty: "No incoming transfer requests", data: incoming, type: "incoming" as SectionType },
    { title: "Outgoing Requests", empty: "You have not sent any transfer requests", data: outgoing, type: "outgoing" as SectionType },
    { title: "Loaned Players", empty: "No players currently on loan", data: loanedPlayers, type: "loaned" as SectionType },
    { title: "Loan Extension Requests", empty: "No loan extension requests", data: loanExtensions, type: "extension" as SectionType },
  ];

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item, index) => `${item.id}-${index}`}
      contentContainerStyle={{ paddingBottom: 50, backgroundColor: "#F4F8FF" }}
      stickySectionHeadersEnabled

      renderSectionHeader={({ section }) => (
        <LinearGradient
          colors={["#001f63ff", "#00558dff"]}
          style={styles.sectionHeader}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
            <MaterialIcons
              name={
                section.type === "incoming"
                  ? "download"
                  : section.type === "outgoing"
                  ? "upload"
                  : section.type === "loaned"
                  ? "people"
                  : "update"
              }
              size={22}
              color="#fff"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.sectionHeaderText}>{section.title}</Text>
          </View>
        </LinearGradient>
      )}

      renderItem={({ item, section }) => {
        if (section.data.length === 0) {
          return (
            <Text style={styles.sectionEmptyText}>
              {section.empty}
            </Text>
          );
        }

        const cardStyles = [styles.card, { marginBottom: 10 }];

        // Loaned players
        if (section.type === "loaned") {
          return (
            <Animated.View entering={FadeInUp} exiting={FadeOut} style={cardStyles}>
              <Text style={styles.playerName}>{item.player_name}</Text>
              <Text>Loan until GW {item.loan_gameweek}</Text>
              <Text>Parent Team: {item.loan_from_team}</Text>

              {item.extension_id ? (
                <>
                  <Text style={styles.extensionText}>⏳ Extension requested until GW {item.requested_gameweek}</Text>
                  <TouchableOpacity
                    style={[styles.buttonRed]}
                    onPress={() => handleCancelExtension(item.extension_id)}
                  >
                    <MaterialIcons name="close" size={16} color="#fff" />
                    <Text style={styles.buttonText}>Cancel Extension</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.buttonBlue}
                  onPress={() => {
                    setSelectedPlayerId(item.transfer_id);
                    setModalVisible(true);
                  }}
                >
                  <MaterialIcons name="event-available" size={16} color="#fff" />
                  <Text style={styles.buttonText}>Request Extension</Text>
                </TouchableOpacity>
              )}

              {/* Modal */}
              <Modal transparent visible={modalVisible} animationType="fade">
                <View style={styles.modalOverlay}>
                  <Animated.View entering={FadeInUp} exiting={FadeOut} style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Extend Loan</Text>

                    <Text style={styles.modalLabel}>New Loan Gameweek</Text>
                    <TextInput
                      keyboardType="numeric"
                      value={newGWInput}
                      onChangeText={setNewGWInput}
                      style={styles.input}
                      placeholder="Enter new gameweek"
                      placeholderTextColor="#999"
                    />

                    <Text style={styles.modalLabel}>Amount</Text>
                    <TextInput
                      keyboardType="numeric"
                      value={amountInput}
                      onChangeText={setAmountInput}
                      style={styles.input}
                      placeholder="Enter amount"
                      placeholderTextColor="#999"
                    />

                    <View style={styles.modalButtonRow}>
                      <TouchableOpacity
                        onPress={() => setModalVisible(false)}
                        style={[styles.modalButton, { backgroundColor: "#999" }]}
                      >
                        <MaterialIcons name="close" size={18} color="#fff" />
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
                        style={[styles.modalButton, { backgroundColor: "#2ECC71" }]}
                      >
                        <MaterialIcons name="check" size={18} color="#fff" />
                        <Text style={styles.buttonText}>OK</Text>
                      </TouchableOpacity>
                    </View>
                  </Animated.View>
                </View>
              </Modal>
            </Animated.View>
          );
        }

        // Loan Extension Requests
        if (section.type === "extension") {
          if (
            item.to_team_name?.trim().toLowerCase() === myTeamName ||
            item.requested_by_name?.trim().toLowerCase() === myTeamName
          ) return null;

          return (
            <Animated.View entering={FadeInUp} exiting={FadeOut} style={cardStyles}>
              <Text style={styles.playerName}>{item.player_name} ({item.to_team_name})</Text>
              <Text>Current GW: {item.current_gameweek}</Text>
              <Text>Requested until GW: {item.new_loan_gameweek}</Text>
              <Text>Amount: {item.amount}</Text>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                <TouchableOpacity style={styles.buttonGreen} onPress={() => handleApproveExtension(item.id)}>
                  <MaterialIcons name="check" size={16} color="#fff" />
                  <Text style={styles.buttonText}>Approve</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.buttonRed} onPress={() => handleRejectExtension(item.id)}>
                  <MaterialIcons name="close" size={16} color="#fff" />
                  <Text style={styles.buttonText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          );
        }

        // Default Transfer Requests
        return (
          <Animated.View entering={FadeInUp} exiting={FadeOut} style={cardStyles}>
            <Text style={styles.playerName}>{item.player_name} → {item.to_team_name}</Text>
            <Text>Offer: {item.amount}</Text>
            {item.is_loan && <Text>Loan until GW {item.loan_gameweek}</Text>}
            {item.message && <Text style={styles.message}>Message: {item.message}</Text>}

            <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
              {section.type === "incoming" ? (
                <>
                  <TouchableOpacity style={styles.buttonGreen} onPress={() => handleAccept(item.id)}>
                    <MaterialIcons name="check-circle" size={16} color="#fff" />
                    <Text style={styles.buttonText}>Accept</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.buttonRed} onPress={() => handleRejectOrCancel(item.id)}>
                    <MaterialIcons name="cancel" size={16} color="#fff" />
                    <Text style={styles.buttonText}>Reject</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={styles.buttonRed} onPress={() => handleRejectOrCancel(item.id)}>
                  <MaterialIcons name="cancel" size={16} color="#fff" />
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    marginTop: 18,
    borderRadius: 14,
    marginHorizontal: 14,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 5,
  },
  sectionHeaderText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.4,
  },
  sectionEmptyText: {
    textAlign: "center",
    color: "#7A92AF",
    fontStyle: "italic",
    paddingVertical: 14,
    fontSize: 15,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 14,
    marginVertical: 7,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#E0E8FF",
  },
  playerName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
    color: "#2B3A55",
  },
  message: {
    fontStyle: "italic",
    color: "#777",
    marginTop: 4,
  },

  // Buttons
  buttonBlue: {
    backgroundColor: "#4B7BE5",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
  },
  buttonGreen: {
    backgroundColor: "#2ECC71",
    paddingVertical: 10,
    borderRadius: 12,
    flex: 1,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  buttonRed: {
    backgroundColor: "#E74C3C",
    paddingVertical: 10,
    borderRadius: 12,
    flex: 1,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  // Inputs
  input: {
    borderWidth: 1,
    borderColor: "#C7D3ED",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 8,
    fontSize: 16,
    backgroundColor: "#F7FAFF",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalContent: {
    width: 330,
    padding: 26,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
    color: "#2B3A55",
  },
  modalLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 10,
    color: "#445A77",
  },
  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 22,
  },
  modalButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    flex: 1,
    borderRadius: 10,
    justifyContent: "center",
  },
  
  extensionText: {
    fontStyle: "italic",
    color: "#5F6F8F",
    marginBottom: 6,
  },
});
