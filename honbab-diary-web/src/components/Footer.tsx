'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export const Footer: React.FC = () => {
  const pathname = usePathname();

  // 레시피 상세 페이지에서는 좌측 영상 고정 및 우측 독립 스크롤 UX를 위해 전역 풋터를 숨깁니다.
  // (레시피 우측 스크롤 최하단에 일체화된 저작권 및 안내가 자연스럽게 표시됩니다)
  if (pathname?.startsWith('/recipe/')) {
    return null;
  }

  return (
    <footer className="py-7 text-center text-xs text-[#D9D2BE] dark:text-[#B8AF98] border-t border-[#D4AF37]/30 dark:border-[#D4AF37]/20 mt-12 transition-colors">
      © 2026 혼밥레시피 — 자취생 맞춤 AI 레시피 플랫폼. All rights reserved.
    </footer>
  );
};
