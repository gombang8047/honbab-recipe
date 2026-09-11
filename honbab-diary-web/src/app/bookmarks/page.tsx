'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bookmark,
  ChevronLeft,
  Search,
  Sparkles,
  Play,
  Trash2,
  BookOpen,
  LayoutGrid,
  List,
  X,
  Eye,
} from 'lucide-react';
import { ShortsItem, shortsApi } from '@/services/shortsApi';
import { ShortsPlayerModal } from '@/components/ShortsPlayerModal';
import { ShortsCard } from '@/components/ShortsCard';
import { soundService } from '@/services/soundService';

export default function BookmarksPage() {
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<ShortsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [playingShorts, setPlayingShorts] = useState<ShortsItem | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Load view mode preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('honbab_bookmark_view_mode') as 'grid' | 'list' | null;
      if (savedMode === 'grid' || savedMode === 'list') {
        setViewMode(savedMode);
      }
    }
  }, []);

  const handleToggleViewMode = (mode: 'grid' | 'list') => {
    soundService.playButtonClick();
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('honbab_bookmark_view_mode', mode);
    }
  };

  const loadBookmarks = async () => {
    setLoading(true);
    try {
      const list = await shortsApi.getBookmarks();
      // Ensure all bookmarked items have bookmarked: true
      const normalized = list.map((item) => ({ ...item, bookmarked: true }));
      setBookmarks(normalized);
    } catch (e) {
      console.error('북마크 로드 실패:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookmarks();

    const handleBookmarkChange = () => {
      loadBookmarks();
    };
    window.addEventListener('bookmark-changed', handleBookmarkChange);
    return () => {
      window.removeEventListener('bookmark-changed', handleBookmarkChange);
    };
  }, []);

  const handleRemoveBookmark = async (e: React.MouseEvent, item: ShortsItem) => {
    e.stopPropagation();
    soundService.playButtonClick();
    await shortsApi.toggleBookmark(item.id, true, item);
    setBookmarks((prev) => prev.filter((b) => b.id !== item.id));
  };

  const filtered = bookmarks.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.channelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.tags && item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesTag =
      selectedTag === 'ALL' || (item.tags && item.tags.includes(selectedTag));
    return matchesSearch && matchesTag;
  });

  // Extract all unique tags
  const allTags = Array.from(new Set(bookmarks.flatMap((b) => b.tags || [])));

  const handleBack = () => {
    soundService.playButtonClick();
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-12 flex flex-col gap-4 sm:gap-6">
      {/* Top Header Bar */}
      <div className="flex flex-col gap-3 sm:gap-4 border-b border-[#D4AF37]/20 pb-4 sm:pb-5">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Back button + Title */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={handleBack}
              className="p-2 sm:p-2.5 rounded-2xl bg-[#0D2418] hover:bg-[#133624] text-[#D4AF37] transition-all border border-[#D4AF37]/35 shadow-md shrink-0 active:scale-95"
              title="뒤로 가기"
              aria-label="뒤로 가기"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-[#FDFBF4] tracking-tight truncate flex items-center gap-2">
                  <Bookmark className="text-[#D4AF37] fill-[#D4AF37]/30 shrink-0" size={22} />
                  <span>내가 저장한 레시피</span>
                </h1>
                <span className="text-[11px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 font-bold shrink-0">
                  {bookmarks.length}개
                </span>
              </div>
              <p className="text-xs text-[#D9D2BE]/80 mt-0.5 hidden sm:block">
                관심 있는 자취 쇼츠 요리를 모아두고 필요할 때 언제든 다시 찾아보세요.
              </p>
            </div>
          </div>

          {/* Right: View Mode Toggle (Grid vs List) */}
          <div className="flex items-center gap-1 p-1 bg-[#0D2418] rounded-xl border border-[#D4AF37]/35 shadow-sm shrink-0">
            <button
              type="button"
              onClick={() => handleToggleViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-[#D4AF37] text-[#1B4731] shadow-sm font-bold'
                  : 'text-[#D9D2BE]/70 hover:text-[#D4AF37]'
              }`}
              title="그리드 뷰 (2열 카드)"
              aria-label="그리드 뷰"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              onClick={() => handleToggleViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-[#D4AF37] text-[#1B4731] shadow-sm font-bold'
                  : 'text-[#D9D2BE]/70 hover:text-[#D4AF37]'
              }`}
              title="리스트 뷰 (1열 가로형)"
              aria-label="리스트 뷰"
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full">
          <div className="flex items-center gap-2.5 bg-[#0D2418]/90 border border-[#D4AF37]/35 focus-within:border-[#D4AF37] rounded-2xl px-3.5 py-2 text-xs sm:text-sm text-[#FDFBF4] transition-all shadow-sm">
            <Search size={16} className="text-[#D4AF37] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="저장한 요리명, 채널명, 재료 검색..."
              className="bg-transparent text-[#FDFBF4] placeholder-[#D9D2BE]/50 outline-none w-full text-xs sm:text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 rounded-full text-[#D9D2BE]/70 hover:text-[#FDFBF4] hover:bg-[#133624]"
                title="검색어 지우기"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tag filter chips */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
          <button
            onClick={() => {
              soundService.playButtonClick();
              setSelectedTag('ALL');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
              selectedTag === 'ALL'
                ? 'bg-[#D4AF37] text-[#1B4731] border border-[#F3E5AB]'
                : 'bg-[#0D2418] text-[#D9D2BE]/80 hover:text-[#FDFBF4] border border-[#D4AF37]/30 hover:border-[#D4AF37]'
            }`}
          >
            전체 ({bookmarks.length})
          </button>
          {allTags.map((tag) => {
            const count = bookmarks.filter((b) => b.tags && b.tags.includes(tag)).length;
            return (
              <button
                key={tag}
                onClick={() => {
                  soundService.playButtonClick();
                  setSelectedTag(tag);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
                  selectedTag === tag
                    ? 'bg-[#D4AF37] text-[#1B4731] border border-[#F3E5AB]'
                    : 'bg-[#0D2418] text-[#D9D2BE]/80 hover:text-[#FDFBF4] border border-[#D4AF37]/30 hover:border-[#D4AF37]'
                }`}
              >
                #{tag} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Bookmarks Display: Loading, Empty, or Content */}
      {loading ? (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6'
              : 'flex flex-col gap-3'
          }
        >
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className={`bg-[#133624]/60 border border-[#D4AF37]/20 rounded-2xl animate-pulse ${
                viewMode === 'grid' ? 'aspect-[9/16]' : 'h-24 sm:h-28 w-full'
              }`}
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 sm:py-16 px-4 rounded-3xl border flex flex-col items-center justify-center gap-4 bg-[#133624] border-[#D4AF37]/40 text-[#FDFBF4] shadow-2xl max-w-lg mx-auto my-4 w-full">
          <div className="w-16 h-16 rounded-full bg-[#0D2418] text-[#D4AF37] flex items-center justify-center border border-[#D4AF37]/35 shadow-inner">
            <Bookmark size={28} className="fill-[#D4AF37]/20" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-base sm:text-lg font-bold text-[#FDFBF4]">
              {searchQuery ? '검색 결과와 일치하는 북마크가 없어요' : '저장된 레시피 북마크가 없습니다'}
            </h3>
            <p className="text-xs text-[#D9D2BE]/80 max-w-xs mx-auto leading-relaxed">
              {searchQuery
                ? '다른 검색어로 검색해보시거나 필터를 초기화해보세요.'
                : '쇼츠 요리 피드에서 마음에 드는 레시피의 북마크(🔖) 버튼을 눌러보세요!'}
            </p>
          </div>
          <Link
            href="/"
            onClick={() => soundService.playButtonClick()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#D4AF37] hover:bg-[#C49F2C] text-[#1B4731] font-extrabold text-xs shadow-lg transition-all active:scale-95 border border-[#F3E5AB]"
          >
            <Sparkles size={15} />
            <span>맛있는 쇼츠 레시피 보러가기</span>
          </Link>
        </div>
      ) : viewMode === 'grid' ? (
        /* 2-column on mobile, 3/4-column on desktop (Uniform with Home Feed) */
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {filtered.map((item) => (
            <ShortsCard
              key={item.id}
              shorts={item}
              onConvertAi={(s) => {
                soundService.playButtonClick();
                router.push(`/recipe/${s.id}`);
              }}
              onPlay={(s) => {
                soundService.playButtonClick();
                setPlayingShorts(s);
              }}
            />
          ))}
        </div>
      ) : (
        /* Compact List View (Horizontal card optimized for mobile app scrolling) */
        <div className="flex flex-col gap-2.5 sm:gap-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="group rounded-2xl overflow-hidden border border-[#D4AF37]/35 hover:border-[#D4AF37] bg-[#133624] p-2.5 sm:p-3 flex items-center gap-3 sm:gap-4 shadow-md hover:shadow-xl transition-all"
            >
              {/* Thumbnail Container */}
              <div
                onClick={() => {
                  soundService.playButtonClick();
                  setPlayingShorts(item);
                }}
                className="relative w-20 h-24 sm:w-28 sm:h-32 rounded-xl overflow-hidden bg-black/60 shrink-0 cursor-pointer group-hover:scale-[1.02] transition-transform"
                role="button"
                tabIndex={0}
                aria-label={`${item.title} 재생`}
              >
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/25 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-[#D4AF37] text-[#1B4731] flex items-center justify-center shadow-md">
                    <Play size={14} className="fill-[#1B4731] ml-0.5" />
                  </div>
                </div>
                <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[9px] font-mono text-white">
                  {item.durationSeconds}s
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
                <div>
                  <div className="flex items-center gap-2 text-[10px] sm:text-xs text-[#D4AF37] font-semibold mb-0.5">
                    <span className="truncate">{item.channelName}</span>
                    {item.viewCount > 0 && (
                      <span className="text-[#D9D2BE]/60 flex items-center gap-0.5 shrink-0">
                        <Eye size={10} />
                        {(item.viewCount / 10000).toFixed(1)}만회
                      </span>
                    )}
                  </div>
                  <h3
                    onClick={() => {
                      soundService.playButtonClick();
                      router.push(`/recipe/${item.id}`);
                    }}
                    className="text-xs sm:text-sm font-bold text-[#FDFBF4] hover:text-[#D4AF37] line-clamp-2 leading-snug cursor-pointer transition-colors"
                  >
                    {item.title}
                  </h3>
                </div>

                {/* Tags & Action Buttons */}
                <div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-[#D4AF37]/20">
                  {/* Tags */}
                  <div className="flex items-center gap-1 overflow-hidden">
                    {item.tags && item.tags.length > 0 ? (
                      item.tags.slice(0, 2).map((t, idx) => (
                        <span
                          key={idx}
                          className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-[#0D2418] text-[#D4AF37] border border-[#D4AF37]/30 font-medium truncate"
                        >
                          #{t}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-[#D9D2BE]/40">1인분 레시피</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        soundService.playButtonClick();
                        router.push(`/recipe/${item.id}`);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-[#D4AF37] hover:bg-[#C49F2C] text-[#1B4731] font-bold text-[11px] sm:text-xs flex items-center gap-1 shadow-sm transition-all active:scale-95 border border-[#F3E5AB]"
                    >
                      <BookOpen size={12} />
                      <span>레시피</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveBookmark(e, item)}
                      className="p-1.5 rounded-xl bg-[#0D2418] hover:bg-rose-950/60 text-[#D9D2BE]/70 hover:text-rose-400 border border-[#D4AF37]/30 hover:border-rose-500/40 transition-colors shadow-sm"
                      title="북마크 해제"
                      aria-label="북마크 해제"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Shorts Player Modal */}
      {playingShorts && (
        <ShortsPlayerModal
          isOpen={!!playingShorts}
          shorts={playingShorts}
          onClose={() => setPlayingShorts(null)}
          onConvertAi={(shorts) => {
            setPlayingShorts(null);
            router.push(`/recipe/${shorts.id}`);
          }}
        />
      )}
    </div>
  );
}
