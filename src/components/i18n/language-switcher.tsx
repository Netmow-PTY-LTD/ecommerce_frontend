'use client';
import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import api from '@/lib/api';

export function LanguageSwitcher() {
  const [locales, setLocales] = useState<any[]>([]);
  const [current, setCurrent] = useState('en');

  useEffect(() => {
    api.get('/i18n/locales').then(res => setLocales(res.data?.data || [])).catch(() => {});
  }, []);

  const handleChange = (code: string) => {
    setCurrent(code);
    localStorage.setItem('locale', code);
    window.location.reload();
  };

  return (
    <div className="relative group">
      <button className="flex items-center gap-1 text-sm hover:text-blue-600">
        <Globe size={16} />
        <span className="uppercase">{current}</span>
      </button>
      <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg py-1 hidden group-hover:block z-50 min-w-[120px]">
        {locales.map(l => (
          <button key={l.code} onClick={() => handleChange(l.code)} className={`block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 ${l.code === current ? 'text-blue-600 font-medium' : ''}`}>
            {l.name}
          </button>
        ))}
      </div>
    </div>
  );
}
