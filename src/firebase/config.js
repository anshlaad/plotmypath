import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const messaging = getMessaging(app); // 👈 Bhejega dynamic notification messages 

// 👇 NAYA CODE: Device ka FCM Token (Pata) nikalne ke liye
export const requestForToken = async () => {
  try {
    const currentToken = await getToken(messaging, { 
      // VAPID key ko bhi .env se hi lenge security ke liye
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY 
    });
    
    if (currentToken) {
      console.log("Ye raha aapka FCM Token:", currentToken);
      return currentToken;
    } else {
      console.log("No registration token available. Request permission to generate one.");
      return null;
    }
  } catch (err) {
    console.error("An error occurred while retrieving token. ", err);
    return null;
  }
};

// 👇 NAYA CODE: Jab app OPEN ho aur admin panel se notification aaye
export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log("Foreground Message received: ", payload);
      resolve(payload);
    });
  });