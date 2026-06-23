import React, { useState, useEffect } from "react";
import { db } from "../../firebase/config";
import { getAuth, onAuthStateChanged } from "firebase/auth"; 
import { collection, doc, setDoc, addDoc, onSnapshot, query, orderBy, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { FaPlus, FaUsers, FaShareAlt, FaBell, FaCheckSquare, FaRegSquare, FaTrash, FaArrowLeft, FaSuitcase } from "react-icons/fa";
import BottomNav from "../../components/BottomNav";
import { countries } from 'country-data';

export default function SplitExpense() {
  const [userName, setUserName] = useState("Loading...");

  // 🗂️ Dashboard & Active Trip
  const [savedTrips, setSavedTrips] = useState(JSON.parse(localStorage.getItem("splitSavedTrips") || "[]"));
  const [groupId, setGroupId] = useState(""); 
  const [inputGroupId, setInputGroupId] = useState(""); 
  const [tripDetails, setTripDetails] = useState(null); 
  const [expenses, setExpenses] = useState([]);
  
  // 📝 New Trip Creation States
  const [tripName, setTripName] = useState("");
  const [members, setMembers] = useState([]);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberPhone, setNewMemberPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91");

  // 💰 Add Expense States
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(""); 
  const [splitAmong, setSplitAmong] = useState([]); 
  const [notification, setNotification] = useState(""); 
  const countryCodes = [
  { name: "India", code: "+91" },
  { name: "USA", code: "+1" },
  { name: "UK", code: "+44" },
  { name: "UAE", code: "+971" },
  { name: "Nepal", code: "+977" },
  { name: "Australia", code: "+61" }
];

  // 🔍 Join Trip State
  const [pendingJoinTrip, setPendingJoinTrip] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const fetchedName = user.displayName || user.email.split('@')[0];
        setUserName(fetchedName);
      } else {
        setUserName(localStorage.getItem("splitUserName") || "User");
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem("splitSavedTrips", JSON.stringify(savedTrips));
  }, [savedTrips]);

  const handleAddMember = () => {
    if (newMemberName.trim()) {
      let finalName = newMemberName.trim();
      if (newMemberPhone.trim()) finalName = `${finalName} (${countryCode} ${newMemberPhone.trim()})`;

      if (finalName.toLowerCase() === userName.toLowerCase()) return alert("Aap toh automatically add ho jaoge!");
      
      if (!members.includes(finalName)) {
        setMembers([...members, finalName]);
        setNewMemberName(""); setNewMemberPhone("");
      } else {
        alert("Number already added!");
      }
    }
  };

  const handleCreateGroup = async () => {
    if (!tripName) return alert("Fill trip name!");
    
    const finalMembers = [userName, ...members]; 
    const code = "TRIP-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    
    await setDoc(doc(db, "trips", code), { 
      name: tripName, 
      members: finalMembers,
      createdAt: new Date() 
    });

    setSavedTrips([{ id: code, name: tripName }, ...savedTrips]);
    setGroupId(code); 
    setTripName(""); setMembers([]);
  };

  // 🔗 JOIN GROUP: Step 1 (Fetch Trip & Show Popup)
  const handleJoinGroup = async () => {
    const code = inputGroupId.trim().toUpperCase();
    if (!code) return alert("Enter Code!");
    
    const docSnap = await getDoc(doc(db, "trips", code));
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Popup show karne ke liye data save karo
      setPendingJoinTrip({ id: code, ...data });
    } else {
      alert("Enter a valid trip code!");
    }
  };

  // 🔗 JOIN GROUP: Step 2 (Confirm Identity)
  const confirmJoin = async (selectedName) => {
    setUserName(selectedName);
    localStorage.setItem("splitUserName", selectedName); // Update local identity

    const code = pendingJoinTrip.id;
    
    // Agar user ne naya naam dala hai jo list mein nahi tha
    if (!pendingJoinTrip.members.includes(selectedName)) {
      await updateDoc(doc(db, "trips", code), { members: arrayUnion(selectedName) });
    }

    if (!savedTrips.find(t => t.id === code)) {
      setSavedTrips([{ id: code, name: pendingJoinTrip.name }, ...savedTrips]);
    }
    
    setGroupId(code);
    setInputGroupId("");
    setPendingJoinTrip(null); // Popup band karo
  };

  useEffect(() => {
    if (!groupId) return;
    const tripUnsub = onSnapshot(doc(db, "trips", groupId), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setTripDetails(data);
        setSplitAmong(data.members || []);
        if(!paidBy) setPaidBy(userName); 
      }
    });

    // ✅ FIX: Notification trigger logic yahan theek kiya gaya hai
    let isFirstLoad = true;

    const q = query(collection(db, "trips", groupId, "expenses"), orderBy("createdAt", "desc"));
    const expUnsub = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" && !isFirstLoad) {
          const docData = change.doc.data();
          setNotification(`🔔 ${docData.paidBy} added ₹${docData.amount} for ${docData.description}!`);
          setTimeout(() => setNotification(""), 5000); 
        }
      });
      setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      isFirstLoad = false; // First load ke baad isko false kar diya
    });

    return () => { tripUnsub(); expUnsub(); };
  }, [groupId, userName]);

  const toggleSplitMember = (memberName) => {
    if (splitAmong.includes(memberName)) {
      setSplitAmong(splitAmong.filter(m => m !== memberName));
    } else {
      setSplitAmong([...splitAmong, memberName]);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!description || !amount || !paidBy) return alert("Sab fields bharo!");
    try {
      await addDoc(collection(db, "trips", groupId, "expenses"), {
        description, amount: parseFloat(amount), paidBy, splitAmong, createdAt: new Date() 
      });
      setDescription(""); setAmount("");
    } catch (err) {
      alert("Error: Data not saved!");
    }
  };

  return (
    <div className="h-screen w-full bg-slate-900/45 text-white flex flex-col font-sans overflow-hidden">
      
      {/* 👤 Identity Selection Popup (Jab Join karte hain) */}
      {pendingJoinTrip && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-5">
          <div className="bg-slate-800/40 backdrop-blur-md p-6 rounded-2xl w-full border border-slate-700 shadow-2xl">
            <h2 className="text-white font-bold mb-4 text-sm">Who You Are?</h2>
            
            <div className="grid grid-cols-2 gap-2 mb-4">
              {pendingJoinTrip.members.map(m => (
                <button key={m} onClick={() => confirmJoin(m)} className="bg-indigo-600 p-3 rounded-lg text-xs font-bold hover:bg-indigo-500 transition-all">
                  {m}
                </button>
              ))}
            </div>

            <div className="relative flex items-center py-2 mb-2">
              <div className="h-px bg-slate-700/35 backdrop-blur-md w-full"></div>
              <span className="text-[10px] text-slate-500 bg-slate-800/40 backdrop-blur-md px-3 absolute left-1/2 -translate-x-1/2">Or Add New User</span>
            </div>

            <div className="flex gap-2">
              <input 
                type="text" placeholder="Your Name" id="newJoinName"
                className="w-full bg-slate-900/45 backdrop-blur-md border border-slate-700 rounded-xl px-3 py-2.5 text-xs"
              />
              <button onClick={() => {
                const val = document.getElementById("newJoinName").value.trim();
                if(val) confirmJoin(val);
              }} className="bg-emerald-600 px-4 rounded-xl text-xs font-bold">Join</button>
            </div>

            <button onClick={() => setPendingJoinTrip(null)} className="w-full mt-4 py-2 text-xs text-slate-400">Cancel</button>
          </div>
        </div>
      )}

      {/* 🔔 Notification UI Popup */}
      {notification && (
        <div className="fixed top-5 left-5 right-5 z-50 bg-indigo-600 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
          <FaBell className="text-amber-400 shrink-0" />
          <p className="text-xs font-bold">{notification}</p>
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-800/40 backdrop-blur-md p-6 rounded-b-3xl border-b border-slate-700 shadow-xl relative">
        {groupId && (
          <button onClick={() => setGroupId("")} className="absolute top-6 left-5 text-indigo-400 text-lg">
            <FaArrowLeft />
          </button>
        )}
        <h1 className="text-2xl font-black text-indigo-400 text-center">
          {tripDetails && groupId ? tripDetails.name : "Split Expenses"}
        </h1>
        {groupId && (
          <div className="text-center mt-2">
            <span className="bg-slate-900/45 backdrop-blur-md px-4 py-1.5 rounded-full border border-slate-700 text-xs font-mono inline-flex gap-2 text-amber-400">
              <FaShareAlt className="text-indigo-400" /> {groupId}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-28">
        
        {/* DASHBOARD & SETUP TRIP */}
        {!groupId ? (
          <div className="space-y-6">
            
            {/* 📁 Saved Trips */}
            {savedTrips.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-1">📂 My Trips</h3>
                {savedTrips.map(trip => (
                  <div key={trip.id} onClick={() => setGroupId(trip.id)} className="bg-slate-800/40 backdrop-blur-md p-4 rounded-2xl border border-slate-700 flex justify-between items-center cursor-pointer hover:border-indigo-500 transition-colors">
                    <span className="font-bold text-sm flex items-center gap-3"><FaSuitcase className="text-indigo-400 text-lg"/> {trip.name}</span>
                    <button onClick={(e) => { e.stopPropagation(); setSavedTrips(savedTrips.filter(t => t.id !== trip.id)); }} className="text-rose-500 p-2"><FaTrash /></button>
                  </div>
                ))}
              </div>
            )}

            {/* 🆕 Create New Trip */}
            <div className="bg-slate-800/40 backdrop-blur-md p-5 rounded-2xl border border-slate-700 space-y-4">
              <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2"><FaUsers /> Start New Trip</h3>
              <input type="text" placeholder="Trip Name (e.g. Goa Trip)" value={tripName} onChange={(e) => setTripName(e.target.value)} className="w-full bg-slate-900/45 backdrop-blur-md border border-slate-700 rounded-xl px-3 py-2.5 text-xs" />
              
              <div className="space-y-2">
                
                <div className="flex flex-col gap-1">
                  <input type="text" placeholder="Friend Name *" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} className="w-full bg-slate-900/45 backdrop-blur-md border border-slate-700 rounded-xl px-3 py-2.5 text-xs" />
                  <div className="flex gap-2">
                    <select 
  value={countryCode} 
  onChange={(e) => setCountryCode(e.target.value)} 
  className="bg-slate-900 border border-slate-700 rounded-xl px-2 py-2.5 text-xs text-slate-300 w-1/3"
>
  {countryCodes.map(c => (
    <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
  ))}
</select>
                    <input type="number" placeholder="Mobile (Optional)" value={newMemberPhone} onChange={(e) => setNewMemberPhone(e.target.value)} className="w-full bg-slate-900/45 backdrop-blur-md border border-slate-700 rounded-xl px-3 py-2.5 text-xs" />
                  </div>
                  <button onClick={handleAddMember} type="button" className="w-full bg-indigo-600/20 text-indigo-400 py-2.5 rounded-xl text-xs font-bold border border-indigo-500/50">+ Add Friend</button>
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="bg-indigo-600 text-[10px] px-3 py-1 rounded-full font-bold">{userName} (YOU)</span>
                  {members.map((m, i) => <span key={i} className="bg-slate-700/35 backdrop-blur-md text-[10px] px-3 py-1 rounded-full">{m}</span>)}
                </div>
              </div>

               <button 
                 onClick={(e) => { 
                   if(navigator.vibrate) navigator.vibrate([30, 50, 30]); 
                   handleCreateGroup(e); 
                 }} 
                 className="w-full bg-indigo-600 py-3 rounded-xl text-xs font-bold mt-2 shadow-lg shadow-indigo-600/30"
               >
                 Start Trip
               </button>
               
              <div className="relative flex items-center py-2">
                <div className="h-px bg-slate-700/35 backdrop-blur-md w-full"></div>
                <span className="text-[10px] text-slate-500 bg-slate-800/40 backdrop-blur-md px-3 absolute left-1/2 -translate-x-1/2">OR</span>
              </div>
              
              <div className="flex gap-2">
                <input type="text" placeholder="Paste Trip Code" value={inputGroupId} onChange={(e) => setInputGroupId(e.target.value)} className="w-full bg-slate-900/45 backdrop-blur-md border border-slate-700 rounded-xl px-3 py-2.5 text-xs uppercase" />
                <button onClick={handleJoinGroup} className="bg-emerald-600 px-5 rounded-xl text-xs font-bold">Join</button>
              </div>
            </div>
          </div>
        ) : (
          
          /* ACTIVE TRIP DETAILS */
          <>
            <form onSubmit={handleAddExpense} className="bg-slate-800/40 backdrop-blur-md p-5 rounded-2xl border border-slate-700 space-y-4">
              <h3 className="text-xs font-black uppercase text-indigo-400">Add New Expense</h3>
              
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="What (e.g. Dinner)" value={description} onChange={(e) => setDescription(e.target.value)} className="bg-slate-900/45 backdrop-blur-md border border-slate-700 rounded-xl px-3 py-2.5 text-xs w-full" />
                <input type="number" placeholder="₹ Amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-slate-900/45 backdrop-blur-md border border-slate-700 rounded-xl px-3 py-2.5 text-xs w-full" />
              </div>

              <div className="space-y-1">
                <p className="text-[10px] text-slate-400">Who Paid?</p>
                <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)} className="w-full bg-slate-900/45 backdrop-blur-md border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white">
                  {tripDetails?.members.map((m, index) => <option key={index} value={m}>{m === userName ? `${m} (Aap)` : m}</option>)}
                </select>
              </div>

              <div className="space-y-2 bg-slate-900/40 backdrop-blur-md p-3 rounded-xl border border-slate-700">
                <p className="text-[10px] text-slate-400">Split Among:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {tripDetails?.members.map((m, i) => (
                    <div key={i} onClick={() => toggleSplitMember(m)} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-[10px] transition-all ${splitAmong.includes(m) ? 'bg-indigo-600/20 text-indigo-300' : 'text-slate-400'}`}>
                      {splitAmong.includes(m) ? <FaCheckSquare className="text-indigo-500 shrink-0" /> : <FaRegSquare className="shrink-0" />}
                      <span className="truncate">{m === userName ? `${m} (Aap)` : m}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 py-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30">
                <FaPlus /> Add & Sync Expense
              </button>
            </form>

            <section className="space-y-3">
              <h3 className="text-sm font-bold text-slate-400">📊 Live Ledger ({expenses.length})</h3>
              <div className="space-y-2">
                {expenses.map((exp) => (
                  <div key={exp.id} className="bg-slate-800/40 backdrop-blur-md p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                    <div className="w-2/3">
                      <h4 className="font-bold text-xs">{exp.description}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate"><span className="text-indigo-400">{exp.paidBy === userName ? "Aapne" : exp.paidBy}</span> paid ₹{exp.amount}</p>
                      <p className="text-[9px] text-slate-500 mt-1 truncate">Split: {exp.splitAmong.join(", ")}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-emerald-400">₹{(exp.amount / exp.splitAmong.length).toFixed(2)} /person</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="bg-slate-800/40 backdrop-blur-md p-4 rounded-2xl border border-indigo-500/30 mt-6 shadow-xl shadow-indigo-900/10">
              <h3 className="text-sm font-bold text-indigo-400 mb-3">💰 Settlement Summary</h3>
              {tripDetails?.members.map(member => {
                const totalSpent = expenses.filter(e => e.paidBy === member).reduce((acc, curr) => acc + curr.amount, 0);
                const totalOwed = expenses.reduce((acc, curr) => curr.splitAmong.includes(member) ? acc + (curr.amount / curr.splitAmong.length) : acc, 0);
                const balance = totalSpent - totalOwed;
                
                return (
                  <div key={member} className="flex justify-between items-center text-[11px] sm:text-xs py-2.5 border-b border-slate-700/50 last:border-0">
                    <span className={`w-1/2 truncate pr-2 ${member === userName ? "font-bold text-indigo-300" : "text-slate-300"}`}>{member === userName ? "Aap (You)" : member}</span>
                    <span className={`font-black text-right px-3 py-1 rounded-full ${balance >= 0 ? "bg-emerald-900/30 text-emerald-400" : "bg-rose-900/30 text-rose-400"}`}>
                      {balance >= 0 ? `+ ₹${balance.toFixed(2)}` : `- ₹${Math.abs(balance).toFixed(2)}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}