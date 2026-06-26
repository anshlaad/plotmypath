import React, { useState, useEffect } from "react";
import { db } from "../../firebase/config"; 
import { collection, getDocs, doc, deleteDoc, addDoc } from "firebase/firestore";
import BottomNav from "../../components/BottomNav";

// --- CUSTOM ICONS ---
const WhatsAppIcon = () => (<svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>);
const MailIcon = () => (<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>);
const TrashIcon = () => (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>);
const LockIcon = () => (<svg className="w-12 h-12 text-indigo-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>);

export default function Leads() {
  // ✅ AUTHENTICATION STATES
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem("admin_auth") === "true";
  });
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // IN-APP NOTI STATES
  const [notiMessage, setNotiMessage] = useState("");
  const [isSendingNoti, setIsSendingNoti] = useState(false);

  // 🚀 PUSH NOTI STATES (NEW)
  const [pushTitle, setPushTitle] = useState("");
  const [pushBody, setPushBody] = useState("");
  const [isSendingPush, setIsSendingPush] = useState(false);
  
  // ✅ ADMIN LOGIN HANDLER
  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === "Admin@123") {
      setIsAuthenticated(true);
      sessionStorage.setItem("admin_auth", "true");
      setLoginError("");
    } else {
      setLoginError("Incorrect Password. Access Denied.");
      setPasswordInput("");
    }
  };

  const fetchLeads = async () => {
    if (!isAuthenticated) return; 
    try {
      const querySnapshot = await getDocs(collection(db, "leads"));
      const leadsData = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
          const dateA = new Date(a.createdAt || a.date || 0);
          const dateB = new Date(b.createdAt || b.date || 0);
          return dateB - dateA; 
        });
      setLeads(leadsData);
    } catch (err) {
      console.error("Firestore Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchLeads();
    }
  }, [isAuthenticated]);

  const handleDelete = async (id) => {
    if(window.confirm("Delete this lead from the CRM?")) {
        await deleteDoc(doc(db, "leads", id));
        fetchLeads();
    }
  };

  // ✅ IN-APP NOTIFICATION HANDLER (PURANA WALA)
  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!notiMessage.trim()) return;

    setIsSendingNoti(true);
    try {
      await addDoc(collection(db, "system_notifications"), {
        message: notiMessage,
        type: "info", 
        active: true,
        createdAt: new Date().toISOString()
      });
      alert("✅ System Update Broadcasted Successfully!");
      setNotiMessage("");
    } catch (error) {
      alert("❌ Failed to broadcast.");
    } finally {
      setIsSendingNoti(false);
    }
  };

  // 🚀 PUSH NOTIFICATION HANDLER (NAYA WALA)
  const handleSendPushNotification = async (e) => {
    e.preventDefault();
    if (!pushTitle.trim() || !pushBody.trim()) return;

    setIsSendingPush(true);
    try {
      const response = await fetch("https://plotmypath-backend.onrender.com/api/send-bulk-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: pushTitle, body: pushBody })
      });

      const result = await response.json();
      
      if (response.ok) {
        alert("✅ Push Notification Sent: " + result.message); 
        setPushTitle('');
        setPushBody('');
      } else {
        alert("❌ Error: " + result.error);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Backend se connect nahi ho paya!");
    } finally {
      setIsSendingPush(false);
    }
  };

  const handleEmailClick = (email) => {
    if (!email || email === "No Email") {
      alert("No email address provided by this lead.");
      return;
    }
    navigator.clipboard.writeText(email);
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${email}`, "_blank");
  };

  // CRM Stats
  const totalLeads = leads.length;
  const todayLeads = leads.filter(l => {
    if (!l.createdAt) return false;
    return new Date(l.createdAt).toDateString() === new Date().toDateString();
  }).length;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 w-full max-w-sm text-center">
          <LockIcon />
          <h2 className="text-xl font-black text-slate-800 tracking-tight mb-2">Admin Access</h2>
          <p className="text-xs text-slate-500 font-medium mb-6">Enter master password to access CRM</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input 
                type="password" 
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter Password..."
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-center font-bold text-sm outline-none focus:border-indigo-500 transition-colors"
                autoFocus
              />
            </div>
            {loginError && <p className="text-[10px] text-red-500 font-bold">{loginError}</p>}
            
            <button 
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3.5 rounded-2xl text-xs transition-all active:scale-95 shadow-md"
            >
              Unlock Dashboard
            </button>
          </form>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 pb-36 font-sans">
      
      {/* HEADER WITH LOGOUT OPTION */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">CRM Dashboard</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Manage leads, itineraries, and broadcasts.</p>
        </div>
        <button 
          onClick={() => {
            sessionStorage.removeItem("admin_auth");
            setIsAuthenticated(false);
          }}
          className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-red-100 hover:bg-red-100 transition-colors"
        >
          Lock
        </button>
      </div>

      {/* CRM STATS WIDGETS */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 border-b-4 border-b-indigo-500 relative overflow-hidden">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Total Leads</p>
          <p className="text-3xl font-black text-slate-800 mt-1">{totalLeads}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 border-b-4 border-b-emerald-500 relative overflow-hidden">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">New Today</p>
          <p className="text-3xl font-black text-slate-800 mt-1">{todayLeads}</p>
        </div>
      </div>
      
      {/* 1️⃣ ADMIN NOTIFICATION BOX (IN-APP) */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 mb-4 w-full text-left relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
           <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"></path></svg>
        </div>
        <h2 className="text-xs font-black text-indigo-600 mb-3 uppercase tracking-wider flex items-center gap-2">
          <span>📢</span> In-App Update
        </h2>
        <form onSubmit={handleSendNotification} className="flex flex-col gap-3 relative z-10">
          <textarea 
            value={notiMessage}
            onChange={(e) => setNotiMessage(e.target.value)}
            placeholder="Push a live alert inside the app..."
            className="w-full p-3 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:border-indigo-500 bg-slate-50 resize-none transition-colors"
            rows="2"
            required
          />
          <button 
            type="submit" 
            disabled={isSendingNoti}
            className={`px-4 py-2.5 text-xs font-black text-white rounded-xl transition-all w-fit shadow-md ${
              isSendingNoti ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'
            }`}
          >
            {isSendingNoti ? 'Broadcasting...' : 'Push In-App'}
          </button>
        </form>
      </div>

      {/* 2️⃣ NEW: PUSH NOTIFICATION BOX (BACKGROUND) */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 mb-6 w-full text-left relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
           <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
        </div>
        <h2 className="text-xs font-black text-rose-600 mb-3 uppercase tracking-wider flex items-center gap-2">
          <span>🔔</span> Global Push Notification
        </h2>
        <form onSubmit={handleSendPushNotification} className="flex flex-col gap-3 relative z-10">
          <input 
            type="text"
            value={pushTitle}
            onChange={(e) => setPushTitle(e.target.value)}
            placeholder="Title (e.g., New Feature Alert!)"
            className="w-full p-3 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-rose-500 bg-slate-50 transition-colors"
            required
          />
          <textarea 
            value={pushBody}
            onChange={(e) => setPushBody(e.target.value)}
            placeholder="Message jo screen par pop hoga..."
            className="w-full p-3 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:border-rose-500 bg-slate-50 resize-none transition-colors"
            rows="2"
            required
          />
          <button 
            type="submit" 
            disabled={isSendingPush}
            className={`px-4 py-2.5 text-xs font-black text-white rounded-xl transition-all w-fit shadow-md ${
              isSendingPush ? 'bg-slate-400 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700 active:scale-95'
            }`}
          >
            {isSendingPush ? 'Sending...' : 'Blast Push Notification'}
          </button>
        </form>
      </div>

      <div className="flex items-center justify-between mb-4 mt-8">
        <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <span>👥</span> Lead Pipeline
        </h2>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-20">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center p-10 bg-white rounded-3xl border border-dashed border-slate-300">
            <p className="text-slate-400 text-xs font-bold">Pipeline is empty. No leads generated yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {leads.map((lead) => (
            <div key={lead.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden transition-all hover:shadow-md">
              
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
              
              <div className="pl-2">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                        <h4 className="font-black text-sm text-slate-800 tracking-tight">{lead.name || "Guest Traveler"}</h4>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                            Captured: {lead.createdAt ? new Date(lead.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : "Unknown Time"}
                        </p>
                    </div>
                    <span className="bg-indigo-50 text-indigo-700 text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-widest border border-indigo-100">
                        {lead.status || "NEW LEAD"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex flex-col">
                          <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider">Phone</span>
                          <span className="text-[11px] font-bold text-slate-700 mt-0.5">{lead.phone || lead.phoneNumber || "No Number"}</span>
                      </div>
                      <div className="flex flex-col overflow-hidden">
                          <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider">Email</span>
                          <span className="text-[11px] font-bold text-slate-700 mt-0.5 truncate">{lead.email || "No Email"}</span>
                      </div>
                  </div>
                  
                  {(lead.source || lead.destination) && (
                    <div className="mt-3">
                      <div className="inline-flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 shadow-sm w-full">
                        <span className="text-[11px]">🗺️</span>
                        <span className="text-[10px] text-amber-900 font-black tracking-wide truncate">
                          {lead.source ? `${lead.source} ➔ ` : ""}
                          {lead.destination || "Destination Not Set"}
                          {lead.days ? ` • ${lead.days} Days` : ""}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                    <a 
                      href={`https://wa.me/${(lead.phone || lead.phoneNumber || '').replace(/\D/g, "")}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="flex-1 flex justify-center items-center gap-1.5 bg-emerald-50 text-emerald-700 p-2.5 rounded-xl font-black text-[10px] hover:bg-emerald-100 transition-colors uppercase tracking-wide border border-emerald-100"
                    >
                      <WhatsAppIcon /> WhatsApp
                    </a>
                    
                    <button 
                      onClick={() => handleEmailClick(lead.email)}
                      className="flex-1 flex justify-center items-center gap-1.5 bg-blue-50 text-blue-700 p-2.5 rounded-xl font-black text-[10px] hover:bg-blue-100 transition-colors uppercase tracking-wide border border-blue-100 cursor-pointer"
                    >
                      <MailIcon /> Email
                    </button>
                    
                    <button 
                      onClick={() => handleDelete(lead.id)} 
                      className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors border border-red-100 cursor-pointer"
                      title="Delete Lead"
                    >
                      <TrashIcon />
                    </button>
                  </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <BottomNav />
    </div>
  );
}