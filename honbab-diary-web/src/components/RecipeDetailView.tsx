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
  ChevronLeft,
  Youtube,
  ExternalLink,
  Bookmark,
  Volume2,
  ChevronDown,
  Check,
} from 'lucide-react';
import Link from 'next/link';
import { shortsApi } from '@/services/shortsApi';
import { soundService, TimerSoundType, TIMER_SOUND_OPTIONS } from '@/services/soundService';

interface RecipeDetailViewProps {
  recipe: RecipeDetail;
  onAddToCart: (recipeId: number) => void;
}

export const RecipeDetailView: React.FC<RecipeDetailViewProps> = ({ recipe, onAddToCart }) => {
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});
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

  const toggleIngredient = (id: number) => {
    setCheckedIngredients(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddToCart = () => {
    setAdded(true);
    onAddToCart(recipe.id);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Back button */}
      <Link href="/" className="inline-flex items-center gap-1 text-slate-400 hover:text-white text-sm transition-colors w-fit">
        <ChevronLeft size={18} />
        <span>쇼츠 피드로 돌아가기</span>
      </Link>

      {/* Main Split Layout: Left Video + Right Recipe */}
      <div className={`flex flex-col ${recipe.shortsYoutubeId ? 'lg:grid lg:grid-cols-12 gap-8' : 'gap-8'}`}>
        {/* =========================================================================
            좌측: 쇼츠 영상 플레이어 (PC에서는 스크롤 시 화면에 계속 고정 Sticky)
           ========================================================================= */}
        {recipe.shortsYoutubeId && (
          <div className="lg:col-span-5 xl:col-span-4 h-full relative">
            <div className="lg:sticky lg:top-24 flex flex-col gap-4">
              <div className="glass-panel p-4 sm:p-5 rounded-3xl flex flex-col gap-4 border border-slate-800 bg-slate-900/85 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Youtube size={18} className="text-red-500" />
                    <span>원본 쇼츠 영상</span>
                  </h2>
                  <a
                    href={`https://www.youtube.com/shorts/${recipe.shortsYoutubeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 transition-colors font-medium"
                  >
                    <span>유튜브 열기</span>
                    <ExternalLink size={12} />
                  </a>
                </div>

                {/* 9:16 Shorts Player - Fits comfortably within viewport */}
                <div className="relative w-full max-w-[340px] xl:max-w-[360px] mx-auto aspect-[9/16] max-h-[calc(100vh-170px)] rounded-2xl overflow-hidden bg-black shadow-2xl border border-slate-700/60">
                  <iframe
                    src={`https://www.youtube.com/embed/${recipe.shortsYoutubeId}?rel=0&playsinline=1`}
                    title="원본 쇼츠 영상"
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>

                <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                  💡 영상을 재생해두고 우측 레시피를 스크롤하며 조리해보세요!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            우측: 레시피 본문 (헤더, 재료, 조리 순서)
           ========================================================================= */}
        <div className={`${recipe.shortsYoutubeId ? 'lg:col-span-7 xl:col-span-8' : 'w-full'} flex flex-col gap-6`}>
          {/* 1. Header Info Card */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl flex flex-col gap-4 border border-orange-500/30 bg-slate-900/70 shadow-xl relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="bg-orange-500/20 text-orange-400 text-xs font-semibold px-3 py-1 rounded-full border border-orange-500/40">
                  🤖 AI 1인분 레시피
                </span>
                <span className="bg-slate-800 text-slate-300 text-xs px-3 py-1 rounded-full">
                  난이도: {recipe.difficulty}
                </span>
              </div>

              {/* Bookmark Button */}
              <button
                onClick={handleToggleBookmark}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  bookmarked
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                    : 'bg-slate-800/90 text-slate-300 border-slate-700 hover:text-white hover:border-slate-600'
                }`}
                title={bookmarked ? '북마크 해제' : '레시피 북마크 저장'}
              >
                <Bookmark size={14} fill={bookmarked ? 'currentColor' : 'none'} />
                <span>{bookmarked ? '저장됨' : '북마크'}</span>
              </button>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug">
              {recipe.title}
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              {recipe.description}
            </p>

            {/* Stats bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-slate-950/60 px-3.5 py-3 rounded-2xl flex items-center gap-3 border border-slate-800">
                <Users size={18} className="text-orange-400 shrink-0" />
                <div className="flex flex-col justify-center">
                  <span className="text-[10px] text-slate-500 leading-tight">기준</span>
                  <span className="text-xs font-semibold text-slate-200 leading-tight mt-0.5">{recipe.servingSize}인분</span>
                </div>
              </div>
              <div className="bg-slate-950/60 px-3.5 py-3 rounded-2xl flex items-center gap-3 border border-slate-800">
                <Clock size={18} className="text-amber-400 shrink-0" />
                <div className="flex flex-col justify-center">
                  <span className="text-[10px] text-slate-500 leading-tight">조리시간</span>
                  <span className="text-xs font-semibold text-slate-200 leading-tight mt-0.5">{recipe.cookTimeMinutes}분</span>
                </div>
              </div>
              <div className="bg-slate-950/60 px-3.5 py-3 rounded-2xl flex items-center gap-3 border border-slate-800">
                <DollarSign size={18} className="text-emerald-400 shrink-0" />
                <div className="flex flex-col justify-center">
                  <span className="text-[10px] text-slate-500 leading-tight">예상 비용</span>
                  <span className="text-xs font-semibold text-slate-200 leading-tight mt-0.5">{recipe.estimatedCost.toLocaleString()}원</span>
                </div>
              </div>
              <div className="bg-slate-950/60 px-3.5 py-3 rounded-2xl flex items-center gap-3 border border-slate-800">
                <Flame size={18} className="text-red-400 shrink-0" />
                <div className="flex flex-col justify-center">
                  <span className="text-[10px] text-slate-500 leading-tight">난이도</span>
                  <span className="text-xs font-semibold text-slate-200 leading-tight mt-0.5">{recipe.difficulty}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Ingredients & Cart CTA */}
          <div className="glass-panel p-6 rounded-3xl flex flex-col gap-5 border border-slate-800 bg-slate-900/60 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🛒 필수 재료 목록</span>
                <span className="text-xs font-normal text-slate-400">({recipe.ingredients.length}개)</span>
              </h2>

              <button
                onClick={handleAddToCart}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all ${
                  added
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:brightness-110'
                }`}
              >
                <ShoppingBag size={15} />
                <span>{added ? '장바구니 담기 완료! ✨' : '모든 재료 장바구니 담기'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {recipe.ingredients.map((ing) => {
                const isChecked = !!checkedIngredients[ing.ingredientId];
                return (
                  <div
                    key={ing.ingredientId}
                    onClick={() => toggleIngredient(ing.ingredientId)}
                    className={`px-4 py-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-slate-900/40 border-slate-800 text-slate-500 line-through'
                        : 'bg-slate-950/70 border-slate-800/80 text-slate-200 hover:border-orange-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isChecked ? <CheckSquare size={16} className="text-slate-600 shrink-0" /> : <Square size={16} className="text-orange-400 shrink-0" />}
                      <span className="text-sm font-medium leading-normal flex items-center">{ing.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-400 leading-normal flex items-center">
                      {ing.amount} {ing.unit}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Cooking Steps */}
          <div className="glass-panel p-6 rounded-3xl flex flex-col gap-5 border border-slate-800 bg-slate-900/60 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>👨‍🍳 조리 순서</span>
              </h2>

              {/* Unified Timer Sound Selector at top right */}
              <div className="relative" ref={soundMenuRef}>
                <button
                  onClick={() => setShowSoundMenu((prev) => !prev)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-all shadow-sm"
                  title="조리 타이머 완료음 설정"
                >
                  <Volume2 size={13} className="text-orange-400" />
                  <span className="text-[11px] text-slate-400 hidden sm:inline">알람음:</span>
                  <span className="font-semibold text-slate-200">
                    {TIMER_SOUND_OPTIONS.find((s) => s.id === soundType)?.icon}{' '}
                    {TIMER_SOUND_OPTIONS.find((s) => s.id === soundType)?.name}
                  </span>
                  <ChevronDown
                    size={12}
                    className={`text-slate-400 transition-transform ${showSoundMenu ? 'rotate-180 text-orange-400' : ''}`}
                  />
                </button>

                {showSoundMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 p-2 rounded-2xl bg-slate-900/95 border border-slate-700 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-2.5 py-1 mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      타이머 완료음 설정
                    </div>
                    <div className="space-y-1">
                      {TIMER_SOUND_OPTIONS.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => handleSelectSound(option.id)}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all text-left ${
                            soundType === option.id
                              ? 'bg-orange-500/20 text-orange-400 font-semibold border border-orange-500/30'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{option.icon}</span>
                            <span>{option.name}</span>
                          </div>
                          {soundType === option.id && <Check size={13} className="text-orange-400" />}
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-slate-800 px-2 text-[10px] text-slate-400 text-center">
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
                    className="p-4 sm:p-5 rounded-2xl border border-slate-800/80 bg-slate-950/60 transition-all flex flex-col sm:flex-row gap-4 justify-between items-center hover:border-slate-700/80"
                  >
                    {/* Step order & Text - Vertically centered in container */}
                    <div className="flex gap-3.5 items-center flex-1 min-w-0 w-full sm:w-auto">
                      <span className="w-7 h-7 rounded-full bg-orange-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow">
                        {step.order}
                      </span>
                      <p className="text-slate-200 text-sm leading-relaxed font-medium flex-1 my-auto">
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
        </div>
      </div>
    </div>
  );
};
