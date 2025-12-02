import { getMessaging, getToken } from "firebase/messaging";
import { useState } from "react";
import axios from "axios";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithPhoneNumber,
  RecaptchaVerifier,
} from "firebase/auth";
import { getApiUrl } from "./api";
// === PHONE AUTH/OTP ===
// Always use the same app and auth instance
const firebaseConfig = {
  apiKey: "AIzaSyBD-3YedGB3xdIAgHEHmxNohufhaPww2bs",
  authDomain: "pgexpensetracker.firebaseapp.com",
  projectId: "pgexpensetracker",
  storageBucket: "pgexpensetracker.appspot.com",
  messagingSenderId: "175365812217",
  appId: "1:175365812217:web:f84ca83658547809d31728",
  measurementId: "G-HMDHE8CLX8",
};

// Initialize
const app = initializeApp(firebaseConfig);
let authInstance;

export function getFirebaseAuth() {
  if (!authInstance) {
    authInstance = getAuth(app);
  }
  return authInstance;
}

// ✅ Always export one shared auth
export const auth = getAuth(app);

const setupRecaptcha = () => {
  console.log("this is setup recaptcha function");
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth,
      "recaptcha-container",
      {
        size: "invisible",
        callback: (response) => {
          console.log("reCAPTCHA solved");
        },
      },
      
    );
  }
  return window.recaptchaVerifier;
};

export async function sendOtp(phoneNumber,setConfirmationResult) {

  console.log(`Sending OTP to ${phoneNumber}...`);
  const appVerifier = setupRecaptcha();
  console.log(appVerifier);
  try {
    const confirmationResult = await signInWithPhoneNumber(
      auth,
      phoneNumber,
      appVerifier
    );
    setConfirmationResult(confirmationResult);
    console.log("OTP sent!");
  } catch (error) {
    console.error("Error sending OTP:", error);
  }
}

const verifyOtp = () => {
    if (!confirmationResult) return;

    confirmationResult
      .confirm(otp)
      .then((result) => {
        console.log("Phone verified:", result.user.phoneNumber);
        // Allow user to reset password here
        alert("Phone verified! Now reset your password.");
      })
      .catch((error) => {
        console.error("OTP verification failed:", error);
      });
  };



// === PUSH NOTIFICATIONS === 

export const messaging = getMessaging(app);

// Check if notification setup is needed on app startup
export async function checkNotificationSetup(userId) {
  // Only run this check if user is already logged in
  const authToken = localStorage.getItem("token");
  if (!authToken || !userId) {
    console.log("No auth token or userId - skipping notification check");
    return;
  }


  const NOTIFICATION_PERMISSION_KEY = "notificationPermissionRequested";
  const hasRequestedBefore = localStorage.getItem(NOTIFICATION_PERMISSION_KEY);

  // Check if we should prompt for notifications
  const permission = Notification.permission;

  if (permission === "default" && !hasRequestedBefore) {
    // User hasn't been asked yet - set up notifications
    console.log("Setting up notifications for already logged in user");
    await registerDeviceForNotifications(userId);
  } else if (permission === "granted") {
    // User already granted permission, check if device is registered
    const deviceRegistered = localStorage.getItem(
      "deviceRegisteredForNotifications"
    );
    if (!deviceRegistered) {
      console.log("Re-registering device for already logged in user");
      await registerDeviceForNotifications(userId);
    }
  }
}

export async function registerDeviceForNotifications(userId) {
  try {
    // Check if the browser supports service workers and push notifications
    if (!('serviceWorker' in navigator) || typeof PushManager === 'undefined') {
      console.log('Push notifications are not supported by this browser');
      return;
    }

    // Register service worker
    let registration;
    try {
      // Try to find any registration whose scriptURL ends with our SW filename
      const regs = await navigator.serviceWorker.getRegistrations();
      registration = regs.find(
        (r) => (r?.scriptURL || '') .endsWith('/firebase-messaging-sw.js')
      );

      if (!registration) {
        // If no existing registration, create new one
        registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('New Service Worker registered', registration);
      } else {
        console.log('Found existing Service Worker registration', registration);
      }

      // Wait until an active service worker is ready and controlling the page
      registration = await navigator.serviceWorker.ready;

      if (!registration || !registration.active) {
        throw new Error('No active service worker after ready');
      }

      // Confirm PushManager availability on the registration
      if (!registration.pushManager) {
        console.warn('PushManager not available on ServiceWorkerRegistration');
      }
    } catch (swError) {
      console.error('Service Worker registration failed:', swError);
      return;
    }

    // Check notification permission with localStorage tracking
    const NOTIFICATION_PERMISSION_KEY = "notificationPermissionRequested";
    const hasRequestedBefore = localStorage.getItem(
      NOTIFICATION_PERMISSION_KEY
    );

    let permission = Notification.permission;

    if (permission === "granted") {
      // Notification permission already granted
    } else if (permission === "denied") {
      // Notification permission was denied
      return;
    } else if (permission === "default" && !hasRequestedBefore) {
      // Only request permission if we haven't asked before
      // Requesting notification permission for the first time
      permission = await Notification.requestPermission();

      // Mark that we've requested permission (regardless of the response)
      localStorage.setItem(NOTIFICATION_PERMISSION_KEY, "true");

      if (permission !== "granted") {
        // Notification permission not granted
        return;
      }
    } else {
      // User has been asked before but permission is still default (shouldn't happen normally)
      // or we've already asked this session
      // Notification permission already requested previously
      if (permission !== "granted") {
        return;
      }
    }

    // Notification permission granted

    // Get FCM token with retry mechanism
    let token;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        token = await getToken(messaging, {
          vapidKey:
            "BE-0IFyKrHP2kdVgzx8RNOL2dBWtNaWyuXF0jU_laWD5QN6vdBixihPgheV8jmmhFn4-Z3ba1mElrEF8lE9rT14",
          serviceWorkerRegistration: registration,
        });

        if (token) {
          // FCM Token obtained successfully
          break;
        } else {
          throw new Error("No token received");
        }
      } catch (tokenError) {
        retryCount++;
        console.warn(
          `FCM token retrieval attempt ${retryCount} failed:`,
          tokenError
        );

        if (retryCount >= maxRetries) {
          console.error("Failed to get FCM token after multiple attempts");
          return;
        }

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
      }
    }

    if (token) {
      console.log('FCM token obtained:', token);
    }

    

    // Get auth token
    const authToken = localStorage.getItem("token");
    if (!authToken) {
      console.error("No authentication token found");
      return;
    }

    // Register device with backend
    try {
      const response = await axios.post(
        getApiUrl("/pg/register-device"),
        {
          userId: userId,
          token: token, // Backend expects 'token' field
          
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (response.status === 200) {
        // Device registered successfully for notifications
        // Mark that device is registered
        localStorage.setItem("deviceRegisteredForNotifications", "true");
      } else {
        console.warn("Unexpected response from server:", response);
      }
    } catch (apiError) {
      console.error(
        "❌ Error registering device with backend:",
        apiError.response?.data || apiError.message
      );
    }
  } catch (err) {
    console.error("❌ Error in notification registration process:", err);
  }
}
