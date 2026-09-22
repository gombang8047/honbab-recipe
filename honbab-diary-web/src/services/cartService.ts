/**
 * 장바구니 로컬 스토리지 관리 및 실시간 동기화 서비스
 */

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

const CART_STORAGE_KEY = 'honbab_cart_ingredients';

// 최초 1회 기본 샘플 데이터 (비어있을 때 친절한 사용자 경험 제공)
const INITIAL_CART_SAMPLE: CartIngredient[] = [
  {
    id: '1_1_대파',
    recipeId: 1,
    recipeTitle: '🍳 5분컷 초간단 계란볶음밥',
    name: '대파',
    amount: '1/2',
    unit: '대',
    isEssential: true,
    checked: true,
    quantity: 1,
    estimatedPrice: 1600,
    addedAt: Date.now() - 10000
  },
  {
    id: '1_2_계란',
    recipeId: 1,
    recipeTitle: '🍳 5분컷 초간단 계란볶음밥',
    name: '계란',
    amount: '2',
    unit: '개',
    isEssential: true,
    checked: true,
    quantity: 1,
    estimatedPrice: 2800,
    addedAt: Date.now() - 9000
  },
  {
    id: '1_3_굴소스',
    recipeId: 1,
    recipeTitle: '🍳 5분컷 초간단 계란볶음밥',
    name: '굴소스',
    amount: '1',
    unit: '큰술',
    isEssential: false,
    checked: true,
    quantity: 1,
    estimatedPrice: 3200,
    addedAt: Date.now() - 8000
  }
];

function notifyCartChange(count: number) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cart-changed', { detail: { count } }));
  }
}

export const cartService = {
  /**
   * 모든 장바구니 재료 조회
   */
  getItems: (): CartIngredient[] => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(INITIAL_CART_SAMPLE));
        return INITIAL_CART_SAMPLE;
      }
      const list: CartIngredient[] = JSON.parse(raw);
      // 조리용 물 등 가정 내 기본 무료 재료는 구매 목록에서 기본적으로 '집에 있음'(체크 해제)으로 자동 보정
      let modified = false;
      const sanitized = list.map((item) => {
        if (isFreeBasicIngredient(item.name) && item.checked) {
          modified = true;
          return { ...item, checked: false };
        }
        return item;
      });
      if (modified) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(sanitized));
      }
      return sanitized;
    } catch {
      return [];
    }
  },

  /**
   * 장바구니에 담긴 재료 총 개수
   */
  getCartCount: (): number => {
    const items = cartService.getItems();
    return items.length;
  },

  /**
   * 특정 레시피의 모든 재료를 장바구니에 추가
   */
  addFromRecipe: (recipe: {
    id: number;
    title: string;
    ingredients: { ingredientId: number; name: string; amount: string; unit: string; isEssential?: boolean }[];
  }): CartIngredient[] => {
    const current = cartService.getItems();
    const newItems: CartIngredient[] = [...current];

    recipe.ingredients.forEach((ing) => {
      const uniqueId = `${recipe.id}_${ing.ingredientId}_${ing.name}`;
      const existingIndex = newItems.findIndex((item) => item.id === uniqueId || (item.recipeId === recipe.id && item.name === ing.name));
      const isFree = isFreeBasicIngredient(ing.name);

      if (existingIndex >= 0) {
        // 이미 있으면 수량 1 증가
        newItems[existingIndex].quantity += 1;
        if (!isFree) {
          newItems[existingIndex].checked = true;
        }
      } else {
        const pricing = getIngredientPricing(ing.name, ing.amount, ing.unit);
        newItems.push({
          id: uniqueId,
          recipeId: recipe.id,
          recipeTitle: recipe.title,
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
          isEssential: ing.isEssential ?? true,
          checked: !isFree, // 조리수 등 기본 재료는 기본 '집에 있음' (체크 해제)
          quantity: 1,
          estimatedPrice: pricing.tiers.value.estimatedPrice,
          addedAt: Date.now()
        });
      }
    });

    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItems));
    } catch {}

    notifyCartChange(newItems.length);
    return newItems;
  },

  /**
   * 개별 아이템 삭제
   */
  removeItem: (id: string): CartIngredient[] => {
    const current = cartService.getItems();
    const filtered = current.filter((i) => i.id !== id);
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(filtered));
    } catch {}
    notifyCartChange(filtered.length);
    return filtered;
  },

  /**
   * 특정 레시피에 속한 재료 일괄 삭제
   */
  removeRecipeGroup: (recipeId?: number, recipeTitle?: string): CartIngredient[] => {
    const current = cartService.getItems();
    const filtered = current.filter((i) => {
      if (typeof recipeId === 'number' && i.recipeId === recipeId) return false;
      if (recipeTitle && i.recipeTitle === recipeTitle) return false;
      return true;
    });
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(filtered));
    } catch {}
    notifyCartChange(filtered.length);
    return filtered;
  },

  /**
   * 구매 대상 체크/해제 (체크 해제 시 '집에 이미 있음')
   */
  toggleChecked: (id: string): CartIngredient[] => {
    const current = cartService.getItems();
    const updated = current.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    return updated;
  },

  /**
   * 특정 레시피 그룹에 속한 재료들의 체크 일괄 토글
   */
  toggleRecipeGroupChecked: (recipeTitle: string, checked: boolean): CartIngredient[] => {
    const current = cartService.getItems();
    const updated = current.map((item) => {
      const groupKey = item.recipeTitle || '일반 장바구니 재료';
      if (groupKey === recipeTitle) {
        return { ...item, checked };
      }
      return item;
    });
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    return updated;
  },

  /**
   * 전체 선택 / 전체 해제
   */
  toggleAll: (checked: boolean): CartIngredient[] => {
    const current = cartService.getItems();
    const updated = current.map((item) => ({ ...item, checked }));
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    return updated;
  },


  /**
   * 수량 변경
   */
  updateQuantity: (id: string, delta: number): CartIngredient[] => {
    const current = cartService.getItems();
    const updated = current.map((item) => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    });
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    return updated;
  },

  /**
   * 장바구니 전체 비우기
   */
  clearCart: (): void => {
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch {}
    notifyCartChange(0);
  }
};
