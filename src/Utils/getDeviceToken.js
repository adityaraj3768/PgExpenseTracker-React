import { getToken } from "firebase/messaging";
import { messaging } from "./firebase";


export async function getDeviceToken() {
  try {
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.log("❌ Notification permission denied");
      return null;
    }

    const token = await getToken(messaging, {
      // Use the same VAPID key as `firebase.js` (must be the full, valid public key)
      vapidKey: "BE-0IFyKrHP2kdVgzx8RNOL2dBWtNaWyuXF0jU_laWD5QN6vdBixihPgheV8jmmhFn4-Z3ba1mElrEF8lE9rT14"
    });

    // console.log("📱 Device Token:", token);
    return token;

  } catch (err) {
    console.error("🔥 Error getting token:", err);
    return null;
  }
}
