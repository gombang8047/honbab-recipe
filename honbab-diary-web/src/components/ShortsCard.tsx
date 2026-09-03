'use client';

import React, { useState } from 'react';
import { ShortsItem } from '@/services/shortsApi';
import { Play, Sparkles, Bookmark, Eye, Clock } from 'lucide-react';

interface ShortsCardProps {
  shorts: ShortsItem;
  onConvertAi: (shorts: ShortsItem) => void;
  onPlay: (shorts: ShortsItem) => void;
}

export const ShortsCard: React.FC<ShortsCardProps> = ({ shorts, onConvertAi, onPlay }) => {
  const [bookmarked, setBookmarked] = useState(shorts.bookmarked);

  const toggleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarked(!bookmarked);
  };

  return (
    <div className="group relative bg-slate-800/60 rounded-2xl overflow-hidden border border-slate-700/50 hover:border-orange-500/60 transition-all duration-300 hover:-translate-y-1.5 shadow-xl flex flex-col">
      {/* Thumbnail Container (Click to play video) */}
      <div
        onClick={() => onPlay(shorts)}
        className="relative aspect-[9/16] w-full overflow-hidden bg-slate-900 cursor-pointer"
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

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

        {/* Duration badge */}
        <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-slate-200 text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
          <Clock size={12} />
          <span>{shorts.durationSeconds}초</span>
        </div>

        {/* Bookmark button */}
        <button
          onClick={toggleBookmark}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-transform active:scale-90 z-10 ${
            bookmarked ? 'bg-orange-500 text-white' : 'bg-black/50 text-slate-300 hover:text-white'
          }`}
          aria-label="북마크"
        >
          <Bookmark size={16} fill={bookmarked ? 'currentColor' : 'none'} />
        </button>

        {/* Play Icon Hover Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
          <div className="bg-orange-500 text-white p-4 rounded-full shadow-2xl scale-90 group-hover:scale-100 transition-transform flex items-center justify-center">
            <Play size={28} fill="currentColor" className="ml-1" />
          </div>
        </div>

        {/* View count & tags overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-2">
          <div className="flex flex-wrap gap-1.5">
            {shorts.tags && shorts.tags.slice(0, 3).map((tag, idx) => (
              <span key={idx} className="bg-orange-500/20 text-orange-300 text-[10px] px-2 py-0.5 rounded-md border border-orange-500/30">
                #{tag}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-1 text-slate-400 text-xs">
            <Eye size={13} />
            <span>{(shorts.viewCount / 10000).toFixed(1)}만회</span>
            <span className="mx-1">•</span>
            <span>{shorts.channelName}</span>
          </div>
        </div>
      </div>

      {/* Card Info & Actions */}
      <div className="p-4 flex flex-col justify-between flex-grow gap-3">
        <h3
          onClick={() => onPlay(shorts)}
          className="font-semibold text-slate-100 text-sm line-clamp-2 leading-snug cursor-pointer hover:text-orange-400 transition-colors"
        >
          {shorts.title}
        </h3>

        <button
          onClick={() => onConvertAi(shorts)}
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 active:scale-98 transition-all"
        >
          <Sparkles size={16} />
          <span>AI 레시피 보기</span>
        </button>
      </div>
    </div>
  );
};
