import { useEffect } from 'react';
import { dismissNotice, useMarketState, type Notice } from '../../lib/market';
import { CloseIcon } from './Icons';

/** 체결·취소·입출금 알림. 화면 위쪽에 잠깐 떴다 사라진다. */
export function Toasts() {
  const { notices } = useMarketState();
  if (notices.length === 0) return null;
  return (
    <div className="toasts" role="status" aria-live="polite">
      {notices.map((notice) => (
        <Toast key={notice.id} notice={notice} />
      ))}
    </div>
  );
}

function Toast({ notice }: { notice: Notice }) {
  useEffect(() => {
    const timer = window.setTimeout(() => dismissNotice(notice.id), 3800);
    return () => window.clearTimeout(timer);
  }, [notice.id]);
  return (
    <div className={`toast toast--${notice.tone}`}>
      <span className="toast-mark" aria-hidden="true" />
      <span className="toast-text">
        <strong>{notice.title}</strong>
        {notice.body && <span>{notice.body}</span>}
      </span>
      <button type="button" className="toast-close" aria-label="알림 닫기" onClick={() => dismissNotice(notice.id)}>
        <CloseIcon />
      </button>
    </div>
  );
}
