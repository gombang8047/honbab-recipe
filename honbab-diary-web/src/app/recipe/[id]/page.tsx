'use client';

import React, { useEffect, useState } from 'react';
import { RecipeDetail, recipeApi } from '@/services/recipeApi';
import { RecipeDetailView } from '@/components/RecipeDetailView';
import { cartApi } from '@/services/cartApi';
import { cartService } from '@/services/cartService';
import { useParams, useRouter } from 'next/navigation';

export default function RecipePage() {
  const params = useParams();
  const router = useRouter();
  const recipeId = Number(params?.id) || 1;
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    recipeApi.getDetail(recipeId).then((data) => {
      setRecipe(data);
      setLoading(false);
    });
  }, [recipeId]);

  const handleAddToCart = async (id: number) => {
    router.push('/cart');
  };

  if (loading || !recipe) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#D9D2BE] text-sm font-medium">레시피를 불러오는 중입니다...</p>
      </div>
    );
  }

  return <RecipeDetailView recipe={recipe} onAddToCart={handleAddToCart} />;
}
