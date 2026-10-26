import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApi } from '../lib/useApi';
import type { OfferingDetail, Simulation } from '../lib/types';
import { dayLabel, daysUntil, manwon, monthLabel, percent, periodLabel, won } from '../lib/format';
import { cityCode } from '../lib/catalog';
import { feedOf } from '../lib/news';
import {
  buyerAnnualReturn,
  piecesOf,
  useMarketState,
  type MarketState,
  type MarketStore,
  type Point,
  type Side,
} from '../lib/market';
import { accountOf } from '../lib/account';
import { ErrorNote } from '../components/ErrorNote';
import { Delta, Photo, timeLabel, useFlash } from './ui/bits';
import { PriceChart } from './ui/PriceChart';
import { BackIcon, CheckIcon, HeartIcon, PauseIcon } from './ui/Icons';
import { FeedList } from './FeedList';
import { Notice, PerkCard, RiskCard, SettlementTable, TermsCard, VerificationSection } from './StoreSections';
import { OrderSheet } from './OrderSheet';
import { PerkPass } from './PerkPass';

export function StorePage() {
  const { offeringId } = useParams();
  const id = Number(offeringId);
  const detail = useApi<OfferingDetail>(`/api/offerings/${id}`);
  const store = useMarketState();

  if (detail.error && !detail.data) {
    return (
      <div className="page page--store">
        <PhotoHero imageKey={null} name="" />
        <div className="sheet-top">
          <ErrorNote error={detail.error} />
        </div>
      </div>
    );
  }
  if (!detail.data) {
    return (
      <div className="page page--store" aria-busy="true">
        <div className="photo-hero photo-hero--empty" />
      </div>
    );
  }
  const d = detail.data;
  const market = store.markets[id];
  if (d.summary.status === 'ACTIVE' && market) return <ActiveStore detail={d} market={market} store={store} />;
  return <RecruitingStore detail={d} />;
}

function PhotoHero({ imageKey, name }: { imageKey: string | null; name: string }) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  return (
    <div className="photo-hero">
      <Photo imageKey={imageKey} alt={name ? `${name} 대표 메뉴 (시연용 그림)` : ''} />
      <div className="photo-actions">
        <button type="button" className="round-btn" aria-label="뒤로" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/app'))}>
          <BackIcon />
        </button>
        <button type="button" className={`round-btn${liked ? ' is-on' : ''}`} aria-label="관심 가게" aria-pressed={liked} onClick={() => setLiked((value) => !value)}>
          <HeartIcon filled={liked} />
        </button>
      </div>
    </div>
  );
}

