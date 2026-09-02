import { apiClient } from './api';

export interface Ingredient {
  ingredientId: number;
  name: string;
  amount: string;
  unit: string;
  isEssential: boolean;
}

export interface Step {
  order: number;
  description: string;
  imageUrl?: string;
  timerSeconds?: number;
}

export interface RecipeDetail {
  id: number;
  shortsId: number;
  title: string;
  description: string;
  servingSize: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  estimatedCost: number;
  steps: Step[];
  ingredients: Ingredient[];
}

const MOCK_RECIPE: RecipeDetail = {
  id: 1,
  shortsId: 1,
  title: "🍳 5분컷 초간단 계란볶음밥",
  description: "파기름과 굴소스로 맛을 낸 1인분 맞춤 계란 볶음밥 레시피입니다.",
  servingSize: 1,
  prepTimeMinutes: 3,
  cookTimeMinutes: 5,
  difficulty: "EASY",
  estimatedCost: 3500,
  ingredients: [
    { ingredientId: 1, name: "밥", amount: "1", unit: "공기", isEssential: true },
    { ingredientId: 2, name: "계란", amount: "2", unit: "개", isEssential: true },
    { ingredientId: 3, name: "대파", amount: "1/2", unit: "대", isEssential: true },
    { ingredientId: 4, name: "굴소스", amount: "1", unit: "큰술", isEssential: false },
    { ingredientId: 5, name: "식용유", amount: "2", unit: "큰술", isEssential: true }
  ],
  steps: [
    { order: 1, description: "대파를 송송 썰어 식용유를 두른 팬에 넣고 파기름을 냅니다.", timerSeconds: 60 },
    { order: 2, description: "파를 한쪽으로 밀고 계란 2개를 풀어 노릇하게 스크램블을 만듭니다.", timerSeconds: 60 },
    { order: 3, description: "밥 1공기와 굴소스 1큰술을 넣고 센 불에서 골고루 볶아줍니다.", timerSeconds: 120 },
    { order: 4, description: "불을 끄고 참기름 살짝 두르면 고소한 계란볶음밥 완성!", timerSeconds: 0 }
  ]
};

export const recipeApi = {
  convertToRecipe: async (shortsId: number): Promise<RecipeDetail> => {
    try {
      const res: any = await apiClient.post(`/shorts/${shortsId}/recipe`);
      return res.data;
    } catch {
      // Return mock with delay to simulate AI conversion
      await new Promise(resolve => setTimeout(resolve, 1500));
      return { ...MOCK_RECIPE, shortsId };
    }
  },

  getDetail: async (recipeId: number): Promise<RecipeDetail> => {
    try {
      const res: any = await apiClient.get(`/recipes/${recipeId}`);
      return res.data;
    } catch {
      return MOCK_RECIPE;
    }
  }
};
