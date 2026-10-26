import { useEffect, useRef, useState } from 'react';
import { subscribe } from '../lib/sync';
import type { Settlement } from '../lib/types';
import { manwon, monthLabel, percent, won } from '../lib/format';

interface Receipt {
  settlement: Settlement;
  myInvestment: number;
  myAmount: number;
  totalInvestment: number;
}

/**
 * 운영 콘솔에서 정산하면 투자자 휴대폰에 영수증이 출력된다.
 * 가게 매출 → 5% → 내 투자금 비율 → 내 몫, 계산 과정을 한 장에 보여 준다.
 */
export function PayoutReceipt() {
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(
    () =>
      subscribe((event) => {
        if (event.type === 'reset') {
          setReceipt(null);
          return;
        }
        if (event.type !== 'settled') return;
        const mine = event.settlement.payouts.filter((line) => line.demoUser);
        if (mine.length === 0) return;
        setReceipt({
          settlement: event.settlement,
          myInvestment: mine.reduce((sum, line) => sum + line.investmentAmount, 0),
          myAmount: mine.reduce((sum, line) => sum + line.amount, 0),
          totalInvestment: event.settlement.payouts.reduce((sum, line) => sum + line.investmentAmount, 0),
        });
      }),
    [],
  );

  useEffect(() => {
    if (receipt) closeRef.current?.focus({ preventScroll: true });
  }, [receipt]);

  if (!receipt) return null;
  const s = receipt.settlement;
  const share = receipt.totalInvestment > 0 ? (receipt.myInvestment / receipt.totalInvestment) * 100 : 0;

  return (
    <div className="receipt-layer" role="dialog" aria-modal="true" aria-labelledby="receipt-title">
      <div className="receipt-slot" aria-hidden="true" />
      <div className="receipt-paper">
        <article className="receipt">
          <p className="receipt-kicker">돈이 들어왔어요</p>
          <h2 id="receipt-title" className="receipt-store">
            {s.storeName}
          </h2>
          <p className="receipt-sub">{monthLabel(s.month, true)} 매출 정산</p>

          <dl className="receipt-lines">
            <div>
              <dt>이달 신고 매출</dt>
              <dd>{won(s.baseRevenue)}</dd>
            </div>
            <div>
              <dt>가게가 낸 돈 (매출의 {percent(s.sharePercent, 0)})</dt>
              <dd>{won(s.paidAmount)}</dd>
            </div>
            <div>
              <dt>정산 수수료</dt>
              <dd>−{won(s.platformFee)}</dd>
            </div>
            <div>
              <dt>투자자에게 나눈 돈</dt>
              <dd>{won(s.investorAmount)}</dd>
            </div>
            <div>
              <dt>내 투자금 비율</dt>
              <dd>{percent(share, 2)}</dd>
            </div>
          </dl>

          <div className="receipt-total">
            <span>내 몫</span>
            <strong>{won(receipt.myAmount)}</strong>
          </div>

          <dl className="receipt-lines receipt-lines--small">
            <div>
              <dt>함께 받은 투자자</dt>
              <dd>{s.payoutCount}명</dd>
            </div>
            <div>
              <dt>가게 상환 진행</dt>
              <dd>
                {manwon(s.totalPaidAfter)} / {manwon(s.repaymentCap)}
              </dd>
            </div>
          </dl>

          {s.anomalyOverridden && (
            <p className="receipt-flag">이달 매출은 이상 신호가 있어 운영팀이 확인한 뒤 정산했어요.</p>
          )}
          {s.capReached && <p className="receipt-flag receipt-flag--good">상환 상한에 도달해 이 상품은 지급이 끝났어요.</p>}

          <p className="receipt-no">정산 번호 {String(s.id).padStart(6, '0')}</p>
        </article>
      </div>
      <button ref={closeRef} type="button" className="btn btn--primary receipt-close" onClick={() => setReceipt(null)}>
        확인
      </button>
    </div>
  );
}
