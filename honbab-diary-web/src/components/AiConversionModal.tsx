'use client';

import React from 'react';
import { Sparkles, Bot, CheckCircle2 } from 'lucide-react';

interface AiConversionModalProps {
  isOpen: boolean;
  shortsTitle?: string;
  isReady?: boolean;
}

export const AiConversionModal: React.FC<AiConversionModalProps> = ({ isOpen, shortsTitle, isReady = false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="glass-panel p-8 rounded-3xl max-w-md w-full flex flex-col items-center text-center gap-6 border border-[#D4AF37]/50 shadow-2xl ai-glow bg-[#133624]/95 transition-all duration-300">
        {/* Animated Bot Avatar */}
        <div className="relative">
          <div className={`w-20 h-20 rounded-full bg-[#D4AF37] flex items-center justify-center text-[#1B4731] shadow-xl border border-[#F3E5AB] transition-all duration-300 ${isReady ? 'scale-105 ring-4 ring-[#D4AF37]/40' : ''}`}>
            {isReady ? (
              <CheckCircle2 size={44} className="text-[#1B4731] animate-in zoom-in-75 duration-300" />
            ) : (
              <Bot size={40} className="animate-bounce text-[#1B4731]" />
            )}
          </div>
          <div className="absolute -top-1 -right-1 bg-[#1B4731] text-[#D4AF37] p-1.5 rounded-full shadow-md border border-[#D4AF37]/50">
            <Sparkles size={16} />
          </div>
        </div>

        {/* Loading / Ready Message */}
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold text-[#FDFBF4] flex items-center justify-center gap-2">
            <span>{isReady ? 'AI 레시피 추출 완료! 🎉' : 'AI 레시피 추출 중...'}</span>
          </h2>
          <p className="text-[#D4AF37] text-sm line-clamp-2 px-2 font-medium">
            "{shortsTitle}"
          </p>
        </div>

        {/* Steps checklist */}
        <div className="w-full bg-[#0D2418]/90 rounded-xl p-4 flex flex-col gap-2.5 text-left text-xs text-stone-200 border border-[#D4AF37]/30 transition-all">
          <div className="flex items-center gap-2 text-[#D4AF37] font-semibold">
            <CheckCircle2 size={16} />
            <span>Whisper STT 영상 자막 추출 완료</span>
          </div>
          <div className={`flex items-center gap-2 font-medium ${isReady ? 'text-[#D4AF37] font-semibold' : 'text-[#FDFBF4] animate-pulse'}`}>
            {isReady ? <CheckCircle2 size={16} /> : <Sparkles size={16} className="text-[#D4AF37]" />}
            <span>GPT-4o 1인분 기준 재료 및 조리법 분석 {isReady ? '완료' : '중'}</span>
          </div>
          <div className={`flex items-center gap-2 ${isReady ? 'text-[#D4AF37] font-semibold' : 'text-[#B8AF98]'}`}>
            {isReady ? (
              <CheckCircle2 size={16} />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin" />
            )}
            <span>최저가 재료 상품 매핑 {isReady ? '완료' : '진행 중'}</span>
          </div>
        </div>

        <span className={`text-[11px] font-medium transition-colors ${isReady ? 'text-[#D4AF37] animate-pulse' : 'text-[#D9D2BE]'}`}>
          {isReady ? '레시피 화면으로 바로 이동합니다...' : '잠시만 기다려주세요. 자취생 맞춤 레시피가 생성됩니다.'}
        </span>
      </div>
    </div>
  );
};
