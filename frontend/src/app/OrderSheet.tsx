import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { OfferingDetail } from '../lib/types';
import { percent, won } from '../lib/format';
import {
  BULK_QUANTITY,
  FEE_RATE,
  FEE_RATE_BULK,
  MAX_WAIT_DAYS,
  TICK,
  OrderRejected,
  availableCash,
  availablePieces,
  buyerAnnualReturn,
  cancelOrder,
  dayChange,
  feeOf,
  feeRate,
  monthsToCap,
  piecesOf,
  placeOrder,
  previewMarketOrder,
  type Level,
  type MarketState,
  type MarketStore,
  type OrderOutcome,
  type Side,
} from '../lib/market';
import { Delta, Photo } from './ui/bits';
import { CloseIcon } from './ui/Icons';

type OrderType = 'MARKET' | 'LIMIT';

/**
 * 구매·판매 주문 시트. 가게 화면 아래에서 올라오고, 오른쪽 위 X 로 언제든 닫는다(주문 취소).
 * 시안(04 Order) 구성: 구매/판매 → 바로/가격 지정 → 호가 + 가격·수량 → 요약 → 주문 버튼
 */
export function OrderSheet({
  detail,
  market,
  store,
  initialSide,
  onClose,
}: {
  detail: OfferingDetail;
  market: MarketState;
  store: MarketStore;
  initialSide: Side;
  onClose: () => void;
}) {
  const s = detail.summary;
  const e = market.economics;
  const [side, setSide] = useState<Side>(initialSide);
  const [type, setType] = useState<OrderType>('LIMIT');
  const [price, setPrice] = useState(() => bestPrice(market, initialSide));
  const [quantity, setQuantity] = useState(5);
  const [rejection, setRejection] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<OrderOutcome | null>(null);
  const [whyCeiling, setWhyCeiling] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  // 가게 화면은 시세가 바뀔 때마다 다시 그려진다. 닫기 함수가 바뀌어도 포커스를 다시 잡지 않도록 ref 로 들고 있는다.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, []);

  const cash = availableCash(store);
  const myPieces = piecesOf(store, s.id);
  const sellable = availablePieces(store, s.id);
  const change = dayChange(market).percent;
  const buying = side === 'BUY';

  function switchSide(next: Side) {
    setSide(next);
    setRejection(null);
    setPrice(bestPrice(market, next));
  }

  function pickLevel(level: Level) {
    setType('LIMIT');
    setPrice(level.price);
    setRejection(null);
  }

  // 미리 보기: 바로 구매·판매는 호가를 실제로 얼마나 먹는지, 가격 지정은 지정가 기준
  const preview = type === 'MARKET' ? previewMarketOrder(market, side, quantity) : { filled: quantity, amount: price * quantity };
  const amount = preview.amount;
  const fee = feeOf(amount, quantity);
  const total = buying ? amount + fee : amount - fee;
  const unitPrice = preview.filled > 0 ? Math.round(amount / preview.filled) : 0;
  const annualReturn = buying && unitPrice > 0 ? buyerAnnualReturn(unitPrice, e, feeRate(quantity)) : null;
  const overCeiling = buying && type === 'LIMIT' && price > e.remainingPerPiece;
  const outOfBand = type === 'LIMIT' && (price > market.upperLimit || price < market.lowerLimit);
  const shortCash = buying && total > cash;
  const shortPieces = !buying && quantity > sellable;
  const thinBook = type === 'MARKET' && preview.filled < quantity;

  const problem = overCeiling
    ? `천장(남은 상한 ${won(e.remainingPerPiece)})보다 비싸요. 이 가격에 사면 끝까지 받아도 손해라 주문할 수 없어요.`
    : outOfBand
      ? `오늘 가격 제한폭은 ${won(market.lowerLimit)}부터 ${won(market.upperLimit)}까지예요.`
      : shortCash
        ? `주문 가능 금액(${won(cash)})이 모자라요.`
        : shortPieces
          ? `팔 수 있는 조각은 ${sellable}조각이에요.`
          : thinBook
            ? `지금 호가로는 ${preview.filled}조각까지만 바로 체결돼요.`
            : null;

  function setByShare(share: number) {
    if (!buying) {
      setQuantity(Math.max(1, Math.floor(sellable * share)));
      return;
    }
    const unit = (type === 'LIMIT' ? price : bestPrice(market, 'BUY')) * (1 + FEE_RATE_BULK);
    setQuantity(Math.max(1, Math.floor((cash * share) / unit)));
  }

  function submit() {
    setRejection(null);
    try {
      setOutcome(placeOrder({ offeringId: s.id, side, type, quantity, price }));
    } catch (error) {
      setRejection(error instanceof OrderRejected ? error.message : '주문하지 못했어요.');
    }
  }

  const myOrders = store.orders.filter((order) => order.offeringId === s.id);
  const verb = buying ? '구매' : '판매';
  const ctaLabel = `${quantity}조각 ${type === 'MARKET' ? `바로 ${verb}` : `${verb} 주문`}`;

  return (
    <div className="sheet-layer" role="dialog" aria-modal="true" aria-labelledby="order-title">
      <button type="button" className="sheet-dim" aria-label="주문 닫기" tabIndex={-1} onClick={onClose} />
      <div className={`order-sheet order-sheet--${buying ? 'buy' : 'sell'}`}>
        <div className="sheet-grab" aria-hidden="true" />
        <header className="order-head">
          <Photo imageKey={s.imageKey} className="order-thumb" />
          <span className="order-name">
            <strong id="order-title">{s.storeName}</strong>
            <span>
              <b className="num">{market.lastPrice.toLocaleString('ko-KR')}원</b> <Delta value={change} />
            </span>
          </span>
          <button ref={closeRef} type="button" className="sheet-x" aria-label="주문 취소하고 닫기" onClick={onClose}>
            <CloseIcon />
          </button>
        </header>

        {outcome ? (
          <OrderResult outcome={outcome} storeName={s.storeName} onDone={onClose} onMore={() => setOutcome(null)} />
        ) : (
          <>
            <div className="order-tabs" role="tablist" aria-label="거래 구분">
              <button type="button" role="tab" aria-selected={buying} className={`order-tab is-buy${buying ? ' is-on' : ''}`} onClick={() => switchSide('BUY')}>
                구매
              </button>
              <button type="button" role="tab" aria-selected={!buying} className={`order-tab is-sell${!buying ? ' is-on' : ''}`} onClick={() => switchSide('SELL')}>
                판매
              </button>
            </div>

            <div className="seg seg--dark" role="group" aria-label="주문 방식">
              <button type="button" aria-pressed={type === 'MARKET'} className={type === 'MARKET' ? 'is-on' : ''} onClick={() => setType('MARKET')}>
                바로 {verb}
              </button>
              <button type="button" aria-pressed={type === 'LIMIT'} className={type === 'LIMIT' ? 'is-on' : ''} onClick={() => setType('LIMIT')}>
                가격 지정
              </button>
            </div>

            <div className="order-grid">
              <OrderBook market={market} selected={type === 'LIMIT' ? price : null} onPick={pickLevel} />

              <div className="order-inputs">
                {type === 'LIMIT' ? (
                  <div className={`order-box${overCeiling ? ' is-bad' : ''}`}>
                    <label className="order-box-label" htmlFor="order-price">
                      가격
                    </label>
                    <span className="order-price-field">
                      <input
                        id="order-price"
                        inputMode="numeric"
                        autoComplete="off"
                        value={price === 0 ? '' : price.toLocaleString('ko-KR')}
                        onChange={(event) => setPrice(Number(event.target.value.replace(/[^0-9]/g, '')) || 0)}
                        onBlur={() => setPrice((value) => Math.max(TICK, Math.round(value / TICK) * TICK))}
                      />
                      원
                    </span>
                    <div className="stepper">
                      <button type="button" aria-label="가격 내리기" onClick={() => setPrice((value) => Math.max(TICK, value - TICK))}>
                        −
                      </button>
                      <button type="button" aria-label="가격 올리기" onClick={() => setPrice((value) => value + TICK)}>
                        +
                      </button>
                    </div>
                    <span className="order-box-help">{overCeiling ? `천장 ${won(e.remainingPerPiece)} 초과` : `호가 단위 ${TICK}원`}</span>
                  </div>
                ) : (
                  <div className="order-box">
                    <span className="order-box-label">{buying ? '가장 싼 조각부터' : '가장 비싼 주문부터'}</span>
                    <strong className="order-box-value num">{unitPrice > 0 ? won(unitPrice) : '-'}</strong>
                    <span className="order-box-help">예상 평균 가격</span>
                  </div>
                )}

                <div className="order-box">
                  <span className="order-box-label">수량</span>
                  <strong className="order-box-value num">
                    {quantity}
                    <small>조각</small>
                  </strong>
                  <div className="stepper">
                    <button type="button" aria-label="수량 줄이기" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>
                      −
                    </button>
                    <button type="button" aria-label="수량 늘리기" onClick={() => setQuantity((value) => value + 1)}>
                      +
                    </button>
                  </div>
                </div>

                <div className="share-buttons" role="group" aria-label="비율로 수량 정하기">
                  {[0.1, 0.25, 0.5].map((share) => (
                    <button key={share} type="button" onClick={() => setByShare(share)}>
                      {share * 100}%
                    </button>
                  ))}
                  <button type="button" className="is-max" onClick={() => setByShare(1)}>
                    최대
                  </button>
                </div>

                <dl className="order-available">
                  {buying ? (
                    <div>
                      <dt>주문 가능</dt>
                      <dd className="num">{won(cash)}</dd>
                    </div>
                  ) : (
                    <div>
                      <dt>팔 수 있는</dt>
                      <dd className="num">{sellable}조각</dd>
                    </div>
                  )}
                  <div>
                    <dt>내 조각</dt>
                    <dd className="num">{myPieces}조각</dd>
                  </div>
                </dl>
              </div>
            </div>

            <section className="order-summary">
              <div className="order-row">
                <span>{type === 'MARKET' ? '예상 체결 금액' : '주문 금액'}</span>
                <strong className="num">{won(amount)}</strong>
              </div>
              <div className="order-row">
                <span>수수료 ({quantity >= BULK_QUANTITY ? `${BULK_QUANTITY}조각 이상 ${percent(FEE_RATE_BULK * 100)}` : percent(FEE_RATE * 100, 0)})</span>
                <strong className="num">{won(fee)}</strong>
              </div>
              {buying ? (
                <>
                  <div className="order-row">
                    <span>예상 월 지급 (세전)</span>
                    <strong className="num is-good">약 {won(Math.round(e.monthlyPerPiece * quantity))}</strong>
                  </div>
                  <div className="order-row">
                    <span>남은 상한까지 받으면</span>
                    <strong className="num">
                      {won(e.remainingPerPiece * quantity)} ({monthsToCap(e)}개월)
                    </strong>
                  </div>
                  {annualReturn !== null && (
                    <div className="order-row">
                      <span>이 가격이면 연 수익률</span>
                      <strong className={`num ${annualReturn < 0 ? 'is-bad' : 'is-good'}`}>{percent(annualReturn)}</strong>
                    </div>
                  )}
                </>
              ) : (
                <div className="order-row">
                  <span>대신 포기하는 남은 지급</span>
                  <strong className="num">최대 {won(e.remainingPerPiece * quantity)}</strong>
                </div>
              )}
              <div className="order-row order-row--total">
                <span>{buying ? '총 결제 금액' : '받을 돈'}</span>
                <strong className="num">{won(total)}</strong>
              </div>
              {buying && quantity < BULK_QUANTITY && (
                <p className="order-tip">
                  <span>TIP</span>
                  {BULK_QUANTITY}조각 이상 사면 수수료 {percent(FEE_RATE * 100, 0)}가 {percent(FEE_RATE_BULK * 100)}로 내려가요.
                </p>
              )}
            </section>

            {(problem || rejection) && (
              <p className="order-problem" role="alert">
                {rejection ?? problem}
                {overCeiling && (
                  <button type="button" className="link-btn" onClick={() => setWhyCeiling((value) => !value)}>
                    왜 천장이 있나요?
                  </button>
                )}
              </p>
            )}
            {whyCeiling && <CeilingCard market={market} />}

            <p className="order-note">
              {type === 'LIMIT' ? `가격 지정 주문은 체결될 때까지 최대 ${MAX_WAIT_DAYS}일 기다려요. 기다리는 주문은 X로 취소할 수 있어요.` : '바로 체결되지 않은 수량은 주문하지 않아요.'}
            </p>

            {myOrders.length > 0 && (
              <ul className="pending pending--sheet">
                {myOrders.map((pending) => (
                  <li key={pending.id}>
                    <span className={`side-chip side-chip--${pending.side === 'BUY' ? 'buy' : 'sell'}`}>{pending.side === 'BUY' ? '구매' : '판매'}</span>
                    <span className="num">
                      {won(pending.price)} · {pending.remaining}조각 대기
                    </span>
                    <button type="button" className="mini-x" aria-label={`${won(pending.price)} ${pending.remaining}조각 주문 취소`} onClick={() => cancelOrder(pending.id)}>
                      <CloseIcon />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="order-cta">
              <button type="button" className={`order-submit order-submit--${buying ? 'buy' : 'sell'}`} disabled={!!problem || quantity < 1} onClick={submit}>
                {ctaLabel}
                <small className="num">{won(total)}</small>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function bestPrice(market: MarketState, side: Side): number {
  const levels = side === 'BUY' ? market.asks : market.bids;
  return levels.find((level) => level.quantity > level.mine)?.price ?? market.lastPrice;
}

function OrderBook({ market, selected, onPick }: { market: MarketState; selected: number | null; onPick: (level: Level) => void }) {
  const asks = market.asks.slice(0, 5).reverse();
  const bids = market.bids.slice(0, 5);
  const max = Math.max(1, ...asks.map((level) => level.quantity), ...bids.map((level) => level.quantity));
  const reference = market.prevClose;
  const tone = (price: number) => (price > reference ? 'is-up' : price < reference ? 'is-down' : '');
  const change = dayChange(market).percent;

  const row = (level: Level, kind: 'ask' | 'bid') => (
    <li key={`${kind}-${level.price}`}>
      <button
        type="button"
        className={`book-row book-row--${kind}${selected === level.price ? ' is-selected' : ''}`}
        onClick={() => onPick(level)}
        aria-label={`${level.price.toLocaleString('ko-KR')}원, ${kind === 'ask' ? '팔려는' : '사려는'} 조각 ${level.quantity}개${level.mine > 0 ? `, 내 주문 ${level.mine}개` : ''}`}
      >
        <span className={`book-price num ${tone(level.price)}`}>{level.price.toLocaleString('ko-KR')}</span>
        <span className="book-qty num">
          <i style={{ width: `${(level.quantity / max) * 100}%` }} aria-hidden="true" />
          {level.mine > 0 && <em className="book-mine">내 {level.mine}</em>}
          <span>{level.quantity}</span>
        </span>
      </button>
    </li>
  );

  return (
    <div className="book" aria-label="호가">
      <ul className="book-side">{asks.map((level) => row(level, 'ask'))}</ul>
      <div className="book-last">
        <strong className="num">{market.lastPrice.toLocaleString('ko-KR')}</strong>
        <Delta value={change} />
      </div>
      <ul className="book-side">{bids.map((level) => row(level, 'bid'))}</ul>
    </div>
  );
}

function CeilingCard({ market }: { market: MarketState }) {
  const e = market.economics;
  return (
    <section className="ceiling-card">
      <h3>조각 가격에는 천장이 있어요</h3>
      <dl>
        <div>
          <dt>조각 하나가 받을 수 있는 최대 (1.3배에서 수수료 뺀 값)</dt>
          <dd className="num">{won(e.capPerPiece)}</dd>
        </div>
        <div>
          <dt>지금까지 조각당 받은 돈</dt>
          <dd className="num">−{won(e.paidPerPiece)}</dd>
        </div>
        <div className="ceiling-total">
          <dt>남은 상한 = 살 수 있는 가장 비싼 값</dt>
          <dd className="num">{won(e.remainingPerPiece)}</dd>
        </div>
      </dl>
      <p>이보다 비싸게 사면 끝까지 받아도 손해라서 주문을 막아요. 가격이 오를수록 이 천장에 가까워지니, 코인처럼 끝없이 오를 수 없어요.</p>
    </section>
  );
}

function OrderResult({ outcome, storeName, onDone, onMore }: { outcome: OrderOutcome; storeName: string; onDone: () => void; onMore: () => void }) {
  const verb = outcome.side === 'BUY' ? '샀어요' : '팔았어요';
  return (
    <div className="order-result">
      <div className={`result-mark result-mark--${outcome.side === 'BUY' ? 'buy' : 'sell'}`} aria-hidden="true">
        <svg viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="22" />
          <path d="M14 24.5l7 7 13-14" />
        </svg>
      </div>
      <h3>{outcome.filled > 0 ? `${storeName} 조각 ${outcome.filled}개를 ${verb}` : '주문을 걸어 뒀어요'}</h3>
      <dl className="result-lines">
        {outcome.filled > 0 && (
          <>
            <div>
              <dt>평균 가격</dt>
              <dd className="num">{won(outcome.averagePrice)}</dd>
            </div>
            <div>
              <dt>체결 금액</dt>
              <dd className="num">{won(outcome.amount)}</dd>
            </div>
            <div>
              <dt>수수료</dt>
              <dd className="num">{won(outcome.fee)}</dd>
            </div>
          </>
        )}
        {outcome.resting > 0 && (
          <div>
            <dt>기다리는 주문</dt>
            <dd className="num">
              {won(outcome.restingPrice)}에 {outcome.resting}조각
            </dd>
          </div>
        )}
      </dl>
      {outcome.side === 'BUY' && outcome.filled > 0 && <p className="result-note">다음 정산부터 산 조각만큼 매출 지급을 받아요.</p>}
      {outcome.resting > 0 && (
        <p className="result-note">
          가격이 맞는 상대가 나타나면 체결돼요. <Link to="/app/portfolio">내 자산</Link>에서 X로 취소할 수 있어요.
        </p>
      )}
      <div className="result-actions">
        <button type="button" className="btn-ghost" onClick={onMore}>
          더 주문하기
        </button>
        <button type="button" className="btn-dark" onClick={onDone}>
          확인
        </button>
      </div>
    </div>
  );
}
