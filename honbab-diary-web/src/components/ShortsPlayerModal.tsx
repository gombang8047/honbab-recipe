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

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const embedUrl = `https://www.youtube.com/embed/${shorts.youtubeId}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1&enablejsapi=1${origin ? `&origin=${encodeURIComponent(origin)}` : ''}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-10">
      {/* Dark backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container: 모바일에서는 모달 전체가 부드럽게 스크롤되어 화면을 내리면 영상이 위로 올라감 */}
      <div className="relative z-10 w-full max-w-4xl bg-[#133624] border border-[#D4AF37]/50 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col md:flex-row max-h-[92vh] overflow-y-auto md:overflow-hidden">
        {/* Close button (모바일에서도 항상 우측 상단에 고정) */}
        <button
          onClick={onClose}
          className="fixed md:absolute top-5 right-5 sm:top-6 sm:right-6 z-30 p-2.5 rounded-full bg-black/80 hover:bg-black text-stone-200 hover:text-white transition-all border border-white/20 active:scale-95 shadow-xl"
          aria-label="닫기"
        >
          <X size={20} />
        </button>

        {/* Video Player (9:16 portrait style - 모바일에서는 적절한 최대 너비로 상단 배치) */}
        <div className="relative w-full max-w-[290px] sm:max-w-[340px] md:w-[360px] mx-auto my-3 md:my-0 shrink-0 aspect-[9/16] bg-black flex items-center justify-center overflow-hidden rounded-2xl md:rounded-none shadow-2xl md:shadow-none border border-[#D4AF37]/30 md:border-0">
          <iframe
            src={embedUrl}
            title={shorts.title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>

        {/* Video Info & Actions Sidebar (모바일에서는 영상 바로 밑으로 자연스럽게 이어짐) */}
        <div className="flex-1 p-5 sm:p-6 md:p-8 flex flex-col justify-between gap-5 sm:gap-6 md:overflow-y-auto bg-[#133624]">
          <div className="flex flex-col gap-4">
            {/* Channel info & Bookmark button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-[#D4AF37] font-semibold tracking-wide">
                <Youtube size={16} />
                <span>{shorts.channelName}</span>
              </div>
              <button
                onClick={handleToggleBookmark}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${bookmarked
                    ? 'bg-[#D4AF37] text-[#1B4731] border-[#F3E5AB] shadow-md'
                    : 'bg-[#1B4731] text-[#E7E2D3] border-[#D4AF37]/30 hover:border-[#D4AF37] hover:text-[#FDFBF4]'
                  }`}
              >
                <Bookmark size={14} fill={bookmarked ? 'currentColor' : 'none'} />
                <span>{bookmarked ? '저장됨' : '북마크'}</span>
              </button>
            </div>

            {/* Video Title */}
            <h2 className="text-xl md:text-2xl font-bold text-[#FDFBF4] leading-snug">
              {shorts.title}
            </h2>

            {/* Stats badges */}
            <div className="flex items-center gap-4 text-xs text-[#E7E2D3] pt-1 border-b border-[#D4AF37]/30 pb-4">
              <div className="flex items-center gap-1.5">
                <Eye size={14} className="text-[#D4AF37]" />
                <span>{(shorts.viewCount / 10000).toFixed(1)}만회</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-[#D4AF37]" />
                <span>{shorts.durationSeconds}초</span>
              </div>
            </div>

            {/* Tags (상위 5개만 표시) */}
            {shorts.tags && shorts.tags.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-[#D4AF37]">관련 태그</span>
                <div className="flex flex-wrap gap-1.5">
                  {shorts.tags.slice(0, 5).map((tag, idx) => (
                    <span
                      key={idx}
                      className="bg-[#1B4731] text-[#D4AF37] text-xs px-2.5 py-1 rounded-lg border border-[#D4AF37]/40 font-semibold shadow-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3 pt-4 border-t border-[#D4AF37]/30">
            {onConvertAi && (
              <button
                onClick={() => {
                  onClose();
                  onConvertAi(shorts);
                }}
                className="w-full bg-[#D4AF37] hover:bg-[#C49F2C] text-[#1B4731] font-extrabold py-3.5 px-5 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-xl border border-[#F3E5AB] active:scale-98 transition-all"
              >
                <Sparkles size={18} className="text-[#1B4731]" />
                <span>이 쇼츠로 AI 레시피 추출하기</span>
              </button>
            )}

            <a
              href={`https://www.youtube.com/shorts/${shorts.youtubeId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#1B4731] hover:bg-[#255e42] text-[#FDFBF4] hover:text-white font-semibold py-3 px-5 rounded-2xl text-xs flex items-center justify-center gap-2 border border-[#D4AF37]/30 transition-all"
            >
              <ExternalLink size={14} className="text-[#D4AF37]" />
              <span>YouTube에서 직접 보기</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
