/** 가게 간판 색. 업종으로 정하고, 한 번 정한 색은 화면이 바뀌어도 그대로다. */
export interface SignColors {
  bg: string;
  fg: string;
  edge: string;
}

const PALETTE: { match: string; colors: SignColors }[] = [
  { match: '국밥', colors: { bg: '#7A2E1F', fg: '#FFF1DD', edge: '#A2513E' } },
  { match: '버거', colors: { bg: '#E3A21A', fg: '#2B1C04', edge: '#F2C35E' } },
  { match: '쌀국수', colors: { bg: '#2F6B4F', fg: '#F1FAF4', edge: '#4F8C6E' } },
  { match: '분식', colors: { bg: '#E0572B', fg: '#FFF6EF', edge: '#F08A63' } },
];

const FALLBACK: SignColors = { bg: '#007A99', fg: '#FFFFFF', edge: '#3399B3' };

export function signColors(category: string): SignColors {
  return PALETTE.find((entry) => category.includes(entry.match))?.colors ?? FALLBACK;
}
