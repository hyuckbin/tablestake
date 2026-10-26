import type { FundingLimit, OfferingStatus } from '../lib/types';
import { manwon, monthLabel, percent } from '../lib/format';
import { StatusIcon } from '../components/Badges';

/**
 * 모집 한도 심사. 한도 = 최근 12개월 평균 매출 × 지급률 × 기간 ÷ 상환 배수.
 * 매출이 갑자기 튄 달(셀프 결제 의심)을 빼고 다시 계산해, 부풀린 매출로 한도를 키우지 못하게 한다.
 */
export function LimitReview({ limit, status }: { limit: FundingLimit; status?: OfferingStatus }) {
  const hasExcluded = limit.excludedMonths.length > 0;
  // basisMonths 는 의심 달을 뺀 뒤 평균에 쓴 달 수다.
  const totalMonths = limit.basisMonths + limit.excludedMonths.length;
  const allOk = limit.targetAmount <= limit.limitAll;
  const cleanOk = limit.targetAmount <= limit.limitClean;

  return (
    <section className="adm-card" aria-labelledby="limit-title">
      <div className="adm-card-head">
        <h2 id="limit-title">모집 한도 심사</h2>
        <span className="adm-card-sub">목표 {manwon(limit.targetAmount)}</span>
      </div>
      <p className="adm-hint">
        한도 = 최근 {totalMonths}개월 평균 매출 × {percent(limit.sharePercent, 0)} × {limit.termMonths}개월 ÷ {limit.capMultiple}배
      </p>

      <table className="adm-table limit-table">
        <thead>
          <tr>
            <th scope="col">기준</th>
            <th scope="col" className="num">평균 매출</th>
            <th scope="col" className="num">한도</th>
            <th scope="col">목표</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{totalMonths}개월 전체</td>
            <td className="num">{manwon(limit.averageRevenueAll)}</td>
            <td className="num">{manwon(limit.limitAll)}</td>
            <td>
              <Verdict ok={allOk} />
            </td>
          </tr>
          <tr className={hasExcluded ? 'is-key' : ''}>
            <td>{hasExcluded ? `의심 달 빼고 ${limit.basisMonths}개월` : '의심 달 빼고'}</td>
            <td className="num">{manwon(limit.averageRevenueClean)}</td>
            <td className="num">{manwon(limit.limitClean)}</td>
            <td>
              <Verdict ok={cleanOk} />
            </td>
          </tr>
        </tbody>
      </table>

      {hasExcluded ? (
        <p className={`limit-verdict${cleanOk ? '' : ' is-bad'}`}>
          {limit.excludedMonths.map((month) => monthLabel(month)).join(', ')} 매출이 평소보다 크게 튀어 계산에서 뺐어요.
          {cleanOk
            ? ' 빼고 계산해도 목표가 한도 안이에요.'
            : ` 빼고 계산하면 목표가 한도를 넘어요. ${status === 'REVIEW' ? '심사를 보류하고 소명을 받으세요.' : '추가 모집을 막으세요.'}`}
        </p>
      ) : (
        <p className="limit-verdict">튄 달이 없어 전체 평균으로 한도를 정했어요.</p>
      )}
    </section>
  );
}

function Verdict({ ok }: { ok: boolean }) {
  return (
    <span className={`verdict verdict--${ok ? 'ok' : 'bad'}`}>
      <StatusIcon tone={ok ? 'ok' : 'alert'} />
      {ok ? '한도 안' : '한도 초과'}
    </span>
  );
}
