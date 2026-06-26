import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSwipeable } from "react-swipeable";
import { motion, AnimatePresence } from "framer-motion";
import AppRoutes from "./routes/AppRoutes.jsx";

// 👇 FIX 1: Missing Imports add kar diye hain
import { requestForToken, db } from './firebase/config';
import { doc, setDoc } from "firebase/firestore"; 
import { useAuth } from "./context/AuthContext"; // Path check kar lena agar alag ho

// 🌟 FIX 2: INVISIBLE BACKGROUND COMPONENT 
// Ye component UI mein kuch nahi dikhayega, bas chup-chaap peeche token save karega
function NotificationManager() {
  const { user } = useAuth(); 

  useEffect(() => {
    const setupNotifications = async () => {
      const token = await requestForToken();
      if (token) {
        if (user) {
          const userRef = doc(db, "users", user.uid);
          await setDoc(userRef, { fcmToken: token }, { merge: true });
          console.log("Token saved to User Profile!");
        } else {
          const guestRef = doc(db, "guest_tokens", token);
          await setDoc(guestRef, { token: token, createdAt: new Date().toISOString() });
          console.log("Guest Token saved!");
        }
      }
    };
    setupNotifications();
  }, [user]);

  return null; // Hidden component
}


function App() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Ye track karega ki slide kis taraf hona chahiye (Left ya Right)
  const [direction, setDirection] = useState(0);

  // 🔥 IMPORTANT: Apne asli URLs ka order yahan likhna
  const pageOrder = ['/','/home',  '/explore', '/planner', '/packing', '/split-expense', '/profile']; 

  // Swipe Detect Logic
  const handlers = useSwipeable({
    onSwipedLeft: () => {
      const currentIndex = pageOrder.indexOf(location.pathname);
      if (currentIndex !== -1 && currentIndex < pageOrder.length - 1) {
        setDirection(1); // Aage badh rahe hain
        navigate(pageOrder[currentIndex + 1]);
      }
    },
    onSwipedRight: () => {
      const currentIndex = pageOrder.indexOf(location.pathname);
      if (currentIndex > 0) {
        setDirection(-1); // Peeche ja rahe hain
        navigate(pageOrder[currentIndex - 1]);
      }
    },
    preventScrollOnSwipe: false,
    trackMouse: true // PC par test karne ke liye true rakha hai
  });

  // 🚀 Animation Variants (Ye slide ko smooth banayega bina black screen ke)
  const pageVariants = {
    initial: (dir) => ({
      x: dir > 0 ? "100%" : "-100%", // Naya page bahar se aayega
      opacity: 1,
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: { type: "tween", ease: "easeOut", duration: 0.25 }
    },
    exit: (dir) => ({
      x: dir > 0 ? "-30%" : "30%", // Purana page thoda piche khisak jayega (Premium Feel)
      opacity: 0.5, // Thoda dark ho jayega taaki naya page pop ho
      transition: { type: "tween", ease: "easeOut", duration: 0.25 }
    })
  };

  return (
    // ✨ OUTER WRAPPER
    <div className="min-h-screen w-full bg-black flex justify-center overflow-hidden">
      
      {/* 🚀 Ye humara invisible guard hai jo backend handle karega */}
      <NotificationManager />

      {/* 📱 MOBILE CONTAINER */}
      <div 
        {...handlers} 
        // 👇 Yahan overflow-x-hidden kar diya hai
        className="w-full max-w-md bg-slate-900 h-screen relative shadow-[0_0_50px_rgba(0,0,0,0.5)] border-x border-slate-800 overflow-x-hidden"
      >
        
        {/* AnimatePresence pages ko control karega */}
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={location.pathname}
            custom={direction}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            // 👇 Yahan h-screen aur overflow-y-auto add kiya hai taaki har page apne aap scroll ho
            className="w-full h-screen absolute top-0 left-0 bg-slate-900 overflow-y-auto overflow-x-hidden" 
          >
            <AppRoutes />
          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
}

export default App;