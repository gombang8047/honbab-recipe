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

export interface PaginatedShorts {
  items: ShortsItem[];
  hasMore: boolean;
  totalElements: number;
  page: number;
}

// Sync bookmarked status from localStorage
function syncWithLocalBookmarks(items: ShortsItem[]): ShortsItem[] {
  if (typeof window === 'undefined') return items;
  try {
    const localSaved = localStorage.getItem('honbab_local_bookmarks');
    if (!localSaved) return items;
    const list: ShortsItem[] = JSON.parse(localSaved);
    const bookmarkedIds = new Set(list.map((s) => s.id));
    return items.map((item) => ({
      ...item,
      bookmarked: bookmarkedIds.has(item.id),
    }));
  } catch {
    return items;
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
          items: syncWithLocalBookmarks(data.content),
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
          items: syncWithLocalBookmarks(data.content),
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
          items: syncWithLocalBookmarks(data.content),
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
          items: syncWithLocalBookmarks(shuffled),
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
          items: syncWithLocalBookmarks(data.content),
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
        const synced = syncWithLocalBookmarks([res.data])[0];
        return { ...res.data, bookmarked: synced.bookmarked };
      }
      throw new Error('쇼츠 정보를 불러올 수 없습니다.');
    } catch (e) {
      throw e;
    }
  },

  getBookmarks: async (page = 0, size = 20): Promise<ShortsItem[]> => {
    try {
      const res: any = await apiClient.get(`/shorts/bookmarks?page=${page}&size=${size}`);
      const content = res.data?.content;
      if (Array.isArray(content) && content.length > 0) {
        return content.map((item: any) => ({ ...item, bookmarked: true }));
      }
    } catch {
      // Backend may not have endpoint or user is offline
    }

    // Fallback: LocalStorage Bookmarks
    if (typeof window !== 'undefined') {
      const localSaved = localStorage.getItem('honbab_local_bookmarks');
      if (localSaved) {
        try {
          const list: ShortsItem[] = JSON.parse(localSaved);
          if (Array.isArray(list)) {
            return list;
          }
        } catch {}
      }
    }

    return [];
  },

  toggleBookmark: async (id: number, currentStatus: boolean, item?: ShortsItem): Promise<boolean> => {
    try {
      if (currentStatus) {
        await apiClient.delete(`/shorts/${id}/bookmark`);
      } else {
        await apiClient.post(`/shorts/${id}/bookmark`);
      }
    } catch {
      // Proceed even if backend is offline
    }

    // Sync to local bookmarks
    if (typeof window !== 'undefined') {
      try {
        const localSaved = localStorage.getItem('honbab_local_bookmarks');
        let currentList: ShortsItem[] = localSaved ? JSON.parse(localSaved) : [];
        if (currentStatus) {
          // Remove
          currentList = currentList.filter((s) => s.id !== id);
        } else {
          // Add
          if (item) {
            if (!currentList.some((s) => s.id === id)) {
              currentList.unshift({ ...item, bookmarked: true });
            }
          }
        }
        localStorage.setItem('honbab_local_bookmarks', JSON.stringify(currentList));
        window.dispatchEvent(new CustomEvent('bookmark-changed', { detail: { id, bookmarked: !currentStatus } }));
      } catch {}
    }

    return !currentStatus;
  }
};
