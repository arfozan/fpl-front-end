import { Platform } from "react-native";

export async function initializeFirebaseMessaging() {
  // Firebase Messaging is only used on native platforms.
  if (Platform.OS === "web") {
    console.log("Firebase Messaging disabled on web.");
    return;
  }

  const {
    getMessaging,
    onMessage,
    onNotificationOpenedApp,
    requestPermission,
  } = await import("@react-native-firebase/messaging");

  const messaging = getMessaging();

  const status = await requestPermission(messaging);

  console.log("Permission:", status);

  onMessage(messaging, async (remoteMessage) => {
    console.log(
      "🔥 FOREGROUND MESSAGE",
      JSON.stringify(remoteMessage, null, 2)
    );
  });

  onNotificationOpenedApp(messaging, (remoteMessage) => {
    console.log(
      "📲 OPENED FROM BACKGROUND",
      JSON.stringify(remoteMessage, null, 2)
    );
  });
}