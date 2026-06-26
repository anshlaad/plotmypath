import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
// 👇 1. Apna useAuth import karo (Apne folder ke hisaab se path check kar lena)
import { useAuth } from "../../context/AuthContext"; 

function Splash() {
  const navigate = useNavigate();
  // 👇 2. Context se user aur loading status nikalo
  const { user, loading } = useAuth(); 

  useEffect(() => {
    // Agar background mein Firebase abhi user check kar raha hai, toh ruk jao
    if (loading) return;

    const timer = setTimeout(() => {
      // 👇 3. Naya Navigation Logic
      if (user) {
        navigate("/home"); // 🟢 Agar login hai, toh direct Home!
      } else {
        navigate("/onboarding"); // 🔴 Agar naya user hai, toh Onboarding pe bhejo
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [user, loading, navigate]); // Dependencies add kar di hain

  // 👇 UI ekdum 100% WAHI HAI, koi change nahi kiya
  return (
    <div className="h-screen bg-linear-to-br from-indigo-600 via-blue-500 to-cyan-400 flex flex-col justify-center items-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1 }}
        className="text-7xl"
      >
        ✈️
      </motion.div>

      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-white text-5xl font-bold mt-5"
      >
        PlotMyPath
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-white mt-3 text-lg"
      >
        Smart Vacation Planner
      </motion.p>
    </div>
  );
}

export default Splash;