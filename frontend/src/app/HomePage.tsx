import { Link } from 'react-router-dom';
import { useMarketState } from '../lib/market';
import { accountOf, latestPayout } from '../lib/account';
import { feedOf } from '../lib/news';
import { daysUntil, manwon, monthLabel, percent, won } from '../lib/format';
import type { OfferingSummary } from '../lib/types';
import { Delta, DeltaWon, Photo } from './ui/bits';
import { ArrowIcon, CardIcon, CeilingIcon, ChevronIcon, GiftIcon, PauseIcon, WaveIcon } from './ui/Icons';
import { FeedList } from './FeedList';

export function HomePage() {
  const store = useMarketState();
  const account = accountOf(store);
  const listings = store.listings;
  const active = listings.filter((listing) => listing.status === 'ACTIVE');
  const recruiting = listings.filter((listing) => listing.status === 'RECRUITING');
  const held = listings.filter((listing) => listing.holdMonth);
  const verified = active.filter((listing) => listing.verificationStatus === 'NORMAL' && !listing.holdMonth).length;
  const latest = latestPayout(store);
  const today = new Date();
  const top = [...account.positions].sort((a, b) => b.value - a.value).slice(0, 4);
  const ceilingRoom = averageCeilingRoom(store);

  return (
    <div className="page page--home">
      <header className="hero">
        <div className="hero-top">
          <span className="brand">
            <span className="brand-mark" aria-hidden="true">
              T
            </span>
            Tablestake
          </span>
          <span className="hero-pill">포항에서 시작해 세계 맛집으로</span>
        </div>

        <Link to="/app/portfolio" className="hero-assets" aria-label={`내 자산 ${won(account.total)}, 자세히 보기`}>
          <span className="hero-label">
            내 자산
            <span className="hero-tag">매달 매출 지급</span>
          </span>
          <strong className="hero-value num">
            {Math.round(account.total).toLocaleString('ko-KR')}
            <small>원</small>
          </strong>
          <span className="hero-change">
            <span className={`hero-chip hero-chip--${account.dayChange >= 0 ? 'up' : 'down'}`}>
              <DeltaWon value={account.dayChange} /> <Delta value={account.dayChangePercent} signed />
            </span>
            <span className="hero-when">
              오늘 · {today.getMonth() + 1}월 {today.getDate()}일
            </span>
          </span>
        </Link>

        <dl className="hero-stats">
          <div>
            <dt>{latest.month ? `${monthLabel(latest.month)} 매출분` : '최근 받은 돈'}</dt>
            <dd className="is-sun num">{won(latest.amount)}</dd>
          </div>
          <div>
            <dt>누적 받은 돈</dt>
            <dd className="num">{won(store.received)}</dd>
          </div>
          <div>
            <dt>보유 가게</dt>
            <dd className="num">{account.positions.length}곳</dd>
          </div>
        </dl>
      </header>

      <Ticker listings={listings} />

      <section className="section">
        <div className="section-head">
          <h2 className="display">안심하고 투자하는 이유</h2>
        </div>
        <ol className="safety">
          <li>
            <span className="safety-no">1</span>
            <span className="safety-body">
              <strong>
                <CardIcon className="safety-icon" />
                카드 매출로 한 번 더 확인
              </strong>
              <span>사장님이 신고한 매출을 카드사 승인 내역과 매달 맞춰 봐요.</span>
            </span>
            <span className="safety-stat">
              <em className="num">
                {verified}/{active.length}
              </em>
              곳 일치
            </span>
          </li>
          <li>
            <span className="safety-no">2</span>
            <span className="safety-body">
              <strong>
                <PauseIcon className="safety-icon" />
                수상하면 돈이 나가기 전에 멈춤
              </strong>
              <span>현금 결제 유도, 셀프 결제 같은 신호가 보이면 정산을 보류하고 확인해요.</span>
            </span>
            {held.length > 0 ? (
              <Link to={`/app/offerings/${held[0].id}`} className="safety-stat safety-stat--warn">
                <em className="num">{held.length}</em>곳 보류 중
              </Link>
            ) : (
              <span className="safety-stat">
                <em className="num">0</em>곳 보류
              </span>
            )}
          </li>
          <li>
            <span className="safety-no">3</span>
            <span className="safety-body">
              <strong>
                <CeilingIcon className="safety-icon" />
                조각 가격에는 천장이 있음
              </strong>
              <span>앞으로 받을 수 있는 돈보다 비싸게는 살 수 없어요. 끝까지 받아도 손해인 가격은 주문이 막혀요.</span>
            </span>
            <span className="safety-stat">
              천장까지
              <em className="num">{percent(ceilingRoom, 0)}</em>
            </span>
          </li>
        </ol>
        <p className="safety-foot">
          <WaveIcon className="safety-foot-icon" />
          가게는 매출의 5%만 내요. 장사가 안 되면 덜 내고, 투자금의 1.3배를 갚거나 5년이 지나면 끝나요.
        </p>
      </section>

      {top.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2 className="display">내 가게 조각</h2>
            <Link to="/app/portfolio" className="section-more">
              전체 {account.positions.length}곳 <ChevronIcon />
            </Link>
          </div>
          <ul className="card list">
            {top.map((position) => (
              <li key={position.offeringId}>
                <Link to={`/app/offerings/${position.offeringId}`} className="row">
                  <Photo imageKey={position.imageKey} className="row-thumb" />
                  <span className="row-main">
                    <strong>{position.name}</strong>
                    <span>
                      {position.city} · {position.lastPrice !== null ? `${position.pieces}조각` : '공모 참여 중'}
                    </span>
                  </span>
                  <span className="row-side">
                    <strong className="num">{won(Math.round(position.value))}</strong>
                    <Delta value={position.profitPercent} digits={1} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {recruiting.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2 className="display">지금 모집 중인 공모</h2>
            <Link to="/app/offerings" className="section-more">
              전체 <ChevronIcon />
            </Link>
          </div>
          <ul className="offer-rail">
            {recruiting.map((listing) => (
              <li key={listing.id}>
                <OfferCard listing={listing} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="section">
        <div className="perk-card">
          <GiftIcon className="perk-card-icon" />
          <h2 className="display">투자하면 그 가게 단골이 돼요</h2>
          <ul>
            {listings
              .filter((listing) => listing.investorPerk)
              .slice(0, 3)
              .map((listing) => (
                <li key={listing.id}>
                  <strong>{listing.storeName}</strong>
                  {listing.investorPerk?.replace('투자자 인증하면 ', '')}
                </li>
              ))}
          </ul>
          <Link to="/app/portfolio#perks" className="perk-card-link">
            내 단골 인증 보기 <ArrowIcon />
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="display">가게 소식</h2>
          <span className="section-note">검증·정산 소식이 먼저 와요</span>
        </div>
        <FeedList items={feedOf(listings).slice(0, 6)} />
      </section>

      <p className="page-foot">시연용 예시 데이터예요. 조각투자 상품은 원금 손실이 날 수 있어요.</p>
    </div>
  );
}

/** 노란 띠: 가게별 검증 결과가 흐른다 */
function Ticker({ listings }: { listings: OfferingSummary[] }) {
  const items = listings
    .filter((listing) => listing.status === 'ACTIVE' || listing.status === 'RECRUITING')
    .map((listing) => {
      if (listing.holdMonth) return { key: listing.id, mark: '⏸', text: `${listing.storeName} 정산 보류`, tone: 'warn' };
      if (listing.status === 'RECRUITING') return { key: listing.id, mark: '●', text: `${listing.storeName} 공모 ${percent(listing.fundingRatePercent, 0)}`, tone: '' };
      return { key: listing.id, mark: '✓', text: `${listing.storeName} 카드 대조 일치`, tone: '' };
    });
  if (items.length === 0) return <div className="ticker" aria-hidden="true" />;
  const run = (copy: number) =>
    items.map((item) => (
      <span key={`${copy}-${item.key}`} className={`ticker-item${item.tone ? ` is-${item.tone}` : ''}`}>
        <b aria-hidden="true">{item.mark}</b>
        {item.text}
      </span>
    ));
  return (
    <div className="ticker" aria-label="이번 달 매출 검증 현황">
      <div className="ticker-track">
        {run(0)}
        <span aria-hidden="true" className="ticker-copy">
          {run(1)}
        </span>
      </div>
    </div>
  );
}

export function OfferCard({ listing }: { listing: OfferingSummary }) {
  const days = daysUntil(listing.recruitEndsOn);
  return (
    <Link to={`/app/offerings/${listing.id}`} className="offer-card">
      <span className="offer-card-photo">
        <Photo imageKey={listing.imageKey} />
        <span className="offer-card-badge">D-{days}</span>
        <span className="city-chip">{listing.city}</span>
      </span>
      <span className="offer-card-body">
        <strong>{listing.storeName}</strong>
        <span className="offer-card-title">{listing.title}</span>
        <span className="offer-card-meter" aria-hidden="true">
          <i style={{ width: `${Math.min(100, listing.fundingRatePercent)}%` }} />
        </span>
        <span className="offer-card-meta">
          <span>
            <b className="num">{percent(listing.fundingRatePercent, 0)}</b> 모였어요
          </span>
          <span>목표 {manwon(listing.targetAmount)}</span>
        </span>
        <span className="offer-card-return">
          예상 연 <b className="num">{percent(listing.expectedAnnualReturnPercent)}</b>
        </span>
      </span>
    </Link>
  );
}

/** 지급 중 가게들의 지금 가격이 천장(남은 상한)보다 평균 몇 % 아래에 있는지 */
function averageCeilingRoom(store: ReturnType<typeof useMarketState>): number {
  const markets = Object.values(store.markets);
  if (markets.length === 0) return 0;
  const rooms = markets.map((market) => (1 - market.lastPrice / Math.max(1, market.economics.remainingPerPiece)) * 100);
  return rooms.reduce((sum, room) => sum + room, 0) / rooms.length;
}
