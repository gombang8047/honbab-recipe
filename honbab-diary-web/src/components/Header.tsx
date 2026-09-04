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
} from 'lucide-react';
import { cartApi } from '@/services/cartApi';
import { authApi } from '@/services/authApi';
import { soundService } from '@/services/soundService';

interface HeaderProps {
  cartCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ cartCount: propCartCount }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [count, setCount] = useState<number>(propCartCount ?? 3);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [nickname, setNickname] = useState<string>('카카오 사용자');
  const [mounted, setMounted] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
  }, []);

  useEffect(() => {
    setMounted(true);
    syncAuthState();

    const handleAuthChange = () => {
      syncAuthState();
    };

    window.addEventListener('auth-change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    // Fetch Cart
    cartApi
      .getCart()
      .then((cart) => {
        if (cart && typeof cart.totalItems === 'number') {
          setCount(cart.totalItems);
        }
      })
      .catch(() => {});

    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
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

  return (
    <header className="glass-panel sticky top-0 z-50 px-6 py-4 mb-6 mx-4 mt-2 flex items-center justify-between shadow-xl">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 group">
        <div className="bg-gradient-to-tr from-amber-500 to-orange-500 p-2 rounded-xl text-white shadow-lg group-hover:scale-105 transition-transform">
          <ChefHat size={24} />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
            혼밥레시피
          </span>
          <span className="text-[10px] text-slate-400 tracking-wider">AI SHORT RECIPE</span>
        </div>
      </Link>

      {/* Search Input */}
      <div className="hidden md:flex items-center gap-2 bg-slate-900/80 border border-slate-700/60 rounded-full px-4 py-2 w-80 text-sm focus-within:border-orange-500 transition-colors">
        <Search size={16} className="text-slate-400" />
        <input
          type="text"
          placeholder="자취 요리, 계란 볶음밥 검색..."
          className="bg-transparent text-slate-200 placeholder-slate-500 outline-none w-full"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        {/* Cart Button */}
        <Link
          href="/cart"
          onClick={() => soundService.playButtonClick()}
          className="relative p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
        >
          <ShoppingCart size={20} />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 bg-orange-500 text-white font-bold text-[11px] w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
              {count}
            </span>
          )}
        </Link>

        {/* Profile Dropdown Container */}
        <div className="relative" ref={menuRef}>
          {mounted && isLoggedIn ? (
            <button
              onClick={() => {
                soundService.playButtonClick();
                setIsMenuOpen((prev) => !prev);
              }}
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full border transition-all text-xs font-semibold ${
                isMenuOpen
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-2 ring-amber-400/30'
                  : 'bg-slate-800/90 border-slate-700 hover:border-amber-500/50 text-slate-200 hover:text-white'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white text-xs font-bold shadow">
                {nickname.charAt(0) || '혼'}
              </div>
              <span className="max-w-[100px] truncate hidden sm:inline-block font-medium">
                {nickname}
              </span>
              <ChevronDown
                size={14}
                className={`text-slate-400 transition-transform duration-200 ${
                  isMenuOpen ? 'rotate-180 text-amber-400' : ''
                }`}
              />
            </button>
          ) : (
            <button
              onClick={() => {
                soundService.playButtonClick();
                setIsMenuOpen((prev) => !prev);
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 font-semibold px-4 py-2 rounded-full text-sm hover:brightness-110 shadow-lg transition-all"
            >
              <User size={16} />
              <span>프로필 / 로그인</span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${
                  isMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
          )}

          {/* Glassmorphic Dropdown Popover */}
          {isMenuOpen && (
            <div className="absolute right-0 mt-2.5 w-64 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* Profile Card Header in Dropdown */}
              <div className="px-3 py-2.5 mb-1 bg-slate-800/60 rounded-xl border border-slate-700/50 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {mounted && isLoggedIn ? nickname.charAt(0) : <User size={18} />}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-semibold text-white truncate">
                    {mounted && isLoggedIn ? nickname : '게스트 사용자'}
                  </span>
                  <span className="text-[11px] text-amber-400 flex items-center gap-1 font-medium">
                    <Sparkles size={11} />
                    {mounted && isLoggedIn ? 'Lv.3 자취 마스터' : '로그인이 필요합니다'}
                  </span>
                </div>
              </div>

              {/* Menu Links */}
              <div className="space-y-1 my-1">
                {/* 1. 마이페이지 */}
                <button
                  onClick={() => handleMenuClick('/mypage')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                    pathname === '/mypage'
                      ? 'bg-orange-500/20 text-orange-400 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400">
                    <User size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-100">마이페이지</span>
                    <span className="text-[10px] text-slate-400">
                      내 혼밥 통계 및 식재료 관리
                    </span>
                  </div>
                </button>

                {/* 2. 북마크 */}
                <button
                  onClick={() => handleMenuClick('/bookmarks')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                    pathname === '/bookmarks'
                      ? 'bg-amber-500/20 text-amber-400 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                    <Bookmark size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-100">북마크</span>
                    <span className="text-[10px] text-slate-400">
                      찜한 1인분 레시피 보관함
                    </span>
                  </div>
                </button>

                {/* 3. 설정 */}
                <button
                  onClick={() => handleMenuClick('/settings')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                    pathname === '/settings'
                      ? 'bg-cyan-500/20 text-cyan-400 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                    <Settings size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-100">설정</span>
                    <span className="text-[10px] text-slate-400">
                      알림 및 사운드 효과음
                    </span>
                  </div>
                </button>
              </div>

              {/* Divider & Auth button */}
              <div className="border-t border-slate-800 pt-1.5 mt-1.5">
                {mounted && isLoggedIn ? (
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                  >
                    <LogOut size={15} />
                    <span>로그아웃</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleMenuClick('/login')}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:brightness-110 transition-all shadow"
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
    </header>
  );
};
