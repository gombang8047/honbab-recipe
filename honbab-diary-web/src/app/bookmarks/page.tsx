'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bookmark,
  ChevronLeft,
  Search,
  Sparkles,
  ChefHat,
  Play,
  Trash2,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { ShortsItem, shortsApi } from '@/services/shortsApi';
import { ShortsPlayerModal } from '@/components/ShortsPlayerModal';
import { soundService } from '@/services/soundService';

export default function BookmarksPage() {
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<ShortsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [playingShorts, setPlayingShorts] = useState<ShortsItem | null>(null);

  const loadBookmarks = async () => {
    setLoading(true);
    try {
      const list = await shortsApi.getBookmarks();
      setBookmarks(list);
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

  const [selectedTag, setSelectedTag] = useState<string>('ALL');

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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            onClick={() => soundService.playButtonClick()}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700/60"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Bookmark className="text-amber-400" size={24} />
                내가 저장한 레시피 북마크
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                {bookmarks.length}개
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              관심 있는 자취 쇼츠 요리를 모아두고 필요할 때 언제든 다시 찾아보세요.
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/70 rounded-full px-4 py-2 w-full md:w-72 text-sm focus-within:border-amber-500 transition-colors">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="저장한 요리 검색..."
            className="bg-transparent text-slate-200 placeholder-slate-500 outline-none w-full text-xs"
          />
        </div>
      </div>

      {/* Tag filter chips */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-4 mb-4 scrollbar-none">
          <button
            onClick={() => {
              soundService.playButtonClick();
              setSelectedTag('ALL');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedTag === 'ALL'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/50'
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
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedTag === tag
                    ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/50'
                }`}
              >
                #{tag} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Bookmarks Grid / Empty State */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 animate-pulse h-72 flex flex-col justify-between"
            >
              <div className="bg-slate-800 h-44 rounded-xl w-full"></div>
              <div className="space-y-2 mt-3">
                <div className="bg-slate-800 h-4 rounded w-3/4"></div>
                <div className="bg-slate-800 h-3 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-3xl border border-slate-800/80 bg-slate-900/50 max-w-lg mx-auto my-12">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
            <Bookmark size={28} />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">
            {searchQuery ? '검색 결과와 일치하는 북마크가 없어요' : '저장된 북마크가 없습니다'}
          </h3>
          <p className="text-xs text-slate-400 mb-6 max-w-xs mx-auto leading-relaxed">
            {searchQuery
              ? '다른 검색어로 검색해보시거나 필터를 초기화해보세요.'
              : '홈 화면에서 마음에 드는 1인분 자취 요리의 북마크(🔖) 버튼을 눌러보세요!'}
          </p>
          <Link
            href="/"
            onClick={() => soundService.playButtonClick()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs shadow-lg hover:brightness-110 transition-all"
          >
            <Sparkles size={14} />
            <span>맛있는 쇼츠 레시피 보러가기</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="glass-panel group rounded-2xl overflow-hidden border border-slate-800/80 hover:border-amber-500/40 bg-slate-900/60 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col"
            >
              {/* Thumbnail Container */}
              <div
                className="relative aspect-[9/12] w-full overflow-hidden bg-slate-950 cursor-pointer"
                onClick={() => {
                  soundService.playButtonClick();
                  setPlayingShorts(item);
                }}
              >
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent"></div>

                {/* Duration Badge */}
                <div className="absolute bottom-2.5 right-2.5 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-mono text-white">
                  {item.durationSeconds}s
                </div>

                {/* Play hover button */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                  <div className="w-12 h-12 rounded-full bg-orange-500/90 text-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                    <Play size={22} className="ml-1 fill-white" />
                  </div>
                </div>

                {/* Remove Bookmark button */}
                <button
                  onClick={(e) => handleRemoveBookmark(e, item)}
                  title="북마크 해제"
                  className="absolute top-2.5 right-2.5 p-2 rounded-full bg-slate-900/80 hover:bg-red-500/20 text-amber-400 hover:text-red-400 border border-slate-700/60 transition-colors shadow"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Card Body */}
              <div className="p-4 flex flex-col flex-grow justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-400/90 mb-1 font-medium">
                    <span>{item.channelName}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-100 line-clamp-2 leading-snug">
                    {item.title}
                  </h3>
                </div>

                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.tags.slice(0, 2).map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
                  <button
                    onClick={() => {
                      soundService.playButtonClick();
                      router.push(`/recipe/${item.id}`);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-orange-500/10 hover:bg-orange-500 text-orange-400 hover:text-white font-semibold text-xs transition-all border border-orange-500/30"
                  >
                    <BookOpen size={14} />
                    <span>레시피 보기</span>
                  </button>

                  <button
                    onClick={() => {
                      soundService.playButtonClick();
                      setPlayingShorts(item);
                    }}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/60"
                    title="쇼츠 영상 시청"
                  >
                    <Play size={14} />
                  </button>
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
