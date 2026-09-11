import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.honbab.diary',
  appName: '혼밥일기',
  webDir: 'out',
  backgroundColor: '#1B4731',
  server: {
    androidScheme: 'https',
    // 💡 [개발 팁] PC에서 실행 중인 dev 서버(http://192.168.x.x:3000)를 스마트폰에서
    // 실시간으로 핫리로딩 테스트하고 싶으실 경우 아래 두 줄의 주석을 해제하시면 됩니다:
    // url: 'http://192.168.0.100:3000',
    // cleartext: true,
  },
  plugins: {
    // 향후 푸시 알림, 햅틱 진동, 카메라 등의 플러그인 추가 옵션 구성
  },
};

export default config;
