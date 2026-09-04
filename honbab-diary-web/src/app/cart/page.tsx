'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { cartService, CartIngredient } from '@/services/cartService';
import { getIngredientPricing } from '@/services/ingredientPricing';
import { soundService } from '@/services/soundService';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ExternalLink,
  CheckSquare,
  Square,
  Info,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

export default function CartPage() {
  const [items, setItems] = useState<CartIngredient[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCart = () => {
    const list = cartService.getItems();
    setItems(list);
    setLoading(false);
  };

  useEffect(() => {
    loadCart();

    const handleCartChanged = () => {
      loadCart();
    };

    window.addEventListener('cart-changed', handleCartChanged);
    return () => {
      window.removeEventListener('cart-changed', handleCartChanged);
    };
  }, []);

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

  // 플랫폼별 예상 총액 계산 (묶음 구매 시 이번 1인분 조리에 실제 소요되는 개당/단위당 원가 기준)
  const { totalCoupangCost, totalKurlyCost, averageEstimatedCost } = useMemo(() => {
    let coupangSum = 0;
    let kurlySum = 0;
    checkedItems.forEach((item) => {
      const pricing = getIngredientPricing(item.name, item.amount, item.unit);
      coupangSum += pricing.recipeCoupangCost * item.quantity;
      kurlySum += pricing.recipeKurlyCost * item.quantity;
    });
    const avg = checkedItems.length > 0 ? Math.round(((coupangSum + kurlySum) / 2) / 10) * 10 : 0;
    return {
      totalCoupangCost: coupangSum,
      totalKurlyCost: kurlySum,
      averageEstimatedCost: avg
    };
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

  const handleQuantityChange = (id: string, delta: number) => {
    soundService.playButtonClick();
    const updated = cartService.updateQuantity(id, delta);
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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-medium">장바구니를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500/20 text-orange-400 p-2.5 rounded-2xl border border-orange-500/30 shadow-md">
            <ShoppingBag size={26} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              혼밥 장바구니 & 가격비교
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              묶음 구매 시 개당 환산가와 1인분 조리 식재료 원가를 한눈에 비교하세요
            </p>
          </div>
        </div>

        {items.length > 0 && (
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleToggleAll}
              className="px-3.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              {allChecked ? <CheckSquare size={14} className="text-orange-400" /> : <Square size={14} />}
              <span>{allChecked ? '전체 해제' : '전체 선택'}</span>
            </button>
            <button
              onClick={handleClearCart}
              className="px-3 py-1.5 rounded-xl border border-slate-800 hover:border-red-500/50 hover:bg-red-500/10 text-slate-400 hover:text-red-400 text-xs font-semibold transition-all"
            >
              장바구니 비우기
            </button>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="glass-panel p-16 text-center rounded-3xl flex flex-col items-center gap-5 border border-slate-800/80 bg-slate-900/60 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-slate-800/80 text-slate-500 flex items-center justify-center">
            <ShoppingBag size={28} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-200">장바구니가 비어있습니다</h3>
            <p className="text-xs text-slate-400 mt-1">
              맛있는 혼밥 레시피 쇼츠에서 필요한 재료를 장바구니에 담아보세요!
            </p>
          </div>
          <Link
            href="/"
            className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-2xl text-xs font-bold shadow-lg hover:brightness-110 transition-all"
          >
            🍳 혼밥 레시피 둘러보기
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Grouped Ingredient Items (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {Object.entries(groupedByRecipe).map(([recipeTitle, groupItems]) => (
              <div
                key={recipeTitle}
                className="glass-panel p-5 sm:p-6 rounded-3xl border border-slate-800 bg-slate-900/60 shadow-xl flex flex-col gap-4"
              >
                {/* Recipe Group Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <h2 className="text-sm font-bold text-orange-300 flex items-center gap-2">
                    <span>🍳 {recipeTitle}</span>
                    <span className="text-xs font-normal text-slate-500">
                      ({groupItems.length}개 재료)
                    </span>
                  </h2>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <span className="text-[11px] text-slate-400 hidden sm:inline">
                      체크 해제 시 집에 있는 재료로 제외
                    </span>
                    <button
                      onClick={() => handleRemoveRecipeGroup(groupItems[0]?.recipeId, recipeTitle)}
                      className="px-2.5 py-1 rounded-lg border border-slate-800 hover:border-red-500/40 hover:bg-red-500/10 text-slate-400 hover:text-red-400 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                      title="이 레시피의 모든 재료 장바구니에서 삭제"
                    >
                      <Trash2 size={13} />
                      <span>이 레시피 전체 삭제</span>
                    </button>
                  </div>
                </div>

                {/* Items in this recipe */}
                <div className="flex flex-col gap-3">
                  {groupItems.map((item) => {
                    const pricing = getIngredientPricing(item.name, item.amount, item.unit);

                    return (
                      <div
                        key={item.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 ${
                          item.checked
                            ? 'bg-slate-950/70 border-slate-800/90 text-slate-200'
                            : 'bg-slate-950/30 border-slate-900 text-slate-500'
                        }`}
                      >
                        {/* Checkbox & Name */}
                        <div className="flex items-center gap-3.5 flex-1 min-w-0">
                          <button
                            onClick={() => handleToggleItem(item.id)}
                            className="text-orange-400 hover:text-orange-300 transition-colors shrink-0"
                            title={item.checked ? '구매 목록에서 제외 (보유 중)' : '구매 목록에 포함'}
                          >
                            {item.checked ? (
                              <CheckSquare size={18} className="text-orange-400" />
                            ) : (
                              <Square size={18} className="text-slate-600" />
                            )}
                          </button>

                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-sm font-bold ${
                                  item.checked ? 'text-white' : 'line-through text-slate-500'
                                }`}
                              >
                                {item.name}
                              </span>
                              <span className="text-xs text-slate-400 font-medium">
                                ({item.amount} {item.unit})
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold border border-slate-700/60">
                                {pricing.unitLabel}
                              </span>
                              {!item.checked && (
                                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-emerald-400 font-semibold">
                                  집에 있음
                                </span>
                              )}
                            </div>

                            {/* 1인분 조리 시 소요되는 환산 원가 */}
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                              <span>1끼 소요액:</span>
                              <span className="text-red-300 font-semibold">
                                쿠팡 ~{(pricing.recipeCoupangCost * item.quantity).toLocaleString()}원
                              </span>
                              <span className="text-slate-600">|</span>
                              <span className="text-purple-300 font-semibold">
                                컬리 ~{(pricing.recipeKurlyCost * item.quantity).toLocaleString()}원
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Side-by-Side Platform Price Comparison Buttons & Controls */}
                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          {/* Coupang Link Button without verbose unit text */}
                          <a
                            href={pricing.coupangUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-red-600/15 hover:bg-red-600/25 border border-red-500/30 text-red-300 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm group hover:border-red-500/60 whitespace-nowrap"
                            title={`${pricing.pkgCoupangDesc} (${pricing.unitLabel} 기준, 인기 상품 보기)`}
                          >
                            <span className="text-[11px] font-extrabold text-red-400">🚀 쿠팡</span>
                            <span className="font-extrabold text-white text-xs">
                              ~{pricing.unitCoupangPrice.toLocaleString()}원
                            </span>
                            <ExternalLink size={11} className="text-red-400/70 group-hover:text-red-300" />
                          </a>

                          {/* Kurly Link Button without verbose unit text */}
                          <a
                            href={pricing.kurlyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/30 text-purple-300 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm group hover:border-purple-500/60 whitespace-nowrap"
                            title={`${pricing.pkgKurlyDesc} (${pricing.unitLabel} 기준, 인기 상품 보기)`}
                          >
                            <span className="text-[11px] font-extrabold text-purple-400">🟣 컬리</span>
                            <span className="font-extrabold text-white text-xs">
                              ~{pricing.unitKurlyPrice.toLocaleString()}원
                            </span>
                            <ExternalLink size={11} className="text-purple-400/70 group-hover:text-purple-300" />
                          </a>

                          {/* Quantity Controller */}
                          <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-xl border border-slate-800 ml-1 shrink-0">
                            <button
                              onClick={() => handleQuantityChange(item.id, -1)}
                              className="text-slate-400 hover:text-white p-0.5"
                              title="수량 감소"
                            >
                              <Minus size={11} />
                            </button>
                            <span className="text-xs font-bold font-mono w-4 text-center text-white">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(item.id, 1)}
                              className="text-slate-400 hover:text-white p-0.5"
                              title="수량 증가"
                            >
                              <Plus size={11} />
                            </button>
                          </div>

                          {/* Remove button */}
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
                            title="재료 삭제"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Estimated Grocery Bill Summary (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            <div className="glass-panel p-6 rounded-3xl border border-orange-500/30 bg-slate-900/80 shadow-2xl flex flex-col gap-5 lg:sticky lg:top-24">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>📊 1인분 예상 식재료 원가</span>
                  </h3>
                  <span className="text-[10px] text-slate-400">개당 / 단위당 환산 견적</span>
                </div>
                <span className="text-xs font-semibold text-orange-400">
                  선택 {checkedItems.length}개 / 전체 {items.length}개
                </span>
              </div>

              {/* Platform Comparison Breakdown */}
              <div className="flex flex-col gap-3 border-b border-slate-800 pb-4">
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    <span className="text-xs font-semibold text-slate-300">🚀 쿠팡 1인분 재료원가</span>
                  </div>
                  <span className="text-sm font-black text-red-300">
                    ~{totalCoupangCost.toLocaleString()}원
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    <span className="text-xs font-semibold text-slate-300">🟣 컬리 1인분 재료원가</span>
                  </div>
                  <span className="text-sm font-black text-purple-300">
                    ~{totalKurlyCost.toLocaleString()}원
                  </span>
                </div>

                {items.length - checkedItems.length > 0 && (
                  <div className="flex justify-between text-xs text-slate-400 px-1 pt-1">
                    <span>집에 보유한 재료</span>
                    <span className="text-emerald-400 font-medium">
                      {items.length - checkedItems.length}개 제외됨
                    </span>
                  </div>
                )}
              </div>

              {/* Estimated Average Total */}
              <div className="flex justify-between items-center py-1">
                <div>
                  <span className="text-sm font-bold text-white block">1끼 평균 식비 원가</span>
                  <span className="text-[10px] text-slate-500">조리에 실제 소요된 재료 기준</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-orange-400">
                    ~{averageEstimatedCost.toLocaleString()}원
                  </span>
                </div>
              </div>

              {/* Helpful Guidance Notice */}
              <div className="flex items-start gap-2.5 text-[11px] text-slate-400 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <Info size={16} className="text-orange-400 shrink-0 mt-0.5" />
                <div className="space-y-1.5 leading-relaxed">
                  <p className="font-semibold text-slate-200">💡 개당 환산 단가 안내</p>
                  <p>
                    식재료는 보통 묶음(계란 30구, 대파 1단 등)으로 구매하므로, <strong>이번 1인분 조리에 들어가는 분량만큼만 개당 단가로 환산</strong>한 실질 식비 견적입니다.
                  </p>
                  <p className="text-slate-400 pt-1">
                    각 재료의 <span className="text-red-300 font-bold">[쿠팡]</span> 또는 <span className="text-purple-300 font-bold">[컬리]</span> 버튼을 누르면 해당 쇼핑몰 검색 페이지로 연결되어 바로 담으실 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
