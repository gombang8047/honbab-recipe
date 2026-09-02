import { apiClient } from './api';

export interface ShortsItem {
  id: number;
  youtubeId: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  durationSeconds: number;
  viewCount: number;
  tags: string[];
  bookmarked: boolean;
}

export interface ShortsDetail extends ShortsItem {
  videoUrl: string;
  hasRecipe: boolean;
}

// Fallback mock data when backend is starting
const MOCK_SHORTS: ShortsItem[] = [
  {
    id: 1,
    youtubeId: "mock_shorts_01",
    title: "5분컷 초간단 계란볶음밥 레시피! 자취생 필수 시청 🍳",
    channelName: "자취요리왕",
    thumbnailUrl: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&q=80",
    durationSeconds: 45,
    viewCount: 125000,
    tags: ["자취요리", "계란볶음밥", "간단요리"],
    bookmarked: false
  },
  {
    id: 2,
    youtubeId: "mock_shorts_02",
    title: "원팬으로 끝내는 삼겹살 김치볶음밥 레시피 🔥",
    channelName: "혼밥레시피",
    thumbnailUrl: "https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=600&q=80",
    durationSeconds: 58,
    viewCount: 89000,
    tags: ["김치볶음밥", "원팬요리", "삼겹살"],
    bookmarked: true
  },
  {
    id: 3,
    youtubeId: "mock_shorts_03",
    title: "전자레인지 3분 완성! 폭신폭신 계란찜 🍲",
    channelName: "초간단식당",
    thumbnailUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80",
    durationSeconds: 30,
    viewCount: 230000,
    tags: ["계란찜", "전자레인지", "초간단"],
    bookmarked: false
  },
  {
    id: 4,
    youtubeId: "mock_shorts_04",
    title: "남은 참치통조림으로 만드는 참치마요 덮밥 🍣",
    channelName: "자취생일기",
    thumbnailUrl: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80",
    durationSeconds: 50,
    viewCount: 67000,
    tags: ["참치마요", "덮밥", "1인분"],
    bookmarked: false
  }
];

export const shortsApi = {
  getFeed: async (page = 0, size = 20): Promise<ShortsItem[]> => {
    try {
      const res: any = await apiClient.get(`/shorts?page=${page}&size=${size}`);
      return res.data?.content || MOCK_SHORTS;
    } catch {
      return MOCK_SHORTS;
    }
  },

  getTrending: async (): Promise<ShortsItem[]> => {
    try {
      const res: any = await apiClient.get('/shorts/trending');
      return res.data?.content || MOCK_SHORTS;
    } catch {
      return MOCK_SHORTS;
    }
  },

  getDetail: async (id: number): Promise<ShortsDetail> => {
    try {
      const res: any = await apiClient.get(`/shorts/${id}`);
      return res.data;
    } catch {
      const item = MOCK_SHORTS.find(s => s.id === id) || MOCK_SHORTS[0];
      return { ...item, videoUrl: `https://www.youtube.com/shorts/${item.youtubeId}`, hasRecipe: true };
    }
  },

  toggleBookmark: async (id: number, currentStatus: boolean): Promise<boolean> => {
    try {
      if (currentStatus) {
        await apiClient.delete(`/shorts/${id}/bookmark`);
      } else {
        await apiClient.post(`/shorts/${id}/bookmark`);
      }
      return !currentStatus;
    } catch {
      return !currentStatus;
    }
  }
};
