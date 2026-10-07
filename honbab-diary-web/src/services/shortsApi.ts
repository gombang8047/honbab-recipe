import { apiClient } from './api';
import { getAccountId, requireLogin } from './authSession';

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

export interface PaginatedShorts {
  items: ShortsItem[];
  hasMore: boolean;
  totalElements: number;
  page: number;
}

// Bookmark state comes from the authenticated server, never a shared local cache.
async function syncWithLocalBookmarks(items: ShortsItem[]): Promise<ShortsItem[]> {
  if (!getAccountId()) return items.map(item => ({ ...item, bookmarked: false }));
  try {
    const saved = await shortsApi.getAllBookmarks();
    const ids = new Set(saved.map(item => item.id));
    return items.map(item => ({ ...item, bookmarked: ids.has(item.id) }));
  } catch {
    return items.map(item => ({ ...item, bookmarked: false }));
  }
}

// 무작위 페이지 중복 방문 방지 Set
const visitedRandomPages = new Set<number>();

export const shortsApi = {
  getFeedPaginated: async (page = 0, size = 8): Promise<PaginatedShorts> => {
    try {
      const res: any = await apiClient.get(`/shorts?page=${page}&size=${size}`);
      const data = res.data;
      if (data && Array.isArray(data.content)) {
        return {
          items: await syncWithLocalBookmarks(data.content),
          hasMore: !data.last,
          totalElements: data.totalElements,
          page: data.number ?? page,
        };
      }
      return {
        items: [],
        hasMore: false,
        totalElements: 0,
        page: 0,
      };
    } catch {
      return {
        items: [],
        hasMore: false,
        totalElements: 0,
        page: 0,
      };
    }
  },

  getTrendingPaginated: async (page = 0, size = 8): Promise<PaginatedShorts> => {
    try {
      const res: any = await apiClient.get(`/shorts/trending?page=${page}&size=${size}`);
      const data = res.data;
      if (data && Array.isArray(data.content)) {
        return {
          items: await syncWithLocalBookmarks(data.content),
          hasMore: !data.last,
          totalElements: data.totalElements,
          page: data.number ?? page,
        };
      }
      return {
        items: [],
        hasMore: false,
        totalElements: 0,
        page: 0,
      };
    } catch {
      return {
        items: [],
        hasMore: false,
        totalElements: 0,
        page: 0,
      };
    }
  },

  getRandomPaginated: async (page = 0, size = 8, totalHint?: number): Promise<PaginatedShorts> => {
    // 1. 백엔드 /shorts/random API 우선 호출
    try {
      const res: any = await apiClient.get(`/shorts/random?page=${page}&size=${size}`);
      const data = res.data;
      if (data && Array.isArray(data.content) && data.content.length > 0) {
        return {
          items: await syncWithLocalBookmarks(data.content),
          hasMore: !data.last,
          totalElements: data.totalElements,
          page: data.number ?? page,
        };
      }
    } catch {
      // 백엔드가 아직 /shorts/random 없이 구동 중일 경우 Fallback 실행
    }

    // 2. Fallback: 전체 쇼츠(totalElements) 범위에서 무작위 페이지 선택
    try {
      let total = totalHint || 500;
      if (total <= size) {
        const countRes: any = await apiClient.get(`/shorts?page=0&size=1`);
        total = countRes?.data?.totalElements || 500;
      }

      if (page === 0) {
        visitedRandomPages.clear();
      }

      const totalPages = Math.max(1, Math.floor(total / size));
      let randomPage = Math.floor(Math.random() * totalPages);

      let attempts = 0;
      while (visitedRandomPages.has(randomPage) && attempts < 10 && visitedRandomPages.size < totalPages) {
        randomPage = Math.floor(Math.random() * totalPages);
        attempts++;
      }
      visitedRandomPages.add(randomPage);

      const res: any = await apiClient.get(`/shorts?page=${randomPage}&size=${size}`);
      const data = res.data;
      if (data && Array.isArray(data.content)) {
        const shuffled = [...data.content].sort(() => Math.random() - 0.5);
        return {
          items: await syncWithLocalBookmarks(shuffled),
          hasMore: visitedRandomPages.size < totalPages,
          totalElements: data.totalElements,
          page,
        };
      }
    } catch (e) {
      console.error('랜덤 쇼츠 조회 실패:', e);
    }

    return {
      items: [],
      hasMore: false,
      totalElements: 0,
      page: 0,
    };
  },

  searchPaginated: async (keyword: string, page = 0, size = 8): Promise<PaginatedShorts> => {
    try {
      const encoded = encodeURIComponent(keyword);
      const res: any = await apiClient.get(`/shorts/search?keyword=${encoded}&page=${page}&size=${size}`);
      const data = res.data;
      if (data && Array.isArray(data.content)) {
        return {
          items: await syncWithLocalBookmarks(data.content),
          hasMore: !data.last,
          totalElements: data.totalElements,
          page: data.number ?? page,
        };
      }
      return {
        items: [],
        hasMore: false,
        totalElements: 0,
        page: 0,
      };
    } catch {
      return {
        items: [],
        hasMore: false,
        totalElements: 0,
        page: 0,
      };
    }
  },

  getFeed: async (page = 0, size = 20): Promise<ShortsItem[]> => {
    try {
      const res: any = await apiClient.get(`/shorts?page=${page}&size=${size}`);
      const content = res.data?.content;
      if (Array.isArray(content) && content.length > 0) {
        return syncWithLocalBookmarks(content);
      }
      return [];
    } catch {
      return [];
    }
  },

  getTrending: async (): Promise<ShortsItem[]> => {
    try {
      const res: any = await apiClient.get('/shorts/trending');
      const content = res.data?.content;
      if (Array.isArray(content) && content.length > 0) {
        return syncWithLocalBookmarks(content);
      }
      return [];
    } catch {
      return [];
    }
  },

  getDetail: async (id: number): Promise<ShortsDetail> => {
    try {
      const res: any = await apiClient.get(`/shorts/${id}`);
      if (res.data && res.data.title) {
        return { ...res.data, bookmarked: getAccountId() ? res.data.bookmarked : false };
      }
      throw new Error('쇼츠 정보를 불러올 수 없습니다.');
    } catch (e) {
      throw e;
    }
  },

  getAllBookmarks: async (): Promise<ShortsItem[]> => {
    const account = getAccountId();
    if (!account) return [];
    const items: ShortsItem[] = [];
    for (let page = 0; ; page++) {
      const res: any = await apiClient.get(`/shorts/bookmarks?page=${page}&size=100`);
      if (getAccountId() !== account) return [];
      const data = res.data;
      if (!Array.isArray(data?.content)) throw new Error('잘못된 북마크 응답입니다.');
      items.push(...data.content.map((item: ShortsItem) => ({ ...item, bookmarked: true })));
      if (data.last || data.content.length === 0) return items;
    }
  },

  getBookmarks: async (page = 0, size = 20): Promise<ShortsItem[]> => {
    const account = getAccountId();
    if (!account) return [];
    const res: any = await apiClient.get(`/shorts/bookmarks?page=${page}&size=${size}`);
    if (getAccountId() !== account) return [];
    return (res.data?.content || []).map((item: ShortsItem) => ({ ...item, bookmarked: true }));
  },

  toggleBookmark: async (id: number, currentStatus: boolean, _item?: ShortsItem): Promise<boolean> => {
    if (!requireLogin()) return false;
    const account = getAccountId();
    try {
      if (currentStatus) await apiClient.delete(`/shorts/${id}/bookmark`);
      else await apiClient.post(`/shorts/${id}/bookmark`);
      if (getAccountId() !== account) return false;
      window.dispatchEvent(new CustomEvent('bookmark-changed', { detail: { id, bookmarked: !currentStatus } }));
      return !currentStatus;
    } catch {
      if (getAccountId() === account) window.alert('북마크를 저장하지 못했습니다. 다시 시도해 주세요.');
      return currentStatus;
    }
  }
};
