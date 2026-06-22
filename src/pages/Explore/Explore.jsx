import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; 
import { FaSearch, FaMapMarkerAlt, FaStar, FaHeart, FaPlus, FaTimes, FaCamera, FaEye, FaFire } from "react-icons/fa";
import BottomNav from "../../components/BottomNav";
import DestinationCard from "../../components/DestinationCard"; // Path check kar lena

export default function Explore() {
  const { user, toggleLikePlace, addNotification } = useAuth(); // 🔥 addNotification hook liya
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [newCountry, setNewCountry] = useState("");
  const [newCategory, setNewCategory] = useState("Beach");
  const [uploadedImages, setUploadedImages] = useState([]); 
  const [showAddForm, setShowAddForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const [places, setPlaces] = useState(() => {
    const localPlaces = localStorage.getItem("plotmypath_places");
    return localPlaces ? JSON.parse(localPlaces) : [
      { id: 1, name: "Bali", country: "Indonesia", rating: "4.9", category: "Beach", images: ["https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400"] },
      { id: 2, name: "Paris", country: "France", rating: "4.8", category: "City", images: ["https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400"] },
      { id: 3, name: "Goa", country: "India", rating: "4.7", category: "Beach", images: ["https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400"] }
    ];
  });

  useEffect(() => {
    localStorage.setItem("plotmypath_places", JSON.stringify(places));
  }, [places]);

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
      images: uploadedImages.length > 0 ? uploadedImages : ["https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400"]
    };

    setPlaces([freshDestination, ...places]);
    
    // 🔥 Notification Trigger
    addNotification("📍 New Spot Added!", `${newName.trim()} is now on your explore list!`);
    
    setNewName("");
    setNewCountry("");
    setUploadedImages([]);
    setShowAddForm(false);
  };

  // DELETE FUNCTION
const handleDelete = (id) => {
  if (window.confirm("Are you sure you want to delete this spot?")) {
    const updatedPlaces = places.filter(p => p.id !== id);
    setPlaces(updatedPlaces); // State update
    localStorage.setItem("plotmypath_places", JSON.stringify(updatedPlaces)); // Storage sync
  }
};

// EDIT FUNCTION (Ek simple prompt ya modal se)
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
    <div className="min-h-screen bg-gray-100 p-5 pb-24 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Explore 🌍</h1>
          <p className="text-gray-500 text-xs mt-0.5">Find or log customized spots</p>
        </div>
        <button onClick={() => { setShowAddForm(!showAddForm); setErrorMsg(""); }} className="bg-indigo-600 text-white p-3 rounded-full shadow active:scale-90 transition cursor-pointer">
          {showAddForm ? <FaTimes size={12}/> : <FaPlus size={12} />}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddNewPlace} className="bg-white p-4 rounded-2xl mt-4 shadow-md space-y-3 border border-gray-100 animate-fadeIn">
          {errorMsg && <p className="text-[10px] bg-red-50 text-red-500 font-bold p-2 rounded-xl text-center">{errorMsg}</p>}
          <input autoFocus type="text" placeholder="Place Name" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full bg-slate-50 border p-2.5 rounded-xl text-xs outline-none" />
          <input type="text" placeholder="Country" value={newCountry} onChange={(e) => setNewCountry(e.target.value)} className="w-full bg-slate-50 border p-2.5 rounded-xl text-xs outline-none" />
          <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full bg-slate-50 border p-2.5 rounded-xl text-xs outline-none font-bold text-gray-600">
            <option value="Beach">🏖️ Beach</option>
            <option value="Mountain">⛰️ Mountain</option>
            <option value="City">🏙️ City</option>
            <option value="Forest">� Forest</option>
          </select>
          <input type="file" multiple accept="image/*" onChange={(e) => {
             const files = Array.from(e.target.files);
             files.forEach((file) => {
               const reader = new FileReader();
               reader.onloadend = () => setUploadedImages((prev) => [...prev, reader.result]);
               reader.readAsDataURL(file);
             });
          }} className="text-xs" />
          <button type="submit" className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-xs font-bold cursor-pointer">Lock Location</button>
        </form>
      )}

      {/* SEARCH BAR */}
      <div className="bg-white mt-4 rounded-xl flex items-center px-4 py-3 shadow border border-gray-50 transition-all">
        <FaSearch className="text-gray-400 text-xs"/>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search verified spots..." className="ml-2 flex-1 outline-none bg-transparent text-xs text-gray-700" />
      </div>

      {/* TRENDING SECTION */}
{search === "" && (
  <div className="mt-6 animate-fadeIn">
    <div className="flex items-center gap-1.5 mb-3 pl-1">
      <div className="bg-orange-100 text-orange-500 p-1.5 rounded-md"><FaFire size={12} /></div>
      <h2 className="text-sm font-black text-gray-800">{trendingInfo.title}</h2>
    </div>
    
    {/* Yahan list ko change kar rahe hain */}
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none items-stretch">
      {trendingInfo.data.map((place) => (
        <div key={place.id} className="w-190px shrink-0 cursor-pointer" onClick={() => navigate(`/destination/${place.id}`, { state: { placeData: place } })}>
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
      {/* ALL PLACES */}
      <div className="mt-5 space-y-5">
        <h2 className="text-sm font-bold text-gray-800 pl-1">
          {search === "" ? "All Destinations" : "Search Results"}
        </h2>
        
        {filtered.map((item) => (
          <div key={item.id} className="cursor-pointer" onClick={() => navigate(`/destination/${item.id}`, { state: { placeData: item } })}>
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
      <BottomNav />
    </div>
  );
}