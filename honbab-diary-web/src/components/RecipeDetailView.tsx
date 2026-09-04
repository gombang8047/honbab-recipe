'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import Link from 'next/link';
import { shortsApi } from '@/services/shortsApi';
import { soundService } from '@/services/soundService';

interface RecipeDetailViewProps {
  recipe: RecipeDetail;
  onAddToCart: (recipeId: number) => void;
}

export const RecipeDetailView: React.FC<RecipeDetailViewProps> = ({ recipe, onAddToCart }) => {
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});
  const [added, setAdded] = useState(false);
  const [bookmarked, setBookmarked] = useState<boolean>(false);

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
              <div className="bg-slate-950/60 p-3 rounded-2xl flex items-center gap-3 border border-slate-800">
                <Users size={18} className="text-orange-400" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500">기준</span>
                  <span className="text-xs font-semibold text-slate-200">{recipe.servingSize}인분</span>
                </div>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-2xl flex items-center gap-3 border border-slate-800">
                <Clock size={18} className="text-amber-400" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500">조리시간</span>
                  <span className="text-xs font-semibold text-slate-200">{recipe.cookTimeMinutes}분</span>
                </div>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-2xl flex items-center gap-3 border border-slate-800">
                <DollarSign size={18} className="text-emerald-400" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500">예상 비용</span>
                  <span className="text-xs font-semibold text-slate-200">{recipe.estimatedCost.toLocaleString()}원</span>
                </div>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-2xl flex items-center gap-3 border border-slate-800">
                <Flame size={18} className="text-red-400" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500">난이도</span>
                  <span className="text-xs font-semibold text-slate-200">{recipe.difficulty}</span>
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
                    className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-slate-900/40 border-slate-800 text-slate-500 line-through'
                        : 'bg-slate-950/70 border-slate-800/80 text-slate-200 hover:border-orange-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isChecked ? <CheckSquare size={16} className="text-slate-600" /> : <Square size={16} className="text-orange-400" />}
                      <span className="text-sm font-medium">{ing.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-400">
                      {ing.amount} {ing.unit}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Cooking Steps */}
          <div className="glass-panel p-6 rounded-3xl flex flex-col gap-5 border border-slate-800 bg-slate-900/60 shadow-xl">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>👨‍🍳 조리 순서</span>
            </h2>

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
                    className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center ${
                      hasTimer
                        ? 'bg-slate-900/80 border-slate-700/80 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800/80'
                    }`}
                  >
                    {/* Step order & Text */}
                    <div className="flex gap-3.5 items-start flex-1 min-w-0">
                      <span className="w-7 h-7 rounded-full bg-orange-500 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow">
                        {step.order}
                      </span>
                      <p className="text-slate-200 text-sm leading-relaxed font-medium">
                        {cleanDescription}
                      </p>
                    </div>

                    {/* 0초일 때는 완전히 비워두고, 양수 시간일 때만 타이머 위젯 렌더링 */}
                    {hasTimer ? (
                      <div className="shrink-0 self-end sm:self-center">
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
