'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChefHat, Sparkles, ShoppingBag, ShieldCheck, ArrowRight, MessageCircle } from 'lucide-react';
import { soundService } from '@/services/soundService';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 카카오 OAuth 설정
  const KAKAO_CLIENT_ID = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID || '';
  const REDIRECT_URI = typeof window !== 'undefined'
    ? `${window.location.origin}/auth/kakao/callback`
    : 'http://localhost:3000/auth/kakao/callback';

  // 1. 실제 카카오 인가 코드 요청 (카카오 로그인 페이지로 이동)
  const handleRealKakaoLogin = () => {
    if (!KAKAO_CLIENT_ID) {
      setError('카카오 로그인 설정이 준비되지 않았습니다. 관리자에게 문의해 주세요.');
      return;
    }
    setError(null);
    setLoading(true);
    soundService.playButtonClick();
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code`;
    window.location.href = kakaoAuthUrl;
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
      <div className="rounded-3xl p-6 sm:p-8 w-full flex flex-col gap-6 border border-[#D4AF37]/40 bg-[#133624] shadow-2xl text-[#FDFBF4]">
        <div className="flex flex-col gap-1.5 text-center">
          <h2 className="text-lg font-bold text-[#FDFBF4]">카카오 계정으로 간편 시작</h2>
          <p className="text-[#D9D2BE] text-xs">
            별도 가입 없이 카카오톡으로 3초 만에 로그인하세요.
          </p>
        </div>

        {/* Official Kakao Login Button */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleRealKakaoLogin}
            disabled={loading}
            className="w-full bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-bold py-3.5 px-4 rounded-2xl text-sm flex items-center justify-center gap-3 shadow-lg active:scale-98 transition-all"
          >
            <MessageCircle size={20} className="fill-[#191919]" />
            <span>카카오 로그인</span>
          </button>
          
          {error && <p role="alert" className="text-xs text-red-400 text-center">{error}</p>}
        </div>

        {/* Feature List */}
        <div className="border-t border-[#D4AF37]/20 pt-5 flex flex-col gap-3 text-xs text-[#D9D2BE]">
          <div className="flex items-center gap-2.5">
            <Sparkles size={14} className="text-[#D4AF37] shrink-0" />
            <span>유튜브 쇼츠 요리 영상 AI 자동 레시피 추출</span>
          </div>
          <div className="flex items-center gap-2.5">
            <ShoppingBag size={14} className="text-[#D4AF37] shrink-0" />
            <span>쿠팡 • 컬리 최저가 재료 장바구니 한 번에 연동</span>
          </div>
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
            <span>혼밥 일기 작성 및 자취 요리사 레벨 성장</span>
          </div>
        </div>
      </div>

      {/* Return to Home */}
      <Link href="/" className="text-xs text-[#D9D2BE] hover:text-[#D4AF37] flex items-center gap-1 transition-colors">
        <span>둘러보기 (홈으로 이동)</span>
        <ArrowRight size={12} />
      </Link>
    </div>
  );
}
