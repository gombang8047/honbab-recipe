import { getAccountId, requireLogin } from './authSession';
import { apiClient } from './api';
/**
 * 혼밥 요리 일기장 및 게이미피케이션(경험치, 레벨, 스트릭) 서비스
 */

export interface CookingDiaryEntry {
  id: string;
  recipeId: number;
  shortsId?: number; // 연결된 쇼츠 영상 ID (레시피 생성 전 작성 시 매칭용)
  recipeTitle: string;
  photoUrl: string; // Base64 or URL
  rating: number; // 1 ~ 5
  comment: string; // 한줄평 및 나만의 꿀팁 (공개)
  privateDiary?: string; // 나만의 비밀 일기 (선택사항, 비공개)
  userNickname: string;
  authorName?: string; // 호환용
  userLevel: number;
  userLevelTitle: string;
  createdAt: number; // timestamp
  likes: number;
  likedByMe: boolean;
  isLiked?: boolean; // 호환용
  isMyEntry: boolean;
  streakDay: number; // 작성 당시 연속 요리 일수
}

export interface LevelTier {
  level: number;
  title: string;
  minXp: number;
  maxXp: number;
  description: string;
  badgeEmoji: string;
  colorClass: string;
}

export const LEVEL_TIERS: LevelTier[] = [
  // 1~4 레벨 (기존 구간 유지)
  {
    level: 1,
    title: '배달 VIP',
    minXp: 0,
    maxXp: 99,
    description: '주방은 장식, 배달앱이 본체인 상태',
    badgeEmoji: '🛵',
    colorClass: 'text-stone-400 bg-stone-800/60 border-stone-600'
  },
  {
    level: 2,
    title: '라면 물조절 장인',
    minXp: 100,
    maxXp: 299,
    description: '물 계량 성공! 계란 탁 넣기 시작',
    badgeEmoji: '🍜',
    colorClass: 'text-amber-400 bg-amber-500/15 border-amber-500/30'
  },
  {
    level: 3,
    title: '햇반 탈출러',
    minXp: 300,
    maxXp: 599,
    description: '파기름과 굴소스의 위력을 깨달음',
    badgeEmoji: '🍳',
    colorClass: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
  },
  {
    level: 4,
    title: '냉장고 파먹기 고수',
    minXp: 600,
    maxXp: 999,
    description: '남은 자투리 재료로 1끼 뚝딱',
    badgeEmoji: '🧊',
    colorClass: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30'
  },

  // 5~20 레벨 (18레벨: 3개월 달성 구간 / 20레벨: 1년 완주 전설 구간)
  {
    level: 5,
    title: '원팬 요리 연금술사',
    minXp: 1000,
    maxXp: 1499,
    description: '팬 하나로 메인 요리와 설거지까지 계산하는 지혜',
    badgeEmoji: '🍳',
    colorClass: 'text-teal-400 bg-teal-500/15 border-teal-500/30'
  },
  {
    level: 6,
    title: '자취방 미슐랭',
    minXp: 1500,
    maxXp: 2199,
    description: '친구 초대 홈파티 파스타 가능한 수준',
    badgeEmoji: '🍝',
    colorClass: 'text-purple-400 bg-purple-500/15 border-purple-500/30'
  },
  {
    level: 7,
    title: '뚝배기 찌개 마스터',
    minXp: 2200,
    maxXp: 2999,
    description: '보글보글 된장찌개와 순두부찌개 황금 간 터득',
    badgeEmoji: '🥘',
    colorClass: 'text-rose-400 bg-rose-500/15 border-rose-500/30'
  },
  {
    level: 8,
    title: '소분 & 밀폐용기 지배자',
    minXp: 3000,
    maxXp: 3899,
    description: '대파와 양파를 썰어 냉동실에 각 잡아 정리하는 경지',
    badgeEmoji: '🍱',
    colorClass: 'text-blue-400 bg-blue-500/15 border-blue-500/30'
  },
  {
    level: 9,
    title: '간 맞추기 절대미각',
    minXp: 3900,
    maxXp: 4899,
    description: '계량스푼 없이 눈대중으로 간장과 소금을 뿌려도 완벽',
    badgeEmoji: '🧂',
    colorClass: 'text-indigo-400 bg-indigo-500/15 border-indigo-500/30'
  },
  {
    level: 10,
    title: '집밥 루틴 완성자',
    minXp: 4900,
    maxXp: 5999,
    description: '외식보다 집밥이 편해진 진정한 1달+ 자취 러너',
    badgeEmoji: '🍚',
    colorClass: 'text-green-400 bg-green-500/15 border-green-500/30'
  },
  {
    level: 11,
    title: '만능 양념장 제조기',
    minXp: 6000,
    maxXp: 7199,
    description: '고추장, 진간장, 다진마늘의 황금 비율을 몸으로 기억',
    badgeEmoji: '🥣',
    colorClass: 'text-amber-300 bg-amber-400/15 border-amber-400/30'
  },
  {
    level: 12,
    title: '식재료 알뜰 살림꾼',
    minXp: 7200,
    maxXp: 8499,
    description: '버리는 식재료 0g! 마트 세일 타임과 가성비 극대화',
    badgeEmoji: '🛒',
    colorClass: 'text-lime-400 bg-lime-500/15 border-lime-500/30'
  },
  {
    level: 13,
    title: '국물 요리의 장인',
    minXp: 8500,
    maxXp: 9899,
    description: '멸치 다시마 육수부터 깊은 사골 맛까지 국물 마스터',
    badgeEmoji: '🍲',
    colorClass: 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30'
  },
  {
    level: 14,
    title: '퓨전 혼밥 아티스트',
    minXp: 9900,
    maxXp: 11399,
    description: '남은 반찬을 고급 리조또와 퓨전 덮밥으로 재창조 (2달+)',
    badgeEmoji: '🌮',
    colorClass: 'text-orange-400 bg-orange-500/15 border-orange-500/30'
  },
  {
    level: 15,
    title: '자취방 골목식당 백대표',
    minXp: 11400,
    maxXp: 12999,
    description: '웬만한 배달 전문점보다 내 요리가 훨씬 맛있음',
    badgeEmoji: '👨‍🍳',
    colorClass: 'text-red-400 bg-red-500/15 border-red-500/30'
  },
  {
    level: 16,
    title: '식비 절약 연마사',
    minXp: 13000,
    maxXp: 14699,
    description: '한 달 식비 반토막 달성! 절약한 돈으로 적금 붓는 중',
    badgeEmoji: '💰',
    colorClass: 'text-emerald-300 bg-emerald-400/15 border-emerald-400/30'
  },
  {
    level: 17,
    title: '제철 밥상 큐레이터',
    minXp: 14700,
    maxXp: 16499,
    description: '계절마다 가장 신선하고 저렴한 제철 식재료를 식탁에',
    badgeEmoji: '🥗',
    colorClass: 'text-cyan-300 bg-cyan-400/15 border-cyan-400/30'
  },
  {
    level: 18,
    title: '자취 100단 집밥 사부',
    minXp: 16500,
    maxXp: 27999,
    description: '3개월 연속 집밥 완주! 동네 자취생들이 요리 물어보는 멘토',
    badgeEmoji: '🥋',
    colorClass: 'text-violet-400 bg-violet-500/20 border-violet-500/40'
  },
  {
    level: 19,
    title: '주방의 대마법사',
    minXp: 28000,
    maxXp: 47999,
    description: '어떤 냉장고를 열어도 15분 만에 진수성찬을 연성하는 경지',
    badgeEmoji: '🪄',
    colorClass: 'text-fuchsia-400 bg-fuchsia-500/20 border-fuchsia-500/40'
  },
  {
    level: 20,
    title: '전설의 혼밥 마스터 셰프',
    minXp: 48000,
    maxXp: 999999,
    description: '1년 365일 집밥 대기록 달성! 전설로 회자되는 자취 요리의 신화',
    badgeEmoji: '👑',
    colorClass: 'text-[#D4AF37] bg-[#D4AF37]/20 border-[#D4AF37]/50'
  }
];

