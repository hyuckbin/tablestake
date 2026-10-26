import { useSyncExternalStore } from 'react';
import { subscribe as subscribeSync } from './sync';
import type { Holding, OfferingSummary, PayoutHistory, Portfolio } from './types';
import { profileOf, type StoreProfile } from './catalog';

/*
 * 조각 거래 시연용 모의 시장 (백엔드 미연동, 브라우저 메모리)
 *
 * 1조각 = 모집가 1만 원. 조각 하나는 투자자 상한(1만 원 × 1.274배)까지만 돈을 받는다.
 * 그래서 조각 가격의 천장은 "남은 상한 = 상한 − 지금까지 조각당 받은 돈"이다.
 * 이보다 비싸게 사면 끝까지 다 받아도 손해이므로 주문을 막는다. (투기 방지 장치)
 *
 * 가격은 "남은 지급을 할인한 값(적정가)" 주변에서 움직인다.
 *  - 지난 가격: 실제 지급 이력(정산 월, 조각당 지급액)과 매출 성장률로 적정가를 다시 계산하고 잡음을 더한다.
 *  - 지금 가격: 2.5초마다 다른 투자자의 주문이 호가에 들어오고 체결된다(시뮬레이션).
 * 실제 서비스라면 주문·체결·조각 이전은 서버의 매칭 엔진이 트랜잭션으로 처리해야 한다.
 */

export const PIECE_FACE = 10_000;
export const TICK = 10;
export const PRICE_BAND = 0.2;
export const FEE_RATE = 0.01;
export const FEE_RATE_BULK = 0.008;
export const BULK_QUANTITY = 5;
export const START_CASH = 1_000_000;
export const MAX_WAIT_DAYS = 7;

const DAY = 86_400_000;
const MONTH_DAYS = 30.44;
const TICK_MS = 2_500;
const BOOK_DEPTH = 6;
const MAX_TRADES = 30;
const MAX_INTRADAY = 400;
const MAX_NOTICES = 3;

export type Side = 'BUY' | 'SELL';

export interface Point {
  t: number;
  p: number;
}

export interface Level {
  price: number;
  quantity: number;
  /** 이 가격대에 걸린 내 주문 수량 (자기 주문과는 체결하지 않는다) */
  mine: number;
}

export interface Trade {
  id: number;
  t: number;
  price: number;
  quantity: number;
  /** 체결을 일으킨 쪽 (BUY = 누군가 팔자 호가를 사 갔다) */
  side: Side;
}

export interface MyOrder {
  id: number;
  offeringId: number;
  side: Side;
  price: number;
  quantity: number;
  remaining: number;
  createdAt: number;
}

export interface Fill {
  id: number;
  offeringId: number;
  side: Side;
  price: number;
  quantity: number;
  fee: number;
  at: number;
  /** 걸어 둔 주문이 나중에 체결됐는지 */
  fromResting: boolean;
}

export interface Notice {
  id: number;
  tone: 'buy' | 'sell' | 'info';
  title: string;
  body?: string;
}

export interface Economics {
  pieces: number;
  capPerPiece: number;
  paidPerPiece: number;
  remainingPerPiece: number;
  monthlyPerPiece: number;
  discountRate: number;
  /** 남은 지급을 시장 할인율로 할인한 값 */
  fairValue: number;
}

export interface PayoutEvent {
  t: number;
  perPiece: number;
}

export interface MarketState {
  offeringId: number;
  economics: Economics;
  /** 상장 이후 하루 한 점. 마지막 점은 지금 */
  daily: Point[];
  /** 최근 7일, 1시간 간격 */
  hourly: Point[];
  /** 최근 24시간, 10분 간격 + 실시간 체결 */
  intraday: Point[];
  payouts: PayoutEvent[];
  prevClose: number;
  lastPrice: number;
  dayHigh: number;
  dayLow: number;
  /** 살 수 있는 가장 비싼 값 = min(남은 상한, 기준가 +20%) */
  upperLimit: number;
  /** 팔 수 있는 가장 싼 값 = 기준가 −20% */
  lowerLimit: number;
  asks: Level[];
  bids: Level[];
  volume: number;
  turnover: number;
  trades: Trade[];
  /** 가격이 돌아가려는 값 (적정가에 분위기를 더한 값) */
  anchor: number;
  /** 거래로 바뀐 내 조각 수와 그만큼의 원금 */
  pieceDelta: number;
  costDelta: number;
  tickDirection: -1 | 0 | 1;
  tickAt: number;
}

interface BaseHolding {
  pieces: number;
  invested: number;
  received: number;
}

export interface MarketStore {
  /** 거래로 오간 돈과 공모 투자로 나간 돈을 반영한 예수금 (받은 돈은 received 로 따로 더한다) */
  cash: number;
  /** 백엔드 기준 누적 받은 돈. 지급은 예수금으로 들어온다고 본다 */
  received: number;
  nickname: string;
  listings: OfferingSummary[];
  holdings: Holding[];
  payouts: PayoutHistory[];
  base: Record<number, BaseHolding>;
  markets: Record<number, MarketState>;
  orders: MyOrder[];
  fills: Fill[];
  notices: Notice[];
  ready: boolean;
  /** TABLE 지수 (지급 포함 총수익 지수) 하루 단위 */
  index: Point[];
}

