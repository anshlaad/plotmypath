import React, { useState, useEffect, useRef } from "react";
import BottomNav from "../../components/BottomNav";
import { useLocation, useNavigate } from "react-router-dom"; // 🔥 useNavigate yahan add kiya hai
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config"; 
import { collection, addDoc } from "firebase/firestore";
import { FaRobot } from "react-icons/fa";
import { motion } from "framer-motion";

// --- TIMELINE DECORATION ICONS ---
const ClockIcon = () => (
  <svg className="w-3.5 h-3.5 text-indigo-500 mr-1.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4 text-gray-400 hover:text-red-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const BookmarkIcon = ({ saved }) => (
  <svg 
    className={`w-4 h-4 shrink-0 transition-all duration-300 ${
      saved ? "text-emerald-500 fill-emerald-500 scale-110" : "text-slate-400 hover:text-slate-600"
    }`} 
    fill={saved ? "currentColor" : "none"} 
    viewBox="0 0 24 24" 
    stroke="currentColor" 
    strokeWidth={saved ? 0 : 2}
  >
    {saved ? (
      <>
        <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        <path stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M9 11l2 2 4-4" />
      </>
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    )}
  </svg>
);

const ExclamationIcon = () => (
  <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

export default function Planner() {
  const location = useLocation();
  const navigate = useNavigate(); // 🔥 React Router Navigation hook initialize kiya
  const incomingDestination = location.state?.autofillDestination || "";

  const [source, setSource] = useState("");
  const [destination, setDestination] = useState(incomingDestination);
  const [days, setDays] = useState("3");
  const [budgetType, setBudgetType] = useState("Balanced");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  const { addNotification, user } = useAuth();
  const { savedTripData } = location.state || {};
  const [saveStatus, setSaveStatus] = useState(false);

  useEffect(() => {
    if (savedTripData) {
      setCurrentItinerary(savedTripData);
    }
  }, [savedTripData]);
  
  useEffect(() => {
    if (incomingDestination) {
      setDestination(incomingDestination);
    }
  }, [incomingDestination]);

  const [currentItinerary, setCurrentItinerary] = useState(() => {
    try {
      const saved = localStorage.getItem("plotmypath_live_ai_itinerary");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  
  const fetchWithRetry = async (url, options) => {
    const delays = [1000, 2000, 4000, 8000, 16000];
    for (let i = 0; i < delays.length; i++) {
      try {
        const response = await fetch(url, options);
        if (response.ok) return response;
        const errorData = await response.json().catch(() => ({}));
        if (i === delays.length - 1) {
          throw new Error(errorData.error?.message || `HTTP Failure: ${response.status}`);
        }
      } catch (error) {
        if (i === delays.length - 1) throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delays[i]));
    }
  };

  const itineraryRef = useRef(null);

  const handleDownloadPDF = () => {
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleGenerateItinerary = async (e) => {
    e.preventDefault();
    if (!destination.trim()) {
      setAlertMessage("Please enter a destination!");
      return;
    }

    setIsGenerating(true);
    setAlertMessage("");
    setSaveStatus("Save to Profile");

    const systemPrompt = `Act as an expert travel planner. You MUST respond strictly in a raw valid JSON format matching the requested schema. Do not enclose inside markdown block.`;

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY; 
      
      const userQuery = `Generate a complete real-time travel itinerary from ${source} to ${destination} for a duration of ${days} days under a ${budgetType} budget standard.
      REQUIREMENTS:
      1. Accurately name real, existing top-rated hotels, famous restaurants (exactly 5 options), popular authentic markets, and exact sightseeing spots. Use Google Search grounding to verify they exist right now.
      2. Transit Guide: Provide a specific object 'transitGuide' with details for 'flights', 'trains', and 'road' (include route names/numbers and travel duration).      3. Budget Breakdown: Provide an object with estimated costs for 'transport', 'stay', 'food', and 'misc'.
      4. Travel Tips: Provide an array of exactly 5 essential, destination-specific expert travel tips.
      5. Packing Suggestions: Provide an object with three arrays: 'winter', 'summer', and 'monsoon', listing essential items for each.
      You MUST respond strictly in a single valid JSON object format matching this exact structural schema:
      {
        "meta": { "route": "${source} to ${destination}", "budgetStrategy": "${budgetType}", "duration": "${days} Days Plan" },
"transitGuide": {
    "flights": "Details of nearest airport, flight routes, and time.",
    "trains": "Details of nearest railway station, train names/numbers, and time.",
    "road": "Road route, distance, and road travel duration."
  },
          "hotels": ["Real Hotel 1", "Real Hotel 2", "Real Hotel 3", "Real Hotel 4", "Real Hotel 5"],
        "restaurants": ["Real Food 1", "Real Food 2", "Real Food 3", "Real Food 4", "Real Food 5"],
        "markets": ["Market 1", "Market 2", "Market 3", "Market 4", "Market 5"],
        "masterItinerary": [
          {
            "dayNumber": 1,
            "theme": "...",
            "accommodation": { "name": "...", "checkInComfort": "..." },
            "timeline": [
              { "time": "09:00 AM", "type": "sightseeing", "title": "...", "detail": "...", "tip": "..." }
            ]
          }
        ],
        "budgetBreakdown": { "transport": "...", "stay": "...", "food": "...", "misc": "..." },
        "travelTips": ["Tip 1", "Tip 2", "Tip 3", "Tip 4", "Tip 5"],
        "packingSuggestions": {
          "winter": ["Item 1", "Item 2"],
          "summer": ["Item 1", "Item 2"],
          "monsoon": ["Item 1", "Item 2"]
        }
      }`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      
      const response = await fetchWithRetry(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userQuery }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] }, 
          tools: [{ googleSearch: {} }] 
        })
      });

      const result = await response.json();
      let rawTextResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawTextResponse) throw new Error("AI endpoints se empty content response mila.");

      let cleanText = rawTextResponse.trim();
      const firstBrace = cleanText.indexOf("{");
      const lastBrace = cleanText.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleanText = cleanText.substring(firstBrace, lastBrace + 1);
      }

      const cleanJsonPayload = JSON.parse(cleanText);
      setCurrentItinerary(cleanJsonPayload);
      localStorage.setItem("plotmypath_live_ai_itinerary", JSON.stringify(cleanJsonPayload));

    const newLead = {
      name: user?.displayName || user?.name || "Guest User",
      phone: user?.phoneNumber || user?.phone || "No Number",
      email: user?.email || "No Email",
      
      source: source,             
      destination: destination,
      days: days,                 
      budget: budgetType,
      date: new Date().toLocaleDateString(),
      createdAt: new Date().toISOString(), 
      status: "New"
    };

    try {
      await addDoc(collection(db, "leads"), newLead);
      console.log("Lead successfully captured in Firestore!");
    } catch (dbError) {
      console.error("Firestore Save Error:", dbError);
    }

  } catch (error) {
    console.error("Error saving lead:", error);
  } finally {
    setIsGenerating(false);
  }
};

  const handleSaveToProfile = () => {
    if (!currentItinerary) return;

    // 🔥 ACTION-BASED AUTHENTICATION (Bouncer)
    if (!user) {
      // Agar user login nahi hai, toh pyaar se redirect kar do
      alert("Please sign in to save itineraries to your profile! 🔒");
      navigate("/login");
      return; 
    }

    try {
      const existingSaved = localStorage.getItem("plotmypath_saved_itineraries");
      let savedArray = existingSaved ? JSON.parse(existingSaved) : [];
      
      const savedIndex = savedArray.findIndex(
        (item) => item.meta?.route === currentItinerary.meta?.route && item.meta?.duration === currentItinerary.meta?.duration
      );
      
      if (savedIndex >= 0) {
        savedArray.splice(savedIndex, 1);
        localStorage.setItem("plotmypath_saved_itineraries", JSON.stringify(savedArray));
        setSaveStatus(""); 
      } else {
        const itineraryWithId = {
          ...currentItinerary,
          savedAt: new Date().toLocaleDateString(),
          id: `iti_${Date.now()}`
        };
        savedArray.push(itineraryWithId);
        localStorage.setItem("plotmypath_saved_itineraries", JSON.stringify(savedArray));
        setSaveStatus("✓"); 
      }
    } catch (e) {
      setAlertMessage("Error occurred while saving to profile.");
    }
  };

  const handleConfirmClear = () => {
    localStorage.removeItem("plotmypath_live_ai_itinerary");
    setCurrentItinerary(null);
    setShowClearConfirm(false);
    setSaveStatus("Save to Profile");
  };

  // 🔥 PREMIUM SKELETON LOADER
  const SkeletonLoader = () => (
    <div className="mt-6 space-y-5 animate-pulse">
      <div className="h-24 bg-slate-200 rounded-2xl w-full"></div>
      <div className="h-48 bg-slate-200 rounded-3xl w-full"></div>
      <div className="h-32 bg-slate-200 rounded-3xl w-full"></div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-56 bg-slate-200 rounded-3xl w-full"></div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-36 text-left relative transition-all duration-300 font-sans overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none">
    <div className="print:hidden">
      {alertMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl mb-4 flex items-start gap-3 shadow-sm transition-opacity duration-200">
          <ExclamationIcon />
          <div className="text-xs flex-1">
            <span className="font-bold block text-red-800">Travel System Notice</span>
            <p className="mt-1 text-red-600/90 leading-relaxed font-semibold">{alertMessage}</p>
            <button onClick={() => setAlertMessage("")} className="text-red-700 underline font-black mt-2 block cursor-pointer">Dismiss</button>
          </div>
        </div>
      )}

      {/* HEADER ROW */}
      <div className="flex items-center gap-3 mb-5 px-1">
        <div className="relative flex items-center justify-center w-12 h-12 bg-linear-to-tr from-indigo-600 to-purple-600 rounded-2xl shadow-lg shadow-indigo-200 shrink-0">
          <div className="absolute inset-0 rounded-2xl bg-indigo-400 animate-ping opacity-20"></div>
          <FaRobot className="text-white text-[26px] relative z-10 animate-bounce" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">AI Itinerary</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Plan your perfect trip with our AI-powered itinerary builder</p>
        </div>
      </div>

      {/* SETUP SELECTION PANELS */}
      <div className="bg-white p-5 rounded-3xl shadow-xl shadow-slate-100/70 border border-slate-100">
        <form onSubmit={handleGenerateItinerary} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5 pl-0.5">Source</label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 focus-within:border-indigo-500 transition-all">
                <input type="text" value={source} onChange={(e) => setSource(e.target.value)} placeholder="Enter Source" className="w-full bg-transparent text-xs font-bold text-slate-700 outline-none" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5 pl-0.5">Destination</label>
              <div className="flex items-center bg-slate-50 border border-indigo-100 rounded-2xl px-3 py-2.5 focus-within:border-indigo-500 transition-all">
                <input type="text" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Enter Destination" className="w-full bg-transparent text-xs font-bold text-slate-700 outline-none placeholder:text-slate-300" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5 pl-0.5">Duration</label>
              <select value={days} onChange={(e) => setDays(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl text-xs font-black text-slate-600 outline-none cursor-pointer">
                <option value="3">3 Days Tour Plan</option>
                <option value="5">5 Days Vacation</option>
                <option value="7">7 Days Premium</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5 pl-0.5">Budget Class</label>
              <select value={budgetType} onChange={(e) => setBudgetType(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl text-xs font-black text-slate-600 outline-none cursor-pointer">
                <option value="Balanced">⚖️ Balanced Comfort</option>
                <option value="Luxury Pro">💎 Premium Luxury</option>
                <option value="Backpacker">🎒 Economy Budget</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={isGenerating} className="w-full bg-indigo-600 text-white py-3.5 rounded-2xl text-xs font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer">
            {isGenerating ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Grounding Live Data Layers...</> : "Generate Live Complete Itinerary"}
          </button>
        </form>
      </div>
    </div>
      {/* MATRIX RESPONSE LAYOUTS */}
      {isGenerating ? (
        <SkeletonLoader />
      ) : currentItinerary ? (
        <div className="mt-6 print:mt-0">
          
          {/* 📄 PDF WRAPPER */}
          <div className="space-y-5 bg-slate-50 print:bg-white pb-10">
            
            {/* HEADER CARD */}
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm print:border-none print:shadow-none print:p-0">
              <div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <span>{currentItinerary.meta?.route}</span>
                </h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{currentItinerary.meta?.budgetStrategy} • {currentItinerary.meta?.duration}</p>
              </div>
              
              <div className="flex items-center gap-2 print:hidden">
                
                {/* 1. Save to Profile Button */}
                <button 
                  onClick={handleSaveToProfile} 
                  className={`p-2 px-3 border rounded-xl font-bold text-xs flex items-center transition-all cursor-pointer ${
                    saveStatus === "✓" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  <BookmarkIcon saved={saveStatus === "✓"} />
                  <span>{saveStatus}</span>
                </button>
                
                {/* 2. Trash Button */}
                <button 
                  onClick={() => setShowClearConfirm(true)} 
                  className="p-2 border border-slate-100 hover:bg-red-50 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                >
                  <TrashIcon />
                </button>

                {/* 📥 3. NEW DOWNLOAD ICON BUTTON */}
                <button 
                  onClick={handleDownloadPDF} 
                  className="p-2 border border-slate-200 bg-white hover:bg-indigo-50 text-indigo-600 rounded-xl transition-all cursor-pointer flex items-center justify-center shadow-sm"
                  title="Download PDF"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>

              </div>
            </div>

          {currentItinerary.hotels && (
            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5 }}
                className="bg-white p-5 rounded-3xl shadow-md border border-slate-100"
              >              
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3 flex items-center"><span className="mr-2 text-sm">🏨</span> Top 5 Verified Accommodations</h3>
              <div className="space-y-2">
                {currentItinerary.hotels.map((h, i) => (
                  <div key={i} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 flex items-center"><span className="w-5 text-indigo-500 font-black">{i+1}.</span> {h}</div>
                ))}
              </div>
            </motion.div>
          )}

          {currentItinerary.transitGuide && (
          <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5 }}
              className="bg-white p-5 rounded-3xl shadow-md border border-slate-100 mb-5"
            >
            <h3 className="text-xs font-black text-slate-800 uppercase mb-4 flex items-center">
              <span className="mr-2 text-sm">📍</span> How to Reach
            </h3>
            <div className="space-y-3">
              {Object.entries(currentItinerary.transitGuide).map(([mode, details]) => (
                <div key={mode} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-black text-indigo-600 uppercase mb-0.5">{mode} Mode</p>
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed">{details}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

          {currentItinerary.restaurants && (
            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5 }}
                className="bg-white p-5 rounded-3xl shadow-md border border-slate-100"
              >
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3 flex items-center"><span className="mr-2 text-sm">🍲</span> Top 5 Authentic Food Joints</h3>
              <div className="space-y-2">
                {currentItinerary.restaurants.map((r, i) => (
                  <div key={i} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 flex items-center"><span className="w-5 text-emerald-500 font-black">{i+1}.</span> {r}</div>
                ))}
              </div>
            </motion.div>
          )}

          {currentItinerary.markets && (
            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5 }}
                className="bg-white p-5 rounded-3xl shadow-md border border-slate-100"
              >
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3 flex items-center"><span className="mr-2 text-sm">🛍️</span> Top 5 Handpicked Local Bazaars</h3>
              <div className="space-y-2">
                {currentItinerary.markets.map((m, i) => (
                  <div key={i} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 flex items-center"><span className="w-5 text-amber-500 font-black">{i+1}.</span> {m}</div>
                ))}
              </div>
            </motion.div>
          )}

          {currentItinerary.masterItinerary?.map((dayCard, dIdx) => (
             <motion.div 
                key={dIdx} 
                initial={{ opacity: 0, scale: 0.95, y: 40 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-3xl shadow-md border border-slate-100 overflow-hidden"
              >              <div className="bg-slate-900 p-4 flex justify-between items-center">
                <span className="text-xs font-black text-amber-400 uppercase tracking-widest">DAY {dayCard.dayNumber}</span>
                <span className="text-xs text-slate-300 font-extrabold truncate max-w-[70%]">{dayCard.theme}</span>
              </div>
              <div className="p-5 space-y-5 relative border-l-2 border-dashed border-slate-100 ml-5 my-2">
                {dayCard.timeline?.map((slot, sIdx) => (
                  <div key={sIdx} className="relative pl-4 text-left">
                    <div className="absolute -left-25px top-1.5 w-2.5 h-2.5 bg-indigo-600 rounded-full ring-4 ring-indigo-50"></div>
                    <div className="flex items-center text-[10px] font-black w-fit px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600">
                      <ClockIcon /> <span>{slot.time}</span>
                    </div>
                    <h4 className="text-xs font-black text-slate-800 mt-2">{slot.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed font-semibold">{slot.detail}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}

          {currentItinerary.budgetBreakdown && (
           <motion.div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
             <h3 className="text-xs font-black text-slate-800 uppercase mb-3">💰 Budget Breakdown</h3>
             <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-600">
               {Object.entries(currentItinerary.budgetBreakdown).map(([k, v]) => (
                 <div key={k} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 capitalize">
                    {k}: <span className="text-indigo-600">{v}</span>
                 </div>
               ))}
             </div>
           </motion.div>
         )}

         {/* 💡 TRAVEL TIPS */}
         {currentItinerary.travelTips && (
           <motion.div className="bg-indigo-900 p-5 rounded-3xl text-white">
             <h3 className="text-xs font-black uppercase mb-3 tracking-wider">💡 Expert Travel Tips</h3>
             <ul className="space-y-1.5 list-disc pl-4 text-[11px] font-medium leading-relaxed">
               {currentItinerary.travelTips.map((tip, i) => <li key={i}>{tip}</li>)}
             </ul>
           </motion.div>
         )}

        {/* 🎒 PACKING ESSENTIALS */}
        {currentItinerary.packingSuggestions && (
          <motion.div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-xs font-black text-slate-800 uppercase mb-3">🎒 Packing Essentials</h3>
            <div className="space-y-3">
              {Object.entries(currentItinerary.packingSuggestions).map(([season, items]) => (
                <div key={season}>
                  <p className="text-[9px] font-black text-indigo-600 uppercase mb-1">{season} Gear</p>
                  <p className="text-[10px] text-slate-600 font-semibold leading-relaxed">
                    {Array.isArray(items) ? items.join(", ") : items}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 🔥 FIRM BRANDING FOOTER (PDF ke end me print hoga) */}
            <div className="mt-12 pt-8 border-t-2 border-slate-200 text-center pb-5">
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                Brilliant<span className="text-indigo-600">Events</span>
              </h1>
              <p className="text-[11px] font-bold text-slate-500 uppercase mt-1 tracking-widest">
                Travel partner & itinerary architect
              </p>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">
                INDIA
              </p>
              <div className="mt-4 inline-block px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-full shadow-sm text-[10px] font-black text-slate-600">
                Planned with PlotMyPath AI Planner
              </div>
            </div>

          </div>
      </div>
      ) : (
        !isGenerating && (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center mt-6 space-y-3">
            <h4 className="font-black text-slate-700 text-sm">AI Live Board Architecture Ready</h4>
            <p className="max-w-[85%] mx-auto text-[11px] text-slate-400 font-medium leading-relaxed">Direct Google Web Grounding Active. Enter tracking destinations to generate highly accurate structural itineraries instantly.</p>
          </div>
        )
      )}

      {/* CLEAR CONFIRM MODAL */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-5 rounded-3xl max-w-sm w-full text-center space-y-4 shadow-2xl border border-slate-100">
            <h4 className="text-sm font-black text-slate-800">Clear Current Itinerary?</h4>
            <div className="flex gap-2">
              <button onClick={() => setShowClearConfirm(false)} className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-500 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer">No</button>
              <button onClick={handleConfirmClear} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer">Yes</button>
            </div>
          </div>
        </div>
      )}
    <div className="print:hidden">  
      <BottomNav />
      </div>
    </div>    
  );
}