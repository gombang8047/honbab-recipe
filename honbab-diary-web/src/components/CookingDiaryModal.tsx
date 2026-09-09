'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Camera, Star, Sparkles, CheckCircle2, Flame, Award, AlertCircle, BookOpen, Search, Bookmark, Edit3, Loader2 } from 'lucide-react';
import { diaryService, CookingDiaryEntry } from '@/services/diaryService';
import { soundService } from '@/services/soundService';
import { shortsApi, ShortsItem } from '@/services/shortsApi';

interface CookingDiaryModalProps {
  isOpen: boolean;
  recipeId?: number;
  recipeTitle?: string;
  onClose: () => void;
  onSuccess?: (entry: CookingDiaryEntry) => void;
}

// 사진이 바로 없을 때 빠르게 테스트해볼 수 있는 예시 자취 요리 프리셋
const QUICK_SAMPLE_PHOTOS = [
  { label: '계란 요리', url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&q=80' },
  { label: '볶음밥/덮밥', url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&q=80' },
  { label: '파스타/면', url: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281541?w=600&q=80' },
  { label: '고기/구이', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80' }
];

// 검색 추천 퀵 태그
const QUICK_SEARCH_TAGS = ['계란', '볶음밥', '파스타', '라면', '스팸', '김치', '원팬', '토스트'];

export const CookingDiaryModal: React.FC<CookingDiaryModalProps> = ({
  isOpen,
  recipeId = 0,
  recipeTitle = '',
  onClose,
  onSuccess
}) => {
  const [customTitle, setCustomTitle] = useState<string>(recipeTitle || '');
  const [linkedRecipeId, setLinkedRecipeId] = useState<number>(recipeId || 0);
  const [linkedShortsThumbnail, setLinkedShortsThumbnail] = useState<string>('');
  
  // 숏츠 선택 탭: 'bookmark' (내가 찜한 숏츠) | 'search' (검색해서 찾기)
  const [selectedTab, setSelectedTab] = useState<'bookmark' | 'search'>('bookmark');
  const [bookmarks, setBookmarks] = useState<ShortsItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<ShortsItem[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [shortsPool, setShortsPool] = useState<ShortsItem[]>([]);
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);

  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [privateDiary, setPrivateDiary] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [resultData, setResultData] = useState<{
    earnedXp: number;
    streakBonus: number;
    isLevelUp: boolean;
    newLevel: number;
    newLevelTitle: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 모달 열릴 때 북마크 및 쇼츠 풀 로드
  useEffect(() => {
    if (isOpen) {
      shortsApi.getBookmarks().then((bms) => {
        setBookmarks(bms);
        if (bms.length === 0) {
          setSelectedTab('search');
        }
      });
      // 검색 및 빠른 선택을 위한 쇼츠 풀 로드
      shortsApi.getTrendingPaginated(0, 30).then((data) => {
        if (data.items && data.items.length > 0) {
          setShortsPool(data.items);
          setSearchResults(data.items.slice(0, 8));
        }
      });

      if (recipeId) {
        setLinkedRecipeId(recipeId);
        setCustomTitle(recipeTitle || '');
      }
    }
  }, [isOpen, recipeId, recipeTitle]);

  // 검색 실행 핸들러
  const handleSearch = useCallback(async (keyword: string) => {
    const trimmed = keyword.trim();
    if (!trimmed) {
      setSearchResults(shortsPool.slice(0, 8));
      return;
    }

    setIsSearching(true);
    try {
      const res = await shortsApi.searchPaginated(trimmed, 0, 15);
      if (res && res.items && res.items.length > 0) {
        setSearchResults(res.items);
      } else {
        // Fallback: 로컬 쇼츠 풀에서 제목/태그 매칭
        const localMatches = shortsPool.filter((item) =>
          item.title.toLowerCase().includes(trimmed.toLowerCase()) ||
          (item.tags && item.tags.some((t) => t.toLowerCase().includes(trimmed.toLowerCase())))
        );
        setSearchResults(localMatches);
      }
    } catch {
      const localMatches = shortsPool.filter((item) =>
        item.title.toLowerCase().includes(trimmed.toLowerCase())
      );
      setSearchResults(localMatches);
    } finally {
      setIsSearching(false);
    }
  }, [shortsPool]);

  // ESC 키 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !resultData) onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, resultData, onClose]);

  // 모달 닫을 때 상태 초기화
  const handleResetAndClose = () => {
    setPhotoUrl('');
    setRating(5);
    setComment('');
    setPrivateDiary('');
    setLinkedRecipeId(recipeId || 0);
    setCustomTitle(recipeTitle || '');
    setLinkedShortsThumbnail('');
    setIsCustomMode(false);
    setSearchQuery('');
    setResultData(null);
    onClose();
  };

  if (!isOpen) return null;

  // 사진 파일 선택 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    soundService.playButtonClick();
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      setPhotoUrl(base64);
    };
    reader.readAsDataURL(file);
  };

  const isFormValid = photoUrl.trim().length > 0 && comment.trim().length >= 10;

  // 일기 등록 제출
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    soundService.playButtonClick();

    try {
      const finalRecipeId = linkedRecipeId || recipeId || 0;
      const finalTitle = customTitle.trim() || recipeTitle || '오늘의 집밥 요리';
      const res = diaryService.addDiaryEntry({
        recipeId: finalRecipeId,
        recipeTitle: finalTitle,
        photoUrl,
        rating,
        comment,
        privateDiary
      });

      soundService.playPaymentSuccess();
      setResultData({
        earnedXp: res.earnedXp,
        streakBonus: res.streakBonus,
        isLevelUp: res.isLevelUp,
        newLevel: res.levelInfo.level,
        newLevelTitle: res.levelInfo.title
      });

      if (onSuccess) {
        onSuccess(res.entry);
      }
    } catch (err) {
      console.error('일기 등록 실패:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      {/* Dark backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
        onClick={() => {
          if (!resultData) handleResetAndClose();
        }}
      />

      {/* Modal Container: 화면 가로 70% (w-[94vw] lg:w-[70vw] max-w-5xl) */}
      <div className="relative z-10 w-[94vw] sm:w-[90vw] lg:w-[70vw] max-w-5xl bg-[#133624] border border-[#D4AF37]/50 rounded-3xl overflow-hidden shadow-2xl p-5 sm:p-8 flex flex-col gap-6 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={handleResetAndClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-[#D9D2BE] hover:text-white hover:bg-black/80 transition-all border border-[#D4AF37]/20 z-20"
          title="닫기"
        >
          <X size={18} />
        </button>

        {/* 1. 성공 축하 화면 */}
        {resultData ? (
          <div className="flex flex-col items-center text-center gap-5 py-6 max-w-md mx-auto animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-full bg-[#D4AF37] flex items-center justify-center text-[#1B4731] shadow-2xl ring-4 ring-[#D4AF37]/40 animate-bounce">
              <Award size={44} />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-[#D4AF37] flex items-center justify-center gap-1">
                <Sparkles size={14} />
                <span>공식 요리 인증 완료!</span>
              </span>
              <h2 className="text-2xl font-black text-[#FDFBF4]">
                혼밥 일기가 등록되었습니다! 🎉
              </h2>
              <p className="text-xs text-[#E7E2D3] mt-1">
                마이페이지 일기장과 레시피 하단에 자랑스럽게 기록되었습니다.
              </p>
            </div>

            {/* XP Badge Box */}
            <div className="w-full bg-[#0D2418]/90 rounded-2xl p-4 border border-[#D4AF37]/40 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#D9D2BE]">기본 요리 인증 경험치</span>
                <span className="text-sm font-extrabold text-[#D4AF37]">+100 XP</span>
              </div>

              {resultData.streakBonus > 0 && (
                <div className="flex items-center justify-between border-t border-[#D4AF37]/20 pt-2">
                  <span className="text-xs text-orange-400 flex items-center gap-1 font-semibold">
                    <Flame size={14} />
                    <span>연속 집밥 스트릭 보너스</span>
                  </span>
                  <span className="text-sm font-extrabold text-orange-400">+{resultData.streakBonus} XP</span>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-[#D4AF37]/30 pt-2.5">
                <span className="text-xs font-bold text-[#FDFBF4]">총 획득 경험치</span>
                <span className="text-base font-black text-[#D4AF37]">
                  +{resultData.earnedXp} XP 획득!
                </span>
              </div>
            </div>

            {/* Level Up Notification */}
            {resultData.isLevelUp && (
              <div className="w-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/50 rounded-2xl p-3.5 flex items-center gap-3">
                <span className="text-2xl">👑</span>
                <div className="text-left">
                  <span className="text-[11px] font-bold text-amber-300 block">축하합니다! 레벨업 달성!</span>
                  <span className="text-sm font-extrabold text-white">
                    Lv.{resultData.newLevel} {resultData.newLevelTitle}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleResetAndClose}
              className="w-full mt-2 bg-[#D4AF37] hover:bg-[#C49F2C] text-[#1B4731] font-extrabold py-3.5 px-6 rounded-xl text-sm shadow-xl active:scale-98 transition-all"
            >
              확인
            </button>
          </div>
        ) : (
          /* 2. 일기 작성 폼: 가로 70% 화면에 어울리는 2단 반응형 그리드 */
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Header Title */}
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#D4AF37]">
                <Camera size={14} />
                <span>혼밥 요리 공식 인증</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#FDFBF4] mt-1 tracking-tight">
                오늘의 혼밥 일기 남기기 📸
              </h2>
            </div>

            {/* 2-Column Responsive Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column (5/12): 요리 사진 & 별점 */}
              <div className="lg:col-span-5 flex flex-col gap-5">
                {/* Photo Upload Area */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-[#FDFBF4] flex items-center justify-between">
                    <span>완성 요리 사진 (필수 *)</span>
                    <span className="text-[10px] text-[#D4AF37] font-semibold">경험치 지급 필수</span>
                  </label>

                  {photoUrl ? (
                    <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden border-2 border-[#D4AF37]/50 shadow-md group bg-black">
                      <img src={photoUrl} alt="완성 요리 인증샷" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPhotoUrl('')}
                        className="absolute top-3 right-3 p-1.5 rounded-full bg-black/70 hover:bg-black text-white transition-all shadow border border-white/20"
                        title="사진 삭제"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-[4/3] w-full rounded-2xl border-2 border-dashed border-[#D4AF37]/40 hover:border-[#D4AF37] bg-[#0D2418]/60 hover:bg-[#0D2418]/90 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer text-center p-6 group"
                    >
                      <div className="w-14 h-14 rounded-full bg-[#1B4731] flex items-center justify-center text-[#D4AF37] border border-[#D4AF37]/30 group-hover:scale-110 transition-transform shadow">
                        <Camera size={28} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-[#FDFBF4]">
                          직접 찍은 요리 사진 업로드하기
                        </span>
                        <span className="text-xs text-[#D9D2BE]">
                          카메라 촬영 또는 갤러리 사진 첨부
                        </span>
                      </div>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {/* Quick Sample Presets */}
                  {!photoUrl && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-[#D9D2BE] shrink-0 font-medium">빠른 예시:</span>
                      {QUICK_SAMPLE_PHOTOS.map((sample, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            soundService.playButtonClick();
                            setPhotoUrl(sample.url);
                          }}
                          className="text-[10px] px-2.5 py-1 rounded-lg bg-[#1B4731] hover:bg-[#22573d] text-[#D4AF37] border border-[#D4AF37]/30 font-semibold transition-all active:scale-95"
                        >
                          +{sample.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Star Rating */}
                <div className="p-4 rounded-2xl bg-[#0D2418] border border-[#D4AF37]/30 flex flex-col gap-2">
                  <label className="text-xs font-bold text-[#FDFBF4]">내 입맛 만족도 별점</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => {
                          soundService.playButtonClick();
                          setRating(star);
                        }}
                        className="p-1 text-[#D4AF37] hover:scale-110 transition-transform active:scale-95"
                      >
                        <Star
                          size={24}
                          fill={star <= rating ? 'currentColor' : 'none'}
                          className={star <= rating ? 'text-[#D4AF37]' : 'text-stone-600'}
                        />
                      </button>
                    ))}
                    <span className="text-xs text-[#D4AF37] font-extrabold ml-1">
                      {rating === 5 ? '최고의 1끼! ⭐⭐⭐⭐⭐' : `${rating}점`}
                    </span>
                  </div>
                </div>

                {/* 인증 보상 안내 팁 */}
                <div className="p-3.5 rounded-2xl bg-[#0D2418]/60 border border-[#D4AF37]/20 flex items-start gap-2.5">
                  <Flame size={18} className="text-orange-400 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-[#E7E2D3] leading-relaxed">
                    <span className="text-[#D4AF37] font-bold">인증 시 +100 XP 즉시 획득!</span>
                    <p className="mt-0.5 text-stone-300">연속으로 일기를 작성하면 스트릭 보너스 XP가 추가 지급됩니다.</p>
                  </div>
                </div>
              </div>

              {/* Right Column (7/12): 숏츠 연동 선택기, 한줄평, 개인 일기장, 제출 */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                {/* 숏츠 레시피 연동 섹션 */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-[#FDFBF4] flex items-center justify-between">
                    <span>어떤 숏츠 요리를 만드셨나요?</span>
                    {recipeTitle && (
                      <span className="text-[10px] text-emerald-400 font-semibold">현재 레시피 연동 중</span>
                    )}
                  </label>

                  {recipeTitle ? (
                    <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#0D2418] border border-emerald-500/40 text-xs text-[#FDFBF4]">
                      <span className="text-emerald-400 font-bold">✓ 숏츠 연동:</span>
                      <span className="font-semibold truncate">{recipeTitle}</span>
                    </div>
                  ) : linkedRecipeId > 0 || (isCustomMode && customTitle) ? (
                    /* 선택 완료 카드 */
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#0D2418] border border-[#D4AF37]/50 shadow-md">
                      <div className="flex items-center gap-3 min-w-0">
                        {linkedShortsThumbnail ? (
                          <img
                            src={linkedShortsThumbnail}
                            alt={customTitle}
                            className="w-12 h-12 rounded-xl object-cover border border-[#D4AF37]/30 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-[#1B4731] text-[#D4AF37] flex items-center justify-center text-xl shrink-0 font-bold">
                            🍳
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                            <span>{linkedRecipeId > 0 ? '✓ 숏츠 레시피 연동 완료' : '✏️ 직접 입력 요리'}</span>
                          </span>
                          <h4 className="text-xs sm:text-sm font-bold text-[#FDFBF4] truncate mt-0.5">
                            {customTitle || '요리 이름 미입력'}
                          </h4>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          soundService.playButtonClick();
                          setLinkedRecipeId(0);
                          setCustomTitle('');
                          setLinkedShortsThumbnail('');
                          setIsCustomMode(false);
                        }}
                        className="text-xs text-[#D4AF37] hover:underline px-3 py-1.5 rounded-xl hover:bg-[#1B4731] shrink-0 font-bold border border-[#D4AF37]/30 transition-all"
                      >
                        변경하기
                      </button>
                    </div>
                  ) : isCustomMode ? (
                    /* 직접 입력 인풋 모드 */
                    <div className="p-4 rounded-2xl bg-[#0D2418] border border-[#D4AF37]/40 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#FDFBF4] flex items-center gap-1.5">
                          <Edit3 size={13} className="text-[#D4AF37]" />
                          <span>요리 이름 직접 입력하기</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsCustomMode(false)}
                          className="text-[11px] text-[#D4AF37] hover:underline"
                        >
                          목록에서 선택으로 전환
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={customTitle}
                          onChange={(e) => setCustomTitle(e.target.value)}
                          placeholder="오늘 만든 요리 이름 (예: 엄마표 된장찌개, 김치말이국수)"
                          className="flex-1 bg-[#133624] border border-[#D4AF37]/40 rounded-xl px-3.5 py-2 text-xs text-[#FDFBF4] placeholder-[#8C9B90] outline-none focus:border-[#D4AF37]"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!customTitle.trim()) return;
                            soundService.playButtonClick();
                          }}
                          className="px-3.5 py-2 rounded-xl bg-[#D4AF37] text-[#1B4731] text-xs font-bold shrink-0 shadow active:scale-95"
                        >
                          확인
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* 2가지 선택 옵션: 1) 내가 찜한 숏츠에서 선택 / 2) 검색해서 찾기 */
                    <div className="rounded-2xl bg-[#0D2418] border border-[#D4AF37]/40 overflow-hidden">
                      {/* Tab Header */}
                      <div className="flex items-center justify-between border-b border-[#D4AF37]/25 px-2 pt-2 bg-[#0a1c13]">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              soundService.playButtonClick();
                              setSelectedTab('bookmark');
                            }}
                            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-xl transition-all ${
                              selectedTab === 'bookmark'
                                ? 'bg-[#0D2418] text-[#D4AF37] border-t-2 border-[#D4AF37]'
                                : 'text-stone-400 hover:text-white'
                            }`}
                          >
                            <Bookmark size={13} fill={selectedTab === 'bookmark' ? 'currentColor' : 'none'} />
                            <span>내가 찜한 숏츠</span>
                            {bookmarks.length > 0 && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] font-extrabold">
                                {bookmarks.length}
                              </span>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              soundService.playButtonClick();
                              setSelectedTab('search');
                            }}
                            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-xl transition-all ${
                              selectedTab === 'search'
                                ? 'bg-[#0D2418] text-[#D4AF37] border-t-2 border-[#D4AF37]'
                                : 'text-stone-400 hover:text-white'
                            }`}
                          >
                            <Search size={13} />
                            <span>숏츠 검색해서 찾기</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            soundService.playButtonClick();
                            setIsCustomMode(true);
                          }}
                          className="text-[11px] text-amber-300 hover:underline font-semibold pr-2 pb-1"
                        >
                          직접 입력 ✏️
                        </button>
                      </div>

                      {/* Tab 1: 내가 찜한 숏츠에서 선택 */}
                      {selectedTab === 'bookmark' && (
                        <div className="p-3 flex flex-col gap-2">
                          {bookmarks.length === 0 ? (
                            <div className="py-6 flex flex-col items-center justify-center text-center gap-2">
                              <Bookmark size={24} className="text-stone-500" />
                              <p className="text-xs text-stone-400">
                                아직 북마크(찜)한 숏츠 요리가 없습니다.
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  soundService.playButtonClick();
                                  setSelectedTab('search');
                                }}
                                className="text-xs text-[#D4AF37] hover:underline font-bold"
                              >
                                🔍 검색으로 숏츠 찾아보기
                              </button>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[170px] overflow-y-auto pr-1 scrollbar-thin">
                              {bookmarks.map((bm) => (
                                <button
                                  key={bm.id}
                                  type="button"
                                  onClick={() => {
                                    soundService.playButtonClick();
                                    setLinkedRecipeId(bm.id);
                                    setCustomTitle(bm.title);
                                    setLinkedShortsThumbnail(bm.thumbnailUrl);
                                  }}
                                  className="flex items-center gap-2.5 p-2 rounded-xl bg-[#133624] hover:bg-[#1B4731] border border-[#D4AF37]/25 hover:border-[#D4AF37] transition-all text-left group active:scale-98"
                                >
                                  <img
                                    src={bm.thumbnailUrl}
                                    alt={bm.title}
                                    className="w-10 h-10 rounded-lg object-cover shrink-0"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <h5 className="text-xs font-bold text-[#FDFBF4] truncate group-hover:text-[#D4AF37]">
                                      {bm.title}
                                    </h5>
                                    <span className="text-[10px] text-[#A6C4B0] truncate block">
                                      {bm.channelName}
                                    </span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tab 2: 숏츠 검색해서 찾기 */}
                      {selectedTab === 'search' && (
                        <div className="p-3 flex flex-col gap-2.5">
                          {/* Search Input Bar */}
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                              <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                  setSearchQuery(e.target.value);
                                  handleSearch(e.target.value);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSearch(searchQuery);
                                  }
                                }}
                                placeholder="숏츠 요리 이름 또는 재료 검색 (예: 김치볶음밥, 계란, 파스타...)"
                                className="w-full bg-[#133624] border border-[#D4AF37]/35 rounded-xl pl-8 pr-3 py-2 text-xs text-[#FDFBF4] placeholder-stone-400 outline-none focus:border-[#D4AF37]"
                              />
                            </div>
                            {searchQuery.trim() && (
                              <button
                                type="button"
                                onClick={() => {
                                  soundService.playButtonClick();
                                  setLinkedRecipeId(0);
                                  setCustomTitle(searchQuery.trim());
                                  setIsCustomMode(true);
                                }}
                                className="px-3 py-2 rounded-xl bg-[#1B4731] hover:bg-[#255e41] text-[#D4AF37] border border-[#D4AF37]/40 text-xs font-bold shrink-0 transition-all"
                                title="입력한 단어로 직접 요리명 지정"
                              >
                                직접 지정
                              </button>
                            )}
                          </div>

                          {/* Quick Search Tag Pills */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] text-[#D9D2BE]/80 shrink-0 font-medium">추천:</span>
                            {QUICK_SEARCH_TAGS.map((tag) => (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => {
                                  soundService.playButtonClick();
                                  setSearchQuery(tag);
                                  handleSearch(tag);
                                }}
                                className="text-[10px] px-2 py-0.5 rounded-lg bg-[#133624] hover:bg-[#1B4731] text-[#D9D2BE] hover:text-[#D4AF37] border border-[#D4AF37]/20 transition-all font-medium active:scale-95"
                              >
                                #{tag}
                              </button>
                            ))}
                          </div>

                          {/* Search Results Grid */}
                          <div className="max-h-[170px] overflow-y-auto pr-1 scrollbar-thin">
                            {isSearching ? (
                              <div className="py-6 flex items-center justify-center gap-2 text-xs text-[#D4AF37]">
                                <Loader2 size={16} className="animate-spin" />
                                <span>숏츠 레시피 검색 중...</span>
                              </div>
                            ) : searchResults.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {searchResults.map((item) => (
                                  <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => {
                                      soundService.playButtonClick();
                                      setLinkedRecipeId(item.id);
                                      setCustomTitle(item.title);
                                      setLinkedShortsThumbnail(item.thumbnailUrl);
                                    }}
                                    className="flex items-center gap-2.5 p-2 rounded-xl bg-[#133624] hover:bg-[#1B4731] border border-[#D4AF37]/25 hover:border-[#D4AF37] transition-all text-left group active:scale-98"
                                  >
                                    <img
                                      src={item.thumbnailUrl}
                                      alt={item.title}
                                      className="w-10 h-10 rounded-lg object-cover shrink-0"
                                    />
                                    <div className="min-w-0 flex-1">
                                      <h5 className="text-xs font-bold text-[#FDFBF4] truncate group-hover:text-[#D4AF37]">
                                        {item.title}
                                      </h5>
                                      <span className="text-[10px] text-[#A6C4B0] truncate block">
                                        {item.channelName}
                                      </span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div className="py-6 text-center text-xs text-stone-400">
                                검색 결과가 없습니다. 다른 검색어를 입력해보시거나 직접 입력해주세요.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Comment & Tips (Min 10 characters) */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#FDFBF4]">
                      한줄평 & 나만의 꿀팁 (필수 *)
                    </label>
                    <span
                      className={`text-[11px] font-mono font-semibold ${
                        comment.trim().length >= 10 ? 'text-[#D4AF37]' : 'text-stone-400'
                      }`}
                    >
                      {comment.trim().length}/10자 이상
                    </span>
                  </div>

                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={2}
                    placeholder="예: 파기름을 약불에 2분 정도 볶다가 굴소스를 넣으니 감칠맛이 최고예요! (10자 이상 작성 시 인증 인정)"
                    className="w-full bg-[#0D2418] border border-[#D4AF37]/30 focus:border-[#D4AF37] rounded-xl p-3 text-xs text-[#FDFBF4] placeholder-stone-400 outline-none resize-none transition-all leading-relaxed"
                  />
                </div>

                {/* Private Personal Diary (선택 사항, 나만 보기) */}
                <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-[#0D2418]/80 border border-[#D4AF37]/25 shadow-sm">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#FDFBF4] flex items-center gap-1.5">
                      <BookOpen size={14} className="text-[#D4AF37]" />
                      <span>나만의 요리 일기장</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 font-semibold">
                        선택사항 · 나만 보기 🔒
                      </span>
                    </label>
                    <span className="text-[10px] text-[#D9D2BE]/60 font-mono">비공개</span>
                  </div>

                  <p className="text-[11px] text-[#D9D2BE]/80 leading-tight">
                    오늘 하루 있었던 일이나 요리하면서 느낀 기분을 일기처럼 자유롭게 적어보세요. (마이페이지에서 나만 볼 수 있어요)
                  </p>

                  <textarea
                    value={privateDiary}
                    onChange={(e) => setPrivateDiary(e.target.value)}
                    rows={2}
                    placeholder="예: 오늘 야근하고 지쳤는데 그래도 배달 대신 집밥 해먹었다. 파기름 냄새 맡으니 힐링되는 기분!"
                    className="w-full bg-[#133624] border border-[#D4AF37]/30 focus:border-[#D4AF37] rounded-xl p-2.5 text-xs text-[#FDFBF4] placeholder-[#8C9B90] outline-none resize-none transition-all leading-relaxed"
                  />
                </div>

                {/* Mandatory Warning Helper */}
                {!isFormValid && (
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>사진 첨부와 10자 이상의 한줄평이 모두 작성되어야 경험치가 지급됩니다.</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!isFormValid || isSubmitting}
                  className={`w-full py-3.5 px-5 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-xl transition-all ${
                    isFormValid
                      ? 'bg-[#D4AF37] hover:bg-[#C49F2C] text-[#1B4731] active:scale-98 cursor-pointer'
                      : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
                  }`}
                >
                  <CheckCircle2 size={16} />
                  <span>
                    {isFormValid ? '요리 일기 등록하고 경험치 +100 XP 받기 🚀' : '사진과 10자 이상 한줄평을 작성해 주세요'}
                  </span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
