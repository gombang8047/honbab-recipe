'use client';

import React, { useState, useEffect } from 'react';
import { ShortsItem, shortsApi } from '@/services/shortsApi';
import { recipeApi } from '@/services/recipeApi';
import { ShortsCard } from '@/components/ShortsCard';
import { AiConversionModal } from '@/components/AiConversionModal';
import { useRouter } from 'next/navigation';
import { Sparkles, Flame, TrendingUp, Filter } from 'lucide-react';

export default function HomePage() {
  const [shortsList, setShortsList] = useState<ShortsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [convertingShorts, setConvertingShorts] = useState<ShortsItem | null>(null);
  const router = useRouter();

  useEffect(() => {
    shortsApi.getFeed().then((data) => {
      setShortsList(data);
      setLoading(false);
    });
  }, []);

  const handleConvertAi = async (shorts: ShortsItem) => {
    setConvertingShorts(shorts);
    try {
      const recipe = await recipeApi.convertToRecipe(shorts.id);
      router.push(`/recipe/${recipe.id}`);
    } catch {
      router.push(`/recipe/1`);
    } finally {
      setConvertingShorts(null);
    }
  };

  const tags = ['ALL', '자취요리', '계란볶음밥', '김치볶음밥', '전자레인지', '원팬요리'];

  const filteredList = selectedTag === 'ALL'
    ? shortsList
    : shortsList.filter(s => s.tags.includes(selectedTag));

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-8">
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 p-8 md:p-12 text-white shadow-2xl flex flex-col gap-4">
        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full w-fit text-xs font-semibold text-amber-100 border border-white/30">
          <Sparkles size={14} />
          <span>AI 레시피 자동 변환 엔진 적용</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
          쇼츠 보고 3분만에<br />1인분 레시피 완성 🍳
        </h1>
        <p className="text-orange-100 text-sm md:text-base max-w-xl">
          유튜브 60초 요리 영상에서 재료 목록과 조리 순서를 AI가 추출해드립니다. 필요한 재료는 쿠팡/네이버 장바구니로 한 번에 연동!
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4 overflow-x-auto pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-orange-400" />
          <span className="text-xs font-semibold text-slate-400">카테고리:</span>
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedTag === tag
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
          <TrendingUp size={14} className="text-amber-400" />
          <span>실시간 인기순</span>
        </div>
      </div>

      {/* Shorts Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-slate-900 rounded-2xl aspect-[9/16] animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredList.map((shorts) => (
            <ShortsCard key={shorts.id} shorts={shorts} onConvertAi={handleConvertAi} />
          ))}
        </div>
      )}

      {/* AI Conversion Processing Modal */}
      <AiConversionModal isOpen={!!convertingShorts} shortsTitle={convertingShorts?.title} />
    </div>
  );
}
