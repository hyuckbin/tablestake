import { useApi } from '../lib/useApi';
import type { RevenueBoard } from '../lib/types';
import { manwon, periodLabel, percent } from '../lib/format';
import { GradeBadge, SeverityBadge, VerificationBadge } from '../components/Badges';
import { Signboard } from '../components/Signboard';
import { ErrorNote } from '../components/ErrorNote';
import { SettlementSection } from './SettlementSection';
import { RevenueEntry } from './RevenueEntry';
import { LimitReview } from './LimitReview';
import { RevenueHistory } from './RevenueHistory';

export function StorePanel({ storeId }: { storeId: number }) {
  const board = useApi<RevenueBoard>(`/api/admin/stores/${storeId}/revenues`);

  if (board.error && !board.data) return <ErrorNote error={board.error} />;
  if (!board.data) return <div className="adm-loading" aria-busy="true" />;

  const b = board.data;
  const store = b.store;
  const payingOffering = b.offerings.find((offering) => ['FUNDED', 'ACTIVE', 'COMPLETED'].includes(offering.status));
  const latestOffering = b.offerings[b.offerings.length - 1];

  return (
    <div className="adm-panel">
      <header className="adm-head">
        <div className="adm-head-main">
          <Signboard name={store.name} category={store.category} size="sm" />
          <div className="adm-head-facts">
            <span>{store.category}</span>
            <span>{store.area}</span>
            <span>운영 {periodLabel(store.operatingMonths)}</span>
            <span>{store.businessType}</span>
          </div>
        </div>
        <div className="adm-head-badges">
          <GradeBadge grade={b.risk.grade} label={`${b.risk.gradeLabel} 등급`} />
          <VerificationBadge status={b.verification.status} label={b.verification.statusLabel} />
        </div>
      </header>

      {latestOffering && (
        <p className="adm-offering">
          <strong>{latestOffering.title}</strong>
          <span className={`adm-pill adm-pill--${latestOffering.status.toLowerCase()}`}>{latestOffering.statusLabel}</span>
          <span className="num">
            {manwon(latestOffering.raisedAmount)} / {manwon(latestOffering.targetAmount)} (
            {percent((latestOffering.raisedAmount / latestOffering.targetAmount) * 100, 0)})
          </span>
        </p>
      )}

      {b.storeAlerts.length > 0 && (
        <div className="adm-banner">
          {b.storeAlerts.map((alert) => (
            <div key={alert.type} className="adm-banner-row">
              <SeverityBadge severity={alert.severity} label={alert.title} />
              <p>{alert.message}</p>
            </div>
          ))}
        </div>
      )}

      <div className="adm-grid">
        {payingOffering && <SettlementSection offeringId={payingOffering.id} board={b} />}
        <RevenueEntry storeId={storeId} board={b} />
        {b.fundingLimit && <LimitReview limit={b.fundingLimit} status={latestOffering?.status} />}
      </div>

      <RevenueHistory rows={b.rows} />
    </div>
  );
}
