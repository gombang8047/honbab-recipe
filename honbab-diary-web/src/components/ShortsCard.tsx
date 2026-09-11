'use client';

import React, { useState, useEffect } from 'react';
import { ShortsItem, shortsApi } from '@/services/shortsApi';
import { Play, Sparkles, Bookmark, Eye, Clock } from 'lucide-react';
import { soundService } from '@/services/soundService';

interface ShortsCardProps {
  shorts: ShortsItem;
  onConvertAi: (shorts: ShortsItem) => void;
  onPlay: (shorts: ShortsItem) => void;
}

export const ShortsCard: React.FC<ShortsCardProps> = ({ shorts, onConvertAi, onPlay }) => {
  const [bookmarked, setBookmarked] = useState(shorts.bookmarked);

  useEffect(() => {
    setBookmarked(shorts.bookmarked);
  }, [shorts.bookmarked]);

  useEffect(() => {
    const handleBookmarkChanged = (e: CustomEvent) => {
      if (e.detail && e.detail.id === shorts.id) {
        setBookmarked(e.detail.bookmarked);
      }
    };
    window.addEventListener('bookmark-changed', handleBookmarkChanged as EventListener);
    return () => {
      window.removeEventListener('bookmark-changed', handleBookmarkChanged as EventListener);
    };
  }, [shorts.id]);

  const toggleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    soundService.playButtonClick();
    const newStatus = !bookmarked;
    setBookmarked(newStatus);
    await shortsApi.toggleBookmark(shorts.id, bookmarked, shorts);
  };

  return (
    <div className="group relative rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-1.5 flex flex-col bg-[#FDFBF4] border-[#D4AF37]/50 shadow-xl hover:shadow-2xl hover:border-[#D4AF37]">
      {/* Thumbnail Container (Click to play video) */}
      <div
        onClick={() => onPlay(shorts)}
        className="relative aspect-[9/16] w-full overflow-hidden bg-stone-900 cursor-pointer"
        role="button"
        tabIndex={0}
        aria-label={`${shorts.title} 재생`}
      >
        <img
          src={shorts.thumbnailUrl}
          alt={shorts.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Duration badge */}
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-black/75 backdrop-blur-md text-white text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full flex items-center gap-1 border border-white/15">
          <Clock size={11} className="text-[#D4AF37]" />
          <span>{shorts.durationSeconds}초</span>
        </div>

        {/* Bookmark button */}
        <button
          onClick={toggleBookmark}
          className={`absolute top-2 sm:top-3 right-2 sm:right-3 p-1.5 sm:p-2 rounded-full backdrop-blur-md transition-all active:scale-90 z-10 ${bookmarked
              ? 'bg-[#D4AF37] text-[#1B4731] border border-[#F3E5AB] shadow-md'
              : 'bg-black/60 text-stone-200 hover:text-white hover:bg-black/80 border border-white/20'
            }`}
          aria-label="북마크"
        >
          <Bookmark size={15} fill={bookmarked ? 'currentColor' : 'none'} />
        </button>

        {/* Play Icon Hover Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
          <div className="bg-[#D4AF37] text-[#1B4731] p-3 sm:p-4 rounded-full shadow-2xl border border-[#F3E5AB] scale-90 group-hover:scale-100 transition-transform flex items-center justify-center">
            <Play size={22} fill="currentColor" className="ml-0.5 text-[#1B4731]" />
          </div>
        </div>

        {/* View count & tags overlay - 해시태그 내용에 맞춰 높이가 유동적으로 감싸는 가변 배경 */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#0D2418]/95 via-[#0D2418]/70 to-transparent pt-6 sm:pt-7 pb-2 sm:pb-2.5 px-2.5 sm:px-3 flex flex-col gap-1 sm:gap-1.5 pointer-events-none">
          {/* 해시태그 */}
          {shorts.tags && shorts.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {shorts.tags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="bg-[#133624]/95 text-[#D4AF37] text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-md border border-[#D4AF37]/40 font-semibold shadow-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* 조회수 & 영상주인 채널명 (50:50 반반 공간 분할 & 넘치면 ...) */}
          <div className="grid grid-cols-2 gap-1.5 w-full text-stone-200 text-[10px] sm:text-xs">
            <div className="flex items-center gap-1 min-w-0 overflow-hidden">
              <Eye size={11} className="text-[#D4AF37] shrink-0" />
              <span className="truncate font-medium">
                {(shorts.viewCount / 10000).toFixed(1)}만회
              </span>
            </div>
            <div className="flex items-center justify-end min-w-0 overflow-hidden">
              <span className="truncate text-stone-300 font-medium text-right">
                {shorts.channelName}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Info & Actions (Sub Color: Cream White #FDFBF4 - 30%) */}
      <div className="p-2.5 sm:p-4 flex flex-col justify-between flex-grow gap-2 sm:gap-3 bg-[#FDFBF4]">
        <h3
          onClick={() => onPlay(shorts)}
          className="font-extrabold text-[#1B4731] text-sm sm:text-base line-clamp-2 leading-snug cursor-pointer hover:text-[#255e42] transition-colors min-h-[38px] sm:min-h-[44px]"
        >
          {shorts.title}
        </h3>

        <button
          onClick={() => onConvertAi(shorts)}
          className="w-full text-[#FDFBF4] font-bold py-2 sm:py-2.5 px-2 sm:px-4 rounded-xl text-[11px] sm:text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all bg-[#1B4731] hover:bg-[#255e42] border border-[#D4AF37]/40"
        >
          <Sparkles size={13} className="text-[#D4AF37]" />
          <span>AI 레시피 보기</span>
        </button>
      </div>
    </div>
  );
};
