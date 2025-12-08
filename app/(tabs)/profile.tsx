import { BASE_URL } from "@/config";
import { useEffect } from "react";
import { Alert } from "react-native";
import { useAuth } from "../../context/AuthContext";
import Login from "../login";
import MyTeam from "../myteam";
import NoTeam from "../NoTeam"; // ⬅️ Import the new screen

export default function ProfileTab() {
  const { user, fetchWithAuth } = useAuth();

  useEffect(() => {
    if (!user || !user.team) return; // ⬅️ ONLY fetch contracts if user has a team

    fetchWithAuth(`${BASE_URL}/api/my-team-players/`)
      .then((res) => res.json())
      .then((data) => {
        const count = data.expiring_contracts_count || 0;
        if (count > 0) {
          Alert.alert(
            "⚠️ Contract Reminder",
            `You have ${count} player${count > 1 ? "s" : ""} without contract.\n\nAssign contract or you will be fined.`
          );
        }
      })
      .catch((err) => console.error("Failed to fetch expiring contracts:", err));
  }, [user]);

  return !user ? (
    <Login />
  ) : user.hasNoTeam ? (
    <NoTeam />
  ) : (
    <MyTeam />
  );
}
