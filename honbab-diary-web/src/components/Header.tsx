'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChefHat, ShoppingCart, Search, User, CheckCircle } from 'lucide-react';
import { cartApi } from '@/services/cartApi';

interface HeaderProps {
  cartCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ cartCount: propCartCount }) => {
  const [count, setCount] = useState<number>(propCartCount ?? 3);
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  useEffect(() => {
    cartApi.getCart().then((cart) => {
      if (cart && typeof cart.totalItems === 'number') {
        setCount(cart.totalItems);
      }
    }).catch(() => {});
  }, []);

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
        <Link
          href="/cart"
          className="relative p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
        >
          <ShoppingCart size={20} />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 bg-orange-500 text-white font-bold text-[11px] w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
              {count}
            </span>
          )}
        </Link>

        <button
          onClick={() => setIsLoggedIn(!isLoggedIn)}
          className={`flex items-center gap-2 font-semibold px-4 py-2 rounded-full text-sm shadow-lg transition-all ${
            isLoggedIn
              ? 'bg-slate-800 border border-amber-500/40 text-amber-300 hover:bg-slate-700'
              : 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 hover:brightness-110'
          }`}
        >
          {isLoggedIn ? <CheckCircle size={16} className="text-amber-400" /> : <User size={16} />}
          <span>{isLoggedIn ? '데모 계정 (로그인됨)' : '카카오 로그인'}</span>
        </button>
      </div>
    </header>
  );
};
