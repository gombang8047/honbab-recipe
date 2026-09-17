/**
 * 쿠팡 / 컬리 모바일 앱 딥링크 & 유니버설 링크 유틸리티
 */

export type OpenPreference = 'app' | 'web';

export const deepLinkService = {
  PREF_KEY_PREFIX: 'honbab_open_pref_',

  getPreference(platform: 'coupang' | 'kurly'): OpenPreference | null {
    if (typeof window === 'undefined') return null;
    try {
      const val = localStorage.getItem(this.PREF_KEY_PREFIX + platform);
      if (val === 'app' || val === 'web') return val;
      return null;
    } catch {
      return null;
    }
  },

  setPreference(platform: 'coupang' | 'kurly', pref: OpenPreference) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.PREF_KEY_PREFIX + platform, pref);
    } catch (e) {
      console.warn('Failed to save open preference:', e);
    }
  },

  clearPreference(platform?: 'coupang' | 'kurly') {
    if (typeof window === 'undefined') return;
    try {
      if (platform) {
        localStorage.removeItem(this.PREF_KEY_PREFIX + platform);
      } else {
        localStorage.removeItem(this.PREF_KEY_PREFIX + 'coupang');
        localStorage.removeItem(this.PREF_KEY_PREFIX + 'kurly');
      }
    } catch (e) {
      console.warn('Failed to clear open preference:', e);
    }
  },

  openAppDirect(platform: 'coupang' | 'kurly', ingredientName: string, webUrl: string) {
    if (typeof window === 'undefined') return;
    const encoded = encodeURIComponent(ingredientName);
    const userAgent = navigator.userAgent || '';
    const isAndroid = /Android/i.test(userAgent);

    if (isAndroid) {
      if (platform === 'coupang') {
        window.location.href = `intent://search?q=${encoded}#Intent;scheme=coupang;package=com.coupang.mobile;S.browser_fallback_url=${encodeURIComponent(webUrl)};end`;
      } else {
        window.location.href = `intent://search?sword=${encoded}#Intent;scheme=marketkurly;package=com.dMonster.marketkurly;S.browser_fallback_url=${encodeURIComponent(webUrl)};end`;
      }
    } else {
      // iOS / etc
      const scheme =
        platform === 'coupang'
          ? `coupang://search?q=${encoded}`
          : `marketkurly://search?sword=${encoded}`;
      window.location.href = scheme;
    }
  },

  openWebDirect(webUrl: string) {
    if (typeof window === 'undefined') return;
    const a = document.createElement('a');
    a.href = webUrl;
    a.target = '_blank';
    a.rel = 'noreferrer noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },

  openPlatform(
    platform: 'coupang' | 'kurly',
    ingredientName: string,
    fallbackWebUrl: string
  ) {
    if (typeof window === 'undefined') return;

    const userAgent = navigator.userAgent || '';
    const isAndroid = /Android/i.test(userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
    const isMobile = isAndroid || isIOS;

    // 1. PC 및 데스크톱 환경: 새 탭에서 웹사이트 열기 (Referer 제거하여 쿠팡 차단 방지)
    if (!isMobile) {
      this.openWebDirect(fallbackWebUrl);
      return;
    }

    const pref = this.getPreference(platform);
    if (pref === 'app') {
      this.openAppDirect(platform, ingredientName, fallbackWebUrl);
      return;
    }
    if (pref === 'web') {
      this.openWebDirect(fallbackWebUrl);
      return;
    }

    // 설정된 선호도가 없으면 기본 앱 스킴 / 인텐트 시도
    this.openAppDirect(platform, ingredientName, fallbackWebUrl);
  },
};

