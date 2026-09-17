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
  기름: {
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
    valuePkg: '찌개용 돼지고기 300g (100g당 ~1,900원)',
    lowestPkg: '앞다리살 600g 팩 (100g당 ~1,500원)',
    rocketPkg: '로켓 한돈 찌개용'
  },
  소고기: {
    unitLabel: '100g당',
    unitCoupang: 3800,
    unitKurly: 4600,
    pkgCoupang: '소고기 400g 팩 기준',
    pkgKurly: '소고기 200g 팩 기준',
    valuePkg: '소고기 200g 팩 (100g당 ~4,600원)',
    lowestPkg: '소고기 400g 팩 (100g당 ~3,800원)',
    rocketPkg: '로켓 소고기'
  },
  닭가슴살: {
    unitLabel: '100g당',
    unitCoupang: 1200,
    unitKurly: 1500,
    pkgCoupang: '닭가슴살 1kg 팩 기준',
    pkgKurly: '닭가슴살 300g 팩 기준',
    valuePkg: '냉장 닭가슴살 300g',
    lowestPkg: '닭가슴살 1kg 대용량',
    rocketPkg: '로켓 신선 닭가슴살'
  },
  닭고기: {
    unitLabel: '100g당',
    unitCoupang: 1200,
    unitKurly: 1500,
    pkgCoupang: '닭정육 500g 팩 기준',
    pkgKurly: '닭다리살 300g 기준',
    valuePkg: '닭안심/다리살 300g',
    lowestPkg: '닭정육 1kg 팩',
    rocketPkg: '로켓 닭다리살'
  },
  베이컨: {
    unitLabel: '100g당',
    unitCoupang: 1800,
    unitKurly: 2300,
    pkgCoupang: '베이컨 500g 팩 기준',
    pkgKurly: '베이컨 150g 팩 기준',
    valuePkg: '베이컨 150g 단품',
    lowestPkg: '베이컨 500g 대용량',
    rocketPkg: '로켓 프리미엄 베이컨'
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
    valuePkg: '맛김치 파우치 400g (100g당 ~850원)',
    lowestPkg: '맛김치 1kg 이상 묶음 (100g당 ~650원)',
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
  },
  파스타: {
    unitLabel: '100g당',
    unitCoupang: 500,
    unitKurly: 700,
    pkgCoupang: '스파게티면 1kg 기준',
    pkgKurly: '유기농 파스타면 500g 기준',
    valuePkg: '스파게티면 500g',
    lowestPkg: '파스타면 1kg 대용량',
    rocketPkg: '로켓 이탈리아 파스타'
  },
  스파게티: {
    unitLabel: '100g당',
    unitCoupang: 500,
    unitKurly: 700,
    pkgCoupang: '스파게티면 1kg 기준',
    pkgKurly: '유기농 파스타면 500g 기준',
    valuePkg: '스파게티면 500g',
    lowestPkg: '파스타면 1kg 대용량',
    rocketPkg: '로켓 이탈리아 파스타'
  },
  라면: {
    unitLabel: '1봉당',
    unitCoupang: 850,
    unitKurly: 1050,
    pkgCoupang: '라면 5개입 멀티팩 기준',
    pkgKurly: '라면 번들 기준',
    valuePkg: '라면 1팩 (5개입)',
    lowestPkg: '라면 20개입 박스',
    rocketPkg: '로켓 라면'
  },
  치즈: {
    unitLabel: '100g당',
    unitCoupang: 1400,
    unitKurly: 1800,
    pkgCoupang: '피자치즈 1kg 기준',
    pkgKurly: '모짜렐라치즈 300g 기준',
    valuePkg: '체다 슬라이스 치즈',
    lowestPkg: '모짜렐라 피자치즈 1kg',
    rocketPkg: '로켓 자연치즈'
  },
  버터: {
    unitLabel: '1큰술당',
    unitCoupang: 350,
    unitKurly: 450,
    pkgCoupang: '가염/무염 버터 450g 기준',
    pkgKurly: '소포장 버터 기준',
    valuePkg: '포션 버터 10개입',
    lowestPkg: '대용량 버터 450g',
    rocketPkg: '로켓 서울우유 버터'
  },
  우유: {
    unitLabel: '100ml당',
    unitCoupang: 300,
    unitKurly: 380,
    pkgCoupang: '1L 2팩 묶음 기준',
    pkgKurly: '국산 1등급 우유 900ml 기준',
    valuePkg: '신선우유 900ml',
    lowestPkg: '우유 1L x 2입',
    rocketPkg: '로켓 프레시 우유'
  },
  양배추: {
    unitLabel: '1/4통당',
    unitCoupang: 800,
    unitKurly: 1100,
    pkgCoupang: '양배추 1통 기준',
    pkgKurly: '손질 양배추 1/4통 기준',
    valuePkg: '손질 양배추 1/4통',
    lowestPkg: '양배추 1통 (1/4당 ~800원)',
    rocketPkg: '로켓 컷팅 양배추'
  },
  콩나물: {
    unitLabel: '1봉당',
    unitCoupang: 1000,
    unitKurly: 1300,
    pkgCoupang: '국산 콩나물 300g 기준',
    pkgKurly: '무농약 콩나물 200g 기준',
    valuePkg: '무농약 콩나물 200g',
    lowestPkg: '콩나물 500g 대용량',
    rocketPkg: '로켓 신선 콩나물'
  },
  소시지: {
    unitLabel: '100g당',
    unitCoupang: 1200,
    unitKurly: 1600,
    pkgCoupang: '비엔나 500g 팩 기준',
    pkgKurly: '후랑크 소시지 기준',
    valuePkg: '비엔나 소시지 200g',
    lowestPkg: '비엔나 대용량 1kg',
    rocketPkg: '로켓 육즙가득 소시지'
  },
  어묵: {
    unitLabel: '100g당',
    unitCoupang: 750,
    unitKurly: 950,
    pkgCoupang: '사각어묵 500g 묶음 기준',
    pkgKurly: '어묵 200g 팩 기준',
    valuePkg: '부산어묵 200g',
    lowestPkg: '사각어묵 1kg',
    rocketPkg: '로켓 부산어묵'
  },
  고춧가루: {
    unitLabel: '1큰술당',
    unitCoupang: 250,
    unitKurly: 320,
    pkgCoupang: '국산 고춧가루 500g 기준',
    pkgKurly: '고춧가루 200g 기준',
    valuePkg: '국산 고춧가루 200g',
    lowestPkg: '고춧가루 1kg',
    rocketPkg: '로켓 태양초 고춧가루'
  },
  설탕: {
    unitLabel: '1큰술당',
    unitCoupang: 50,
    unitKurly: 70,
    pkgCoupang: '백설탕 1kg 기준',
    pkgKurly: '유기농 설탕 기준',
    valuePkg: '갈색설탕 1kg',
    lowestPkg: '백설탕 3kg',
    rocketPkg: '로켓 백설탕'
  },
  소금: {
    unitLabel: '1작은술당',
    unitCoupang: 20,
    unitKurly: 30,
    pkgCoupang: '꽃소금 1kg 기준',
    pkgKurly: '천일염 500g 기준',
    valuePkg: '구운소금 200g',
    lowestPkg: '꽃소금 1kg',
    rocketPkg: '로켓 꽃소금'
  },
  후추: {
    unitLabel: '1작은술당',
    unitCoupang: 40,
    unitKurly: 60,
    pkgCoupang: '순후추 100g 캔 기준',
    pkgKurly: '통후추 그라인더 기준',
    valuePkg: '오뚜기 순후추 50g',
    lowestPkg: '순후추 100g 대용량',
    rocketPkg: '로켓 순후추'
  },
  식초: {
    unitLabel: '1큰술당',
    unitCoupang: 50,
    unitKurly: 70,
    pkgCoupang: '양조식초 900ml 기준',
    pkgKurly: '사과식초 500ml 기준',
    valuePkg: '사과식초 500ml',
    lowestPkg: '양조식초 1.8L',
    rocketPkg: '로켓 양조식초'
  },
  마요네즈: {
    unitLabel: '1큰술당',
    unitCoupang: 110,
    unitKurly: 140,
    pkgCoupang: '고소한 마요네즈 500g 기준',
    pkgKurly: '하프 마요네즈 기준',
    valuePkg: '골드 마요네즈 300g',
    lowestPkg: '마요네즈 1kg',
    rocketPkg: '로켓 오뚜기 마요네즈'
  },
  케첩: {
    unitLabel: '1큰술당',
    unitCoupang: 90,
    unitKurly: 120,
    pkgCoupang: '토마토 케첩 500g 기준',
    pkgKurly: '하인즈 케첩 기준',
    valuePkg: '토마토 케첩 300g',
    lowestPkg: '케첩 1kg',
    rocketPkg: '로켓 토마토 케첩'
  },
  맛술: {
    unitLabel: '1큰술당',
    unitCoupang: 70,
    unitKurly: 90,
    pkgCoupang: '미림 900ml 기준',
    pkgKurly: '맛술 500ml 기준',
    valuePkg: '요리맛술 500ml',
    lowestPkg: '미림 1.8L',
    rocketPkg: '로켓 미림'
  },
  미림: {
    unitLabel: '1큰술당',
    unitCoupang: 70,
    unitKurly: 90,
    pkgCoupang: '미림 900ml 기준',
    pkgKurly: '맛술 500ml 기준',
    valuePkg: '요리맛술 500ml',
    lowestPkg: '미림 1.8L',
    rocketPkg: '로켓 미림'
  },
  올리고당: {
    unitLabel: '1큰술당',
    unitCoupang: 80,
    unitKurly: 110,
    pkgCoupang: '프락토 올리고당 700g 기준',
    pkgKurly: '요리올리고당 기준',
    valuePkg: '올리고당 700g',
    lowestPkg: '올리고당 1.2kg',
    rocketPkg: '로켓 올리고당'
  },
  물엿: {
    unitLabel: '1큰술당',
    unitCoupang: 70,
    unitKurly: 90,
    pkgCoupang: '물엿 1kg 기준',
    pkgKurly: '조청/물엿 700g 기준',
    valuePkg: '물엿 700g',
    lowestPkg: '물엿 1.2kg',
    rocketPkg: '로켓 물엿'
  },
  청양고추: {
    unitLabel: '1개당',
    unitCoupang: 200,
    unitKurly: 250,
    pkgCoupang: '청양고추 1봉(약 10개입) 기준',
    pkgKurly: '무농약 청양고추 소용량 기준',
    valuePkg: '청양고추 1봉',
    lowestPkg: '청양고추 500g 팩',
    rocketPkg: '로켓 신선 청양고추'
  },
  고추: {
    unitLabel: '1개당',
    unitCoupang: 200,
    unitKurly: 250,
    pkgCoupang: '풋고추/청양고추 1봉 기준',
    pkgKurly: '고추 소용량 기준',
    valuePkg: '고추 1봉',
    lowestPkg: '고추 대용량 팩',
    rocketPkg: '로켓 신선 고추'
  },
  애호박: {
    unitLabel: '1/2개당',
    unitCoupang: 700,
    unitKurly: 950,
    pkgCoupang: '인큐 애호박 1개 기준',
    pkgKurly: '친환경 애호박 1개 기준',
    valuePkg: '인큐 애호박 1개',
    lowestPkg: '애호박 2개 묶음',
    rocketPkg: '로켓 신선 애호박'
  }
};

