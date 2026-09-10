'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChefHat, Sparkles, ShoppingBag, ShieldCheck, ArrowRight, MessageCircle } from 'lucide-react';
import { authApi } from '@/services/authApi';
import { soundService } from '@/services/soundService';

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
      handleDevKakaoLogin();
      return;
    }
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code`;
    window.location.href = kakaoAuthUrl;
  };

  // 2. 테스트용 원클릭 로그인 (카카오 설정 없이 100% 즉시 로그인)
  const handleDevKakaoLogin = () => {
    setLoading(true);
    soundService.playButtonClick();
    
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', 'mock_kakao_token_' + Date.now());
        localStorage.setItem('refreshToken', 'mock_kakao_refresh_token');
        if (!localStorage.getItem('userNickname')) {
          localStorage.setItem('userNickname', '자취 미식가');
        }
        // 전역 로그인 상태 동기화 이벤트 발생
        window.dispatchEvent(new Event('auth-change'));
        window.dispatchEvent(new CustomEvent('auth-change'));
      }
      // 홈 화면으로 즉시 전환
      router.push('/');
    } catch (err) {
      console.error('테스트 로그인 실패:', err);
    } finally {
      setTimeout(() => setLoading(false), 500);
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
          
          <p className="text-[11px] text-[#D9D2BE]/70 text-center leading-relaxed">
            ※ 핫스팟/내부망 환경에서 카카오 에러 발생 시 아래 원클릭 버튼을 이용하세요.
          </p>
        </div>

        {/* Dev One-Click Login Button */}
        <button
          onClick={handleDevKakaoLogin}
          disabled={loading}
          className="w-full bg-[#0D2418] hover:bg-[#1B4731] border border-[#D4AF37]/50 text-[#D4AF37] font-bold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
        >
          <Sparkles size={14} className="text-[#D4AF37]" />
          <span>{loading ? '로그인 처리 중...' : '🚀 테스트용 원클릭 로그인 (핫스팟 전용)'}</span>
        </button>

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
