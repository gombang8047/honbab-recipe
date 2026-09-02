import type { Metadata } from 'next';
import '@/styles/globals.css';
import { Header } from '@/components/Header';

export const metadata: Metadata = {
  title: '🍳 혼밥일기 — 자취생을 위한 AI 레시피 플랫폼',
  description: '유튜브 쇼츠 자취 요리 영상을 AI가 1인분 레시피로 자동 변환하고 장보기 연동 및 카카오페이 결제를 지원합니다.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="antialiased min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Header />
        <main className="flex-grow">{children}</main>
        <footer className="py-6 text-center text-xs text-slate-500 border-t border-slate-900 mt-12">
          © 2026 혼밥일기 — 자취생 맞춤 AI 레시피 플랫폼. All rights reserved.
        </footer>
      </body>
    </html>
  );
}
