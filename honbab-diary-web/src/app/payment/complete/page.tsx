'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Home, ShoppingBag, ArrowRight } from 'lucide-react';

function PaymentCompleteContent() {
  const searchParams = useSearchParams();
  const tid = searchParams?.get('tid') || 'T_MOCK_PAYMENT_SUCCESS';

  return (
    <div className="max-w-xl mx-auto px-4 py-16 flex flex-col items-center text-center gap-6">
      <div className="bg-emerald-500/20 text-emerald-400 p-5 rounded-full border border-emerald-500/40 shadow-2xl animate-bounce">
        <CheckCircle2 size={56} />
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          결제가 완료되었습니다! 🎉
        </h1>
        <p className="text-slate-400 text-sm">
          주문하신 재료 배송 정보가 각 마켓(쿠팡/네이버)으로 전송되었습니다.
        </p>
      </div>

      <div className="glass-panel p-6 rounded-3xl w-full flex flex-col gap-4 text-left border border-slate-800">
        <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-3">
          <span className="text-slate-400">결제 수단</span>
          <span className="font-semibold text-amber-300">카카오페이 (KakaoPay)</span>
        </div>
        <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-3">
          <span className="text-slate-400">거래 번호 (TID)</span>
          <span className="font-mono text-slate-300">{tid}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400">배송 상태</span>
          <span className="font-semibold text-emerald-400">상품 준비 중</span>
        </div>
      </div>

      <div className="flex gap-4 w-full pt-4">
        <Link
          href="/"
          className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-3.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all"
        >
          <Home size={16} />
          <span>홈으로</span>
        </Link>
        <Link
          href="/cart"
          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
        >
          <ShoppingBag size={16} />
          <span>장바구니 확인</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

export default function PaymentCompletePage() {
  return (
    <Suspense fallback={
      <div className="max-w-xl mx-auto p-12 text-center text-slate-400">
        결제 완료 정보를 불러오는 중...
      </div>
    }>
      <PaymentCompleteContent />
    </Suspense>
  );
}