export interface OrderOutcome {
  side: Side;
  filled: number;
  averagePrice: number;
  amount: number;
  fee: number;
  resting: number;
  restingPrice: number;
}

function emptyStore(): MarketStore {
  return {
    cash: START_CASH,
    received: 0,
    nickname: '',
    listings: [],
    holdings: [],
    payouts: [],
    base: {},
    markets: {},
    orders: [],
    fills: [],
    notices: [],
    ready: false,
    index: [],
  };
}

let state: MarketStore = emptyStore();
let nextId = 1;
const listeners = new Set<() => void>();
let timer: number | null = null;

function commit(next: MarketStore) {
  state = next;
  listeners.forEach((listener) => listener());
}

subscribeSync((event) => {
  if (event.type === 'reset') commit(emptyStore());
});

function subscribeStore(listener: () => void): () => void {
  listeners.add(listener);
  startEngine();
  return () => {
    listeners.delete(listener);
  };
}

export function useMarketState(): MarketStore {
  return useSyncExternalStore(subscribeStore, getMarketState);
}

export function getMarketState(): MarketStore {
  return state;
}

// ---------- 숫자 도구 ----------

export function roundTick(value: number): number {
  return Math.round(value / TICK) * TICK;
}

function floorTick(value: number): number {
  return Math.floor(value / TICK) * TICK;
}

function clamp(value: number, low: number, high: number): number {
  return Math.max(low, Math.min(high, value));
}

export function feeRate(quantity: number): number {
  return quantity >= BULK_QUANTITY ? FEE_RATE_BULK : FEE_RATE;
}

export function feeOf(amount: number, quantity: number): number {
  return Math.round(amount * feeRate(quantity));
}