/**
 * 분수 문자열("1/2", "1", "2") 및 한글 수사를 숫자로 파싱
 */
export function parseAmountToNumber(amountStr?: string): number {
  if (!amountStr) return 1;
  const s = amountStr.trim();

  if (s === '반' || s === '반개' || s === '반스푼' || s === '반큰술') return 0.5;
  if (s === '한' || s === '하나' || s === '한개' || s === '한스푼') return 1;
  if (s === '두' || s === '둘' || s === '두개' || s === '두스푼') return 2;
  if (s === '세' || s === '셋' || s === '세개') return 3;
  if (s === '네' || s === '넷' || s === '네개') return 4;
  if (['약간', '조금', '적당량', '취향껏', '톡톡', '약간의'].includes(s)) return 0.3;

  const match = s.match(/^([0-9\.\/\s]+)/);
  const numPart = match ? match[1].trim() : s;

  if (numPart.includes('/')) {
    const [num, den] = numPart.split('/');
    const n = parseFloat(num);
    const d = parseFloat(den);
    if (!isNaN(n) && !isNaN(d) && d !== 0) return n / d;
  }
  const val = parseFloat(numPart);
  return isNaN(val) ? 1 : val;
}

/**
 * 재료 용량 및 단위 추출 및 정규화
 */
