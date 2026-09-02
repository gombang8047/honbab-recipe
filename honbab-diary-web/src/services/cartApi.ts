import { apiClient } from './api';

export interface CartItem {
  itemId: number;
  productName: string;
  platform: string;
  productUrl: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface CartData {
  cartId: number;
  status: string;
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
}

const MOCK_CART: CartData = {
  cartId: 101,
  status: "ACTIVE",
  totalAmount: 11400,
  totalItems: 3,
  items: [
    {
      itemId: 1,
      productName: "[쿠팡] 무항생제 신선한 대란 10구",
      platform: "COUPANG",
      productUrl: "https://www.coupang.com",
      quantity: 1,
      price: 3900,
      subtotal: 3900
    },
    {
      itemId: 2,
      productName: "[네이버] 국산 흙대파 500g",
      platform: "NAVER",
      productUrl: "https://shopping.naver.com",
      quantity: 1,
      price: 2500,
      subtotal: 2500
    },
    {
      itemId: 3,
      productName: "[쿠팡] 이금기 프리미엄 굴소스 510g",
      platform: "COUPANG",
      productUrl: "https://www.coupang.com",
      quantity: 1,
      price: 5000,
      subtotal: 5000
    }
  ]
};

export const cartApi = {
  getCart: async (): Promise<CartData> => {
    try {
      const res: any = await apiClient.get('/cart');
      return res.data;
    } catch {
      return MOCK_CART;
    }
  },

  addFromRecipe: async (recipeId: number): Promise<CartData> => {
    try {
      const res: any = await apiClient.post(`/cart/from-recipe/${recipeId}`);
      return res.data;
    } catch {
      return MOCK_CART;
    }
  },

  updateQuantity: async (itemId: number, quantity: number): Promise<CartData> => {
    try {
      const res: any = await apiClient.patch(`/cart/items/${itemId}?quantity=${quantity}`);
      return res.data;
    } catch {
      const items = MOCK_CART.items.map(i => i.itemId === itemId ? { ...i, quantity, subtotal: i.price * quantity } : i);
      const totalAmount = items.reduce((acc, i) => acc + i.subtotal, 0);
      return { ...MOCK_CART, items, totalAmount };
    }
  },

  removeItem: async (itemId: number): Promise<CartData> => {
    try {
      const res: any = await apiClient.delete(`/cart/items/${itemId}`);
      return res.data;
    } catch {
      const items = MOCK_CART.items.filter(i => i.itemId !== itemId);
      const totalAmount = items.reduce((acc, i) => acc + i.subtotal, 0);
      return { ...MOCK_CART, items, totalItems: items.length, totalAmount };
    }
  }
};
