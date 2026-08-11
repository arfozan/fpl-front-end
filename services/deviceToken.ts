import { BASE_URL } from "@/config";
import {
    getMessaging,
    getToken,
} from "@react-native-firebase/messaging";

export async function registerDeviceToken(accessToken: string) {
  try {
    const messaging = getMessaging();

    const token = await getToken(messaging);

    const response = await fetch(`${BASE_URL}/api/device-token/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        platform: "android",
      }),
    });
    console.log("Status:", response.status);

    const text = await response.text();

    console.log(text);

    if (!response.ok) {
      console.log("Failed to register device.");
      return;
    }

    console.log("✅ Device registered for notifications");
  } catch (err) {
    console.log("Device registration failed:", err);
  }
}