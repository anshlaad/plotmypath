import { useRegisterSW } from 'virtual:pwa-register/react';

function ReloadPrompt() {
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-20 left-5 right-5 bg-indigo-600 p-4 rounded-xl text-white shadow-xl z-50">
      <span>New version available!</span>
      <button onClick={() => updateServiceWorker(true)} className="ml-4 font-bold underline">
        Refresh
      </button>
    </div>
  );
}