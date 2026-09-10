/**
 * 혼밥 요리 일기장 및 게이미피케이션(경험치, 레벨, 스트릭) 서비스
 */

export interface CookingDiaryEntry {
  id: string;
  recipeId: number;
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

const DIARY_STORAGE_KEY = 'honbab_cooking_diaries';
const USER_XP_KEY = 'honbab_user_xp';
const LAST_LOGIN_DATE_KEY = 'honbab_last_login_xp_date';
const LOGIN_STREAK_KEY = 'honbab_login_streak';

// 다른 자취생들이 실제로 작성한 듯한 풍성한 초기 커뮤니티 샘플 일기
const INITIAL_COMMUNITY_DIARIES: CookingDiaryEntry[] = [
  {
    id: 'sample_diary_1',
    recipeId: 1,
    recipeTitle: '🍳 5분컷 초간단 계란볶음밥',
    photoUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&q=80',
    rating: 5,
    comment: '파기름 낼 때 대파 넉넉하게 볶고 굴소스 1큰술 넣으니 중국집 볶음밥보다 훨씬 맛있어요! 설거지도 팬 하나로 끝났습니다.',
    userNickname: '신촌자취러',
    authorName: '신촌자취러',
    userLevel: 3,
    userLevelTitle: '햇반 탈출러',
    createdAt: Date.now() - 1000 * 60 * 60 * 3, // 3시간 전
    likes: 14,
    likedByMe: false,
    isLiked: false,
    isMyEntry: false,
    streakDay: 4
  },
  {
    id: 'sample_diary_2',
    recipeId: 1,
    recipeTitle: '🍳 5분컷 초간단 계란볶음밥',
    photoUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&q=80',
    rating: 5,
    comment: '냉장고에 남아있던 스팸 얇게 깍둑썰기해서 같이 볶아줬더니 단짠단짠 대박입니다. 자취생 필수 필살기 레시피 인정!',
    userNickname: '퇴근후요리왕',
    authorName: '퇴근후요리왕',
    userLevel: 4,
    userLevelTitle: '냉장고 파먹기 고수',
    createdAt: Date.now() - 1000 * 60 * 60 * 18, // 18시간 전
    likes: 27,
    likedByMe: true,
    isLiked: true,
    isMyEntry: false,
    streakDay: 6
  },
  {
    id: 'sample_diary_3',
    recipeId: 2,
    recipeTitle: '🍝 원팬 마늘 오일 파스타',
    photoUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281541?w=600&q=80',
    rating: 4,
    comment: '면수 버리지 않고 자작하게 끓여내니까 전분기 때문에 소스가 면에 싹 감겨요. 마늘 편 썰어서 노릇하게 익히는 게 핵심!',
    userNickname: '자취미식가',
    authorName: '자취미식가',
    userLevel: 2,
    userLevelTitle: '라면 물조절 장인',
    createdAt: Date.now() - 1000 * 60 * 60 * 28,
    likes: 9,
    likedByMe: false,
    isLiked: false,
    isMyEntry: false,
    streakDay: 2
  }
];

/**
 * 저장된 전체 요리 일기 목록 조회 (로컬 + 기본 커뮤니티 샘플)
 */
const getDiaries = (): CookingDiaryEntry[] => {
  if (typeof window === 'undefined') return INITIAL_COMMUNITY_DIARIES;
  try {
    const saved = localStorage.getItem(DIARY_STORAGE_KEY);
    if (!saved) {
      localStorage.setItem(DIARY_STORAGE_KEY, JSON.stringify(INITIAL_COMMUNITY_DIARIES));
      return INITIAL_COMMUNITY_DIARIES;
    }
    return JSON.parse(saved);
  } catch {
    return INITIAL_COMMUNITY_DIARIES;
  }
};

/**
 * 특정 레시피에 해당하는 일기 목록 (최신순)
 */
const getDiariesByRecipe = (recipeId: number): CookingDiaryEntry[] => {
  const list = getDiaries();
  return list
    .filter((d) => d.recipeId === recipeId)
    .sort((a, b) => b.createdAt - a.createdAt);
};

/**
 * 내가 직접 작성한 일기 목록 (마이페이지 갤러리용)
 */
const getMyDiaries = (): CookingDiaryEntry[] => {
  const list = getDiaries();
  return list
    .filter((d) => d.isMyEntry)
    .sort((a, b) => b.createdAt - a.createdAt);
};

/**
 * 사용자의 현재 누적 경험치 조회
 */
const getUserXp = (): number => {
  if (typeof window === 'undefined') return 350;
  const val = localStorage.getItem(USER_XP_KEY);
  if (!val) {
    localStorage.setItem(USER_XP_KEY, '350');
    return 350;
  }
  return Number(val) || 0;
};

/**
 * 현재 경험치를 바탕으로 레벨 및 진행률 정보 계산
 */
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

/**
 * 연속 작성 일수(스트릭 🔥) 계산
 */
const getStreakDays = (): number => {
  const myDiaries = getMyDiaries();
  if (myDiaries.length === 0) return 1;

  const dates: string[] = myDiaries.map((d) => {
    const date = new Date(d.createdAt);
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  });

  const uniqueDates: string[] = Array.from(new Set(dates)).sort().reverse();
  if (uniqueDates.length === 0) return 1;

  let streak = 1;
  let curr = new Date(uniqueDates[0]);

  for (let i = 1; i < uniqueDates.length; i++) {
    const prev = new Date(uniqueDates[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      streak++;
      curr = prev;
    } else {
      break;
    }
  }

  return Math.max(1, streak);
};

/**
 * 새 요리 일기 등록 (사진 + 한줄평 필수)
 */
const addDiaryEntry = (params: {
  recipeId: number;
  recipeTitle: string;
  photoUrl: string;
  rating: number;
  comment: string;
  privateDiary?: string;
}): {
  entry: CookingDiaryEntry;
  earnedXp: number;
  streakBonus: number;
  newTotalXp: number;
  isLevelUp: boolean;
  levelInfo: UserLevelInfo;
} => {
  const prevXp = getUserXp();
  const prevLevelInfo = getUserLevelInfo(prevXp);
  const currentStreak = getStreakDays();

  // 1. 경험치 산정: 기본 100 XP + 스트릭 보너스
  const baseEarnedXp = 100;
  let streakBonus = 0;
  if (currentStreak >= 7) streakBonus = 200;
  else if (currentStreak >= 3) streakBonus = 60;
  else if (currentStreak >= 2) streakBonus = 30;

  const totalEarnedXp = baseEarnedXp + streakBonus;
  const newTotalXp = prevXp + totalEarnedXp;

  // 2. 일기 엔트리 객체 생성
  const userNickname = (typeof window !== 'undefined' && localStorage.getItem('userNickname')) || '자취 미식가';
  const newEntry: CookingDiaryEntry = {
    id: `diary_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    recipeId: params.recipeId,
    recipeTitle: params.recipeTitle,
    photoUrl: params.photoUrl,
    rating: params.rating,
    comment: params.comment.trim(),
    privateDiary: params.privateDiary?.trim() || undefined,
    userNickname,
    authorName: userNickname,
    userLevel: prevLevelInfo.level,
    userLevelTitle: prevLevelInfo.title,
    createdAt: Date.now(),
    likes: 1, // 본인 자동 좋아요 1개
    likedByMe: true,
    isLiked: true,
    isMyEntry: true,
    streakDay: currentStreak + 1
  };

  // 3. 로컬 스토리지 저장
  const currentList = getDiaries();
  const updatedList = [newEntry, ...currentList];
  if (typeof window !== 'undefined') {
    localStorage.setItem(DIARY_STORAGE_KEY, JSON.stringify(updatedList));
    localStorage.setItem(USER_XP_KEY, newTotalXp.toString());
    // 전역 이벤트 발행
    window.dispatchEvent(new CustomEvent('diary-added', { detail: newEntry }));
  }

  const newLevelInfo = getUserLevelInfo(newTotalXp);
  const isLevelUp = newLevelInfo.level > prevLevelInfo.level;

  return {
    entry: newEntry,
    earnedXp: totalEarnedXp,
    streakBonus,
    newTotalXp,
    isLevelUp,
    levelInfo: newLevelInfo
  };
};

/**
 * '맛있어 보여요 😋' 좋아요 토글
 */
const toggleLike = (diaryId: string): CookingDiaryEntry[] => {
  const list = getDiaries();
  const updated = list.map((d) => {
    if (d.id === diaryId) {
      const nextLiked = !d.likedByMe;
      return {
        ...d,
        likedByMe: nextLiked,
        isLiked: nextLiked,
        likes: nextLiked ? d.likes + 1 : Math.max(0, d.likes - 1)
      };
    }
    return d;
  });

  if (typeof window !== 'undefined') {
    localStorage.setItem(DIARY_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('diary-updated'));
  }
  return updated;
};

/**
 * 일기 삭제 (내 일기만 가능)
 */
const deleteDiary = (diaryId: string): CookingDiaryEntry[] => {
  const list = getDiaries();
  const updated = list.filter((d) => d.id !== diaryId);
  if (typeof window !== 'undefined') {
    localStorage.setItem(DIARY_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('diary-updated'));
  }
  return updated;
};

/**
 * 당일 첫 방문/접속 시 백그라운드에서 조용히 접속 경험치(+15 XP 및 연속 방문 보너스) 자동 부여
 * (별도 팝업/알림 없이 사용자가 눈치채지 못하게 이미 레벨/경험치에 자연스럽게 반영되어 있도록 처리)
 */
const checkAndAwardLoginXp = (): LoginXpResult => {
  const currentXp = getUserXp();
  const currentLevelInfo = getUserLevelInfo(currentXp);

  if (typeof window === 'undefined') {
    return {
      awarded: false,
      earnedXp: 0,
      loginStreak: 1,
      newTotalXp: currentXp,
      isLevelUp: false,
      levelInfo: currentLevelInfo,
    };
  }

  const todayObj = new Date();
  const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;
  const lastLoginDate = localStorage.getItem(LAST_LOGIN_DATE_KEY);
  const storedStreak = Number(localStorage.getItem(LOGIN_STREAK_KEY)) || 1;

  // 오늘 이미 접속 경험치가 지급되었으면 통과
  if (lastLoginDate === todayStr) {
    return {
      awarded: false,
      earnedXp: 0,
      loginStreak: storedStreak,
      newTotalXp: currentXp,
      isLevelUp: false,
      levelInfo: currentLevelInfo,
    };
  }

  // 연속 출석 일수 계산
  let newStreak = 1;
  if (lastLoginDate) {
    const lastParts = lastLoginDate.split('-').map(Number);
    if (lastParts.length === 3) {
      const lastUtc = Date.UTC(lastParts[0], lastParts[1] - 1, lastParts[2]);
      const todayUtc = Date.UTC(todayObj.getFullYear(), todayObj.getMonth(), todayObj.getDate());
      const diffDays = Math.round((todayUtc - lastUtc) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // 어제 접속한 경우 연속 일수 +1
        newStreak = storedStreak + 1;
      } else if (diffDays > 1) {
        // 하루 이상 건너뛴 경우 1일차로 리셋
        newStreak = 1;
      }
    }
  }

  // 접속 경험치 산정: 기본 15 XP + 연속 출석 소량 보너스
  const baseLoginXp = 15;
  let streakBonus = 0;
  if (newStreak >= 7) streakBonus = 10;
  else if (newStreak >= 3) streakBonus = 5;

  const totalEarnedXp = baseLoginXp + streakBonus;
  const newTotalXp = currentXp + totalEarnedXp;
  const prevLevelInfo = currentLevelInfo;
  const newLevelInfo = getUserLevelInfo(newTotalXp);
  const isLevelUp = newLevelInfo.level > prevLevelInfo.level;

  // 조용히 로컬 스토리지 갱신
  localStorage.setItem(USER_XP_KEY, newTotalXp.toString());
  localStorage.setItem(LAST_LOGIN_DATE_KEY, todayStr);
  localStorage.setItem(LOGIN_STREAK_KEY, newStreak.toString());
  localStorage.setItem('honbab_user_level', `Lv.${newLevelInfo.level}`);

  // 전역 상태 갱신 이벤트 트리거 (알림 없이 수치만 자동 반영)
  window.dispatchEvent(new CustomEvent('diary-updated'));
  window.dispatchEvent(new Event('auth-change'));

  return {
    awarded: true,
    earnedXp: totalEarnedXp,
    loginStreak: newStreak,
    newTotalXp,
    isLevelUp,
    levelInfo: newLevelInfo,
  };
};

/**
 * 일일 출석 및 접속 현황 정보 조회
 */
const getLoginAttendanceInfo = () => {
  if (typeof window === 'undefined') {
    return { hasClaimedToday: true, streakDays: 1, lastDate: null };
  }
  const todayObj = new Date();
  const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;
  const lastLoginDate = localStorage.getItem(LAST_LOGIN_DATE_KEY);
  const streakDays = Number(localStorage.getItem(LOGIN_STREAK_KEY)) || 1;

  return {
    hasClaimedToday: lastLoginDate === todayStr,
    streakDays,
    lastDate: lastLoginDate,
  };
};

export const diaryService = {
  getDiaries,
  getDiariesByRecipe,
  getMyDiaries,
  getUserXp,
  getUserLevelInfo,
  getStreakDays,
  addDiaryEntry,
  toggleLike,
  deleteDiary,
  checkAndAwardLoginXp,
  getLoginAttendanceInfo,
};
