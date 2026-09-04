/**
 * 재료별 개당/단위당 가격 및 스마트 쇼핑 링크 유틸리티
 */

export interface PriceTierInfo {
  tierName: 'value' | 'lowest' | 'rocket';
  title: string;
  badge: string;
  badgeColor: string;
  description: string;
  recommendedPackage: string;
  estimatedPrice: number;
  coupangSearchUrl: string;
  kurlySearchUrl: string;
}

export interface IngredientPricingResult {
  ingredientName: string;
  recipeAmount?: string;
  recipeUnit?: string;
  // 개당 / 단위당 가격 정보
  unitLabel: string; // 예: '1구당', '1대당', '1개당', '100g당', '1큰술당'
  unitCoupangPrice: number; // 쿠팡 묶음 구매 시 개당 환산가
  unitKurlyPrice: number; // 컬리 구매 시 개당 환산가
  pkgCoupangDesc: string; // 예: '30구 한판 묶음 기준'
  pkgKurlyDesc: string; // 예: '10구 묶음 기준'
  // 레시피 1인분 조리 시 소요되는 실제 식재료 원가
  recipeCoupangCost: number;
  recipeKurlyCost: number;
  // 검색 링크
  coupangUrl: string;
  kurlyUrl: string;
  // 호환용 (단위당 가격으로 매핑)
  coupangPrice: number;
  kurlyPrice: number;
  naverPrice?: number;
  naverUrl?: string;
  tiers: {
    value: PriceTierInfo;
    lowest: PriceTierInfo;
    rocket: PriceTierInfo;
  };
}

interface UnitPriceItem {
  unitLabel: string;
  unitCoupang: number;
  unitKurly: number;
  pkgCoupang: string;
  pkgKurly: string;
  valuePkg: string;
  lowestPkg: string;
  rocketPkg: string;
}

