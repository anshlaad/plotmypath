import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSwipeable } from "react-swipeable";
import { motion, AnimatePresence } from "framer-motion";
import AppRoutes from "./routes/AppRoutes.jsx";
import { ThemeProvider, useTheme } from './context/ThemeContext.jsx'; // 🟢 useTheme import kiya
import { requestForToken, db } from './firebase/config';
import { doc, setDoc } from "firebase/firestore"; 
import { useAuth } from "./context/AuthContext";

// 🌟 Notification Manager (No change here)
function NotificationManager() {
  const { user } = useAuth(); 
  useEffect(() => {
    const setupNotifications = async () => {
      const token = await requestForToken();
      if (token) {
        if (user) {
          const userRef = doc(db, "users", user.uid);
          await setDoc(userRef, { fcmToken: token }, { merge: true });
        } else {
          const guestRef = doc(db, "guest_tokens", token);
          await setDoc(guestRef, { token: token, createdAt: new Date().toISOString() });
        }
      }
    };
    setupNotifications();
  }, [user]);
  return null;
}



// 🟢 Wrapper component taaki "dark" class globally apply ho sake
function ThemeWrapper({ children }) {
  const { theme } = useTheme();
  useEffect(() => {
    // Jab bhi theme badlegi, ye html tag pe dark class toggle karega
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);
  
  return <>{children}</>;
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [direction, setDirection] = useState(0);

  const pageOrder = ['/','/home', '/explore', '/planner', '/packing', '/split-expense', '/profile']; 

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      const currentIndex = pageOrder.indexOf(location.pathname);
      if (currentIndex !== -1 && currentIndex < pageOrder.length - 1) {
        setDirection(1);
        navigate(pageOrder[currentIndex + 1]);
      }
    },
    onSwipedRight: () => {
      const currentIndex = pageOrder.indexOf(location.pathname);
      if (currentIndex > 0) {
        setDirection(-1);
        navigate(pageOrder[currentIndex - 1]);
      }
    },
    preventScrollOnSwipe: false,
    trackMouse: true
  });

  const pageVariants = {
    initial: (dir) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 1 }),
    animate: { x: 0, opacity: 1, transition: { type: "tween", ease: "easeOut", duration: 0.25 } },
    exit: (dir) => ({ x: dir > 0 ? "-30%" : "30%", opacity: 0.5, transition: { type: "tween", ease: "easeOut", duration: 0.25 } })
  };

  return (
    <ThemeProvider>
      <ThemeWrapper>
        <div className="min-h-screen w-full bg-black flex justify-center overflow-hidden">
          <NotificationManager />
          
          {/* 📱 MOBILE CONTAINER - Background ab dynamic hoga dark mode ke hisaab se */}
          <div 
            {...handlers} 
            className="w-full max-w-md bg-slate-50 dark:bg-slate-900 h-screen relative shadow-[0_0_50px_rgba(0,0,0,0.5)] border-x border-slate-200 dark:border-slate-800 overflow-x-hidden"
          >
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              <motion.div
                key={location.pathname}
                custom={direction}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full h-full absolute top-0 left-0 overflow-y-auto overflow-x-hidden" 
              >
                <AppRoutes />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </ThemeWrapper>
    </ThemeProvider>
  );
}

export default App;