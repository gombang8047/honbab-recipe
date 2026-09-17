'use client';

import React, { useEffect, useState } from 'react';
import { X, ExternalLink, ShoppingBag, Sparkles, Check, CheckSquare, Square, Info } from 'lucide-react';
import { getIngredientPricing, IngredientPricingResult } from '@/services/ingredientPricing';
import { soundService } from '@/services/soundService';
import { deepLinkService } from '@/services/deepLinkService';
import { PlatformSelectModal, PlatformSelectInfo } from '@/components/PlatformSelectModal';

interface IngredientPurchaseModalProps {
  isOpen: boolean;
  ingredientName: string | null;
  recipeAmount?: string;
  recipeUnit?: string;
  isPossessed?: boolean;
  onTogglePossessed?: () => void;
  onClose: () => void;
}

export const IngredientPurchaseModal: React.FC<IngredientPurchaseModalProps> = ({
  isOpen,
  ingredientName,
  recipeAmount,
  recipeUnit,
  isPossessed = false,
  onTogglePossessed,
  onClose
}) => {
  const [activeTier, setActiveTier] = useState<'value' | 'lowest' | 'rocket'>('value');
  const [pricing, setPricing] = useState<IngredientPricingResult | null>(null);
  const [platformModalInfo, setPlatformModalInfo] = useState<PlatformSelectInfo | null>(null);

  useEffect(() => {
    if (ingredientName) {
      const data = getIngredientPricing(ingredientName, recipeAmount, recipeUnit);
      setPricing(data);
      setActiveTier('value'); // 기본 1인 가성비 라인 선택
    }
  }, [ingredientName, recipeAmount, recipeUnit]);

  // ESC 키 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !ingredientName || !pricing) return null;

  const currentTier = pricing.tiers[activeTier];

  const handleOpenLink = (url: string, platform: 'coupang' | 'kurly') => {
    soundService.playButtonClick();
    const isMobile =
      typeof navigator !== 'undefined' &&
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');

    if (!isMobile) {
      deepLinkService.openWebDirect(url);
      return;
    }

    // 스마트 기억 확인: 이전에 선택한 선호 방식이 있으면 바텀시트 없이 0초 만에 바로 실행!
    const pref = deepLinkService.getPreference(platform);
    if (pref === 'app') {
      deepLinkService.openAppDirect(platform, pricing.ingredientName, url);
      return;
    }
    if (pref === 'web') {
      deepLinkService.openWebDirect(url);
      return;
    }

    // 선택 기록이 없으면 바텀시트 표시
    setPlatformModalInfo({
      platform,
      ingredientName: pricing.ingredientName,
      webUrl: url,
    });
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900/95 border border-slate-700/80 shadow-2xl p-6 flex flex-col gap-5 text-white z-10 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
              <ShoppingBag size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white tracking-tight">
                  {pricing.ingredientName}
                </h3>
                {recipeAmount && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                    레시피: {recipeAmount} {recipeUnit}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                가격대별 추천 상품을 확인하고 바로 구매/장바구니에 담으세요
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Home possessed toggle */}
        {onTogglePossessed && (
          <div
            onClick={onTogglePossessed}
            className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
              isPossessed
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2.5 text-xs font-semibold">
              {isPossessed ? <CheckSquare size={16} className="text-emerald-400" /> : <Square size={16} />}
              <span>{isPossessed ? '집에 이미 있는 재료입니다 (구매 제외됨)' : '집에 이미 재료가 있나요?'}</span>
            </div>
            <span className="text-[11px] underline font-medium">
              {isPossessed ? '구매하기로 변경' : '보유 중으로 체크'}
            </span>
          </div>
        )}

        {/* 3 Tier Navigation Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-slate-950/70 border border-slate-800">
          {(['value', 'lowest', 'rocket'] as const).map((tierKey) => {
            const tier = pricing.tiers[tierKey];
            const isActive = activeTier === tierKey;
            return (
              <button
                key={tierKey}
                onClick={() => {
                  soundService.playButtonClick();
                  setActiveTier(tierKey);
                }}
                className={`py-2 px-2.5 rounded-xl text-center flex flex-col items-center gap-1 transition-all ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-md border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                <span className="text-[11px] font-bold leading-tight line-clamp-1">{tier.title.split(' ')[0]} {tier.title.split(' ')[1]}</span>
                <span className={`text-xs font-extrabold ${isActive ? 'text-orange-400' : 'text-slate-400'}`}>
                  ~{tier.estimatedPrice.toLocaleString()}원
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Tier Card Detail */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-950/60 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className={`text-xs px-3 py-1 rounded-full font-bold border ${currentTier.badgeColor}`}>
              {currentTier.badge}
            </span>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">예상 구매가</span>
              <span className="text-2xl font-black text-orange-400">
                ~{currentTier.estimatedPrice.toLocaleString()}원
              </span>
            </div>
          </div>

          <div className="space-y-1.5 border-t border-slate-800/80 pt-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">추천 포장/용량</span>
              <span className="font-semibold text-slate-200">{currentTier.recommendedPackage}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">특징</span>
              <span className="text-slate-300 font-medium">{currentTier.description}</span>
            </div>
          </div>

          {/* Quick Buy CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <button
              onClick={() => handleOpenLink(currentTier.coupangSearchUrl, 'coupang')}
              className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98"
            >
              <span>🚀 쿠팡에서 담기</span>
              <ExternalLink size={13} />
            </button>

            <button
              onClick={() => handleOpenLink(currentTier.kurlySearchUrl, 'kurly')}
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98"
            >
              <span>🟣 컬리에서 담기</span>
              <ExternalLink size={13} />
            </button>
          </div>
        </div>

        {/* Bottom Helper Notice */}
        <div className="flex items-start gap-2 text-[11px] text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
          <Info size={14} className="text-orange-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            클릭 시 해당 플랫폼으로 이동하며, 원하시는 상품을 쿠팡/네이버 장바구니에 직접 담으신 후 한 번에 결제하시면 편리합니다.
          </p>
        </div>
      </div>

      {/* 모바일 쇼핑몰 연결 방식 선택 바텀시트 */}
      <PlatformSelectModal
        info={platformModalInfo}
        onClose={() => setPlatformModalInfo(null)}
      />
    </div>
  );
};
