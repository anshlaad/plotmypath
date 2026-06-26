import React, { createContext, useState, useContext, useEffect } from "react";
import { auth, db } from "../firebase/config"; // 🔥 Apne firebase.js file ka sahi path yahan check kar lena
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from "firebase/firestore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // User state ab Firebase se sync hoke aayega, loading state zaruri hai taaki blink na ho
const [user, setUser] = useState(() => {
  const savedUser = localStorage.getItem("plotmypath_user");
  return savedUser ? JSON.parse(savedUser) : null;
});

 const [loading, setLoading] = useState(true);

  // Notifications ka local storage wala system ekdum perfect hai, isko waise hi rakha hai
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem("user_notifications");
    return saved ? JSON.parse(saved) : [];
  });

  // --- 🔥 FIREBASE AUTH & FIRESTORE ENGINE ---
  useEffect(() => {
    let unsubscribeSnapshot; // Real-time listener ko rokne ke liye

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);

        // 🔥 NAYA LOGIC: getDoc ki jagah onSnapshot (Real-time data fetch)
        unsubscribeSnapshot = onSnapshot(userRef, async (userSnap) => {
          let userData = {};

          if (userSnap.exists()) {
            // Jaise hi Signup se number aayega, ye turant yahan catch ho jayega!
            userData = userSnap.data();
          } else {
            // 🆕 First-time login via Google: Default Profile
            userData = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || "",
              email: firebaseUser.email || "",
              countryCode: "+91",
              number: firebaseUser.phoneNumber ? firebaseUser.phoneNumber.replace("+91", "") : "",
              phoneNumber: firebaseUser.phoneNumber || "",
              role: "User",
              profileImage: firebaseUser.photoURL || "",
              completedTrips: 0,
              savedRoutes: 0,
              likedPlaces: [],
              createdAt: new Date().toISOString()
            };
            // Database me save kar diya (merge: true ke sath taaki clash na ho)
            await setDoc(userRef, userData, { merge: true });
          }

          // Local Storage aur State update
          localStorage.setItem("plotmypath_user", JSON.stringify(userData));
          setUser(userData);
          setLoading(false); // Checking done
        });

      } else {
        // User logout ho gaya
        localStorage.removeItem("plotmypath_user");
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot(); // Cleanup
    };
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

  // 🔥 YAHAN CHANGE HUA HAI: Jab tak Firebase data load kar raha hai, Spinner dikhao
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      updateProfile, 
      notifications, 
      addNotification, 
      markNotificationsRead, 
      toggleLikePlace, 
      logoutUser 
    }}>
      {/* 🔥 Ab hum yahan direct children render kar sakte hain kyunki loading upar handle ho chuki hai */}
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}