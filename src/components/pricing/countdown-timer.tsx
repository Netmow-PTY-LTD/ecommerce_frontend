'use client';
import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  endsAt: string;
  onComplete?: () => void;
}

export function CountdownTimer({ endsAt, onComplete }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) {
        clearInterval(timer);
        onComplete?.();
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000)
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [endsAt, onComplete]);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="flex items-center gap-1 text-center">
      {timeLeft.days > 0 && <span className="bg-red-600 text-white px-2 py-1 rounded text-sm font-bold">{timeLeft.days}d</span>}
      <span className="bg-red-600 text-white px-2 py-1 rounded text-sm font-bold">{pad(timeLeft.hours)}h</span>
      <span className="bg-red-600 text-white px-2 py-1 rounded text-sm font-bold">{pad(timeLeft.minutes)}m</span>
      <span className="bg-red-600 text-white px-2 py-1 rounded text-sm font-bold">{pad(timeLeft.seconds)}s</span>
    </div>
  );
}