export interface UserLevelInfo {
  currentXp: number;
  level: number;
  title: string;
  description: string;
  badgeEmoji: string;
  colorClass: string;
  progressPercent: number;
  nextLevelTitle: string;
  xpToNext: number;
}

export interface LoginXpResult {
  awarded: boolean;
  earnedXp: number;
  loginStreak: number;
  newTotalXp: number;
  isLevelUp: boolean;
  levelInfo: UserLevelInfo;
}


interface Snapshot {
  entries: CookingDiaryEntry[];
  totalXp: number;
  lastLoginDate: string | null;
  loginStreak: number;
  todayEarnedXp: number;
}
const empty = (): Snapshot => ({ entries: [], totalXp: 0, lastLoginDate: null, loginStreak: 0, todayEarnedXp: 0 });
let owner: string | null = null;
let snapshot = empty();
const loads = new Map<string, Promise<Snapshot>>();
export const DAILY_MAX_DIARY_XP = 400;

function cached() {
  const account = getAccountId();
  if (!account || owner !== account) { owner = account; snapshot = empty(); }
  return snapshot;
}
function account(): string {
  if (!requireLogin()) throw new Error('로그인이 필요합니다.');
  return getAccountId()!;
}
function commit(id: string, next: Snapshot): Snapshot {
  if (getAccountId() !== id) throw new Error('계정이 변경되었습니다.');
  owner = id;
  snapshot = next;
  window.dispatchEvent(new CustomEvent('diary-updated'));
  return next;
}
async function photoForUpload(photo: string): Promise<string> {
  if (!photo.startsWith('data:image/') || photo.length <= 1500000) return photo;
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('사진을 읽을 수 없습니다.'));
    img.src = photo;
  });
  const ratio = Math.min(1, 1280 / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * ratio));
  canvas.height = Math.max(1, Math.round(image.height * ratio));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('사진을 처리할 수 없습니다.');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const compressed = canvas.toDataURL('image/jpeg', 0.82);
  if (compressed.length > 3000000) throw new Error('더 작은 사진을 선택해 주세요.');
  return compressed;
}
async function inputFor(entry: {
  id: string; recipeId: number; shortsId?: number; recipeTitle: string;
  photoUrl: string; rating: number; comment: string; privateDiary?: string; createdAt: number;
}) {
  return {
    id: entry.id, recipeId: entry.recipeId || 0, shortsId: entry.shortsId || null,
    recipeTitle: entry.recipeTitle, photoUrl: await photoForUpload(entry.photoUrl),
    rating: entry.rating, comment: entry.comment, privateDiary: entry.privateDiary || null,
    createdAt: entry.createdAt,
  };
}
async function importStored(id: string) {
  const key = 'honbab_cooking_diaries:user:' + id;
  const marker = key + ':server-migrated-v2';
  if (localStorage.getItem(marker)) return;
  const raw = localStorage.getItem(key);
  if (!raw) return;
  const entries: CookingDiaryEntry[] = JSON.parse(raw);
  if (!Array.isArray(entries)) throw new Error('기존 일기 데이터를 확인해 주세요.');
  for (const entry of entries.filter(entry => !entry.id.startsWith('sample_diary_'))) {
    const input = await inputFor(entry);
    if (getAccountId() !== id) throw new Error('계정이 변경되었습니다.');
    const res: any = await apiClient.post('/diaries/import', [input]);
    commit(id, res.data);
  }
  // Backups are not deleted. Server-side client IDs make a retry safe.
  if (getAccountId() === id) localStorage.setItem(marker, 'true');
}
async function refresh(): Promise<Snapshot> {
  const id = getAccountId();
  if (!id) return cached();
  const existing = loads.get(id);
  if (existing) return existing;
  const task = (async () => {
    await importStored(id);
    if (getAccountId() !== id) throw new Error('계정이 변경되었습니다.');
    const res: any = await apiClient.get('/diaries');
    return commit(id, res.data);
  })();
  loads.set(id, task);
  try { return await task; } finally { if (loads.get(id) === task) loads.delete(id); }
}
const getDiaries = () => {
  const current = cached();
  const level = getUserLevelInfo(current.totalXp);
  return current.entries.map(entry => ({ ...entry, userLevel: level.level, userLevelTitle: level.title }));
};
const getMyDiaries = getDiaries;
const getUserXp = () => cached().totalXp;
const getTodayEarnedDiaryXp = () => cached().todayEarnedXp;
const getUserLevelInfo = (customXp?: number): UserLevelInfo => {
  const xp = customXp !== undefined ? customXp : getUserXp();
  let currentTier = LEVEL_TIERS[0];

  for (let i = LEVEL_TIERS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_TIERS[i].minXp) {
      currentTier = LEVEL_TIERS[i];
      break;
    }
  }

  const nextTier = LEVEL_TIERS.find((t) => t.level === currentTier.level + 1) || null;
  let progressPercent = 100;
  let xpToNext = 0;

  if (nextTier) {
    const range = nextTier.minXp - currentTier.minXp;
    const currentProgress = xp - currentTier.minXp;
    progressPercent = Math.min(100, Math.max(0, Math.round((currentProgress / range) * 100)));
    xpToNext = nextTier.minXp - xp;
  }

  return {
    currentXp: xp,
    level: currentTier.level,
    title: currentTier.title,
    description: currentTier.description,
    badgeEmoji: currentTier.badgeEmoji,
    colorClass: currentTier.colorClass,
    progressPercent,
    nextLevelTitle: nextTier ? nextTier.title : '최고 레벨 달성!',
    xpToNext
  };
};


