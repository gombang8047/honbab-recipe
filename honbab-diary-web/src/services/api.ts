import axios from 'axios';

export const getApiBaseUrl = (): string => {
  // 브라우저 환경에서는 Next.js 프록시(/api/v1)를 사용하여 CORS 및 포트 차단 이슈 방지
  if (typeof window !== 'undefined') {
    return '/api/v1';
  }
  const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  return rawUrl.endsWith('/api/v1') ? rawUrl : `${rawUrl.replace(/\/$/, '')}/api/v1`;
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
