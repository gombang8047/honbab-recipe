import { apiClient } from './api';

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
