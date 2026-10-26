import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, ApiError } from '../lib/api';
import { emit } from '../lib/sync';
import { useApi } from '../lib/useApi';
import { availableCash, spendCash, useMarketState } from '../lib/market';
import type { InvestmentResult, OfferingDetail, Simulation } from '../lib/types';
import { manwon, percent, won } from '../lib/format';
import { ErrorNote } from '../components/ErrorNote';
import { Photo } from './ui/bits';
import { BackIcon } from './ui/Icons';

const UNIT = 10_000;
const QUICK_ADD = [10_000, 100_000, 500_000, 1_000_000];

/** 공모 청약: 1만 원 단위로 넣고, 예상 월 지급을 바로 계산해 보여 준다. */
export function InvestPage() {
  const { offeringId } = useParams();
  const navigate = useNavigate();
  const detail = useApi<OfferingDetail>(`/api/offerings/${offeringId}`);
  const store = useMarketState();
  const [amount, setAmount] = useState(100_000);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<ApiError | null>(null);
  const [result, setResult] = useState<InvestmentResult | null>(null);

  const d = detail.data;
  const cash = availableCash(store);
  const maxInvestable = d ? Math.max(0, Math.min(d.remainingAmount, d.perInvestorLimit - d.myInvestedAmount)) : 0;
  const problem = d ? validate(amount, maxInvestable, cash) : null;
  const debounced = useDebounced(amount, 250);
  const simulationPath = d && !validate(debounced, maxInvestable, Number.MAX_SAFE_INTEGER) ? `/api/offerings/${offeringId}/simulation?amount=${debounced}` : null;
  const simulation = useApi<Simulation>(simulationPath);

  async function submit() {
    if (!d || problem || !agreed) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await api.post<InvestmentResult>(`/api/offerings/${d.summary.id}/investments`, { amount });
      spendCash(amount);
      setResult(response);
      emit({ type: 'invested', offeringId: d.summary.id });
    } catch (error) {
      setSubmitError(error instanceof ApiError ? error : null);
    } finally {
      setSubmitting(false);
    }
  }

  const back = (
    <button type="button" className="round-btn round-btn--light" aria-label="뒤로" onClick={() => navigate(`/app/offerings/${offeringId}`)}>
      <BackIcon />
    </button>
  );

  if (!d) {
    return (
      <div className="page page--invest">
        <header className="invest-head">{back}</header>
        {detail.error && <ErrorNote error={detail.error} />}
      </div>
    );
  }

  if (result) return <InvestDone result={result} imageKey={d.summary.imageKey} />;
  const p = simulation.data?.projection;

  return (
    <div className="page page--invest has-sticky">
      <header className="invest-head">
        {back}
        <span>공모 청약</span>
      </header>

      <div className="invest-store">
        <Photo imageKey={d.summary.imageKey} className="row-thumb" />
        <span>
          <strong>{d.summary.storeName}</strong>
          <span>{d.summary.title}</span>
        </span>
      </div>

      <h1 className="invest-q">얼마를 투자할까요?</h1>

      <label className="amount-field">
        <span className="visually-hidden">투자 금액</span>
        <input
          inputMode="numeric"
          autoComplete="off"
          value={amount === 0 ? '' : amount.toLocaleString('ko-KR')}
          placeholder="0"
          onChange={(event) => setAmount(Number(event.target.value.replace(/[^0-9]/g, '')) || 0)}
          aria-describedby="amount-help"
        />
        <span className="amount-unit">원</span>
      </label>
      <p className="amount-pieces">{amount >= UNIT ? `${Math.floor(amount / UNIT)}조각` : '1조각 = 1만 원'}</p>

      <div className="chip-row chip-row--tight" role="group" aria-label="금액 더하기">
        {QUICK_ADD.map((add) => (
          <button key={add} type="button" className="chip" onClick={() => setAmount((value) => value + add)}>
            +{manwon(add).replace(' 원', '')}
          </button>
        ))}
        <button type="button" className="chip chip--quiet" onClick={() => setAmount(0)}>
          지우기
        </button>
      </div>

      <p id="amount-help" className={`amount-help${problem ? ' is-problem' : ''}`}>
        {problem ?? `최대 ${won(Math.min(maxInvestable, Math.floor(cash / UNIT) * UNIT))}까지 넣을 수 있어요.`}
      </p>

      <dl className="card limits">
        <div>
          <dt>예수금</dt>
          <dd className="num">{won(Math.round(cash))}</dd>
        </div>
        <div>
          <dt>남은 모집 금액</dt>
          <dd className="num">{won(d.remainingAmount)}</dd>
        </div>
        <div>
          <dt>한 사람 한도</dt>
          <dd className="num">
            {won(d.perInvestorLimit)}
            {d.myInvestedAmount > 0 && <span className="limits-sub"> (이미 {won(d.myInvestedAmount)})</span>}
          </dd>
        </div>
      </dl>

      <section className={`card sim${simulation.loading || debounced !== amount ? ' is-stale' : ''}`} aria-live="polite">
        {p && !problem ? (
          <dl className="sim-lines">
            <div>
              <dt>매달 약</dt>
              <dd className="num">{won(p.monthlyPayout)}</dd>
            </div>
            <div>
              <dt>{p.expectedMonths}개월 동안 모두 받으면</dt>
              <dd className="num">{won(p.expectedTotal)}</dd>
            </div>
            <div className="sim-total">
              <dt>연 수익률로 치면</dt>
              <dd className="num">{percent(p.annualReturnPercent)}</dd>
            </div>
          </dl>
        ) : (
          <p className="card-note">금액을 넣으면 매달 받을 돈을 계산해 드려요.</p>
        )}
        <p className="card-note">
          정산 수수료 {percent(d.settlementFeePercent, 0)}를 뺀 금액이에요. 최근 12개월 평균 매출이 그대로 이어진다고 보고 계산했어요. 매출이 줄면 받는 돈도
          줄어요.
        </p>
      </section>

      <label className="agree">
        <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />
        <span>원금을 잃을 수 있고, 공모 상품은 만기까지 보유해야 한다는 점을 확인했어요.</span>
      </label>

      {submitError && <ErrorNote error={submitError} />}

      <div className="sticky-bar sticky-bar--plain">
        <div className="sticky-actions sticky-actions--one">
          <button type="button" className="btn-invest" disabled={!!problem || !agreed || submitting} onClick={submit}>
            {submitting ? '투자하는 중' : `${won(amount)} 투자하기`}
          </button>
        </div>
      </div>
    </div>
  );
}

