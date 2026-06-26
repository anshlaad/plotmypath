import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FaMapMarkerAlt, FaArrowLeft, FaRobot, FaInfoCircle, FaHotel, FaClock, FaWallet, FaHeart, FaRegHeart, FaCamera } from "react-icons/fa";
import BottomNav from "../../components/BottomNav";
import TravelLoader from "../../components/TravelLoader";
import { useAuth } from "../../context/AuthContext";

export default function Destination() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [place, setPlace] = useState(null);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false); // 🟢 Loop breaker

  const { user, toggleLikePlace } = useAuth();

  useEffect(() => {
    // 1. Data load logic
    if (location.state?.placeData) {
      setPlace(location.state.placeData);
    } else {
      const savedPlaces = localStorage.getItem("plotmypath_places");
      const placesArray = savedPlaces ? JSON.parse(savedPlaces) : [];
      const matchedPlace = placesArray.find(item => item.id.toString() === id.toString());
      if (matchedPlace) setPlace(matchedPlace);
      else setLoading(false);
    }
  }, [id, location.state?.placeData]);

  useEffect(() => {
    // 🟢 Loop breaker: Agar fetch ho chuka hai ya place nahi hai, toh mat chalao
    if (!place || hasFetched) return;

    const fetchFromBackend = async (name) => {
      setLoading(true);
      try {
        const response = await fetch(`https://plotmypath-backend.onrender.com/api/get-guide`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name })
        });

        if (!response.ok) throw new Error("Backend error"); 
        const data = await response.json();

        const processImages = async (items, isHotel = false) => {
          return items ? await Promise.all(items.map(async (item) => {
            const pRes = await fetch(`https://plotmypath-backend.onrender.com/api/photos/${encodeURIComponent(item.name + (isHotel ? " hotel" : ""))}`);
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
        setHasFetched(true); // 🟢 Fetch complete hone par flag update
      } catch (e) {
        console.error("Backend Error:", e);
        setDetails({ article: "Data temporarily unavailable.", touristPlaces: [], famousFood: [], topStays: [] });
      }
      setLoading(false);
    };

    fetchFromBackend(place.name);
  }, [place, hasFetched]); // 🟢 Dependencies updated

  const handleLikeClick = async () => {
    if (!user) {
      alert("Login Required ! 🔒");
      navigate("/login");
      return;
    }
    if (navigator.vibrate) navigator.vibrate(40);
    await toggleLikePlace(place);
  };

  const isLiked = user?.likedPlaces?.some((p) => p.id === place?.id);

  if (!place) return <div className="text-white p-10 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-32 font-sans overflow-y-auto">
      {/* Dynamic Header Image */}
      <div className="w-full h-72 relative">
        <img 
          src={place.images?.[0] || place.image} 
          className="w-full h-full object-cover transition-all duration-700"
          alt={place.name}
        />
        <button onClick={() => navigate(-1)} className="absolute top-6 left-4 p-3 bg-black/50 backdrop-blur-md rounded-full active:scale-90 transition">
          <FaArrowLeft />
        </button>
        <button onClick={handleLikeClick} className="absolute top-6 right-4 p-3 bg-black/50 backdrop-blur-md rounded-full active:scale-90 transition shadow-lg">
          {isLiked ? <FaHeart size={20} className="text-rose-500" /> : <FaRegHeart size={20} className="text-white" />}
        </button>
      </div>

      <div className="px-5 -mt-10 relative space-y-6">
        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-xl">
          <h1 className="text-3xl font-black">{place.name}</h1>
          <p className="text-sm text-slate-400 mt-1"><FaMapMarkerAlt className="inline" /> {place.country || "India"}</p>
        </div>

        {loading ? (
          <div className="py-10 w-full flex justify-center"><TravelLoader /></div>
        ) : details ? (
          <>
            <section className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex items-center gap-3">
                <FaClock className="text-indigo-400" />
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Best Time</p>
                  <p className="text-xs font-bold">Oct - Mar</p>
                </div>
              </div>
              <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex items-center gap-3">
                <FaWallet className="text-emerald-400" />
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Est. Budget</p>
                  <p className="text-xs font-bold text-emerald-400">Budget Friendly</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-2 text-indigo-400 flex items-center gap-2"><FaInfoCircle /> Guide Article</h2>
              <p className="text-xs text-slate-300 bg-slate-800 p-4 rounded-xl border border-slate-700 leading-relaxed">{details.article}</p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-indigo-400"><FaHotel /> Top Rated Stays</h2>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                {details.topStays?.map((h, i) => (
                  <div key={i} className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden w-60 shrink-0 cursor-pointer hover:scale-105 transition-all">
                    <img src={h.image} className="w-full h-28 object-cover" alt="hotel" />
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
                  <div key={i} className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden cursor-pointer hover:scale-[1.02] transition-all">
                    <img src={s.image} className="w-full h-32 object-cover" alt="tourist place" />
                    <div className="p-4"><h4 className="font-bold text-sm">{s.name}</h4><p className="text-[10px] text-slate-400 mt-1">{s.desc}</p></div>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-8">
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-indigo-400">🍲 Famous Food</h2>
              <div className="space-y-4">
                {details.famousFood?.map((f, i) => (
                  <div key={i} className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
                    <h4 className="font-bold text-sm text-white">{f.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-1">{f.desc}</p>
                    <div className="mt-3 pt-3 border-t border-slate-700">
                      <p className="text-[9px] font-bold text-indigo-300 uppercase">📍 Best spot:</p>
                      <p className="text-[11px] font-semibold mt-0.5">{f.shop}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : null}

        <button onClick={() => navigate("/planner", { state: { autofillDestination: place.name } })} className="w-full bg-indigo-600 hover:bg-indigo-700 py-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-900/50">
          <FaRobot /> Build Route for {place.name}
        </button>
      </div>
      <BottomNav />
    </div>
  );
}