import { useState } from 'react';
import { Link } from 'react-router-dom';
import { buyerAnnualReturn, dayChange, liveIndex, useMarketState, type MarketState } from '../lib/market';
import { manShort, percent } from '../lib/format';
import type { OfferingSummary, Region } from '../lib/types';
import { Delta, Photo, Sparkline, timeLabel, useFlash, useNow } from './ui/bits';
import { AlertIcon, CheckIcon } from './ui/Icons';

type Sort = 'rise' | 'fall' | 'volume' | 'yield' | 'growth';
type RegionFilter = 'ALL' | Region;

const SORTS: { key: Sort; label: string; caption: string }[] = [
  { key: 'rise', label: '급상승', caption: '어제보다 많이 오른 순' },
  { key: 'fall', label: '급하락', caption: '어제보다 많이 내린 순' },
  { key: 'volume', label: '거래 많은', caption: '오늘 거래대금 순' },
  { key: 'yield', label: '연 수익률', caption: '지금 가격에 사면 받을 연 수익률 순' },
  { key: 'growth', label: '매출 성장', caption: '1년 전보다 매출이 늘어난 순 (카드 매출로 확인)' },
];

const REGIONS: { key: RegionFilter; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'POHANG', label: '포항' },
  { key: 'DOMESTIC', label: '국내' },
  { key: 'OVERSEAS', label: '해외' },
];

interface Row {
  listing: OfferingSummary;
  market: MarketState;
  change: number;
  yieldPercent: number;
}

/** 마켓: 토스증권 '실시간 차트'처럼 지급 중 가게의 조각 시세를 순위로 보여 준다. */
export function MarketPage() {
  const store = useMarketState();
  const now = useNow(5000);
  const [sort, setSort] = useState<Sort>('rise');
  const [region, setRegion] = useState<RegionFilter>('ALL');
  const index = liveIndex(store);

  const all: Row[] = store.listings
    .filter((listing) => listing.status === 'ACTIVE' && store.markets[listing.id])
    .map((listing) => {
      const market = store.markets[listing.id];
      return {
        listing,
        market,
        change: dayChange(market).percent,
        yieldPercent: buyerAnnualReturn(market.lastPrice, market.economics) ?? 0,
      };
    });
  const rows = all.filter((row) => region === 'ALL' || row.listing.region === region).sort(compare(sort));
  const turnover = all.reduce((sum, row) => sum + row.market.turnover, 0);
  const sortInfo = SORTS.find((item) => item.key === sort)!;

  return (
    <div className="page page--market">
      <header className="hero hero--market">
        <div className="hero-top">
          <h1 className="display hero-title">마켓</h1>
          <span className="live-badge">
            <i aria-hidden="true" />
            실시간
          </span>
        </div>
        <div className="index-card">
          <div className="index-head">
            <span className="index-label">TABLE 지수 · 지급 포함</span>
            <span className="index-turnover">
              오늘 거래대금
              <strong className="num">{manShort(turnover)}원</strong>
            </span>
          </div>
          <div className="index-value">
            <strong className="num">{index.value.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            <Delta value={index.changePercent} chip />
          </div>
          <Sparkline values={index.series.slice(-120).map((point) => point.p)} className="index-spark" />
          <p className="index-note">지급 중인 {all.length}곳의 가격과 매달 받은 돈을 합친 수익 흐름 (1년 전 = 1,000)</p>
        </div>
      </header>

      <div className="market-body">
        <div className="seg seg--wide" role="tablist" aria-label="지역">
          {REGIONS.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={region === item.key}
              className={region === item.key ? 'is-on' : ''}
              onClick={() => setRegion(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="chip-row" role="tablist" aria-label="순위 기준">
          {SORTS.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={sort === item.key}
              className={`chip${sort === item.key ? ' is-on' : ''}`}
              onClick={() => setSort(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <p className="list-caption">
          <span>{sortInfo.caption}</span>
          <span className="num">{timeLabel(now)} 기준</span>
        </p>

        {region === 'OVERSEAS' && (
          <p className="region-note">해외 가게는 3단계(해외 확장) 예시예요. 현지 매출과 지급은 원화로 환산해 보여 줘요.</p>
        )}

        {rows.length === 0 ? (
          <p className="empty">이 지역에는 아직 지급 중인 가게가 없어요.</p>
        ) : (
          <ol className="card list rank-list">
            {rows.map((row, index) => (
              <li key={row.listing.id}>
                <RankRow row={row} rank={index + 1} sort={sort} />
              </li>
            ))}
          </ol>
        )}

        <p className="page-foot">
          조각 거래는 2단계 기능이에요. 처음에는 만기까지 보유하는 상품으로 공모하고, 조각투자 장외거래소가 열리면 연동할 계획이에요. 이
          화면의 시세와 체결은 시연용이에요.
        </p>
      </div>
    </div>
  );
}

function RankRow({ row, rank, sort }: { row: Row; rank: number; sort: Sort }) {
  const { listing, market } = row;
  const flash = useFlash(market.lastPrice);
  return (
    <Link to={`/app/offerings/${listing.id}`} className="row rank-row">
      <span className={`rank${rank <= 3 ? ' is-top' : ''}`}>{rank}</span>
      <Photo imageKey={listing.imageKey} className="row-thumb" />
      <span className="row-main">
        <strong>
          {listing.storeName}
          {listing.holdMonth ? (
            <span className="verify verify--hold" title="정산 보류 중">
              <AlertIcon />
              <span className="visually-hidden">정산 보류 중</span>
            </span>
          ) : (
            <span className="verify" title="카드 매출 대조 일치">
              <CheckIcon />
              <span className="visually-hidden">카드 매출 대조 일치</span>
            </span>
          )}
        </strong>
        <span>
          {listing.category} · {listing.city}
        </span>
      </span>
      <span className="row-side">
        <strong className={`num price ${flash}`}>{market.lastPrice.toLocaleString('ko-KR')}원</strong>
        {sort === 'volume' ? (
          <span className="metric">거래 {manShort(market.turnover)}</span>
        ) : sort === 'yield' ? (
          <span className="metric metric--sun">연 {percent(row.yieldPercent)}</span>
        ) : sort === 'growth' ? (
          <span className={`metric ${listing.revenueGrowthPercent >= 0 ? 'metric--up' : 'metric--down'}`}>
            매출 {listing.revenueGrowthPercent >= 0 ? '+' : ''}
            {percent(listing.revenueGrowthPercent)}
          </span>
        ) : (
          <Delta value={row.change} chip />
        )}
      </span>
    </Link>
  );
}

function compare(sort: Sort) {
  return (a: Row, b: Row) => {
    switch (sort) {
      case 'rise':
        return b.change - a.change;
      case 'fall':
        return a.change - b.change;
      case 'volume':
        return b.market.turnover - a.market.turnover;
      case 'yield':
        return b.yieldPercent - a.yieldPercent;
      case 'growth':
        return b.listing.revenueGrowthPercent - a.listing.revenueGrowthPercent;
    }
  };
}
