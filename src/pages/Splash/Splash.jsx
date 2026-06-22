import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

function Splash() {

  const navigate = useNavigate();

  useEffect(() => {

    const timer = setTimeout(() => {
      navigate("/onboarding");
    }, 3000);

    return () => clearTimeout(timer);

  }, []);

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