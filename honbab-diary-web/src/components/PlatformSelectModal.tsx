'use client';

import React, { useState } from 'react';
import { Smartphone, Globe, X, ExternalLink, Check } from 'lucide-react';
import { deepLinkService } from '@/services/deepLinkService';

export interface PlatformSelectInfo {
  platform: 'coupang' | 'kurly';
  ingredientName: string;
  webUrl: string;
}

interface PlatformSelectModalProps {
  info: PlatformSelectInfo | null;
  onClose: () => void;
}

export const PlatformSelectModal: React.FC<PlatformSelectModalProps> = ({ info, onClose }) => {
  const [rememberChoice, setRememberChoice] = useState(true);

  if (!info) return null;

  const isCoupang = info.platform === 'coupang';
  const platformTitle = isCoupang ? '쿠팡' : '마켓컬리';
  const primaryColor = isCoupang ? 'text-rose-400' : 'text-purple-400';
  const borderActive = isCoupang
    ? 'border-rose-500/40 hover:border-rose-400'
    : 'border-purple-500/40 hover:border-purple-400';
  const bgActive = isCoupang
    ? 'bg-rose-950/40 hover:bg-rose-900/60'
    : 'bg-purple-950/40 hover:bg-purple-900/60';

  const handleOpenApp = () => {
    if (rememberChoice) {
      deepLinkService.setPreference(info.platform, 'app');
    }
    deepLinkService.openAppDirect(info.platform, info.ingredientName, info.webUrl);
    onClose();
  };

  const handleOpenWeb = () => {
    if (rememberChoice) {
      deepLinkService.setPreference(info.platform, 'web');
    }
    deepLinkService.openWebDirect(info.webUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
      />

      {/* Bottom Sheet / Modal */}
      <div className="relative w-full max-w-md bg-[#133624] border-t-2 sm:border-2 border-[#D4AF37]/50 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_-15px_40px_rgba(0,0,0,0.8)] z-10 flex flex-col gap-4 animate-in slide-in-from-bottom duration-300">
        {/* Drag Pill for Mobile */}
        <div className="w-10 h-1 rounded-full bg-[#D4AF37]/40 mx-auto sm:hidden" />

        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#D4AF37]/20 pb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-2xl bg-[#0D2418] border border-[#D4AF37]/30 flex items-center justify-center text-xs font-black shadow-inner ${primaryColor}`}>
              {isCoupang ? 'CP' : 'KL'}
            </div>
            <div>
              <h3 className="text-base font-bold text-[#FDFBF4] flex items-center gap-1.5">
                <span className="text-[#D4AF37]">{info.ingredientName}</span>
                <span>{platformTitle} 연결</span>
              </h3>
              <p className="text-[11px] text-[#D9D2BE]/80 mt-0.5">
                원하시는 방식을 선택해주세요
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#D9D2BE]/60 hover:text-white p-1 rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>


        {/* Options */}
        <div className="flex flex-col gap-2.5">
          {/* Option 1: Open in Native App */}
          <button
            type="button"
            onClick={handleOpenApp}
            className={`w-full p-3.5 rounded-2xl border ${borderActive} ${bgActive} text-left transition-all flex items-center justify-between group active:scale-98 shadow-sm`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0D2418] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shrink-0">
                <Smartphone size={18} />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className={`text-sm font-extrabold ${primaryColor}`}>
                    {platformTitle} 앱으로 열기
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D4AF37] text-[#0D2418]">
                    앱 설치 기기
                  </span>
                </div>
                <span className="text-[11px] text-[#D9D2BE]/80 mt-0.5">
                  스마트폰에 설치된 공식 앱으로 바로 이동
                </span>
              </div>
            </div>
            <ExternalLink
              size={15}
              className={`${primaryColor} opacity-70 group-hover:opacity-100 shrink-0`}
            />
          </button>

          {/* Option 2: Open in Web Browser */}
          <button
            type="button"
            onClick={handleOpenWeb}
            className="w-full p-3.5 rounded-2xl border border-[#D4AF37]/30 bg-[#0D2418]/80 hover:bg-[#0D2418] text-left transition-all flex items-center justify-between group active:scale-98 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#1B4731] border border-[#D4AF37]/25 flex items-center justify-center text-[#D9D2BE] shrink-0">
                <Globe size={18} />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-extrabold text-[#FDFBF4]">
                    웹 브라우저로 보기
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#1B4731] text-[#D9D2BE] border border-[#D4AF37]/20">
                    앱 미설치 기기
                  </span>
                </div>
                <span className="text-[11px] text-[#D9D2BE]/80 mt-0.5">
                  경고창 없이 사파리/크롬 웹페이지로 바로 이동
                </span>
              </div>
            </div>
            <ExternalLink size={15} className="text-[#D9D2BE]/70 group-hover:text-white shrink-0" />
          </button>
        </div>

        {/* Remember Choice Checkbox */}
        <div
          onClick={() => setRememberChoice(!rememberChoice)}
          className="flex items-center gap-2 px-1 py-1.5 cursor-pointer select-none text-xs text-[#D9D2BE]/90 hover:text-white transition-colors"
        >
          <div
            className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
              rememberChoice
                ? 'bg-[#D4AF37] border-[#D4AF37] text-[#0D2418]'
                : 'border-[#D4AF37]/40 bg-[#0D2418]'
            }`}
          >
            {rememberChoice && <Check size={12} strokeWidth={3} />}
          </div>
          <span className="text-[11px] sm:text-xs">
            다음부터 물어보지 않고 항상 이 방식으로 바로 열기
          </span>
        </div>

        {/* Cancel button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2 text-center text-xs text-[#D9D2BE]/70 hover:text-white transition-colors"
        >
          닫기
        </button>
      </div>
    </div>
  );
};

