import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config"; // 👈 Upar wali config file se import kiya

// 🔄 DOSTON KE PHONES KO REALTIME SYNC RAKHNE WALA SNAPSHOT LISTENER
export function listenToTripExpenses(tripId, setExpenses, setPartners) {
  const tripRef = doc(db, "trips", tripId);
  
  // onSnapshot doston ke phone me dynamic live data stream pipes open rakhta hai
  return onSnapshot(tripRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      setExpenses(data.expenses || []);
      setPartners(data.members || []);
    }
  });
}

// 🔔 PUSH NOTIFICATION DISPATCH TRIGGER
export async function sendNotificationToPartner(partnerDeviceToken, messageText) {
  // Yeh backend API ya direct Firebase messaging server ko hit karke push notify karega
  await fetch("https://fcm.googleapis.com/fcm/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "key=YOUR_SERVER_KEY" // Firebase cloud messaging server key
    },
    body: JSON.stringify({
      to: partnerDeviceToken,
      notification: {
        title: "Trip Ledger Update 💸",
        body: messageText,
        sound: "default"
      }
    })
  });
}