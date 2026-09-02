'use client';

import React, { useEffect, useState } from 'react';
import { CartData, cartApi } from '@/services/cartApi';
import { paymentApi } from '@/services/paymentApi';
import { ShoppingBag, Trash2, Plus, Minus, CreditCard, ExternalLink, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CartPage() {
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPay, setProcessingPay] = useState(false);

  useEffect(() => {
    cartApi.getCart().then((data) => {
      setCart(data);
      setLoading(false);
    });
  }, []);

  const handleQuantityChange = async (itemId: number, delta: number) => {
    if (!cart) return;
    const target = cart.items.find(i => i.itemId === itemId);
    if (!target) return;

    const newQty = Math.max(1, target.quantity + delta);
    const updated = await cartApi.updateQuantity(itemId, newQty);
    setCart(updated);
  };

  const handleRemoveItem = async (itemId: number) => {
    const updated = await cartApi.removeItem(itemId);
    setCart(updated);
  };

  const handleKakaoPay = async () => {
    if (!cart) return;
    setProcessingPay(true);
    try {
      const res = await paymentApi.readyPayment(cart.cartId);
      window.location.href = res.redirectUrl;
    } catch {
      window.location.href = '/payment/complete?tid=T_MOCK_999';
    }
  };

  if (loading || !cart) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center min-h-[50vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 text-sm">장바구니를 확인하는 중...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-8">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500/20 text-orange-400 p-2.5 rounded-2xl border border-orange-500/30">
            <ShoppingBag size={24} />
          </div>
          <h1 className="text-2xl font-bold text-white">장바구니 & 구매</h1>
        </div>
        <span className="text-xs text-slate-400">총 {cart.totalItems}개 상품</span>
      </div>

      {cart.items.length === 0 ? (
        <div className="glass-panel p-12 text-center flex flex-col items-center gap-4">
          <p className="text-slate-400 text-sm">장바구니가 비어있습니다.</p>
          <Link href="/" className="bg-orange-500 text-white px-6 py-2.5 rounded-xl text-xs font-semibold">
            레시피 쇼츠 둘러보기
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Item list */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {cart.items.map((item) => (
              <div key={item.itemId} className="glass-panel p-4 rounded-2xl flex items-center justify-between gap-4 border border-slate-800">
                <div className="flex flex-col gap-1 flex-grow">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      item.platform === 'COUPANG' ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {item.platform === 'COUPANG' ? '쿠팡' : '네이버'}
                    </span>
                    <a
                      href={item.productUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      <span>상품 링크</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                  <h3 className="font-semibold text-slate-200 text-sm line-clamp-1">
                    {item.productName}
                  </h3>
                  <span className="text-xs font-bold text-orange-400">
                    {item.price.toLocaleString()}원
                  </span>
                </div>

                {/* Quantity Control */}
                <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                  <button onClick={() => handleQuantityChange(item.itemId, -1)} className="text-slate-400 hover:text-white p-1">
                    <Minus size={12} />
                  </button>
                  <span className="text-xs font-mono font-bold w-6 text-center text-white">{item.quantity}</span>
                  <button onClick={() => handleQuantityChange(item.itemId, 1)} className="text-slate-400 hover:text-white p-1">
                    <Plus size={12} />
                  </button>
                </div>

                <button onClick={() => handleRemoveItem(item.itemId)} className="text-slate-500 hover:text-red-400 p-2">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Checkout Summary Side Panel */}
          <div className="glass-panel p-6 rounded-3xl flex flex-col gap-6 h-fit border border-orange-500/30">
            <h2 className="text-base font-bold text-white">결제 금액 요약</h2>

            <div className="flex flex-col gap-3 text-xs text-slate-300 border-b border-slate-800 pb-4">
              <div className="flex justify-between">
                <span>총 상품 금액</span>
                <span>{cart.totalAmount.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>배송비</span>
                <span className="text-emerald-400">무료 배송</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-white">최종 결제 금액</span>
              <span className="text-xl font-extrabold text-orange-400">
                {cart.totalAmount.toLocaleString()}원
              </span>
            </div>

            <button
              onClick={handleKakaoPay}
              disabled={processingPay}
              className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-slate-950 font-bold py-3.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xl active:scale-98 transition-all"
            >
              <CreditCard size={18} />
              <span>{processingPay ? '카카오페이 연결 중...' : '카카오페이로 1초 결제하기'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
