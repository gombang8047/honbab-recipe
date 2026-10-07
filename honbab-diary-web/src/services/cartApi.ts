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

export const cartApi = {
  getCart: async (): Promise<CartData> => {
    const res: any = await apiClient.get('/cart');
    return res.data;
  },
  addFromRecipe: async (recipeId: number): Promise<CartData> => {
    const res: any = await apiClient.post(`/cart/from-recipe/${recipeId}`);
    return res.data;
  },
  updateQuantity: async (itemId: number, quantity: number): Promise<CartData> => {
    const res: any = await apiClient.patch(`/cart/items/${itemId}?quantity=${quantity}`);
    return res.data;
  },
  removeItem: async (itemId: number): Promise<CartData> => {
    const res: any = await apiClient.delete(`/cart/items/${itemId}`);
    return res.data;
  }
};
