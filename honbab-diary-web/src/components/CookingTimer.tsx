'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer, Volume2, ChevronDown, Check } from 'lucide-react';
import { soundService, TimerSoundType, TIMER_SOUND_OPTIONS } from '@/services/soundService';
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
  const [soundType, setSoundType] = useState<TimerSoundType>('ovenBell');
  const [showSoundMenu, setShowSoundMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 로컬에 저장된 선호 완료음 불러오기
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('honbab_timer_sound');
      if (saved && (saved === 'sizzle' || saved === 'ovenBell' || saved === 'beep' || saved === 'melody')) {
        setSoundType(saved as TimerSoundType);
      }
    }
  }, []);

  // 외부 클릭 시 사운드 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowSoundMenu(false);
      }
    };
    if (showSoundMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSoundMenu]);

  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // 타이머 완료 시
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
  }, [isRunning, timeLeft, soundType]);

  const handleTimerComplete = () => {
    setIsRunning(false);
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

  const handleSelectSound = (type: TimerSoundType) => {
    setSoundType(type);
    if (typeof window !== 'undefined') {
      localStorage.setItem('honbab_timer_sound', type);
    }
    // 선택 즉시 미리듣기
    soundService.playSound(type);
    setShowSoundMenu(false);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const currentOption = TIMER_SOUND_OPTIONS.find((s) => s.id === soundType) || TIMER_SOUND_OPTIONS[1];

  return (
    <div className="relative flex items-center gap-2" ref={menuRef}>
      {/* Timer Bar */}
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

        {/* Sound Selection Trigger */}
        <button
          onClick={() => setShowSoundMenu((prev) => !prev)}
          className="flex items-center gap-1 pl-1.5 border-l border-slate-700/80 text-[11px] font-sans text-slate-300 hover:text-amber-400 transition-colors"
          title="타이머 완료음 설정"
        >
          <span>{currentOption.icon}</span>
          <ChevronDown size={11} className={`text-slate-400 ${showSoundMenu ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Sound Options Dropdown Menu */}
      {showSoundMenu && (
        <div className="absolute right-0 top-full mt-2 w-56 p-2 rounded-xl bg-slate-900/95 border border-slate-700 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1 mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            타이머 완료음 선택
          </div>
          <div className="space-y-1">
            {TIMER_SOUND_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => handleSelectSound(option.id)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all text-left ${
                  soundType === option.id
                    ? 'bg-orange-500/20 text-orange-400 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{option.icon}</span>
                  <span>{option.name}</span>
                </div>
                {soundType === option.id && <Check size={13} className="text-orange-400" />}
              </button>
            ))}
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-800 px-2 text-[10px] text-slate-400 text-center">
            클릭 시 소리를 미리 들려드립니다
          </div>
        </div>
      )}
    </div>
  );
};
