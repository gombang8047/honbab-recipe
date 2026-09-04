'use client';

import React, { useEffect, useState } from 'react';
import { ShortsItem, shortsApi } from '@/services/shortsApi';
import { X, Sparkles, ExternalLink, Eye, Clock, Youtube, Bookmark } from 'lucide-react';
import { soundService } from '@/services/soundService';

interface ShortsPlayerModalProps {
  isOpen: boolean;
  shorts: ShortsItem | null;
  onClose: () => void;
  onConvertAi?: (shorts: ShortsItem) => void;
}

export const ShortsPlayerModal: React.FC<ShortsPlayerModalProps> = ({
  isOpen,
  shorts,
  onClose,
  onConvertAi,
}) => {
  const [bookmarked, setBookmarked] = useState<boolean>(shorts?.bookmarked ?? false);

  useEffect(() => {
    if (shorts) {
      setBookmarked(shorts.bookmarked);
    }
  }, [shorts]);

  useEffect(() => {
    const handleBookmarkChanged = (e: CustomEvent) => {
      if (shorts && e.detail && e.detail.id === shorts.id) {
        setBookmarked(e.detail.bookmarked);
      }
    };
    window.addEventListener('bookmark-changed', handleBookmarkChanged as EventListener);
    return () => {
      window.removeEventListener('bookmark-changed', handleBookmarkChanged as EventListener);
    };
  }, [shorts]);

  const handleToggleBookmark = async () => {
    if (!shorts) return;
    soundService.playButtonClick();
    const newStatus = !bookmarked;
    setBookmarked(newStatus);
    await shortsApi.toggleBookmark(shorts.id, bookmarked, shorts);
  };

  // Close modal on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !shorts) return null;

  const embedUrl = `https://www.youtube.com/embed/${shorts.youtubeId}?autoplay=1&playsinline=1&rel=0&enablejsapi=1`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
      {/* Dark backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 hover:bg-black/90 text-slate-300 hover:text-white transition-all"
        >
          <X size={20} />
        </button>

        {/* Video Player (9:16 portrait style) */}
        <div className="relative w-full md:w-[380px] shrink-0 aspect-[9/16] bg-black flex items-center justify-center">
          <iframe
            src={embedUrl}
            title={shorts.title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>

        {/* Video Info & Actions Sidebar */}
        <div className="flex-1 p-6 md:p-8 flex flex-col justify-between gap-6 overflow-y-auto bg-gradient-to-b from-slate-900 to-slate-950">
          <div className="flex flex-col gap-4">
            {/* Channel info & Bookmark button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-orange-400 font-semibold tracking-wide">
                <Youtube size={16} />
                <span>{shorts.channelName}</span>
              </div>
              <button
                onClick={handleToggleBookmark}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  bookmarked
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:border-slate-600'
                }`}
              >
                <Bookmark size={14} fill={bookmarked ? 'currentColor' : 'none'} />
                <span>{bookmarked ? '저장됨' : '북마크'}</span>
              </button>
            </div>

            {/* Video Title */}
            <h2 className="text-xl md:text-2xl font-bold text-white leading-snug">
              {shorts.title}
            </h2>

            {/* Stats badges */}
            <div className="flex items-center gap-4 text-xs text-slate-400 pt-1 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-1.5">
                <Eye size={14} className="text-slate-500" />
                <span>{(shorts.viewCount / 10000).toFixed(1)}만회</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-slate-500" />
                <span>{shorts.durationSeconds}초</span>
              </div>
            </div>

            {/* Tags */}
            {shorts.tags && shorts.tags.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-slate-400">관련 태그</span>
                <div className="flex flex-wrap gap-1.5">
                  {shorts.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="bg-orange-500/10 text-orange-300 text-xs px-2.5 py-1 rounded-lg border border-orange-500/20"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3 pt-4 border-t border-slate-800">
            {onConvertAi && (
              <button
                onClick={() => {
                  onClose();
                  onConvertAi(shorts);
                }}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3.5 px-5 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 active:scale-98 transition-all"
              >
                <Sparkles size={18} />
                <span>이 쇼츠로 AI 레시피 추출하기 🍳</span>
              </button>
            )}

            <a
              href={`https://www.youtube.com/shorts/${shorts.youtubeId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold py-3 px-5 rounded-2xl text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all"
            >
              <ExternalLink size={14} />
              <span>YouTube에서 직접 보기</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
