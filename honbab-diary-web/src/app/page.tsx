'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShortsItem, shortsApi } from '@/services/shortsApi';
import { recipeApi } from '@/services/recipeApi';
import { ShortsCard } from '@/components/ShortsCard';
import { ShortsPlayerModal } from '@/components/ShortsPlayerModal';
import { AiConversionModal } from '@/components/AiConversionModal';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles, TrendingUp, Filter, Loader2, Search, X, Utensils, RotateCw, Flame, Clock, ChevronDown } from 'lucide-react';

const PAGE_SIZE = 8;

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams?.get('q') || '';

  const [shortsList, setShortsList] = useState<ShortsItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortMode, setSortMode] = useState<'RANDOM' | 'TRENDING' | 'LATEST'>('RANDOM');
  const [convertingShorts, setConvertingShorts] = useState<ShortsItem | null>(null);
  const [playingShorts, setPlayingShorts] = useState<ShortsItem | null>(null);
  const [gridCols, setGridCols] = useState<number>(4);

  const observerTarget = useRef<HTMLDivElement | null>(null);
  const totalCountRef = useRef<number>(530);

  // 화면 폭에 따른 현재 그리드 열(column) 개수 감지
  // Tailwind 기준: lg(>=1024px) -> 4열, md(>=768px) -> 3열, sm(>=640px) -> 2열, 모바일 -> 1열
  const getResponsiveColumnCount = useCallback((): number => {
    if (typeof window === 'undefined') return 4;
    const width = window.innerWidth;
    if (width >= 1024) return 4;
    if (width >= 768) return 3;
    if (width >= 640) return 2;
    return 1;
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setGridCols(getResponsiveColumnCount());
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [getResponsiveColumnCount]);

  // 화면 열 개수에 맞추어 2행 분량(예: 4열이면 8개, 3열이면 6개, 2열이면 4개) 계산
  const getBatchSize = useCallback((): number => {
    const cols = getResponsiveColumnCount();
    return cols * 2;
  }, [getResponsiveColumnCount]);

  // 피드 데이터 로딩 함수 (새로고침 / 정렬 변경 / 검색 시 호출)
  const fetchInitialData = useCallback(async (currentSort = sortMode, currentQuery = searchQuery) => {
    setInitialLoading(true);
    setPage(0);

    const batchSize = getBatchSize();

    try {
      let res;
      if (currentQuery.trim()) {
        res = await shortsApi.searchPaginated(currentQuery.trim(), 0, batchSize);
      } else if (currentSort === 'TRENDING') {
        res = await shortsApi.getTrendingPaginated(0, batchSize);
      } else if (currentSort === 'RANDOM') {
        res = await shortsApi.getRandomPaginated(0, batchSize, totalCountRef.current);
      } else {
        // LATEST
        res = await shortsApi.getFeedPaginated(0, batchSize);
      }

      if (res.totalElements) {
        totalCountRef.current = res.totalElements;
      }

      setShortsList(res.items);
      setHasMore(res.hasMore);
      setPage(0);
    } catch (err) {
      console.error('쇼츠 로딩 실패:', err);
      setShortsList([]);
      setHasMore(false);
    } finally {
      setInitialLoading(false);
      setIsRefreshing(false);
    }
  }, [sortMode, searchQuery, getBatchSize]);

  // 검색어 또는 정렬 모드 변경 시 데이터 로딩
  useEffect(() => {
    fetchInitialData(sortMode, searchQuery);
  }, [fetchInitialData, sortMode, searchQuery]);

  // 수동 새로고침 핸들러
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchInitialData(sortMode, searchQuery);
  };

  // 다음 페이지 추가 로딩: 현재 화면 열(cols) 배수 단위로 로드
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || initialLoading || isRefreshing) return;

    setLoadingMore(true);
    const nextPage = page + 1;
    const batchSize = getBatchSize();

    try {
      let res;
      if (searchQuery.trim()) {
        res = await shortsApi.searchPaginated(searchQuery.trim(), nextPage, batchSize);
      } else if (sortMode === 'TRENDING') {
        res = await shortsApi.getTrendingPaginated(nextPage, batchSize);
      } else if (sortMode === 'RANDOM') {
        res = await shortsApi.getRandomPaginated(nextPage, batchSize, totalCountRef.current);
      } else {
        res = await shortsApi.getFeedPaginated(nextPage, batchSize);
      }

      if (res.totalElements) {
        totalCountRef.current = res.totalElements;
      }

      const newItems = res.items;
      setShortsList((prev) => {
        const existingIds = new Set(prev.map((item) => item.id));
        const filtered = newItems.filter((item) => !existingIds.has(item.id));
        return [...prev, ...filtered];
      });

      setPage(nextPage);
      setHasMore(res.hasMore);
    } catch (err) {
      console.error('추가 쇼츠 로딩 실패:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [page, hasMore, loadingMore, initialLoading, isRefreshing, searchQuery, sortMode, getBatchSize]);

  // 무한 스크롤 감지 (IntersectionObserver)
  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !initialLoading) {
          loadMore();
        }
      },
      { rootMargin: '300px', threshold: 0.1 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [loadMore, hasMore, loadingMore, initialLoading]);

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

  const clearSearch = () => {
    router.push('/');
  };

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
          유튜브 60초 요리 영상에서 재료 목록과 조리 순서를 AI가 추출해드립니다. 필요한 재료는 쿠팡/컬리 단위 환산 가격으로 한 번에 비교!
        </p>
      </div>

      {/* Search Result Banner / Status Header */}
      {searchQuery && (
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-200">
            <Search size={17} className="text-orange-400 shrink-0" />
            <span>
              <strong className="text-orange-400 font-bold">"{searchQuery}"</strong> (재료 및 요리명) 검색 결과
            </span>
            <span className="text-xs text-slate-400 font-medium">
              ({shortsList.length}건{hasMore ? '+' : ''})
            </span>
          </div>
          <button
            onClick={clearSearch}
            className="px-3 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors font-semibold flex items-center gap-1"
          >
            <span>전체 목록 보기</span>
          </button>
        </div>
      )}

      {/* Feed Control Bar: Sort Options & Refresh Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        {/* Left side: Section Title / Info */}
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-orange-400" />
          <span className="text-sm font-bold text-white tracking-tight">요리 쇼츠 레시피</span>
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            • 클릭 시 AI 레시피 및 재료 보기
          </span>
        </div>

        {/* Right side: Sort Controls & Refresh Button */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
          {/* Sort Switcher (추천순 / 인기순 / 최신순) */}
          <div className="flex items-center bg-slate-900/90 border border-slate-800 p-1 rounded-2xl shadow-inner">
            <button
              onClick={() => setSortMode('RANDOM')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                sortMode === 'RANDOM'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="새로고침 시마다 랜덤 추천"
            >
              <span>🎲</span>
              <span>추천순</span>
            </button>

            <button
              onClick={() => setSortMode('TRENDING')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                sortMode === 'TRENDING'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="유튜브 조회수 기준 정렬"
            >
              <Flame size={12} className={sortMode === 'TRENDING' ? 'text-white' : 'text-amber-400'} />
              <span>인기순</span>
            </button>

            <button
              onClick={() => setSortMode('LATEST')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                sortMode === 'LATEST'
                  ? 'bg-slate-700 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="최근 등록일 기준 정렬"
            >
              <Clock size={12} />
              <span>최신순</span>
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={initialLoading || isRefreshing}
            className={`px-3.5 py-2 rounded-2xl border border-slate-700/80 bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 ${
              isRefreshing ? 'opacity-70 cursor-not-allowed' : ''
            }`}
            title="새로운 요리 쇼츠 불러오기"
          >
            <RotateCw
              size={13}
              className={`text-orange-400 ${isRefreshing ? 'animate-spin' : 'hover:rotate-180 transition-transform duration-500'}`}
            />
            <span>{isRefreshing ? '갱신 중...' : '새로고침'}</span>
          </button>
        </div>
      </div>

      {/* Shorts Cards Grid */}
      {initialLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: gridCols * 2 }).map((_, n) => (
            <div key={n} className="bg-slate-900 rounded-2xl aspect-[9/16] animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : shortsList.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-900/40 rounded-3xl border border-slate-800/80 flex flex-col items-center justify-center gap-4">
          <div className="p-4 bg-slate-800/60 rounded-full text-slate-400">
            <Utensils size={36} className="text-orange-400" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-bold text-white">
              {searchQuery ? `"${searchQuery}"에 해당하는 요리 쇼츠를 찾지 못했습니다.` : '등록된 쇼츠가 없습니다.'}
            </h3>
            <p className="text-xs text-slate-400">
              다른 재료명(예: 계란, 스팸, 김치, 라면)이나 요리 이름으로 검색해 보세요!
            </p>
          </div>
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="mt-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-md"
            >
              전체 쇼츠 보기
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {shortsList.map((shorts) => (
              <ShortsCard
                key={shorts.id}
                shorts={shorts}
                onConvertAi={handleConvertAi}
                onPlay={setPlayingShorts}
              />
            ))}
          </div>

          {/* Infinite Scroll Trigger Observer Target */}
          <div ref={observerTarget} className="w-full py-8 flex flex-col items-center justify-center min-h-[80px]">
            {loadingMore && (
              <div className="flex items-center gap-2 text-orange-400 text-sm font-semibold bg-slate-900/80 border border-orange-500/30 px-5 py-2.5 rounded-full shadow-lg backdrop-blur-md">
                <Loader2 size={18} className="animate-spin" />
                <span>새로운 요리 쇼츠를 불러오는 중...</span>
              </div>
            )}

            {!hasMore && shortsList.length > 0 && (
              <div className="text-xs text-slate-500 font-medium py-4">
                🎉 모든 요리 쇼츠를 다 불러왔습니다!
              </div>
            )}
          </div>
        </>
      )}

      {/* Shorts Video Player Modal */}
      <ShortsPlayerModal
        isOpen={!!playingShorts}
        shorts={playingShorts}
        onClose={() => setPlayingShorts(null)}
        onConvertAi={handleConvertAi}
      />

      {/* AI Conversion Processing Modal */}
      <AiConversionModal isOpen={!!convertingShorts} shortsTitle={convertingShorts?.title} />
    </div>
  );
}
