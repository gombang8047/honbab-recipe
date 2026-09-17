'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { ShortsItem, shortsApi } from '@/services/shortsApi';
import { recipeApi } from '@/services/recipeApi';
import { ShortsCard } from '@/components/ShortsCard';
import { ShortsPlayerModal } from '@/components/ShortsPlayerModal';
import { AiConversionModal } from '@/components/AiConversionModal';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles, TrendingUp, Filter, Loader2, Search, X, Utensils, RotateCw, Flame, Clock, ChevronDown, Shuffle, ShoppingCart, Check } from 'lucide-react';

const PAGE_SIZE = 8;

function HomeContent() {
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
  const [isNavigatingToRecipe, setIsNavigatingToRecipe] = useState(false);
  const [playingShorts, setPlayingShorts] = useState<ShortsItem | null>(null);
  const [gridCols, setGridCols] = useState<number>(4);

  const observerTarget = useRef<HTMLDivElement | null>(null);
  const totalCountRef = useRef<number>(530);

  // 화면 폭에 따른 현재 그리드 열(column) 개수 감지
  // Tailwind 기준: lg(>=1024px) -> 4열, md(>=768px) -> 3열, 모바일/앱 -> 2열
  const getResponsiveColumnCount = useCallback((): number => {
    if (typeof window === 'undefined') return 4;
    const width = window.innerWidth;
    if (width >= 1024) return 4;
    if (width >= 768) return 3;
    return 2; // 앱/모바일에서는 한 줄에 2개씩
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
      { rootMargin: '800px', threshold: 0 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [loadMore, hasMore, loadingMore, initialLoading]);

  // 모달 상태 초기화 및 브라우저 뒤로가기 대응
  useEffect(() => {
    const handleReset = () => {
      setConvertingShorts(null);
      setIsNavigatingToRecipe(false);
    };
    window.addEventListener('popstate', handleReset);
    return () => {
      window.removeEventListener('popstate', handleReset);
      handleReset();
    };
  }, []);

  const handleConvertAi = async (shorts: ShortsItem) => {
    setConvertingShorts(shorts);
    setIsNavigatingToRecipe(false);

    // 사용자가 선택한 실제 쇼츠 영상 ID를 세션스토리지에 저장하여 레시피 상세 페이지에 100% 동일 영상 전달
    if (typeof window !== 'undefined' && shorts.youtubeId) {
      sessionStorage.setItem('current_recipe_youtube_id', shorts.youtubeId);
    }

    try {
      const recipe = await recipeApi.convertToRecipe(shorts.id);
      setIsNavigatingToRecipe(true);
      const targetUrl = `/recipe/${recipe.id}?youtubeId=${encodeURIComponent(shorts.youtubeId)}`;
      router.prefetch(targetUrl);
      router.push(targetUrl);
    } catch (err: any) {
      console.error('레시피 변환 실패:', err);
      setConvertingShorts(null);
      setIsNavigatingToRecipe(false);
      const msg = err?.message || err?.error || 'AI 레시피 생성에 실패했습니다. 다시 시도해주세요.';
      alert(`[AI 레시피 생성 실패]\n${msg}`);
    }
  };

  const clearSearch = () => {
    router.push('/');
  };

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-3 sm:py-8 flex flex-col gap-4 sm:gap-8">
      {/* Hero Banner: Luxury Editorial 60-30-10 Layout (PC 웹에서만 표시, 앱에서는 즉시 쇼츠 피드 노출) */}
      <div className="hidden md:block relative rounded-2xl sm:rounded-3xl p-4 sm:p-8 lg:p-10 text-[#FDFBF4] shadow-2xl border bg-[#133624] border-[#D4AF37]/40 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          {/* Left Column (Main Story) */}
          <div className="lg:col-span-7 flex flex-col gap-2.5 sm:gap-4">
            {/* 상단 뱃지: PC에서만 표시 */}
            <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full w-fit text-xs font-bold bg-[#1B4731] text-[#D4AF37] border border-[#D4AF37]/40 tracking-wider shadow-sm">
              <Sparkles size={13} className="text-[#D4AF37]" />
              <span>AI 1인분 요리 연구소 • CUISINE STUDIO</span>
            </div>

            {/* 메인 타이틀: 앱에서는 이것만 깔끔하게 노출 */}
            <h1 className="text-xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-snug text-[#FDFBF4]">
              쇼츠 보고 3분 만에,<br />
              <span className="text-[#D4AF37]">근사한 1인분 식탁</span>을 완성하세요
            </h1>

            {/* 부가 설명: PC에서만 표시 */}
            <p className="hidden md:block text-[#E7E2D3] text-sm sm:text-base max-w-xl leading-relaxed">
              유튜브 60초 요리 영상에서 AI가 1인분 분량과 조리 순서를 즉시 추출합니다. 필요한 식재료는 쿠팡과 마켓컬리 최저가로 한눈에 비교해 보세요.
            </p>

            {/* Feature Pills: PC에서만 표시 */}
            <div className="hidden md:flex flex-wrap gap-2 pt-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1B4731] text-xs text-[#FDFBF4] border border-[#D4AF37]/30 shadow-sm font-medium">
                <Clock size={12} className="text-[#D4AF37]" />
                <span>3분 쇼츠 요약</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1B4731] text-xs text-[#FDFBF4] border border-[#D4AF37]/30 shadow-sm font-medium">
                <Utensils size={12} className="text-[#D4AF37]" />
                <span>1인분 계량 최적화</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1B4731] text-xs text-[#FDFBF4] border border-[#D4AF37]/30 shadow-sm font-medium">
                <ShoppingCart size={12} className="text-[#D4AF37]" />
                <span>쿠팡 • 컬리 최저가 비교</span>
              </div>
            </div>
          </div>

          {/* Right Column: Spotlight Showcase Card (PC에서만 표시) */}
          <div className="hidden lg:block lg:col-span-5">
            <div className="bg-[#FDFBF4] rounded-2xl p-5 sm:p-6 border border-[#D4AF37]/50 shadow-2xl flex flex-col gap-4 text-[#1B4731]">
              <div className="flex items-center justify-between border-b border-[#D4AF37]/25 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1B4731]">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                  <span>오늘의 자취 추천 쇼츠</span>
                </div>
                <span className="text-[10px] font-extrabold text-[#8C762E] bg-[#D4AF37]/20 px-2.5 py-0.5 rounded-full border border-[#D4AF37]/30">
                  인기 1위
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <h3 className="font-extrabold text-base sm:text-lg text-[#1B4731] leading-snug">
                  원팬 마늘 오일 파스타
                </h3>
                <p className="text-xs text-[#486353] leading-relaxed">
                  설거지 단 1개! 쇼츠 영상에서 추출한 1인분 맞춤 8분 완성 레시피
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#F2ECE1] rounded-xl p-2.5 flex flex-col gap-0.5">
                  <span className="text-[10px] text-[#697D71] font-medium">1인분 예상 원가</span>
                  <span className="font-extrabold text-[#1B4731] text-sm">약 2,850원</span>
                </div>
                <div className="bg-[#F2ECE1] rounded-xl p-2.5 flex flex-col gap-0.5">
                  <span className="text-[10px] text-[#697D71] font-medium">조리 소요 시간</span>
                  <span className="font-extrabold text-[#1B4731] text-sm">8분 초간단</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-[#D4AF37]/20 text-xs">
                <div className="flex gap-1.5">
                  <span className="text-[10px] font-semibold bg-[#1B4731]/10 text-[#1B4731] px-2 py-0.5 rounded-md">
                    #원팬요리
                  </span>
                  <span className="text-[10px] font-semibold bg-[#1B4731]/10 text-[#1B4731] px-2 py-0.5 rounded-md">
                    #초간단
                  </span>
                </div>
                <button
                  onClick={() => router.push('/?q=' + encodeURIComponent('파스타'))}
                  className="text-xs font-bold text-[#1B4731] hover:text-[#2E6B4B] flex items-center gap-1 group"
                >
                  <span>레시피 모아보기</span>
                  <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Result Banner / Status Header */}
      {searchQuery && (
        <div className="border p-4 rounded-2xl flex items-center justify-between gap-4 transition-colors bg-[#133624] border-[#D4AF37]/40 shadow-xl">
          <div className="flex items-center gap-2 text-sm text-stone-100">
            <Search size={17} className="text-[#D4AF37] shrink-0" />
            <span>
              <strong className="font-bold text-[#D4AF37]">"{searchQuery}"</strong> (재료 및 요리명) 검색 결과
            </span>
            <span className="text-xs text-[#E7E2D3] font-medium">
              ({shortsList.length}건{hasMore ? '+' : ''})
            </span>
          </div>
          <button
            onClick={clearSearch}
            className="px-3.5 py-1.5 text-xs rounded-xl transition-colors font-bold flex items-center gap-1 shadow-md bg-[#D4AF37] hover:bg-[#C49F2C] text-[#1B4731] border border-[#F3E5AB]"
          >
            <span>전체 목록 보기</span>
          </button>
        </div>
      )}

      {/* Feed Control Bar: Sort Options & Refresh Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 pb-2 border-b border-[#D4AF37]/30 transition-colors">
        {/* Left side: Section Title / Info (앱/모바일에서는 숨김 처리) */}
        <div className="hidden sm:flex items-center gap-2">
          <Sparkles size={16} className="text-[#D4AF37]" />
          <span className="text-sm font-bold text-[#FDFBF4] tracking-tight">요리 쇼츠 레시피</span>
          <span className="text-xs text-[#E7E2D3] font-medium hidden sm:inline">
            • 클릭 시 AI 레시피 및 재료 보기
          </span>
        </div>

        {/* Right side: Sort Controls & Refresh Button */}
        <div className="flex items-center justify-between w-full sm:w-auto gap-2 sm:gap-2.5">
          {/* Sort Switcher (추천순 / 인기순 / 최신순 - 왼쪽 배치) */}
          <div className="h-9 sm:h-10 flex items-center bg-[#133624] border border-[#D4AF37]/40 p-1 rounded-2xl shadow-md shrink-0">
            <button
              onClick={() => setSortMode('RANDOM')}
              className={`h-full px-2.5 sm:px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 ${
                sortMode === 'RANDOM'
                  ? 'bg-[#D4AF37] text-[#1B4731] border border-[#F3E5AB] shadow-md'
                  : 'text-[#E7E2D3] hover:text-[#D4AF37]'
              }`}
              title="새로고침 시마다 랜덤 추천"
            >
              <Shuffle size={12} className={sortMode === 'RANDOM' ? 'text-[#1B4731]' : 'text-[#D4AF37]'} />
              <span>추천순</span>
            </button>

            <button
              onClick={() => setSortMode('TRENDING')}
              className={`h-full px-2.5 sm:px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 ${
                sortMode === 'TRENDING'
                  ? 'bg-[#D4AF37] text-[#1B4731] border border-[#F3E5AB] shadow-md'
                  : 'text-[#E7E2D3] hover:text-[#D4AF37]'
              }`}
              title="유튜브 조회수 기준 정렬"
            >
              <Flame size={12} className={sortMode === 'TRENDING' ? 'text-[#1B4731]' : 'text-[#D4AF37]'} />
              <span>인기순</span>
            </button>

            <button
              onClick={() => setSortMode('LATEST')}
              className={`h-full px-2.5 sm:px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 ${
                sortMode === 'LATEST'
                  ? 'bg-[#D4AF37] text-[#1B4731] border border-[#F3E5AB] shadow-md'
                  : 'text-[#E7E2D3] hover:text-[#D4AF37]'
              }`}
              title="최근 등록일 기준 정렬"
            >
              <Clock size={12} className={sortMode === 'LATEST' ? 'text-[#1B4731]' : 'text-[#D4AF37]'} />
              <span>최신순</span>
            </button>
          </div>

          {/* Refresh Button (오른쪽 끝 배치, 높이 일치) */}
          <button
            onClick={handleRefresh}
            disabled={initialLoading || isRefreshing}
            className={`h-9 sm:h-10 px-3 sm:px-3.5 rounded-2xl border transition-all text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 bg-[#133624] border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#1B4731] shrink-0 ${
              isRefreshing ? 'opacity-70 cursor-not-allowed' : ''
            }`}
            title="새로운 요리 쇼츠 불러오기"
          >
            <RotateCw
              size={13}
              className={`text-[#D4AF37] ${isRefreshing ? 'animate-spin' : 'hover:rotate-180 transition-transform duration-500'}`}
            />
            <span>{isRefreshing ? '갱신 중...' : '새로고침'}</span>
          </button>
        </div>
      </div>

      {/* Shorts Cards Grid */}
      {initialLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {Array.from({ length: gridCols * 2 }).map((_, n) => (
            <div key={n} className="bg-[#133624]/60 border border-[#D4AF37]/20 rounded-2xl aspect-[9/16] animate-pulse" />
          ))}
        </div>
      ) : shortsList.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl border flex flex-col items-center justify-center gap-4 bg-[#133624] border-[#D4AF37]/40 text-[#FDFBF4] shadow-2xl">
          <div className="p-4 rounded-full bg-[#1B4731] text-[#D4AF37] border border-[#D4AF37]/40 shadow-inner">
            <Utensils size={36} />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-bold text-[#FDFBF4]">
              {searchQuery ? `"${searchQuery}"에 해당하는 요리 쇼츠를 찾지 못했습니다.` : '등록된 쇼츠가 없습니다.'}
            </h3>
            <p className="text-xs text-[#E7E2D3]">
              다른 재료명(예: 계란, 스팸, 김치, 라면)이나 요리 이름으로 검색해 보세요!
            </p>
          </div>
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="mt-2 px-4 py-2 rounded-xl text-[#1B4731] text-xs font-bold transition-all shadow-md bg-[#D4AF37] hover:bg-[#C49F2C] border border-[#F3E5AB]"
            >
              전체 쇼츠 보기
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
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
              <div className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-full shadow-2xl border bg-[#133624] border-[#D4AF37]/40 text-[#D4AF37] backdrop-blur-md">
                <Loader2 size={18} className="animate-spin text-[#D4AF37]" />
                <span>새로운 요리 쇼츠를 불러오는 중...</span>
              </div>
            )}

            {!hasMore && shortsList.length > 0 && (
              <div className="text-xs text-[#D9D2BE] font-semibold py-4 flex items-center justify-center gap-1.5">
                <Check size={14} className="text-[#D4AF37]" />
                <span>모든 요리 쇼츠를 다 불러왔습니다</span>
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
      <AiConversionModal
        isOpen={!!convertingShorts}
        shortsTitle={convertingShorts?.title}
        isReady={isNavigatingToRecipe}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-7xl mx-auto px-4 py-16 min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#D9D2BE] text-sm font-medium">혼밥 요리 피드를 불러오는 중...</p>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
