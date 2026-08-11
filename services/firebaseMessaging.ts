import {
  getMessaging,
  onMessage,
  onNotificationOpenedApp,
  requestPermission
} from "@react-native-firebase/messaging";

export async function initializeFirebaseMessaging() {
  const messaging = getMessaging();

  const status = await requestPermission(messaging);

  console.log("Permission:", status);

  onMessage(messaging, async remoteMessage => {
    console.log(
      "🔥 FOREGROUND MESSAGE",
      JSON.stringify(remoteMessage, null, 2)
    );
  });

  onNotificationOpenedApp(messaging, remoteMessage => {
    console.log(
      "📲 OPENED FROM BACKGROUND",
      JSON.stringify(remoteMessage, null, 2)
    );
  });
}