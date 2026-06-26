import React, { useState, useEffect } from "react";
import { FaCheckSquare, FaSquare, FaPlus, FaTrashAlt, FaSuitcase, FaCheckCircle } from "react-icons/fa";
import BottomNav from "../../components/BottomNav";
import { motion, AnimatePresence } from "framer-motion";

function Packing() {
  const [items, setItems] = useState([
    { id: 1, text: "Passport & Identity Cards", packed: true },
    { id: 2, text: "Smartphone Charger & Powerbank", packed: false },
    { id: 3, text: "First Aid & Daily Medicines", packed: false },
  ]);
  const [newItem, setNewItem] = useState("");

  const handleAddItem = (e) => {
    if (e) e.preventDefault();
    if (!newItem.trim()) return;
    setItems((prevItems) => [...prevItems, { id: Date.now(), text: newItem.trim(), packed: false }]);
    setNewItem("");
  };

  const togglePack = (id) => {
    if (navigator.vibrate) navigator.vibrate(40);
    setItems(items.map((item) => (item.id === id ? { ...item, packed: !item.packed } : item)));
  };

  const handleDelete = (id) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const packedCount = items.filter((i) => i.packed).length;
  const progress = items.length > 0 ? Math.round((packedCount / items.length) * 100) : 0;

  useEffect(() => {
  const isDark = localStorage.getItem("isDarkMode") === "true";
  if (isDark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}, []);

  return (
    <div className="min-h-screen bg-slate-50 pb-32 font-sans overflow-x-hidden">
      {/* 🚀 PREMIUM GRADIENT HEADER */}
      <div className="bg-linear-to-br from-indigo-600 to-purple-700 rounded-b-[40px] p-8 pt-12 pb-16 text-white text-center shadow-2xl relative">
        <h1 className="text-2xl font-black tracking-tight">Baggage Checklist</h1>
        <p className="text-indigo-100 text-xs font-medium mt-1 opacity-90 uppercase tracking-widest">Never leave essentials behind</p>
      </div>

      {/* 🚀 PROGRESS METRIC CARD */}
      <div className="mx-5 -mt-10 bg-white rounded-3xl p-5 shadow-xl border border-gray-100 flex items-center justify-between z-10 relative">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-50 text-indigo-600 p-4 rounded-2xl">
            <FaSuitcase size={20} />
          </div>
          <div>
            <h3 className="font-black text-gray-800 text-sm">Packing Progress</h3>
            <p className="text-[10px] text-gray-400 font-bold mt-0.5">{packedCount} of {items.length} items packed</p>
          </div>
        </div>
        <div className="text-center">
           <span className="text-lg font-black text-indigo-600">{progress}%</span>
        </div>
      </div>

      {/* INPUT BOX */}
      <div className="mx-5 mt-6">
        <form onSubmit={handleAddItem} className="flex gap-2 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
          <input
            type="text"
            placeholder="Add item (e.g. Headphones)..."
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            className="flex-1 bg-transparent px-3 py-2 text-xs outline-none text-gray-800 font-bold"
          />
          <button type="submit" className="bg-indigo-600 text-white p-3 rounded-xl text-xs hover:bg-indigo-700 active:scale-95 transition-all">
            <FaPlus />
          </button>
        </form>
      </div>

      {/* ACTIVE ITEMS LIST */}
      <div className="mx-5 mt-6 space-y-3">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onClick={() => togglePack(item.id)}
              className={`border rounded-2xl p-4 flex justify-between items-center cursor-pointer transition-all shadow-sm ${
                item.packed ? "bg-slate-100 border-transparent opacity-60" : "bg-white border-gray-100"
              }`}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className={`text-lg ${item.packed ? "text-indigo-600" : "text-gray-300"}`}>
                  {item.packed ? <FaCheckSquare /> : <FaSquare />}
                </div>
                <span className={`text-xs font-bold ${item.packed ? "line-through text-gray-400" : "text-gray-700"}`}>
                  {item.text}
                </span>
              </div>
              
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                className="text-gray-300 hover:text-red-500 p-2 text-xs transition-colors"
              >
                <FaTrashAlt />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {items.length === 0 && (
        <div className="mt-10 text-center opacity-50">
          <FaCheckCircle className="mx-auto text-4xl text-gray-300 mb-2" />
          <p className="text-xs font-bold text-gray-400">All packed! Ready to go.</p>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

export default Packing;