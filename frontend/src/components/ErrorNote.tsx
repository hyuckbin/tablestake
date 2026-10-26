import type { ApiError } from '../lib/api';
import { StatusIcon } from './Badges';

/** 서버가 알려 준 거절 사유를 그대로 보여 준다. 무엇이 문제이고 무엇을 하면 되는지가 메시지에 들어 있다. */
export function ErrorNote({ error, className = '' }: { error: ApiError; className?: string }) {
  return (
    <div className={`error-note ${className}`} role="alert">
      <StatusIcon tone="alert" />
      <div>
        <p className="error-note-message">{error.message}</p>
        {error.details.length > 0 && (
          <ul className="error-note-details">
            {error.details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
