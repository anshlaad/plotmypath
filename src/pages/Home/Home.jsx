import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { FaSearch, FaBell, FaUmbrellaBeach, FaMountain, FaCity, FaRobot, FaTree, FaTimes,FaPaperPlane, FaSyncAlt } from "react-icons/fa";
import DestinationCard from "../../components/DestinationCard";
import BottomNav from "../../components/BottomNav";
import { motion, AnimatePresence } from "framer-motion"; // 🔥 Smooth opening ke liye



export default function Home() {
  const { user, notifications, markNotificationsRead } = useAuth(); 
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("All");
  const [showNotifications, setShowNotifications] = useState(false);
  const [greeting, setGreeting] = useState("Good Morning");

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
        { id: 3, name: "Goa", country: "India", rating: "4.7", category: "Beach", image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400" }
      ];
      localStorage.setItem("plotmypath_places", JSON.stringify(defaultPlaces));
      setLocalPlaces(defaultPlaces);
    }
  }, []);

  useEffect(() => {
    const q = query(collection(db, "system_notifications"), where("active", "==", true));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotifs = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        let timeDisplay = "Just now";
        
        // Database se time nikal kar format kar rahe hain
        if (data.createdAt) {
          const dateObj = typeof data.createdAt === 'string' ? new Date(data.createdAt) : data.createdAt.toDate();
          timeDisplay = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        fetchedNotifs.push({
          id: doc.id,
          title: "System Update 🔔", 
          message: data.message,
          time: timeDisplay, // ✅ Ab yahan actual time aayega
          type: data.type,
          rawTime: data.createdAt // Sorting ke liye
        });
      });

      // Naye messages sabse upar dikhane ke liye sort kar diya
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
    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications]);

  // ✅ 1. Dono Admin aur Local notifs ke liye visible list banayi
  const visibleNotifs = adminNotifs.filter(n => !deletedNotifs.includes(n.id));
  const visibleLocalNotifs = notifications ? notifications.filter(n => !deletedNotifs.includes(n.id)) : [];
  
  const adminUnreadCount = visibleNotifs ? visibleNotifs.filter(n => !seenNotifs.includes(n.id)).length : 0;
  const localUnreadCount = visibleLocalNotifs ? visibleLocalNotifs.filter(n => !n.read).length : 0;
  const totalUnreadCount = adminUnreadCount + localUnreadCount;

  const handleBellClick = () => {
    if (!showNotifications) {
      if (adminUnreadCount > 0) {
        const currentIds = visibleNotifs.map(n => n.id);
        const newSeen = [...new Set([...seenNotifs, ...currentIds])];
        setSeenNotifs(newSeen);
        localStorage.setItem("plotmypath_seen_notifs", JSON.stringify(newSeen));
      }
      if (localUnreadCount > 0) {
        markNotificationsRead();
      }
    }
    setShowNotifications(!showNotifications);
  };

  const handleDeleteNotif = (e, id) => {
    e.stopPropagation(); 
    const newDeleted = [...deletedNotifs, id];
    setDeletedNotifs(newDeleted);
    localStorage.setItem("plotmypath_deleted_notifs", JSON.stringify(newDeleted));
  };

  const filteredPlaces = localPlaces.filter((item) => {
    if (activeCategory === "All") return true;
    return item.category?.toLowerCase() === activeCategory.toLowerCase();
  });

  const hasAnyNotifications = (visibleNotifs && visibleNotifs.length > 0) || (visibleLocalNotifs && visibleLocalNotifs.length > 0);
  // 1. CHAT VISIBILITY STATE (Pehle wala)
  const [isChatOpen, setIsChatOpen] = useState(false);

  // 🔥 2. REAL CHAT FUNCTIONALITY STATES
  const [chatMessages, setMessages] = useState([
    {
      sender: "ai",
      text: "Welcome to PlotMyPath! Kis bhasha mein baat karna pasand karenge? / Choose your preferred language:",
      isLanguagePrompt: true // Ye flag language buttons dikhayega
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isAiThinking, setIsAiThinking] = useState(false);

  const chatRef = useRef(null);
  const messageEndRef = useRef(null);

  // 🔥 2. OUTSIDE CLICK EFFECT
  useEffect(() => {
    function handleClickOutside(event) {
      if (isChatOpen && chatRef.current && !chatRef.current.contains(event.target)) {
        setIsChatOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isChatOpen]);

  // 🔥 3. AUTO-SCROLL EFFECT
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // 🔥 CHAT RESET FUNCTION
  const handleResetChat = () => {
    setLanguage(null); // Language clear kardi
    setChatInput("");  // Input clear kar diya
    setMessages([      // Messages wapas default pe set kar diye
      {
        sender: "ai",
        text: "Welcome to PlotMyPath! Kis bhasha mein baat karna pasand karenge? / Choose your preferred language:",
        isLanguagePrompt: true 
      },
    ]);
  };

  // 🔥 4. LANGUAGE SELECTION HANDLER (Ye language ke hisaab se questions layega)
  // 🔥 4. UPDATED LANGUAGE SELECTION (Strictly App Related Questions)
  const handleLanguageSelect = (langCode, langName) => {
    setLanguage(langCode);

    let welcomeMsg = "";
    let quickQuestions = [];

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

    setMessages((prev) => [
      ...prev,
      { sender: "user", text: langName },
      { sender: "ai", text: welcomeMsg, quickQuestions: quickQuestions }
    ]);
  };

  // 🔥 5. REAL GEMINI AI INTEGRATION (With Strict App Knowledge & Language Lock)
  // 🔥 5. REAL GEMINI AI WITH "BULLETPROOF PARSING MAGIC"
  const sendMessageToAi = async (quickText = null) => {
    const userMessage = typeof quickText === "string" ? quickText : chatInput.trim();
    if (!userMessage || isAiThinking) return;

    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setChatInput("");
    setIsAiThinking(true);

    const selectedLang = language === 'hi' ? 'Hindi' : language === 'en' ? 'English' : 'Hinglish';
    
    const systemInstruction = `
      You are the official customer support AI for an app named 'PlotMyPath'.
      CRITICAL LANGUAGE RULE: You MUST reply EXCLUSIVELY in ${selectedLang}.
      
      PLOTMYPATH APP FEATURES:
      1. Create AI Itinerary: Go to 'Planner' page, enter Source, Destination, Budget -> Generate.
      2. Split Expenses: Go to 'Split Expense' page, enter total amount, add friends' names.
      3. Download PDF: Click the 'Download PDF' icon on the top right of the generated itinerary.
      4. Save Trip: Click the 'Bookmark' icon on the generated itinerary.
      
      RULE 1: Be polite and give short answers.
      RULE 2 (CRITICAL): At the very end of EVERY response, generate exactly 3 short follow-up questions the user can ask you next based on the conversation.
      Format them EXACTLY like this at the bottom:
      ###Q: Question 1 | Question 2 | Question 3
    `;

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const finalPrompt = `${systemInstruction}\n\nUser Question: ${userMessage}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: finalPrompt }] }] }),
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error.message);
      
      let aiRawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!aiRawText) throw new Error("No response");

      // 🔮 BULLETPROOF PARSING MAGIC (Ye AI ke kachre ko saaf karega)
      let aiResponseText = aiRawText;
      let generatedQuestions = [];

      // Regex jo "###Q:", "### Q:", ya "###Q :" sabko pakad lega
      const markerRegex = /###\s*Q\s*:/i;
      const markerIndex = aiRawText.search(markerRegex);

      if (markerIndex !== -1) {
        // 1. Asli message ko code se pehle cut kar lo (Taaki chat me code na dikhe)
        aiResponseText = aiRawText.substring(0, markerIndex).trim();

        // 2. Questions wale hisse ko alag nikal lo
        const matchStr = aiRawText.match(markerRegex)[0];
        const questionsString = aiRawText.substring(markerIndex + matchStr.length);

        // 3. Pipe '|' se tod kar array bana lo aur extra star/brackets hata do
        generatedQuestions = questionsString
          .split("|")
          .map(q => q.replace(/[*\[\]]/g, '').trim()) 
          .filter(q => q.length > 0);
      }

      if (generatedQuestions.length === 0) {
        generatedQuestions = ["Tell me more", "How to use Planner?", "Split expenses?"];
      }

      setMessages((prev) => [
        ...prev, 
        { 
          sender: "ai", 
          text: aiResponseText, 
          quickQuestions: generatedQuestions 
        }
      ]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages((prev) => [...prev, { sender: "ai", text: `Connection error. Please try again.` }]);
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && language) sendMessageToAi();
  };


  return (
    <div className="min-h-screen bg-gray-100 pb-24 relative">
      
      {/* Header Section */}
      <div className="bg-linear-to-r from-blue-600 to-purple-600 rounded-b-[35px] p-6 pt-8 pb-8 text-white shadow-md relative z-30">
        <div className="flex justify-between items-start text-left relative">
          <div>
            <h2 className="text-xs opacity-80 font-medium">{greeting} 👋</h2>
            <h1 className="text-2xl font-black mt-0.5">{user?.name || "Ansh Laad"}</h1>
          </div>
          
          <div className="relative" ref={popupRef}>
            <button 
  onClick={(e) => {
    if (navigator.vibrate) navigator.vibrate(40); // 👈 Sirf ye haptic feedback add kiya hai
    handleBellClick(e);
  }}
              className="bg-white/10 p-2.5 rounded-full relative active:scale-90 transition cursor-pointer"
            >
              <FaBell size={16}/>
              {totalUnreadCount > 0 && (
                <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] font-black flex items-center justify-center text-white">
                  {totalUnreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-64 bg-white/90 backdrop-blur-xl shadow-xl rounded-2xl p-3 border border-white/40 z-50 text-left animate-fadeIn">
                <div className="text-[10px] font-black text-indigo-600 uppercase tracking-wider mb-2 border-b border-gray-200/30 pb-1 flex justify-between items-center">
                  <span>Notifications</span>
                  <span onClick={() => setShowNotifications(false)} className="cursor-pointer text-gray-400 hover:text-gray-600 font-bold">Close</span>
                </div>
                
                <div className="space-y-2 max-h-56 overflow-y-auto scrollbar-none">
                  {!hasAnyNotifications ? (
                    <p className="text-center text-[10px] font-medium text-gray-400 p-4">No active notifications</p>
                  ) : (
                    <>
                      {visibleNotifs.map(n => (
                        <div 
                          key={n.id} 
                          className={`p-2.5 rounded-xl text-[10px] leading-snug border shadow-sm ${
                            n.type === 'alert' ? 'bg-red-50 border-red-100 text-red-800' : 'bg-indigo-50 border-indigo-100 text-indigo-800'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-0.5">
                            <p className="font-black">{n.title}</p>
                            <button 
                              onClick={(e) => handleDeleteNotif(e, n.id)} 
                              className="text-gray-400 hover:text-red-500 transition-colors p-1"
                              title="Delete notification"
                            >
                              <FaTimes size={10} />
                            </button>
                          </div>
                          <p className="font-medium text-gray-700">{n.message}</p>
                          <span className="text-[8px] font-bold text-gray-400 block mt-1.5 uppercase tracking-widest">{n.time}</span>
                        </div>
                      ))}

                      {visibleLocalNotifs.map(n => (
                        <div key={n.id} className="p-2.5 bg-gray-50 rounded-xl text-[10px] text-gray-700 leading-snug border border-gray-100 shadow-sm">
                          <div className="flex justify-between items-start mb-0.5">
                            <p className="font-black">{n.title || "App Notification"}</p>
                            <button 
                              onClick={(e) => handleDeleteNotif(e, n.id)} 
                              className="text-gray-400 hover:text-red-500 transition-colors p-1"
                              title="Delete notification"
                            >
                              <FaTimes size={10} />
                            </button>
                          </div>
                          <p className="font-medium mt-0.5">{n.message}</p>
                          <span className="text-[8px] font-bold text-gray-400 block mt-1.5 uppercase tracking-widest">{n.time || "Recently"}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div 
          onClick={() => navigate("/explore")} 
          className="mt-5 bg-white rounded-xl flex items-center px-4 py-2.5 shadow-sm cursor-pointer active:scale-95 transition-all"
        >
          <FaSearch className="text-gray-400 text-xs"/>
          <input readOnly className="ml-2 flex-1 bg-transparent text-xs text-gray-400 outline-none cursor-pointer" placeholder="Search destination..." />
        </div>
      </div>

      {/* Categories */}
      <div className="p-5">
        <h2 className="font-bold text-sm text-gray-800 mb-2.5 pl-1 text-left">Categories</h2>
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: "All", label: "All Paths", icon: null },
            { id: "Beach", label: "Beach", icon: <FaUmbrellaBeach /> },
            { id: "Mountain", label: "Mountain", icon: <FaMountain /> },
            { id: "Forest", label: "Forest", icon: <FaTree /> },
            { id: "City", label: "City", icon: <FaCity /> }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-2 rounded-xl shadow-sm flex items-center gap-1.5 shrink-0 border transition text-xs font-bold cursor-pointer ${
                activeCategory === cat.id ? "bg-indigo-600 text-white border-indigo-600 scale-105" : "bg-white text-gray-600"
              }`}
            >
              {cat.icon} <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* AI Banner */}
      <div className="px-5">
        <div className="bg-linear-to-r from-indigo-600 to-purple-600 rounded-2xl p-4.5 text-white shadow-md text-left">
          <h2 className="text-base font-bold flex items-center gap-1.5"><FaRobot /> AI Trip Architect</h2>
          <p className="mt-1 text-[11px] opacity-85">Plan your custom smart vacation itinerary instantly.</p>
          <button onClick={() => navigate("/planner")} className="bg-white text-indigo-700 text-[11px] px-3.5 py-2 rounded-lg mt-3 font-black active:scale-95 transition shadow-sm cursor-pointer">Start Planning</button>
        </div>
      </div>

      {/* Filtered Destinations */}
      <div className="px-5 mt-5 text-left">
        <h2 className="text-sm font-bold text-gray-800 mb-2.5 pl-1">Filtered Destinations</h2>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
          {filteredPlaces.map((item) => (
            <div key={item.id} onClick={() => navigate(`/destination/${item.id}`)} className="shrink-0 transition-transform duration-150 active:scale-95 cursor-pointer">
              <DestinationCard image={item.image} title={item.name} location={`${item.country}`} rating={item.rating} />
            </div>
          ))}
        </div>
      </div>

      {/* 🔥 MAIN AI CHAT SUPPORT ECOSYSTEM */}
      <div className="fixed bottom-0 left-0 w-full h-full flex justify-center z-50 pointer-events-none">
        <div className="w-full max-w-md relative">
          <div className="absolute bottom-24 right-5 pointer-events-auto font-sans text-left">
            <AnimatePresence>
              {isChatOpen && (
                <motion.div
                  ref={chatRef}
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 30, scale: 0.9 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="w-[320px] h-450px max-h-[75vh] bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden mb-4"
                >
                  {/* Chat Header */}
                  <div className="bg-linear-to-r from-indigo-600 to-purple-600 p-3 flex justify-between items-center text-white shrink-0 z-10 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="bg-white/10 p-1.5 rounded-xl animate-pulse">
                        <FaRobot className="text-base text-white" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black tracking-wide">PlotMyPath AI</h4>
                        <p className="text-[9px] text-emerald-300 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span> Online Assistant
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={handleResetChat} 
                        title="Restart Chat"
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                      >
                        <FaSyncAlt className="text-xs" />
                      </button>
                      <button 
                        onClick={() => setIsChatOpen(false)} 
                        title="Close Chat"
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                      >
                        <FaTimes className="text-sm" />
                      </button>
                    </div>
                  </div>

                  {/* Chat Messages Body */}
                  <div className="flex-1 p-3 bg-slate-50 overflow-y-auto space-y-4 text-xs">
                    {chatMessages.map((msg, index) => (
                      <div key={index} className="flex flex-col">
                        <div className={`flex items-start gap-2 ${msg.sender === "user" ? "justify-end" : "max-w-[85%]"}`}>
                          {msg.sender === "ai" && (
                            <div className="bg-indigo-100 text-indigo-600 p-1.5 rounded-lg shrink-0 mt-0.5">
                              <FaRobot className="text-[10px]" />
                            </div>
                          )}
                          <div className={`p-2.5 rounded-2xl shadow-xs font-medium leading-relaxed ${
                            msg.sender === "user" 
                              ? "bg-indigo-600 text-white rounded-tr-none max-w-[85%]" 
                              : "bg-white text-slate-700 border border-slate-100 rounded-tl-none"
                          }`}>
                            {msg.text}
                          </div>
                        </div>

                        {msg.isLanguagePrompt && !language && (
                          <div className="flex flex-wrap gap-2 ml-8 mt-2">
                            <button onClick={() => handleLanguageSelect("hi", "हिंदी 🇮🇳")} className="bg-white hover:bg-indigo-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-full text-[10px] font-bold shadow-sm transition-all cursor-pointer">हिंदी 🇮🇳</button>
                            <button onClick={() => handleLanguageSelect("hinglish", "Hinglish 💬")} className="bg-white hover:bg-indigo-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-full text-[10px] font-bold shadow-sm transition-all cursor-pointer">Hinglish 💬</button>
                            <button onClick={() => handleLanguageSelect("en", "English 🇬🇧")} className="bg-white hover:bg-indigo-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-full text-[10px] font-bold shadow-sm transition-all cursor-pointer">English 🇬🇧</button>
                          </div>
                        )}

                        {msg.quickQuestions && index === chatMessages.length - 1 && (
                          <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden scrollbar-none ml-8 mt-2 py-1">
                            {msg.quickQuestions.map((q, qIdx) => (
                              <button 
                                key={qIdx} 
                                onClick={() => sendMessageToAi(q)} 
                                className="shrink-0 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-full text-[10px] font-extrabold transition-all cursor-pointer shadow-sm whitespace-nowrap"
                              >
                                {q}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {isAiThinking && (
                      <div className="flex items-start gap-2 max-w-[85%]">
                        <div className="bg-indigo-100 text-indigo-600 p-1.5 rounded-lg shrink-0 mt-0.5">
                          <FaRobot className="text-[10px] animate-bounce" />
                        </div>
                        <div className="bg-white p-2.5 rounded-2xl rounded-tl-none border border-slate-100 shadow-xs text-slate-400 font-medium italic flex items-center gap-2">
                          <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div> AI is thinking...
                        </div>
                      </div>
                    )}
                    <div ref={messageEndRef}></div>
                  </div>

                  {/* Chat Input */}
                  <div className="p-2.5 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0">
                    <input 
                      type="text" 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={language ? "Ask AI anything..." : "Please select language first 👆"} 
                      disabled={!language || isAiThinking}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-indigo-500 placeholder:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button 
                      onClick={() => sendMessageToAi()}
                      disabled={!language || isAiThinking}
                      className={`bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer ${(!language || isAiThinking) ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <FaPaperPlane className="text-xs" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Floating Chat Trigger Button */}
            {!isChatOpen && (
              <motion.button 
                onClick={() => setIsChatOpen(true)} 
                whileTap={{ scale: 0.9 }}
                className="w-8 h-8 bg-linear-to-tr from-indigo-600 to-purple-600 rounded-full shadow-2xl shadow-indigo-500/40 flex items-center justify-center animate-bounce border-2 border-white/20 backdrop-blur-xs cursor-pointer"
              >
                <FaRobot className="text-white text-lg animate-pulse" />
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-500 border border-white rounded-full animate-pulse"></span>
              </motion.button>
            )}
          </div>
        </div>
      </div>
      <BottomNav /> 
    </div>
  );
}