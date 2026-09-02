'use client';

import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Timer } from 'lucide-react';

interface CookingTimerProps {
  seconds: number;
  stepOrder: number;
}

export const CookingTimer: React.FC<CookingTimerProps> = ({ seconds, stepOrder }) => {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const toggleTimer = () => setIsRunning(!isRunning);
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(seconds);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-700/80 px-3.5 py-1.5 rounded-full text-xs text-orange-400 font-mono shadow-inner">
      <Timer size={14} className={isRunning ? 'animate-spin text-orange-400' : 'text-slate-400'} />
      <span className="font-bold text-sm">{formatTime(timeLeft)}</span>
      
      <button
        onClick={toggleTimer}
        className="p-1 rounded-full bg-orange-500 hover:bg-orange-600 text-white transition-colors"
      >
        {isRunning ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}
      </button>

      <button
        onClick={resetTimer}
        className="p-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
      >
        <RotateCcw size={12} />
      </button>
    </div>
  );
};
