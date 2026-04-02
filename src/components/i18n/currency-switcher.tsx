'use client';
import { useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';
import api from '@/lib/api';

export function CurrencySwitcher() {
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [current, setCurrent] = useState('USD');

  useEffect(() => {
    api.get('/i18n/currencies').then(res => setCurrencies(res.data?.data || [])).catch(() => {});
    const saved = localStorage.getItem('currency');
    if (saved) setCurrent(saved);
  }, []);

  const handleChange = (code: string) => {
    setCurrent(code);
    localStorage.setItem('currency', code);
    window.location.reload();
  };

  return (
    <div className="relative group">
      <button className="flex items-center gap-1 text-sm hover:text-blue-600">
        <DollarSign size={16} />
        <span>{current}</span>
      </button>
      <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg py-1 hidden group-hover:block z-50 min-w-[140px]">
        {currencies.map(c => (
          <button key={c.code} onClick={() => handleChange(c.code)} className={`block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 ${c.code === current ? 'text-blue-600 font-medium' : ''}`}>
            {c.symbol} {c.code}
          </button>
        ))}
      </div>
    </div>
  );
}
