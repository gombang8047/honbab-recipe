'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  Volume2,
  VolumeX,
  Sliders,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Smartphone,
  Clock,
  Flame,
  HelpCircle,
} from 'lucide-react';
import { settingsService, AppSettings } from '@/services/settingsService';
import { soundService } from '@/services/soundService';

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(settingsService.getSettings());
  const [pushStatus, setPushStatus] = useState<string>('default');
  const [savedToast, setSavedToast] = useState<boolean>(false);

  useEffect(() => {
    setSettings(settingsService.getSettings());
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushStatus(Notification.permission);
    }
  }, []);

  const triggerToast = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const updateSound = (partial: Partial<AppSettings['sound']>) => {
    soundService.playButtonClick();
    const updated = settingsService.updateSettings({
      sound: { ...settings.sound, ...partial },
    });
    setSettings(updated);
    triggerToast();
  };

  const updateNotifications = (partial: Partial<AppSettings['notifications']>) => {
    soundService.playButtonClick();
    const updated = settingsService.updateSettings({
      notifications: { ...settings.notifications, ...partial },
    });
    setSettings(updated);
    triggerToast();
  };

  const handleRequestPush = async () => {
    soundService.playButtonClick();
    const granted = await settingsService.requestPushPermission();
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushStatus(Notification.permission);
    }
    if (granted) {
      settingsService.sendNotification('🍳 혼밥레시피 알림이 활성화되었습니다!', {
        body: '조리 타이머 완료 및 맛있는 1인분 레시피 소식을 전해드릴게요.',
      });
      updateNotifications({ browserPushEnabled: true });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            onClick={() => soundService.playButtonClick()}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700/60"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sliders className="text-orange-400" size={24} />
              앱 환경 설정
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              알림 수신 및 사운드 효과음을 내 취향에 맞게 설정하세요.
            </p>
          </div>
        </div>

        {/* Saved indicator */}
        {savedToast && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-medium animate-in fade-in">
            <CheckCircle2 size={14} />
            <span>설정이 저장되었습니다</span>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* =========================================================================
            1. 사운드 설정 섹션
           ========================================================================= */}
        <div className="glass-panel p-6 border border-slate-800 bg-slate-900/60 shadow-xl rounded-2xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <Volume2 size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">사운드 효과음 설정</h2>
                <p className="text-xs text-slate-400">
                  앱 내 조작 및 타이머 초침 사운드를 제어합니다.
                </p>
              </div>
            </div>

            {/* Master Sound Toggle */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.sound.masterEnabled}
                onChange={(e) => updateSound({ masterEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
            </label>
          </div>

          <div className={`space-y-6 transition-opacity ${settings.sound.masterEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            {/* Master Volume Slider */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Volume2 size={16} className="text-orange-400" />
                  마스터 사운드 음량
                </span>
                <span className="text-xs font-mono font-bold text-amber-400">
                  {settings.sound.volume}%
                </span>
              </div>
              <div className="flex items-center gap-4">
                <VolumeX size={16} className="text-slate-500" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.sound.volume}
                  onChange={(e) => updateSound({ volume: Number(e.target.value) })}
                  className="w-full accent-orange-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
                />
                <Volume2 size={18} className="text-orange-400" />
              </div>
            </div>

            {/* Toggle Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Button Click Sound */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">버튼 터치 효과음</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    버튼을 누를 때 가벼운 터치음이 재생됩니다.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => soundService.playButtonClick()}
                    className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
                  >
                    테스트
                  </button>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.sound.buttonClickSound}
                      onChange={(e) => updateSound({ buttonClickSound: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>
              </div>

              {/* Timer Ticking Sound */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">타이머 초침 소리</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    요리 타이머 작동 중 매초 째깍 사운드를 냅니다.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => soundService.playTick()}
                    className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
                  >
                    테스트
                  </button>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.sound.timerTickingSound}
                      onChange={(e) => updateSound({ timerTickingSound: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Notice about Timer End Sound */}
            <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs text-amber-300/90 flex items-start gap-2.5">
              <Sparkles size={16} className="text-orange-400 mt-0.5 flex-shrink-0" />
              <span>
                <strong>조리 타이머 완료음</strong>(지글지글 프라이팬 소리, 오븐 벨소리 등)은 레시피 상세 창의 타이머에서 요리에 맞춰 직접 변경할 수 있습니다.
              </span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            2. 알림 설정 섹션
           ========================================================================= */}
        <div className="glass-panel p-6 border border-slate-800 bg-slate-900/60 shadow-xl rounded-2xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Bell size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">알림 설정</h2>
                <p className="text-xs text-slate-400">
                  조리 알림과 자취생 맞춤 식사 추천 푸시를 관리합니다.
                </p>
              </div>
            </div>

            {/* Permission Badge & Action */}
            <div>
              {pushStatus === 'granted' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                  <CheckCircle2 size={13} />
                  브라우저 허용됨
                </span>
              ) : (
                <button
                  onClick={handleRequestPush}
                  className="px-3 py-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <Bell size={13} />
                  알림 권한 허용하기
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {/* 1. 타이머 백그라운드 알림 */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-start gap-3">
                <Clock className="text-orange-400 mt-1" size={18} />
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">
                    조리 타이머 백그라운드 알림
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    다른 웹페이지나 다른 앱을 보고 있어도 타이머가 끝나면 시스템 알림으로 알려줍니다.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  checked={settings.notifications.timerBackgroundAlert}
                  onChange={(e) => updateNotifications({ timerBackgroundAlert: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>

            {/* 2. 오늘의 혼밥 추천 알림 */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-start gap-3">
                <Sparkles className="text-amber-400 mt-1" size={18} />
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">
                    오늘의 혼밥 메뉴 추천 알림
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    점심(11:30), 저녁(18:30) 식사 시간에 맞춰 간단한 5분컷 자취 요리를 추천합니다.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  checked={settings.notifications.dailyMealAlert}
                  onChange={(e) => updateNotifications({ dailyMealAlert: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>

            {/* 3. 식재료 할인 & 장바구니 리마인더 */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-start gap-3">
                <Smartphone className="text-cyan-400 mt-1" size={18} />
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">
                    식재료 특가 및 장바구니 리마인더
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    담아둔 재료의 최저가 할인 소식이나 배송 업데이트를 전달합니다.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  checked={settings.notifications.dealAndSaleAlert}
                  onChange={(e) => updateNotifications({ dealAndSaleAlert: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>

            {/* 4. 야식 방지 클린 알림 */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-start gap-3">
                <Flame className="text-rose-400 mt-1" size={18} />
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">
                    야식 방지 & 건강한 식습관 리마인더
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    밤 10시 이후 야식 충동을 줄이고 물 한 잔 마시기를 권장하는 클린 알림입니다.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  checked={settings.notifications.lateNightSnackAlert}
                  onChange={(e) => updateNotifications({ lateNightSnackAlert: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 flex items-center gap-3">
          <HelpCircle size={18} className="text-slate-500 flex-shrink-0" />
          <span>
            모든 설정은 브라우저 로컬 저장소에 안전하게 유지되며, 로그인 시 사용자 계정과도 자동으로 동기화됩니다.
          </span>
        </div>
      </div>
    </div>
  );
}
