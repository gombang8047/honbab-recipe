import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { RecipeDetail } from '@/services/recipeApi';
import { CookingTimer } from './CookingTimer';
import { diaryService, CookingDiaryEntry, LEVEL_TIERS } from '@/services/diaryService';
import { settingsService } from '@/services/settingsService';
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
  Camera,
  Star,
  Award,
  MessageSquare,
  Lock,
  X,
  ShieldAlert,
  AlertTriangle,
  PictureInPicture2,
  Maximize2,
  GripHorizontal,
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
  const [selectedUserProfile, setSelectedUserProfile] = useState<{
    nickname: string;
    level: number;
    levelTitle: string;
    streakDay: number;
  } | null>(null);
  const [diaries, setDiaries] = useState<CookingDiaryEntry[]>([]);
  const [isPipMode, setIsPipMode] = useState<boolean>(false);
  const [pipPos, setPipPos] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingPip, setIsDraggingPip] = useState<boolean>(false);
  const pipRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);

  const handleLeftWheel = (e: React.WheelEvent) => {
    if (rightScrollRef.current) {
      rightScrollRef.current.scrollTop += e.deltaY;
    }
  };

  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  });

  const updatePipPos = useCallback((clientX: number, clientY: number) => {
    const deltaX = clientX - dragStartRef.current.startX;
    const deltaY = clientY - dragStartRef.current.startY;
    const pipW = pipRef.current?.offsetWidth || 180;
    const pipH = pipRef.current?.offsetHeight || 320;
    const padding = 10;
    const minX = padding;
    const maxX = Math.max(padding, window.innerWidth - pipW - padding);
    const minY = padding;
    const maxY = Math.max(padding, window.innerHeight - pipH - padding);

    const nextX = Math.min(Math.max(minX, dragStartRef.current.initialX + deltaX), maxX);
    const nextY = Math.min(Math.max(minY, dragStartRef.current.initialY + deltaY), maxY);

    setPipPos({ x: nextX, y: nextY });
  }, []);

  const startPipDrag = (clientX: number, clientY: number) => {
    if (!pipRef.current) return;
    const rect = pipRef.current.getBoundingClientRect();
    dragStartRef.current = {
      startX: clientX,
      startY: clientY,
      initialX: rect.left,
      initialY: rect.top,
    };
    setIsDraggingPip(true);
  };

  useEffect(() => {
    if (!isDraggingPip) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      updatePipPos(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      setIsDraggingPip(false);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        updatePipPos(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleTouchEnd = () => {
      setIsDraggingPip(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isDraggingPip, updatePipPos]);

  const soundMenuRef = useRef<HTMLDivElement>(null);

  // 기피 식재료 & 알레르기 설정 조회 및 실시간 감지
  const [dietarySettings, setDietarySettings] = useState(() => settingsService.getSettings().dietary);

  useEffect(() => {
    const handleSettingsChange = (e: any) => {
      if (e.detail?.dietary) {
        setDietarySettings(e.detail.dietary);
      } else {
        setDietarySettings(settingsService.getSettings().dietary);
      }
    };
    window.addEventListener('honbab-settings-changed', handleSettingsChange);
    return () => window.removeEventListener('honbab-settings-changed', handleSettingsChange);
  }, []);

  // 알레르기 유발 식재료 매칭
  const matchedAllergies = useMemo(() => {
    const userAllergies = dietarySettings.allergies || [];
    if (userAllergies.length === 0) return [];
    return userAllergies.filter((allergy) =>
      recipe.ingredients.some((ing) => ing.name.includes(allergy) || allergy.includes(ing.name)) ||
      recipe.title.includes(allergy)
    );
  }, [dietarySettings, recipe]);

  // 기피 식재료 매칭
  const matchedDislikes = useMemo(() => {
    const userDislikes = dietarySettings.dislikedIngredients || [];
    if (userDislikes.length === 0) return [];
    return userDislikes.filter((dislike) =>
      recipe.ingredients.some((ing) => ing.name.includes(dislike) || dislike.includes(ing.name)) ||
      recipe.title.includes(dislike)
    );
  }, [dietarySettings, recipe]);

  const isIngredientAllergy = (name: string) => {
    const userAllergies = dietarySettings.allergies || [];
    return userAllergies.some((allergy) => name.includes(allergy) || allergy.includes(name));
  };

  const isIngredientDisliked = (name: string) => {
    const userDislikes = dietarySettings.dislikedIngredients || [];
    return userDislikes.some((dislike) => name.includes(dislike) || dislike.includes(name));
  };

  const targetShortsId = recipe.shortsId || recipe.id;

  // 일기 목록 로드 및 실시간 동기화
  useEffect(() => {
    setDiaries(diaryService.getDiariesByRecipe(recipe.id));

    const handleDiaryChanged = () => {
      setDiaries(diaryService.getDiariesByRecipe(recipe.id));
    };

    window.addEventListener('diary-added', handleDiaryChanged as EventListener);
    window.addEventListener('diary-updated', handleDiaryChanged as EventListener);
    return () => {
      window.removeEventListener('diary-added', handleDiaryChanged as EventListener);
      window.removeEventListener('diary-updated', handleDiaryChanged as EventListener);
    };
  }, [recipe.id]);

  const handleToggleLike = (diaryId: string) => {
    soundService.playButtonClick();
    const updated = diaryService.toggleLike(diaryId);
    setDiaries(updated.filter((d) => d.recipeId === recipe.id));
  };

  useEffect(() => {
    // Check initial bookmark status from local storage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('honbab_local_bookmarks');
      if (saved) {
        try {
          const list = JSON.parse(saved);
          setBookmarked(list.some((s: any) => s.id === targetShortsId));
        } catch { }
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
        {recipe.shortsYoutubeId && (() => {
          const rawId = recipe.shortsYoutubeId;
          const cleanId = (!rawId || rawId.startsWith('mock_'))
            ? 'c7pQG-x5D68'
            : (rawId.match(/(?:shorts\/|v=|youtu\.be\/|embed\/)?([a-zA-Z0-9_-]{11})/)?.[1] || rawId);
          const origin = typeof window !== 'undefined' ? window.location.origin : '';
          const embedUrl = `https://www.youtube.com/embed/${encodeURIComponent(cleanId)}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1&enablejsapi=1${origin ? `&origin=${encodeURIComponent(origin)}` : ''}`;

          return (
            <div
              onWheel={handleLeftWheel}
              className="lg:col-span-5 xl:col-span-5 lg:h-full lg:flex lg:flex-col lg:justify-start lg:min-h-0"
            >
              <div className="p-4 sm:p-5 rounded-3xl flex flex-col gap-3 border border-[#D4AF37]/30 bg-[#133624] shadow-2xl lg:h-full lg:min-h-0 overflow-hidden">
                <div className="flex items-center justify-between shrink-0">
                  <h2 className="text-sm font-bold text-[#FDFBF4] flex items-center gap-2">
                    <Youtube size={18} className="text-[#D4AF37]" />
                    <span>원본 쇼츠 영상</span>
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPipMode(!isPipMode)}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 transition-all ${isPipMode
                          ? 'bg-[#D4AF37] text-[#0D2418] border-[#D4AF37] font-bold shadow-md'
                          : 'bg-[#1B4731] text-[#D4AF37] border-[#D4AF37]/40 hover:bg-[#D4AF37]/20'
                        }`}
                      title={isPipMode ? "원래 위치로 복귀" : "화면 구석 미니 플레이어(PiP)로 보기"}
                    >
                      <PictureInPicture2 size={13} />
                      <span>{isPipMode ? 'PiP 켜짐' : 'PiP 모드'}</span>
                    </button>
                    <a
                      href={`https://www.youtube.com/shorts/${cleanId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#D4AF37] hover:underline flex items-center gap-1 transition-colors font-medium ml-1"
                    >
                      <span>유튜브</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>

                {/* 9:16 Shorts Player - Vertically and horizontally centered without overflowing card on large screens */}
                <div className="flex-1 min-h-0 w-full flex items-center justify-center py-1">
                  {!isPipMode ? (
                    <div className="relative w-full max-w-[340px] xl:max-w-[360px] aspect-[9/16] max-h-[min(650px,calc(100vh-13rem))] mx-auto rounded-2xl overflow-hidden bg-black shadow-2xl border border-[#D4AF37]/25 shrink-0">
                      <iframe
                        src={embedUrl}
                        title="원본 쇼츠 영상"
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="w-full max-w-[280px] sm:max-w-[340px] xl:max-w-[360px] mx-auto aspect-[9/16] max-h-[260px] rounded-2xl bg-[#0D2418]/90 border border-dashed border-[#D4AF37]/40 flex flex-col items-center justify-center p-4 text-center gap-3 shrink-0">
                      <div className="w-12 h-12 rounded-full bg-[#1B4731] flex items-center justify-center text-[#D4AF37] shadow-inner">
                        <PictureInPicture2 size={24} className="animate-pulse" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#FDFBF4]">미니 플레이어로 재생 중</p>
                        <p className="text-[11px] text-[#D9D2BE]/80 mt-1">
                          화면 우측 하단에서 영상이 계속 재생됩니다.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsPipMode(false)}
                        className="text-xs px-3 py-1.5 rounded-xl bg-[#D4AF37] text-[#0D2418] font-bold hover:bg-[#c39f2f] transition-all flex items-center gap-1.5 shadow-md"
                      >
                        <Maximize2 size={13} />
                        <span>원래 위치로 복귀</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* =========================================================================
            우측: 레시피 본문 (PC에서는 독립 스크롤되어 좌측 영상이 움직이지 않음)
           ========================================================================= */}
        <div
          ref={rightScrollRef}
          className={`${recipe.shortsYoutubeId ? 'lg:col-span-7 xl:col-span-7' : 'w-full'} flex flex-col gap-6 lg:h-full lg:overflow-y-auto lg:pr-3 lg:pb-6 custom-scrollbar min-h-0`}
        >
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
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${bookmarked
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

            {/* Dietary Warnings Banner (기피 식재료 & 알레르기 주의 안내 배지) */}
            {(matchedAllergies.length > 0 || matchedDislikes.length > 0) && (
              <div className="flex flex-col gap-2 pt-2 border-t border-[#D4AF37]/20">
                {matchedAllergies.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-200 flex items-start gap-2.5 text-xs shadow-sm animate-in fade-in duration-300">
                    <ShieldAlert size={18} className="text-rose-400 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <span className="font-bold text-rose-300">🚨 식품 알레르기 주의 배지: </span>
                      마이페이지에 등록하신 알레르기 유발 식재료(<strong>{matchedAllergies.join(', ')}</strong>)가 포함된 요리입니다. 조리 및 섭취 시 각별히 주의하세요!
                    </div>
                  </div>
                )}
                {matchedDislikes.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-orange-500/15 border border-orange-500/40 text-orange-200 flex items-start gap-2.5 text-xs shadow-sm animate-in fade-in duration-300">
                    <AlertTriangle size={18} className="text-orange-400 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <span className="font-bold text-orange-300">⚠️ 기피 식재료 주의 배지: </span>
                      평소 피하시는 식재료(<strong>{matchedDislikes.join(', ')}</strong>)가 포함되어 있습니다. 필요 시 다른 대체 재료를 사용해 보세요.
                    </div>
                  </div>
                )}
              </div>
            )}
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
                className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all ${selectedCount === 0
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
                const hasAllergy = isIngredientAllergy(ing.name);
                const isDisliked = isIngredientDisliked(ing.name);

                return (
                  <div
                    key={ing.ingredientId}
                    onClick={() => toggleIngredient(ing.ingredientId)}
                    className={`px-4 py-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-200 select-none ${isChecked
                      ? hasAllergy
                        ? 'bg-rose-950/30 border-rose-500/50 text-[#FDFBF4] shadow-sm hover:border-rose-400'
                        : isDisliked
                          ? 'bg-amber-950/30 border-orange-500/50 text-[#FDFBF4] shadow-sm hover:border-orange-400'
                          : 'bg-[#1B4731] border-[#D4AF37]/50 text-[#FDFBF4] shadow-sm hover:border-[#D4AF37]'
                      : 'bg-[#1B4731]/40 border-[#D4AF37]/15 text-[#D9D2BE]/50 opacity-60 hover:opacity-80'
                      }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isChecked ? (
                        <CheckSquare
                          size={17}
                          className={hasAllergy ? 'text-rose-400 shrink-0' : isDisliked ? 'text-orange-400 shrink-0' : 'text-[#D4AF37] shrink-0'}
                        />
                      ) : (
                        <Square size={17} className="text-[#D9D2BE]/40 shrink-0" />
                      )}
                      <span
                        className={`text-sm font-medium leading-normal flex items-center truncate ${isChecked ? 'text-[#FDFBF4] font-semibold' : 'text-[#D9D2BE]/50 line-through'
                          }`}
                      >
                        {ing.name}
                      </span>
                      {hasAllergy && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/25 text-rose-300 border border-rose-500/40 font-bold flex items-center gap-0.5 shrink-0">
                          <ShieldAlert size={10} />
                          <span>알레르기</span>
                        </span>
                      )}
                      {isDisliked && !hasAllergy && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-orange-500/25 text-orange-300 border border-orange-500/40 font-bold flex items-center gap-0.5 shrink-0">
                          <AlertTriangle size={10} />
                          <span>기피</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-xs leading-normal font-semibold ${isChecked
                          ? hasAllergy
                            ? 'text-rose-300'
                            : isDisliked
                              ? 'text-orange-300'
                              : 'text-[#D4AF37]'
                          : 'text-[#D9D2BE]/40 line-through'
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
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all text-left ${soundType === option.id
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

          {/* 4. Community Reviews & Tips Section (사생활 보호: 사진 없이 솔직 한줄평만 노출) */}
          <div className="p-6 rounded-3xl flex flex-col gap-5 border border-[#D4AF37]/30 bg-[#133624] shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#FDFBF4] flex items-center gap-2">
                <MessageSquare size={18} className="text-[#D4AF37]" />
                <span>자취생들의 솔직 한줄평 & 꿀팁</span>
                <span className="text-xs font-semibold text-[#D4AF37] bg-[#1B4731] px-2.5 py-0.5 rounded-full border border-[#D4AF37]/30">
                  {diaries.length}개
                </span>
              </h2>
            </div>

            {diaries.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#0D2418]/60 border border-[#D4AF37]/20 text-center flex flex-col items-center gap-2">
                <MessageSquare size={28} className="text-[#D4AF37]/60" />
                <p className="text-sm font-bold text-[#FDFBF4]">아직 등록된 한줄평이 없습니다.</p>
                <p className="text-xs text-[#D9D2BE]">
                  요리 후 마이페이지 일기장에 기록을 남기면 이곳에 한줄평이 공유됩니다.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {diaries.map((diary) => (
                  <div
                    key={diary.id}
                    className="p-4 rounded-2xl bg-[#1B4731] border border-[#D4AF37]/30 shadow-md flex flex-col justify-between gap-3 hover:border-[#D4AF37]/60 transition-all"
                  >
                    {/* User header with clickable profile */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => {
                          soundService.playButtonClick();
                          setSelectedUserProfile({
                            nickname: diary.userNickname,
                            level: diary.userLevel,
                            levelTitle: diary.userLevelTitle,
                            streakDay: diary.streakDay || 1,
                          });
                        }}
                        className="flex items-center gap-2.5 text-left group cursor-pointer transition-transform active:scale-95"
                        title="사용자 레벨 및 뱃지 보기"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#D4AF37] text-[#1B4731] font-bold text-xs flex items-center justify-center shadow group-hover:ring-2 ring-[#D4AF37] transition-all">
                          {diary.userNickname.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-[#FDFBF4] group-hover:text-[#D4AF37] transition-colors underline-offset-2 group-hover:underline">
                              {diary.userNickname}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0D2418] text-[#D4AF37] border border-[#D4AF37]/30 font-medium">
                              Lv.{diary.userLevel}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={11}
                                fill={i < diary.rating ? '#D4AF37' : 'none'}
                                className={i < diary.rating ? 'text-[#D4AF37]' : 'text-stone-600'}
                              />
                            ))}
                            <span className="text-[10px] text-[#D9D2BE] ml-1">
                              {new Date(diary.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </button>

                      {/* Likes button */}
                      <button
                        onClick={() => handleToggleLike(diary.id)}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 border transition-all ${diary.likedByMe
                          ? 'bg-[#D4AF37] text-[#1B4731] border-[#F3E5AB] shadow-sm'
                          : 'bg-[#0D2418] text-[#D9D2BE] border-[#D4AF37]/25 hover:border-[#D4AF37]'
                          }`}
                        title="맛있어 보여요!"
                      >
                        <span>😋</span>
                        <span>{diary.likes}</span>
                      </button>
                    </div>

                    {/* Review comment text */}
                    <div className="bg-[#0D2418]/70 p-3 rounded-xl border border-[#D4AF37]/15 text-xs text-[#E7E2D3] leading-relaxed italic">
                      &ldquo;{diary.comment}&rdquo;
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 다른 사용자 사생활 보호 미니 프로필 모달 (일기장은 비공개) */}
      {selectedUserProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedUserProfile(null)}
          />
          <div className="relative z-10 w-full max-w-sm bg-[#133624] border border-[#D4AF37]/50 rounded-3xl overflow-hidden shadow-2xl p-6 flex flex-col items-center text-center gap-4 animate-in zoom-in-95">
            {/* Close Button */}
            <button
              onClick={() => setSelectedUserProfile(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-black/50 text-[#D9D2BE] hover:text-white transition-colors"
            >
              <X size={16} />
            </button>

            {/* Avatar */}
            <div className="relative mt-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 p-0.5 shadow-xl">
                <div className="w-full h-full rounded-2xl bg-[#0D2418] flex items-center justify-center text-[#FDFBF4] text-2xl font-black">
                  {selectedUserProfile.nickname.charAt(0)}
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-[#D4AF37] text-[#1B4731] p-1 rounded-full shadow border-2 border-[#133624]">
                <Award size={13} />
              </div>
            </div>

            {/* Nickname & Level */}
            <div className="flex flex-col items-center gap-1.5">
              <h3 className="text-base font-extrabold text-[#FDFBF4]">
                {selectedUserProfile.nickname}
              </h3>
              {(() => {
                const tier = LEVEL_TIERS.find(t => t.level === selectedUserProfile.level) || LEVEL_TIERS[0];
                return (
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs px-3 py-1 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 font-bold flex items-center gap-1 shadow-sm">
                      <span>{tier.badgeEmoji}</span>
                      <span>Lv.{tier.level} {tier.title}</span>
                    </span>
                    <p className="text-[11px] text-[#D9D2BE] mt-0.5 max-w-[240px]">
                      {tier.description}
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* Streak Info */}
            {selectedUserProfile.streakDay > 0 && (
              <div className="w-full bg-[#1B4731] py-2 px-3 rounded-xl border border-[#D4AF37]/20 flex items-center justify-center gap-1.5 text-xs text-orange-400 font-semibold">
                <Flame size={14} className="text-orange-500 animate-pulse" />
                <span>연속 {selectedUserProfile.streakDay}일째 집밥 달성 중!</span>
              </div>
            )}

            {/* Privacy Notice */}
            <div className="w-full bg-[#0D2418] p-3 rounded-2xl border border-[#D4AF37]/20 flex items-center gap-2.5 text-left text-[11px] text-[#D9D2BE] mt-1">
              <Lock size={15} className="text-[#D4AF37] shrink-0" />
              <span>사생활 보호를 위해 사용자의 개인 요리 일기장 및 사진은 비공개 처리되어 있습니다.</span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          인앱 플로팅 PiP 미니 플레이어 (화면 구석에 고정되어 레시피/타이머와 동시 이용)
         ========================================================================= */}
      {isPipMode && recipe.shortsYoutubeId && (() => {
        const rawId = recipe.shortsYoutubeId;
        const cleanId = (!rawId || rawId.startsWith('mock_'))
          ? 'c7pQG-x5D68'
          : (rawId.match(/(?:shorts\/|v=|youtu\.be\/|embed\/)?([a-zA-Z0-9_-]{11})/)?.[1] || rawId);
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const embedUrl = `https://www.youtube.com/embed/${encodeURIComponent(cleanId)}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1&enablejsapi=1${origin ? `&origin=${encodeURIComponent(origin)}` : ''}`;

        return (
          <>
            {/* 드래그 중일 때 iframe이 마우스/터치 이벤트를 가로채지 못하도록 방지하는 오버레이 */}
            {isDraggingPip && (
              <div className="fixed inset-0 z-[55] cursor-grabbing select-none" />
            )}

            <div
              ref={pipRef}
              style={pipPos ? { left: `${pipPos.x}px`, top: `${pipPos.y}px` } : undefined}
              className={`fixed z-50 w-[175px] sm:w-[215px] flex flex-col rounded-2xl overflow-hidden shadow-2xl border-2 border-[#D4AF37] bg-[#133624] select-none ${!pipPos ? 'bottom-6 right-3 sm:right-6' : ''
                } ${isDraggingPip ? 'scale-105 opacity-95 shadow-[0_20px_50px_rgba(0,0,0,0.85)] ring-2 ring-[#D4AF37]/60' : 'transition-transform duration-150'}`}
            >
              {/* PiP 상단 헤더 바 (드래그 핸들) */}
              <div
                onMouseDown={(e) => {
                  if ((e.target as HTMLElement).closest('button')) return;
                  e.preventDefault();
                  startPipDrag(e.clientX, e.clientY);
                }}
                onTouchStart={(e) => {
                  if ((e.target as HTMLElement).closest('button')) return;
                  if (e.touches.length > 0) {
                    startPipDrag(e.touches[0].clientX, e.touches[0].clientY);
                  }
                }}
                className="flex items-center justify-between px-2.5 py-1.5 bg-[#0D2418] border-b border-[#D4AF37]/30 text-xs cursor-grab active:cursor-grabbing touch-none select-none"
              >
                <div className="flex items-center gap-1.5 text-[#D4AF37] font-bold pointer-events-none">
                  <GripHorizontal size={13} className="text-[#D4AF37]/80" />
                  <span className="text-[11px] tracking-tight">쇼츠 PiP</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsPipMode(false)}
                    className="p-1 rounded-md text-[#D9D2BE] hover:text-[#FDFBF4] hover:bg-[#1B4731] transition-colors"
                    title="원래 크기로 복귀"
                  >
                    <Maximize2 size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPipMode(false)}
                    className="p-1 rounded-md text-[#D9D2BE] hover:text-red-400 hover:bg-[#1B4731] transition-colors"
                    title="PiP 닫기"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>

              {/* PiP Video Iframe */}
              <div className="relative w-full aspect-[9/16] bg-black">
                <iframe
                  src={embedUrl}
                  title="쇼츠 PiP 미니 플레이어"
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>

              {/* PiP 하단 드래그 바 (모바일에서 엄지로 쉽게 이동 가능) */}
              <div
                onMouseDown={(e) => {
                  e.preventDefault();
                  startPipDrag(e.clientX, e.clientY);
                }}
                onTouchStart={(e) => {
                  if (e.touches.length > 0) {
                    startPipDrag(e.touches[0].clientX, e.touches[0].clientY);
                  }
                }}
                className="py-1 px-2 bg-[#0D2418] border-t border-[#D4AF37]/25 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none text-[10px] text-[#D9D2BE]/80 hover:text-[#D4AF37] gap-1 transition-colors"
              >
                <GripHorizontal size={12} />
                <span>꾹 누르고 이동</span>
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
};
