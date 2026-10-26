import type { Holding, OfferingStatus, OfferingSummary, Region } from './types';
import { availableCash, cashBalance, piecesOf, type MarketStore } from './market';

/*
 * 내 자산 계산. 백엔드의 투자·지급 기록과 모의 시장의 거래·가격을 합친다.
 *  - 원금: 공모로 넣은 돈 + 조각을 산 돈 − 판 조각의 평균 원금
 *  - 평가금액: 지급 중 가게는 조각 수 × 지금 가격, 모집 중 가게는 넣은 돈 그대로
 *  - 투자 손익: 평가금액 + 받은 돈 − 원금 (매출 지급까지 포함한 수익)
 */

export interface PositionView {
  offeringId: number;
  name: string;
  imageKey: string;
  city: string;
  region: Region;
  category: string;
  status: OfferingStatus;
  statusLabel: string;
  pieces: number;
  cost: number;
  value: number;
  received: number;
  profit: number;
  profitPercent: number;
  /** 오늘 가격 변동으로 늘거나 준 평가금액 */
  dayChange: number;
  lastPrice: number | null;
  perk: string | null;
  holding: Holding | null;
}

export interface AccountView {
  positions: PositionView[];
  /** 지급 중 가게 조각의 평가금액 */
  piecesValue: number;
  /** 모집 중 공모에 넣은 돈 */
  subscriptionValue: number;
  cash: number;
  available: number;
  total: number;
  cost: number;
  received: number;
  profit: number;
  profitPercent: number;
  dayChange: number;
  dayChangePercent: number;
}

export function accountOf(store: MarketStore): AccountView {
  const listingById = new Map<number, OfferingSummary>(store.listings.map((listing) => [listing.id, listing]));
  const ids = new Set<number>([
    ...store.holdings.map((holding) => holding.offeringId),
    ...Object.values(store.markets)
      .filter((market) => market.pieceDelta !== 0 || market.costDelta !== 0)
      .map((market) => market.offeringId),
  ]);

  const positions: PositionView[] = [];
  for (const id of ids) {
    const holding = store.holdings.find((candidate) => candidate.offeringId === id) ?? null;
    const listing = listingById.get(id);
    const market = store.markets[id];
    const status = (listing?.status ?? holding?.status ?? 'ACTIVE') as OfferingStatus;
    const pieces = piecesOf(store, id);
    const cost = (holding?.invested ?? 0) + (market?.costDelta ?? 0);
    const tradable = status === 'ACTIVE' && market !== undefined;
    const value = tradable ? pieces * market.lastPrice : holding?.invested ?? 0;
    const received = holding?.received ?? 0;
    if (pieces === 0 && value === 0 && received === 0) continue;
    const profit = value + received - cost;
    positions.push({
      offeringId: id,
      name: listing?.storeName ?? holding?.storeName ?? '',
      imageKey: listing?.imageKey ?? holding?.imageKey ?? '',
      city: listing?.city ?? holding?.city ?? '',
      region: (listing?.region ?? holding?.region ?? 'POHANG') as Region,
      category: listing?.category ?? holding?.category ?? '',
      status,
      statusLabel: listing?.statusLabel ?? holding?.statusLabel ?? '',
      pieces,
      cost,
      value,
      received,
      profit,
      profitPercent: cost > 0 ? (profit / cost) * 100 : 0,
      dayChange: tradable ? pieces * (market.lastPrice - market.prevClose) : 0,
      lastPrice: tradable ? market.lastPrice : null,
      perk: listing?.investorPerk ?? holding?.investorPerk ?? null,
      holding,
    });
  }

  const piecesValue = positions.filter((position) => position.lastPrice !== null).reduce((sum, position) => sum + position.value, 0);
  const subscriptionValue = positions.filter((position) => position.lastPrice === null).reduce((sum, position) => sum + position.value, 0);
  const cash = cashBalance(store);
  const cost = positions.reduce((sum, position) => sum + position.cost, 0);
  const received = store.received;
  const profit = piecesValue + subscriptionValue + received - cost;
  const dayChange = positions.reduce((sum, position) => sum + position.dayChange, 0);
  const yesterdayValue = piecesValue - dayChange;
  return {
    positions,
    piecesValue,
    subscriptionValue,
    cash,
    available: availableCash(store),
    total: piecesValue + subscriptionValue + cash,
    cost,
    received,
    profit,
    profitPercent: cost > 0 ? (profit / cost) * 100 : 0,
    dayChange,
    dayChangePercent: yesterdayValue > 0 ? (dayChange / yesterdayValue) * 100 : 0,
  };
}

/** 가장 최근 지급 달의 받은 돈 합계 */
export function latestPayout(store: MarketStore): { month: string | null; amount: number } {
  if (store.payouts.length === 0) return { month: null, amount: 0 };
  const month = store.payouts.reduce((latest, payout) => (payout.month > latest ? payout.month : latest), store.payouts[0].month);
  return { month, amount: store.payouts.filter((payout) => payout.month === month).reduce((sum, payout) => sum + payout.amount, 0) };
}

/** 월별 받은 돈 (오래된 달부터, 최근 n개월) */
export function monthlyPayouts(store: MarketStore, months = 6): { month: string; amount: number }[] {
  const byMonth = new Map<string, number>();
  for (const payout of store.payouts) byMonth.set(payout.month, (byMonth.get(payout.month) ?? 0) + payout.amount);
  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-months)
    .map(([month, amount]) => ({ month, amount }));
}
