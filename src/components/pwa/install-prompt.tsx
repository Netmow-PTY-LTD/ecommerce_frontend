'use client';
import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-6 bg-white rounded-xl shadow-xl border p-4 z-40 max-w-xs">
      <button onClick={() => setShow(false)} className="absolute top-2 right-2"><X size={14} /></button>
      <div className="flex items-center gap-3">
        <Download size={24} className="text-blue-600" />
        <div>
          <p className="font-medium text-sm">Install App</p>
          <p className="text-xs text-gray-500">Add to home screen for faster access</p>
        </div>
      </div>
      <button onClick={handleInstall} className="mt-3 w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700">Install</button>
    </div>
  );
}
