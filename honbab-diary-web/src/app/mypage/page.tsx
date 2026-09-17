'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  ChefHat,
  Bookmark,
  DollarSign,
  TrendingDown,
  Sparkles,
  ShieldAlert,
  Plus,
  X,
  Edit2,
  Check,
  ChevronRight,
  ShoppingCart,
  Receipt,
  Flame,
  Award,
  Camera,
  Star,
  Heart,
  Calendar,
  BookOpen,
  ExternalLink,
  Lock,
  Trash2,
} from 'lucide-react';
import { settingsService, AppSettings } from '@/services/settingsService';
import { shortsApi, ShortsItem } from '@/services/shortsApi';
import { authApi } from '@/services/authApi';
import { soundService } from '@/services/soundService';
import { diaryService, CookingDiaryEntry, UserLevelInfo, LEVEL_TIERS } from '@/services/diaryService';

const POPULAR_DISLIKED_TAGS = ['오이', '당근', '가지', '고수', '피망', '버섯', '파프리카', '양파'];

export default function MyPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState<string>('자취 미식가');
  const [isEditingNickname, setIsEditingNickname] = useState<boolean>(false);
  const [editNameInput, setEditNameInput] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  const [settings, setSettings] = useState<AppSettings>(settingsService.getSettings());
  const [newDislikeInput, setNewDislikeInput] = useState<string>('');

  const [recentBookmarks, setRecentBookmarks] = useState<ShortsItem[]>([]);
  const [bookmarkCount, setBookmarkCount] = useState<number>(0);

  // 요리 일기장 및 레벨/스트릭 상태
  const [userLevelInfo, setUserLevelInfo] = useState<UserLevelInfo | null>(null);
  const [streakDays, setStreakDays] = useState<number>(0);
  const [myDiaries, setMyDiaries] = useState<CookingDiaryEntry[]>([]);
  const [selectedDiary, setSelectedDiary] = useState<CookingDiaryEntry | null>(null);
  const [isLevelModalOpen, setIsLevelModalOpen] = useState<boolean>(false);

  const refreshDiaryData = () => {
    setUserLevelInfo(diaryService.getUserLevelInfo());
    setStreakDays(diaryService.getStreakDays());
    setMyDiaries(diaryService.getMyDiaries());
  };

  useEffect(() => {
    // Load auth
    const token = localStorage.getItem('accessToken');
    setIsLoggedIn(!!token);

    const savedName = localStorage.getItem('userNickname') || '자취 미식가';
    setNickname(savedName);
    setEditNameInput(savedName);

    // Load settings
    setSettings(settingsService.getSettings());

    // Load bookmarks
    shortsApi.getBookmarks().then((list) => {
      setRecentBookmarks(list.slice(0, 3));
      setBookmarkCount(list.length);
    });

    // Load diary & level data
    refreshDiaryData();

    const handleDiaryChange = () => {
      refreshDiaryData();
    };

    window.addEventListener('diary-added', handleDiaryChange);
    window.addEventListener('diary-updated', handleDiaryChange);

    return () => {
      window.removeEventListener('diary-added', handleDiaryChange);
      window.removeEventListener('diary-updated', handleDiaryChange);
    };
  }, []);

  const handleSaveNickname = () => {
    soundService.playButtonClick();
    const trimmed = editNameInput.trim();
    if (trimmed) {
      setNickname(trimmed);
      localStorage.setItem('userNickname', trimmed);
      window.dispatchEvent(new Event('auth-change'));
    }
    setIsEditingNickname(false);
  };

  // 기피 식재료 토글/추가
  const handleToggleDislike = (tag: string) => {
    soundService.playButtonClick();
    const current = settings.dietary.dislikedIngredients;
    let next: string[];
    if (current.includes(tag)) {
      next = current.filter((t) => t !== tag);
    } else {
      next = [...current, tag];
    }
    const updated = settingsService.updateSettings({
      dietary: { ...settings.dietary, dislikedIngredients: next },
    });
    setSettings(updated);
  };

  const handleAddCustomDislike = (e: React.FormEvent) => {
    e.preventDefault();
    const val = newDislikeInput.trim();
    if (val && !settings.dietary.dislikedIngredients.includes(val)) {
      soundService.playButtonClick();
      const updated = settingsService.updateSettings({
        dietary: {
          ...settings.dietary,
          dislikedIngredients: [...settings.dietary.dislikedIngredients, val],
        },
      });
      setSettings(updated);
      setNewDislikeInput('');
    }
  };



  const handleLogout = async () => {
    soundService.playButtonClick();
    await authApi.logout();
    router.push('/login');
  };

  // 자취 절약 통계 (실제 인증된 혼밥 일기 개수 기준)
  const mealsCooked = myDiaries.length;
  const avgDiningCost = 12000;
  const avgCookCost = 5500;
  const totalSaved = mealsCooked * (avgDiningCost - avgCookCost);

  const handleToggleLike = (e: React.MouseEvent, diaryId: string) => {
    e.stopPropagation();
    soundService.playHeartPop();
    diaryService.toggleLike(diaryId);
    if (selectedDiary && selectedDiary.id === diaryId) {
      setSelectedDiary(prev => prev ? { ...prev, isLiked: !prev.isLiked, likes: prev.isLiked ? prev.likes - 1 : prev.likes + 1 } : null);
    }
  };

  const handleDeleteDiary = (e: React.MouseEvent, diaryId: string) => {
    e.stopPropagation();
    if (!window.confirm('정말 이 요리 일기를 삭제하시겠습니까?')) return;
    soundService.playButtonClick();
    diaryService.deleteDiary(diaryId);
    setMyDiaries(prev => prev.filter(d => d.id !== diaryId));
    if (selectedDiary && selectedDiary.id === diaryId) {
      setSelectedDiary(null);
    }
  };

  const formatDate = (val: string | number) => {
    try {
      const d = new Date(val);
      return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
    } catch {
      return String(val);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 text-[#FDFBF4]">
      {/* 1. 프로필 요약 카드 */}
      <div className="p-6 sm:p-8 rounded-3xl border border-[#D4AF37]/40 bg-[#133624] shadow-2xl mb-8 relative overflow-hidden">
        {/* Background ambient glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#D4AF37]/15 via-[#1B4731]/30 to-transparent rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5 flex-1 min-w-0">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-[#F3E5AB] p-1 shadow-xl">
                <div className="w-full h-full rounded-xl bg-[#0D2418] flex items-center justify-center text-[#FDFBF4] text-2xl font-bold">
                  {nickname.charAt(0) || '혼'}
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-[#D4AF37] text-[#1B4731] p-1 rounded-full shadow border-2 border-[#133624]">
                <Award size={14} />
              </div>
            </div>

            {/* Profile Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                {isEditingNickname ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editNameInput}
                      onChange={(e) => setEditNameInput(e.target.value)}
                      className="bg-[#0D2418] border border-[#D4AF37] rounded-lg px-2.5 py-1 text-sm text-[#FDFBF4] outline-none w-40 font-semibold"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveNickname}
                      className="p-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#C49F2C] text-[#1B4731] transition-colors"
                      title="저장"
                    >
                      <Check size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold text-[#FDFBF4]">{nickname}</h1>
                    <button
                      onClick={() => {
                        soundService.playButtonClick();
                        setIsEditingNickname(true);
                      }}
                      className="p-1 text-[#D9D2BE] hover:text-[#FDFBF4] transition-colors"
                      title="닉네임 변경"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                )}
                {userLevelInfo && (
                  <button
                    onClick={() => {
                      soundService.playButtonClick();
                      setIsLevelModalOpen(true);
                    }}
                    className="text-xs px-3 py-1 rounded-full bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#D4AF37] border border-[#D4AF37]/40 font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 group cursor-pointer"
                    title="혼밥 요리사 20단계 전체 등급표 보기"
                  >
                    <span>{userLevelInfo.badgeEmoji}</span>
                    <span>Lv.{userLevelInfo.level} {userLevelInfo.title}</span>
                    <span className="text-[10px] text-[#D4AF37]/70 group-hover:text-[#D4AF37] transition-colors ml-0.5 font-normal">
                      [등급표]
                    </span>
                  </button>
                )}
              </div>

              {/* XP Level Progress Bar */}
              {userLevelInfo && (
                <div className="mt-2.5 w-full max-w-md bg-[#0D2418] p-2.5 rounded-xl border border-[#D4AF37]/30">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-[#D9D2BE] font-semibold flex items-center gap-1">
                      <Award size={12} className="text-[#D4AF37]" />
                      <span>경험치: <strong className="text-[#D4AF37]">{userLevelInfo.currentXp.toLocaleString()} XP</strong></span>
                    </span>
                    <span className="text-[#D9D2BE]/80 text-[10px]">
                      {userLevelInfo.level >= 20 ? (
                        <strong className="text-[#D4AF37]">최고 등급 달성! 👑</strong>
                      ) : (
                        <>다음 등급까지 <strong className="text-[#D4AF37]">{userLevelInfo.xpToNext.toLocaleString()} XP</strong> 남음</>
                      )}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#1B4731] rounded-full overflow-hidden border border-[#D4AF37]/30 p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-[#D4AF37] via-[#E5C358] to-[#D4AF37] rounded-full transition-all duration-500 shadow-sm"
                      style={{ width: `${Math.min(100, Math.max(5, userLevelInfo.progressPercent))}%` }}
                    />
                  </div>
                </div>
              )}

              <p className="text-xs text-[#D9D2BE] mt-2 flex items-center gap-2 flex-wrap">
                <span>카카오 연동 회원</span>
                <span className="text-[#D4AF37]/40">•</span>
                {streakDays > 0 ? (
                  <span className="text-orange-400 font-semibold flex items-center gap-1 bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/20">
                    <Flame size={13} className="text-orange-500 animate-pulse" />
                    연속 {streakDays}일 집밥 달성 중! 🔥
                  </span>
                ) : (
                  <span className="text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    오늘 요리 인증하고 연속 집밥 스트릭 시작하기! 🍳
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Quick Action Navigation */}
          <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
            <button
              onClick={() => {
                soundService.playButtonClick();
                router.push('/diary/write');
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#C49F2C] text-[#1B4731] text-xs font-extrabold transition-all shadow-lg active:scale-95"
            >
              <Camera size={15} />
              <span>오늘 요리 인증</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. 혼밥 대시보드 (자취 절약 & 요리 통계) */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#FDFBF4] flex items-center gap-2">
            <Sparkles size={18} className="text-[#D4AF37]" />
            나의 혼밥 레벨 & 요리 통계
          </h2>
          <span className="text-xs text-[#D9D2BE]/70 font-mono">실시간 반영</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Meals Cooked */}
          <div className="p-5 rounded-2xl border border-[#D4AF37]/30 bg-[#133624] shadow-lg flex flex-col justify-between">
            <div>
              <span className="text-xs text-[#D9D2BE] font-medium">직접 만든 집밥</span>
              <div className="text-2xl font-bold text-[#FDFBF4] mt-1">
                {mealsCooked}
                <span className="text-sm font-normal text-[#D9D2BE] ml-1">회</span>
              </div>
              <span className="text-[11px] text-[#D4AF37] mt-1 block">
                {mealsCooked > 0 ? `누적 ${mealsCooked}회 인증 완료` : '첫 요리를 인증해보세요'}
              </span>
            </div>
          </div>

          {/* Card 2: Saved Money */}
          <div className="p-5 rounded-2xl border border-[#D4AF37]/30 bg-[#133624] shadow-lg flex flex-col justify-between">
            <div>
              <span className="text-xs text-[#D9D2BE] font-medium">절약한 외식비</span>
              <div className="text-2xl font-bold text-emerald-400 mt-1">
                +{totalSaved.toLocaleString()}
                <span className="text-sm font-normal text-[#D9D2BE] ml-1">원</span>
              </div>
              <span className="text-[11px] text-[#D9D2BE]/70 mt-1 block">외식 1회 평균 대비</span>
            </div>
          </div>

          {/* Card 3: Streak */}
          <div className="p-5 rounded-2xl border border-[#D4AF37]/30 bg-[#133624] shadow-lg flex flex-col justify-between">
            <div>
              <span className="text-xs text-[#D9D2BE] font-medium">연속 집밥 스트릭</span>
              <div className="text-2xl font-bold text-[#D4AF37] mt-1">
                {streakDays}
                <span className="text-sm font-normal text-[#D9D2BE] ml-1">일째</span>
              </div>
              <span className="text-[11px] text-[#D4AF37]/90 mt-1 block">
                {streakDays > 0 ? `연속 보너스 +${Math.min(50, streakDays * 10)} XP` : '매일 연속 인증 시 보너스'}
              </span>
            </div>
          </div>

          {/* Card 4: Bookmarks */}
          <Link
            href="/bookmarks"
            onClick={() => soundService.playButtonClick()}
            className="p-5 rounded-2xl border border-[#D4AF37]/30 hover:border-[#D4AF37] bg-[#133624] shadow-lg flex flex-col justify-between transition-all group"
          >
            <div>
              <span className="text-xs text-[#D9D2BE] font-medium">저장한 북마크</span>
              <div className="text-2xl font-bold text-[#FDFBF4] mt-1 group-hover:scale-105 transition-transform">
                {bookmarkCount}
                <span className="text-sm font-normal text-[#D9D2BE] ml-1">개</span>
              </div>
              <span className="text-[11px] text-[#D4AF37] mt-1 flex items-center gap-0.5 group-hover:underline">
                보러가기 <ChevronRight size={12} />
              </span>
            </div>
          </Link>
        </div>
      </div>

      {/* 3. 나의 혼밥 일기장 (요리 인증 갤러리) */}
      <div className="p-6 sm:p-8 rounded-3xl border border-[#D4AF37]/40 bg-[#133624] shadow-2xl mb-8 relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/20 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#0D2418] text-[#D4AF37] border border-[#D4AF37]/40 shadow-sm">
              <BookOpen size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#FDFBF4]">나의 혼밥 일기장</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 font-semibold">
                  총 {myDiaries.length}편의 집밥 기록
                </span>
              </div>
              <p className="text-xs text-[#D9D2BE] mt-0.5">
                직접 요리한 사진과 솔직한 한줄평이 남겨진 나만의 요리 갤러리입니다.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundService.playButtonClick();
              router.push('/diary/write');
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#C49F2C] text-[#1B4731] text-xs font-extrabold shadow-md transition-all active:scale-95"
          >
            <Camera size={14} />
            <span>새 요리 일기 쓰기 (+100 XP)</span>
          </button>
        </div>



        {/* Diary Entries Grid */}
        {myDiaries.length === 0 ? (
          <div className="p-10 text-center rounded-2xl border border-dashed border-[#D4AF37]/30 bg-[#0D2418]/60 flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-full bg-[#133624] flex items-center justify-center text-[#D4AF37] border border-[#D4AF37]/30">
              <Camera size={26} />
            </div>
            <p className="text-sm font-semibold text-[#FDFBF4]">아직 등록된 혼밥 일기가 없습니다.</p>
            <p className="text-xs text-[#D9D2BE] max-w-sm">
              오늘 직접 만든 집밥 사진과 꿀팁을 한줄평으로 남겨보세요. +100 XP를 받고 자취 요리사 레벨을 올릴 수 있습니다!
            </p>
            <button
              onClick={() => {
                soundService.playButtonClick();
                router.push('/diary/write');
              }}
              className="mt-2 px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#C49F2C] text-[#1B4731] text-xs font-bold transition-all shadow"
            >
              첫 요리 일기 쓰기 (+100 XP)
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {myDiaries.map((diary) => (
              <div
                key={diary.id}
                onClick={() => {
                  soundService.playButtonClick();
                  setSelectedDiary(diary);
                }}
                className="group rounded-2xl border border-[#D4AF37]/50 hover:border-[#D4AF37] bg-[#FDFBF4] overflow-hidden shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer flex flex-col"
              >
                {/* Photo Thumbnail with verified overlay */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-900">
                  <img
                    src={diary.photoUrl}
                    alt={diary.recipeTitle}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-70" />

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#1B4731]/90 text-[#FDFBF4] text-[10px] font-bold border border-[#D4AF37]/40 backdrop-blur-sm shadow">
                      ✓ 인증 완료
                    </span>
                  </div>

                  <div className="absolute top-2.5 right-2.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-black/70 text-[#D4AF37] text-[11px] font-bold border border-white/20 backdrop-blur-sm flex items-center gap-1 shadow">
                      <Star size={12} className="fill-[#D4AF37] text-[#D4AF37]" />
                      <span>{diary.rating}.0</span>
                    </span>
                  </div>

                  {/* Bottom Recipe Title Overlay */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5">
                    <span className="text-xs font-bold text-white drop-shadow truncate block">
                      {diary.recipeTitle}
                    </span>
                  </div>
                </div>

                {/* Content: Editorial Cream White Body */}
                <div className="p-4 flex flex-col flex-1 justify-between gap-3 bg-[#FDFBF4] text-[#1B4731]">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-[#8C762E] mb-1.5 font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} className="text-[#8C762E]" />
                        <span>{formatDate(diary.createdAt)}</span>
                      </span>
                      {(diary.recipeId > 0 || (diary.shortsId && diary.shortsId > 0)) && (
                        <span className="text-[#1B4731] font-bold text-[10px] hover:underline">
                          레시피 보기 →
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#1B4731] font-medium line-clamp-2 leading-relaxed bg-[#1B4731]/5 p-2.5 rounded-xl border border-[#D4AF37]/30">
                      {diary.comment}
                    </p>

                    {diary.privateDiary && (
                      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#1B4731] bg-[#D4AF37]/20 px-2.5 py-1 rounded-lg border border-[#D4AF37]/40 font-semibold">
                        <Lock size={11} className="text-[#8C762E]" />
                        <span className="truncate">비밀 일기: {diary.privateDiary}</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Likes & Author */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#D4AF37]/25 text-xs">
                    <span className="text-[11px] text-stone-600 font-medium">
                      작성자: <span className="text-[#1B4731] font-bold">{diary.authorName}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => handleToggleLike(e, diary.id)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors border ${
                          diary.isLiked
                            ? 'bg-rose-50 text-rose-600 border-rose-300'
                            : 'bg-[#1B4731]/5 text-stone-700 border border-[#D4AF37]/30 hover:bg-rose-50 hover:text-rose-600'
                        }`}
                        title="맛있어 보여요!"
                      >
                        <Heart size={12} className={diary.isLiked ? 'fill-rose-500 text-rose-500' : ''} />
                        <span>{diary.likes}</span>
                      </button>

                      <button
                        onClick={(e) => handleDeleteDiary(e, diary.id)}
                        className="p-1.5 rounded-full text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors border border-transparent hover:border-rose-200"
                        title="일기 삭제"
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
      </div>

      {/* 4. 기피 식재료 관리 */}
      <div className="p-6 sm:p-8 rounded-3xl border border-[#D4AF37]/40 bg-[#133624] shadow-xl mb-8">
        <div className="flex items-center gap-3 pb-4 border-b border-[#D4AF37]/20 mb-6">
          <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <ShieldAlert size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#FDFBF4]">기피 식재료 관리</h2>
            <p className="text-xs text-[#D9D2BE]">
              선택한 식재료가 포함된 레시피를 열람할 때 주의 안내 배지를 표시해드립니다.
            </p>
          </div>
        </div>

        <div>
          {/* 4-1. 기피 식재료 */}
          <div className="bg-[#0D2418] p-5 rounded-2xl border border-[#D4AF37]/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-[#FDFBF4]">
                🚫 피하고 싶은 식재료 (싫어하는 재료)
              </span>
              <span className="text-xs text-[#D9D2BE]/80">
                선택됨: {settings.dietary.dislikedIngredients.length}개
              </span>
            </div>

            {/* Selected Tags */}
            <div className="flex flex-wrap gap-2 mb-4 min-h-[36px]">
              {settings.dietary.dislikedIngredients.length === 0 ? (
                <span className="text-xs text-[#D9D2BE]/70 py-1">선택된 기피 재료가 없습니다.</span>
              ) : (
                settings.dietary.dislikedIngredients.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/20 text-orange-300 border border-orange-500/40 text-xs font-medium"
                  >
                    <span>{tag}</span>
                    <button
                      onClick={() => handleToggleDislike(tag)}
                      className="text-orange-400 hover:text-white"
                      title="삭제"
                    >
                      <X size={13} />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Quick Popular Tags */}
            <div className="pt-3 border-t border-[#D4AF37]/20">
              <span className="text-[11px] text-[#D9D2BE] block mb-2 font-medium">
                자취생이 자주 피하는 재료 빠른 추가:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_DISLIKED_TAGS.map((tag) => {
                  const isSelected = settings.dietary.dislikedIngredients.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => handleToggleDislike(tag)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-[#D4AF37] text-[#1B4731] font-bold border-[#D4AF37] shadow-sm'
                          : 'bg-[#133624] text-[#D9D2BE] border border-[#D4AF37]/30 hover:border-[#D4AF37] hover:text-[#FDFBF4]'
                      }`}
                    >
                      {isSelected ? `✓ ${tag}` : `+ ${tag}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Input */}
            <form onSubmit={handleAddCustomDislike} className="mt-3 flex items-center gap-2">
              <input
                type="text"
                value={newDislikeInput}
                onChange={(e) => setNewDislikeInput(e.target.value)}
                placeholder="직접 입력 (예: 샐러리, 브로콜리...)"
                className="bg-[#133624] border border-[#D4AF37]/40 rounded-xl px-3 py-2 text-xs text-[#FDFBF4] placeholder-[#D9D2BE]/60 outline-none focus:border-[#D4AF37] w-full sm:w-64"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#C49F2C] text-[#1B4731] text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <Plus size={14} />
                <span>추가</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* 5. 최근 저장한 북마크 레시피 미리보기 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#FDFBF4] flex items-center gap-2">
            <Bookmark size={18} className="text-[#D4AF37]" />
            최근 찜한 레시피
          </h2>
          <Link
            href="/bookmarks"
            onClick={() => soundService.playButtonClick()}
            className="text-xs text-[#D4AF37] hover:underline flex items-center gap-1 transition-colors"
          >
            <span>전체 북마크 보기 ({bookmarkCount})</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {recentBookmarks.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-[#D4AF37]/30 bg-[#133624]/60">
            <p className="text-xs text-[#D9D2BE] mb-3">저장한 북마크가 아직 없습니다.</p>
            <Link
              href="/"
              onClick={() => soundService.playButtonClick()}
              className="text-xs text-[#D4AF37] hover:underline font-semibold"
            >
              쇼츠 둘러보고 레시피 찜하러 가기 →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {recentBookmarks.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  soundService.playButtonClick();
                  router.push(`/recipe/${item.id}`);
                }}
                className="p-3 rounded-2xl border border-[#D4AF37]/30 hover:border-[#D4AF37] bg-[#133624] cursor-pointer group transition-all flex items-center gap-3 shadow-md"
              >
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  className="w-16 h-16 rounded-xl object-cover group-hover:scale-105 transition-transform shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-[#D4AF37] font-medium block truncate">
                    {item.channelName}
                  </span>
                  <h3 className="text-xs font-semibold text-[#FDFBF4] line-clamp-2 mt-0.5 group-hover:text-[#D4AF37]">
                    {item.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. 선택된 일기 상세 모달 */}
      {selectedDiary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
            onClick={() => setSelectedDiary(null)}
          />
          <div className="relative z-10 w-full max-w-lg bg-[#133624] border border-[#D4AF37]/50 rounded-3xl overflow-hidden shadow-2xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto text-[#FDFBF4]">
            {/* Close */}
            <button
              onClick={() => setSelectedDiary(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-[#D9D2BE] hover:text-[#FDFBF4] hover:bg-black/80 transition-all border border-[#D4AF37]/30 z-20"
            >
              <X size={16} />
            </button>

            {/* Photo */}
            <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-[#0D2418] border border-[#D4AF37]/30">
              <img
                src={selectedDiary.photoUrl}
                alt={selectedDiary.recipeTitle}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-1 rounded-full bg-[#133624]/90 text-[#FDFBF4] text-xs font-bold border border-[#D4AF37]/40 backdrop-blur-sm shadow">
                  ✓ 혼밥 요리 공식 인증
                </span>
              </div>
            </div>

            {/* Header info */}
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={15}
                      className={
                        s <= selectedDiary.rating
                          ? 'fill-[#D4AF37] text-[#D4AF37]'
                          : 'fill-[#0D2418] text-[#D9D2BE]/30'
                      }
                    />
                  ))}
                  <span className="text-xs font-bold text-[#D4AF37] ml-1">
                    {selectedDiary.rating}.0
                  </span>
                </div>
                <span className="text-xs text-[#D9D2BE] font-mono">
                  {formatDate(selectedDiary.createdAt)}
                </span>
              </div>

              <h3 className="text-lg font-extrabold text-[#FDFBF4] mt-2">
                {selectedDiary.recipeTitle}
              </h3>
              <p className="text-xs text-[#D9D2BE] mt-0.5">
                요리사: <span className="text-[#D4AF37] font-semibold">{selectedDiary.authorName}</span>
              </p>
            </div>

            {/* Comment Body (Public) */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-[#D9D2BE] flex items-center gap-1">
                <span>💡 한줄평 & 꿀팁</span>
                <span className="text-[10px] text-[#D9D2BE]/70">(레시피 공개용)</span>
              </span>
              <div className="bg-[#0D2418] p-3.5 rounded-2xl border border-[#D4AF37]/30 text-[#FDFBF4] text-xs leading-relaxed">
                {selectedDiary.comment}
              </div>
            </div>

            {/* Private Diary (if present) */}
            {selectedDiary.privateDiary && (
              <div className="flex flex-col gap-2 p-4 rounded-2xl bg-[#0D2418] border border-[#D4AF37]/40 shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#D4AF37] flex items-center gap-1.5">
                    <BookOpen size={13} className="text-[#D4AF37]" />
                    <span>나만의 비밀 요리 일기장</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#133624] text-[#FDFBF4] border border-[#D4AF37]/30 font-semibold">
                      나만 보기 🔒
                    </span>
                  </span>
                  <span className="text-[10px] text-[#D9D2BE] font-mono">비공개</span>
                </div>
                <p className="text-xs text-[#FDFBF4] leading-relaxed whitespace-pre-wrap font-sans bg-[#133624] p-3 rounded-xl border border-[#D4AF37]/20">
                  {selectedDiary.privateDiary}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-[#D4AF37]/20 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleToggleLike(e, selectedDiary.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                    selectedDiary.isLiked
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-[#0D2418] text-[#D9D2BE] border border-[#D4AF37]/30 hover:text-[#FDFBF4]'
                  }`}
                >
                  <Heart
                    size={14}
                    className={selectedDiary.isLiked ? 'fill-rose-500 text-rose-500' : ''}
                  />
                  <span>맛있어 보여요 ({selectedDiary.likes})</span>
                </button>

                <button
                  onClick={(e) => handleDeleteDiary(e, selectedDiary.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 text-xs font-semibold transition-all"
                  title="일기 삭제"
                >
                  <Trash2 size={13} />
                  <span>삭제</span>
                </button>
              </div>

              {(selectedDiary.recipeId > 0 || (selectedDiary.shortsId && selectedDiary.shortsId > 0)) && (
                <button
                  onClick={() => {
                    soundService.playButtonClick();
                    const targetId = selectedDiary.recipeId > 0 ? selectedDiary.recipeId : selectedDiary.shortsId;
                    router.push(`/recipe/${targetId}`);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#C49F2C] text-[#1B4731] text-xs font-bold transition-all shadow-md active:scale-95"
                >
                  <span>📺 원본 숏츠/레시피 보기</span>
                  <ExternalLink size={13} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. 혼밥 요리사 20단계 레벨 로드맵 모달 */}
      {isLevelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
            onClick={() => setIsLevelModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-2xl bg-[#133624] border border-[#D4AF37]/50 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8 flex flex-col gap-5 max-h-[90vh] text-[#FDFBF4]">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-[#D4AF37] flex items-center gap-1.5">
                  <Award size={14} />
                  <span>자취생 명예의 전당</span>
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#FDFBF4] mt-1">
                  혼밥 요리사 20단계 레벨 로드맵 👑
                </h2>
                <p className="text-xs text-[#D9D2BE] mt-1 leading-relaxed">
                  요리 일기 작성(+100 XP)과 매일 첫 접속 보너스(+15 XP)로 차근차근 성장하세요! Lv.18은 <strong>3개월</strong> 꾸준한 집밥 완주, Lv.20은 <strong>1년(365일)</strong> 완주 전설의 경지입니다.
                </p>
              </div>
              <button
                onClick={() => setIsLevelModalOpen(false)}
                className="p-2 rounded-full bg-black/50 text-[#D9D2BE] hover:text-[#FDFBF4] hover:bg-black/80 border border-[#D4AF37]/30 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Levels List */}
            <div className="overflow-y-auto space-y-2.5 pr-1 max-h-[60vh]">
              {LEVEL_TIERS.map((tier) => {
                const isCurrent = userLevelInfo?.level === tier.level;
                const isReached = (userLevelInfo?.currentXp || 0) >= tier.minXp;

                return (
                  <div
                    key={tier.level}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                      isCurrent
                        ? 'bg-[#D4AF37]/20 border-[#D4AF37] shadow-md ring-1 ring-[#D4AF37]/40 text-[#FDFBF4]'
                        : isReached
                        ? 'bg-[#0D2418] border border-[#D4AF37]/30 text-[#FDFBF4]'
                        : 'bg-[#0D2418]/60 border border-[#D4AF37]/15 opacity-75 text-[#D9D2BE]'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#133624] border border-[#D4AF37]/30 flex items-center justify-center text-xl shrink-0 shadow">
                        {tier.badgeEmoji}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-[#FDFBF4]">
                            Lv.{tier.level} {tier.title}
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full bg-[#D4AF37] text-[#1B4731] text-[10px] font-black shadow-sm">
                              현재 내 등급
                            </span>
                          )}
                          {tier.level === 18 && (
                            <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[10px] font-semibold">
                              3개월 완주 목표 🥋
                            </span>
                          )}
                          {tier.level === 20 && (
                            <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 text-[10px] font-semibold">
                              1년 완주 전설 👑
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#D9D2BE] truncate mt-0.5">
                          {tier.description}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-[#D4AF37] block">
                        {tier.minXp.toLocaleString()} XP ~
                      </span>
                      <span className="text-[10px] text-[#D9D2BE]/70">
                        {tier.level <= 4 ? '초급' : tier.level <= 10 ? '1달 코스' : tier.level <= 17 ? '2~3달 코스' : tier.level === 18 ? '3개월' : tier.level === 19 ? '마스터' : '1년 완주'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