// 묶음 구매 시 개당/단위당 환산 가격 DB
const INGREDIENT_UNIT_DB: Record<string, UnitPriceItem> = {
  계란: {
    unitLabel: '1구당',
    unitCoupang: 280,
    unitKurly: 350,
    pkgCoupang: '대란 30구 묶음 기준',
    pkgKurly: '신선란 10구 묶음 기준',
    valuePkg: '무항생제 신선란 10구 (1구당 ~350원)',
    lowestPkg: '대란 30구 한판 (1구당 ~280원)',
    rocketPkg: '로켓프레시 1등급 10구'
  },
  달걀: {
    unitLabel: '1구당',
    unitCoupang: 280,
    unitKurly: 350,
    pkgCoupang: '대란 30구 묶음 기준',
    pkgKurly: '신선란 10구 묶음 기준',
    valuePkg: '무항생제 신선란 10구 (1구당 ~350원)',
    lowestPkg: '대란 30구 한판 (1구당 ~280원)',
    rocketPkg: '로켓프레시 1등급 10구'
  },
  대파: {
    unitLabel: '1대당',
    unitCoupang: 550,
    unitKurly: 650,
    pkgCoupang: '흙대파 1단(약 4대) 기준',
    pkgKurly: '손질대파(3대입) 기준',
    valuePkg: '손질 대파 1봉 (1대당 ~650원)',
    lowestPkg: '흙대파 1단 (1대당 ~550원)',
    rocketPkg: '로켓 깐대파 300g'
  },
  파: {
    unitLabel: '1대당',
    unitCoupang: 550,
    unitKurly: 650,
    pkgCoupang: '흙대파 1단 기준',
    pkgKurly: '손질대파 기준',
    valuePkg: '손질 대파 1봉 (1대당 ~650원)',
    lowestPkg: '흙대파 1단 (1대당 ~550원)',
    rocketPkg: '로켓 깐대파 300g'
  },
  양파: {
    unitLabel: '1개당',
    unitCoupang: 600,
    unitKurly: 850,
    pkgCoupang: '양파 망(5~6입) 기준',
    pkgKurly: '깐양파 2입 기준',
    valuePkg: '깐양파 2입 (1개당 ~850원)',
    lowestPkg: '양파 1.5kg 망 (1개당 ~600원)',
    rocketPkg: '로켓 신선 깐양파'
  },
  마늘: {
    unitLabel: '1큰술당',
    unitCoupang: 220,
    unitKurly: 280,
    pkgCoupang: '다진마늘 250g 팩 기준',
    pkgKurly: '국산 다진마늘 120g 기준',
    valuePkg: '국산 다진마늘 120g',
    lowestPkg: '냉동 다진마늘 대용량',
    rocketPkg: '로켓 다진마늘 250g'
  },
  다진마늘: {
    unitLabel: '1큰술당',
    unitCoupang: 220,
    unitKurly: 280,
    pkgCoupang: '다진마늘 250g 팩 기준',
    pkgKurly: '국산 다진마늘 120g 기준',
    valuePkg: '국산 다진마늘 120g',
    lowestPkg: '냉동 다진마늘 대용량',
    rocketPkg: '로켓 다진마늘 250g'
  },
  밥: {
    unitLabel: '1공기당',
    unitCoupang: 1100,
    unitKurly: 1400,
    pkgCoupang: '즉석밥 12개입 묶음 기준',
    pkgKurly: '즉석밥 3개입 기준',
    valuePkg: '즉석밥 210g 1개 (~1,400원)',
    lowestPkg: '즉석밥 12개입 번들 (1개당 ~1,100원)',
    rocketPkg: '로켓 즉석밥'
  },
  햇반: {
    unitLabel: '1공기당',
    unitCoupang: 1100,
    unitKurly: 1400,
    pkgCoupang: '햇반 12개입 묶음 기준',
    pkgKurly: '햇반 3개입 기준',
    valuePkg: '햇반 210g 1개 (~1,400원)',
    lowestPkg: '햇반 12개입 번들 (1개당 ~1,100원)',
    rocketPkg: '로켓 즉석밥'
  },
  굴소스: {
    unitLabel: '1큰술당',
    unitCoupang: 190,
    unitKurly: 230,
    pkgCoupang: '255g 병(약 17큰술) 기준',
    pkgKurly: '소용량 기준',
    valuePkg: '이금기 굴소스 255g',
    lowestPkg: '이금기 프리미엄 굴소스 510g',
    rocketPkg: '로켓 굴소스'
  },
  진간장: {
    unitLabel: '1큰술당',
    unitCoupang: 80,
    unitKurly: 100,
    pkgCoupang: '500ml 병 기준',
    pkgKurly: '500ml 병 기준',
    valuePkg: '양조간장 500ml',
    lowestPkg: '진간장 1.8L',
    rocketPkg: '로켓 진간장'
  },
  간장: {
    unitLabel: '1큰술당',
    unitCoupang: 80,
    unitKurly: 100,
    pkgCoupang: '500ml 병 기준',
    pkgKurly: '500ml 병 기준',
    valuePkg: '양조간장 500ml',
    lowestPkg: '진간장 1.8L',
    rocketPkg: '로켓 진간장'
  },
  식용유: {
    unitLabel: '1큰술당',
    unitCoupang: 90,
    unitKurly: 110,
    pkgCoupang: '500ml 병 기준',
    pkgKurly: '500ml 병 기준',
    valuePkg: '카놀라유 500ml',
    lowestPkg: '식용유 1.8L',
    rocketPkg: '로켓 식용유'
  },
  참기름: {
    unitLabel: '1큰술당',
    unitCoupang: 380,
    unitKurly: 440,
    pkgCoupang: '160ml 병 기준',
    pkgKurly: '160ml 병 기준',
    valuePkg: '참기름 160ml 미니',
    lowestPkg: '참기름 320ml',
    rocketPkg: '로켓 참기름'
  },
  고추장: {
    unitLabel: '1큰술당',
    unitCoupang: 150,
    unitKurly: 180,
    pkgCoupang: '태양초 500g 통 기준',
    pkgKurly: '고추장 500g 기준',
    valuePkg: '태양초 500g',
    lowestPkg: '찰고추장 1kg',
    rocketPkg: '로켓 고추장'
  },
  된장: {
    unitLabel: '1큰술당',
    unitCoupang: 140,
    unitKurly: 170,
    pkgCoupang: '된장 500g 기준',
    pkgKurly: '된장 500g 기준',
    valuePkg: '재래식 된장 500g',
    lowestPkg: '된장 1kg',
    rocketPkg: '로켓 된장'
  },
  두부: {
    unitLabel: '1모당',
    unitCoupang: 1400,
    unitKurly: 1800,
    pkgCoupang: '두부 2모 묶음 기준 1모당',
    pkgKurly: '국산콩 두부 1모 기준',
    valuePkg: '부침용 두부 1모',
    lowestPkg: '두부 2모 번들 (1모당 ~1,400원)',
    rocketPkg: '로켓 국산콩 두부'
  },
  삼겹살: {
    unitLabel: '100g당',
    unitCoupang: 2100,
    unitKurly: 2600,
    pkgCoupang: '삼겹살 600g 팩 기준',
    pkgKurly: '한돈 삼겹살 300g 기준',
    valuePkg: '한돈 삼겹살 1인분 (100g당 ~2,600원)',
    lowestPkg: '삼겹살 600g 팩 (100g당 ~2,100원)',
    rocketPkg: '로켓 냉장 삼겹살'
  },
  돼지고기: {
    unitLabel: '100g당',
    unitCoupang: 1500,
    unitKurly: 1900,
    pkgCoupang: '앞다리살 600g 팩 기준',
    pkgKurly: '찌개용 한돈 300g 기준',
    valuePkg: '찌개용 돼지고기 300g',
    lowestPkg: '앞다리살 600g 팩',
    rocketPkg: '로켓 한돈 찌개용'
  },
  소고기: {
    unitLabel: '100g당',
    unitCoupang: 3800,
    unitKurly: 4600,
    pkgCoupang: '소고기 400g 팩 기준',
    pkgKurly: '소고기 200g 팩 기준',
    valuePkg: '소고기 200g 팩',
    lowestPkg: '소고기 400g 팩',
    rocketPkg: '로켓 소고기'
  },
  스팸: {
    unitLabel: '1캔당',
    unitCoupang: 2400,
    unitKurly: 2900,
    pkgCoupang: '스팸 4캔 묶음 기준',
    pkgKurly: '스팸 2캔 번들 기준',
    valuePkg: '스팸 1캔 단품',
    lowestPkg: '스팸 4캔 번들 (1캔당 ~2,400원)',
    rocketPkg: '로켓 스팸'
  },
  참치: {
    unitLabel: '1캔당',
    unitCoupang: 1600,
    unitKurly: 2000,
    pkgCoupang: '참치 4캔 묶음 기준',
    pkgKurly: '참치 2캔 번들 기준',
    valuePkg: '참치캔 단품',
    lowestPkg: '참치 4캔 번들 (1캔당 ~1,600원)',
    rocketPkg: '로켓 참치'
  },
  김치: {
    unitLabel: '100g당',
    unitCoupang: 650,
    unitKurly: 850,
    pkgCoupang: '맛김치 1kg 묶음 기준',
    pkgKurly: '맛김치 400g 파우치 기준',
    valuePkg: '맛김치 파우치 400g',
    lowestPkg: '맛김치 1kg 이상 묶음',
    rocketPkg: '로켓 맛김치'
  },
  감자: {
    unitLabel: '1알당',
    unitCoupang: 550,
    unitKurly: 750,
    pkgCoupang: '감자 1kg(약 5~6알) 기준',
    pkgKurly: '손질 감자 3알 기준',
    valuePkg: '손질 감자 3알 (1알당 ~750원)',
    lowestPkg: '감자 1kg 망 (1알당 ~550원)',
    rocketPkg: '로켓 신선 감자'
  },
  당근: {
    unitLabel: '1개당',
    unitCoupang: 650,
    unitKurly: 900,
    pkgCoupang: '흙당근 1kg 묶음 기준',
    pkgKurly: '세척당근 2입 기준',
    valuePkg: '세척 당근 2입 (1개당 ~900원)',
    lowestPkg: '흙당근 1kg (1개당 ~650원)',
    rocketPkg: '로켓 세척당근'
  },
  버섯: {
    unitLabel: '1봉당',
    unitCoupang: 800,
    unitKurly: 1100,
    pkgCoupang: '팽이버섯 3봉 묶음 기준',
    pkgKurly: '팽이버섯 단품 기준',
    valuePkg: '팽이버섯 1봉',
    lowestPkg: '팽이버섯 3봉 번들 (1봉당 ~800원)',
    rocketPkg: '로켓 무농약 버섯'
  }
};

