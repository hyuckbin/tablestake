import { useState } from 'react';
import type { RevenueRow } from '../lib/types';
import { monthLabel, monthRange, percent, won } from '../lib/format';
import { RevenueChart } from '../components/RevenueChart';
import { SeverityBadge } from '../components/Badges';

/** 월 매출 기록. rows 는 최신 달부터 온다. */
export function RevenueHistory({ rows }: { rows: RevenueRow[] }) {
  const [showAll, setShowAll] = useState(false);
  const ascending = [...rows].reverse();
  const visible = showAll ? rows : rows.slice(0, 12);

  return (
    <section className="adm-card adm-card--wide adm-history-card" aria-labelledby="history-title">
      <div className="adm-card-head">
        <h2 id="history-title">매출 기록</h2>
        {ascending.length > 0 && (
          <span className="adm-card-sub">
            신고 매출, {monthRange(ascending[0].month, ascending[ascending.length - 1].month)}
          </span>
        )}
      </div>

      <RevenueChart rows={ascending} plotHeight={170} tickEvery={ascending.length > 14 ? 3 : 1} />

      <table className="adm-table revenue-table">
        <thead>
          <tr>
            <th scope="col">월</th>
            <th scope="col" className="num">신고 매출</th>
            <th scope="col" className="num">카드 매출</th>
            <th scope="col" className="num">카드 비중</th>
            <th scope="col">이상 탐지</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((row) => (
            <tr key={row.month} className={row.alerts.length > 0 ? 'is-flagged' : ''}>
              <td>{monthLabel(row.month, true)}</td>
              <td className="num">{won(row.reportedRevenue)}</td>
              <td className="num">{won(row.cardRevenue)}</td>
              <td className="num">{percent(row.cardRatioPercent)}</td>
              <td>
                <div className="revenue-flags">
                  {row.alerts.map((alert) => (
                    <SeverityBadge key={alert.type} severity={alert.severity} label={alert.title} />
                  ))}
                  {row.excludedFromLimit && <span className="revenue-excluded">한도 계산에서 뺌</span>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 12 && (
        <button type="button" className="btn btn--quiet adm-more" onClick={() => setShowAll((value) => !value)}>
          {showAll ? '최근 12개월만 보기' : `${rows.length}개월 모두 보기`}
        </button>
      )}
    </section>
  );
}
