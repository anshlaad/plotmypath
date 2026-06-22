import React, { createContext, useState, useContext, useEffect } from "react";
import { auth, db } from "../firebase/config"; // 🔥 Apne firebase.js file ka sahi path yahan check kar lena
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // User state ab Firebase se sync hoke aayega, loading state zaruri hai taaki blink na ho
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Notifications ka local storage wala system ekdum perfect hai, isko waise hi rakha hai
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem("user_notifications");
    return saved ? JSON.parse(saved) : [];
  });

  // --- 🔥 FIREBASE AUTH & FIRESTORE ENGINE ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // 1. User login ho gaya, Firestore se data fetch karo
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        let userData = {};

        if (userSnap.exists()) {
          // Purana user hai, database se uthao
          userData = userSnap.data();
        } else {
          // 🆕 First-time login: Default Profile database me create karo
          userData = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || "Ansh Laad", // Aapka default name
            email: firebaseUser.email || "anshlaad@gmail.com",
            countryCode: "+91",
            number: firebaseUser.phoneNumber ? firebaseUser.phoneNumber.replace("+91", "") : "9876543210",
            phoneNumber: firebaseUser.phoneNumber || "+919876543210", // Combined field for UI
            role: "IT Professional & Founder",
            profileImage: firebaseUser.photoURL || "",
            completedTrips: 12,
            savedRoutes: 8,
            likedPlaces: [],
            createdAt: new Date().toISOString()
          };
          // Database me save kar diya
          await setDoc(userRef, userData);
        }

        // Local Storage aur State dono me save karo (Offline use ke liye)
        localStorage.setItem("plotmypath_user", JSON.stringify(userData));
        setUser(userData);
      } else {
        // User logout ho gaya, local storage clear kar do
        localStorage.removeItem("plotmypath_user");
        setUser(null);
      }
      setLoading(false); // Checking done
    });

    return () => unsubscribe();
  }, []);

  // Sync Notifications to LocalStorage
  useEffect(() => {
    localStorage.setItem("user_notifications", JSON.stringify(notifications));
  }, [notifications]);

  // 🔥 SYSTEM PUSH NOTIFICATION ENGINE
  const triggerSystemPush = (title, message) => {
    if (!("Notification" in window)) return;
    
    if (Notification.permission === "granted") {
      new Notification(title, { body: message });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") new Notification(title, { body: message });
      });
    }
  };

  // 🔥 NOTIFICATION ADDER
  const addNotification = (title, message, type = "info") => {
    const newNotif = { 
      id: Date.now(), 
      title, 
      message, 
      type, 
      read: false, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    };
    
    setNotifications((prev) => [newNotif, ...prev]);
    triggerSystemPush(title, message);
  };

  const markNotificationsRead = () => {
    setNotifications((prev) => prev.map(n => ({ ...n, read: true })));
  };

  // --- 🔥 CLOUD SYNCED FUNCTIONS ---

  // Update Profile (Local + Firestore Database)
  const updateProfile = async (updatedData) => {
    const newData = { ...user, ...updatedData };
    setUser(newData);
    localStorage.setItem("plotmypath_user", JSON.stringify(newData));

    // Agar Firebase me login hai toh database me bhi update karo
    if (auth.currentUser) {
      const userRef = doc(db, "users", auth.currentUser.uid);
      try {
      await setDoc(userRef, updatedData, { merge: true });
      console.log("Firestore updated successfully with:", updatedData);
    } catch (err) {
      console.error("Firestore update failed:", err);
    }
  }
};

  // Toggle Like Places (Local + Firestore Database)
  const toggleLikePlace = async (place) => {
    if (!user) return;

    const currentLiked = user.likedPlaces || [];
    const exists = currentLiked.some((p) => p.id === place.id);
    const newLikedPlaces = exists 
      ? currentLiked.filter((p) => p.id !== place.id) 
      : [place, ...currentLiked];
    
    // updateProfile function dono (State + Database) handle kar lega
    await updateProfile({ likedPlaces: newLikedPlaces });
  };

  // Firebase Secure Logout
  const logoutUser = async () => {
    try {
      await signOut(auth); // Firebase se session destroy
      localStorage.removeItem("plotmypath_user");
      setUser(null);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, // Naya addition: Taki app load hote waqt UI manage kar sako
      updateProfile, 
      notifications, 
      addNotification, 
      markNotificationsRead, 
      toggleLikePlace, 
      logoutUser 
    }}>
      {/* Jab tak Firebase auth check kar raha hai, children render mat karo (Prevents flickers) */}
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}