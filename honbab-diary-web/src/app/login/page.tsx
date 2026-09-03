'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChefHat, Sparkles, ShoppingBag, ShieldCheck, ArrowRight, MessageCircle } from 'lucide-react';
import { authApi } from '@/services/authApi';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // 카카오 OAuth 설정
  const KAKAO_CLIENT_ID = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID || '';
  const REDIRECT_URI = typeof window !== 'undefined'
    ? `${window.location.origin}/auth/kakao/callback`
    : 'http://localhost:3000/auth/kakao/callback';

  // 1. 실제 카카오 인가 코드 요청 (카카오 로그인 페이지로 이동)
  const handleRealKakaoLogin = () => {
    if (!KAKAO_CLIENT_ID) {
      // 카카오 Client ID가 없을 경우 데모 로그인으로 안내
      handleDevKakaoLogin();
      return;
    }
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code`;
    window.location.href = kakaoAuthUrl;
  };

  const handleDevKakaoLogin = async () => {
    setLoading(true);
    try {
      await authApi.kakaoLogin('DEV_MOCK_KAKAO_CODE', REDIRECT_URI);
      router.push('/');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 flex flex-col items-center gap-8">
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center gap-3">
        <div className="bg-gradient-to-tr from-amber-500 to-orange-500 p-4 rounded-3xl text-white shadow-2xl ai-glow">
          <ChefHat size={40} />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
          혼밥레시피
        </h1>
        <p className="text-slate-400 text-xs tracking-wider font-medium">
          AI 쇼츠 요리 변환 & 자취생 맞춤 장보기 플랫폼
        </p>
      </div>

      {/* Main Login Card */}
      <div className="glass-panel p-8 rounded-3xl w-full flex flex-col gap-6 border border-orange-500/30 shadow-2xl">
        <div className="flex flex-col gap-1 text-center">
          <h2 className="text-lg font-bold text-white">카카오 계정으로 간편 시작</h2>
          <p className="text-slate-400 text-xs">
            별도 가입 없이 카카오톡으로 3초 만에 로그인하세요.
          </p>
        </div>

        {/* Official Kakao Login Button */}
        <button
          onClick={handleRealKakaoLogin}
          disabled={loading}
          className="w-full bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-bold py-3.5 px-4 rounded-2xl text-sm flex items-center justify-center gap-3 shadow-lg active:scale-98 transition-all"
        >
          <MessageCircle size={20} className="fill-[#191919]" />
          <span>카카오 로그인</span>
        </button>

        {/* Dev One-Click Login Button */}
        <button
          onClick={handleDevKakaoLogin}
          disabled={loading}
          className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-semibold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all"
        >
          <Sparkles size={14} className="text-amber-400" />
          <span>{loading ? '로그인 처리 중...' : '🚀 테스트용 원클릭 카카오 로그인'}</span>
        </button>

        {/* Feature List */}
        <div className="border-t border-slate-800/80 pt-5 flex flex-col gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2.5">
            <Sparkles size={14} className="text-orange-400 shrink-0" />
            <span>유튜브 쇼츠 요리 영상 AI 자동 레시피 추출</span>
          </div>
          <div className="flex items-center gap-2.5">
            <ShoppingBag size={14} className="text-amber-400 shrink-0" />
            <span>쿠팡 / 네이버 최저가 재료 장바구니 한 번에 연동</span>
          </div>
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
            <span>카카오페이 1초 간편 결제 지원</span>
          </div>
        </div>
      </div>

      {/* Return to Home */}
      <Link href="/" className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors">
        <span>둘러보기 (홈으로 이동)</span>
        <ArrowRight size={12} />
      </Link>
    </div>
  );
}