export function parseRecipeAmountAndUnit(rawAmount?: string, rawUnit?: string): {
  amountNum: number;
  unit: string;
} {
  let unit = (rawUnit || '').trim().toLowerCase();
  const amountStr = (rawAmount || '').trim();

  let amountNum = parseAmountToNumber(amountStr);
  const unitMatch = amountStr.match(/[0-9\.\/\s]+([a-zA-Z가-힣]+)$/);
  if (unitMatch && !unit) {
    unit = unitMatch[1].toLowerCase();
  }

  // 단위 정규화
  if (['g', 'gram', 'g.', '그램', 'gr'].includes(unit)) unit = 'g';
  else if (['kg', 'kilo', '킬로', '킬로그램'].includes(unit)) unit = 'kg';
  else if (['근'].includes(unit)) unit = '근';
  else if (['ml', 'cc', '밀리', '밀리리터'].includes(unit)) unit = 'ml';
  else if (['l', 'liter', '리터'].includes(unit)) unit = 'l';
  else if (['큰술', '스푼', '밥숟가락', '밥스푼', 'tbs', 'tbsp', 't'].includes(unit)) unit = '큰술';
  else if (['작은술', '티스푼', 'tsp', 'ts'].includes(unit)) unit = '작은술';
  else if (['컵', '종이컵', 'cup'].includes(unit)) unit = '컵';

  return { amountNum, unit };
}

