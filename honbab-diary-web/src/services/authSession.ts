// This only controls client UI/storage. The server verifies JWT signatures.
export function getAccountId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return /^\d+$/.test(String(payload.sub)) && payload.exp * 1000 > Date.now()
      ? String(payload.sub) : null;
  } catch { return null; }
}

export function requireLogin(): boolean {
  if (getAccountId()) return true;
  if (typeof window !== 'undefined') {
    window.alert('로그인이 필요한 기능입니다.');
    window.location.assign('/login');
  }
  return false;
}
