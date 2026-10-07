import { getAccountId } from './authSession';
import { apiClient } from './api';
import { getIngredientPricing, isFreeBasicIngredient } from './ingredientPricing';

export interface CartIngredient {
  id: string; // 고유 ID (recipeId + ingredientName)
  recipeId: number;
  recipeTitle: string;
  name: string;
  amount: string;
  unit: string;
  isEssential: boolean;
  checked: boolean; // 구매 대상 여부 (체크 해제 시 '집에 있음')
  quantity: number;
  estimatedPrice: number; // 1인 가성비 라인 기준 단가
  addedAt: number;
}


const BASE_KEY = 'honbab_cart_ingredients';
const GUEST_KEY = BASE_KEY + ':guest';
let owner: string | null = null;
let items: CartIngredient[] = [];
let pending: Promise<unknown> = Promise.resolve();
const loads = new Map<string, Promise<CartIngredient[]>>();

function notify() {
  window.dispatchEvent(new CustomEvent('cart-changed', { detail: { count: cartService.getCartCount() } }));
}
function read(key: string): CartIngredient[] {
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error('저장된 장바구니 형식을 확인해 주세요.');
  return parsed;
}
function current(): CartIngredient[] {
  if (typeof window === 'undefined') return [];
  const account = getAccountId();
  if (!account) return read(GUEST_KEY);
  if (owner !== account) { owner = account; items = []; }
  return items;
}
function commit(account: string, next: CartIngredient[]): CartIngredient[] {
  if (getAccountId() !== account) throw new Error('계정이 변경되었습니다.');
  owner = account;
  items = next;
  notify();
  return next;
}
async function importStored(account: string, key: string, guest: boolean) {
  const marker = key + ':server-migrated-v2';
  if (!guest && localStorage.getItem(marker)) return;
  const stored = read(key);
  if (!stored.length) return;
  for (let offset = 0; offset < stored.length; offset += 100) {
    if (getAccountId() !== account) throw new Error('계정이 변경되었습니다.');
    const res: any = await apiClient.post('/cart/ingredients/import', stored.slice(offset, offset + 100));
    commit(account, res.data);
  }
  // Preserve account-local backup; guest cart is consumed only after confirmed server success.
  if (getAccountId() !== account) throw new Error('계정이 변경되었습니다.');
  if (guest) localStorage.removeItem(key);
  else localStorage.setItem(marker, 'true');
}
async function refresh(): Promise<CartIngredient[]> {
  const account = getAccountId();
  if (!account) return current();
  const existing = loads.get(account);
  if (existing) return existing;
  const task = (async () => {
    await importStored(account, BASE_KEY + ':user:' + account, false);
    await importStored(account, GUEST_KEY, true);
    if (getAccountId() !== account) throw new Error('계정이 변경되었습니다.');
    const res: any = await apiClient.get('/cart/ingredients');
    return commit(account, res.data);
  })();
  loads.set(account, task);
  try { return await task; } finally { if (loads.get(account) === task) loads.delete(account); }
}
function change(
  local: (list: CartIngredient[]) => CartIngredient[],
  server: (list: CartIngredient[]) => Promise<any>,
): Promise<CartIngredient[]> {
  const account = getAccountId();
  const run = async () => {
    if (getAccountId() !== account) throw new Error('계정이 변경되었습니다.');
    if (!account) {
      const next = local(current());
      localStorage.setItem(GUEST_KEY, JSON.stringify(next));
      notify();
      return next;
    }
    await refresh();
    if (getAccountId() !== account) throw new Error('계정이 변경되었습니다.');
    const res = await server(current());
    return commit(account, res.data);
  };
  const task = pending.then(run, run);
  pending = task.catch(() => {});
  return task;
}
const check = (select: (item: CartIngredient) => boolean, checked: boolean) => change(
  list => list.map(item => select(item) ? { ...item, checked } : item),
  list => apiClient.post('/cart/ingredients/check', { ids: list.filter(select).map(item => item.id), checked }),
);
const remove = (select: (item: CartIngredient) => boolean) => change(
  list => list.filter(item => !select(item)),
  list => apiClient.post('/cart/ingredients/remove', { ids: list.filter(select).map(item => item.id) }),
);

export const cartService = {
  getLegacyItems: (): CartIngredient[] => read(BASE_KEY).filter(item =>
    !localStorage.getItem('honbab_legacy_cart_claim:' + item.id)),
  importLegacyItems: async (ids: string[]): Promise<void> => {
    const account = getAccountId();
    if (!account) throw new Error('로그인이 필요합니다.');
    const selected = cartService.getLegacyItems().filter(item => ids.includes(item.id));
    for (let offset = 0; offset < selected.length; offset += 100) {
      if (getAccountId() !== account) throw new Error('계정이 변경되었습니다.');
      const batch = selected.slice(offset, offset + 100);
      const res: any = await apiClient.post('/cart/ingredients/import', batch);
      commit(account, res.data);
      batch.forEach(item => localStorage.setItem('honbab_legacy_cart_claim:' + item.id, account));
    }
  },
  getItems: current,
  getCartCount: () => current().length,
  refresh,
  mergeGuestCart: refresh,
  addFromRecipe: (recipe: {
    id: number; title: string;
    ingredients: { ingredientId: number; name: string; amount: string; unit: string; isEssential?: boolean }[];
  }): Promise<CartIngredient[]> => {
    const additions = recipe.ingredients.map(ing => ({
      id: `${recipe.id}_${ing.ingredientId}_${ing.name}`,
      recipeId: recipe.id, recipeTitle: recipe.title, name: ing.name, amount: ing.amount || '',
      unit: ing.unit || '', isEssential: ing.isEssential ?? true,
      checked: !isFreeBasicIngredient(ing.name), quantity: 1,
      estimatedPrice: getIngredientPricing(ing.name, ing.amount, ing.unit).tiers.value.estimatedPrice,
      addedAt: Date.now(),
    }));
    return change(list => {
      const next = list.map(item => ({ ...item }));
      additions.forEach(item => {
        const existing = next.find(entry => entry.id === item.id || (entry.recipeId === item.recipeId && entry.name === item.name));
        if (existing) { existing.quantity = Math.min(999, existing.quantity + 1); existing.checked = item.checked; }
        else next.push(item);
      });
      return next;
    }, () => apiClient.post('/cart/ingredients', additions));
  },
  removeItem: (id: string) => remove(item => item.id === id),
  removeRecipeGroup: (recipeId?: number, title?: string) => remove(item =>
    typeof recipeId === 'number' ? item.recipeId === recipeId : item.recipeTitle === title),
  toggleChecked: (id: string) => change(
    list => list.map(item => item.id === id ? { ...item, checked: !item.checked } : item),
    list => {
      const item = list.find(item => item.id === id);
      if (!item) throw new Error('장바구니 항목이 없습니다.');
      return apiClient.patch('/cart/ingredients', { id, checked: !item.checked });
    }),
  toggleRecipeGroupChecked: (title: string, checked: boolean) => check(item => item.recipeTitle === title, checked),
  toggleAll: (checked: boolean) => check(() => true, checked),
  updateQuantity: (id: string, delta: number) => change(
    list => list.map(item => item.id === id ? { ...item, quantity: Math.min(999, Math.max(1, item.quantity + delta)) } : item),
    list => {
      const item = list.find(item => item.id === id);
      if (!item) throw new Error('장바구니 항목이 없습니다.');
      return apiClient.patch('/cart/ingredients', { id, quantity: Math.min(999, Math.max(1, item.quantity + delta)) });
    }),
  clearCart: () => change(() => [], () => apiClient.delete('/cart/ingredients')),
};
