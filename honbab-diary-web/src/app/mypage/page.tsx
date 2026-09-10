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
} from 'lucide-react';
import { settingsService, AppSettings } from '@/services/settingsService';
import { shortsApi, ShortsItem } from '@/services/shortsApi';
import { authApi } from '@/services/authApi';
import { soundService } from '@/services/soundService';
import { diaryService, CookingDiaryEntry, UserLevelInfo, LEVEL_TIERS } from '@/services/diaryService';

const POPULAR_DISLIKED_TAGS = ['오이', '당근', '가지', '고수', '피망', '버섯', '파프리카', '양파'];
const POPULAR_ALLERGY_TAGS = ['갑각류', '땅콩', '우유/유제품', '대두(콩)', '밀가루/글루텐', '견과류', '메밀', '복숭아'];

export default function MyPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState<string>('자취 미식가');
  const [isEditingNickname, setIsEditingNickname] = useState<boolean>(false);
  const [editNameInput, setEditNameInput] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  const [settings, setSettings] = useState<AppSettings>(settingsService.getSettings());
  const [newDislikeInput, setNewDislikeInput] = useState<string>('');
  const [newAllergyInput, setNewAllergyInput] = useState<string>('');

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

  // 알레르기 토글/추가
  const handleToggleAllergy = (tag: string) => {
    soundService.playButtonClick();
    const current = settings.dietary.allergies;
    let next: string[];
    if (current.includes(tag)) {
      next = current.filter((t) => t !== tag);
    } else {
      next = [...current, tag];
    }
    const updated = settingsService.updateSettings({
      dietary: { ...settings.dietary, allergies: next },
    });
    setSettings(updated);
  };

  const handleAddCustomAllergy = (e: React.FormEvent) => {
    e.preventDefault();
    const val = newAllergyInput.trim();
    if (val && !settings.dietary.allergies.includes(val)) {
      soundService.playButtonClick();
      const updated = settingsService.updateSettings({
        dietary: {
          ...settings.dietary,
          allergies: [...settings.dietary.allergies, val],
        },
      });
      setSettings(updated);
      setNewAllergyInput('');
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

  const formatDate = (val: string | number) => {
    try {
      const d = new Date(val);
      return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
    } catch {
      return String(val);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* 1. 프로필 요약 카드 */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-slate-900/70 shadow-2xl mb-8 relative overflow-hidden">
        {/* Background ambient glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5 flex-1 min-w-0">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 p-1 shadow-xl">
                <div className="w-full h-full rounded-xl bg-slate-950 flex items-center justify-center text-white text-2xl font-bold">
                  {nickname.charAt(0) || '혼'}
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 p-1 rounded-full shadow border-2 border-slate-900">
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
                      className="bg-slate-950 border border-amber-500 rounded-lg px-2.5 py-1 text-sm text-white outline-none w-40 font-semibold"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveNickname}
                      className="p-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-colors"
                      title="저장"
                    >
                      <Check size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold text-white">{nickname}</h1>
                    <button
                      onClick={() => {
                        soundService.playButtonClick();
                        setIsEditingNickname(true);
                      }}
                      className="p-1 text-slate-400 hover:text-white transition-colors"
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
                    className="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 group cursor-pointer"
                    title="혼밥 요리사 20단계 전체 등급표 보기"
                  >
                    <span>{userLevelInfo.badgeEmoji}</span>
                    <span>Lv.{userLevelInfo.level} {userLevelInfo.title}</span>
                    <span className="text-[10px] text-amber-400/60 group-hover:text-amber-300 transition-colors ml-0.5 font-normal">
                      [등급표]
                    </span>
                  </button>
                )}
              </div>

              {/* XP Level Progress Bar */}
              {userLevelInfo && (
                <div className="mt-2.5 w-full max-w-md bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-300 font-semibold flex items-center gap-1">
                      <Award size={12} className="text-[#D4AF37]" />
                      <span>경험치: <strong className="text-amber-400">{userLevelInfo.currentXp.toLocaleString()} XP</strong></span>
                    </span>
                    <span className="text-slate-400 text-[10px]">
                      {userLevelInfo.level >= 20 ? (
                        <strong className="text-amber-300">최고 등급 달성! 👑</strong>
                      ) : (
                        <>다음 등급까지 <strong className="text-amber-300">{userLevelInfo.xpToNext.toLocaleString()} XP</strong> 남음</>
                      )}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800/90 rounded-full overflow-hidden border border-slate-700/60 p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 rounded-full transition-all duration-500 shadow-sm"
                      style={{ width: `${Math.min(100, Math.max(5, userLevelInfo.progressPercent))}%` }}
                    />
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-400 mt-2 flex items-center gap-2 flex-wrap">
                <span>카카오 연동 회원</span>
                <span className="text-slate-600">•</span>
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
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 text-xs font-extrabold transition-all shadow-lg hover:shadow-orange-500/20 active:scale-95"
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
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles size={18} className="text-orange-400" />
            나의 혼밥 레벨 & 요리 통계
          </h2>
          <span className="text-xs text-slate-500 font-mono">실시간 반영</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Meals Cooked */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">직접 만든 집밥</span>
              <div className="text-2xl font-bold text-white mt-1">
                {mealsCooked}
                <span className="text-sm font-normal text-slate-400 ml-1">회</span>
              </div>
              <span className="text-[11px] text-orange-400 mt-1 block">
                {mealsCooked > 0 ? `누적 ${mealsCooked}회 인증 완료` : '첫 요리를 인증해보세요'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <ChefHat size={24} />
            </div>
          </div>

          {/* Card 2: Saved Money */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">절약한 외식비</span>
              <div className="text-2xl font-bold text-emerald-400 mt-1">
                +{totalSaved.toLocaleString()}
                <span className="text-sm font-normal text-slate-400 ml-1">원</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">외식 1회 평균 대비</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign size={24} />
            </div>
          </div>

          {/* Card 3: Streak */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">연속 집밥 스트릭</span>
              <div className="text-2xl font-bold text-amber-400 mt-1 flex items-center gap-1">
                {streakDays}
                <span className="text-sm font-normal text-slate-400">일째</span>
                <Flame size={18} className="text-orange-500" />
              </div>
              <span className="text-[11px] text-amber-300/80 mt-1 block">
                {streakDays > 0 ? `연속 보너스 +${Math.min(50, streakDays * 10)} XP` : '매일 연속 인증 시 보너스'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Flame size={24} />
            </div>
          </div>

          {/* Card 4: Bookmarks */}
          <Link
            href="/bookmarks"
            onClick={() => soundService.playButtonClick()}
            className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-amber-500/40 bg-slate-900/60 shadow-lg flex items-center justify-between transition-all group"
          >
            <div>
              <span className="text-xs text-slate-400 font-medium">저장한 북마크</span>
              <div className="text-2xl font-bold text-cyan-300 mt-1 group-hover:scale-105 transition-transform">
                {bookmarkCount}
                <span className="text-sm font-normal text-slate-400 ml-1">개</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 flex items-center gap-0.5 group-hover:text-cyan-400">
                보러가기 <ChevronRight size={12} />
              </span>
            </div>
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Bookmark size={24} />
            </div>
          </Link>
        </div>
      </div>

      {/* 3. 나의 혼밥 일기장 (요리 인증 갤러리) */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-[#D4AF37]/30 bg-slate-900/70 shadow-2xl mb-8 relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
              <BookOpen size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">나의 혼밥 일기장</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] font-semibold">
                  총 {myDiaries.length}편의 집밥 기록
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                직접 요리한 사진과 솔직한 한줄평이 남겨진 나만의 요리 갤러리입니다.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundService.playButtonClick();
              router.push('/diary/write');
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 text-xs font-extrabold shadow-md transition-all active:scale-98"
          >
            <Camera size={14} />
            <span>새 요리 일기 쓰기 (+100 XP)</span>
          </button>
        </div>

        {/* Gamification Rule Explainer Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
          <span className="text-lg">💡</span>
          <div className="text-xs text-slate-300 leading-relaxed">
            <span className="font-bold text-amber-300">혼밥 일기 보상 규칙: </span>
            요리 완성 사진과 <strong>10자 이상의 한줄평</strong>을 함께 작성하면 <strong>+100 XP</strong>가 즉시 지급됩니다. 
            매일 연속해서 집밥을 먹고 일기를 남기면 <strong>연속 스트릭 보너스 XP</strong>까지 추가로 획득할 수 있습니다! 🔥
          </div>
        </div>

        {/* Diary Entries Grid */}
        {myDiaries.length === 0 ? (
          <div className="p-10 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400">
              <Camera size={26} />
            </div>
            <p className="text-sm font-semibold text-slate-300">아직 등록된 혼밥 일기가 없습니다.</p>
            <p className="text-xs text-slate-500 max-w-sm">
              오늘 직접 만든 집밥 사진과 꿀팁을 한줄평으로 남겨보세요. +100 XP를 받고 자취 요리사 레벨을 올릴 수 있습니다!
            </p>
            <button
              onClick={() => {
                soundService.playButtonClick();
                router.push('/diary/write');
              }}
              className="mt-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all shadow"
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
                className="group rounded-2xl border border-slate-800/90 hover:border-amber-500/50 bg-slate-950/70 overflow-hidden shadow-lg hover:shadow-2xl transition-all cursor-pointer flex flex-col"
              >
                {/* Photo Thumbnail with verified overlay */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-900">
                  <img
                    src={diary.photoUrl}
                    alt={diary.recipeTitle}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 backdrop-blur-sm shadow">
                      ✓ 인증 완료
                    </span>
                  </div>

                  <div className="absolute top-2.5 right-2.5">
                    <span className="px-2 py-0.5 rounded-full bg-black/70 text-amber-300 text-[11px] font-bold border border-amber-500/30 backdrop-blur-sm flex items-center gap-1 shadow">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
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

                {/* Content */}
                <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        <span>{formatDate(diary.createdAt)}</span>
                      </span>
                      {diary.recipeId > 0 && (
                        <span className="text-amber-400/80 text-[10px] hover:underline">
                          레시피 연결됨
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed italic bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/60">
                      &ldquo;{diary.comment}&rdquo;
                    </p>

                    {diary.privateDiary && (
                      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-300/90 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                        <Lock size={11} className="text-amber-400" />
                        <span className="truncate">비밀 일기: {diary.privateDiary}</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Likes & Author */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                    <span className="text-[11px] text-slate-400 font-medium">
                      작성자: <span className="text-slate-200 font-semibold">{diary.authorName}</span>
                    </span>

                    <button
                      onClick={(e) => handleToggleLike(e, diary.id)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors border ${
                        diary.isLiked
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-rose-400'
                      }`}
                      title="맛있어 보여요!"
                    >
                      <Heart size={12} className={diary.isLiked ? 'fill-rose-500 text-rose-500' : ''} />
                      <span>{diary.likes}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. 기피 식재료 & 알레르기 관리 (핵심 요청 반영) */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-slate-900/60 shadow-xl mb-8">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800 mb-6">
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ShieldAlert size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">기피 식재료 & 알레르기 관리</h2>
            <p className="text-xs text-slate-400">
              선택한 식재료가 포함된 레시피를 열람할 때 주의 안내 배지를 표시해드립니다.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* 3-1. 기피 식재료 */}
          <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-slate-200">
                🚫 피하고 싶은 식재료 (싫어하는 재료)
              </span>
              <span className="text-xs text-slate-500">
                선택됨: {settings.dietary.dislikedIngredients.length}개
              </span>
            </div>

            {/* Selected Tags */}
            <div className="flex flex-wrap gap-2 mb-4 min-h-[36px]">
              {settings.dietary.dislikedIngredients.length === 0 ? (
                <span className="text-xs text-slate-500 py-1">선택된 기피 재료가 없습니다.</span>
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
            <div className="pt-3 border-t border-slate-800/80">
              <span className="text-[11px] text-slate-400 block mb-2 font-medium">
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
                          ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
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
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-orange-500 w-full sm:w-64"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 border border-slate-700 transition-colors"
              >
                <Plus size={14} />
                <span>추가</span>
              </button>
            </form>
          </div>

          {/* 3-2. 알레르기 식재료 */}
          <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-rose-300 flex items-center gap-1.5">
                <ShieldAlert size={15} />
                식품 알레르기 유발 재료 (주의 필수)
              </span>
              <span className="text-xs text-slate-500">
                등록됨: {settings.dietary.allergies.length}개
              </span>
            </div>

            {/* Selected Allergy Tags */}
            <div className="flex flex-wrap gap-2 mb-4 min-h-[36px]">
              {settings.dietary.allergies.length === 0 ? (
                <span className="text-xs text-slate-500 py-1">등록된 알레르기 정보가 없습니다.</span>
              ) : (
                settings.dietary.allergies.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-medium"
                  >
                    <span>{tag}</span>
                    <button
                      onClick={() => handleToggleAllergy(tag)}
                      className="text-rose-400 hover:text-white"
                      title="삭제"
                    >
                      <X size={13} />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Quick Popular Allergy Tags */}
            <div className="pt-3 border-t border-slate-800/80">
              <span className="text-[11px] text-slate-400 block mb-2 font-medium">
                주요 알레르기 유발 식품 빠른 추가:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_ALLERGY_TAGS.map((tag) => {
                  const isSelected = settings.dietary.allergies.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => handleToggleAllergy(tag)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {isSelected ? `✓ ${tag}` : `+ ${tag}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Input */}
            <form onSubmit={handleAddCustomAllergy} className="mt-3 flex items-center gap-2">
              <input
                type="text"
                value={newAllergyInput}
                onChange={(e) => setNewAllergyInput(e.target.value)}
                placeholder="직접 입력 (예: 참깨, 키위...)"
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-rose-500 w-full sm:w-64"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 border border-slate-700 transition-colors"
              >
                <Plus size={14} />
                <span>추가</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* 4. 최근 저장한 북마크 레시피 미리보기 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Bookmark size={18} className="text-amber-400" />
            최근 찜한 레시피
          </h2>
          <Link
            href="/bookmarks"
            onClick={() => soundService.playButtonClick()}
            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
          >
            <span>전체 북마크 보기 ({bookmarkCount})</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {recentBookmarks.length === 0 ? (
          <div className="glass-panel p-8 text-center rounded-2xl border border-slate-800 bg-slate-900/40">
            <p className="text-xs text-slate-400 mb-3">저장한 북마크가 아직 없습니다.</p>
            <Link
              href="/"
              onClick={() => soundService.playButtonClick()}
              className="text-xs text-orange-400 hover:underline font-semibold"
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
                className="glass-panel p-3 rounded-2xl border border-slate-800 hover:border-amber-500/40 bg-slate-900/60 cursor-pointer group transition-all flex items-center gap-3"
              >
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  className="w-16 h-16 rounded-xl object-cover group-hover:scale-105 transition-transform shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-amber-400 font-medium block truncate">
                    {item.channelName}
                  </span>
                  <h3 className="text-xs font-semibold text-slate-200 line-clamp-2 mt-0.5 group-hover:text-white">
                    {item.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. 선택된 일기 상세 모달 */}
      {selectedDiary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
            onClick={() => setSelectedDiary(null)}
          />
          <div className="relative z-10 w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            {/* Close */}
            <button
              onClick={() => setSelectedDiary(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-slate-300 hover:text-white hover:bg-black/90 transition-all border border-slate-700"
            >
              <X size={16} />
            </button>

            {/* Photo */}
            <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-black border border-slate-800">
              <img
                src={selectedDiary.photoUrl}
                alt={selectedDiary.recipeTitle}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-1 rounded-full bg-emerald-950/90 text-emerald-300 text-xs font-bold border border-emerald-500/40 backdrop-blur-sm shadow">
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
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-slate-800 text-slate-700'
                      }
                    />
                  ))}
                  <span className="text-xs font-bold text-amber-300 ml-1">
                    {selectedDiary.rating}.0
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {formatDate(selectedDiary.createdAt)}
                </span>
              </div>

              <h3 className="text-lg font-extrabold text-white mt-2">
                {selectedDiary.recipeTitle}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                요리사: <span className="text-amber-300 font-semibold">{selectedDiary.authorName}</span>
              </p>
            </div>

            {/* Comment Body (Public) */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <span>💡 한줄평 & 꿀팁</span>
                <span className="text-[10px] text-slate-500">(레시피 공개용)</span>
              </span>
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 text-slate-200 text-xs leading-relaxed italic">
                &ldquo;{selectedDiary.comment}&rdquo;
              </div>
            </div>

            {/* Private Diary (if present) */}
            {selectedDiary.privateDiary && (
              <div className="flex flex-col gap-2 p-4 rounded-2xl bg-gradient-to-br from-amber-950/20 via-slate-950/90 to-slate-900 border border-amber-500/35 shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <BookOpen size={13} className="text-amber-400" />
                    <span>나만의 비밀 요리 일기장</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-500/30 font-semibold">
                      나만 보기 🔒
                    </span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">비공개</span>
                </div>
                <p className="text-xs text-[#FDFBF4] leading-relaxed whitespace-pre-wrap font-sans bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  {selectedDiary.privateDiary}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                onClick={(e) => handleToggleLike(e, selectedDiary.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                  selectedDiary.isLiked
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                <Heart
                  size={14}
                  className={selectedDiary.isLiked ? 'fill-rose-500 text-rose-500' : ''}
                />
                <span>맛있어 보여요 ({selectedDiary.likes})</span>
              </button>

              {selectedDiary.recipeId > 0 && (
                <button
                  onClick={() => {
                    soundService.playButtonClick();
                    router.push(`/recipe/${selectedDiary.recipeId}`);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-xs text-amber-300 hover:text-white font-bold transition-all shadow-sm active:scale-95"
                >
                  <span>📺 원본 숏츠/레시피 보기</span>
                  <ExternalLink size={13} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. 혼밥 요리사 20단계 레벨 로드맵 모달 */}
      {isLevelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
            onClick={() => setIsLevelModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-2xl bg-slate-900 border border-amber-500/40 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8 flex flex-col gap-5 max-h-[90vh]">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Award size={14} />
                  <span>자취생 명예의 전당</span>
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
                  혼밥 요리사 20단계 레벨 로드맵 👑
                </h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  요리 일기 작성(+100 XP)과 매일 첫 접속 보너스(+15 XP)로 차근차근 성장하세요! Lv.18은 <strong>3개월</strong> 꾸준한 집밥 완주, Lv.20은 <strong>1년(365일)</strong> 완주 전설의 경지입니다.
                </p>
              </div>
              <button
                onClick={() => setIsLevelModalOpen(false)}
                className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
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
                        ? 'bg-amber-500/15 border-amber-400 shadow-md ring-1 ring-amber-400/40'
                        : isReached
                        ? 'bg-slate-950/70 border-slate-800'
                        : 'bg-slate-950/40 border-slate-800/50 opacity-75'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl shrink-0 shadow">
                        {tier.badgeEmoji}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-white">
                            Lv.{tier.level} {tier.title}
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
                              현재 내 등급
                            </span>
                          )}
                          {tier.level === 18 && (
                            <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[10px] font-semibold">
                              3개월 완주 목표 🥋
                            </span>
                          )}
                          {tier.level === 20 && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-semibold">
                              1년 완주 전설 👑
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {tier.description}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-amber-300 block">
                        {tier.minXp.toLocaleString()} XP ~
                      </span>
                      <span className="text-[10px] text-slate-500">
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
