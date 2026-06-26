import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FaHome, FaSearch, FaRobot, FaWallet, FaSuitcase, FaUser, FaMoneyBillWave } from "react-icons/fa";

function BottomNav() {
  const navigate = useNavigate();
  const [clickCount, setClickCount] = useState(0);

  const handleProfileClick = (e) => {
    setClickCount((prev) => prev + 1);
    if (clickCount >= 2) {
      e.preventDefault();
      navigate("/leads");
      setClickCount(0);
    }
    setTimeout(() => setClickCount(0), 2000);
  };

  const getNavClass = (isActive) => {
    return `relative p-2 rounded-full flex items-center justify-center transition-all duration-300
      ${isActive 
        ? "bg-white/30 text-indigo-900 shadow-lg scale-105" // Active glass state
        : "text-white/70 hover:text-white"
      }`;
  };

  return (
    // 🟢 Glassy, Compact aur Fixed Position
<div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.2)] rounded-full w-[90%] max-w-[320px] py-1 flex justify-around items-center px-1 border border-white/20 z-9999">      
      <NavLink to="/home" className="flex justify-center">{({ isActive }) => <div className={getNavClass(isActive)}><FaHome size={14}/></div>}</NavLink>
      <NavLink to="/explore" className="flex justify-center">{({ isActive }) => <div className={getNavClass(isActive)}><FaSearch size={14}/></div>}</NavLink>
      <NavLink to="/planner" className="flex justify-center">{({ isActive }) => <div className={getNavClass(isActive)}><FaRobot size={14}/></div>}</NavLink>
      <NavLink to="/budget" className="flex justify-center">{({ isActive }) => <div className={getNavClass(isActive)}><FaWallet size={14}/></div>}</NavLink>
      <NavLink to="/packing" className="flex justify-center">{({ isActive }) => <div className={getNavClass(isActive)}><FaSuitcase size={14}/></div>}</NavLink>
      <NavLink to="/split-expense" className="flex justify-center">{({ isActive }) => <div className={getNavClass(isActive)}><FaMoneyBillWave size={14}/></div>}</NavLink>

      <NavLink to="/profile" className="flex justify-center cursor-pointer" onClick={handleProfileClick}>
        {({ isActive }) => (
          <div className={getNavClass(isActive)}>
            <FaUser size={14}/>
          </div>
        )}
      </NavLink>
    </div>
  );
}

export default BottomNav;