import { BASE_URL } from "@/config";
import { useEffect } from "react";
import { Alert } from "react-native";
import { useAuth } from "../../context/AuthContext";
import Login from "../login";
import MyTeam from "../myteam";

export default function ProfileTab() {
  const { user, fetchWithAuth } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Fetch expiring contracts after login
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
      .catch((err) =>
        console.error("Failed to fetch expiring contracts:", err)
      );
  }, [user]);

  const sendTestNotification = async () => {
    try {
      const res = await fetchWithAuth(
        `${BASE_URL}/api/test-notification/`,
        {
          method: "POST",
        }
      );

      const data = await res.json();

      console.log("Notification:", data);
    } catch (err) {
      console.log(err);
    }
  };

  if (!user) {
    return <Login />;
  }

  return (
    <>
      <MyTeam />
    </>
  );
}