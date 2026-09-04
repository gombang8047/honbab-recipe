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
  Sliders,
  ShoppingCart,
  Receipt,
  LogOut,
  Flame,
  Award,
} from 'lucide-react';
import { settingsService, AppSettings } from '@/services/settingsService';
import { shortsApi, ShortsItem } from '@/services/shortsApi';
import { authApi } from '@/services/authApi';
import { soundService } from '@/services/soundService';

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

  // 자취 절약 통계 (집밥 14회 기준)
  const mealsCooked = 14;
  const avgDiningCost = 12000;
  const avgCookCost = 5500;
  const totalSaved = mealsCooked * (avgDiningCost - avgCookCost);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* 1. 프로필 요약 카드 */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-slate-900/70 shadow-2xl mb-8 relative overflow-hidden">
        {/* Background ambient glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="relative">
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
            <div>
              <div className="flex items-center gap-3">
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
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
                  Lv.3 자취 요리사
                </span>
              </div>

              <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-2">
                <span>카카오 연동 회원</span>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400 font-medium">이번 달 연속 7일 집밥 달성! 🔥</span>
              </p>
            </div>
          </div>

          {/* Quick Action Navigation */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              href="/settings"
              onClick={() => soundService.playButtonClick()}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700/70 transition-all shadow"
            >
              <Sliders size={15} className="text-cyan-400" />
              <span>알림/사운드 설정</span>
            </Link>
            {isLoggedIn && (
              <button
                onClick={handleLogout}
                className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700/70 transition-colors"
                title="로그아웃"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. 혼밥 대시보드 (자취 절약 & 요리 통계) */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles size={18} className="text-orange-400" />
            나의 이번 달 혼밥 대시보드
          </h2>
          <span className="text-xs text-slate-500 font-mono">2026.09 기준</span>
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
              <span className="text-[11px] text-orange-400 mt-1 block">지난달보다 +4회 증가</span>
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

          {/* Card 3: Saved Bookmarks */}
          <Link
            href="/bookmarks"
            onClick={() => soundService.playButtonClick()}
            className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-amber-500/40 bg-slate-900/60 shadow-lg flex items-center justify-between transition-all group"
          >
            <div>
              <span className="text-xs text-slate-400 font-medium">저장한 북마크</span>
              <div className="text-2xl font-bold text-amber-300 mt-1 group-hover:scale-105 transition-transform">
                {bookmarkCount}
                <span className="text-sm font-normal text-slate-400 ml-1">개</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 flex items-center gap-0.5 group-hover:text-amber-400">
                보러가기 <ChevronRight size={12} />
              </span>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Bookmark size={24} />
            </div>
          </Link>

          {/* Card 4: Orders */}
          <Link
            href="/payment"
            onClick={() => soundService.playButtonClick()}
            className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-cyan-500/40 bg-slate-900/60 shadow-lg flex items-center justify-between transition-all group"
          >
            <div>
              <span className="text-xs text-slate-400 font-medium">식재료 결제 내역</span>
              <div className="text-2xl font-bold text-cyan-300 mt-1">
                2<span className="text-sm font-normal text-slate-400 ml-1">건</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 flex items-center gap-0.5 group-hover:text-cyan-400">
                내역 확인 <ChevronRight size={12} />
              </span>
            </div>
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Receipt size={24} />
            </div>
          </Link>
        </div>
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
    </div>
  );
}
