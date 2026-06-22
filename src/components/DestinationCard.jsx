import React, { useState, useEffect } from "react";
import { FaMapMarkerAlt, FaStar } from "react-icons/fa";

export default function DestinationCard({ title, location, rating, place }) {
  // ✅ Pura place object prop mein lo taaki uski original image access kar sakein
  const [imgSrc, setImgSrc] = useState(place?.images?.[0] || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=300");

  useEffect(() => {
    // Agar image nahi hai ya unsplash ka default hai, tabhi fetch karo
    if (!place?.images?.[0] || imgSrc.includes("unsplash")) {
      fetch(`http://localhost:5000/api/photos/${encodeURIComponent(title)}`)
        .then(res => res.json())
        .then(data => {
          if (data.url) setImgSrc(data.url);
        })
        .catch(err => console.error("Image fetch failed", err));
    }
  }, [place, title]); // place aur title change hone par update hoga

  return (
    <div className="min-w-190px bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-xs border border-slate-100 dark:border-slate-700/50">
      <div className="w-full h-32 overflow-hidden relative">
        <img 
          src={imgSrc} 
          alt={title} 
          className="w-full h-full object-cover transition-opacity duration-500"
        />
      </div>
      <div className="p-3 text-left">
        <h3 className="text-xs font-black text-gray-800 dark:text-slate-100 truncate">{title}</h3>
        <p className="text-[10px] text-gray-400 font-bold truncate mt-1 flex items-center gap-0.5">
          <FaMapMarkerAlt className="text-indigo-500" size={9} />
          {location}
        </p>
        <div className="mt-2.5 flex items-center">
          <span className="text-[9px] bg-amber-50 dark:bg-amber-950/40 text-amber-600 px-1.5 py-0.5 rounded-md font-black flex items-center gap-0.5">
            <FaStar size={8} /> {rating || "4.5"}
          </span>
        </div>
      </div>
    </div>
  );
}