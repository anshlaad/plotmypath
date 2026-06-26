// public/firebase-messaging-sw.js

// Firebase background libraries import kar rahe hain
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

// Apni Firebase config yahan paste karo (firebase/config.js wali same details)
const firebaseConfig = {
  apiKey: "AIzaSyApPUuQqibuS3tz42xrHteT9QOk4s2ojaw",
  authDomain: "plotmypath.firebaseapp.com",
  projectId: "plotmypath",
  storageBucket: "plotmypath.firebasestorage.app",
  messagingSenderId:"318092287903",
  appId: "1:318092287903:web:e6acc32b2164a751e867aa",
  measurementId: "G-1GHWMQLJBJ"
};

// Initialize Firebase App
firebase.initializeApp(firebaseConfig);

// Retrieve firebase messaging
const messaging = firebase.messaging();

// Background notification receiver
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo-192x192.png', // Aapka PWA icon
    badge: '/favicon.png', // Chota icon
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});