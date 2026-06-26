import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
// 👇 NEW: FaSignInAlt import kiya Login button ke liye
import { FaBriefcase, FaMoon, FaSun, FaSignOutAlt, FaChevronRight, FaInfoCircle, FaEdit, FaPhone, FaTimes, FaCamera, FaMapMarkerAlt, FaBookmark, FaTrash, FaHeartBroken, FaHeart, FaSignInAlt } from "react-icons/fa";
import BottomNav from "../../components/BottomNav";
import { motion, AnimatePresence } from "framer-motion";
import emailjs from '@emailjs/browser';

// 🔥 Firebase Auth Imports
import { getAuth, signOut } from "firebase/auth";

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const auth = getAuth(); // Firebase auth instance

  const [darkMode, setDarkMode] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  
  // 🗂️ NEW SEGMENT SWITCH: Tabs control system ("saved" or "favorites")
  const [activeSegment, setActiveSegment] = useState("saved");

  const [showAllSaved, setShowAllSaved] = useState(false);
  const [showAllLiked, setShowAllLiked] = useState(false);
  
  // 🎒 Saved Itineraries State
  const [savedTrips, setSavedTrips] = useState([]);
  
  // ❤️ Dynamic Liked Places State
  const [likedPlaces, setLikedPlaces] = useState(user?.likedPlaces || []);

  // Profile Editor States
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [editCountryCode, setEditCountryCode] = useState(user?.countryCode || "+91"); 
  const [editNumber, setEditNumber] = useState(user?.number || "");
  const [editRole, setEditRole] = useState(user?.role || "");
  const [editImage, setEditImage] = useState(user?.profileImage || "");
  const [editEmail, setEditEmail] = useState(user?.email || "");
  
  // OTP States
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [systemGeneratedOtp, setSystemGeneratedOtp] = useState("");

  // Load Saved Itineraries
  useEffect(() => {
    const data = localStorage.getItem("plotmypath_saved_itineraries");
    if (data) {
      const sorted = JSON.parse(data).sort((a, b) => new Date(b.savedAt || 0) - new Date(a.savedAt || 0));
      setSavedTrips(sorted);
    }
  }, []);

  useEffect(() => {
    if (user?.likedPlaces) setLikedPlaces(user.likedPlaces);
  }, [user?.likedPlaces]);

  // ✅ Slicing Logic
  const displayedSaved = showAllSaved ? savedTrips : savedTrips.slice(0, 2);
  const displayedLiked = showAllLiked ? likedPlaces : likedPlaces.slice(0, 2);

  const handleDeleteTrip = (id, e) => {
    e.stopPropagation(); 
    const updated = savedTrips.filter(trip => trip.id !== id);
    setSavedTrips(updated);
    localStorage.setItem("plotmypath_saved_itineraries", JSON.stringify(updated));
  };

  const handleUnlikePlace = (id, e) => {
    e.stopPropagation();
    const updatedPlaces = likedPlaces.filter(place => place.id !== id);
    setLikedPlaces(updatedPlaces);
    if (updateProfile) updateProfile({ ...user, likedPlaces: updatedPlaces });
    alert("Spot removed from bucket list! 💔");
  };

  const handleImageUploadChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setEditImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleNumberInputChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); 
    if (value.length <= 10) setEditNumber(value); 
  };

  const handleSaveProfileClick = () => {
    if (!editName.trim() || !editNumber.trim()) return alert("Fields required!");
    
    const randomOtp = Math.floor(1000 + Math.random() * 9000).toString();
    setSystemGeneratedOtp(randomOtp);

    emailjs.send('service_e3k8gml', 'template_wtkufbg', {
      to_email: editEmail,
      otp_code: randomOtp,
      name: user?.name || "User" 
    }, 'PMgBh3rAMaoK7cLju')
    .then(() => {
      alert("OTP sent to your email!");
      setShowOtpScreen(true);
    })
    .catch((err) => {
      console.error(err);
      alert("Email Error: " + err.text); 
      alert("For testing, your OTP is: " + randomOtp);
      setShowOtpScreen(true);
    });
  };

  const handleVerifyOtpSubmit = async () => {
    if (otpValue === systemGeneratedOtp) {
      const updatedData = { 
        name: editName.trim(), 
        countryCode: editCountryCode, 
        number: editNumber, 
        role: editRole.trim(), 
        email: editEmail,
        profileImage: editImage, 
        likedPlaces: likedPlaces 
      };

      await updateProfile(updatedData);
      setShowOtpScreen(false);
      setIsEditing(false);
      setOtpValue("");
      alert("Profile Updated Successfully! ✅");
    } else {
      alert("Verification Token mismatch!");
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to disconnect your account?")) {
      await signOut(auth);
      navigate("/login");
    }
  };

  // 🔥 REMOVED: Bada wala "Login Required" lock yahan se hata diya hai

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className={`min-h-screen pb-32 transition-colors duration-300 overflow-y-auto ${darkMode ? "bg-slate-900 text-white" : "bg-slate-50 text-gray-800"}`}
    >
      <motion.div className="bg-linear-to-r from-violet-600 to-indigo-600 rounded-b-[35px] p-6 pt-10 pb-12 text-white text-center shadow-lg relative">
        
        {/* 👇 NEW: Login/Signup Button (Top Left - Sirf guest ko dikhega) */}
        {!user && (
          <button 
            onClick={() => navigate("/login")} 
            className="absolute top-4 left-4 bg-white/20 px-3 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 active:scale-95 transition backdrop-blur-sm shadow-sm"
          >
            <FaSignInAlt /> Login
          </button>
        )}

        {/* 👇 UPDATED: Modify Button (Top Right - Sirf logged-in user ko dikhega) */}
        {user && (
          <button onClick={() => setIsEditing(true)} className="absolute top-4 right-4 bg-white/20 p-2.5 rounded-full text-xs font-semibold flex items-center gap-1 active:scale-95 transition">
            <FaEdit /> Edit
          </button>
        )}

        <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center border-4 border-white/20 shadow-md overflow-hidden relative">
          {user?.profileImage ? (
            <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl font-black text-indigo-600">
              {user?.name ? user.name.substring(0,2).toUpperCase() : "G"}
            </span>
          )}
        </div>
        
        {/* Guest ko default naam dikhayega */}
        <h1 className="text-xl font-bold mt-3 tracking-wide">{user?.name || "Guest User"}</h1>
        <p className="opacity-75 text-xs font-medium flex items-center justify-center gap-1 mt-0.5">
          <FaBriefcase className="text-[10px]" /> {user?.role || "Traveller"}
        </p>
      </motion.div>

      {/* Editor Modal Overlay */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-5">
          <div className="bg-slate-800 text-slate-100 w-full max-w-sm rounded-[25px] p-5 shadow-2xl border border-slate-700 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
              <h2 className="font-bold text-xs text-slate-400 uppercase">Profile Configuration</h2>
              <button onClick={() => { setIsEditing(false); setShowOtpScreen(false); }} className="text-slate-400"><FaTimes /></button>
            </div>

            {!showOtpScreen ? (
              <div className="space-y-3.5 mt-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase">Avatar Image</label>
                  <input type="file" accept="image/*" onChange={handleImageUploadChange} className="w-full text-xs mt-1 bg-slate-900 p-2 rounded" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase">Name</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-slate-900 border p-2.5 mt-1 rounded-xl text-xs" />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase">Email Address</label>
                  <input 
                    type="email" 
                    value={editEmail} 
                    onChange={(e) => setEditEmail(e.target.value)} 
                    className="w-full bg-slate-900 border border-slate-700 p-2.5 mt-1 rounded-xl text-xs" 
                  />
                </div>

                <div className="flex gap-2">
                    <select value={editCountryCode} onChange={(e) => setEditCountryCode(e.target.value)} className="bg-slate-900 text-xs p-2 rounded-xl border">
                        <option value="+91">+91</option><option value="+1">+1</option>
                    </select>
                    <input type="text" value={editNumber} onChange={handleNumberInputChange} className="flex-1 bg-slate-900 p-2.5 rounded-xl text-xs border" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase">Role / Bio</label>
                  <input type="text" value={editRole} onChange={(e) => setEditRole(e.target.value)} className="w-full bg-slate-900 border p-2.5 mt-1 rounded-xl text-xs" />
                </div>
                <button onClick={handleSaveProfileClick} className="w-full bg-indigo-600 text-white py-3 rounded-xl text-xs font-bold">Verify Changes</button>
              </div>
            ) : (
              <div className="space-y-3 text-center py-2 mt-3">
                <input type="text" placeholder="Enter OTP" value={otpValue} onChange={(e) => setOtpValue(e.target.value)} className="w-full border p-3 text-center text-sm rounded-xl bg-slate-900" />
                <button onClick={handleVerifyOtpSubmit} className="w-full bg-emerald-600 text-white py-3 rounded-xl text-xs font-bold">Confirm Settings</button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mx-auto -mt-5 w-[88%] max-w-sm bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-xl border border-gray-100/50 relative z-10 flex justify-around text-center">
        <div><h3 className="text-lg font-black text-indigo-600 dark:text-indigo-400">{savedTrips.length}</h3><p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Trips Saved</p></div>
        <div className="w-1px bg-gray-100 h-8 my-auto"></div>
        <div><h3 className="text-lg font-black text-indigo-600 dark:text-indigo-400">{likedPlaces.length}</h3><p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Liked Spots</p></div>
      </div>

      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mx-auto mt-6 w-[88%] max-w-sm bg-slate-200 dark:bg-slate-800 p-1 rounded-xl flex gap-1 border border-slate-300/30"
      >
        <button onClick={() => setActiveSegment("saved")} className={`flex-1 py-2 text-xs font-black rounded-lg ${activeSegment === "saved" ? "bg-slate-800 text-white" : "text-slate-500"}`}>🎒 Itineraries ({savedTrips.length})</button>
        <button onClick={() => setActiveSegment("favorites")} className={`flex-1 py-2 text-xs font-black rounded-lg ${activeSegment === "favorites" ? "bg-slate-800 text-white" : "text-slate-500"}`}>❤️ Bucket List ({likedPlaces.length})</button>
      </motion.div>

      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mx-auto mt-4 w-[88%] max-w-sm text-left"
      >
        {activeSegment === "saved" ? (
          <div className="space-y-2.5">
            {displayedSaved.map((trip) => (
              <div key={trip.id} onClick={() => {navigate("/planner", { state: { savedTripData: trip } }); 
                }}              
                className="bg-slate-800 border border-slate-700/60 p-3.5 rounded-2xl flex justify-between items-center shadow-sm cursor-pointer">
                <div className="truncate pr-3">
                  <h4 className="text-xs font-black text-white uppercase truncate">{trip.meta?.route}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{trip.meta?.duration}</p>
                </div>
                <button onClick={(e) => handleDeleteTrip(trip.id, e)} className="p-2 text-slate-400 hover:text-red-500"><FaTrash size={11} /></button>
              </div>
            ))}
            {savedTrips.length > 2 && (
              <button onClick={() => setShowAllSaved(!showAllSaved)} className="w-full py-3 text-[10px] font-black text-indigo-400 bg-slate-800 rounded-xl mt-2">{showAllSaved ? "Show Less" : `View All`}</button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayedLiked.map((fav) => (
              <div key={fav.id} onClick={() => { navigate(`/destination/${fav.id}`, { state: { placeData: fav } });
              }} 
              className="bg-slate-800 border border-slate-700 p-3.5 rounded-2xl flex items-center justify-between cursor-pointer">
                <h4 className="text-xs font-black text-white truncate">{fav.name}</h4>
                <button onClick={(e) => handleUnlikePlace(fav.id, e)} className="text-rose-400 p-2"><FaHeartBroken size={11} /></button>
              </div>
            ))}
            {likedPlaces.length > 2 && (
              <button onClick={() => setShowAllLiked(!showAllLiked)} className="w-full py-3 text-[10px] font-black text-indigo-400 bg-slate-800 rounded-xl mt-2">{showAllLiked ? "Show Less" : `View All (${likedPlaces.length - 3} More)`}</button>
            )}
          </div>
        )}
      </motion.div>     

      {/* 📋 PERSONAL DETAILS CARD BLOCK */}
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mx-auto mt-5 w-[88%] max-w-sm bg-slate-800 rounded-2xl p-4 border border-slate-700 shadow-sm space-y-2 text-left print:hidden"
      >
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">Personal Details</h3>
        <div className="bg-slate-900/60 p-3 rounded-xl space-y-2.5 text-xs text-white/90">
          
          <p className="truncate">
            <span className="font-bold text-indigo-400 mr-1">Email:</span> 
            <span className="text-slate-100 font-medium">
              {user?.email || "Not linked yet"}
            </span>
          </p>
          
          <p>
            <span className="font-bold text-indigo-400 mr-1">Mobile:</span> 
            <span className="text-slate-100 font-bold tracking-wider">
               {user?.number || user?.phoneNumber || "Not verified"}            
            </span>
          </p>
          
          <p className="truncate">
            <span className="font-bold text-indigo-400 mr-1">Bio Tag:</span> 
            <span className="text-slate-100 font-medium">
              {user?.role || "Traveller"}
            </span>
          </p>
          
        </div>
      </motion.div>

      {/* Settings list */}
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mx-auto mt-4 w-[88%] max-w-sm bg-white dark:bg-slate-800 rounded-2xl p-2 shadow-sm border border-gray-100 dark:border-slate-700/50 space-y-1 mb-6"
      >
        <motion.div 
          onClick={() => {
            setDarkMode(!darkMode);
            if (navigator.vibrate) navigator.vibrate(50); 
          }} 
          className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/40 cursor-pointer transition"
        >          
          <div className="flex items-center gap-3">
            <div className="bg-amber-50 dark:bg-amber-950/40 text-amber-600 p-2 rounded-xl text-xs">{darkMode ? <FaSun /> : <FaMoon />}</div>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Dark Mode Architecture</span>
          </div>
          <div className={`w-8 h-4 flex items-center rounded-full p-0.5 transition-all duration-300 ${darkMode ? "bg-indigo-600 justify-end" : "bg-gray-300 justify-start"}`}>
            <div className="bg-white w-3 h-3 rounded-full shadow-md"></div>
          </div>
        </motion.div>

        <motion.div onClick={() => setShowAbout(!showAbout)} className="flex flex-col p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/40 cursor-pointer transition text-left">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 dark:bg-blue-950/40 text-blue-600 p-2 rounded-xl text-xs"><FaInfoCircle /></div>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">About PlotMyPath</span>
            </div>
            <FaChevronRight className={`text-gray-400 text-xs transition-transform duration-300 ${showAbout ? "rotate-90" : ""}`} />
          </div>
          {showAbout && (
          <div className="mt-3 bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 flex flex-col items-center text-center">
  
          {/* Highlighted Title */}
          <h3 className="font-black text-indigo-400 text-lg tracking-wide mb-1.5">
            PlotMyPath
          </h3>

          {/* App Kya Karta Hai */}
          <p className="text-xs text-slate-300 leading-relaxed px-2">
            Your AI-powered travel companion. We generate personalized itineraries, curate famous local spots, and bring destinations to life with cinematic visuals.
          </p>

          {/* Developer Info */}
          <div className="flex items-center justify-center gap-2.5 mt-4 pt-3 border-t border-slate-700/50 w-full">          
            <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-[10px] border border-indigo-500/30">
              AL
            </div>
            <div>
              <p className="text-[9px] text-slate-400 uppercase tracking-wide">Designed & Developed by</p>
              <p className="text-xs font-bold text-white">Ansh Laad</p>
            </div>
          </div>
        </div>
          )}
        </motion.div>

        {/* 👇 UPDATED: Logout Button sirf tabhi dikhega jab user login hoga */}
        {user && (
          <motion.div onClick={handleLogout} className="flex items-center justify-between p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer transition text-red-500">
            <div className="flex items-center gap-3">
              <div className="bg-red-50 dark:bg-red-950/40 text-red-500 p-2 rounded-xl text-xs"><FaSignOutAlt /></div>
              <span className="text-xs font-bold">Logout</span>
            </div>
            <FaChevronRight className="text-red-300 text-xs" />
          </motion.div>
        )}
      </motion.div>
      

      {!isEditing && <BottomNav />}
    </motion.div>
  );
}