/**
 * 단위 레이블(100g당, 1큰술당 등)과 레시피 소요량 간의 정확한 배수 계산
 */
function calculateRecipeMultiplier(amountNum: number, unit: string, unitLabel: string, cleanName: string): number {
  // 1. 기준이 '100g당'인 경우 (고기류, 김치 등)
  if (unitLabel.includes('100g')) {
    if (unit === 'g') {
      return Math.max(0.1, amountNum / 100);
    }
    if (unit === 'kg') {
      return Math.max(0.1, (amountNum * 1000) / 100);
    }
    if (unit === '근') {
      return Math.max(0.1, (amountNum * 600) / 100);
    }
    if (unit === '줄') {
      return Math.max(0.5, amountNum * 1.0);
    }
    if (unit === '장') {
      return Math.max(0.2, amountNum * 0.3);
    }
    if (unit === '인분') {
      return Math.max(1.0, amountNum * 1.5);
    }
    if (unit === '줌') {
      return Math.max(0.5, amountNum * 1.0);
    }
    if (unit === '컵') {
      return Math.max(0.5, amountNum * 1.4);
    }
    // 단위가 생략된 경우 (자취 레시피에서 20 이상의 수치는 100% 그램)
    if (amountNum >= 20) {
      return Math.max(0.1, amountNum / 100);
    }
    return Math.max(0.5, amountNum * 1.2);
  }

  // 2. 기준이 '1큰술당'인 경우 (양념, 장류, 소스)
  if (unitLabel.includes('1큰술') || unitLabel.includes('1스푼')) {
    if (unit === '큰술' || unit === '스푼') {
      return Math.max(0.2, amountNum);
    }
    if (unit === '작은술') {
      return Math.max(0.1, amountNum / 3);
    }
    if (unit === 'ml' || unit === 'cc') {
      return Math.max(0.2, amountNum / 15);
    }
    if (unit === 'l') {
      return Math.max(0.5, (amountNum * 1000) / 15);
    }
    if (unit === '컵') {
      return Math.max(1, amountNum * 12);
    }
    if (unit === 'g') {
      return Math.max(0.2, amountNum / 15);
    }
    if (amountNum > 5) {
      return Math.max(0.2, amountNum / 15);
    }
    return Math.max(0.2, amountNum);
  }

  // 3. 기준이 '100ml당'인 경우 (우유 등)
  if (unitLabel.includes('100ml')) {
    if (unit === 'ml' || unit === 'cc') {
      return Math.max(0.1, amountNum / 100);
    }
    if (unit === 'l') {
      return Math.max(0.5, (amountNum * 1000) / 100);
    }
    if (unit === '컵') {
      return Math.max(0.5, (amountNum * 180) / 100);
    }
    if (unit === '큰술') {
      return Math.max(0.1, (amountNum * 15) / 100);
    }
    if (amountNum >= 20) {
      return Math.max(0.1, amountNum / 100);
    }
    return Math.max(0.5, amountNum * 1.5);
  }

  // 4. 기준이 개수(1개당, 1대당, 1알당, 1모당, 1캔당, 1공기당, 1봉당)인 경우
  if (unit === 'g') {
    if (cleanName.includes('두부')) return Math.max(0.1, amountNum / 300);
    if (cleanName.includes('밥') || cleanName.includes('햇반')) return Math.max(0.2, amountNum / 210);
    if (cleanName.includes('양파')) return Math.max(0.2, amountNum / 200);
    if (cleanName.includes('감자')) return Math.max(0.2, amountNum / 150);
    if (cleanName.includes('당근')) return Math.max(0.2, amountNum / 150);
    if (cleanName.includes('스팸')) return Math.max(0.2, amountNum / 200);
    if (cleanName.includes('참치')) return Math.max(0.2, amountNum / 100);
    if (amountNum >= 30) return Math.max(0.2, amountNum / 150);
  }

  if (unit === '쪽' && cleanName.includes('마늘')) {
    return Math.max(0.2, amountNum * 0.33);
  }

  return Math.max(0.1, amountNum);
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
  const parsed = parseRecipeAmountAndUnit(amount, unit);

  // DB 매칭 확인 (포함 검색)
  const matchedKey = Object.keys(INGREDIENT_UNIT_DB).find(
    (k) => cleanName.includes(k) || k.includes(cleanName)
  );

  // 단위 기반 지능형 fallback 생성 (미등록 재료)
  let fallbackUnitLabel = '1개당';
  let fallbackCoupang = 1200;
  let fallbackKurly = 1500;
  let fallbackDescCoupang = '묶음 구매 시 개당 환산';
  let fallbackDescKurly = '소포장 구매 시 개당 환산';

  if (parsed.unit === 'g' || parsed.unit === 'kg') {
    fallbackUnitLabel = '100g당';
    fallbackCoupang = 1200;
    fallbackKurly = 1500;
    fallbackDescCoupang = '100g당 환산 최저가';
    fallbackDescKurly = '소포장 100g당 환산가';
  } else if (parsed.unit === 'ml' || parsed.unit === 'cc' || parsed.unit === 'l') {
    fallbackUnitLabel = '100ml당';
    fallbackCoupang = 800;
    fallbackKurly = 1000;
    fallbackDescCoupang = '100ml당 환산 최저가';
    fallbackDescKurly = '소포장 100ml당 환산가';
  } else if (parsed.unit === '큰술' || parsed.unit === '스푼') {
    fallbackUnitLabel = '1큰술당';
    fallbackCoupang = 150;
    fallbackKurly = 200;
    fallbackDescCoupang = '1큰술당 환산가';
    fallbackDescKurly = '소용량 1큰술당 환산가';
  } else if (parsed.unit === '작은술') {
    fallbackUnitLabel = '1작은술당';
    fallbackCoupang = 50;
    fallbackKurly = 70;
    fallbackDescCoupang = '1작은술당 환산가';
    fallbackDescKurly = '소용량 1작은술당 환산가';
  } else if (unit) {
    fallbackUnitLabel = `1${unit}당`;
  }

  const fallback: UnitPriceItem = {
    unitLabel: fallbackUnitLabel,
    unitCoupang: fallbackCoupang,
    unitKurly: fallbackKurly,
    pkgCoupang: fallbackDescCoupang,
    pkgKurly: fallbackDescKurly,
    valuePkg: `${cleanName} 1인 소포장`,
    lowestPkg: `${cleanName} 대용량 묶음`,
    rocketPkg: `로켓프레시 ${cleanName}`
  };

  const db = matchedKey ? INGREDIENT_UNIT_DB[matchedKey] : fallback;

  // 재료명 그대로 순수 검색 (정상 사용자 검색 채널 파라미터 적용)
  const makeCoupangUrl = (q: string) =>
    `https://www.coupang.com/np/search?component=&q=${encodeURIComponent(q)}&channel=user`;
  const makeKurlyUrl = (q: string) =>
    `https://www.kurly.com/search?sword=${encodeURIComponent(q)}`;

  const coupangSearchUrl = makeCoupangUrl(cleanName);
  const kurlySearchUrl = makeKurlyUrl(cleanName);

  // 레시피 소요 배수 계산 (단위 불일치 완벽 보정)
  const multiplier = calculateRecipeMultiplier(parsed.amountNum, parsed.unit, db.unitLabel, cleanName);

  // 1인분 1끼 소요액 계산 (안전 상한선 25,000원으로 15만원 등 버그 원천 차단)
  const recipeCoupangCost = Math.min(25000, Math.max(50, Math.round(db.unitCoupang * multiplier)));
  const recipeKurlyCost = Math.min(25000, Math.max(50, Math.round(db.unitKurly * multiplier)));

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