function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 가게마다 고정된 씨앗값. id 는 초기화할 때마다 바뀌므로 사진 이름으로 만든다(되돌리기 후에도 같은 시세 흐름). */
function seedOf(summary: OfferingSummary): number {
  let hash = 2166136261;
  for (const char of summary.imageKey || String(summary.id)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function gaussian(random: () => number): number {
  const u = Math.max(1e-9, random());
  const v = random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// ---------- 조각의 가치 ----------

/** 남은 상한을 다 받을 때까지 매달 monthly 씩 받는 흐름의 현재 가치. elapsed: 지난 지급 뒤 흐른 달(0~1) */
export function presentValue(monthly: number, remaining: number, annualRate: number, elapsed = 0): number {
  if (monthly <= 0 || remaining <= 0) return 0;
  const r = Math.pow(1 + annualRate, 1 / 12) - 1;
  let left = remaining;
  let value = 0;
  for (let month = 1; left > 0 && month <= 600; month += 1) {
    const pay = Math.min(monthly, left);
    value += pay / Math.pow(1 + r, month - elapsed);
    left -= pay;
  }
  return value;
}

export function economicsOf(summary: OfferingSummary, discountRate: number): Economics {
  const pieces = Math.max(1, Math.round(summary.raisedAmount / PIECE_FACE));
  // 정산 수수료를 뗀 비율 (1.274 / 1.3 = 0.98)
  const investorShare = summary.capMultiple > 0 ? summary.investorCapMultiple / summary.capMultiple : 1;
  const capPerPiece = Math.round(PIECE_FACE * summary.investorCapMultiple);
  const paidPerPiece = Math.floor((summary.totalPaid * investorShare) / pieces);
  const remainingPerPiece = Math.max(0, capPerPiece - paidPerPiece);
  const monthlyPerPiece = summary.monthlyPayout / pieces;
  return {
    pieces,
    capPerPiece,
    paidPerPiece,
    remainingPerPiece,
    monthlyPerPiece,
    discountRate,
    fairValue: presentValue(monthlyPerPiece, remainingPerPiece, discountRate),
  };
}

/** 조각 하나를 price 에 샀을 때 남은 상한까지 받으면 연 수익률(세전, 거래 수수료 포함, %) */
export function buyerAnnualReturn(price: number, economics: Economics, rate = FEE_RATE_BULK): number | null {
  const cost = price * (1 + rate);
  const { monthlyPerPiece: monthly, remainingPerPiece: remaining } = economics;
  if (monthly <= 0 || remaining <= 0 || cost <= 0) return null;
  const npv = (r: number) => {
    let left = remaining;
    let value = -cost;
    for (let month = 1; left > 0 && month <= 600; month += 1) {
      const pay = Math.min(monthly, left);
      value += pay / Math.pow(1 + r, month);
      left -= pay;
    }
    return value;
  };
  let low = -0.5;
  let high = 0.5;
  for (let i = 0; i < 60; i += 1) {
    const mid = (low + high) / 2;
    if (npv(mid) > 0) low = mid;
    else high = mid;
  }
  return (Math.pow(1 + (low + high) / 2, 12) - 1) * 100;
}

/** 남은 상한까지 받는 데 걸리는 개월 수 */
export function monthsToCap(economics: Economics): number {
  if (economics.monthlyPerPiece <= 0) return 0;
  return Math.ceil(economics.remainingPerPiece / economics.monthlyPerPiece);
}

// ---------- 지난 가격 만들기 ----------

function monthStart(yearMonth: string): Date {
  const [y, m] = yearMonth.split('-').map(Number);
  return new Date(y, m - 1, 1);
}

function payoutEventsOf(summary: OfferingSummary, economics: Economics): PayoutEvent[] {
  if (!summary.payoutStartMonth || !summary.lastSettledMonth || economics.paidPerPiece <= 0) return [];
  const start = monthStart(summary.payoutStartMonth);
  const last = monthStart(summary.lastSettledMonth);
  const months: Date[] = [];
  for (let d = new Date(start); d <= last; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) months.push(d);
  // 그 달 매출은 다음 달 10일에 정산된다고 본다. 조각당 지급액은 실제 누적 지급을 회차로 나눈 값.
  const perPiece = economics.paidPerPiece / months.length;
  return months.map((month) => ({ t: new Date(month.getFullYear(), month.getMonth() + 1, 10, 10).getTime(), perPiece }));
}

function interpolate(points: Point[], t: number): number {
  if (points.length === 0) return 0;
  if (t <= points[0].t) return points[0].p;
  for (let i = 1; i < points.length; i += 1) {
    if (t <= points[i].t) {
      const a = points[i - 1];
      const b = points[i];
      const w = (t - a.t) / Math.max(1, b.t - a.t);
      return a.p + (b.p - a.p) * w;
    }
  }
  return points[points.length - 1].p;
}

function buildHistory(summary: OfferingSummary, economics: Economics, profile: StoreProfile, now: number) {
  const random = seeded(seedOf(summary) + 7);
  const payouts = payoutEventsOf(summary, economics);
  const listedAt = summary.payoutStartMonth ? monthStart(summary.payoutStartMonth).getTime() : now - 90 * DAY;
  const firstDay = new Date(Math.max(listedAt, now - 730 * DAY));
  firstDay.setHours(0, 0, 0, 0);
  const monthlyGrowth = Math.pow(1 + summary.revenueGrowthPercent / 100, 1 / 12) - 1;

  const valueAt = (t: number) => {
    let paid = 0;
    let lastPayout = listedAt;
    for (const event of payouts) {
      if (event.t <= t) {
        paid += event.perPiece;
        lastPayout = event.t;
      }
    }
    const remaining = Math.max(0, economics.capPerPiece - paid);
    const elapsed = clamp((t - lastPayout) / (MONTH_DAYS * DAY), 0, 0.999);
    const monthsAgo = Math.max(0, (now - t) / (MONTH_DAYS * DAY));
    const monthly = economics.monthlyPerPiece * Math.pow(1 + monthlyGrowth, -monthsAgo);
    return { fair: presentValue(monthly, remaining, economics.discountRate, elapsed), remaining };
  };

  const toPrice = (fair: number, remaining: number, shift: number) =>
    clamp(roundTick(fair * (1 + shift)), roundTick(fair * (1 - PRICE_BAND)), floorTick(remaining) - TICK);

  const daily: Point[] = [];
  let noise = 0;
  for (let t = firstDay.getTime(); t < now; t += DAY) {
    noise = noise * 0.9 + 0.0055 * gaussian(random);
    const daysAgo = (now - t) / DAY;
    const mood = profile.drift * clamp(1 - daysAgo / 30, 0, 1);
    const { fair, remaining } = valueAt(t);
    daily.push({ t, p: toPrice(fair, remaining, noise + mood) });
  }
  const current = valueAt(now);
  const anchor = toPrice(current.fair, current.remaining, noise * 0.9 + profile.drift + profile.today);
  daily.push({ t: now, p: anchor });

  // 최근 7일: 하루 점 사이를 1시간 간격으로 잇고 잔물결을 더한다.
  const hourRandom = seeded(seedOf(summary) + 7919 * Math.floor(now / DAY));
  const hourly: Point[] = [];
  let ripple = 0;
  for (let t = now - 7 * DAY; t < now; t += 3_600_000) {
    ripple = ripple * 0.8 + 0.0016 * gaussian(hourRandom);
    hourly.push({ t, p: roundTick(interpolate(daily, t) * (1 + ripple)) });
  }
  hourly.push({ t: now, p: anchor });

  // 최근 24시간: 어제 이맘때 가격에서 지금 가격까지 이어지는 다리(브라운 브리지)
  const dayRandom = seeded(seedOf(summary) + 104729 * Math.floor(now / DAY));
  const start = roundTick(interpolate(daily, now - DAY));
  const steps = 144;
  const intraday: Point[] = [];
  let walk = 0;
  const walks: number[] = [0];
  for (let i = 1; i <= steps; i += 1) {
    walk += gaussian(dayRandom);
    walks.push(walk);
  }
  for (let i = 0; i <= steps; i += 1) {
    const w = i / steps;
    const bridge = walks[i] - w * walks[steps];
    const base = start + (anchor - start) * w;
    intraday.push({ t: now - DAY + (DAY * i) / steps, p: i === steps ? anchor : roundTick(base * (1 + 0.0011 * bridge)) });
  }

  return { daily, hourly, intraday, payouts, anchor, prevClose: start };
}

// ---------- 호가 ----------

function buildBook(price: number, upperLimit: number, lowerLimit: number, random: () => number, popularity: number) {
  const size = () => 3 + Math.floor(random() * (20 + 70 * popularity));
  const asks: Level[] = [];
  let ask = price + TICK;
  while (asks.length < BOOK_DEPTH && ask <= upperLimit) {
    asks.push({ price: ask, quantity: size(), mine: 0 });
    ask += TICK * (1 + (random() < 0.3 ? 1 : 0));
  }
  const bids: Level[] = [];
  let bid = price - TICK;
  while (bids.length < BOOK_DEPTH && bid >= lowerLimit) {
    bids.push({ price: bid, quantity: size(), mine: 0 });
    bid -= TICK * (1 + (random() < 0.3 ? 1 : 0));
  }
  return { asks, bids };
}

function limitsOf(reference: number, economics: Economics) {
  return {
    upperLimit: Math.min(floorTick(economics.remainingPerPiece) - TICK, roundTick(reference * (1 + PRICE_BAND))),
    lowerLimit: roundTick(reference * (1 - PRICE_BAND)),
  };
}

function createMarket(summary: OfferingSummary, now: number): MarketState {
  const profile = profileOf(summary.imageKey);
  const economics = economicsOf(summary, profile.discountRate);
  const history = buildHistory(summary, economics, profile, now);
  const { upperLimit, lowerLimit } = limitsOf(history.prevClose, economics);
  const random = seeded(seedOf(summary) + 31);
  const lastPrice = clamp(history.anchor, lowerLimit, upperLimit);
  const { asks, bids } = buildBook(lastPrice, upperLimit, lowerLimit, random, profile.popularity);
  const volume = Math.round((180 + 1600 * profile.popularity) * (0.8 + random() * 0.4));
  const prices = history.intraday.map((point) => point.p);
  const trades: Trade[] = Array.from({ length: 6 }, (_, index) => {
    const offset = Math.round((random() - 0.5) * 2) * TICK;
    return {
      id: nextId++,
      t: now - (index + 1) * (20_000 + Math.floor(random() * 40_000)),
      price: clamp(lastPrice + offset, lowerLimit, upperLimit),
      quantity: 1 + Math.floor(random() * 8),
      side: (offset >= 0 ? 'BUY' : 'SELL') as Side,
    };
  });
  return {
    offeringId: summary.id,
    economics,
    daily: history.daily,
    hourly: history.hourly,
    intraday: history.intraday,
    payouts: history.payouts,
    prevClose: history.prevClose,
    lastPrice,
    dayHigh: Math.max(...prices),
    dayLow: Math.min(...prices),
    upperLimit,
    lowerLimit,
    asks,
    bids,
    volume,
    turnover: Math.round(volume * (history.prevClose + lastPrice) / 2),
    trades,
    anchor: lastPrice,
    pieceDelta: 0,
    costDelta: 0,
    tickDirection: 0,
    tickAt: 0,
  };
}

/** 정산으로 지급액이 늘면 남은 상한(천장)과 적정가를 다시 계산한다. 받은 만큼 가치가 줄어 가격 목표도 내려간다(배당락). */
function refreshEconomics(market: MarketState, summary: OfferingSummary, now: number): MarketState {
  const profile = profileOf(summary.imageKey);
  const economics = economicsOf(summary, profile.discountRate);
  if (economics.paidPerPiece === market.economics.paidPerPiece && economics.pieces === market.economics.pieces) {
    return market;
  }
  const paidNow = economics.paidPerPiece - market.economics.paidPerPiece;
  const { upperLimit, lowerLimit } = limitsOf(market.prevClose, economics);
  const anchor = clamp(roundTick(market.anchor - paidNow), lowerLimit, upperLimit);
  return {
    ...market,
    economics,
    upperLimit,
    lowerLimit,
    anchor,
    asks: market.asks.filter((level) => level.price <= upperLimit || level.mine > 0),
    payouts: paidNow > 0 ? [...market.payouts, { t: now, perPiece: paidNow }] : market.payouts,
  };
}

// ---------- TABLE 지수 (지급 포함 총수익) ----------

function buildIndex(markets: MarketState[], now: number): Point[] {
  if (markets.length === 0) return [];
  const from = now - 365 * DAY;
  const points: Point[] = [];
  let level = 1000;
  for (let t = from; t <= now; t += DAY) {
    const returns: number[] = [];
    for (const market of markets) {
      if (market.daily.length === 0 || t - DAY < market.daily[0].t) continue;
      const before = interpolate(market.daily, t - DAY);
      const after = interpolate(market.daily, t);
      const paid = market.payouts.filter((event) => event.t > t - DAY && event.t <= t).reduce((sum, event) => sum + event.perPiece, 0);
      if (before > 0) returns.push((after + paid) / before - 1);
    }
    if (returns.length > 0) level *= 1 + returns.reduce((sum, r) => sum + r, 0) / returns.length;
    points.push({ t, p: level });
  }
  return points;
}

/** 지금 지수: 어제까지의 지수에 오늘 평균 등락을 곱한다 */
export function liveIndex(store: MarketStore): { value: number; changePercent: number; series: Point[] } {
  const markets = Object.values(store.markets);
  if (store.index.length < 2 || markets.length === 0) return { value: 1000, changePercent: 0, series: store.index };
  const yesterday = store.index[store.index.length - 2].p;
  const change = markets.reduce((sum, market) => sum + (market.lastPrice / market.prevClose - 1), 0) / markets.length;
  const value = yesterday * (1 + change);
  return { value, changePercent: change * 100, series: [...store.index.slice(0, -1), { t: Date.now(), p: value }] };
}

// ---------- 백엔드 데이터 반영 ----------

/** 상품 목록이 새로 오면 지급 중 상품의 시장을 만들거나(처음) 지급 현황을 갱신한다(정산 후). */
export function syncListings(listings: OfferingSummary[]): void {
  const now = Date.now();
  const markets = { ...state.markets };
  let created = false;
  for (const summary of listings) {
    if (summary.status !== 'ACTIVE') continue;
    const existing = markets[summary.id];
    if (!existing) {
      markets[summary.id] = createMarket(summary, now);
      created = true;
    } else {
      markets[summary.id] = refreshEconomics(existing, summary, now);
    }
  }
  const index = created || state.index.length === 0 ? buildIndex(Object.values(markets), now) : state.index;
  commit({ ...state, listings, markets, index, ready: true });
}

/** 내 투자 현황(백엔드)을 반영한다. 받은 돈은 예수금으로 들어온다고 본다. */
export function syncPortfolio(portfolio: Portfolio): void {
  const base: Record<number, BaseHolding> = {};
  for (const holding of portfolio.holdings) {
    base[holding.offeringId] = {
      pieces: Math.round(holding.invested / PIECE_FACE),
      invested: holding.invested,
      received: holding.received,
    };
  }
  commit({
    ...state,
    received: portfolio.totalReceived,
    nickname: portfolio.nickname,
    holdings: portfolio.holdings,
    payouts: portfolio.recentPayouts,
    base,
  });
}

/** 공모에 투자하면 예수금에서 빠져나간다. */
export function spendCash(amount: number): void {
  commit({ ...state, cash: state.cash - amount });
}

/** 시연용 입금·출금 */
export function moveCash(amount: number): void {
  commit({
    ...state,
    cash: state.cash + amount,
    notices: pushNotice(state.notices, {
      tone: 'info',
      title: amount > 0 ? `${amount.toLocaleString('ko-KR')}원을 넣었어요` : `${(-amount).toLocaleString('ko-KR')}원을 뺐어요`,
      body: '시연용 예수금이에요.',
    }),
  });
}

export function dismissNotice(id: number): void {
  commit({ ...state, notices: state.notices.filter((notice) => notice.id !== id) });
}

function pushNotice(notices: Notice[], notice: Omit<Notice, 'id'>): Notice[] {
  return [{ ...notice, id: nextId++ }, ...notices].slice(0, MAX_NOTICES);
}

// ---------- 잔고 ----------

/** 걸어 둔 매수 주문만큼 묶인 돈 */
function reservedCash(orders: MyOrder[]): number {
  return orders
    .filter((order) => order.side === 'BUY')
    .reduce((sum, order) => {
      const amount = order.price * order.remaining;
      return sum + amount + feeOf(amount, order.remaining);
    }, 0);
}

/** 예수금 = 시작 예수금 ± 거래 − 공모 투자 + 지금까지 받은 돈 */
export function cashBalance(store: MarketStore): number {
  return store.cash + store.received;
}

/** 걸어 둔 매수 주문만큼 묶인 돈을 뺀 주문 가능 금액 */
export function availableCash(store: MarketStore): number {
  return Math.max(0, cashBalance(store) - reservedCash(store.orders));
}

/** 지금 가진 조각 = 공모로 받은 조각 + 거래로 바뀐 조각 */
export function piecesOf(store: MarketStore, offeringId: number): number {
  const market = store.markets[offeringId];
  return Math.max(0, (store.base[offeringId]?.pieces ?? 0) + (market?.pieceDelta ?? 0));
}

/** 팔 수 있는 조각 = 가진 조각 − 팔려고 걸어 둔 조각 */
export function availablePieces(store: MarketStore, offeringId: number): number {
  const locked = store.orders
    .filter((order) => order.offeringId === offeringId && order.side === 'SELL')
    .reduce((sum, order) => sum + order.remaining, 0);
  return Math.max(0, piecesOf(store, offeringId) - locked);
}

/** 바로 구매·판매를 하면 호가를 어디까지 먹는지 미리 계산한다. */
export function previewMarketOrder(market: MarketState, side: Side, quantity: number): { filled: number; amount: number } {
  const levels = side === 'BUY' ? market.asks : market.bids;
  let need = quantity;
  let amount = 0;
  for (const level of levels) {
    if (need <= 0) break;
    const take = Math.min(level.quantity - level.mine, need);
    if (take <= 0) continue;
    amount += take * level.price;
    need -= take;
  }
  return { filled: quantity - need, amount };
}

export function dayChange(market: MarketState): { amount: number; percent: number } {
  const amount = market.lastPrice - market.prevClose;
  return { amount, percent: market.prevClose > 0 ? (amount / market.prevClose) * 100 : 0 };
}

// ---------- 내 주문 ----------

export class OrderRejected extends Error {}

export function placeOrder(input: {
  offeringId: number;
  side: Side;
  type: 'MARKET' | 'LIMIT';
  quantity: number;
  price?: number;
}): OrderOutcome {
  const market = state.markets[input.offeringId];
  if (!market) throw new OrderRejected('호가를 불러오지 못했어요.');
  const { side, quantity } = input;
  if (!Number.isInteger(quantity) || quantity < 1) throw new OrderRejected('1조각 이상 주문하세요.');

  const limit = input.type === 'LIMIT' ? input.price ?? 0 : null;
  if (limit !== null) {
    if (limit % TICK !== 0) throw new OrderRejected(`가격은 ${TICK}원 단위로 넣어 주세요.`);
    if (side === 'BUY' && limit > market.economics.remainingPerPiece) {
      throw new OrderRejected(
        `조각 하나가 앞으로 받을 수 있는 돈은 최대 ${market.economics.remainingPerPiece.toLocaleString('ko-KR')}원이에요. 이보다 비싸게 사면 끝까지 받아도 손해라 주문할 수 없어요.`,
      );
    }
    if (limit > market.upperLimit || limit < market.lowerLimit) {
      throw new OrderRejected(
        `가격 제한폭(${market.lowerLimit.toLocaleString('ko-KR')}원 ~ ${market.upperLimit.toLocaleString('ko-KR')}원) 밖이에요.`,
      );
    }
  }
  if (side === 'SELL' && quantity > availablePieces(state, input.offeringId)) {
    throw new OrderRejected('가진 조각보다 많이 팔 수 없어요.');
  }

  // 1) 반대편 호가와 체결 (내 주문이 걸린 수량과는 체결하지 않는다)
  const book = (side === 'BUY' ? market.asks : market.bids).map((level) => ({ ...level }));
  let need = quantity;
  let amount = 0;
  const trades: Trade[] = [];
  const now = Date.now();
  for (const level of book) {
    if (need <= 0) break;
    const crosses = limit === null || (side === 'BUY' ? level.price <= limit : level.price >= limit);
    if (!crosses) break;
    const take = Math.min(level.quantity - level.mine, need);
    if (take <= 0) continue;
    level.quantity -= take;
    need -= take;
    amount += take * level.price;
    trades.push({ id: nextId++, t: now, price: level.price, quantity: take, side });
  }
  const filled = quantity - need;
  if (input.type === 'MARKET' && filled === 0) throw new OrderRejected('지금 체결할 수 있는 호가가 없어요.');
  const fee = filled > 0 ? feeOf(amount, filled) : 0;

  // 2) 남은 수량: 가격 지정이면 호가에 걸어 두고, 바로 구매·판매면 취소한다.
  const resting = input.type === 'LIMIT' ? need : 0;
  let ownBook = (side === 'BUY' ? market.bids : market.asks).map((level) => ({ ...level }));
  const orders = [...state.orders];
  if (resting > 0 && limit !== null) {
    const existing = ownBook.find((level) => level.price === limit);
    if (existing) {
      existing.quantity += resting;
      existing.mine += resting;
    } else {
      ownBook.push({ price: limit, quantity: resting, mine: resting });
      ownBook.sort((a, b) => (side === 'BUY' ? b.price - a.price : a.price - b.price));
    }
    orders.unshift({ id: nextId++, offeringId: input.offeringId, side, price: limit, quantity, remaining: resting, createdAt: now });
  }

  // 3) 돈 확인 (매수: 체결 금액 + 걸어 둔 주문 금액)
  const restingCost = resting > 0 && limit !== null ? limit * resting + feeOf(limit * resting, resting) : 0;
  if (side === 'BUY' && amount + fee + restingCost > availableCash(state)) {
    throw new OrderRejected('주문 가능 금액이 모자라요.');
  }

  const matchedBook = book.filter((level) => level.quantity > 0);
  ownBook = ownBook.filter((level) => level.quantity > 0);
  const lastPrice = trades.length > 0 ? trades[trades.length - 1].price : market.lastPrice;
  const position = positionChange(market, side, filled, amount, fee, state.base[input.offeringId]);
  const nextMarket: MarketState = {
    ...market,
    asks: side === 'BUY' ? matchedBook : ownBook,
    bids: side === 'BUY' ? ownBook : matchedBook,
    lastPrice,
    dayHigh: Math.max(market.dayHigh, lastPrice),
    dayLow: Math.min(market.dayLow, lastPrice),
    volume: market.volume + filled,
    turnover: market.turnover + amount,
    trades: [...[...trades].reverse(), ...market.trades].slice(0, MAX_TRADES),
    intraday: filled > 0 ? appendPoint(market.intraday, now, lastPrice) : market.intraday,
    pieceDelta: position.pieceDelta,
    costDelta: position.costDelta,
    tickDirection: lastPrice > market.lastPrice ? 1 : lastPrice < market.lastPrice ? -1 : market.tickDirection,
    tickAt: filled > 0 ? now : market.tickAt,
  };
  const fills =
    filled > 0
      ? [{ id: nextId++, offeringId: input.offeringId, side, price: Math.round(amount / filled), quantity: filled, fee, at: now, fromResting: false }, ...state.fills]
      : state.fills;
  const cash = side === 'BUY' ? state.cash - amount - fee : state.cash + amount - fee;
  commit({ ...state, cash, orders, fills, markets: { ...state.markets, [input.offeringId]: nextMarket } });

  return {
    side,
    filled,
    averagePrice: filled > 0 ? Math.round(amount / filled) : 0,
    amount,
    fee,
    resting,
    restingPrice: limit ?? 0,
  };
}

/** 사고팔 때 내 조각 수와 원금이 어떻게 바뀌는지. 팔면 평균 단가만큼 원금이 줄어든다. */
function positionChange(market: MarketState, side: Side, quantity: number, amount: number, fee: number, base?: BaseHolding) {
  if (quantity === 0) return { pieceDelta: market.pieceDelta, costDelta: market.costDelta };
  if (side === 'BUY') {
    return { pieceDelta: market.pieceDelta + quantity, costDelta: market.costDelta + amount + fee };
  }
  const pieces = (base?.pieces ?? 0) + market.pieceDelta;
  const cost = (base?.invested ?? 0) + market.costDelta;
  const averageCost = pieces > 0 ? cost / pieces : 0;
  return { pieceDelta: market.pieceDelta - quantity, costDelta: market.costDelta - Math.round(averageCost * quantity) };
}

export function cancelOrder(orderId: number): void {
  const order = state.orders.find((candidate) => candidate.id === orderId);
  if (!order) return;
  const market = state.markets[order.offeringId];
  const strip = (levels: Level[]) =>
    levels
      .map((level) =>
        level.price === order.price ? { ...level, quantity: level.quantity - order.remaining, mine: level.mine - order.remaining } : level,
      )
      .filter((level) => level.quantity > 0);
  commit({
    ...state,
    orders: state.orders.filter((candidate) => candidate.id !== orderId),
    markets: market
      ? {
          ...state.markets,
          [order.offeringId]: {
            ...market,
            asks: order.side === 'SELL' ? strip(market.asks) : market.asks,
            bids: order.side === 'BUY' ? strip(market.bids) : market.bids,
          },
        }
      : state.markets,
    notices: pushNotice(state.notices, {
      tone: 'info',
      title: `${order.side === 'BUY' ? '구매' : '판매'} 주문을 취소했어요`,
      body: `${order.price.toLocaleString('ko-KR')}원, ${order.remaining}조각`,
    }),
  });
}

function appendPoint(points: Point[], t: number, p: number): Point[] {
  const next = [...points, { t, p }];
  return next.length > MAX_INTRADAY ? [next[0], ...next.slice(next.length - MAX_INTRADAY + 1)] : next;
}

// ---------- 다른 투자자들의 실시간 주문 ----------

function startEngine() {
  if (timer !== null || typeof window === 'undefined') return;
  timer = window.setInterval(tick, TICK_MS);
}

const engineRandom = seeded(Date.now() % 100_000);

function tick() {
  if (!state.ready || Object.keys(state.markets).length === 0) return;
  const now = Date.now();
  let cash = state.cash;
  let orders = state.orders;
  let fills = state.fills;
  let notices = state.notices;
  const markets: Record<number, MarketState> = {};
  const names = new Map(state.listings.map((listing) => [listing.id, listing.storeName]));

  for (const market of Object.values(state.markets)) {
    const listing = state.listings.find((candidate) => candidate.id === market.offeringId);
    const profile = profileOf(listing?.imageKey ?? '');
    let next: MarketState = { ...market, asks: market.asks.map((l) => ({ ...l })), bids: market.bids.map((l) => ({ ...l })) };

    // 1) 체결: 적정가보다 싸면 사려는 사람이, 비싸면 팔려는 사람이 많다.
    if (engineRandom() < 0.16 + 0.45 * profile.popularity) {
      const pull = clamp(((next.anchor - next.lastPrice) / Math.max(1, next.anchor)) * 45, -0.35, 0.35);
      const buyerArrives = engineRandom() < 0.5 + pull;
      const levels = buyerArrives ? next.asks : next.bids;
      const level = levels[0];
      if (level) {
        const want = 1 + Math.floor(engineRandom() * (2 + 7 * profile.popularity));
        const others = level.quantity - level.mine;
        const fromOthers = Math.min(want, Math.max(0, others));
        // 다른 사람 물량이 바닥나면 같은 가격에 걸린 내 주문이 체결된다.
        const fromMine = Math.min(want - fromOthers, level.mine);
        const traded = fromOthers + fromMine;
        if (traded > 0) {
          level.quantity -= traded;
          level.mine -= fromMine;
          if (level.quantity <= 0) levels.shift();
          next.tickDirection = level.price > next.lastPrice ? 1 : level.price < next.lastPrice ? -1 : next.tickDirection;
          next.lastPrice = level.price;
          next.tickAt = now;
          next.volume += traded;
          next.turnover += traded * level.price;
          next.dayHigh = Math.max(next.dayHigh, level.price);
          next.dayLow = Math.min(next.dayLow, level.price);
          next.trades = [{ id: nextId++, t: now, price: level.price, quantity: traded, side: (buyerArrives ? 'BUY' : 'SELL') as Side }, ...next.trades].slice(0, MAX_TRADES);
          next.intraday = appendPoint(next.intraday, now, level.price);

          if (fromMine > 0) {
            // 내 주문 체결: 사려는 사람이 왔으면 내 판매 주문이, 팔려는 사람이 왔으면 내 구매 주문이 체결된 것
            const mySide: Side = buyerArrives ? 'SELL' : 'BUY';
            let left = fromMine;
            orders = orders
              .map((order) => {
                if (left <= 0 || order.offeringId !== market.offeringId || order.side !== mySide || order.price !== level.price) return order;
                const take = Math.min(left, order.remaining);
                left -= take;
                return { ...order, remaining: order.remaining - take };
              })
              .filter((order) => order.remaining > 0);
            const amount = fromMine * level.price;
            const fee = feeOf(amount, fromMine);
            const change = positionChange(next, mySide, fromMine, amount, fee, state.base[market.offeringId]);
            next.pieceDelta = change.pieceDelta;
            next.costDelta = change.costDelta;
            cash = mySide === 'BUY' ? cash - amount - fee : cash + amount - fee;
            fills = [{ id: nextId++, offeringId: market.offeringId, side: mySide, price: level.price, quantity: fromMine, fee, at: now, fromResting: true }, ...fills];
            notices = pushNotice(notices, {
              tone: mySide === 'BUY' ? 'buy' : 'sell',
              title: `${mySide === 'BUY' ? '구매' : '판매'} 주문이 체결됐어요`,
              body: `${names.get(market.offeringId) ?? ''} ${fromMine}조각, ${level.price.toLocaleString('ko-KR')}원`,
            });
          }
        }
      }
    }

    // 2) 호가 채우기: 빈 가격대를 채우고 물량을 조금씩 바꾼다. 천장(남은 상한) 위로는 팔자 호가를 두지 않는다.
    next = replenish(next, profile.popularity);
    markets[market.offeringId] = next;
  }
  commit({ ...state, cash, orders, fills, notices, markets });
}

function replenish(market: MarketState, popularity: number): MarketState {
  const size = () => 2 + Math.floor(engineRandom() * (12 + 50 * popularity));
  const asks = market.asks.filter((level) => level.price <= market.upperLimit || level.mine > 0);
  const bids = market.bids.filter((level) => level.price >= market.lowerLimit || level.mine > 0);

  // 가장 싼 팔자 호가와 가장 비싼 사자 호가 사이가 벌어지면 현재가 옆에 새 호가가 들어온다.
  const bestBid = bids[0]?.price ?? market.lastPrice - TICK;
  if ((asks.length === 0 || asks[0].price - market.lastPrice > TICK) && engineRandom() < 0.7) {
    const price = Math.max(market.lastPrice, bestBid + TICK);
    if (price <= market.upperLimit && !asks.some((level) => level.price === price)) asks.unshift({ price, quantity: size(), mine: 0 });
  }
  const bestAsk = asks[0]?.price ?? market.lastPrice + TICK;
  if ((bids.length === 0 || market.lastPrice - bids[0].price > TICK) && engineRandom() < 0.7) {
    const price = Math.min(market.lastPrice, bestAsk - TICK);
    if (price >= market.lowerLimit && !bids.some((level) => level.price === price)) bids.unshift({ price, quantity: size(), mine: 0 });
  }
  asks.sort((a, b) => a.price - b.price);
  bids.sort((a, b) => b.price - a.price);

  while (asks.length < BOOK_DEPTH) {
    const price = (asks[asks.length - 1]?.price ?? market.lastPrice) + TICK;
    if (price > market.upperLimit) break;
    asks.push({ price, quantity: size(), mine: 0 });
  }
  while (bids.length < BOOK_DEPTH) {
    const price = (bids[bids.length - 1]?.price ?? market.lastPrice) - TICK;
    if (price < market.lowerLimit) break;
    bids.push({ price, quantity: size(), mine: 0 });
  }

  // 물량 흔들기
  if (engineRandom() < 0.6) {
    const side = engineRandom() < 0.5 ? asks : bids;
    const level = side[Math.floor(engineRandom() * side.length)];
    if (level) level.quantity = Math.max(level.mine + 1, level.quantity + Math.round((engineRandom() - 0.4) * 8));
  }
  const keep = (level: Level, index: number) => index < BOOK_DEPTH + 2 || level.mine > 0;
  return { ...market, asks: asks.filter(keep), bids: bids.filter(keep) };
}
