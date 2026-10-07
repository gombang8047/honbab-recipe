'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, Bot, CheckCircle2 } from 'lucide-react';
import { recipeApi } from '@/services/recipeApi';
import type { RecipeConversionStage } from '@/services/recipeApi';

const CONVERSION_STEPS = [
  { stage: 'PREPARING', label: '기존 레시피 확인' },
  { stage: 'COMMENTS', label: '영상 정보·댓글 확인' },
  { stage: 'ANALYZING', label: 'AI 재료·조리 순서 분석' },
  { stage: 'SAVING', label: '레시피 정리·저장' },
] as const;

interface AiConversionModalProps {
  isOpen: boolean;
  shortsId?: number;
  shortsTitle?: string;
  isReady?: boolean;
}

export const AiConversionModal: React.FC<AiConversionModalProps> = ({ isOpen, shortsId, shortsTitle, isReady = false }) => {
  const [stage, setStage] = useState<RecipeConversionStage | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!isOpen || isReady || shortsId == null) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();
    const startedAt = Date.now();
    setStage(null);
    setElapsedSeconds(0);
    const clock = window.setInterval(() => setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    const poll = async () => {
      try {
        const progress = await recipeApi.getConversionProgress(shortsId, controller.signal);
        if (active) {
          const known = CONVERSION_STEPS.some(step => step.stage === progress.stage);
          // IDLE can occur before POST registration or just after completion; it is not success.
          setStage(known ? progress.stage : null);
        }
      } catch {
        // Progress is optional: a polling failure must never fail or restart generation.
        if (active) setStage(null);
      } finally {
        if (active) timer = setTimeout(poll, 1000);
      }
    };
    void poll();
    return () => {
      active = false;
      controller.abort();
      window.clearInterval(clock);
      if (timer) clearTimeout(timer);
    };
  }, [isOpen, isReady, shortsId]);

  if (!isOpen) return null;
  const currentStep = CONVERSION_STEPS.findIndex(step => step.stage === stage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div role="dialog" aria-modal="true" aria-labelledby="ai-conversion-title" aria-busy={!isReady} className="glass-panel p-8 rounded-3xl max-w-md w-full flex flex-col items-center text-center gap-6 border border-[#D4AF37]/50 shadow-2xl ai-glow bg-[#133624]/95 transition-all duration-300">
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
          <h2 id="ai-conversion-title" className="text-xl font-bold text-[#FDFBF4] flex items-center justify-center gap-2">
            <span>{isReady ? 'AI 레시피 추출 완료! 🎉' : 'AI 레시피 추출 중...'}</span>
          </h2>
          <p className="text-[#D4AF37] text-sm line-clamp-2 px-2 font-medium">
            "{shortsTitle}"
          </p>
        </div>

        {/* Server-reported stages; no invented percentage for the opaque AI call. */}
        <div className="w-full bg-[#0D2418]/90 rounded-xl p-4 flex flex-col gap-2.5 text-left text-xs text-stone-200 border border-[#D4AF37]/30 transition-all">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#D4AF37]/20">
            <span role="status" aria-live="polite" className="flex items-center gap-2 text-[#D4AF37] font-semibold">
              {!isReady && <span aria-hidden="true" className="w-4 h-4 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin" />}
              {isReady ? '레시피 준비 완료' : currentStep >= 0 ? `진행 단계 ${currentStep + 1} / ${CONVERSION_STEPS.length}` : '생성 요청 처리 중'}
              <span className="sr-only">{!isReady && currentStep >= 0 ? CONVERSION_STEPS[currentStep].label : ''}</span>
            </span>
            <span className="text-stone-400 tabular-nums">{elapsedSeconds}초 경과</span>
          </div>
          <div className="flex gap-1.5" aria-hidden="true">
            {CONVERSION_STEPS.map((step, index) => (
              <span key={step.stage} className={`h-1.5 flex-1 rounded-full transition-colors ${isReady || index < currentStep ? 'bg-[#D4AF37]' : index === currentStep ? 'bg-[#D4AF37]/70 animate-pulse' : 'bg-white/10'}`} />
            ))}
          </div>
          {isReady && <p className="flex items-center gap-2 text-[#D4AF37]"><CheckCircle2 size={16} aria-hidden="true" />재료와 조리 단계를 준비했어요.</p>}
          {!isReady && CONVERSION_STEPS.map((step, index) => {
            const done = isReady || (currentStep >= 0 && index < currentStep);
            const current = !isReady && index === currentStep;
            return (
              <div key={step.stage} aria-current={current ? 'step' : undefined} className={`flex items-center gap-2 py-1 font-medium ${done || current ? 'text-[#D4AF37]' : 'text-stone-400'}`}>
                {done ? <CheckCircle2 size={16} aria-hidden="true" /> : current ? <span aria-hidden="true" className="w-4 h-4 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin" /> : <span aria-hidden="true" className="w-4 h-4 rounded-full border border-white/20" />}
                <span>{step.label}{done ? ' 완료' : current ? ' 중...' : ''}</span>
              </div>
            );
          })}
        </div>

        <span className={`text-[11px] font-medium transition-colors ${isReady ? 'text-[#D4AF37] animate-pulse' : 'text-[#D9D2BE]'}`}>
          {isReady ? '레시피 화면으로 바로 이동합니다...' : elapsedSeconds >= 20 ? '평소보다 시간이 걸리고 있어요. 요청이 완료되면 자동으로 이동합니다.' : 'AI가 재료와 조리 순서를 확인하고 있어요.'}
        </span>
      </div>
    </div>
  );
};
