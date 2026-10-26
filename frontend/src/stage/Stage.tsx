import { useState } from 'react';
import { api, ApiError } from '../lib/api';
import { emit } from '../lib/sync';
import './stage.css';

/**
 * 발표 화면. 투자자 앱과 운영 콘솔을 각각 iframe 으로 띄운다.
 * iframe 이라 앱은 실제 휴대폰 너비(390px)로 렌더링되고, 두 화면은 BroadcastChannel 로 서로 갱신된다.
 */
export function Stage() {
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function reset() {
    setResetting(true);
    setMessage(null);
    try {
      await api.post('/api/demo/reset');
      emit({ type: 'reset' });
      setMessage('처음 상태로 되돌렸어요.');
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : '되돌리지 못했어요.');
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="stage">
      <header className="stage-bar">
        <div className="stage-brand">
          <span className="stage-wordmark">Tablestake</span>
          <span className="stage-title">포항에서 시작하는 맛집 매출 연동 조각투자 시연</span>
        </div>
        <div className="stage-actions">
          {message && (
            <span className="stage-message" role="status">
              {message}
            </span>
          )}
          <button type="button" className="stage-reset" onClick={reset} disabled={resetting}>
            {resetting ? '되돌리는 중' : '처음 상태로 되돌리기'}
          </button>
        </div>
      </header>

      <main className="stage-floor">
        <figure className="stage-phone">
          <div className="phone">
            <div className="phone-notch" aria-hidden="true" />
            <iframe className="phone-screen" src="/app" title="투자자 앱" />
          </div>
          <figcaption>투자자 휴대폰</figcaption>
        </figure>

        <figure className="stage-console">
          <div className="console-window">
            <div className="console-chrome" aria-hidden="true">
              <span />
              <span />
              <span />
              <em>운영 콘솔</em>
            </div>
            <iframe className="console-screen" src="/admin" title="운영 콘솔" />
          </div>
          <figcaption>Tablestake 운영팀 화면</figcaption>
        </figure>
      </main>
    </div>
  );
}
