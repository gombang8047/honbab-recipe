'use client';

import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Timer } from 'lucide-react';
import { soundService, TimerSoundType } from '@/services/soundService';
import { settingsService } from '@/services/settingsService';

interface CookingTimerProps {
  seconds: number;
  stepOrder: number;
}

export const CookingTimer: React.FC<CookingTimerProps> = ({ seconds, stepOrder }) => {
  if (!seconds || seconds <= 0) {
    return null;
  }

  const [timeLeft, setTimeLeft] = useState(seconds);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          // 매초 초침 사운드 (설정에 켜져 있을 때)
          soundService.playTick();
          return prev - 1;
        });
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    
    // 현재 설정된 알람음 가져오기
    let soundType: TimerSoundType = 'ovenBell';
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('honbab_timer_sound') as TimerSoundType;
      if (saved) soundType = saved;
    }

    // 선택된 완료음 재생
    soundService.playSound(soundType);

    // 브라우저 백그라운드 푸시 알림
    const appSettings = settingsService.getSettings();
    if (appSettings.notifications.timerBackgroundAlert) {
      settingsService.sendNotification(`🍳 [${stepOrder}단계] 조리 타이머 완료!`, {
        body: '조리 시간이 완료되었습니다. 다음 조리 단계를 확인하세요!',
      });
    }
  };

  const toggleTimer = () => {
    soundService.playButtonClick();
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    soundService.playButtonClick();
    setIsRunning(false);
    setTimeLeft(seconds);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2.5 bg-slate-900/90 border border-slate-700/80 px-3.5 py-1.5 rounded-full text-xs text-orange-400 font-mono shadow-inner">
      <Timer size={14} className={isRunning ? 'animate-spin text-orange-400' : 'text-slate-400'} />
      <span className="font-bold text-sm">{formatTime(timeLeft)}</span>

      <button
        onClick={toggleTimer}
        className="p-1 rounded-full bg-orange-500 hover:bg-orange-600 text-white transition-colors"
        title={isRunning ? '일시 정지' : '타이머 시작'}
      >
        {isRunning ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}
      </button>

      <button
        onClick={resetTimer}
        className="p-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        title="초기화"
      >
        <RotateCcw size={12} />
      </button>
    </div>
  );
};
