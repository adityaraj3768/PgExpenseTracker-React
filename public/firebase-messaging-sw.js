importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js');

// Service worker version for debugging
console.log('[Service Worker] Firebase messaging service worker loaded');

// Wait for service worker to be ready
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activated');
  event.waitUntil(self.clients.claim());
});

// Initialize Firebase after service worker is ready
try {
  firebase.initializeApp({
    apiKey: "AIzaSyBD-3YedGB3xdIAgHEHmxNohufhaPww2bs",
    authDomain: "pgexpensetracker.firebaseapp.com",
    projectId: "pgexpensetracker",
    storageBucket: "pgexpensetracker.appspot.com",
    messagingSenderId: "175365812217",
    appId: "1:175365812217:web:f84ca83658547809d31728",
    measurementId: "G-HMDHE8CLX8"
  });

  const messaging = firebase.messaging();
  console.log('[Service Worker] Firebase messaging initialized');

  // Verify pushManager is available (service-worker safe checks)
  try {
    const pushAvailable = typeof PushManager !== 'undefined' || (self.registration && self.registration.pushManager);
    if (pushAvailable) {
      console.log('[Service Worker] Push messaging is supported');
    } else {
      console.warn('[Service Worker] Push messaging is not supported');
    }
  } catch (e) {
    console.warn('[Service Worker] Push messaging check failed', e);
  }

  messaging.onBackgroundMessage(function(payload) {
    console.log('[Service Worker] Received background message:', payload);
    
    try {
      const notificationTitle = payload.notification?.title || 'PG Expense Tracker';
      const notificationOptions = {
        body: payload.notification?.body || 'You have a new notification',
        icon: '/vite.svg',
        badge: '/vite.svg',
        timestamp: Date.now(),
        tag: 'expense-notification',
        data: payload.data || {},
        requireInteraction: false,
        silent: false
      };

      // Show notification and log any errors
      return self.registration.showNotification(notificationTitle, notificationOptions)
        .then(() => {
          console.log('[Service Worker] showNotification succeeded');
        })
        .catch((err) => {
          console.error('[Service Worker] showNotification failed:', err);
        });
    } catch (error) {
      console.error('[Service Worker] Error showing notification:', error);
    }
  });

  console.log('[Service Worker] Background message handler registered');
} catch (error) {
  console.error('[Service Worker] Initialization error:', error);
}

// Also listen for raw push events so we can reliably display notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] push event received');
  let payload = {};
  try {
    if (event.data) {
      try {
        payload = event.data.json();
      } catch (e) {
        // If payload isn't JSON, treat as text
        payload = { notification: { title: 'New message', body: event.data.text() } };
      }
    }
  } catch (err) {
    console.error('[Service Worker] Error parsing push event data:', err);
  }

  const title = payload.notification?.title || 'PG Expense Tracker';
  const options = {
    body: payload.notification?.body || '',
    icon: '/vite.svg',
    badge: '/vite.svg',
    data: payload.data || {},
    tag: 'expense-notification-' + Date.now(),
  };

  // Log current permission state (worker side)
  try {
    console.log('[Service Worker] Notification.permission:', (self.Notification && self.Notification.permission) || 'unknown');
  } catch (e) {
    console.warn('[Service Worker] Could not read Notification.permission', e);
  }

  // Log the notification details before attempting to show it
  console.log('[Service Worker] push showNotification with title/options:', title, options);

  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => console.log('[Service Worker] push showNotification succeeded'))
      .catch((err) => {
        console.error('[Service Worker] push showNotification error:', err);
      })
  );
});
