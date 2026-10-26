// 금액·날짜 표기. 화면마다 제각각 쓰지 않도록 한곳에 모은다.

const nf = new Intl.NumberFormat('ko-KR');

/** 10206083 → "10,206,083원" */
export function won(amount: number): string {
  return `${nf.format(amount)}원`;
}

/**
 * 큰 금액을 만 원 단위로 줄인다. 1만 원 미만은 그대로.
 * 16000000 → "1,600만 원", 123450000 → "1억 2,345만 원", 2551 → "2,551원"
 */
export function manwon(amount: number): string {
  if (Math.abs(amount) < 10_000) return won(amount);
  const man = Math.round(amount / 10_000);
  const eok = Math.floor(man / 10_000);
  const rest = man % 10_000;
  if (eok > 0) return rest > 0 ? `${nf.format(eok)}억 ${nf.format(rest)}만 원` : `${nf.format(eok)}억 원`;
  return `${nf.format(man)}만 원`;
}

/** 차트 축용 짧은 표기: 14200000 → "1,420만" */
export function manShort(amount: number): string {
  return `${nf.format(Math.round(amount / 10_000))}만`;
}

/** 13.456 → "13.5%". 소수 자릿수를 고정해 표에서 자리가 맞게 한다. */
export function percent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

const thisYear = new Date().getFullYear();

/** "2026-08" → "8월" (올해) / "2025년 10월" (다른 해). withYear 로 항상 연도를 붙인다. */
export function monthLabel(yearMonth: string, withYear = false): string {
  const [y, m] = yearMonth.split('-').map(Number);
  if (withYear || y !== thisYear) return `${y}년 ${m}월`;
  return `${m}월`;
}

/** 차트 축: "2026-08" → "8월". 연도는 그래프 제목의 기간 표시로 알려 준다. */
export function monthTick(yearMonth: string): string {
  return `${Number(yearMonth.split('-')[1])}월`;
}

/** "2025-09" ~ "2026-08" → "2025년 9월부터 2026년 8월까지" */
export function monthRange(from: string, to: string): string {
  return `${monthLabel(from, true)}부터 ${monthLabel(to, true)}까지`;
}

/** "2026-11-03" → "11월 3일" */
export function dayLabel(date: string): string {
  const [, m, d] = date.split('-').map(Number);
  return `${m}월 ${d}일`;
}

/** 127 → "10년 7개월" */
export function periodLabel(months: number): string {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years === 0) return `${rest}개월`;
  return rest === 0 ? `${years}년` : `${years}년 ${rest}개월`;
}

/** 오늘 기준 남은 일수 (음수면 0) */
export function daysUntil(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  const end = new Date(y, m - 1, d, 23, 59, 59);
  return Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86_400_000));
}

/** "2026-08" 다음 달 "2026-09" */
export function nextMonthOf(yearMonth: string): string {
  const [y, m] = yearMonth.split('-').map(Number);
  const date = new Date(y, m, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/** 1,000원 단위 반올림 (시나리오 입력값용) */
export function roundThousand(amount: number): number {
  return Math.round(amount / 1_000) * 1_000;
}
