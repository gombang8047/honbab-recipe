'use client';

import { useEffect, useState, Fragment } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getAccountId } from '@/services/authSession';

export function SessionBoundary({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<string | null | undefined>(undefined);
  const privateRoute = ['/mypage', '/diary', '/bookmarks'].some(
    route => pathname === route || pathname?.startsWith(`${route}/`));
  useEffect(() => {
    const sync = () => setSession(getAccountId());
    sync();
    window.addEventListener('auth-change', sync);
    window.addEventListener('storage', sync);
    window.addEventListener('focus', sync);
    const timer = window.setInterval(sync, 1000);
    return () => {
      window.removeEventListener('auth-change', sync);
      window.removeEventListener('storage', sync);
      window.removeEventListener('focus', sync);
      window.clearInterval(timer);
    };
  }, []);
  useEffect(() => {
    if (privateRoute && session === null) router.replace('/login');
  }, [privateRoute, session, router]);
  if (privateRoute && !session) {
    return <div className="p-12 text-center">로그인 상태 확인 중...</div>;
  }
  // Discard in-memory private data and pending UI work on account changes.
  return <Fragment key={session || 'guest'}>{children}</Fragment>;
}
