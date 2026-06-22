import React, { useState, useEffect } from "react";
import { db } from "../firebase/config"; // Apna path verify kar lena
import { collection, query, where, onSnapshot } from "firebase/firestore";

export default function SystemNotification() {
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    // Sirf wahi notification layega jiska 'active' status true hai
    const q = query(collection(db, "system_notifications"), where("active", "==", true));
    
    // onSnapshot real-time data sunta hai (page refresh ki zaroorat nahi)
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        // Sabse pehla active notification state mein set karega
        setNotification(snapshot.docs[0].data());
      } else {
        setNotification(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Agar koi active notification nahi hai, toh kuch mat dikhao
  if (!notification) return null;

  // Notification Banner UI
  return (
    <div className={`w-full p-2.5 text-center text-xs font-black tracking-wide text-white z-100 shadow-md ${
      notification.type === 'alert' ? 'bg-red-600' : 'bg-indigo-600'
    }`}>
      <span className="mr-2">🔔</span>
      {notification.message}
    </div>
  );
}