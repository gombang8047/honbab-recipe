'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { RecipeDetail, recipeApi } from '@/services/recipeApi';
import { RecipeDetailView } from '@/components/RecipeDetailView';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

function RecipeContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryYoutubeId = searchParams.get('youtubeId');

  const recipeId = Number(params?.id) || 1;
  const cachedRecipe = recipeApi.getCached(recipeId);
  const [recipe, setRecipe] = useState<RecipeDetail | null>(cachedRecipe);
  const [loading, setLoading] = useState(!cachedRecipe);

  useEffect(() => {
    recipeApi.getDetail(recipeId).then((data) => {
      // 쿼리 파라미터 또는 세션스토리지에 저장된 실제 쇼츠 ID를 레시피에 주입
      const savedYoutubeId =
        queryYoutubeId ||
        (typeof window !== 'undefined' ? sessionStorage.getItem('current_recipe_youtube_id') : null);

      if (savedYoutubeId) {
        data = { ...data, shortsYoutubeId: savedYoutubeId };
      }
      setRecipe(data);
      setLoading(false);
    });
  }, [recipeId, queryYoutubeId]);

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

export default function RecipePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto p-8 text-center flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#D9D2BE] text-sm font-medium">레시피를 불러오는 중입니다...</p>
        </div>
      }
    >
      <RecipeContent />
    </Suspense>
  );
}
