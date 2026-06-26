import React, { useState, useEffect } from "react";
import { FaPlus, FaTrashAlt, FaUtensils, FaHotel, FaCar, FaShoppingBag, FaWallet, FaEdit, FaCheck, FaStickyNote } from "react-icons/fa";
import BottomNav from "../../components/BottomNav";
import { motion, AnimatePresence } from "framer-motion";

function Budget() {
  const [expenses, setExpenses] = useState(() => JSON.parse(localStorage.getItem("my_trip_expenses") || "[]"));
  const [totalBudget, setTotalBudget] = useState(() => Number(localStorage.getItem("my_trip_budget") || 15000));
  
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState(totalBudget);
  
  const [category, setCategory] = useState("Food");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  
  // 🟢 Edit mode ke liye states
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    localStorage.setItem("my_trip_expenses", JSON.stringify(expenses));
    localStorage.setItem("my_trip_budget", totalBudget);
  }, [expenses, totalBudget]);

  const totalSpent = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  const remaining = totalBudget - totalSpent;
  const percentageSpent = Math.min((totalSpent / totalBudget) * 100, 100);

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;

    if (editingId) {
      // 🟢 Update existing
      setExpenses(expenses.map(exp => exp.id === editingId ? { ...exp, category, amount: Number(amount), note } : exp));
      setEditingId(null);
    } else {
      // 🟢 Add new
      setExpenses([{ id: Date.now(), category, amount: Number(amount), note, date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) }, ...expenses]);
    }
    setAmount(""); setNote("");
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setCategory(item.category);
    setAmount(item.amount);
    setNote(item.note);
  };

  const getIcon = (cat) => {
    switch(cat) {
      case 'Food': return <FaUtensils />;
      case 'Hotel': return <FaHotel />;
      case 'Travel': return <FaCar />;
      case 'Shopping': return <FaShoppingBag />;
      default: return <FaWallet />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32 font-sans">
      <div className="bg-linear-to-br from-indigo-600 to-purple-700 rounded-b-[40px] p-8 pb-16 text-white text-center shadow-2xl">
        <h1 className="text-2xl font-black">Budget Analytics</h1>
        <p className="text-indigo-100 text-xs opacity-90 uppercase tracking-widest">Financial Controller</p>
      </div>

      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mx-5 -mt-10 bg-white rounded-3xl p-6 shadow-xl border border-gray-100 z-10 relative">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-[10px] uppercase font-black text-gray-400">Total Budget</p>
            {isEditingBudget ? (
              <input type="number" value={tempBudget} onChange={(e) => setTempBudget(e.target.value)} className="w-20 text-lg font-black text-indigo-600 bg-indigo-50 p-1 rounded-lg outline-none" />
            ) : <h2 className="text-lg font-black text-gray-800">₹{totalBudget.toLocaleString()}</h2>}
          </div>
          <button onClick={() => isEditingBudget ? (setTotalBudget(Number(tempBudget)), setIsEditingBudget(false)) : setIsEditingBudget(true)} className="p-2 bg-gray-50 rounded-xl text-gray-500">
            {isEditingBudget ? <FaCheck className="text-emerald-500" /> : <FaEdit />}
          </button>
        </div>
        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
          <div className={`h-full ${percentageSpent > 85 ? "bg-red-500" : "bg-indigo-600"}`} style={{ width: `${percentageSpent}%` }} />
        </div>
      </motion.div>

      <div className="mx-5 mt-6 bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
        <form onSubmit={handleAddExpense} className="space-y-3">
          <div className="flex gap-2">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-gray-50 rounded-2xl px-2 py-3 text-[10px] font-black w-1/3">
              <option value="Food">🍔 Food</option><option value="Hotel">🏨 Hotel</option>
              <option value="Travel">🚗 Travel</option><option value="Shopping">🛍️ Shop</option>
            </select>
            <input type="number" placeholder="₹ Amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="flex-1 bg-gray-50 rounded-2xl px-4 py-3 text-xs font-bold" />
          </div>
          <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-3 py-2">
             <FaStickyNote className="text-gray-400 text-xs"/><input type="text" placeholder="Note..." value={note} onChange={(e) => setNote(e.target.value)} className="w-full bg-transparent text-[10px] font-bold" />
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-2xl text-xs font-black">{editingId ? "Update Expense" : "Add Expense"}</button>
        </form>
      </div>

      <div className="mx-5 mt-6 space-y-3 pb-10">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Logs</h3>
        <AnimatePresence>
          {expenses.map((item) => (
            <motion.div key={item.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-4">
                <div className="bg-indigo-50 text-indigo-600 p-3 rounded-2xl text-sm">{getIcon(item.category)}</div>
                <div>
                  <h4 className="font-black text-gray-800 text-xs">{item.category}</h4>
                  <p className="text-[9px] text-gray-400 font-bold truncate">{item.note}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-black text-gray-800 text-xs">₹{item.amount}</span>
                <button onClick={() => startEdit(item)} className="text-indigo-500 p-1"><FaEdit size={12} /></button>
                <button onClick={() => setExpenses(expenses.filter(e => e.id !== item.id))} className="text-red-400 p-1"><FaTrashAlt size={12} /></button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="text-center pb-10">
        <p className="text-[10px] font-bold text-gray-400">Designed by PlotMyPath</p>
      </div>
      <BottomNav />
    </div>
  );
}

export default Budget;