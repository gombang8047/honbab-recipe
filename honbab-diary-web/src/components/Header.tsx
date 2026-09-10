'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  ChefHat,
  ShoppingCart,
  Search,
  User,
  LogOut,
  Bookmark,
  Settings,
  ChevronDown,
  Sparkles,
  Sun,
  Moon,
  Camera,
} from 'lucide-react';
import { cartApi } from '@/services/cartApi';
import { cartService } from '@/services/cartService';
import { authApi } from '@/services/authApi';
import { soundService } from '@/services/soundService';
import { diaryService } from '@/services/diaryService';

interface HeaderProps {
  cartCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ cartCount: propCartCount }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [count, setCount] = useState<number>(propCartCount ?? 0);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [nickname, setNickname] = useState<string>('카카오 사용자');
  const [cookingLevel, setCookingLevel] = useState<string>('Lv.3');
  const [levelTitle, setLevelTitle] = useState<string>('햇반 탈출러');
  const [mounted, setMounted] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 초기 테마 로드: 기본값은 'light' (화이트 배경)
    const stored = localStorage.getItem('honbab_theme');
    if (stored === 'dark') {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    soundService.playButtonClick();
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('honbab_theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const syncAuthState = useCallback(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('accessToken');
    const valid = !!token && token.trim() !== '';
    setIsLoggedIn(valid);

    const storedName = localStorage.getItem('userNickname');
    if (storedName) {
      setNickname(storedName);
    } else {
      setNickname('자취 미식가');
    }

    const levelInfo = diaryService.getUserLevelInfo();
    setCookingLevel(`Lv.${levelInfo.level}`);
    setLevelTitle(levelInfo.title);
  }, []);

  useEffect(() => {
    setMounted(true);
    // 당일 첫 접속 시 백그라운드에서 조용히 접속 경험치 부여 (알림 없이 자동 반영)
    diaryService.checkAndAwardLoginXp();
    syncAuthState();

    const handleAuthChange = () => {
      syncAuthState();
    };

    window.addEventListener('auth-change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('diary-updated', handleAuthChange);

    // Fetch Cart from cartService
    setCount(cartService.getCartCount());

    const handleCartChange = (e: any) => {
      if (typeof e.detail?.count === 'number') {
        setCount(e.detail.count);
      } else {
        setCount(cartService.getCartCount());
      }
    };

    window.addEventListener('cart-changed', handleCartChange);

    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('diary-updated', handleAuthChange);
      window.removeEventListener('cart-changed', handleCartChange);
    };
  }, [syncAuthState]);

  // 바깥 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // 페이지 이동 시 메뉴 닫기 및 로그인 상태 재동기화
  useEffect(() => {
    setIsMenuOpen(false);
    syncAuthState();
  }, [pathname, syncAuthState]);

  const handleLogout = async () => {
    soundService.playButtonClick();
    setIsMenuOpen(false);
    await authApi.logout();
    setIsLoggedIn(false);
    router.push('/login');
  };

  const handleMenuClick = (url: string) => {
    soundService.playButtonClick();
    setIsMenuOpen(false);
    router.push(url);
  };

  const [searchValue, setSearchValue] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);

  // Synchronize search input with URL query param if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const q = urlParams.get('q') || '';
      setSearchValue(q);
    }
  }, [pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundService.playButtonClick();
    const query = searchValue.trim();
    if (query) {
      router.push(`/?q=${encodeURIComponent(query)}`);
    } else {
      router.push('/');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full transition-colors duration-200 bg-[#133624]/95 backdrop-blur-md border-b border-[#D4AF37]/25 text-[#FDFBF4] shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
          <div className="w-10 h-10 rounded-xl bg-[#1B4731] text-[#D4AF37] border border-[#D4AF37]/50 flex items-center justify-center shadow-md group-hover:scale-105 group-hover:border-[#D4AF37] transition-all">
            <ChefHat size={22} />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-[#FDFBF4] group-hover:text-[#D4AF37] transition-colors">
            혼밥레시피
          </span>
        </Link>

      {/* Search Input */}
      <form
        onSubmit={handleSearchSubmit}
        className="hidden md:flex items-center gap-2 h-10 bg-[#0D2418] border border-[#25583E] focus-within:border-[#D4AF37] rounded-full px-4 w-80 text-sm focus-within:ring-1 focus-within:ring-[#D4AF37]/40 transition-all shadow-inner"
      >
        <Search size={16} className="text-[#D4AF37] shrink-0" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          placeholder={isSearchFocused ? '재료(계란, 스팸) or 요리명 검색...' : ''}
          className="bg-transparent text-stone-100 placeholder-[#B8AF98]/80 outline-none w-full text-xs sm:text-sm transition-all"
        />
        {searchValue && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setSearchValue('');
              if (pathname === '/') {
                router.push('/');
              }
            }}
            className="text-xs text-[#D4AF37] hover:text-white font-bold px-1"
          >
            ✕
          </button>
        )}
      </form>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle Button (Light / Dark) */}
        <button
          onClick={toggleTheme}
          className="h-10 w-10 flex items-center justify-center rounded-full transition-all shadow-sm border bg-[#1B4731] hover:bg-[#24583E] text-[#D4AF37] border-[#D4AF37]/30 hover:border-[#D4AF37] active:scale-95 shrink-0"
          title={theme === 'dark' ? '딥 그린 모드로 전환' : '다크 모드로 전환'}
          aria-label="테마 전환"
        >
          {theme === 'dark' ? (
            <Sun size={18} className="text-[#D4AF37]" />
          ) : (
            <Moon size={18} className="text-[#FDFBF4]" />
          )}
        </button>

        {/* Cart Button */}
        <Link
          href="/cart"
          onClick={() => soundService.playButtonClick()}
          className="h-10 w-10 flex items-center justify-center relative rounded-full bg-[#1B4731] hover:bg-[#24583E] text-[#D4AF37] border border-[#D4AF37]/30 hover:border-[#D4AF37] transition-all shadow-sm shrink-0"
          suppressHydrationWarning
        >
          <ShoppingCart size={19} />
          {mounted && count > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#D4AF37] text-[#1B4731] font-bold text-[11px] w-5 h-5 rounded-full flex items-center justify-center border border-[#F3E5AB] shadow-sm animate-pulse" suppressHydrationWarning>
              {count}
            </span>
          )}
        </Link>

        {/* Profile Dropdown Container */}
        <div className="relative" ref={menuRef} suppressHydrationWarning>
          {mounted && isLoggedIn ? (
            <button
              onClick={() => {
                soundService.playButtonClick();
                setIsMenuOpen((prev) => !prev);
              }}
              className={`h-10 flex items-center gap-2 px-3 sm:px-3.5 rounded-full border transition-all text-xs font-semibold shrink-0 ${
                isMenuOpen
                  ? 'bg-[#1B4731] border-[#D4AF37] text-[#D4AF37]'
                  : 'bg-[#1B4731] border-[#D4AF37]/40 text-[#FDFBF4] hover:border-[#D4AF37]'
              }`}
            >
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-[#D4AF37] text-[#1B4731] shadow-sm tracking-tight">
                {cookingLevel}
              </span>
              <span className="max-w-[100px] truncate font-medium">
                {nickname}
              </span>
              <ChevronDown
                size={14}
                className={`text-[#D4AF37] transition-transform duration-200 ${
                  isMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
          ) : (
            <button
              onClick={() => {
                soundService.playButtonClick();
                setIsMenuOpen((prev) => !prev);
              }}
              className="h-10 flex items-center gap-2 bg-[#D4AF37] hover:bg-[#C49F2C] text-[#1B4731] font-bold px-4 rounded-full text-xs sm:text-sm border border-[#F3E5AB] shadow-md transition-all active:scale-95 shrink-0"
            >
              <span>로그인</span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${
                  isMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
          )}

          {/* Dropdown Popover */}
          {isMenuOpen && (
            <div className="absolute right-0 mt-2.5 w-64 rounded-2xl bg-[#133624] border border-[#D4AF37]/50 shadow-2xl backdrop-blur-xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 text-[#FDFBF4]">
              {/* Profile Card Header in Dropdown */}
              <div className="px-3.5 py-2.5 mb-1 bg-[#1B4731] border border-[#D4AF37]/40 rounded-xl flex items-center justify-between">
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-[#FDFBF4] truncate">
                    {mounted && isLoggedIn ? nickname : '게스트 사용자'}
                  </span>
                  <span className="text-[11px] text-[#D4AF37] flex items-center gap-1 font-medium mt-0.5">
                    <Sparkles size={11} className="text-[#D4AF37]" />
                    <span>{mounted && isLoggedIn ? `${cookingLevel} ${levelTitle}` : '로그인이 필요합니다'}</span>
                  </span>
                </div>
                {mounted && isLoggedIn && (
                  <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-[#D4AF37] text-[#1B4731] shadow-sm">
                    {cookingLevel}
                  </span>
                )}
              </div>

              {/* Menu Links */}
              <div className="space-y-1 my-1">
                {/* 1. 마이페이지 */}
                <button
                  onClick={() => handleMenuClick('/mypage')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                    pathname === '/mypage'
                      ? 'bg-[#1B4731] text-[#D4AF37] font-bold border border-[#D4AF37]/60'
                      : 'text-stone-200 hover:bg-[#1B4731] hover:text-[#FDFBF4]'
                  }`}
                >
                  <div className="p-1.5 rounded-lg bg-[#0D2418] text-[#D4AF37]">
                    <User size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-[#FDFBF4]">마이페이지</span>
                    <span className="text-[10px] text-[#D9D2BE]">
                      내 혼밥 통계 및 식재료 관리
                    </span>
                  </div>
                </button>

                {/* 1-2. 혼밥 일기 쓰기 */}
                <button
                  onClick={() => handleMenuClick('/diary/write')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                    pathname === '/diary/write'
                      ? 'bg-[#1B4731] text-[#D4AF37] font-bold border border-[#D4AF37]/60'
                      : 'text-stone-200 hover:bg-[#1B4731] hover:text-[#FDFBF4]'
                  }`}
                >
                  <div className="p-1.5 rounded-lg bg-[#0D2418] text-[#D4AF37]">
                    <Camera size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-[#FDFBF4]">혼밥 일기 쓰기</span>
                    <span className="text-[10px] text-[#D9D2BE]">
                      오늘 요리 인증 (+100 XP)
                    </span>
                  </div>
                </button>

                {/* 2. 북마크 */}
                <button
                  onClick={() => handleMenuClick('/bookmarks')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                    pathname === '/bookmarks'
                      ? 'bg-[#1B4731] text-[#D4AF37] font-bold border border-[#D4AF37]/60'
                      : 'text-stone-200 hover:bg-[#1B4731] hover:text-[#FDFBF4]'
                  }`}
                >
                  <div className="p-1.5 rounded-lg bg-[#0D2418] text-[#D4AF37]">
                    <Bookmark size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-[#FDFBF4]">북마크</span>
                    <span className="text-[10px] text-[#D9D2BE]">
                      찜한 1인분 레시피 보관함
                    </span>
                  </div>
                </button>

                {/* 3. 설정 */}
                <button
                  onClick={() => handleMenuClick('/settings')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                    pathname === '/settings'
                      ? 'bg-[#1B4731] text-[#D4AF37] font-bold border border-[#D4AF37]/60'
                      : 'text-stone-200 hover:bg-[#1B4731] hover:text-[#FDFBF4]'
                  }`}
                >
                  <div className="p-1.5 rounded-lg bg-[#0D2418] text-[#D4AF37]">
                    <Settings size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-[#FDFBF4]">설정</span>
                    <span className="text-[10px] text-[#D9D2BE]">
                      알림 및 사운드 효과음
                    </span>
                  </div>
                </button>
              </div>

              {/* Divider & Auth button */}
              <div className="border-t border-[#D4AF37]/30 pt-1.5 mt-1.5">
                {mounted && isLoggedIn ? (
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-300 hover:bg-rose-500/10 hover:text-rose-200 transition-colors"
                  >
                    <LogOut size={15} />
                    <span>로그아웃</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleMenuClick('/login')}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-[#D4AF37] hover:bg-[#C49F2C] text-[#1B4731] border border-[#F3E5AB] transition-all shadow-md active:scale-95"
                  >
                    <User size={15} />
                    <span>카카오 간편 로그인</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </header>
  );
};
