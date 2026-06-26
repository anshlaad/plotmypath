import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { FaSearch, FaBell, FaUmbrellaBeach, FaMountain, FaCity, FaRobot, FaTree, FaTimes, FaPaperPlane, FaSyncAlt, FaFire } from "react-icons/fa";
import DestinationCard from "../../components/DestinationCard";
import BottomNav from "../../components/BottomNav";
import { motion, AnimatePresence } from "framer-motion"; 

export default function Home() {
  const { user, notifications, markNotificationsRead } = useAuth(); 
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("All");
  const [showNotifications, setShowNotifications] = useState(false);
  const [greeting, setGreeting] = useState("Good Morning");
  const [searchQuery, setSearchQuery] = useState("");
  const [language, setLanguage] = useState(null);
  const popupRef = useRef(null);
  const [adminNotifs, setAdminNotifs] = useState([]);
  
  const [seenNotifs, setSeenNotifs] = useState(() => {
    const saved = localStorage.getItem("plotmypath_seen_notifs");
    return saved ? JSON.parse(saved) : [];
  });

  const [deletedNotifs, setDeletedNotifs] = useState(() => {
    const saved = localStorage.getItem("plotmypath_deleted_notifs");
    return saved ? JSON.parse(saved) : [];
  });

  // 🌍 AUTO-UPDATING SEASONAL LOGIC
  const seasonalData = useMemo(() => {
    const month = new Date().getMonth() + 1; // 1 to 12
    
    if (month >= 3 && month <= 5) {
      // Summer Escapes (Mar-May)
      return {
        title: "Summer Escapes ☀️",
        subtitle: "Cool places to beat the heat",
        places: [
          { id: 201, name: "Manali", tag: "Snow & Mountains 🏔️", img: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=400&q=80" },
          { id: 202, name: "Ooty", tag: "Nilgiri Hills 🌿", img: "https://images.unsplash.com/photo-1590234731777-62e5b41094df?auto=format&fit=crop&w=400&q=80" },
          { id: 203, name: "Rishikesh", tag: "River Rafting 🚣", img: "https://images.unsplash.com/photo-1605640875323-5ec9db84beaf?auto=format&fit=crop&w=400&q=80" },
          { id: 204, name: "Darjeeling", tag: "Tea Gardens 🍵", img: "https://images.unsplash.com/photo-1544531585-618a803e07db?auto=format&fit=crop&w=400&q=80" },
          { id: 205, name: "Ladakh", tag: "Cold Desert 🗻", img: "https://images.unsplash.com/photo-1581793751792-d6c2957b9e84?auto=format&fit=crop&w=400&q=80" },
          { id: 206, name: "Shillong", tag: "Scotland of East ☁️", img: "https://images.unsplash.com/photo-1571536700600-3eea2459b15c?auto=format&fit=crop&w=400&q=80" },
          { id: 207, name: "Nainital", tag: "Lake City ⛵", img: "https://images.unsplash.com/photo-1599839619722-39751411ea63?auto=format&fit=crop&w=400&q=80" },
          { id: 208, name: "Spiti Valley", tag: "Adventure 🏍️", img: "https://images.unsplash.com/photo-1616086705607-b36c4b2b2b1a?auto=format&fit=crop&w=400&q=80" }
        ]
      };
    } else if (month >= 6 && month <= 9) {
      // Monsoon Magic (Jun-Sept)
      return {
        title: "Monsoon Magic 🌧️",
        subtitle: "Best rainy season getaways",
        places: [
          { id: 101, name: "Munnar", tag: "Lush Greenery 🌿", img: "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=400&q=80" },
          { id: 102, name: "Lonavala", tag: "Waterfalls ⛰️", img: "https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?auto=format&fit=crop&w=400&q=80" },
          { id: 103, name: "Udaipur", tag: "Royal Lakes 🏰", img: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=400&q=80" },
          { id: 104, name: "Coorg", tag: "Coffee Plantations ☕", img: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?auto=format&fit=crop&w=400&q=80" },
          { id: 105, name: "Cherrapunji", tag: "Living Root Bridges 🌳", img: "https://images.unsplash.com/photo-1632738734795-0720516fc41c?auto=format&fit=crop&w=400&q=80" },
          { id: 106, name: "Mahabaleshwar", tag: "Strawberry Hills 🍓", img: "https://images.unsplash.com/photo-1626014441589-9a2bbd3910c2?auto=format&fit=crop&w=400&q=80" },
          { id: 107, name: "Kodaikanal", tag: "Princess of Hills 👑", img: "https://images.unsplash.com/photo-1606821210874-912f2c84279b?auto=format&fit=crop&w=400&q=80" },
          { id: 108, name: "Wayanad", tag: "Spice Trails 🌱", img: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=400&q=80" }
        ]
      };
    } else {
      // Winter Wonderlands (Oct-Feb)
      return {
        title: "Winter Wonderlands ❄️",
        subtitle: "Cozy spots & snowy adventures",
        places: [
          { id: 301, name: "Kashmir", tag: "Heaven on Earth ❄️", img: "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=400&q=80" },
          { id: 302, name: "Goa", tag: "Winter Sun & Beaches 🏖️", img: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=400&q=80" },
          { id: 303, name: "Jaipur", tag: "Pink City Forts 🐪", img: "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=400&q=80" },
          { id: 304, name: "Auli", tag: "Skiing Destination ⛷️", img: "https://images.unsplash.com/photo-1626082896492-766af4eb65ed?auto=format&fit=crop&w=400&q=80" },
          { id: 305, name: "Jaisalmer", tag: "Golden Desert 🏜️", img: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=400&q=80" },
          { id: 306, name: "Andaman", tag: "Crystal Waters 🏝️", img: "https://images.unsplash.com/photo-1589136777351-fdc9c9cb15f9?auto=format&fit=crop&w=400&q=80" },
          { id: 307, name: "Shimla", tag: "Snow Toy Train 🚂", img: "https://images.unsplash.com/photo-1601614981881-2292f3922d21?auto=format&fit=crop&w=400&q=80" },
          { id: 308, name: "Rann of Kutch", tag: "White Desert 🧂", img: "https://images.unsplash.com/photo-1615414526938-f99a538d6fcb?auto=format&fit=crop&w=400&q=80" }
        ]
      };
    }
  }, []);

  useEffect(() => {
    const hours = new Date().getHours();
    if (hours < 12) setGreeting("Good Morning");
    else if (hours < 16) setGreeting("Good Afternoon");
    else if (hours < 21) setGreeting("Good Evening");
    else setGreeting("Good Night");
  }, []);

  const [localPlaces, setLocalPlaces] = useState([]);
  useEffect(() => {
    const saved = localStorage.getItem("plotmypath_places");
    if (saved) {
      setLocalPlaces(JSON.parse(saved));
    } else {
      const defaultPlaces = [
        { id: 1, name: "Bali", country: "Indonesia", rating: "4.9", category: "Beach", image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400" },
        { id: 2, name: "Paris", country: "France", rating: "4.8", category: "City", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400" },
        { id: 3, name: "Goa", country: "India", rating: "4.7", category: "Beach", image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400" },
        { id: 4, name: "Manali", country: "India", rating: "4.6", category: "Mountain", image: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=400" }
      ];
      localStorage.setItem("plotmypath_places", JSON.stringify(defaultPlaces));
      setLocalPlaces(defaultPlaces);
    }
  }, []);

  useEffect(() => {
  const isDark = localStorage.getItem("isDarkMode") === "true";
  if (isDark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}, []);

  useEffect(() => {
    const q = query(collection(db, "system_notifications"), where("active", "==", true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotifs = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        let timeDisplay = "Just now";
        if (data.createdAt) {
          const dateObj = typeof data.createdAt === 'string' ? new Date(data.createdAt) : data.createdAt.toDate();
          timeDisplay = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        fetchedNotifs.push({
          id: doc.id,
          title: "System Update 🔔", 
          message: data.message,
          time: timeDisplay, 
          type: data.type,
          rawTime: data.createdAt 
        });
      });
      fetchedNotifs.sort((a, b) => new Date(b.rawTime || 0) - new Date(a.rawTime || 0));
      setAdminNotifs(fetchedNotifs);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications]);

  const visibleNotifs = adminNotifs.filter(n => !deletedNotifs.includes(n.id));
  const visibleLocalNotifs = notifications ? notifications.filter(n => !deletedNotifs.includes(n.id)) : [];
  const adminUnreadCount = visibleNotifs ? visibleNotifs.filter(n => !seenNotifs.includes(n.id)).length : 0;
  const localUnreadCount = visibleLocalNotifs ? visibleLocalNotifs.filter(n => !n.read).length : 0;
  const totalUnreadCount = adminUnreadCount + localUnreadCount;

  const handleBellClick = (e) => {
    if (navigator.vibrate) navigator.vibrate(40);
    if (!showNotifications) {
      if (adminUnreadCount > 0) {
        const currentIds = visibleNotifs.map(n => n.id);
        const newSeen = [...new Set([...seenNotifs, ...currentIds])];
        setSeenNotifs(newSeen);
        localStorage.setItem("plotmypath_seen_notifs", JSON.stringify(newSeen));
      }
      if (localUnreadCount > 0) markNotificationsRead();
    }
    setShowNotifications(!showNotifications);
  };

  const handleDeleteNotif = (e, id) => {
    e.stopPropagation(); 
    const newDeleted = [...deletedNotifs, id];
    setDeletedNotifs(newDeleted);
    localStorage.setItem("plotmypath_deleted_notifs", JSON.stringify(newDeleted));
  };

  // 🚀 LIVE SEARCH FILTERING (Explore jaisa)
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return localPlaces.filter(place => 
      place.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      place.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, localPlaces]);

  const filteredPlaces = localPlaces.filter((item) => {
    if (activeCategory === "All") return true;
    return item.category?.toLowerCase() === activeCategory.toLowerCase();
  });

  const hasAnyNotifications = (visibleNotifs && visibleNotifs.length > 0) || (visibleLocalNotifs && visibleLocalNotifs.length > 0);
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setMessages] = useState([{ sender: "ai", text: "Welcome to PlotMyPath! Kis bhasha mein baat karna pasand karenge? / Choose your preferred language:", isLanguagePrompt: true }]);
  const [chatInput, setChatInput] = useState("");
  const [isAiThinking, setIsAiThinking] = useState(false);
  const chatRef = useRef(null);
  const messageEndRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (isChatOpen && chatRef.current && !chatRef.current.contains(event.target)) setIsChatOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isChatOpen]);

  useEffect(() => { messageEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  const handleResetChat = () => {
    setLanguage(null); 
    setChatInput("");  
    setMessages([{ sender: "ai", text: "Welcome to PlotMyPath! Kis bhasha mein baat karna pasand karenge? / Choose your preferred language:", isLanguagePrompt: true }]);
  };

  const handleLanguageSelect = (langCode, langName) => {
    setLanguage(langCode);
    let welcomeMsg = "", quickQuestions = [];
    if (langCode === "hi") {
      welcomeMsg = "नमस्ते! मैं PlotMyPath का AI असिस्टेंट हूँ। ऐप इस्तेमाल करने में मैं आपकी कैसे मदद करूँ?";
      quickQuestions = ["AI ट्रिप प्लान कैसे बनाएं?", "खर्च को दोस्तों में कैसे बांटें?", "इटिनरेरी PDF कैसे डाउनलोड करें?"];
    } else if (langCode === "en") {
      welcomeMsg = "Hello! I am PlotMyPath's AI assistant. How can I help you navigate the app today?";
      quickQuestions = ["How to create an AI Trip?", "How to split expenses?", "How to download itinerary PDF?"];
    } else {
      welcomeMsg = "Hello! Main PlotMyPath ka AI assistant hu. App use karne me main aapki kaise madad karu?";
      quickQuestions = ["AI Trip plan kaise banaye?", "Dosto me expense split kaise kare?", "Itinerary PDF download kaise kare?"];
    }
    setMessages((prev) => [...prev, { sender: "user", text: langName }, { sender: "ai", text: welcomeMsg, quickQuestions: quickQuestions }]);
  };

  const sendMessageToAi = async (quickText = null) => {
    const userMessage = typeof quickText === "string" ? quickText : chatInput.trim();
    if (!userMessage || isAiThinking) return;
    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setChatInput("");
    setIsAiThinking(true);

    const selectedLang = language === 'hi' ? 'Hindi' : language === 'en' ? 'English' : 'Hinglish';
    const systemInstruction = `You are the official customer support AI for an app named 'PlotMyPath'. CRITICAL LANGUAGE RULE: You MUST reply EXCLUSIVELY in ${selectedLang}. PLOTMYPATH APP FEATURES: 1. Create AI Itinerary: Go to 'Planner' page. 2. Split Expenses: Go to 'Split Expense' page. 3. Download PDF: Click the 'Download PDF' icon. RULE 1: Be polite and give short answers. RULE 2 (CRITICAL): At the end of EVERY response, generate 3 follow-up questions formatted EXACTLY like: ###Q: Question 1 | Question 2 | Question 3`;

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const finalPrompt = `${systemInstruction}\n\nUser Question: ${userMessage}`;
      const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: finalPrompt }] }] }) });
      const result = await response.json();
      if (result.error) throw new Error(result.error.message);
      
      let aiRawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!aiRawText) throw new Error("No response");

      let aiResponseText = aiRawText, generatedQuestions = [];
      const markerRegex = /###\s*Q\s*:/i;
      const markerIndex = aiRawText.search(markerRegex);

      if (markerIndex !== -1) {
        aiResponseText = aiRawText.substring(0, markerIndex).trim();
        const matchStr = aiRawText.match(markerRegex)[0];
        const questionsString = aiRawText.substring(markerIndex + matchStr.length);
        generatedQuestions = questionsString.split("|").map(q => q.replace(/[*\[\]]/g, '').trim()).filter(q => q.length > 0);
      }
      if (generatedQuestions.length === 0) generatedQuestions = ["Tell me more", "How to use Planner?", "Split expenses?"];

      setMessages((prev) => [...prev, { sender: "ai", text: aiResponseText, quickQuestions: generatedQuestions }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages((prev) => [...prev, { sender: "ai", text: `Connection error. Please try again.` }]);
    } finally {
      setIsAiThinking(false);
    }
  };

  // 🚀 REAL SEARCH HANDLER
  const handleSearchSubmit = (e) => {
    e.preventDefault(); // Page reload hone se rokega
    if (searchQuery.trim()) {
      // User ko explore page par bhej dega query ke sath
      navigate(`/explore?query=${encodeURIComponent(searchQuery.trim())}`); 
    }
  };

  const handleKeyPress = (e) => { if (e.key === "Enter" && language) sendMessageToAi(); };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 relative overflow-x-hidden">
      
      {/* Header & Hero Section */}
      <div className="bg-linear-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-b-[40px] p-6 pt-10 pb-10 text-white shadow-xl relative z-30">
        <div className="flex justify-between items-start text-left relative">
          <div>
            <h2 className="text-sm opacity-90 font-medium tracking-wide">{greeting}</h2>
            <h1 className="text-3xl font-black mt-1 tracking-tight">{user?.name || "Explorer"} 👋</h1>
            <p className="mt-2 text-sm text-blue-100 font-medium">Where do you want to go today?</p>
          </div>
          
          <div className="relative" ref={popupRef}>
            <button onClick={handleBellClick} className="bg-white/20 p-3 rounded-full relative active:scale-90 transition shadow-lg backdrop-blur-sm cursor-pointer">
              <FaBell size={18}/>
              {totalUnreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-black flex items-center justify-center text-white border-2 border-indigo-600">{totalUnreadCount}</span>}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-72 bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl p-3 border border-gray-100 z-50 text-left animate-fadeIn origin-top-right">
                <div className="text-xs font-black text-indigo-600 uppercase tracking-wider mb-2 border-b border-gray-200/50 pb-2 flex justify-between items-center px-1">
                  <span>Notifications</span>
                  <span onClick={() => setShowNotifications(false)} className="cursor-pointer text-gray-400 hover:text-gray-700 font-bold">Close</span>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-none px-1">
                  {!hasAnyNotifications ? (
                    <p className="text-center text-xs font-medium text-gray-400 py-6">No active notifications</p>
                  ) : (
                    <>
                      {visibleNotifs.map(n => (
                        <div key={n.id} className={`p-3 rounded-xl text-xs leading-snug border shadow-sm transition-all ${n.type === 'alert' ? 'bg-red-50 border-red-100 text-red-800' : 'bg-indigo-50 border-indigo-100 text-indigo-800'}`}>
                          <div className="flex justify-between items-start mb-1">
                            <p className="font-black text-[11px]">{n.title}</p>
                            <button onClick={(e) => handleDeleteNotif(e, n.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1"><FaTimes size={12} /></button>
                          </div>
                          <p className="font-medium text-gray-700">{n.message}</p>
                          <span className="text-[9px] font-bold text-gray-400 block mt-2 uppercase tracking-widest">{n.time}</span>
                        </div>
                      ))}
                      {visibleLocalNotifs.map(n => (
                        <div key={n.id} className="p-3 bg-gray-50 rounded-xl text-xs text-gray-700 leading-snug border border-gray-100 shadow-sm transition-all">
                          <div className="flex justify-between items-start mb-1">
                            <p className="font-black text-[11px]">{n.title || "App Notification"}</p>
                            <button onClick={(e) => handleDeleteNotif(e, n.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1"><FaTimes size={12} /></button>
                          </div>
                          <p className="font-medium mt-0.5">{n.message}</p>
                          <span className="text-[9px] font-bold text-gray-400 block mt-2 uppercase tracking-widest">{n.time || "Recently"}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 🚀 Seamless Search Bar (Redirect Hata Diya, Prevent Default Laga Diya) */}
        {/* 🚀 REAL WORKING SEARCH BAR */}
        <form onSubmit={handleSearchSubmit} className="mt-6 relative flex items-center">
          <FaSearch className="absolute left-4 text-indigo-400 text-sm" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            // 🟢 onFocus hata diya taaki user aaram se type kar sake!
            className="w-full bg-white rounded-2xl py-3.5 pl-11 pr-16 text-sm text-gray-800 outline-none shadow-lg shadow-black/10 transition-all font-medium placeholder-gray-400 focus:ring-2 focus:ring-blue-300" 
            placeholder="Search city, country or place..." 
          />
          <button type="submit" className="absolute right-2 bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold active:scale-95 transition-transform">
            Go
          </button>
        </form>
      </div>

      {/* 🟢 CONDITIONAL RENDERING: Search Results VS Normal View */}
      {searchQuery.trim().length > 0 ? (
        
        /* 🚀 EXPLORE GRID VIEW (Instantly dikhega jab search karoge) */
        <div className="px-5 mt-8 text-left min-h-[50vh] animate-fadeIn">
          <h2 className="text-lg font-black text-gray-800 mb-4 pl-1">Results for "{searchQuery}"</h2>
          
          {searchResults.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 pb-10">
              {searchResults.map((item) => (
                <div key={item.id} onClick={() => navigate(`/destination/${item.name}`)} className="transition-transform duration-150 active:scale-95 cursor-pointer">
                  <DestinationCard image={item.image} title={item.name} location={`${item.country}`} rating={item.rating} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <FaSearch className="text-3xl text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 text-sm font-medium">No places found for "{searchQuery}".</p>
              <button onClick={() => setSearchQuery("")} className="mt-4 text-indigo-600 text-xs font-bold bg-indigo-50 px-4 py-2 rounded-lg">Clear Search</button>
            </div>
          )}
        </div>

      ) : (

        /* 🌍 NORMAL HOME CONTENT (Bina search kiye ye dikhega) */
        <AnimatePresence>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            
            {/* APP INTRO VIDEO SECTION */}
            <div className="px-5 mt-6 mb-2">
              <div className="rounded-2xl overflow-hidden shadow-lg relative border border-gray-100 bg-black group cursor-pointer">
                {/* 🟢 YAHAN APNI VIDEO KA LINK DAAL DENA */}
                <video 
                  className="w-full h-44 object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                  autoPlay loop muted playsInline
                  src="https://www.w3schools.com/html/mov_bbb.mp4" 
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 pointer-events-none">
                  <h3 className="text-white font-black text-base drop-shadow-md">PlotMyPath in Action 🚀</h3>
                  <p className="text-gray-200 text-xs font-medium drop-shadow-md">See how we plan your perfect trip.</p>
                </div>
              </div>
            </div>

            {/* AUTO-UPDATING TRENDING SECTION (Season-based) */}
            <div className="px-5 mt-6 text-left">
              <h2 className="text-lg font-black text-gray-800 mb-1 pl-1 flex items-center gap-1.5">
                <FaFire className="text-orange-500" /> {seasonalData.title}
              </h2>
              <p className="text-[11px] text-gray-400 font-bold pl-1 mb-3 uppercase tracking-wider">{seasonalData.subtitle}</p>
              
              <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x">
                {seasonalData.places.map((place) => (
                  <div key={place.id} onClick={() => navigate(`/explore?query=${encodeURIComponent(place.name)}`)} className="snap-center shrink-0 w-40 h-52 relative rounded-2xl overflow-hidden shadow-md cursor-pointer active:scale-95 transition-all hover:shadow-xl group">
                    <img src={place.img} alt={place.name} className="w-full h-full object-cover absolute inset-0 transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/30 to-transparent"></div>
                    
                    <div className="absolute bottom-3 left-3 right-3 text-left">
                      <span className="text-[8px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-wider mb-1 inline-block">{place.tag}</span>
                      <h3 className="text-white font-black text-base tracking-wide mt-0.5">{place.name}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="px-5 mt-2">
              <h2 className="font-bold text-sm text-gray-800 mb-3 pl-1 text-left uppercase tracking-wider">Explore by Category</h2>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none px-1">
                {[
                  { id: "All", label: "All Paths", icon: null },
                  { id: "Beach", label: "Beach", icon: <FaUmbrellaBeach /> },
                  { id: "Mountain", label: "Mountain", icon: <FaMountain /> },
                  { id: "Forest", label: "Forest", icon: <FaTree /> },
                  { id: "City", label: "City", icon: <FaCity /> }
                ].map((cat) => (
                  <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 shrink-0 border transition-all text-xs font-bold cursor-pointer ${activeCategory === cat.id ? "bg-indigo-600 text-white border-indigo-600 scale-105 shadow-md shadow-indigo-200" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
                    {cat.icon && <span className={activeCategory === cat.id ? "text-white" : "text-indigo-500"}>{cat.icon}</span>}
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Banner */}
            <div className="px-5 mt-6 mb-4">
              <div className="bg-linear-to-r from-slate-900 to-indigo-900 rounded-3xl p-5 text-white shadow-xl text-left relative overflow-hidden border border-slate-800">
                <div className="absolute top-0 left-0 w-full h-1/2 bg-linear-to-b from-white/10 to-transparent"></div>
                <h2 className="text-lg font-black flex items-center gap-2 relative z-10"><span className="bg-white/20 p-2 rounded-xl text-blue-300"><FaRobot /></span> AI Trip Architect</h2>
                <p className="mt-2 text-xs text-slate-300 font-medium leading-relaxed relative z-10 max-w-[85%]">Skip the research. Let AI generate your perfect itinerary in seconds.</p>
                <button onClick={() => navigate("/planner")} className="relative z-10 bg-white text-indigo-900 text-xs px-5 py-2.5 rounded-xl mt-4 font-black active:scale-95 transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)] cursor-pointer">Build My Trip ✨</button>
              </div>
            </div>

            {/* Filtered Destinations */}
            <div className="px-5 mt-6 text-left">
              <h2 className="text-sm font-bold text-gray-800 mb-3 pl-1 uppercase tracking-wider">Recommended For You</h2>
              <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-none">
                {filteredPlaces.map((item) => (
                  <div key={item.id} onClick={() => navigate(`/destination/${item.id}`)} className="shrink-0 transition-transform duration-150 active:scale-95 cursor-pointer">
                    <DestinationCard image={item.image} title={item.name} location={`${item.country}`} rating={item.rating} />
                  </div>
                ))}
              </div>
            </div>

          </motion.div>
        </AnimatePresence>
      )}

      {/* AI Chat Bot UI (Untouched) */}
      <div className="fixed bottom-0 left-0 w-full h-full flex justify-center z-50 pointer-events-none">
        <div className="w-full max-w-md relative">
          <div className="absolute bottom-24 right-5 pointer-events-auto font-sans text-left">
            <AnimatePresence>
              {isChatOpen && (
                <motion.div ref={chatRef} initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.9 }} transition={{ duration: 0.3, ease: "easeOut" }} className="w-[320px] h-450px max-h-[75vh] bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden mb-4">
                  <div className="bg-linear-to-r from-indigo-600 to-purple-600 p-3 flex justify-between items-center text-white shrink-0 z-10 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="bg-white/10 p-1.5 rounded-xl animate-pulse"><FaRobot className="text-base text-white" /></div>
                      <div>
                        <h4 className="text-xs font-black tracking-wide">PlotMyPath AI</h4>
                        <p className="text-[9px] text-emerald-300 font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span> Online Assistant</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={handleResetChat} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"><FaSyncAlt className="text-xs" /></button>
                      <button onClick={() => setIsChatOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"><FaTimes className="text-sm" /></button>
                    </div>
                  </div>
                  <div className="flex-1 p-3 bg-slate-50 overflow-y-auto space-y-4 text-xs">
                    {chatMessages.map((msg, index) => (
                      <div key={index} className="flex flex-col">
                        <div className={`flex items-start gap-2 ${msg.sender === "user" ? "justify-end" : "max-w-[85%]"}`}>
                          {msg.sender === "ai" && <div className="bg-indigo-100 text-indigo-600 p-1.5 rounded-lg shrink-0 mt-0.5"><FaRobot className="text-[10px]" /></div>}
                          <div className={`p-2.5 rounded-2xl shadow-xs font-medium leading-relaxed ${msg.sender === "user" ? "bg-indigo-600 text-white rounded-tr-none max-w-[85%]" : "bg-white text-slate-700 border border-slate-100 rounded-tl-none"}`}>{msg.text}</div>
                        </div>
                        {msg.isLanguagePrompt && !language && (
                          <div className="flex flex-wrap gap-2 ml-8 mt-2">
                            <button onClick={() => handleLanguageSelect("hi", "हिंदी 🇮🇳")} className="bg-white hover:bg-indigo-50 border px-3 py-1.5 rounded-full text-[10px] font-bold shadow-sm transition-all">हिंदी 🇮🇳</button>
                            <button onClick={() => handleLanguageSelect("hinglish", "Hinglish 💬")} className="bg-white hover:bg-indigo-50 border px-3 py-1.5 rounded-full text-[10px] font-bold shadow-sm transition-all">Hinglish 💬</button>
                            <button onClick={() => handleLanguageSelect("en", "English 🇬🇧")} className="bg-white hover:bg-indigo-50 border px-3 py-1.5 rounded-full text-[10px] font-bold shadow-sm transition-all">English 🇬🇧</button>
                          </div>
                        )}
                        {msg.quickQuestions && index === chatMessages.length - 1 && (
                          <div className="flex gap-2 overflow-x-auto scrollbar-none ml-8 mt-2 py-1">
                            {msg.quickQuestions.map((q, qIdx) => (
                              <button key={qIdx} onClick={() => sendMessageToAi(q)} className="shrink-0 bg-indigo-50 text-indigo-700 border px-3 py-1.5 rounded-full text-[10px] font-extrabold transition-all shadow-sm">{q}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {isAiThinking && (
                      <div className="flex items-start gap-2 max-w-[85%]">
                        <div className="bg-indigo-100 text-indigo-600 p-1.5 rounded-lg shrink-0 mt-0.5"><FaRobot className="text-[10px] animate-bounce" /></div>
                        <div className="bg-white p-2.5 rounded-2xl rounded-tl-none border shadow-xs text-slate-400 font-medium italic flex items-center gap-2"><div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div> AI is thinking...</div>
                      </div>
                    )}
                    <div ref={messageEndRef}></div>
                  </div>
                  <div className="p-2.5 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0">
                    <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyPress={handleKeyPress} placeholder={language ? "Ask AI anything..." : "Please select language first 👆"} disabled={!language || isAiThinking} className="flex-1 bg-slate-50 border rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-indigo-500 placeholder:text-slate-300 disabled:opacity-50" />
                    <button onClick={() => sendMessageToAi()} disabled={!language || isAiThinking} className={`bg-indigo-600 text-white p-2.5 rounded-xl transition-all shadow-md active:scale-95 ${(!language || isAiThinking) ? "opacity-50" : ""}`}><FaPaperPlane className="text-xs" /></button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {!isChatOpen && (
              <motion.button onClick={() => setIsChatOpen(true)} whileTap={{ scale: 0.9 }} className="w-12 h-12 bg-linear-to-tr from-indigo-600 to-purple-600 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.5)] flex items-center justify-center animate-bounce border-2 border-white/20 backdrop-blur-xs cursor-pointer ml-auto">
                <FaRobot className="text-white text-xl animate-pulse" />
                <span className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full animate-pulse"></span>
              </motion.button>
            )}
          </div>
        </div>
      </div>
      <BottomNav /> 
    </div>
  );
}