const getStreakDays = (): number => {
  const dates = new Set(getMyDiaries().map(entry => {
    const date = new Date(entry.createdAt);
    return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(date);
  }));
  const today = new Date();
  let date = new Date(today);
  const key = (value: Date) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(value);
  if (!dates.has(key(date))) date.setDate(date.getDate() - 1);
  let streak = 0;
  while (dates.has(key(date))) { streak++; date.setDate(date.getDate() - 1); }
  return streak;
};
const getDiariesByRecipe = (recipeId: number, shortsId?: number) => getDiaries().filter(entry =>
  (recipeId > 0 && entry.recipeId === recipeId) ||
  (!!shortsId && (entry.shortsId === shortsId || (!entry.shortsId && entry.recipeId === shortsId))));

async function addDiaryEntry(params: {
  id?: string; recipeId: number; shortsId?: number; recipeTitle: string; photoUrl: string;
  rating: number; comment: string; privateDiary?: string;
}) {
  const id = account();
  await refresh();
  const before = getUserLevelInfo();
  const input = await inputFor({ ...params, id: params.id || 'diary_' + crypto.randomUUID(), createdAt: Date.now() });
  if (getAccountId() !== id) throw new Error('계정이 변경되었습니다.');
  const res: any = await apiClient.post('/diaries', input);
  const result = res.data;
  commit(id, result.snapshot);
  const entry = getDiaries().find(entry => entry.id === result.entryId);
  if (!entry) throw new Error('저장된 일기를 확인할 수 없습니다.');
  const levelInfo = getUserLevelInfo();
  return {
    entry, earnedXp: result.earnedXp, rawEarnedXp: result.rawEarnedXp,
    streakBonus: result.streakBonus, newTotalXp: getUserXp(),
    isLevelUp: levelInfo.level > before.level, levelInfo,
    todayEarnedXp: getTodayEarnedDiaryXp(),
    isDailyLimitReached: getTodayEarnedDiaryXp() >= DAILY_MAX_DIARY_XP,
  };
}
async function toggleLike(diaryId: string) {
  const id = account();
  const entry = getDiaries().find(entry => entry.id === diaryId);
  if (!entry) throw new Error('일기를 찾을 수 없습니다.');
  const res: any = await apiClient.put('/diaries/' + encodeURIComponent(diaryId) + '/like', { liked: !entry.isLiked });
  commit(id, res.data);
  return getDiaries();
}
async function deleteDiary(diaryId: string) {
  const id = account();
  const res: any = await apiClient.delete('/diaries/' + encodeURIComponent(diaryId));
  commit(id, res.data);
  return getDiaries();
}
async function syncRecipeIdForDiaries(shortsId: number, recipeId: number) {
  const id = getAccountId();
  if (!id) return;
  const res: any = await apiClient.post('/diaries/sync-recipe', { shortsId, recipeId });
  commit(id, res.data);
}
async function checkAndAwardLoginXp(): Promise<LoginXpResult> {
  const id = getAccountId();
  if (!id) return { awarded: false, earnedXp: 0, loginStreak: 0, newTotalXp: 0, isLevelUp: false, levelInfo: getUserLevelInfo(0) };
  await refresh();
  const before = getUserLevelInfo();
  if (getAccountId() !== id) throw new Error('계정이 변경되었습니다.');
  const res: any = await apiClient.post('/diaries/login-xp');
  commit(id, res.data.snapshot);
  const levelInfo = getUserLevelInfo();
  return {
    awarded: res.data.awarded, earnedXp: res.data.earnedXp, loginStreak: cached().loginStreak,
    newTotalXp: getUserXp(), isLevelUp: levelInfo.level > before.level, levelInfo,
  };
}
const getLoginAttendanceInfo = () => ({
  hasClaimedToday: cached().lastLoginDate === new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date()),
  streakDays: cached().loginStreak,
  lastDate: cached().lastLoginDate,
});

export const diaryService = {
  getLegacyEntries: (): CookingDiaryEntry[] => {
    const raw = localStorage.getItem('honbab_cooking_diaries');
    const entries = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(entries)) throw new Error('기존 일기 데이터를 확인해 주세요.');
    return entries.filter(entry => !entry.id.startsWith('sample_diary_') &&
      !localStorage.getItem('honbab_legacy_diary_claim:' + entry.id));
  },
  importLegacyEntries: async (ids: string[]): Promise<void> => {
    const id = account();
    for (const entry of diaryService.getLegacyEntries().filter(entry => ids.includes(entry.id))) {
      const input = await inputFor(entry);
      if (getAccountId() !== id) throw new Error('계정이 변경되었습니다.');
      const res: any = await apiClient.post('/diaries/import', [input]);
      commit(id, res.data);
      localStorage.setItem('honbab_legacy_diary_claim:' + entry.id, id);
    }
  },
  refresh, getDiaries, getDiariesByRecipe, getMyDiaries, getUserXp, getUserLevelInfo,
  getStreakDays, addDiaryEntry, toggleLike, deleteDiary, checkAndAwardLoginXp,
  getLoginAttendanceInfo, getTodayEarnedDiaryXp, syncRecipeIdForDiaries,
};


