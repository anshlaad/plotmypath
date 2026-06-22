import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FaHome, FaSearch, FaRobot, FaSuitcase, FaMoneyBillWave, FaUser } from "react-icons/fa";

function BottomNav() {
  const navigate = useNavigate();
  const [clickCount, setClickCount] = useState(0);

  // Profile click handler (Normal click pe profile jayega, 3 lagatar click pe Admin khulega)
  const handleProfileClick = (e) => {
    setClickCount((prev) => prev + 1);
    
    // Agar 3 baar click hua (0 -> 1 -> 2)
    if (clickCount >= 2) {
      e.preventDefault(); // Profile pe jane se roko
      navigate("/leads"); // Direct Admin page pe bhej do bina prompt ke
      setClickCount(0);   // Count reset kar do
    }

    // 2 second baad automatically count zero ho jayega
    setTimeout(() => setClickCount(0), 2000);
  };

  // Aapka original Glassmorphism style
  const getNavClass = (isActive) => {
    return `relative p-2 rounded-full flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] 
      ${isActive 
        ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-500/20 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)] border border-indigo-100/20 backdrop-blur-sm scale-105" 
        : "text-gray-400 dark:text-gray-500 hover:text-indigo-500 hover:bg-gray-100/20"
      }`;
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg shadow-[0_8px_24px_rgba(0,0,0,0.06)] rounded-full w-[92%] max-w-sm py-1.5 flex justify-between items-center px-2 border border-white/40 dark:border-slate-800/40 z-99999 transition-all duration-300 gap-1">
      
      <NavLink to="/home" className="flex-1 flex justify-center">{({ isActive }) => <div className={getNavClass(isActive)}><FaHome size={15}/></div>}</NavLink>
      <NavLink to="/explore" className="flex-1 flex justify-center">{({ isActive }) => <div className={getNavClass(isActive)}><FaSearch size={15}/></div>}</NavLink>
      <NavLink to="/planner" className="flex-1 flex justify-center">{({ isActive }) => <div className={getNavClass(isActive)}><FaRobot size={15}/></div>}</NavLink>
      <NavLink to="/packing" className="flex-1 flex justify-center">{({ isActive }) => <div className={getNavClass(isActive)}><FaSuitcase size={15}/></div>}</NavLink>
      <NavLink to="/split-expense" className="flex-1 flex justify-center">{({ isActive }) => <div className={getNavClass(isActive)}><FaMoneyBillWave size={15}/></div>}</NavLink>

      {/* 👤 Profile Tab - YAHAN FIX KIYA HAI */}
      <NavLink 
        to="/profile" 
        className="flex-1 flex justify-center cursor-pointer"
        onClick={handleProfileClick}
      >
        {({ isActive }) => (
          <div className={getNavClass(isActive)}>
            <FaUser size={15}/>
          </div>
        )}
      </NavLink>

    </div>
  );
}

export default BottomNav;