import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-10 left-5 right-5 z-50 p-4 bg-indigo-600 text-white rounded-2xl shadow-2xl flex flex-col items-center">
      <p className="mb-3 text-sm font-medium">New Update Available !</p>
      <button 
        className="px-6 py-2 bg-white text-indigo-600 rounded-full font-bold shadow"
        onClick={() => updateServiceWorker(true)}
      >
        Update Karo
      </button>
    </div>
  );
}

export default ReloadPrompt;