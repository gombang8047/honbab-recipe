'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, Home, Receipt } from 'lucide-react';

export default function PaymentCompletePage() {
  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center flex flex-col items-center gap-6">
      <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center border border-emerald-500/40 shadow-xl animate-bounce">
        <CheckCircle2 size={44} />
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-white">카카오페이 결제 완료! 🎉</h1>
        <p className="text-slate-400 text-xs leading-relaxed">
          주문하신 자취 레시피 재료가 정상적으로 결제되었습니다.<br />
          신선하게 배송될 예정입니다!
        </p>
      </div>

      <div className="w-full glass-panel p-5 rounded-2xl flex flex-col gap-3 text-xs text-slate-300 border border-slate-800 text-left">
        <div className="flex justify-between border-b border-slate-800 pb-2">
          <span className="text-slate-500">결제 수단</span>
          <span className="font-semibold text-yellow-400">카카오페이 간편결제</span>
        </div>
        <div className="flex justify-between border-b border-slate-800 pb-2">
          <span className="text-slate-500">주문 번호</span>
          <span className="font-mono text-slate-200">HB-2026-0902-882</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">배송 상태</span>
          <span className="font-semibold text-emerald-400">상품 준비 중</span>
        </div>
      </div>

      <div className="flex gap-3 w-full">
        <Link
          href="/"
          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg"
        >
          <Home size={16} />
          <span>메인 피드로</span>
        </Link>
      </div>
    </div>
  );
}
