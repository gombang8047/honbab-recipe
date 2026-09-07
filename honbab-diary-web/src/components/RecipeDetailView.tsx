import React, { useState, useEffect, useRef } from 'react';
import { RecipeDetail } from '@/services/recipeApi';
import { CookingTimer } from './CookingTimer';
import {
  ShoppingBag,
  Users,
  Clock,
  Flame,
  DollarSign,
  CheckSquare,
  Square,
  Youtube,
  ExternalLink,
  Bookmark,
  Volume2,
  ChevronDown,
  Check,
  Sparkles,
  ChefHat,
  ShoppingCart,
  Info,
} from 'lucide-react';
import { shortsApi } from '@/services/shortsApi';
import { soundService, TimerSoundType, TIMER_SOUND_OPTIONS } from '@/services/soundService';
import { cartService } from '@/services/cartService';

interface RecipeDetailViewProps {
  recipe: RecipeDetail;
  onAddToCart: (recipeId: number) => void;
}

export const RecipeDetailView: React.FC<RecipeDetailViewProps> = ({ recipe, onAddToCart }) => {
  // 기본적으로 모든 재료를 체크(구매 대상) 상태로 초기화
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {};
    recipe.ingredients.forEach((ing) => {
      initial[ing.ingredientId] = true;
    });
    return initial;
  });
  const [added, setAdded] = useState(false);
  const [bookmarked, setBookmarked] = useState<boolean>(false);
  const [soundType, setSoundType] = useState<TimerSoundType>('ovenBell');
  const [showSoundMenu, setShowSoundMenu] = useState<boolean>(false);
  const soundMenuRef = useRef<HTMLDivElement>(null);

  const targetShortsId = recipe.shortsId || recipe.id;

  useEffect(() => {
    // Check initial bookmark status from local storage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('honbab_local_bookmarks');
      if (saved) {
        try {
          const list = JSON.parse(saved);
          setBookmarked(list.some((s: any) => s.id === targetShortsId));
        } catch {}
      }

      const savedSound = localStorage.getItem('honbab_timer_sound') as TimerSoundType;
      if (savedSound) {
        setSoundType(savedSound);
      }
    }

    const handleBookmarkChanged = (e: CustomEvent) => {
      if (e.detail && e.detail.id === targetShortsId) {
        setBookmarked(e.detail.bookmarked);
      }
    };
    window.addEventListener('bookmark-changed', handleBookmarkChanged as EventListener);
    return () => {
      window.removeEventListener('bookmark-changed', handleBookmarkChanged as EventListener);
    };
  }, [targetShortsId]);

  // 바깥 클릭 시 사운드 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (soundMenuRef.current && !soundMenuRef.current.contains(e.target as Node)) {
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

  const handleSelectSound = (type: TimerSoundType) => {
    setSoundType(type);
    if (typeof window !== 'undefined') {
      localStorage.setItem('honbab_timer_sound', type);
    }
    soundService.playSound(type);
    setShowSoundMenu(false);
  };

  const handleToggleBookmark = async () => {
    soundService.playButtonClick();
    const newStatus = !bookmarked;
    setBookmarked(newStatus);
    await shortsApi.toggleBookmark(targetShortsId, bookmarked, {
      id: targetShortsId,
      youtubeId: recipe.shortsYoutubeId || `recipe_${recipe.id}`,
      title: recipe.title,
      channelName: '혼밥레시피',
      thumbnailUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&q=80',
      durationSeconds: recipe.cookTimeMinutes * 60,
      viewCount: 28000,
      tags: ['1인분', '자취요리'],
      bookmarked: true,
    });
  };

  // 레시피 변경 시 모든 재료 체크 상태 동기화
  useEffect(() => {
    const initial: Record<number, boolean> = {};
    recipe.ingredients.forEach((ing) => {
      initial[ing.ingredientId] = true;
    });
    setCheckedIngredients(initial);
  }, [recipe]);

  const toggleIngredient = (id: number) => {
    soundService.playButtonClick();
    setCheckedIngredients(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // 현재 선택된(체크된) 재료 개수
  const selectedCount = recipe.ingredients.filter(ing => checkedIngredients[ing.ingredientId]).length;

  const handleAddToCart = () => {
    const selectedIngredients = recipe.ingredients.filter(ing => checkedIngredients[ing.ingredientId]);
    if (selectedIngredients.length === 0) return;

    soundService.playButtonClick();
    cartService.addFromRecipe({
      id: recipe.id,
      title: recipe.title,
      ingredients: selectedIngredients
    });
    setAdded(true);
    onAddToCart(recipe.id);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-5 lg:h-[calc(100vh-5rem)] lg:overflow-hidden flex flex-col">
      {/* Main Split Layout: Left Video (Fixed stationary) + Right Recipe (Independent scroll) */}
      <div className={`flex flex-col ${recipe.shortsYoutubeId ? 'lg:grid lg:grid-cols-12 gap-8 lg:h-full lg:min-h-0' : 'max-w-4xl mx-auto w-full'}`}>
        {/* =========================================================================
            좌측: 쇼츠 영상 플레이어 (PC에서는 전체 화면 높이에 맞춰 고정되어 움직이지 않음)
           ========================================================================= */}
        {recipe.shortsYoutubeId && (
          <div className="lg:col-span-5 xl:col-span-4 lg:h-full lg:flex lg:flex-col lg:justify-start lg:min-h-0">
            <div className="p-4 sm:p-5 rounded-3xl flex flex-col gap-3.5 border border-[#D4AF37]/30 bg-[#133624] shadow-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#FDFBF4] flex items-center gap-2">
                  <Youtube size={18} className="text-[#D4AF37]" />
                  <span>원본 쇼츠 영상</span>
                </h2>
                <a
                  href={`https://www.youtube.com/shorts/${recipe.shortsYoutubeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#D4AF37] hover:underline flex items-center gap-1 transition-colors font-medium"
                >
                  <span>유튜브 열기</span>
                  <ExternalLink size={12} />
                </a>
              </div>

              {/* 9:16 Shorts Player - Fits comfortably within viewport */}
              <div className="relative w-full max-w-[340px] xl:max-w-[360px] mx-auto aspect-[9/16] max-h-[calc(100vh-230px)] rounded-2xl overflow-hidden bg-black shadow-2xl border border-[#D4AF37]/25">
                <iframe
                  src={`https://www.youtube.com/embed/${recipe.shortsYoutubeId}?rel=0&playsinline=1`}
                  title="원본 쇼츠 영상"
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#D9D2BE]/85 text-center leading-relaxed">
                <Info size={13} className="text-[#D4AF37] shrink-0" />
                <span>영상을 재생해두고 우측 레시피를 스크롤하며 조리해보세요.</span>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            우측: 레시피 본문 (PC에서는 독립 스크롤되어 좌측 영상이 움직이지 않음)
           ========================================================================= */}
        <div className={`${recipe.shortsYoutubeId ? 'lg:col-span-7 xl:col-span-8' : 'w-full'} flex flex-col gap-6 lg:h-full lg:overflow-y-auto lg:pr-3 lg:pb-6 custom-scrollbar min-h-0`}>
          {/* 1. Header Info Card */}
          <div className="p-6 sm:p-8 rounded-3xl flex flex-col gap-4 border border-[#D4AF37]/30 bg-[#133624] shadow-xl relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="bg-[#1B4731] text-[#D4AF37] text-xs font-semibold px-3 py-1 rounded-full border border-[#D4AF37]/40 flex items-center gap-1.5">
                  <Sparkles size={13} />
                  <span>AI 1인분 레시피</span>
                </span>
                <span className="bg-[#1B4731] text-[#E7E2D3] text-xs px-3 py-1 rounded-full border border-[#D4AF37]/20">
                  난이도: {recipe.difficulty}
                </span>
              </div>

              {/* Bookmark Button */}
              <button
                onClick={handleToggleBookmark}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  bookmarked
                    ? 'bg-[#D4AF37] text-[#1B4731] border-[#D4AF37] shadow-sm'
                    : 'bg-[#1B4731] text-[#E7E2D3] border-[#D4AF37]/30 hover:text-[#FDFBF4] hover:border-[#D4AF37]'
                }`}
                title={bookmarked ? '북마크 해제' : '레시피 북마크 저장'}
              >
                <Bookmark size={14} fill={bookmarked ? 'currentColor' : 'none'} />
                <span>{bookmarked ? '저장됨' : '북마크'}</span>
              </button>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-[#FDFBF4] tracking-tight leading-snug">
              {recipe.title}
            </h1>
            <p className="text-[#E7E2D3] text-sm leading-relaxed">
              {recipe.description}
            </p>

            {/* Stats bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-[#1B4731] px-3.5 py-3 rounded-2xl flex items-center gap-3 border border-[#D4AF37]/25">
                <Users size={18} className="text-[#D4AF37] shrink-0" />
                <div className="flex flex-col justify-center">
                  <span className="text-[10px] text-[#D9D2BE] leading-tight">기준</span>
                  <span className="text-xs font-semibold text-[#FDFBF4] leading-tight mt-0.5">{recipe.servingSize}인분</span>
                </div>
              </div>
              <div className="bg-[#1B4731] px-3.5 py-3 rounded-2xl flex items-center gap-3 border border-[#D4AF37]/25">
                <Clock size={18} className="text-[#D4AF37] shrink-0" />
                <div className="flex flex-col justify-center">
                  <span className="text-[10px] text-[#D9D2BE] leading-tight">조리시간</span>
                  <span className="text-xs font-semibold text-[#FDFBF4] leading-tight mt-0.5">{recipe.cookTimeMinutes}분</span>
                </div>
              </div>
              <div className="bg-[#1B4731] px-3.5 py-3 rounded-2xl flex items-center gap-3 border border-[#D4AF37]/25">
                <DollarSign size={18} className="text-[#D4AF37] shrink-0" />
                <div className="flex flex-col justify-center">
                  <span className="text-[10px] text-[#D9D2BE] leading-tight">예상 비용</span>
                  <span className="text-xs font-semibold text-[#FDFBF4] leading-tight mt-0.5">{recipe.estimatedCost.toLocaleString()}원</span>
                </div>
              </div>
              <div className="bg-[#1B4731] px-3.5 py-3 rounded-2xl flex items-center gap-3 border border-[#D4AF37]/25">
                <Flame size={18} className="text-[#D4AF37] shrink-0" />
                <div className="flex flex-col justify-center">
                  <span className="text-[10px] text-[#D9D2BE] leading-tight">난이도</span>
                  <span className="text-xs font-semibold text-[#FDFBF4] leading-tight mt-0.5">{recipe.difficulty}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Ingredients & Cart CTA */}
          <div className="p-6 rounded-3xl flex flex-col gap-5 border border-[#D4AF37]/30 bg-[#133624] shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#FDFBF4] flex items-center gap-2">
                  <ShoppingCart size={18} className="text-[#D4AF37]" />
                  <span>필수 재료 목록</span>
                  <span className="text-xs font-normal text-[#D9D2BE]">
                    ({selectedCount}/{recipe.ingredients.length}개 선택됨)
                  </span>
                </h2>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={selectedCount === 0}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all ${
                  selectedCount === 0
                    ? 'bg-[#1B4731] text-[#D9D2BE]/60 cursor-not-allowed border border-[#D4AF37]/20'
                    : added
                    ? 'bg-emerald-600 text-[#FDFBF4]'
                    : 'bg-[#D4AF37] hover:bg-[#C49F2C] text-[#1B4731] active:scale-98'
                }`}
              >
                <ShoppingBag size={15} />
                <span>
                  {added
                    ? '장바구니 담기 완료'
                    : `선택 재료 장바구니 담기 (${selectedCount}개)`}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-[#D9D2BE]/80">
              <Info size={13} className="text-[#D4AF37] shrink-0" />
              <span>집에 이미 있는 재료는 체크를 해제하면 장바구니에서 제외됩니다.</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {recipe.ingredients.map((ing) => {
                const isChecked = !!checkedIngredients[ing.ingredientId];
                return (
                  <div
                    key={ing.ingredientId}
                    onClick={() => toggleIngredient(ing.ingredientId)}
                    className={`px-4 py-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-200 select-none ${
                      isChecked
                        ? 'bg-[#1B4731] border-[#D4AF37]/50 text-[#FDFBF4] shadow-sm hover:border-[#D4AF37]'
                        : 'bg-[#1B4731]/40 border-[#D4AF37]/15 text-[#D9D2BE]/50 opacity-60 hover:opacity-80'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {isChecked ? (
                        <CheckSquare size={17} className="text-[#D4AF37] shrink-0" />
                      ) : (
                        <Square size={17} className="text-[#D9D2BE]/40 shrink-0" />
                      )}
                      <span
                        className={`text-sm font-medium leading-normal flex items-center truncate ${
                          isChecked ? 'text-[#FDFBF4] font-semibold' : 'text-[#D9D2BE]/50 line-through'
                        }`}
                      >
                        {ing.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-xs leading-normal font-semibold ${
                          isChecked ? 'text-[#D4AF37]' : 'text-[#D9D2BE]/40 line-through'
                        }`}
                      >
                        {ing.amount} {ing.unit}
                      </span>
                      {!isChecked && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#133624] text-[#D9D2BE]/60 font-medium border border-[#D4AF37]/20">
                          제외
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Cooking Steps */}
          <div className="p-6 rounded-3xl flex flex-col gap-5 border border-[#D4AF37]/30 bg-[#133624] shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#FDFBF4] flex items-center gap-2">
                <ChefHat size={18} className="text-[#D4AF37]" />
                <span>조리 순서</span>
              </h2>

              {/* Unified Timer Sound Selector at top right */}
              <div className="relative" ref={soundMenuRef}>
                <button
                  onClick={() => setShowSoundMenu((prev) => !prev)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1B4731] hover:bg-[#1B4731]/80 text-[#E7E2D3] hover:text-[#FDFBF4] border border-[#D4AF37]/30 text-xs font-medium transition-all shadow-sm"
                  title="조리 타이머 완료음 설정"
                >
                  <Volume2 size={13} className="text-[#D4AF37]" />
                  <span className="text-[11px] text-[#D9D2BE] hidden sm:inline">알람음:</span>
                  <span className="font-semibold text-[#FDFBF4]">
                    {TIMER_SOUND_OPTIONS.find((s) => s.id === soundType)?.name}
                  </span>
                  <ChevronDown
                    size={12}
                    className={`text-[#D9D2BE] transition-transform ${showSoundMenu ? 'rotate-180 text-[#D4AF37]' : ''}`}
                  />
                </button>

                {showSoundMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 p-2 rounded-2xl bg-[#133624] border border-[#D4AF37]/40 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-2.5 py-1 mb-1 text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">
                      타이머 완료음 설정
                    </div>
                    <div className="space-y-1">
                      {TIMER_SOUND_OPTIONS.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => handleSelectSound(option.id)}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all text-left ${
                            soundType === option.id
                              ? 'bg-[#D4AF37] text-[#1B4731] font-semibold'
                              : 'text-[#E7E2D3] hover:bg-[#1B4731] hover:text-[#FDFBF4]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{option.name}</span>
                          </div>
                          {soundType === option.id && <Check size={13} className="text-[#1B4731]" />}
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-[#D4AF37]/20 px-2 text-[10px] text-[#D9D2BE] text-center">
                      선택 시 알람 소리를 미리 들려드립니다
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3.5">
              {recipe.steps.map((step) => {
                const cleanDescription = step.description
                  ? step.description.split(/\n?💡/)[0].replace(/^💡.*/, '').trim()
                  : '';

                // 타이머 존재 여부 판별 (0초이거나 없으면 false)
                const hasTimer = typeof step.timerSeconds === 'number' && step.timerSeconds > 0;

                return (
                  <div
                    key={step.order}
                    className="p-4 sm:p-5 rounded-2xl border border-[#D4AF37]/20 bg-[#1B4731] transition-all flex flex-col sm:flex-row gap-4 justify-between items-center hover:border-[#D4AF37]/40"
                  >
                    {/* Step order & Text - Vertically centered in container */}
                    <div className="flex gap-3.5 items-center flex-1 min-w-0 w-full sm:w-auto">
                      <span className="w-7 h-7 rounded-full bg-[#D4AF37] text-[#1B4731] font-bold text-xs flex items-center justify-center shrink-0 shadow">
                        {step.order}
                      </span>
                      <p className="text-[#FDFBF4] text-sm leading-relaxed font-medium flex-1 my-auto">
                        {cleanDescription}
                      </p>
                    </div>

                    {/* 0초일 때는 완전히 비워두고, 양수 시간일 때만 타이머 위젯 렌더링 */}
                    {hasTimer ? (
                      <div className="shrink-0 self-center">
                        <CookingTimer seconds={step.timerSeconds!} stepOrder={step.order} />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Footer inside right scrollable column */}
          <div className="py-6 text-center text-xs text-[#D9D2BE]/70 border-t border-[#D4AF37]/20 mt-2 mb-4">
            © 2026 혼밥레시피 — 자취생 맞춤 AI 레시피 플랫폼. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};