function InvestDone({ result, imageKey }: { result: InvestmentResult; imageKey: string }) {
  const rate = (result.raisedAmount / result.targetAmount) * 100;
  return (
    <div className="page page--done">
      <div className="done-photo">
        <Photo imageKey={imageKey} />
      </div>
      <div className="result-mark result-mark--sun" aria-hidden="true">
        <svg viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="22" />
          <path d="M14 24.5l7 7 13-14" />
        </svg>
      </div>
      <h1 className="done-title">
        {result.storeName}에
        <br />
        {won(result.amount)} 투자했어요
      </h1>
      <div className="card done-card">
        <div className="funding-top">
          <span>
            <strong className="num">{manwon(result.raisedAmount)}</strong> / {manwon(result.targetAmount)}
          </span>
          <span className="num funding-rate">{percent(rate, 0)}</span>
        </div>
        <div className="funding-track" aria-hidden="true">
          <i style={{ width: `${Math.min(100, rate)}%` }} />
        </div>
        <p className="card-note">이 공모에 넣은 돈은 모두 {won(result.myTotalInOffering)}이에요. 예수금에서 빠져나갔어요.</p>
      </div>
      <p className="done-next">
        {result.offeringStatus === 'FUNDED'
          ? '목표 금액이 다 모였어요. 지급이 시작되면 매달 매출의 5%를 나눠 받아요.'
          : '모집이 끝나고 지급이 시작되면 매달 매출의 5%를 투자금 비율대로 나눠 받아요. 단골 혜택은 지금부터 받을 수 있어요.'}
      </p>
      <div className="done-actions">
        <Link to="/app/portfolio" className="btn-dark btn-block">
          내 자산 보기
        </Link>
        <Link to="/app/offerings" className="btn-ghost btn-block">
          다른 공모 보기
        </Link>
      </div>
    </div>
  );
}

function validate(amount: number, max: number, cash: number): string | null {
  if (amount < UNIT) return '1만 원부터 투자할 수 있어요.';
  if (amount % UNIT !== 0) return '1만 원 단위로 넣어 주세요.';
  if (max < UNIT) return '이 공모에는 더 투자할 수 없어요.';
  if (amount > max) return `최대 ${won(max)}까지 넣을 수 있어요.`;
  if (amount > cash) return `예수금(${won(Math.round(cash))})이 모자라요. 내 자산에서 입금할 수 있어요.`;
  return null;
}

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
