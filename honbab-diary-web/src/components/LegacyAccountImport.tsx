'use client';

import { useEffect, useState } from 'react';
import { cartService, CartIngredient } from '@/services/cartService';
import { diaryService, CookingDiaryEntry } from '@/services/diaryService';

export function LegacyAccountImport() {
  const [cart, setCart] = useState<CartIngredient[]>([]);
  const [diaries, setDiaries] = useState<CookingDiaryEntry[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reload = () => {
    try {
      setCart(cartService.getLegacyItems());
      setDiaries(diaryService.getLegacyEntries());
    } catch { setError('이전 브라우저 데이터를 읽지 못했습니다. 원본은 그대로 보존되어 있습니다.'); }
  };
  useEffect(reload, []);
  const toggle = (id: string) => setSelected(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]);
  const submit = async () => {
    if (busy || !selected.length || !window.confirm('선택한 내역이 모두 본인 것인가요? 현재 로그인한 계정의 서버 DB에 저장합니다.')) return;
    setBusy(true);
    setError(null);
    try {
      await cartService.importLegacyItems(cart.filter(item => selected.includes('cart:' + item.id)).map(item => item.id));
      await diaryService.importLegacyEntries(diaries.filter(item => selected.includes('diary:' + item.id)).map(item => item.id));
      setSelected([]);
    } catch { setError('일부 내역을 가져오지 못했습니다. 원본은 보존되어 있으니 다시 시도해 주세요.'); }
    finally { reload(); setBusy(false); }
  };
  if (!cart.length && !diaries.length && !error) return null;
  return <details className="p-4 mb-6 border border-amber-500/40 rounded-xl">
    <summary>이전 브라우저 내역 가져오기</summary>
    <p className="my-3 text-sm">아래 내역은 계정 정보 없이 저장되어 있었습니다. 다른 사람의 기록이나 테스트 데이터는 제외하고 본인 내역만 선택하세요. 원본은 삭제하지 않습니다. 과거 일기 이전에는 신규 작성 경험치를 지급하지 않습니다.</p>
    {cart.map(item => <label key={'cart:' + item.id} className="flex gap-2 py-1">
      <input type="checkbox" disabled={busy} checked={selected.includes('cart:' + item.id)} onChange={() => toggle('cart:' + item.id)} />
      장바구니 · {item.recipeTitle} · {item.name}
    </label>)}
    {diaries.map(item => <label key={'diary:' + item.id} className="flex gap-2 py-1">
      <input type="checkbox" disabled={busy} checked={selected.includes('diary:' + item.id)} onChange={() => toggle('diary:' + item.id)} />
      일기 · {item.recipeTitle} · {new Date(item.createdAt).toLocaleDateString()} · {item.comment.slice(0, 40)}
    </label>)}
    <button disabled={busy || !selected.length} onClick={submit} className="mt-3 px-4 py-2 rounded-lg bg-amber-500 text-black disabled:opacity-50">
      {busy ? '서버로 가져오는 중...' : '선택한 본인 내역 가져오기'}
    </button>
    {error && <p role="alert" className="text-red-400 mt-2">{error}</p>}
  </details>;
}