function HeadChips({ detail, extra }: { detail: OfferingDetail; extra?: ReactNode }) {
  const s = detail.summary;
  const verified = detail.verification.status === 'NORMAL' && !s.holdMonth;
  return (
    <div className="head-chips">
      <span className="chip-city">
        {cityCode(s.city)}
        {detail.store.currency !== 'KRW' && ` · ${detail.store.currency}`}
      </span>
      {extra}
      <span className={`chip-grade chip-grade--${s.riskGrade}`}>안정성 {s.riskGrade}</span>
      <span className={`chip-verify${verified ? '' : ' is-warn'}`}>
        {verified ? <CheckIcon /> : <PauseIcon />}
        {verified ? '카드 매출 대조' : s.holdMonth ? '정산 보류' : '매출 주의'}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------- 지급 중: 증권앱 종목 화면

type Period = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';
const PERIODS: { key: Period; label: string; since: string }[] = [
  { key: '1D', label: '1일', since: '어제' },
  { key: '1W', label: '1주', since: '1주 전' },
  { key: '1M', label: '1개월', since: '1개월 전' },
  { key: '3M', label: '3개월', since: '3개월 전' },
  { key: '1Y', label: '1년', since: '1년 전' },
  { key: 'ALL', label: '전체', since: '상장 때' },
];
const DAY = 86_400_000;

function pointsOf(market: MarketState, period: Period): Point[] {
  const now = Date.now();
  const live = { t: now, p: market.lastPrice };
  const withLive = (points: Point[]) => [...points.slice(0, -1), live];
  switch (period) {
    case '1D':
      return market.intraday;
    case '1W':
      return withLive(market.hourly);
    case '1M':
      return withLive(market.daily.filter((point) => point.t >= now - 31 * DAY));
    case '3M':
      return withLive(market.daily.filter((point) => point.t >= now - 92 * DAY));
    case '1Y':
      return withLive(market.daily.filter((point) => point.t >= now - 366 * DAY));
    case 'ALL':
      return withLive(market.daily);
  }
}

function timeFormatOf(period: Period) {
  return (t: number) => {
    const date = new Date(t);
    if (period === '1D') return timeLabel(t);
    if (period === '1W') return `${date.getMonth() + 1}월 ${date.getDate()}일 ${timeLabel(t)}`;
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };
}

function ActiveStore({ detail, market, store }: { detail: OfferingDetail; market: MarketState; store: MarketStore }) {
  const s = detail.summary;
  const e = market.economics;
  const [params, setParams] = useSearchParams();
  const [period, setPeriod] = useState<Period>('1D');
  const [showPass, setShowPass] = useState(false);
  const flash = useFlash(market.lastPrice);

  const points = pointsOf(market, period);
  const first = points[0]?.p ?? market.lastPrice;
  const periodChange = market.lastPrice - first;
  const periodPercent = first > 0 ? (periodChange / first) * 100 : 0;
  const since = PERIODS.find((item) => item.key === period)!.since;
  const yieldNow = buyerAnnualReturn(market.lastPrice, e);
  const ceilingShare = Math.min(100, (market.lastPrice / Math.max(1, e.remainingPerPiece)) * 100);

  const pieces = piecesOf(store, s.id);
  const position = accountOf(store).positions.find((item) => item.offeringId === s.id);
  const order = params.get('order');
  // 시트를 여닫아도 방문 기록이 쌓이지 않게 한다(뒤로 가기가 이전 화면으로 가도록).
  const openOrder = (side: Side) => setParams({ order: side === 'BUY' ? 'buy' : 'sell' }, { replace: true });
  const closeOrder = () => setParams({}, { replace: true });
  const bestAsk = market.asks.find((level) => level.quantity > level.mine)?.price ?? market.lastPrice;
  const bestBid = market.bids.find((level) => level.quantity > level.mine)?.price ?? market.lastPrice;
  const nextPerPiece = Math.round(e.monthlyPerPiece);

  return (
    <div className="page page--store has-sticky">
      <PhotoHero imageKey={s.imageKey} name={s.storeName} />
      <div className="sheet-top">
        <HeadChips detail={detail} />
        <h1 className="display store-name">{s.storeName}</h1>
        <p className="store-sub">
          {s.city} {s.area} · {s.category} · {detail.store.openedOn.slice(0, 4)}년 오픈
        </p>

        <div className="quote">
          <strong className={`quote-price num ${flash}`}>
            {market.lastPrice.toLocaleString('ko-KR')}
            <small>원</small>
          </strong>
          <Delta value={periodPercent} chip />
        </div>
        <p className="quote-sub">
          1조각 가격 · {since}보다 {Math.abs(periodChange).toLocaleString('ko-KR')}원 {periodChange >= 0 ? '올랐어요' : '내렸어요'}
        </p>

        <PriceChart
          points={points}
          live={period === '1D'}
          timeFormat={timeFormatOf(period)}
          ariaLabel={`${s.storeName} 조각 가격, ${PERIODS.find((item) => item.key === period)!.label}`}
        />
        <div className="seg" role="tablist" aria-label="차트 기간">
          {PERIODS.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={period === item.key}
              className={period === item.key ? 'is-on' : ''}
              onClick={() => setPeriod(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="tiles">
          <div className="tile tile--sun">
            <span>지금 사면 연</span>
            <strong className="num">{yieldNow === null ? '-' : percent(yieldNow)}</strong>
          </div>
          <div className="tile">
            <span>월 매출</span>
            <strong className="num">{manwon(s.averageMonthlyRevenue).replace(' 원', '')}</strong>
          </div>
          <div className="tile">
            <span>투자자</span>
            <strong className="num">{s.investorCount}명</strong>
          </div>
        </div>

        <div className="ceiling-meter">
          <div className="ceiling-meter-head">
            <span>
              <b>가격 천장</b> 남은 상한 {won(e.remainingPerPiece)}
            </span>
            <span className="num">천장의 {percent(ceilingShare, 0)}</span>
          </div>
          <div className="ceiling-track" aria-hidden="true">
            <i style={{ width: `${ceilingShare}%` }} />
          </div>
          <p>
            조각 하나가 앞으로 받을 수 있는 돈은 최대 {won(e.remainingPerPiece)}이에요. 이보다 비싸면 끝까지 받아도 손해라 살 수 없어요.
          </p>
        </div>
      </div>

      <section className="section">
        <div className="section-head">
          <h2 className="display">실시간 체결</h2>
          <span className="live-badge live-badge--light">
            <i aria-hidden="true" />
            LIVE
          </span>
        </div>
        <div className="card trades">
          <dl className="trades-stats">
            <div>
              <dt>오늘 거래량</dt>
              <dd className="num">{market.volume.toLocaleString('ko-KR')}조각</dd>
            </div>
            <div>
              <dt>오늘 최고</dt>
              <dd className="num delta--up">{market.dayHigh.toLocaleString('ko-KR')}</dd>
            </div>
            <div>
              <dt>오늘 최저</dt>
              <dd className="num delta--down">{market.dayLow.toLocaleString('ko-KR')}</dd>
            </div>
          </dl>
          {market.trades.length === 0 ? (
            <p className="card-note">곧 체결이 들어와요.</p>
          ) : (
            <ul className="trades-list">
              {market.trades.slice(0, 5).map((trade) => (
                <li key={trade.id}>
                  <span className="num">{timeLabel(trade.t)}</span>
                  <span className={`num delta--${trade.side === 'BUY' ? 'up' : 'down'}`}>{trade.price.toLocaleString('ko-KR')}원</span>
                  <span className="num">{trade.quantity}조각</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="display">다음 지급 예상</h2>
          <span className="section-note">{s.holdMonth ? '이번 달은 정산 보류 중' : '매출 마감 후 정산'}</span>
        </div>
        <div className="card payout-next">
          <div>
            <span>1조각당</span>
            <strong className="num">약 {won(nextPerPiece)}</strong>
          </div>
          <div>
            <span>{pieces > 0 ? `내 ${pieces}조각` : '10조각이면'}</span>
            <strong className="num">약 {won(nextPerPiece * (pieces > 0 ? pieces : 10))}</strong>
          </div>
          <p className="card-note">
            최근 12개월 평균 매출 {manwon(s.averageMonthlyRevenue)} × {percent(s.revenueSharePercent, 0)}에서 수수료를 뺀 값이에요. 매출이 줄면 덜
            받아요.
            {s.lastSettledMonth && ` 마지막 정산은 ${monthLabel(s.lastSettledMonth)} 매출분이에요.`}
          </p>
        </div>
      </section>

      <VerificationSection detail={detail} />
      <SettlementTable detail={detail} />
      <RiskCard detail={detail} />
      <PerkCard perk={s.investorPerk} owned={pieces > 0} onShow={() => setShowPass(true)} />

      <section className="section">
        <div className="section-head">
          <h2 className="display">가게 소식</h2>
        </div>
        <FeedList items={feedOf([s])} withPhoto={false} />
      </section>

      <TermsCard detail={detail} />
      <Notice tradable />

      <div className="sticky-bar">
        <div className="sticky-hold">
          {pieces > 0 && position ? (
            <>
              <span>
                내 보유 <b className="num">{pieces}조각</b> · <span className="num">{won(Math.round(position.value))}</span>
              </span>
              <Delta value={position.profitPercent} digits={2} />
            </>
          ) : (
            <span>아직 이 가게 조각이 없어요</span>
          )}
        </div>
        <div className="sticky-actions">
          <button type="button" className="btn-sell" onClick={() => openOrder('SELL')} disabled={pieces === 0}>
            판매
            <small className="num">{bestBid.toLocaleString('ko-KR')}원</small>
          </button>
          <button type="button" className="btn-buy" onClick={() => openOrder('BUY')}>
            구매
            <small className="num">{bestAsk.toLocaleString('ko-KR')}원</small>
          </button>
        </div>
      </div>

      {(order === 'buy' || order === 'sell') && (
        <OrderSheet detail={detail} market={market} store={store} initialSide={order === 'buy' ? 'BUY' : 'SELL'} onClose={closeOrder} />
      )}
      {showPass && position && <PerkPass position={position} onClose={() => setShowPass(false)} />}
    </div>
  );
}

// ---------------------------------------------------------------- 모집 중: 공모 화면

const SAMPLE_AMOUNTS = [100_000, 500_000, 1_000_000];

function RecruitingStore({ detail }: { detail: OfferingDetail }) {
  const s = detail.summary;
  const store = useMarketState();
  const recruiting = s.status === 'RECRUITING';
  const days = daysUntil(s.recruitEndsOn);
  const remaining = detail.remainingAmount;
  const position = accountOf(store).positions.find((item) => item.offeringId === s.id);
  const [showPass, setShowPass] = useState(false);

  return (
    <div className="page page--store has-sticky">
      <PhotoHero imageKey={s.imageKey} name={s.storeName} />
      <div className="sheet-top">
        <HeadChips detail={detail} extra={recruiting ? <span className="chip-live">공모 중 · D-{days}</span> : <span className="chip-live is-off">{s.statusLabel}</span>} />
        <h1 className="display store-name">{s.storeName}</h1>
        <p className="store-sub">
          {s.city} {s.area} · {s.category} · {detail.store.openedOn.slice(0, 4)}년 오픈
        </p>
        <p className="store-purpose">
          <b>{s.title}</b> {detail.purpose}
        </p>

        <div className="funding">
          <div className="funding-top">
            <span>
              <strong className="num">{manwon(s.raisedAmount)}</strong> 모였어요
            </span>
            <span className="num funding-rate">{percent(s.fundingRatePercent, 0)}</span>
          </div>
          <div className="funding-track" aria-hidden="true">
            <i style={{ width: `${Math.min(100, s.fundingRatePercent)}%` }} />
          </div>
          <dl className="funding-facts">
            <div>
              <dt>목표</dt>
              <dd className="num">{manwon(s.targetAmount)}</dd>
            </div>
            <div>
              <dt>참여</dt>
              <dd className="num">{s.investorCount}명</dd>
            </div>
            <div>
              <dt>마감</dt>
              <dd>
                {dayLabel(s.recruitEndsOn)} ({days}일 남음)
              </dd>
            </div>
          </dl>
        </div>

        <div className="tiles">
          <div className="tile tile--sun">
            <span>예상 연 수익</span>
            <strong className="num">{percent(s.expectedAnnualReturnPercent)}</strong>
          </div>
          <div className="tile">
            <span>월 매출</span>
            <strong className="num">{manwon(s.averageMonthlyRevenue).replace(' 원', '')}</strong>
          </div>
          <div className="tile">
            <span>운영</span>
            <strong className="num">{periodLabel(detail.store.operatingMonths)}</strong>
          </div>
        </div>
      </div>

      {recruiting && <SimulationPanel offeringId={s.id} feePercent={detail.settlementFeePercent} />}

      <section className="section">
        <div className="section-head">
          <h2 className="display">공모는 이렇게 진행돼요</h2>
        </div>
        <ol className="steps steps--dark">
          <li>
            <span className="steps-no">1</span>
            <span>
              <strong>1만 원 단위로 청약</strong>한 사람당 {manwon(detail.perInvestorLimit)}까지 넣을 수 있어요.
            </span>
          </li>
          <li>
            <span className="steps-no">2</span>
            <span>
              <strong>목표가 다 차면 다음 달부터 지급</strong>매달 매출의 {percent(s.revenueSharePercent, 0)}에서 수수료를 뺀 돈을 나눠 받아요.
            </span>
          </li>
          <li>
            <span className="steps-no">3</span>
            <span>
              <strong>{s.capMultiple}배를 갚거나 5년이 지나면 끝</strong>수수료를 빼면 최대 {detail.investorCapMultiple.toFixed(3)}배를 받아요.
            </span>
          </li>
        </ol>
      </section>

      <VerificationSection detail={detail} />

      <section className="section">
        <div className="section-head">
          <h2 className="display">모을 수 있는 최대 금액</h2>
        </div>
        <div className="card limit">
          <p className="formula">
            평균 매출 {manwon(detail.fundingLimit.averageRevenueClean)} × {percent(detail.fundingLimit.sharePercent, 0)} × {detail.fundingLimit.termMonths}
            개월 ÷ {detail.fundingLimit.capMultiple}배
          </p>
          <div className="limit-line">
            <span>한도</span>
            <strong className="num">{manwon(detail.fundingLimit.limitClean)}</strong>
          </div>
          <div className="limit-line">
            <span>목표 금액</span>
            <strong className="num">{manwon(detail.fundingLimit.targetAmount)}</strong>
          </div>
          <p className="card-note">
            {detail.fundingLimit.targetWithinLimit
              ? '5년 안에 상환 상한까지 갚을 수 있는 금액만큼만 모아요. 목표 금액이 한도 안에 있어요.'
              : '목표 금액이 한도를 넘어요. 매출이 이대로면 기간 안에 다 갚기 어려워요.'}
          </p>
        </div>
      </section>

      <RiskCard detail={detail} />
      <PerkCard perk={s.investorPerk} owned={!!position} onShow={() => setShowPass(true)} />

      <section className="section">
        <div className="section-head">
          <h2 className="display">가게 소식</h2>
        </div>
        <FeedList items={feedOf([s])} withPhoto={false} />
      </section>

      <TermsCard detail={detail} />
      <Notice tradable={false} />

      <div className="sticky-bar">
        <div className="sticky-hold">
          {detail.myInvestedAmount > 0 ? (
            <span>
              내 청약 <b className="num">{manwon(detail.myInvestedAmount)}</b> · 남은 모집 {manwon(remaining)}
            </span>
          ) : (
            <span>
              남은 모집 <b className="num">{manwon(remaining)}</b> · 1만 원부터
            </span>
          )}
        </div>
        <div className="sticky-actions sticky-actions--one">
          {recruiting && remaining > 0 ? (
            <Link to={`/app/offerings/${s.id}/invest`} className="btn-invest">
              투자하기
            </Link>
          ) : (
            <button type="button" className="btn-invest" disabled>
              모집이 끝났어요
            </button>
          )}
        </div>
      </div>
      {showPass && position && <PerkPass position={position} onClose={() => setShowPass(false)} />}
    </div>
  );
}

function SimulationPanel({ offeringId, feePercent }: { offeringId: number; feePercent: number }) {
  const [amount, setAmount] = useState(1_000_000);
  const simulation = useApi<Simulation>(`/api/offerings/${offeringId}/simulation?amount=${amount}`);
  const p = simulation.data?.projection;
  return (
    <section className="section">
      <div className="section-head">
        <h2 className="display">넣은 돈에 따라 받는 돈</h2>
      </div>
      <div className="card sim">
        <div className="chip-row chip-row--tight" role="group" aria-label="예시 금액">
          {SAMPLE_AMOUNTS.map((sample) => (
            <button key={sample} type="button" className={`chip${sample === amount ? ' is-on' : ''}`} aria-pressed={sample === amount} onClick={() => setAmount(sample)}>
              {manwon(sample)}
            </button>
          ))}
        </div>
        {p && (
          <dl className={`sim-lines${simulation.loading ? ' is-stale' : ''}`}>
            <div>
              <dt>매달 약</dt>
              <dd className="num">{won(p.monthlyPayout)}</dd>
            </div>
            <div>
              <dt>받는 기간</dt>
              <dd className="num">{p.expectedMonths}개월</dd>
            </div>
            <div>
              <dt>모두 받으면</dt>
              <dd className="num">{won(p.expectedTotal)}</dd>
            </div>
            <div className="sim-total">
              <dt>연 수익률로 치면</dt>
              <dd className="num">{percent(p.annualReturnPercent)}</dd>
            </div>
          </dl>
        )}
        <p className="card-note">정산 수수료 {percent(feePercent, 0)}를 뺀 금액이에요. 최근 12개월 평균 매출이 그대로라고 보고 계산했어요.</p>
        {simulation.error && <ErrorNote error={simulation.error} />}
      </div>
    </section>
  );
}
