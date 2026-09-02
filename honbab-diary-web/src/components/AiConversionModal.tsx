'use client';

import React from 'react';
import { Sparkles, Bot, CheckCircle2 } from 'lucide-react';

interface AiConversionModalProps {
  isOpen: boolean;
  shortsTitle?: string;
}

export const AiConversionModal: React.FC<AiConversionModalProps> = ({ isOpen, shortsTitle }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="glass-panel p-8 rounded-3xl max-w-md w-full flex flex-col items-center text-center gap-6 border border-orange-500/40 shadow-2xl ai-glow">
        {/* Animated Bot Avatar */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white shadow-xl">
            <Bot size={40} className="animate-bounce" />
          </div>
          <div className="absolute -top-1 -right-1 bg-cyan-400 text-slate-950 p-1.5 rounded-full shadow-md">
            <Sparkles size={16} />
          </div>
        </div>

        {/* Loading Message */}
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold text-white flex items-center justify-center gap-2">
            <span>AI 레시피 추출 중...</span>
          </h2>
          <p className="text-slate-400 text-sm line-clamp-2 px-2">
            "{shortsTitle}"
          </p>
        </div>

        {/* Steps checklist */}
        <div className="w-full bg-slate-900/60 rounded-xl p-4 flex flex-col gap-2.5 text-left text-xs text-slate-300 border border-slate-800">
          <div className="flex items-center gap-2 text-emerald-400 font-medium">
            <CheckCircle2 size={16} />
            <span>Whisper STT 영상 자막 추출 완료</span>
          </div>
          <div className="flex items-center gap-2 text-orange-400 font-medium animate-pulse">
            <Sparkles size={16} />
            <span>GPT-4o 1인분 기준 재료 및 조리법 분석 중</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <div className="w-4 h-4 rounded-full border-2 border-slate-600 border-t-transparent animate-spin" />
            <span>최저가 재료 상품 매핑</span>
          </div>
        </div>

        <span className="text-[11px] text-slate-500">잠시만 기다려주세요. 자취생 맞춤 레시피가 생성됩니다.</span>
      </div>
    </div>
  );
};
