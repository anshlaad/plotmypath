import { useState } from "react";
import { FaWallet, FaPlus, FaTrashAlt, FaUtensils, FaHotel, FaCar, FaShoppingBag } from "react-icons/fa";
import BottomNav from "../../components/BottomNav";

function Budget() {
  const [expenses, setExpenses] = useState([
    { id: 1, category: "Hotel", amount: 4500, icon: <FaHotel /> },
    { id: 2, category: "Food", amount: 1800, icon: <FaUtensils /> },
    { id: 3, category: "Travel", amount: 2500, icon: <FaCar /> },
  ]);

  const [category, setCategory] = useState("Food");
  const [amount, setAmount] = useState("");
  const totalBudget = 15000;

  const totalSpent = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  const remaining = totalBudget - totalSpent;
  const percentageSpent = Math.min((totalSpent / totalBudget) * 100, 100);

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;

    const iconMap = {
      Food: <FaUtensils />,
      Hotel: <FaHotel />,
      Travel: <FaCar />,
      Shopping: <FaShoppingBag />,
    };

    const newExpense = {
      id: Date.now(),
      category,
      amount: Number(amount),
      icon: iconMap[category],
    };

    setExpenses([...expenses, newExpense]);
    setAmount("");
  };

  const handleDelete = (id) => {
    setExpenses(expenses.filter((item) => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* Premium Compact Header */}
      <div className="bg-linear-to-r from-blue-600 to-indigo-600 rounded-b-[35px] p-5 pt-8 pb-10 text-white text-center shadow-md">
        <h1 className="text-xl font-bold">Expense Analytics</h1>
        <p className="opacity-75 text-xs mt-1">Keep your vacation pocket-friendly</p>
      </div>

      {/* Analytics Card */}
      <div className="mx-auto -mt-6 w-[88%] max-w-sm bg-white rounded-2xl p-4 shadow-lg border border-gray-100/50 relative z-10">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400">Total Budget</p>
            <h2 className="text-lg font-extrabold text-gray-800">₹{totalBudget.toLocaleString()}</h2>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-gray-400">Remaining</p>
            <h2 className={`text-lg font-extrabold ${remaining < 2000 ? "text-red-500" : "text-emerald-500"}`}>
              ₹{remaining.toLocaleString()}
            </h2>
          </div>
        </div>

        {/* Custom Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-1">
            <span>Spent: ₹{totalSpent.toLocaleString()}</span>
            <span>{Math.round(percentageSpent)}%</span>
          </div>
          <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${percentageSpent > 85 ? "bg-red-500" : "bg-indigo-600"}`}
              style={{ width: `${percentageSpent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Add Expense Mini Form */}
      <div className="mx-auto mt-4 w-[88%] max-w-sm bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="text-xs font-bold text-gray-800 mb-3">Add New Expense</h3>
        <form onSubmit={handleAddExpense} className="flex gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-slate-50 border border-gray-100 rounded-xl px-2 py-2 text-xs font-medium outline-none text-gray-700"
          >
            <option value="Food">🍔 Food</option>
            <option value="Hotel">🏨 Hotel</option>
            <option value="Travel">🚗 Travel</option>
            <option value="Shopping">🛍️ Shop</option>
          </select>
          
          <input
            type="number"
            placeholder="Amount (₹)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 bg-slate-50 border border-gray-100 rounded-xl px-3 py-2 text-xs outline-none text-gray-800 font-medium"
          />

          <button
            type="submit"
            className="bg-indigo-600 text-white p-2.5 rounded-xl text-xs hover:bg-indigo-700 active:scale-95 transition"
          >
            <FaPlus />
          </button>
        </form>
      </div>

      {/* Expense List Logging */}
      <div className="mx-auto mt-4 w-[88%] max-w-sm space-y-2">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">Logs</h3>
        
        {expenses.length === 0 ? (
          <p className="text-center text-xs text-gray-400 py-4">No expenses recorded yet.</p>
        ) : (
          expenses.map((item) => (
            <div key={item.id} className="bg-white border border-gray-100 rounded-xl p-3 flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl text-xs">
                  {item.icon}
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-xs">{item.category}</h4>
                  <p className="text-[9px] text-gray-400">Just now</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-extrabold text-gray-800 text-xs">₹{item.amount}</span>
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="text-gray-300 hover:text-red-500 transition text-xs p-1"
                >
                  <FaTrashAlt />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}

export default Budget;