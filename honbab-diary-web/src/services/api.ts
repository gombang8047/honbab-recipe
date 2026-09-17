import axios from 'axios';

const PROD_API_URL = 'https://port-0-honbab-recipe-mu0tt8j1c0c836b2.sel3.cloudtype.app';

export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const isLocal =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    // 1. 로컬 개발 환경 (내 PC 브라우저): 로컬 Next.js 프록시 (/api/v1 -> localhost:8080)
    if (isLocal) {
      return '/api/v1';
    }

    // 2. 배포 환경 (클라우드타입/Vercel) 또는 하이브리드 앱 환경: 클라우드타입 배포 백엔드 직통
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (envUrl && !envUrl.includes('localhost')) {
      return envUrl.endsWith('/api/v1') ? envUrl : `${envUrl.replace(/\/$/, '')}/api/v1`;
    }
    return `${PROD_API_URL}/api/v1`;
  }

  // SSR 환경 (Next.js Node.js 서버 렌더링)
  const isDev = process.env.NODE_ENV === 'development';
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  const target = envUrl || (isDev ? 'http://localhost:8080' : PROD_API_URL);
  return target.endsWith('/api/v1') ? target : `${target.replace(/\/$/, '')}/api/v1`;
};

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token & dynamic baseURL
apiClient.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor for unified handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error.response?.data || error);
  }
);
