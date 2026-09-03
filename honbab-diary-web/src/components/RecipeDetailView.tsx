'use client';

import React, { useState } from 'react';
import { RecipeDetail } from '@/services/recipeApi';
import { CookingTimer } from './CookingTimer';
import { ShoppingBag, Users, Clock, Flame, DollarSign, CheckSquare, Square, ChevronLeft, Youtube, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface RecipeDetailViewProps {
  recipe: RecipeDetail;
  onAddToCart: (recipeId: number) => void;
}

export const RecipeDetailView: React.FC<RecipeDetailViewProps> = ({ recipe, onAddToCart }) => {
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});
  const [added, setAdded] = useState(false);

  const toggleIngredient = (id: number) => {
    setCheckedIngredients(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddToCart = () => {
    setAdded(true);
    onAddToCart(recipe.id);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-8">
      {/* Back button */}
      <Link href="/" className="inline-flex items-center gap-1 text-slate-400 hover:text-white text-sm transition-colors">
        <ChevronLeft size={18} />
        <span>쇼츠 피드로 돌아가기</span>
      </Link>

      {/* Header Info */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col gap-4 border border-orange-500/30">
        <div className="flex items-center gap-2">
          <span className="bg-orange-500/20 text-orange-400 text-xs font-semibold px-3 py-1 rounded-full border border-orange-500/40">
            🤖 AI 변환 완료
          </span>
          <span className="bg-slate-800 text-slate-300 text-xs px-3 py-1 rounded-full">
            난이도: {recipe.difficulty}
          </span>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
          {recipe.title}
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed">
          {recipe.description}
        </p>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <div className="bg-slate-900/60 p-3 rounded-2xl flex items-center gap-3 border border-slate-800">
            <Users size={20} className="text-orange-400" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500">기준</span>
              <span className="text-xs font-semibold text-slate-200">{recipe.servingSize}인분</span>
            </div>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-2xl flex items-center gap-3 border border-slate-800">
            <Clock size={20} className="text-amber-400" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500">조리시간</span>
              <span className="text-xs font-semibold text-slate-200">{recipe.cookTimeMinutes}분</span>
            </div>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-2xl flex items-center gap-3 border border-slate-800">
            <DollarSign size={20} className="text-emerald-400" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500">예상 비용</span>
              <span className="text-xs font-semibold text-slate-200">{recipe.estimatedCost.toLocaleString()}원</span>
            </div>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-2xl flex items-center gap-3 border border-slate-800">
            <Flame size={20} className="text-red-400" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500">조리 난이도</span>
              <span className="text-xs font-semibold text-slate-200">{recipe.difficulty}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Shorts Video Player if available */}
      {recipe.shortsYoutubeId && (
        <div className="glass-panel p-6 rounded-3xl flex flex-col gap-4 border border-slate-800">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Youtube size={20} className="text-red-500" />
              <span>원본 쇼츠 영상 보며 따라하기</span>
            </h2>
            <a
              href={`https://www.youtube.com/shorts/${recipe.shortsYoutubeId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 transition-colors"
            >
              <span>유튜브에서 열기</span>
              <ExternalLink size={12} />
            </a>
          </div>

          <div className="relative w-full max-w-[340px] mx-auto aspect-[9/16] rounded-2xl overflow-hidden bg-black shadow-2xl border border-slate-700/60">
            <iframe
              src={`https://www.youtube.com/embed/${recipe.shortsYoutubeId}?rel=0&playsinline=1`}
              title="원본 쇼츠 영상"
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Ingredients & Cart CTA */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>🛒 필수 재료 목록</span>
            <span className="text-xs font-normal text-slate-400">({recipe.ingredients.length}개)</span>
          </h2>

          <button
            onClick={handleAddToCart}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all ${
              added
                ? 'bg-emerald-500 text-white'
                : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:brightness-110'
            }`}
          >
            <ShoppingBag size={16} />
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
                    : 'bg-slate-900/80 border-slate-700/60 text-slate-200 hover:border-orange-500/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isChecked ? <CheckSquare size={18} className="text-slate-600" /> : <Square size={18} className="text-orange-400" />}
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

      {/* Cooking Steps */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col gap-6">
        <h2 className="text-lg font-bold text-white">👨‍🍳 조리 순서</h2>

        <div className="flex flex-col gap-4">
          {recipe.steps.map((step) => {
            const cleanDescription = step.description
              ? step.description.split(/\n?💡/)[0].replace(/^💡.*/, '').trim()
              : '';

            return (
              <div key={step.order} className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="flex gap-4 items-start">
                  <span className="w-7 h-7 rounded-full bg-orange-500 text-white font-bold text-sm flex items-center justify-center shrink-0">
                    {step.order}
                  </span>
                  <p className="text-slate-200 text-sm leading-relaxed font-medium">
                    {cleanDescription}
                  </p>
                </div>

                {step.timerSeconds && step.timerSeconds > 0 && (
                  <div className="self-end md:self-center">
                    <CookingTimer seconds={step.timerSeconds} stepOrder={step.order} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
