import type { OfferingDetail, RevenueRow } from '../lib/types';
import { manwon, monthLabel, monthTick, percent, won } from '../lib/format';
import { PIECE_FACE } from '../lib/market';
import { RevenueChart } from '../components/RevenueChart';
import { AlertIcon, CheckIcon, GiftIcon } from './ui/Icons';

/** 매출 검증: 카드 결제 비중 띠 + 월 매출 그래프 + 경고. 우리 서비스의 핵심 차별점을 보여 주는 칸. */
export function VerificationSection({ detail }: { detail: OfferingDetail }) {
  const v = detail.verification;
  const s = detail.summary;
  const ok = v.status === 'NORMAL' && !s.holdMonth;
  return (
    <section className="section">
      <div className="section-head">
        <h2 className="display">매출 검증</h2>
        <span className={`tag tag--${ok ? 'ok' : 'warn'}`}>
          {ok ? <CheckIcon className="tag-icon" /> : <AlertIcon className="tag-icon" />}
          {ok ? '카드 매출 대조 일치' : s.holdMonth ? '정산 보류 중' : `매출 ${v.statusLabel}`}
        </span>
      </div>
      <div className="card verify-card">
        {s.holdMonth && (
          <div className="hold-box" role="note">
            <strong>{monthLabel(s.holdMonth)} 매출 정산을 보류했어요</strong>
            <span>{s.holdReason}</span>
            <span>돈이 나가기 전에 운영팀이 매장 POS 기록과 카드사 내역을 맞춰 보고 있어요. 확인이 끝나야 지급돼요.</span>
          </div>
        )}
        <CardRatioStrip rows={detail.revenues} />
        <h3 className="card-sub">최근 12개월 신고 매출</h3>
        <RevenueChart
          rows={detail.revenues}
          tickEvery={2}
          plotHeight={130}
          reference={{ value: detail.fundingLimit.averageRevenueAll, label: `12개월 평균 ${manwon(detail.fundingLimit.averageRevenueAll)}` }}
        />
        {v.alerts.length > 0 ? (
          <ul className="alert-lines">
            {v.alerts.map((alert) => (
              <li key={alert.month + alert.type}>
                <span className={`tag tag--${alert.severity === 'HIGH' ? 'warn' : 'sun'}`}>
                  {monthLabel(alert.month)} {alert.title}
                </span>
                <p>{alert.message}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="card-note">최근 12개월 동안 카드 매출과 어긋나거나 갑자기 튄 달이 없어요.</p>
        )}
        {detail.store.currency !== 'KRW' && (
          <p className="card-note">현지 매출({detail.store.currency})은 원화로 환산해 보여 줘요.</p>
        )}
      </div>
    </section>
  );
}

/** 월별 카드 결제 비중. 평소보다 크게 떨어지면 현금 결제 유도를 의심한다. */
function CardRatioStrip({ rows }: { rows: RevenueRow[] }) {
  if (rows.length === 0) return null;
  const normal = rows.filter((row) => row.alerts.length === 0);
  const baseline = normal.reduce((sum, row) => sum + row.cardRatioPercent, 0) / Math.max(1, normal.length);
  const low = Math.max(0, Math.min(...rows.map((row) => row.cardRatioPercent)) - 10);
  const scale = (value: number) => ((value - low) / Math.max(1, 100 - low)) * 100;
  return (
    <div className="ratio">
      <div className="ratio-head">
        <h3 className="card-sub">카드 결제 비중</h3>
        <span>평소 {percent(baseline, 0)}</span>
      </div>
      <div className="ratio-bars" role="img" aria-label={`최근 ${rows.length}개월 카드 결제 비중, 평소 ${percent(baseline, 0)}`}>
        <i className="ratio-baseline" style={{ bottom: `${scale(baseline)}%` }} aria-hidden="true" />
        {rows.map((row) => {
          const flagged = row.alerts.some((alert) => alert.type === 'CARD_RATIO_DROP' || alert.severity === 'HIGH');
          return (
            <span key={row.month} className={`ratio-col${flagged ? ' is-flagged' : ''}`}>
              <i style={{ height: `${scale(row.cardRatioPercent)}%` }} />
              {flagged && (
                <em className="num" style={{ bottom: `calc(${scale(row.cardRatioPercent)}% + 4px)` }}>
                  {percent(row.cardRatioPercent, 0)}
                </em>
              )}
            </span>
          );
        })}
      </div>
      <div className="ratio-ticks" aria-hidden="true">
        {rows.map((row, index) => (
          <span key={row.month}>{index % 3 === rows.length % 3 ? monthTick(row.month) : ''}</span>
        ))}
      </div>
      <p className="card-note">카드사 승인 매출 ÷ 신고 매출. 갑자기 떨어지면 현금 결제를 유도해 매출을 숨겼을 수 있어요.</p>
    </div>
  );
}

/** 원 단위 정산 기록 공개 */
export function SettlementTable({ detail }: { detail: OfferingDetail }) {
  const pieces = Math.max(1, Math.round(detail.summary.raisedAmount / PIECE_FACE));
  const rows = detail.settlements.slice(0, 6);
  if (rows.length === 0) return null;
  return (
    <section className="section">
      <div className="section-head">
        <h2 className="display">정산 내역</h2>
        <span className="section-note">1원 단위까지 공개</span>
      </div>
      <div className="card">
        <table className="ledger">
          <thead>
            <tr>
              <th scope="col">매출 달</th>
              <th scope="col">신고 매출</th>
              <th scope="col">투자자 몫</th>
              <th scope="col">1조각당</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.month}>
                <th scope="row">
                  {monthLabel(row.month)}
                  {row.anomalyOverridden && <span className="ledger-flag" title="이상 신호를 확인한 뒤 정산">확인</span>}
                </th>
                <td className="num">{manwon(row.baseRevenue)}</td>
                <td className="num">{won(row.investorAmount)}</td>
                <td className="num">{won(Math.floor(row.investorAmount / pieces))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="card-note">
          가게가 낸 돈(매출의 {percent(detail.summary.revenueSharePercent, 0)})에서 정산 수수료 {percent(detail.settlementFeePercent, 0)}를
          뺀 돈이 투자자 몫이에요. 지금까지 가게가 낸 돈은 {won(detail.totalPaid)}이에요.
        </p>
      </div>
    </section>
  );
}

export function RiskCard({ detail }: { detail: OfferingDetail }) {
  const grade = detail.risk.grade;
  return (
    <section className="section">
      <div className="section-head">
        <h2 className="display">위험 등급</h2>
      </div>
      <div className="card risk">
        <span className={`risk-grade risk-grade--${grade}`}>
          <strong>{grade}</strong>
          <span>{detail.risk.gradeLabel}</span>
        </span>
        <ul>
          {detail.risk.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
          <li>사업자 형태 {detail.store.businessType}</li>
        </ul>
      </div>
    </section>
  );
}

export function PerkCard({ perk, owned, onShow }: { perk: string | null; owned: boolean; onShow?: () => void }) {
  if (!perk) return null;
  return (
    <section className="section">
      <div className="perk-card">
        <GiftIcon className="perk-card-icon" />
        <h2 className="display">투자자 단골 혜택</h2>
        <p className="perk-card-text">{perk}</p>
        {owned && onShow ? (
          <button type="button" className="perk-card-link" onClick={onShow}>
            매장에서 투자자 인증하기
          </button>
        ) : (
          <p className="perk-card-note">1조각만 있어도 받아요. 매장에서 앱의 투자자 인증 화면을 보여 주면 돼요.</p>
        )}
      </div>
    </section>
  );
}

export function TermsCard({ detail }: { detail: OfferingDetail }) {
  const s = detail.summary;
  return (
    <section className="section">
      <div className="section-head">
        <h2 className="display">상품 정보</h2>
      </div>
      <dl className="card terms">
        <div>
          <dt>매달 받는 돈</dt>
          <dd>
            가게 매출의 {percent(s.revenueSharePercent, 0)}에서 정산 수수료 {percent(detail.settlementFeePercent, 0)}를 뺀 금액을 조각 수대로
            나눠요
          </dd>
        </div>
        <div>
          <dt>끝나는 때</dt>
          <dd>
            가게가 투자금의 {s.capMultiple}배를 갚거나 {s.maxTermMonths}개월이 지나면 끝나요. 투자자는 최대 {detail.investorCapMultiple.toFixed(3)}배를
            받아요
          </dd>
        </div>
        <div>
          <dt>모은 돈</dt>
          <dd>
            {manwon(s.raisedAmount)} · {detail.purpose}
          </dd>
        </div>
        <div>
          <dt>가게</dt>
          <dd>
            {detail.store.city} {detail.store.area} · {detail.store.description}
          </dd>
        </div>
      </dl>
    </section>
  );
}

export function Notice({ tradable }: { tradable: boolean }) {
  return (
    <section className="notice">
      <h2>투자 전에 꼭 알아 두세요</h2>
      <ul>
        <li>예금이 아니라 투자예요. 가게 매출이 줄면 받는 돈도 줄고, 문을 닫으면 원금을 잃을 수 있어요.</li>
        <li>예금자 보호를 받지 않아요. 예상 수익률은 최근 12개월 평균 매출이 그대로 이어진다고 본 값이에요.</li>
        {tradable ? (
          <li>조각 거래는 2단계 기능이에요. 조각투자 장외거래소가 열리면 연동할 계획이고, 이 화면의 시세와 체결은 시연용이에요.</li>
        ) : (
          <li>공모 상품은 만기까지 보유해요. 중간에 돌려받을 수 없어요.</li>
        )}
      </ul>
    </section>
  );
}
