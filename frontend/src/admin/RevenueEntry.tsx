import { useState } from 'react';
import { api, ApiError } from '../lib/api';
import { emit } from '../lib/sync';
import type { RevenueBoard, RevenueRegisterResult } from '../lib/types';
import { monthLabel, nextMonthOf, percent, roundThousand, won } from '../lib/format';
import { SeverityBadge, StatusIcon, VerificationBadge } from '../components/Badges';
import { ErrorNote } from '../components/ErrorNote';

type Scenario = 'normal' | 'self' | 'cash';

const SCENARIOS: { id: Scenario; label: string; description: string }[] = [
  { id: 'normal', label: '평소 매출', description: '평소와 비슷한 매출, 평소와 같은 카드 결제 비중.' },
  {
    id: 'self',
    label: '셀프 결제로 부풀리기',
    description: '사장이 자기 카드로 결제해 매출을 35% 부풀린 경우. 모집 한도를 키우려는 수법이에요.',
  },
  {
    id: 'cash',
    label: '현금 결제 유도',
    description: '현금 결제를 유도해 카드 결제 비중이 25%p 떨어진 경우. 신고에서 현금 매출이 빠질 수 있어요.',
  },
];

/**
 * 월 매출 등록. 실제 서비스에서는 POS·카드사(여신금융협회)·홈택스 연동으로 들어올 값을
 * 시연에서는 손으로 넣는다. 시나리오 버튼은 이 가게의 평소 매출로 입력값을 채워 준다.
 */
export function RevenueEntry({ storeId, board }: { storeId: number; board: RevenueBoard }) {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [reported, setReported] = useState(0);
  const [card, setCard] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [result, setResult] = useState<RevenueRegisterResult | null>(null);

  const month = board.nextMonth;
  const open = board.nextMonthRegistrable;
  const baseline = board.baselineCardRatioPercent / 100;
  const ratio = reported > 0 ? (card / reported) * 100 : 0;

  function apply(next: Scenario) {
    const values = scenarioValues(next, board.medianRevenue, baseline);
    setScenario(next);
    setReported(values.reported);
    setCard(values.card);
    setError(null);
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const response = await api.post<RevenueRegisterResult>(`/api/admin/stores/${storeId}/revenues`, {
        month,
        reportedRevenue: reported,
        cardRevenue: card,
      });
      setResult(response);
      setScenario(null);
      setReported(0);
      setCard(0);
      emit({ type: 'revenue', storeId });
    } catch (reason) {
      setError(reason instanceof ApiError ? reason : null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="adm-card" aria-labelledby="entry-title">
      <div className="adm-card-head">
        <h2 id="entry-title">월 매출 등록</h2>
        <span className="adm-card-sub">마감된 달만, 한 달씩 순서대로</span>
      </div>

      {open ? (
        <>
          <p className="adm-entry-month">{monthLabel(month, true)} 매출</p>
          <div className="scenario" role="group" aria-label="시연 시나리오로 채우기">
            {SCENARIOS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`scenario-btn scenario-btn--${item.id}${scenario === item.id ? ' is-on' : ''}`}
                aria-pressed={scenario === item.id}
                onClick={() => apply(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          {scenario && <p className="adm-hint">{SCENARIOS.find((item) => item.id === scenario)?.description}</p>}

          <div className="entry-fields">
            <MoneyField label="신고 매출" value={reported} onChange={setReported} />
            <MoneyField label="카드사 승인 매출" value={card} onChange={setCard} />
          </div>
          <p className="entry-ratio">
            카드 결제 비중 <strong className="num">{reported > 0 ? percent(ratio) : '-'}</strong>
            <span>평소 {percent(board.baselineCardRatioPercent)}</span>
          </p>

          <button type="button" className="btn btn--primary" disabled={busy || reported <= 0} onClick={submit}>
            {busy ? '등록하는 중' : `${monthLabel(month)} 매출 등록하기`}
          </button>
        </>
      ) : (
        <p className="adm-hint adm-entry-closed">
          {monthLabel(board.lastClosedMonth, true)}까지 등록을 마쳤어요. {monthLabel(month)} 매출은 {monthLabel(nextMonthOf(month))} 1일에
          마감되면 등록할 수 있어요.
        </p>
      )}

      {error && <ErrorNote error={error} />}

      {result && (
        <div className="entry-result" aria-live="polite">
          <p className="entry-result-head">
            {monthLabel(result.month, true)} 등록 완료
            <span className="num">
              {won(result.reportedRevenue)}, 카드 {percent(result.cardRatioPercent)}
            </span>
          </p>
          {result.alerts.length === 0 ? (
            <p className="entry-clean">
              <StatusIcon tone="ok" />
              이상 신호가 없어요.
            </p>
          ) : (
            <ul className="entry-alerts">
              {result.alerts.map((alert) => (
                <li key={alert.type}>
                  <SeverityBadge severity={alert.severity} label={alert.title} />
                  <span className="entry-metric num">{alert.metric}</span>
                  <p>{alert.message}</p>
                </li>
              ))}
            </ul>
          )}
          <p className="entry-status">
            가게 상태 <VerificationBadge status={result.verification.status} label={result.verification.statusLabel} prefix="" />
          </p>
        </div>
      )}
    </section>
  );
}

function MoneyField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="money-field">
      <span>{label}</span>
      <span className="money-input">
        <input
          inputMode="numeric"
          autoComplete="off"
          value={value === 0 ? '' : value.toLocaleString('ko-KR')}
          placeholder="0"
          onChange={(event) => onChange(Number(event.target.value.replace(/[^0-9]/g, '')) || 0)}
        />
        <span>원</span>
      </span>
    </label>
  );
}

function scenarioValues(scenario: Scenario, median: number, baseline: number): { reported: number; card: number } {
  if (scenario === 'self') {
    const reported = roundThousand(median * 1.35);
    return { reported, card: Math.min(reported, roundThousand(reported * Math.min(0.99, baseline + 0.04))) };
  }
  if (scenario === 'cash') {
    const reported = roundThousand(median * 0.98);
    return { reported, card: roundThousand(reported * Math.max(0, baseline - 0.25)) };
  }
  const reported = roundThousand(median * 1.01);
  return { reported, card: roundThousand(reported * baseline) };
}