/**
 * 분수 문자열("1/2", "1", "2")을 숫자로 파싱
 */
export function parseAmountToNumber(amountStr?: string): number {
  if (!amountStr) return 1;
  const s = amountStr.trim();
  if (s.includes('/')) {
    const [num, den] = s.split('/');
    const n = parseFloat(num);
    const d = parseFloat(den);
    if (!isNaN(n) && !isNaN(d) && d !== 0) return n / d;
  }
  const val = parseFloat(s);
  return isNaN(val) ? 1 : val;
}

/**
 * 특정 재료에 대한 개당/단위당 가격 및 쿠팡/마켓컬리 검색 링크를 자동 생성합니다.
 */
export function getIngredientPricing(
  ingredientName: string,
  amount?: string,
  unit?: string
): IngredientPricingResult {
  const cleanName = ingredientName.trim().replace(/[\[\(].*?[\]\)]/g, '').trim();

  // DB 매칭 확인 (포함 검색)
  let matchedKey = Object.keys(INGREDIENT_UNIT_DB).find(k => cleanName.includes(k) || k.includes(cleanName));

  const fallback: UnitPriceItem = {
    unitLabel: unit ? `1${unit}당` : '개당',
    unitCoupang: 1200,
    unitKurly: 1500,
    pkgCoupang: '묶음 구매 시 개당 환산',
    pkgKurly: '소포장 구매 시 개당 환산',
    valuePkg: `${cleanName} 1인 소포장`,
    lowestPkg: `${cleanName} 대용량 묶음`,
    rocketPkg: `로켓프레시 ${cleanName}`
  };

  const db = matchedKey ? INGREDIENT_UNIT_DB[matchedKey] : fallback;

  // 재료명 그대로 순수 검색 (인기순/판매량순 정렬 파라미터 적용)
  const makeCoupangUrl = (q: string) => `https://www.coupang.com/np/search?component=&q=${encodeURIComponent(q)}&sorter=saleCountDesc`;
  const makeKurlyUrl = (q: string) => `https://www.kurly.com/search?sword=${encodeURIComponent(q)}`;

  const coupangSearchUrl = makeCoupangUrl(cleanName);
  const kurlySearchUrl = makeKurlyUrl(cleanName);

  // 레시피 소요 배수 계산
  const multiplier = parseAmountToNumber(amount);
  const recipeCoupangCost = Math.round(db.unitCoupang * multiplier);
  const recipeKurlyCost = Math.round(db.unitKurly * multiplier);

  return {
    ingredientName: cleanName,
    recipeAmount: amount,
    recipeUnit: unit,
    unitLabel: db.unitLabel,
    unitCoupangPrice: db.unitCoupang,
    unitKurlyPrice: db.unitKurly,
    pkgCoupangDesc: db.pkgCoupang,
    pkgKurlyDesc: db.pkgKurly,
    recipeCoupangCost,
    recipeKurlyCost,
    coupangUrl: coupangSearchUrl,
    kurlyUrl: kurlySearchUrl,
    // 호환용
    coupangPrice: db.unitCoupang,
    kurlyPrice: db.unitKurly,
    naverPrice: db.unitKurly,
    naverUrl: kurlySearchUrl,
    tiers: {
      value: {
        tierName: 'value',
        title: '인기 베스트 라인',
        badge: '🔥 인기 베스트',
        badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
        description: `${db.pkgKurly} (${db.unitLabel} ~${db.unitKurly.toLocaleString()}원)`,
        recommendedPackage: db.valuePkg,
        estimatedPrice: db.unitKurly,
        coupangSearchUrl,
        kurlySearchUrl
      },
      lowest: {
        tierName: 'lowest',
        title: '묶음 알뜰 라인',
        badge: '🏷️ 묶음 환산 최저',
        badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
        description: `${db.pkgCoupang} (${db.unitLabel} ~${db.unitCoupang.toLocaleString()}원)`,
        recommendedPackage: db.lowestPkg,
        estimatedPrice: db.unitCoupang,
        coupangSearchUrl,
        kurlySearchUrl
      },
      rocket: {
        tierName: 'rocket',
        title: '새벽도착 샛별배송 라인',
        badge: '🟣 내일 아침 도착',
        badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
        description: '오늘 밤 주문하고 내일 아침 도착',
        recommendedPackage: db.rocketPkg,
        estimatedPrice: db.unitKurly,
        coupangSearchUrl,
        kurlySearchUrl
      }
    }
  };
}
