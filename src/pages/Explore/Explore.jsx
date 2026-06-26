import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; 
import { FaSearch, FaMapMarkerAlt, FaStar, FaHeart, FaPlus, FaTimes, FaCamera, FaEye, FaFire, FaRobot } from "react-icons/fa";
import BottomNav from "../../components/BottomNav";
import DestinationCard from "../../components/DestinationCard"; 
import { motion, AnimatePresence } from "framer-motion"; // Added for smooth animations

export default function Explore() {
  const { user, toggleLikePlace, addNotification } = useAuth(); 
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [newCountry, setNewCountry] = useState("");
  const [newCategory, setNewCategory] = useState("Beach");
  const [uploadedImages, setUploadedImages] = useState([]); 
  const [showAddForm, setShowAddForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const navigate = useNavigate();
  const location = useLocation(); // 🔴 URL se query nikalne ke liye

  const [places, setPlaces] = useState(() => {
    const localPlaces = localStorage.getItem("plotmypath_places");
    return localPlaces ? JSON.parse(localPlaces) : [
      { id: 1, name: "Bali", country: "Indonesia", rating: "4.9", category: "Beach", images: ["https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=400&q=80"] },
      { id: 2, name: "Paris", country: "France", rating: "4.8", category: "City", images: ["https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=400&q=80"] },
      { id: 3, name: "Goa", country: "India", rating: "4.7", category: "Beach", images: ["https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=400&q=80"] }
    ];
  });

  // 🚀 MAGIC: Auto-detect Query from Home Page
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const queryFromUrl = searchParams.get("query");
    if (queryFromUrl) {
      setSearch(queryFromUrl);
    }
  }, [location.search]);

  useEffect(() => {
    localStorage.setItem("plotmypath_places", JSON.stringify(places));
  }, [places]);

  useEffect(() => {
  const isDark = localStorage.getItem("isDarkMode") === "true";
  if (isDark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}, []);


  const handleAddNewPlace = (e) => {
    e.preventDefault();
    if (!newName.trim() || !newCountry.trim()) return;

    const isDuplicate = places.some((p) => p.name.toLowerCase() === newName.trim().toLowerCase());
    if (isDuplicate) {
      setErrorMsg(`"${newName.trim()}" already exists! ❌`);
      return;
    }

    const freshDestination = {
      id: Date.now(),
      name: newName.trim(),
      country: newCountry.trim(),
      category: newCategory,
      rating: (4.0 + (newName.length % 10) * 0.1).toFixed(1),
      images: uploadedImages.length > 0 ? uploadedImages : ["https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=400&q=80"]
    };

    setPlaces([freshDestination, ...places]);
    addNotification("📍 New Spot Added!", `${newName.trim()} is now on your explore list!`);
    
    setNewName("");
    setNewCountry("");
    setUploadedImages([]);
    setShowAddForm(false);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this spot?")) {
      const updatedPlaces = places.filter(p => p.id !== id);
      setPlaces(updatedPlaces); 
      localStorage.setItem("plotmypath_places", JSON.stringify(updatedPlaces)); 
    }
  };

  const handleEdit = (place) => {
    const newName = prompt("Edit Place Name:", place.name);
    if (newName) {
      const updatedPlaces = places.map(p => 
        p.id === place.id ? { ...p, name: newName } : p
      );
      setPlaces(updatedPlaces);
      localStorage.setItem("plotmypath_places", JSON.stringify(updatedPlaces));
    }
  };

  const getSeasonalRecommendations = () => {
    const month = new Date().getMonth(); 
    const isWinter = [10, 11, 0, 1].includes(month); 
    const isSummer = [2, 3, 4, 5].includes(month);   

    let seasonTitle = isWinter ? "Winter Wonders ❄️" : isSummer ? "Cool Summer Escapes 🏔️" : "Monsoon Magic 🌧️";

    let recommended = places.filter(place => {
      const name = place.name.toLowerCase();
      if (isSummer && (name.includes("jaisalmer") || name.includes("rajasthan"))) return false;
      if (isSummer) return place.category === "Mountain";
      if (isWinter) return place.category === "Beach" || place.category === "City";
      return true;
    });

    if (recommended.length === 0) recommended = [...places];
    recommended.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));

    return { 
        title: seasonTitle, 
        data: recommended.slice(0, 4).map(p => ({
            ...p, 
            dynamicReason: isSummer ? "Escape the Heat 🏔️" : isWinter ? "Perfect Chill ❄️" : "Best Season 🌿"
        })) 
    };
  };

  const trendingInfo = getSeasonalRecommendations();
  const filtered = places.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-50 pb-24 text-left overflow-x-hidden">
      
      {/* Premium Header Match */}
      <div className="bg-linear-to-br from-blue-600 via-indigo-600 to-purple-700 p-6 pt-10 pb-8 text-white rounded-b-[35px] shadow-lg relative z-10">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Explore 🌍</h1>
            <p className="text-blue-100 text-sm mt-1 font-medium">Find or log customized spots</p>
          </div>
          <button 
            onClick={() => { setShowAddForm(!showAddForm); setErrorMsg(""); }} 
            className="bg-white/20 backdrop-blur-sm text-white p-3.5 rounded-full shadow-lg active:scale-90 transition-transform cursor-pointer border border-white/30 hover:bg-white/30"
          >
            {showAddForm ? <FaTimes size={16}/> : <FaPlus size={16} />}
          </button>
        </div>

        {/* SEARCH BAR (Upgraded) */}
        <div className="bg-white mt-6 rounded-2xl flex items-center px-4 py-3.5 shadow-xl shadow-black/10 border border-gray-100 transition-all focus-within:ring-2 focus-within:ring-blue-300">
          <FaSearch className="text-indigo-400 text-sm"/>
          <input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search verified spots or AI generated places..." 
            className="ml-3 flex-1 outline-none bg-transparent text-sm font-medium text-gray-800 placeholder-gray-400" 
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-gray-400 hover:text-red-500 transition px-1">
              <FaTimes size={12} />
            </button>
          )}
        </div>
      </div>

      <div className="px-5">
        <AnimatePresence>
          {showAddForm && (
            <motion.form 
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, overflow: "hidden" }}
              onSubmit={handleAddNewPlace} 
              className="bg-white p-5 rounded-3xl mt-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] space-y-4 border border-gray-100"
            >
              <h2 className="font-bold text-gray-800 text-sm mb-2">Add New Location</h2>
              {errorMsg && <p className="text-xs bg-red-50 text-red-500 font-bold p-3 rounded-xl text-center border border-red-100">{errorMsg}</p>}
              
              <input autoFocus type="text" placeholder="Place Name (e.g. Manali)" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-400 p-3.5 rounded-xl text-sm font-medium outline-none transition-colors" />
              <input type="text" placeholder="Country" value={newCountry} onChange={(e) => setNewCountry(e.target.value)} className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-400 p-3.5 rounded-xl text-sm font-medium outline-none transition-colors" />
              
              <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-400 p-3.5 rounded-xl text-sm outline-none font-bold text-indigo-700">
                <option value="Beach">🏖️ Beach</option>
                <option value="Mountain">⛰️ Mountain</option>
                <option value="City">🏙️ City</option>
                <option value="Forest">🌲 Forest</option>
              </select>

              <div className="bg-slate-50 border border-dashed border-slate-300 p-4 rounded-xl flex flex-col items-center justify-center text-center relative overflow-hidden">
                <FaCamera className="text-slate-400 text-xl mb-2" />
                <span className="text-xs font-bold text-slate-500">Tap to upload photos</span>
                <input type="file" multiple accept="image/*" onChange={(e) => {
                    const files = Array.from(e.target.files);
                    files.forEach((file) => {
                      const reader = new FileReader();
                      reader.onloadend = () => setUploadedImages((prev) => [...prev, reader.result]);
                      reader.readAsDataURL(file);
                    });
                }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              </div>

              {uploadedImages.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {uploadedImages.map((img, idx) => (
                    <img key={idx} src={img} alt="preview" className="w-16 h-16 object-cover rounded-lg shadow-sm border border-gray-200 shrink-0" />
                  ))}
                </div>
              )}

              <button type="submit" className="w-full bg-linear-to-r from-indigo-600 to-purple-600 text-white py-3.5 rounded-xl text-sm font-black tracking-wide shadow-md hover:shadow-lg active:scale-95 transition-all">Lock Location</button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* TRENDING SECTION */}
        {search === "" && (
          <div className="mt-8 animate-fadeIn">
            <div className="flex items-center gap-2 mb-3 pl-1">
              <div className="bg-orange-100 text-orange-500 p-2 rounded-lg shadow-inner"><FaFire size={14} /></div>
              <h2 className="text-base font-black text-gray-800 tracking-wide">{trendingInfo.title}</h2>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x">
              {trendingInfo.data.map((place) => (
                <div key={place.id} className="w-200px snap-center shrink-0 cursor-pointer active:scale-95 transition-transform" onClick={() => navigate(`/destination/${place.id}`, { state: { placeData: place } })}>
                   <DestinationCard 
                      place={place}
                      title={place.name}
                      location={place.country}
                      rating={place.rating}
                      image={place.images?.[0]} 
                   />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ALL PLACES OR SEARCH RESULTS */}
        <div className="mt-6 space-y-4 pb-4">
          <h2 className="text-sm font-black text-gray-800 pl-1 uppercase tracking-wider opacity-80 mb-4">
            {search === "" ? "Your Destinations" : `Search Results for "${search}"`}
          </h2>
          
          {/* 🚀 THE SMART AI FALLBACK CARD */}
          {search !== "" && filtered.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              onClick={() => navigate(`/destination/${search}`, { 
                state: { 
                  placeData: { id: Date.now(), name: search, country: "Global Search", rating: "4.8", category: "AI Generated" } 
                } 
              })}
              className="bg-linear-to-br from-indigo-900 to-slate-800 rounded-3xl p-6 text-white shadow-xl cursor-pointer active:scale-95 transition-transform border border-indigo-700 relative overflow-hidden"
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl"></div>
              <div className="flex items-center gap-3 mb-3 relative z-10">
                <div className="bg-white/20 p-3 rounded-2xl animate-pulse backdrop-blur-sm"><FaRobot className="text-blue-300 text-xl" /></div>
                <div>
                  <h3 className="font-black text-lg leading-tight">AI Trip Generator</h3>
                  <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest mt-0.5">Instant Itinerary</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 font-medium leading-relaxed relative z-10">
                We couldn't find <span className="text-white font-bold">"{search}"</span> in your logs. Tap here to let our AI instantly build a complete guide, food, and stay itinerary for this place! ✨
              </p>
            </motion.div>
          )}

          {/* NORMAL FILTERED CARDS */}
          {filtered.map((item) => (
            <div key={item.id} className="cursor-pointer active:scale-95 transition-transform drop-shadow-sm" onClick={() => navigate(`/destination/${item.id}`, { state: { placeData: item } })}>
               <DestinationCard 
                  place={item}
                  title={item.name}
                  location={item.country}
                  rating={item.rating}
                  image={item.images?.[0]}
               />
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}