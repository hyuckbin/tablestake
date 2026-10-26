import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cancelOrder, moveCash, useMarketState } from '../lib/market';
import { accountOf, latestPayout, monthlyPayouts, type PositionView } from '../lib/account';
import { manwon, monthLabel, monthTick, percent, won } from '../lib/format';
import { Delta, DeltaWon, Photo, timeLabel } from './ui/bits';
import { CloseIcon } from './ui/Icons';
import { PerkPass } from './PerkPass';

type SortKey = 'profit' | 'value';
const CASH_STEP = 100_000;

export function PortfolioPage() {
  const store = useMarketState();
  const account = accountOf(store);
  const location = useLocation();
  const [sortKey, setSortKey] = useState<SortKey>('profit');
  const [pass, setPass] = useState<PositionView | null>(null);
  const latest = latestPayout(store);
  const months = monthlyPayouts(store, 6);
  const maxMonth = Math.max(1, ...months.map((month) => month.amount));
  const names = new Map(store.listings.map((listing) => [listing.id, listing]));

  useEffect(() => {
    if (location.hash === '#perks') document.getElementById('perks')?.scrollIntoView({ block: 'start' });
  }, [location.hash, store.ready]);

  const positions = [...account.positions].sort((a, b) => (sortKey === 'profit' ? b.profitPercent - a.profitPercent : b.value - a.value));
  const withPerks = account.positions.filter((position) => position.perk);

  return (
    <div className="page page--portfolio">
      <header className="hero">
        <div className="hero-top">
          <h1 className="display hero-title">내 자산</h1>
        </div>
        <span className="hero-label">총 자산</span>
        <strong className="hero-value num">
          {Math.round(account.total).toLocaleString('ko-KR')}
          <small>원</small>
        </strong>
        <span className="hero-change">
          <span className={`hero-chip hero-chip--${account.profit >= 0 ? 'up' : 'down'}`}>
            <DeltaWon value={account.profit} /> <Delta value={account.profitPercent} signed />
          </span>
          <span className="hero-when">투자 손익 · 받은 돈 포함</span>
        </span>
        <div className="cash-row">
          <dl>
            <div>
              <dt>가게 조각</dt>
              <dd className="num">{won(Math.round(account.piecesValue + account.subscriptionValue))}</dd>
            </div>
            <div>
              <dt>예수금</dt>
              <dd className="num">{won(Math.round(account.cash))}</dd>
            </div>
          </dl>
          <div className="cash-actions">
            <button type="button" className="btn-sun" onClick={() => moveCash(CASH_STEP)}>
              입금
            </button>
            <button type="button" className="btn-night" onClick={() => moveCash(-CASH_STEP)} disabled={account.available < CASH_STEP}>
              출금
            </button>
          </div>
        </div>
      </header>

      <section className="section">
        <div className="section-head">
          <h2 className="display">받은 돈</h2>
          <span className="section-note">매달 매출에서 나눠 받은 돈</span>
        </div>
        <div className="card earned">
          <dl className="earned-top">
            <div>
              <dt>{latest.month ? `${monthLabel(latest.month)} 매출분` : '최근'}</dt>
              <dd className="num is-strong">{won(latest.amount)}</dd>
            </div>
            <div>
              <dt>지금까지</dt>
              <dd className="num">{won(store.received)}</dd>
            </div>
            <div>
              <dt>원금 대비</dt>
              <dd className="num">{percent(account.cost > 0 ? (store.received / account.cost) * 100 : 0)}</dd>
            </div>
          </dl>
          {months.length > 0 && (
            <div className="bars" role="img" aria-label={`최근 ${months.length}개월 받은 돈`}>
              {months.map((month, index) => (
                <span key={month.month} className={`bars-col${index === months.length - 1 ? ' is-last' : ''}`}>
                  <em className="num">{Math.round(month.amount / 1000).toLocaleString('ko-KR')}천</em>
                  <i style={{ height: `${Math.max(6, (month.amount / maxMonth) * 100)}%` }} />
                  <span>{monthTick(month.month)}</span>
                </span>
              ))}
            </div>
          )}
          <p className="card-note">받은 돈은 예수금으로 들어와요. 세금을 떼기 전 금액이에요.</p>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="display">보유 가게</h2>
          <div className="mini-seg" role="group" aria-label="정렬">
            <button type="button" aria-pressed={sortKey === 'profit'} className={sortKey === 'profit' ? 'is-on' : ''} onClick={() => setSortKey('profit')}>
              수익률순
            </button>
            <button type="button" aria-pressed={sortKey === 'value'} className={sortKey === 'value' ? 'is-on' : ''} onClick={() => setSortKey('value')}>
              금액순
            </button>
          </div>
        </div>
        {positions.length === 0 ? (
          <p className="empty">
            아직 가진 조각이 없어요. <Link to="/app/market">마켓</Link>이나 <Link to="/app/offerings">공모</Link>에서 시작해 보세요.
          </p>
        ) : (
          <ul className="card list">
            {positions.map((position) => (
              <li key={position.offeringId}>
                <Link to={`/app/offerings/${position.offeringId}`} className="row">
                  <Photo imageKey={position.imageKey} className="row-thumb" />
                  <span className="row-main">
                    <strong>{position.name}</strong>
                    <span>
                      {position.city} · {position.lastPrice !== null ? `${position.pieces}조각` : '공모 참여 중'}
                      {position.received > 0 && ` · 받은 돈 ${won(position.received)}`}
                    </span>
                  </span>
                  <span className="row-side">
                    <strong className="num">{won(Math.round(position.value))}</strong>
                    {position.lastPrice !== null ? <Delta value={position.profitPercent} /> : <span className="metric">지급 전</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <p className="list-foot">수익률 = (평가금액 + 받은 돈 − 원금) ÷ 원금. 원금 {won(Math.round(account.cost))}</p>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="display">기다리는 주문</h2>
          <span className="section-note">{store.orders.length}건</span>
        </div>
        {store.orders.length === 0 ? (
          <p className="empty">가격을 정해 걸어 둔 주문이 없어요.</p>
        ) : (
          <ul className="card pending">
            {store.orders.map((order) => {
              const listing = names.get(order.offeringId);
              return (
                <li key={order.id}>
                  <Photo imageKey={listing?.imageKey} className="pending-thumb" />
                  <span className="pending-main">
                    <strong>
                      <span className={`side-chip side-chip--${order.side === 'BUY' ? 'buy' : 'sell'}`}>{order.side === 'BUY' ? '구매' : '판매'}</span>
                      {listing?.storeName}
                    </strong>
                    <span className="num">
                      {won(order.price)} × {order.remaining}조각{order.remaining !== order.quantity && ` (${order.quantity - order.remaining}조각 체결)`}
                    </span>
                  </span>
                  <button type="button" className="mini-x" aria-label={`${listing?.storeName ?? ''} ${order.side === 'BUY' ? '구매' : '판매'} 주문 취소`} onClick={() => cancelOrder(order.id)}>
                    <CloseIcon />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="section" id="perks">
        <div className="section-head">
          <h2 className="display">단골 혜택</h2>
          <span className="section-note">매장에서 인증하면 받아요</span>
        </div>
        {withPerks.length === 0 ? (
          <p className="empty">조각을 가진 가게의 단골 혜택이 여기에 모여요.</p>
        ) : (
          <ul className="card perks">
            {withPerks.map((position) => (
              <li key={position.offeringId}>
                <Photo imageKey={position.imageKey} className="pending-thumb" />
                <span className="pending-main">
                  <strong>{position.name}</strong>
                  <span>{position.perk?.replace('투자자 인증하면 ', '')}</span>
                </span>
                <button type="button" className="btn-pass" onClick={() => setPass(position)}>
                  인증
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {store.fills.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2 className="display">거래 내역</h2>
          </div>
          <ul className="card fills">
            {store.fills.slice(0, 6).map((fill) => (
              <li key={fill.id}>
                <span className={`side-chip side-chip--${fill.side === 'BUY' ? 'buy' : 'sell'}`}>{fill.side === 'BUY' ? '샀어요' : '팔았어요'}</span>
                <span className="fills-main">
                  <strong>{names.get(fill.offeringId)?.storeName}</strong>
                  <span className="num">
                    {won(fill.price)} × {fill.quantity}조각 · 수수료 {won(fill.fee)}
                  </span>
                </span>
                <span className="num fills-time">{timeLabel(fill.at)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="page-foot">
        예수금 {manwon(1_000_000)}은 시연용으로 넣어 둔 돈이에요. 조각 시세와 체결은 시연용이고, 공모 투자와 매달 받은 돈은 서버 기록이에요.
      </p>

      {pass && <PerkPass position={pass} onClose={() => setPass(null)} />}
    </div>
  );
}
