import AppRoutes from "./routes/AppRoutes.jsx";

function App() {
  return (
    // ✨ OUTER WRAPPER (PC par background black dikhane ke liye)
    <div className="min-h-screen w-full bg-black flex justify-center">
      
      {/* 📱 MOBILE CONTAINER (Ye har page ko phone jaise shape mein fix kar dega) */}
      <div className="w-full max-w-md bg-slate-900 min-h-screen relative shadow-[0_0_50px_rgba(0,0,0,0.5)] border-x border-slate-800 overflow-x-hidden">
        
        {/* Aapke saare routes bina kisi change ke yahan render ho jayenge */}
        <AppRoutes />
        
      </div>
      
    </div>
  );
}

export default App;