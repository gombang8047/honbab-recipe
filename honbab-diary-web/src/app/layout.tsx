import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const viewport: Viewport = {
  themeColor: '#133624',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: '혼밥레시피 — 자취생을 위한 AI 레시피 플랫폼',
  description: '유튜브 쇼츠 자취 요리 영상을 AI가 1인분 레시피로 자동 변환하고 장보기 연동 및 카카오페이 결제를 지원합니다.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '혼밥레시피',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="혼밥레시피" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('honbab_theme');
                  // 기본모드는 화이트(light). 사용자가 토글 버튼으로 'dark'를 명시적으로 선택했을 때만 dark 클래스 추가
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased min-h-screen bg-[#1B4731] text-[#FDFBF4] dark:bg-[#0D2418] dark:text-[#FDFBF4] flex flex-col selection:bg-[#D4AF37] selection:text-[#1B4731]" suppressHydrationWarning>
        <Header />
        <main className="flex-grow flex flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
