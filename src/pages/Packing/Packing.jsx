import { useState } from "react";
import { FaCheckSquare, FaSquare, FaPlus, FaTrashAlt, FaSuitcase } from "react-icons/fa";
import BottomNav from "../../components/BottomNav";

function Packing() {
  const [items, setItems] = useState([
    { id: 1, text: "Passport & Identity Cards", packed: true },
    { id: 2, text: "Smartphone Charger & Powerbank", packed: false },
    { id: 3, text: "First Aid & Daily Medicines", packed: false },
  ]);
  const [newItem, setNewItem] = useState("");

  const handleAddItem = (e) => {
    if (e) e.preventDefault(); // Form submit refresh rokkega
    if (!newItem.trim()) return;

    // Naya item state me push karo
    setItems((prevItems) => [
      ...prevItems, 
      { id: Date.now(), text: newItem.trim(), packed: false }
    ]);
    
    setNewItem(""); // Input clear karo
  };

  const togglePack = (id) => {
    setItems(
      items.map((item) => (item.id === id ? { ...item, packed: !item.packed } : item))
    );
  };

  const handleDelete = (id) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const packedCount = items.filter((i) => i.packed).length;

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* Header Layout */}
      <div className="bg-linear-to-r from-purple-600 to-pink-600 rounded-b-[35px] p-5 pt-8 pb-10 text-white text-center shadow-md">
        <h1 className="text-xl font-bold">Baggage Checklist</h1>
        <p className="opacity-75 text-xs mt-1">Never leave your essentials behind</p>
      </div>

      {/* Completion Metric Card */}
      <div className="mx-auto -mt-6 w-[88%] max-w-sm bg-white rounded-2xl p-4 shadow-lg border border-gray-100/50 relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-purple-50 text-purple-600 p-3 rounded-xl">
            <FaSuitcase size={18} />
          </div>
          <div>
            <h3 className="font-extrabold text-gray-800 text-xs">Packing Progress</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {packedCount} of {items.length} items grouped
            </p>
          </div>
        </div>
        <span className="text-xs bg-purple-50 text-purple-700 font-extrabold px-3 py-1 rounded-full">
          {items.length > 0 ? Math.round((packedCount / items.length) * 100) : 0}%
        </span>
      </div>

      {/* Input Addition Inline Box */}
      <div className="mx-auto mt-4 w-[88%] max-w-sm bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
        <form onSubmit={handleAddItem} className="flex gap-2">
          <input
            type="text"
            placeholder="Add baggage item (e.g. Shoes)..."
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            className="flex-1 bg-slate-50 border border-gray-100 rounded-xl px-3 py-2 text-xs outline-none text-gray-800 font-medium"
          />
          <button
            type="submit"
            className="bg-purple-600 text-white px-3 rounded-xl text-xs hover:bg-purple-700 active:scale-95 transition"
          >
            <FaPlus />
          </button>
        </form>
      </div>

      {/* Active Items Roll */}
      <div className="mx-auto mt-4 w-[88%] max-w-sm space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => togglePack(item.id)}
            className={`border rounded-xl p-3 flex justify-between items-center cursor-pointer transition select-none ${
              item.packed ? "bg-slate-50/80 border-gray-100 opacity-60" : "bg-white border-gray-100 shadow-sm"
            }`}
          >
            <div className="flex items-center gap-3 flex-1">
              <button className={`text-base ${item.packed ? "text-purple-600" : "text-gray-300"}`}>
                {item.packed ? <FaCheckSquare /> : <FaSquare />}
              </button>
              <span className={`text-xs font-medium ${item.packed ? "line-through text-gray-400" : "text-gray-700"}`}>
                {item.text}
              </span>
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation(); // Stops event from triggering checkbox check toggle
                handleDelete(item.id);
              }}
              className="text-gray-300 hover:text-red-500 p-1 text-xs transition"
            >
              <FaTrashAlt />
            </button>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}

export default Packing;