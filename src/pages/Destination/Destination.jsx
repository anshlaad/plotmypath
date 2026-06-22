import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FaMapMarkerAlt, FaArrowLeft, FaRobot, FaUtensils, FaCamera, FaInfoCircle, FaHotel, FaStar, FaStore, FaClock, FaWallet } from "react-icons/fa";
import BottomNav from "../../components/BottomNav";

export default function Destination() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [place, setPlace] = useState(null);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Data load logic
    if (location.state?.placeData) {
      const p = location.state.placeData;
      setPlace(p);
      fetchFromBackend(p.name);
    } 
    else {
      const savedPlaces = localStorage.getItem("plotmypath_places");
      const placesArray = savedPlaces ? JSON.parse(savedPlaces) : [];
      const matchedPlace = placesArray.find(item => item.id.toString() === id.toString());
      
      if (matchedPlace) {
        setPlace(matchedPlace);
        fetchFromBackend(matchedPlace.name);
      } else {
        setLoading(false);
      }
    }
  // ✅ FIX: Dependency array mein sirf ID use karo (object nahi)
  }, [id, location.state?.placeData?.id]);

  

  const fetchFromBackend = async (name) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/get-guide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name })
      });

      if (!response.ok) throw new Error("Backend error"); 
      const data = await response.json();

      const processImages = async (items, isHotel = false) => {
        return items ? await Promise.all(items.map(async (item) => {
          const pRes = await fetch(`http://localhost:5000/api/photos/${encodeURIComponent(item.name + (isHotel ? " hotel" : ""))}`);
          const pData = await pRes.json();
          return { ...item, image: pData.url };
        })) : [];
      };
      

      setDetails({
        ...data,
        touristPlaces: await processImages(data.touristPlaces),
        famousFood: await processImages(data.famousFood),
        topStays: await processImages(data.topStays, true)
      });
    } catch (e) {
      console.error("Backend Error:", e);
      setDetails({ article: "Data temporarily unavailable.", touristPlaces: [], famousFood: [], topStays: [], nearbyAttractions: [] });
    }
    setLoading(false);
  };


  
  if (!place) return <div className="text-white p-10 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-32 font-sans overflow-y-auto">
      {/* 📸 Dynamic Header Image */}
<div className="w-full h-72 relative">
  <img 
    // ✅ Agar 'place.images' update ho gaya hai (backend se aane ke baad), toh wo dikhaye
    src={place.images?.[0] || place.image} 
    className="w-full h-full object-cover transition-all duration-700"
    alt={place.name}
  />
  <button onClick={() => navigate(-1)} className="absolute top-6 left-4 p-3 bg-black/50 backdrop-blur-md rounded-full">
    <FaArrowLeft />
  </button>
</div>

      <div className="px-5 -mt-10 relative space-y-6">
        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-xl">
          <h1 className="text-3xl font-black">{place.name}</h1>
          <p className="text-sm text-slate-400 mt-1"><FaMapMarkerAlt className="inline" /> {place.country}</p>
        </div>

        {loading ? (
          <div className="text-center py-10 text-xs animate-pulse">Requesting Server for Original Insights...</div>
        ) : details ? (
          <>
            {/* ✅ PRO INSIGHTS & BUDGET */}
            <section className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex items-center gap-3">
                <FaClock className="text-indigo-400" />
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Best Time</p>
                  <p className="text-xs font-bold">{details.bestTime || "Oct - Mar"}</p>
                </div>
              </div>
              <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex items-center gap-3">
                <FaWallet className="text-emerald-400" />
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Est. Budget</p>
                  <p className="text-xs font-bold text-emerald-400">{details.estimatedBudget || "Contact Agent"}</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-2 text-indigo-400 flex items-center gap-2"><FaInfoCircle /> Guide Article</h2>
              <p className="text-xs text-slate-300 bg-slate-800 p-4 rounded-xl border border-slate-700 leading-relaxed">{details.article}</p>
            </section>

            {details.nearbyAttractions && (
              <section className="bg-slate-800 p-5 rounded-3xl border border-slate-700">
                <h2 className="text-sm font-bold mb-4 flex items-center gap-2 text-indigo-400"><FaMapMarkerAlt /> Nearby Gems</h2>
                <div className="space-y-3">
                  {details.nearbyAttractions.map((att, i) => (
                    <div key={i} className="flex items-center gap-3 bg-slate-900 p-3 rounded-xl border border-slate-700">
                      <div className="w-8 h-8 rounded-full bg-indigo-900/50 flex items-center justify-center text-indigo-400 text-xs font-bold">{i + 1}</div>
                      <div>
                        <h4 className="text-xs font-bold">{att.name}</h4>
                        <p className="text-[9px] text-slate-500">{att.distance || "Nearby"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-indigo-400"><FaHotel /> Top Rated Stays</h2>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                {details.topStays?.map((h, i) => (
                  <div key={i} onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.name + " " + place.name)}`, '_blank')} className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden w-60 shrink-0 cursor-pointer hover:scale-105 transition-all">
                    <img src={h.image} className="w-full h-28 object-cover" />
                    <div className="p-3">
                      <div className="flex justify-between items-center"><h4 className="font-bold text-xs truncate">{h.name}</h4><span className="text-[10px] text-amber-400 font-bold">★ {h.rating}</span></div>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{h.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-indigo-400"><FaCamera /> Must Visit</h2>
              <div className="space-y-4">
                {details.touristPlaces?.map((s, i) => (
                  <div key={i} onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.name + " " + place.name)}`, '_blank')} className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden cursor-pointer hover:scale-[1.02] transition-all">
                    <img src={s.image} className="w-full h-32 object-cover" />
                    <div className="p-4"><h4 className="font-bold text-sm">{s.name}</h4><p className="text-[10px] text-slate-400 mt-1">{s.desc}</p></div>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-8">
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-indigo-400">
                <span className="text-xl">🍲</span> Famous Food
              </h2>
              <div className="space-y-4">
                {details.famousFood?.map((f, i) => (
                  <div key={i} className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
                    <h4 className="font-bold text-sm text-white">{f.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-1">{f.desc}</p>
                    <div className="mt-3 pt-3 border-t border-slate-700">
                      <p className="text-[9px] font-bold text-indigo-300 uppercase tracking-wider">📍 Best spot to try:</p>
                      <p className="text-[11px] font-semibold text-white mt-0.5">{f.shop}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>            
          </>
        ) : null}

        <button onClick={() => navigate("/planner", { state: { autofillDestination: place.name } })} className="w-full bg-indigo-600 hover:bg-indigo-700 py-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-95">
          <FaRobot /> Build Route for {place.name}
        </button>
      </div>
      <BottomNav />
    </div>
  );
}