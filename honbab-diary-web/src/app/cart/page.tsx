'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { cartService, CartIngredient } from '@/services/cartService';
import { getIngredientPricing, fetchAndApplyKurlyPrices } from '@/services/ingredientPricing';
import { soundService } from '@/services/soundService';
import { deepLinkService } from '@/services/deepLinkService';
import { PlatformSelectModal, PlatformSelectInfo } from '@/components/PlatformSelectModal';
import {
  ShoppingBag,
  Trash2,
  ExternalLink,
  CheckSquare,
  Square,
  Info,
  ArrowRight,
  Sparkles,
  Smartphone,
  Globe,
  Settings2,
} from 'lucide-react';
import Link from 'next/link';

export default function CartPage() {
  const [items, setItems] = useState<CartIngredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [platformModalInfo, setPlatformModalInfo] = useState<PlatformSelectInfo | null>(null);
  const [kurlyPref, setKurlyPref] = useState<'app' | 'web' | null>(null);

  const loadCart = () => {
    const list = cartService.getItems();
    setItems(list);
    setLoading(false);
  };

  const loadPreferences = () => {
    setKurlyPref(deepLinkService.getPreference('kurly'));
  };


  useEffect(() => {
    loadCart();
    loadPreferences();
    fetchAndApplyKurlyPrices().then((cnt) => {
      if (cnt > 0) {
        // 최신 가격이 주입되면 카트 상태를 리프레시하여 새 가격 반영
        setItems(cartService.getItems());
      }
    }).catch(() => {});

    const handleCartChanged = () => {
      loadCart();
    };

    window.addEventListener('cart-changed', handleCartChanged);
    return () => {
      window.removeEventListener('cart-changed', handleCartChanged);
    };
  }, []);

  const handleTogglePreference = (platform: 'kurly' = 'kurly') => {
    soundService.playButtonClick();
    const current = kurlyPref;
    // null -> 'app' -> 'web' -> 'app' 순환 토글
    const next = current === 'app' ? 'web' : 'app';
    deepLinkService.setPreference('kurly', next);
    loadPreferences();
  };


  // 레시피별 그룹화
  const groupedByRecipe = useMemo(() => {
    const map: Record<string, CartIngredient[]> = {};
    items.forEach((item) => {
      const groupKey = item.recipeTitle || '일반 장바구니 재료';
      if (!map[groupKey]) map[groupKey] = [];
      map[groupKey].push(item);
    });
    return map;
  }, [items]);

  // 구매 대상(체크된 재료)만 필터링
  const checkedItems = useMemo(() => items.filter((i) => i.checked), [items]);

  // 마켓컬리 1인분 조리 시 소요되는 실질 식재료 원가 총액 계산
  const totalKurlyCost = useMemo(() => {
    let kurlySum = 0;
    checkedItems.forEach((item) => {
      const pricing = getIngredientPricing(item.name, item.amount, item.unit);
      kurlySum += pricing.recipeKurlyCost;
    });
    return kurlySum;
  }, [checkedItems]);

  const allChecked = items.length > 0 && items.every((i) => i.checked);

  const handleToggleAll = () => {
    soundService.playButtonClick();
    const updated = cartService.toggleAll(!allChecked);
    setItems(updated);
  };

  const handleToggleItem = (id: string) => {
    soundService.playButtonClick();
    const updated = cartService.toggleChecked(id);
    setItems(updated);
  };

  const handleRemoveItem = (id: string) => {
    soundService.playButtonClick();
    const updated = cartService.removeItem(id);
    setItems(updated);
  };

  const handleRemoveRecipeGroup = (recipeId: number | undefined, recipeTitle: string) => {
    soundService.playButtonClick();
    const updated = cartService.removeRecipeGroup(recipeId, recipeTitle);
    setItems(updated);
  };

  const handleClearCart = () => {
    soundService.playButtonClick();
    cartService.clearCart();
    setItems([]);
  };

  const handlePlatformClick = (
    platform: 'coupang' | 'kurly',
    ingredientName: string,
    webUrl: string
  ) => {
    soundService.playButtonClick();
    const isMobile =
      typeof navigator !== 'undefined' &&
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');

    if (!isMobile) {
      deepLinkService.openWebDirect(webUrl);
      return;
    }

    // 스마트 기억 확인: 이전에 선택한 선호 방식이 있으면 바텀시트 없이 0초 만에 바로 실행!
    const pref = deepLinkService.getPreference(platform);
    if (pref === 'app') {
      deepLinkService.openAppDirect(platform, ingredientName, webUrl);
      return;
    }
    if (pref === 'web') {
      deepLinkService.openWebDirect(webUrl);
      return;
    }

    // 선택 기록이 없는 경우에만 간편 선택 바텀시트 표시
    setPlatformModalInfo({ platform, ingredientName, webUrl });
  };


  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#D9D2BE] text-sm font-medium">장바구니를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-10 sm:pb-12 flex flex-col gap-6 sm:gap-8">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D4AF37]/20 pb-4 sm:pb-5">
        <div className="flex items-center gap-3">
          <div className="bg-[#0D2418] text-[#D4AF37] p-2.5 rounded-2xl border border-[#D4AF37]/35 shadow-lg">
            <ShoppingBag size={24} className="sm:w-7 sm:h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#FDFBF4] tracking-tight flex items-center gap-2">
              <span>혼밥 장바구니 & 가격비교</span>
              <Sparkles size={18} className="text-[#D4AF37]" />
            </h1>
            <p className="text-xs text-[#D9D2BE]/80 mt-0.5 leading-relaxed">
              묶음 구매 시 개당 환산가와 1인분 조리 식재료 원가를 한눈에 비교하세요
            </p>
          </div>
        </div>

        {/* Header Actions: 모바일에서는 토글(왼쪽), 장바구니 비우기(오른쪽) 양 끝 정렬 */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto mt-1 sm:mt-0">


          {/* 쇼핑몰 연결 방식 토글 뱃지 (이모지 제거 및 세련된 미니멀 디자인) */}
          <div className="flex items-center gap-1.5 p-1 bg-[#0D2418]/90 rounded-2xl border border-[#D4AF37]/30 shadow-sm">
            <span className="text-[10px] text-[#D9D2BE]/60 px-1.5 font-medium flex items-center gap-1">
              <Settings2 size={11} className="text-[#D4AF37]" />
              <span className="hidden sm:inline">연결:</span>
            </span>


            {/* 마켓컬리 토글 */}
            <button
              type="button"
              onClick={() => handleTogglePreference('kurly')}
              title="클릭하여 마켓컬리 연결 방식을 앱 또는 웹으로 즉시 변경합니다"
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all border ${
                kurlyPref === 'app'
                  ? 'bg-purple-950/60 text-purple-300 border-purple-500/40 shadow-sm'
                  : kurlyPref === 'web'
                  ? 'bg-[#1B4731] text-[#FDFBF4] border-[#D4AF37]/40'
                  : 'bg-[#133624] text-[#D9D2BE]/80 border-transparent hover:border-[#D4AF37]/30'
              }`}
            >
              <span>컬리</span>
              <span className="flex items-center gap-0.5 ml-0.5">
                {kurlyPref === 'app' ? (
                  <>
                    <Smartphone size={11} className="text-purple-400" />
                    <span>앱</span>
                  </>
                ) : kurlyPref === 'web' ? (
                  <>
                    <Globe size={11} className="text-emerald-400" />
                    <span>웹</span>
                  </>
                ) : (
                  <span className="text-[10px] text-[#D4AF37]">선택 전 ▾</span>
                )}
              </span>
            </button>
          </div>

          {items.length > 0 && (
            <button
              onClick={handleClearCart}
              className="px-3 py-1.5 rounded-xl border border-rose-500/30 hover:border-rose-500/60 hover:bg-rose-950/30 text-rose-300 text-xs font-semibold transition-all shadow-sm"
            >
              장바구니 비우기
            </button>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="p-10 sm:p-16 text-center rounded-3xl flex flex-col items-center gap-5 border border-[#D4AF37]/30 bg-[#133624] shadow-2xl max-w-xl mx-auto my-6">
          <div className="w-16 h-16 rounded-2xl bg-[#0D2418] text-[#D4AF37] flex items-center justify-center border border-[#D4AF37]/30 shadow-inner">
            <ShoppingBag size={30} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#FDFBF4]">장바구니가 비어있습니다</h3>
            <p className="text-xs text-[#D9D2BE]/80 mt-1.5 leading-relaxed">
              맛있는 혼밥 레시피 쇼츠에서 필요한 재료를 장바구니에 담아보세요!
            </p>
          </div>
          <Link
            href="/"
            className="bg-[#D4AF37] hover:bg-[#c39f2f] text-[#0D2418] px-6 py-3 rounded-2xl text-xs font-extrabold shadow-lg transition-all flex items-center gap-1.5 active:scale-98"
          >
            <span>🍳 혼밥 레시피 둘러보기</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          {/* Left Column: Grouped Ingredient Items (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-5 sm:gap-6">
            {Object.entries(groupedByRecipe).map(([recipeTitle, groupItems]) => {
              const allGroupChecked = groupItems.length > 0 && groupItems.every((i) => i.checked);

              const handleToggleGroup = () => {
                soundService.playButtonClick();
                const updated = cartService.toggleRecipeGroupChecked(
                  recipeTitle,
                  !allGroupChecked
                );
                setItems(updated);
              };

                return (
                  <div
                    key={recipeTitle}
                    className="p-4 sm:p-6 rounded-3xl border border-[#D4AF37]/30 bg-[#133624] shadow-xl flex flex-col gap-3.5 sm:gap-4"
                  >
                    {/* Recipe Group Header */}
                    <div className="flex items-center justify-between gap-2 border-b border-[#D4AF37]/20 pb-3">
                      <h2 className="text-sm sm:text-base font-bold text-[#D4AF37] flex items-center gap-2 min-w-0">
                        <span className="truncate">{recipeTitle}</span>
                        <span className="text-xs font-normal text-[#D9D2BE]/70 shrink-0">
                          ({groupItems.length}개)
                        </span>
                      </h2>

                      {/* 메뉴별 액션 버튼들: 전체 해제/선택 + 메뉴 삭제 */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={handleToggleGroup}
                          className="px-2.5 py-1 rounded-lg border border-[#D4AF37]/30 bg-[#0D2418] hover:bg-[#1B4731] text-[#D4AF37] text-xs font-bold flex items-center gap-1 transition-all shadow-sm"
                        >
                          {allGroupChecked ? (
                            <CheckSquare size={13} className="text-[#D4AF37]" />
                          ) : (
                            <Square size={13} />
                          )}
                          <span>{allGroupChecked ? '전체 해제' : '전체 선택'}</span>
                        </button>

                        <button
                          onClick={() => handleRemoveRecipeGroup(groupItems[0]?.recipeId, recipeTitle)}
                          className="px-2.5 py-1 rounded-lg border border-rose-500/30 hover:border-rose-500/60 hover:bg-rose-950/40 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 shadow-sm"
                          title="이 레시피의 모든 재료 삭제"
                        >
                          <Trash2 size={12} />
                          <span className="hidden sm:inline">레시피 삭제</span>
                          <span className="sm:hidden">삭제</span>
                        </button>
                      </div>
                    </div>

                    {/* Items in this recipe */}
                    <div className="flex flex-col gap-2.5 sm:gap-3">
                      {groupItems.map((item) => {
                        const pricing = getIngredientPricing(item.name, item.amount, item.unit);

                        return (
                          <div
                            key={item.id}
                            className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-3 ${
                              item.checked
                                ? 'bg-[#0D2418] border-[#D4AF37]/30 text-[#FDFBF4] shadow-sm'
                                : 'bg-[#0D2418]/50 border-emerald-950/40 text-[#D9D2BE]/50'
                            }`}
                          >
                            {/* Top / Left Part: Checkbox + Name + Badges + Estimated 1-Serving cost */}
                            <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                              {/* Checkbox */}
                              <button
                                onClick={() => handleToggleItem(item.id)}
                                className="text-[#D4AF37] hover:text-[#f1cc56] transition-colors shrink-0 mt-0.5"
                                title={item.checked ? '구매 목록에서 제외 (보유 중)' : '구매 목록에 포함'}
                              >
                                {item.checked ? (
                                  <CheckSquare size={19} className="text-[#D4AF37]" />
                                ) : (
                                  <Square size={19} className="text-[#D9D2BE]/40" />
                                )}
                              </button>

                              {/* Details */}
                              <div className="flex flex-col min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                  <span
                                    className={`text-sm sm:text-base font-bold ${
                                      item.checked ? 'text-[#FDFBF4]' : 'line-through text-[#D9D2BE]/40'
                                    }`}
                                  >
                                    {item.name}
                                  </span>
                                  <span className="text-xs text-[#D9D2BE]/80 font-medium">
                                    ({item.amount} {item.unit})
                                  </span>
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1B4731] text-[#D4AF37] font-semibold border border-[#D4AF37]/30">
                                    {pricing.unitLabel} 기준
                                  </span>
                                  {!item.checked && (
                                    <span className="text-[10px] bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-full text-emerald-300 font-semibold">
                                      집에 있음 (제외)
                                    </span>
                                  )}
                                </div>

                                {/* 1-Serving Estimated Cost Details */}
                                <div className="flex items-center gap-2 mt-1 text-[11px] text-[#D9D2BE]/75 flex-wrap">
                                  <span className="text-[10px] text-[#D9D2BE]/60">1끼 소요액:</span>
                                  <span className="text-purple-300 font-semibold">
                                    {pricing.recipeKurlyCost === 0 ? '무료 (기본 조리수)' : `컬리 ~${pricing.recipeKurlyCost.toLocaleString()}원`}
                                  </span>
                                </div>
                              </div>

                              {/* Mobile Only: Trash button at top right */}
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                className="md:hidden text-[#D9D2BE]/50 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors shrink-0"
                                title="재료 삭제"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>

                            {/* Mobile Only: 1-Column Full Width Kurly Button */}
                            <div className="w-full pt-1 md:hidden">
                              <a
                                href={pricing.kurlyUrl}
                                target="_blank"
                                rel="noreferrer noopener"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handlePlatformClick('kurly', item.name, pricing.kurlyUrl);
                                }}
                                className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/70 border border-purple-500/50 text-purple-200 text-xs font-bold transition-all shadow-sm group active:scale-98"
                                title={`${pricing.pkgKurlyDesc} (${pricing.unitLabel} 기준)`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-purple-400 font-extrabold text-[11px] px-1.5 py-0.5 rounded bg-purple-900/60 border border-purple-400/40">
                                    {pricing.unitKurlyPrice === 0 ? '기본 준비' : '컬리 샛별배송'}
                                  </span>
                                  <span className="text-white font-extrabold text-xs truncate">
                                    {pricing.unitKurlyPrice === 0 ? '0원 (가정 내 조리수)' : `~${pricing.unitKurlyPrice.toLocaleString()}원`}
                                  </span>
                                  {pricing.unitKurlyPrice > 0 && (
                                    <span className="text-[10px] text-purple-300/70">({pricing.unitLabel})</span>
                                  )}
                                </div>
                                <ExternalLink size={13} className="text-purple-400 group-hover:text-purple-300 shrink-0 ml-1" />
                              </a>
                            </div>

                            {/* Desktop Only (md and up): Kurly Single Button + Trash */}
                            <div className="hidden md:flex md:items-center md:gap-2.5 shrink-0">
                              <a
                                href={pricing.kurlyUrl}
                                target="_blank"
                                rel="noreferrer noopener"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handlePlatformClick('kurly', item.name, pricing.kurlyUrl);
                                }}
                                className="px-4 py-2.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/70 border border-purple-500/50 text-purple-200 text-xs font-bold transition-all flex items-center gap-2 shadow-sm group hover:border-purple-400 whitespace-nowrap"
                                title={`${pricing.pkgKurlyDesc} (${pricing.unitLabel} 기준)`}
                              >
                                <span className="text-[11px] font-extrabold text-purple-400 px-1.5 py-0.5 rounded bg-purple-900/60 border border-purple-400/40">
                                  {pricing.unitKurlyPrice === 0 ? '기본 준비' : '컬리 샛별배송'}
                                </span>
                                <span className="font-extrabold text-white text-xs">
                                  {pricing.unitKurlyPrice === 0 ? '0원 (가정 내 조리수)' : `~${pricing.unitKurlyPrice.toLocaleString()}원`}
                                </span>
                                {pricing.unitKurlyPrice > 0 && (
                                  <span className="text-[10px] text-purple-300/70 font-normal">({pricing.unitLabel})</span>
                                )}
                                <ExternalLink size={12} className="text-purple-400/80 group-hover:text-purple-300 ml-0.5" />
                              </a>

                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-[#D9D2BE]/60 hover:text-rose-400 p-2 rounded-xl hover:bg-rose-500/15 transition-colors shrink-0 ml-1 border border-transparent hover:border-rose-500/30"
                                title="재료 삭제"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>


          {/* Right Column: Estimated Grocery Bill Summary (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            <div
              id="cart-summary-card"
              className="p-5 sm:p-6 rounded-3xl border border-[#D4AF37]/40 bg-[#133624] shadow-2xl flex flex-col gap-5 lg:sticky lg:top-24"
            >
              <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-3">
                <div>
                  <h3 className="text-base font-bold text-[#FDFBF4] flex items-center gap-2">
                    <Sparkles size={16} className="text-[#D4AF37]" />
                    <span>1인분 예상 식재료 원가</span>
                  </h3>
                  <span className="text-[11px] text-[#D9D2BE]/70">개당 / 단위당 실질 환산 견적</span>
                </div>
                <span className="text-xs font-bold text-[#D4AF37] px-2.5 py-1 rounded-full bg-[#0D2418] border border-[#D4AF37]/30">
                  {checkedItems.length} / {items.length}개 선택
                </span>
              </div>

              {/* Kurly 1-Meal Grocery Breakdown */}
              <div className="flex flex-col gap-2.5 border-b border-[#D4AF37]/20 pb-4">
                <div className="p-3.5 rounded-2xl bg-[#0D2418] border border-purple-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-sm" />
                    <div>
                      <span className="text-xs font-bold text-[#FDFBF4] block">🟣 컬리 샛별배송 1인분 식재료 원가</span>
                      <span className="text-[10px] text-purple-300/70">내일 아침 7시 문 앞 도착 기준</span>
                    </div>
                  </div>
                  <span className="text-base font-black text-purple-300">
                    ~{totalKurlyCost.toLocaleString()}원
                  </span>
                </div>

                {items.length - checkedItems.length > 0 && (
                  <div className="flex justify-between text-xs text-[#D9D2BE]/80 px-1 pt-1">
                    <span>집에 보유한 재료</span>
                    <span className="text-emerald-400 font-semibold">
                      {items.length - checkedItems.length}개 제외됨
                    </span>
                  </div>
                )}
              </div>

              {/* Estimated Total */}
              <div className="flex justify-between items-center py-1">
                <div>
                  <span className="text-sm font-bold text-[#FDFBF4] block">1끼 식비 원가</span>
                  <span className="text-[10px] text-[#D9D2BE]/70">조리에 실제 소요된 재료 기준</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl sm:text-3xl font-black text-[#D4AF37]">
                    ~{totalKurlyCost.toLocaleString()}원
                  </span>
                </div>
              </div>

              {/* Helpful Guidance Notice */}
              <div className="flex items-start gap-2.5 text-[11px] text-[#D9D2BE]/85 bg-[#0D2418]/80 p-3.5 sm:p-4 rounded-2xl border border-[#D4AF37]/20">
                <Info size={16} className="text-[#D4AF37] shrink-0 mt-0.5" />
                <div className="space-y-1.5 leading-relaxed">
                  <p className="font-bold text-[#FDFBF4]">💡 개당 환산 단가 안내</p>
                  <p>
                    식재료는 묶음으로 구매하므로, <strong>이번 1인분 조리에 들어가는 분량만큼만 개당 단가로 환산</strong>한 실질 식비 견적입니다.
                  </p>
                  <p className="text-[#D9D2BE]/70 pt-0.5">
                    각 재료의 <span className="text-purple-300 font-bold">[컬리 샛별배송]</span> 버튼을 누르면 마켓컬리로 이동하며, 오늘 밤 11시 전 주문 시 내일 아침 7시 문 앞까지 신선하게 배송됩니다.
                  </p>
                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-[10px] text-[#D9D2BE]/50">앱/웹 연결 방식 재설정이 필요하신가요?</span>
                    <button
                      type="button"
                      onClick={() => {
                        deepLinkService.clearPreference();
                        alert('연결 방식 설정이 초기화되었습니다. 다음 클릭 시 다시 선택창이 표시됩니다.');
                      }}
                      className="text-[10px] text-[#D4AF37] hover:underline underline-offset-2 font-medium"
                    >
                      연결 설정 초기화
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 모바일 쇼핑몰 연결 방식 선택 바텀시트 */}
      <PlatformSelectModal
        info={platformModalInfo}
        onClose={() => {
          setPlatformModalInfo(null);
          loadPreferences();
        }}
      />
    </div>

  );
}
