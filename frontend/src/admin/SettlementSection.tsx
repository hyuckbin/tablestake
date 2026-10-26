import { useState } from 'react';
import { api, ApiError } from '../lib/api';
import { emit } from '../lib/sync';
import { useApi } from '../lib/useApi';
import type { RevenueBoard, Settlement, SettlementBoard } from '../lib/types';
import { manwon, monthLabel, percent, won } from '../lib/format';
import { Meter } from '../components/Meter';
import { ErrorNote } from '../components/ErrorNote';
import { StatusIcon } from '../components/Badges';

const SHOWN_LINES = 5;

/**
 * 지급 중인 상품의 월 정산.
 * 정산 = 그 달 신고 매출 × 지급률(5%)을 투자금 비율대로 나누는 일. 이상 탐지 경고가 있으면 서버가 보류한다.
 */
export function SettlementSection({ offeringId, board }: { offeringId: number; board: RevenueBoard }) {
  const settlements = useApi<SettlementBoard>(`/api/admin/offerings/${offeringId}/settlements`);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Settlement | null>(null);
  const [hold, setHold] = useState<{ month: string; error: ApiError } | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  if (!settlements.data) {
    return <section className="adm-card adm-card--wide">{settlements.error && <ErrorNote error={settlements.error} />}</section>;
  }

  const s = settlements.data;
  const next = s.nextSettlementMonth;
  const revenueReady = next !== null && board.rows.some((row) => row.month === next);
  const monthClosed = next !== null && next <= board.lastClosedMonth;

  async function settle(month: string, anomalyConfirmed: boolean) {
    setBusy(true);
    setError(null);
    try {
      const response = await api.post<Settlement>(`/api/admin/offerings/${offeringId}/settlements`, { month, anomalyConfirmed });
      setResult(response);
      setHold(null);
      emit({ type: 'settled', settlement: response });
    } catch (reason) {
      if (reason instanceof ApiError && reason.code === 'SETTLEMENT_ON_HOLD') {
        setHold({ month, error: reason });
        setResult(null);
      } else {
        setError(reason instanceof ApiError ? reason : null);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="adm-card adm-card--wide" aria-labelledby="settle-title">
      <div className="adm-card-head">
        <h2 id="settle-title">월 정산</h2>
        <span className="adm-card-sub">
          매달 신고 매출의 {percent(s.sharePercent, 0)}를 받아 수수료 {percent(s.settlementFeePercent, 0)}를 떼고 투자자에게
        </span>
      </div>

      <dl className="adm-stats">
        <div>
          <dt>모은 돈</dt>
          <dd>{manwon(s.raisedAmount)}</dd>
          <dd className="adm-stats-sub">
            가게 수령 {manwon(s.storeReceivedAmount)} (모집 수수료 {percent(s.recruitFeePercent, 0)})
          </dd>
        </div>
        <div>
          <dt>상환 상한 ({s.capMultiple}배)</dt>
          <dd>{manwon(s.repaymentCap)}</dd>
        </div>
        <div>
          <dt>가게가 지금까지 낸 돈</dt>
          <dd>{won(s.totalPaid)}</dd>
        </div>
        <div>
          <dt>지급률</dt>
          <dd>매출의 {percent(s.sharePercent, 0)}</dd>
          <dd className="adm-stats-sub">정산 수수료 {percent(s.settlementFeePercent, 0)}는 투자자 몫에서</dd>
        </div>
      </dl>
      <div className="adm-progress">
        <Meter value={s.repaymentProgressPercent} label="상환 진행률" size="thick" />
        <span className="num">{percent(s.repaymentProgressPercent)}</span>
      </div>

      {hold ? (
        <HoldNotice
          month={hold.month}
          error={hold.error}
          busy={busy}
          onConfirm={() => settle(hold.month, true)}
          onCancel={() => setHold(null)}
        />
      ) : next ? (
        <div className="adm-settle-action">
          <div>
            <p className="adm-settle-month">{monthLabel(next, true)} 매출분 정산 차례</p>
            <p className="adm-hint">
              {revenueReady
                ? `이 달 신고 매출의 ${percent(s.sharePercent, 0)}에서 정산 수수료 ${percent(s.settlementFeePercent, 0)}를 빼고 투자자 전원에게 투자금 비율대로 나눠요.`
                : monthClosed
                  ? `${monthLabel(next)} 매출이 아직 없어요. 아래에서 매출을 먼저 등록하세요.`
                  : `${monthLabel(next)}이 끝나고 매출이 마감되면 정산해요.`}
            </p>
          </div>
          <button type="button" className="btn btn--primary" disabled={busy || !revenueReady} onClick={() => settle(next, false)}>
            {busy ? '정산하는 중' : `${monthLabel(next)} 정산하기`}
          </button>
        </div>
      ) : (
        <p className="adm-hint">{s.statusLabel} 상태라 더 정산할 달이 없어요.</p>
      )}

      {error && <ErrorNote error={error} />}
      {result && <SettlementResult settlement={result} />}

      {s.settlements.length > 0 && (
        <details className="adm-history">
          <summary>정산 기록 {s.settlements.length}건</summary>
          <table className="adm-table">
            <thead>
              <tr>
                <th scope="col">월</th>
                <th scope="col" className="num">기준 매출</th>
                <th scope="col" className="num">가게가 낸 돈</th>
                <th scope="col" className="num">투자자 몫</th>
                <th scope="col">비고</th>
              </tr>
            </thead>
            <tbody>
              {s.settlements.map((row) => (
                <tr key={row.id}>
                  <td>{monthLabel(row.month, true)}</td>
                  <td className="num">{won(row.baseRevenue)}</td>
                  <td className="num">{won(row.paidAmount)}</td>
                  <td className="num">{won(row.paidAmount - row.platformFee)}</td>
                  <td>{row.anomalyOverridden ? '이상 신호 확인 후 정산' : row.capReached ? '상한 도달' : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </section>
  );
}

function HoldNotice(props: { month: string; error: ApiError; busy: boolean; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="hold" role="alert">
      <div className="hold-stamp" aria-hidden="true">
        <span>정산</span>
        <span>보류</span>
      </div>
      <div className="hold-body">
        <p className="hold-title">{monthLabel(props.month, true)} 정산을 멈췄어요</p>
        <p className="adm-hint">{props.error.message}</p>
        <ul>
          {props.error.details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
        <p className="adm-hint">
          가게에 소명 자료(현금 매출 장부, POS 기록)를 받아 확인한 뒤에만 진행하세요. 진행하면 투자자 영수증에 확인 후 정산했다고 표시돼요.
        </p>
        <div className="hold-actions">
          <button type="button" className="btn btn--danger" disabled={props.busy} onClick={props.onConfirm}>
            확인했어요, 정산 진행
          </button>
          <button type="button" className="btn btn--quiet" onClick={props.onCancel}>
            보류 유지
          </button>
        </div>
      </div>
    </div>
  );
}

function SettlementResult({ settlement }: { settlement: Settlement }) {
  const matches = settlement.payoutSum === settlement.investorAmount;
  const me = settlement.payouts.filter((line) => line.demoUser);
  const top = settlement.payouts.filter((line) => !line.demoUser).slice(0, SHOWN_LINES);
  const rest = settlement.payouts.length - top.length - me.length;

  return (
    <div className="settle-result">
      <p className="settle-formula">
        <span>{monthLabel(settlement.month, true)} 신고 매출</span>
        <strong className="num">{won(settlement.baseRevenue)}</strong>
        <span>× {percent(settlement.sharePercent, 0)} =</span>
        <strong className="num">{won(settlement.paidAmount)}</strong>
      </p>
      <p className="settle-formula">
        <span>정산 수수료</span>
        <strong className="num">{won(settlement.platformFee)}</strong>
        <span>빼고</span>
        <strong className="num">{won(settlement.investorAmount)}</strong>
        <span>을 투자자 {settlement.payoutCount}명에게 나눔</span>
      </p>
      {settlement.paidAmount < settlement.grossAmount && (
        <p className="adm-hint">상환 상한에 닿아 {won(settlement.grossAmount)} 중 {won(settlement.paidAmount)}만 지급했어요.</p>
      )}

      <table className="adm-table">
        <thead>
          <tr>
            <th scope="col">투자자</th>
            <th scope="col" className="num">투자금</th>
            <th scope="col" className="num">받는 돈</th>
          </tr>
        </thead>
        <tbody>
          {me.map((line) => (
            <tr key={`me-${line.investmentAmount}`} className="is-me">
              <td>{line.investorNickname} (시연 휴대폰)</td>
              <td className="num">{won(line.investmentAmount)}</td>
              <td className="num">{won(line.amount)}</td>
            </tr>
          ))}
          {top.map((line, index) => (
            <tr key={`${line.investorNickname}-${index}`}>
              <td>{line.investorNickname}</td>
              <td className="num">{won(line.investmentAmount)}</td>
              <td className="num">{won(line.amount)}</td>
            </tr>
          ))}
          {rest > 0 && (
            <tr className="is-rest">
              <td colSpan={3}>그 밖에 {rest}명</td>
            </tr>
          )}
        </tbody>
      </table>

      <p className={`settle-check${matches ? '' : ' is-bad'}`}>
        <StatusIcon tone={matches ? 'ok' : 'alert'} />
        나눈 돈 합계 {won(settlement.payoutSum)} {matches ? '=' : '≠'} 투자자 몫 {won(settlement.investorAmount)}
        {matches && <span className="settle-check-sub">원 단위 끝수까지 남김없이 나눴어요</span>}
      </p>
    </div>
  );
}
