import { apiClient } from './api';
import { cartService } from './cartService';

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  userId?: number;
  nickname?: string;
  profileImageUrl?: string;
}

export const authApi = {
  /**
   * 카카오 인가 코드로 로그인 요청 (POST /api/v1/auth/kakao)
   */
  kakaoLogin: async (authorizationCode: string, redirectUri: string): Promise<TokenResponse> => {
    try {
      const res: any = await apiClient.post('/auth/kakao', { authorizationCode, redirectUri });
      const tokenData: TokenResponse = res?.data || res;

      if (tokenData?.accessToken && typeof window !== 'undefined') {
        // Do not inherit the previous account's profile when a field is absent.
        ['refreshToken', 'userNickname', 'userProfileImage'].forEach(key => localStorage.removeItem(key));
        localStorage.setItem('accessToken', tokenData.accessToken);
        if (tokenData.refreshToken) {
          localStorage.setItem('refreshToken', tokenData.refreshToken);
        }
        if (tokenData.nickname) {
          localStorage.setItem('userNickname', tokenData.nickname);
        }
        if (tokenData.profileImageUrl) {
          localStorage.setItem('userProfileImage', tokenData.profileImageUrl);
        }
        // Login remains successful even if a later cart migration needs retrying.
        await cartService.mergeGuestCart().catch(() => {
          window.alert('로그인은 완료됐지만 장바구니 동기화에 실패했습니다. 장바구니 화면에서 다시 시도해 주세요.');
        });
        window.dispatchEvent(new Event('auth-change'));
      }
      return tokenData;
    } catch (err) {
      console.error('카카오 로그인 API 호출 실패:', err);
      throw err;
    }
  },

  /**
   * 로그아웃 (DELETE /api/v1/auth/logout)
   */
  logout: async (): Promise<void> => {
    try {
      await apiClient.delete('/auth/logout');
    } catch {
      console.log('Logged out');
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userNickname');
        localStorage.removeItem('userProfileImage');
        window.dispatchEvent(new Event('auth-change'));
      }
    }
  },
};
