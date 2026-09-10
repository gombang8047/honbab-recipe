import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '혼밥레시피 - 1인분 요리 연구소',
    short_name: '혼밥레시피',
    description: '쇼츠 보고 3분 만에 완성하는 1인분 자취 요리 레시피 & 일기',
    start_url: '/',
    display: 'standalone',
    background_color: '#133624',
    theme_color: '#133624',
    icons: [
      {
        src: '/icon',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
