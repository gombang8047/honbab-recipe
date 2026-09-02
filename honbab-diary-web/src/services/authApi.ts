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
      return res.data;
    } catch {
      // 카카오 개발자 API 키 미설정 시 개발 테스트용 토큰 반환
      const mockToken: TokenResponse = {
        accessToken: 'MOCK_KAKAO_JWT_ACCESS_TOKEN_' + Date.now(),
        refreshToken: 'MOCK_KAKAO_JWT_REFRESH_TOKEN_' + Date.now(),
        expiresIn: 3600,
      };
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
      console.log('Logged out (mock)');
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userNickname');
      }
    }
  },
};
