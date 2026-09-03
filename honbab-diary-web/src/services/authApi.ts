import { apiClient } from './api';

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
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
        localStorage.setItem('userNickname', '카카오 사용자');
        window.dispatchEvent(new Event('auth-change'));
      }
      return tokenData;
    } catch {
      // 카카오 백엔드 미연결 시 개발 테스트용 토큰
      const mockToken: TokenResponse = {
        accessToken: 'MOCK_KAKAO_JWT_' + Date.now(),
        refreshToken: 'MOCK_KAKAO_REFRESH_' + Date.now(),
        expiresIn: 3600,
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', mockToken.accessToken);
        localStorage.setItem('refreshToken', mockToken.refreshToken);
        localStorage.setItem('userNickname', '카카오 사용자');
        window.dispatchEvent(new Event('auth-change'));
      }
      return mockToken;
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
        window.dispatchEvent(new Event('auth-change'));
      }
    }
  },
};
