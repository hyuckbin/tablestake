import { useEffect, useRef } from 'react';
import type { PositionView } from '../lib/account';
import { manwon } from '../lib/format';
import { useMarketState } from '../lib/market';
import { clockLabel, Photo, useNow } from './ui/bits';
import { CloseIcon } from './ui/Icons';

/**
 * 매장에서 보여 주는 투자자 인증 화면. 초 단위 시계가 움직여서 캡처한 화면을 돌려 쓰기 어렵게 한다.
 * (실제 서비스라면 서버가 발급한 1회용 코드를 QR로 보여 줘야 한다)
 */
export function PerkPass({ position, onClose }: { position: PositionView; onClose: () => void }) {
  const now = useNow(1000);
  const closeRef = useRef<HTMLButtonElement>(null);
  const { nickname } = useMarketState();

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="pass-layer" role="dialog" aria-modal="true" aria-labelledby="pass-title">
      <div className="pass">
        <button type="button" className="sheet-x pass-x" aria-label="인증 화면 닫기" onClick={onClose}>
          <CloseIcon />
        </button>
        <Photo imageKey={position.imageKey} className="pass-photo" />
        <p id="pass-title" className="pass-title">
          투자자 인증
        </p>
        <p className="pass-store">{position.name}</p>
        <p className="pass-who">{nickname || '투자자'}님은 이 가게에 투자한 단골이에요</p>
        <dl className="pass-lines">
          <div>
            <dt>보유</dt>
            <dd>{position.lastPrice !== null ? `${position.pieces}조각` : `공모 ${manwon(position.cost)}`}</dd>
          </div>
          <div>
            <dt>혜택</dt>
            <dd>{position.perk}</dd>
          </div>
        </dl>
        <p className="pass-live">
          <i aria-hidden="true" />
          <span className="num">{clockLabel(now)}</span> 실시간 인증
        </p>
        <p className="pass-note">직원에게 이 화면을 보여 주세요. 캡처한 화면은 시계가 멈춰 있어 쓸 수 없어요.</p>
        <button ref={closeRef} type="button" className="btn-dark btn-block" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  );
}
