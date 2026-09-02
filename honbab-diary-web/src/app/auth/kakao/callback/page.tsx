'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { authApi } from '@/services/authApi';
import { CheckCircle2, AlertCircle } from 'lucide-react';

function KakaoCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams?.get('code');
    if (!code) {
      setError('인가 코드가 존재하지 않습니다.');
      return;
    }

    const redirectUri = window.location.origin + window.location.pathname;

    authApi.kakaoLogin(code, redirectUri)
      .then((tokens) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
          localStorage.setItem('userNickname', '카카오 사용자');
        }
        setTimeout(() => {
          router.push('/');
        }, 1000);
      })
      .catch((err) => {
        console.error(err);
        setError('카카오 로그인 처리 중 오류가 발생했습니다.');
      });
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="max-w-md mx-auto p-8 text-center flex flex-col items-center gap-4">
        <div className="text-red-400 bg-red-500/20 p-4 rounded-full border border-red-500/30">
          <AlertCircle size={40} />
        </div>
        <h2 className="text-lg font-bold text-white">로그인 실패</h2>
        <p className="text-xs text-slate-400">{error}</p>
        <button
          onClick={() => router.push('/login')}
          className="mt-4 bg-orange-500 text-white font-bold py-2.5 px-6 rounded-xl text-xs"
        >
          다시 로그인하기
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-12 text-center flex flex-col items-center gap-4 min-h-[50vh] justify-center">
      <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-2" />
      <h2 className="text-lg font-bold text-white">카카오 로그인 처리 중...</h2>
      <p className="text-xs text-slate-400">잠시만 기다려 주세요.</p>
    </div>
  );
}

export default function KakaoCallbackPage() {
  return (
    <Suspense fallback={
      <div className="max-w-md mx-auto p-12 text-center text-slate-400">
        로그인 정보를 읽는 중...
      </div>
    }>
      <KakaoCallbackContent />
    </Suspense>
  );
}
