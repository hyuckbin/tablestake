/*
 * 시연용 가게별 연출 값. (백엔드에 없는, 화면을 살리기 위한 가짜 값)
 * - 시장: 거래가 얼마나 활발한지, 시장이 쓰는 할인율, 최근 분위기
 * - 소식: 가게가 올린 소식 (실제 서비스라면 사장님 앱·운영팀이 올린다)
 * 사진은 public/photos/{imageKey}.jpg 이다. 실제 가게 사진을 같은 이름으로 넣으면 바로 바뀐다.
 */

export type NewsTag = '정산' | '검증' | '매출' | '가게' | '메뉴' | '공모';
export type Tone = 'up' | 'down' | 'neutral';

export interface StoreNews {
  /** 며칠 전 소식인지 */
  daysAgo: number;
  tag: NewsTag;
  title: string;
  tone: Tone;
}

export interface StoreProfile {
  /** 0~1. 높을수록 거래가 잦고 거래대금이 크다 */
  popularity: number;
  /** 시장이 남은 지급을 할인하는 연 이율. 인기 가게일수록 낮아 가격이 높다 */
  discountRate: number;
  /** 최근 30일 동안의 분위기 (가격에 서서히 반영) */
  drift: number;
  /** 오늘 하루 움직임 (시연에서 상승·하락이 고르게 보이도록) */
  today: number;
  /** 한 줄 소개 */
  tagline: string;
  news: StoreNews[];
}

const FALLBACK: StoreProfile = {
  popularity: 0.4,
  discountRate: 0.08,
  drift: 0,
  today: 0,
  tagline: '',
  news: [],
};

const PROFILES: Record<string, StoreProfile> = {
  burger: {
    popularity: 0.62,
    discountRate: 0.092,
    drift: 0.006,
    today: 0.004,
    tagline: '중앙상가 골목 5년 차 수제버거',
    news: [
      { daysAgo: 2, tag: '가게', title: '키오스크를 들인 뒤 점심 회전율이 1.4회전에서 1.8회전으로 늘었어요', tone: 'up' },
      { daysAgo: 13, tag: '메뉴', title: '포항 한우 패티 버거를 새로 내놨어요', tone: 'neutral' },
    ],
  },
  mulhoe: {
    popularity: 0.55,
    discountRate: 0.09,
    drift: -0.012,
    today: -0.009,
    tagline: '죽도시장 17년 물회 한 그릇',
    news: [
      { daysAgo: 3, tag: '매출', title: '여름 성수기가 끝나 매출이 계절대로 줄고 있어요', tone: 'down' },
      { daysAgo: 21, tag: '가게', title: '2층 좌석 공사를 마쳐 24석이 40석이 됐어요', tone: 'up' },
    ],
  },
  brunch: {
    popularity: 0.42,
    discountRate: 0.094,
    drift: 0.008,
    today: 0.003,
    tagline: '영일대 바다가 보이는 2층 브런치',
    news: [
      { daysAgo: 4, tag: '가게', title: '바다 쪽 테라스를 열었어요', tone: 'up' },
      { daysAgo: 16, tag: '메뉴', title: '영일만 문어 브런치 플레이트를 출시했어요', tone: 'neutral' },
    ],
  },
  bagel: {
    popularity: 0.86,
    discountRate: 0.085,
    drift: 0.016,
    today: 0.016,
    tagline: '문 열기 전부터 줄 서는 성수동 베이글',
    news: [{ daysAgo: 8, tag: '가게', title: '성수 2호점 데크 오븐 설치를 마쳤어요', tone: 'up' }],
  },
  sushi: {
    popularity: 1,
    discountRate: 0.082,
    drift: 0.012,
    today: 0.022,
    tagline: '시부야 10석 카운터 오마카세',
    news: [
      { daysAgo: 0, tag: '가게', title: '겨울 한정 코스 예약이 3분 만에 마감됐어요', tone: 'up' },
      { daysAgo: 6, tag: '매출', title: '한국인 손님 비중이 30%를 넘었어요', tone: 'up' },
    ],
  },
  padthai: {
    popularity: 0.6,
    discountRate: 0.11,
    drift: -0.03,
    today: -0.032,
    tagline: '방콕 실롬 야시장에서 시작한 팟타이',
    news: [{ daysAgo: 9, tag: '가게', title: '야시장 푸드트럭 2호차를 들였어요', tone: 'neutral' }],
  },
  bistro: {
    popularity: 0.66,
    discountRate: 0.09,
    drift: 0.01,
    today: 0.007,
    tagline: '파리 마레 지구의 저녁 비스트로',
    news: [{ daysAgo: 5, tag: '메뉴', title: '가을 와인 페어링 코스를 시작했어요', tone: 'neutral' }],
  },
  gukbap: {
    popularity: 0.5,
    discountRate: 0.08,
    drift: 0,
    today: 0,
    tagline: '육거리 골목 새벽 돼지국밥',
    news: [{ daysAgo: 6, tag: '가게', title: '새 육수 솥 견적을 받았어요. 모집이 끝나면 바로 바꿔요', tone: 'neutral' }],
  },
  pho: {
    popularity: 0.4,
    discountRate: 0.08,
    drift: 0,
    today: 0,
    tagline: '베트남 사장님이 직접 끓이는 육수',
    news: [{ daysAgo: 5, tag: '가게', title: '양덕 2호점 자리를 계약했어요', tone: 'up' }],
  },
  hanok: {
    popularity: 0.4,
    discountRate: 0.08,
    drift: 0,
    today: 0,
    tagline: '황리단길 한옥에서 마시는 차 한 잔',
    news: [{ daysAgo: 3, tag: '가게', title: '2호점으로 쓸 한옥 실측을 마쳤어요', tone: 'neutral' }],
  },
};

export function profileOf(imageKey: string): StoreProfile {
  return PROFILES[imageKey] ?? FALLBACK;
}

const PHOTO_KEYS = new Set(['burger', 'gukbap', 'pho', 'mulhoe', 'brunch', 'bagel', 'sushi', 'padthai', 'bistro', 'hanok']);

export function photoOf(imageKey: string | null | undefined): string {
  return `/photos/${imageKey && PHOTO_KEYS.has(imageKey) ? imageKey : 'default'}.jpg`;
}

/** 도시 표시용 영문 코드 (시안의 TOKYO · JPY 칩) */
const CITY_CODES: Record<string, string> = {
  포항: 'POHANG',
  서울: 'SEOUL',
  경주: 'GYEONGJU',
  도쿄: 'TOKYO',
  방콕: 'BANGKOK',
  파리: 'PARIS',
};

export function cityCode(city: string): string {
  return CITY_CODES[city] ?? city;
}
