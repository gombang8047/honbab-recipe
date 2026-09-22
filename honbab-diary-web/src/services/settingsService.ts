// src/services/settingsService.ts

export interface AppSettings {
  // 알림 설정
  notifications: {
    browserPushEnabled: boolean;
    timerBackgroundAlert: boolean;
    dailyMealAlert: boolean;
    dealAndSaleAlert: boolean;
    lateNightSnackAlert: boolean;
  };
  // 사운드 설정 (전체 효과음 및 볼륨)
  sound: {
    masterEnabled: boolean;
    volume: number; // 0 ~ 100
    buttonClickSound: boolean;
    timerTickingSound: boolean;
  };
  // 사용자 기피/알레르기 식재료
  dietary: {
    dislikedIngredients: string[];
    allergies: string[];
  };
}

const DEFAULT_SETTINGS: AppSettings = {
  notifications: {
    browserPushEnabled: true,
    timerBackgroundAlert: true,
    dailyMealAlert: true,
    dealAndSaleAlert: false,
    lateNightSnackAlert: false,
  },
  sound: {
    masterEnabled: true,
    volume: 75,
    buttonClickSound: false,
    timerTickingSound: false,
  },
  dietary: {
    dislikedIngredients: ['오이', '당근'],
    allergies: ['갑각류'],
  },
};

const SETTINGS_STORAGE_KEY = 'honbab_app_settings';

export const settingsService = {
  getSettings: (): AppSettings => {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          notifications: { ...DEFAULT_SETTINGS.notifications, ...parsed.notifications },
          sound: { ...DEFAULT_SETTINGS.sound, ...parsed.sound },
          dietary: { ...DEFAULT_SETTINGS.dietary, ...parsed.dietary },
        };
      }
    } catch (e) {
      console.error('설정 불러오기 실패:', e);
    }
    return DEFAULT_SETTINGS;
  },

  updateSettings: (newSettings: Partial<AppSettings>): AppSettings => {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    const current = settingsService.getSettings();
    const updated: AppSettings = {
      notifications: { ...current.notifications, ...(newSettings.notifications || {}) },
      sound: { ...current.sound, ...(newSettings.sound || {}) },
      dietary: { ...current.dietary, ...(newSettings.dietary || {}) },
    };
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('honbab-settings-changed', { detail: updated }));
    } catch (e) {
      console.error('설정 저장 실패:', e);
    }
    return updated;
  },

  // 브라우저 푸시 권한 요청
  requestPushPermission: async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (e) {
      console.error('푸시 권한 요청 오류:', e);
      return false;
    }
  },

  // 브라우저 알림 발송 유틸
  sendNotification: (title: string, options?: NotificationOptions) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...options,
        });
      } catch (e) {
        console.error('알림 발송 실패:', e);
      }
    }
  },
};
