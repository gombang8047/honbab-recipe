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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    recipeApi.getDetail(recipeId)
      .then((data) => {
        // 쿼리 파라미터 또는 세션스토리지에 저장된 실제 쇼츠 ID를 레시피에 주입
        const savedYoutubeId =
          queryYoutubeId ||
          (typeof window !== 'undefined' ? sessionStorage.getItem('current_recipe_youtube_id') : null);

        if (savedYoutubeId) {
          data = { ...data, shortsYoutubeId: savedYoutubeId };
        }
        setRecipe(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('레시피 상세 조회 실패:', err);
        setError('해당 레시피를 찾을 수 없습니다. (존재하지 않거나 변환 실패)');
        setLoading(false);
      });
  }, [recipeId, queryYoutubeId]);

  const handleAddToCart = async (id: number) => {
    router.push('/cart');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#D9D2BE] text-sm font-medium">레시피를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="max-w-md mx-auto p-8 text-center flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-14 h-14 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-2xl font-bold border border-red-500/40">
          !
        </div>
        <h2 className="text-lg font-bold text-[#FDFBF4]">레시피 조회 실패</h2>
        <p className="text-stone-300 text-sm">{error || '레시피 정보가 없습니다.'}</p>
        <button
          onClick={() => router.push('/')}
          className="mt-4 px-6 py-2.5 rounded-xl bg-[#D4AF37] text-[#1B4731] font-semibold hover:bg-[#F3E5AB] transition-colors"
        >
          홈으로 돌아가기
        </button>
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
