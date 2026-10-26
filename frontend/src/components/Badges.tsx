import type { RiskGrade, Severity, VerificationStatus } from '../lib/types';

const VERIFICATION_TONE: Record<VerificationStatus, 'ok' | 'caution' | 'alert'> = {
  NORMAL: 'ok',
  CAUTION: 'caution',
  WARNING: 'alert',
};

/** 매출 검증 상태. 색만으로 구분하지 않도록 아이콘과 글자를 함께 쓴다. */
export function VerificationBadge({ status, label, prefix = '매출 검증' }: { status: VerificationStatus; label: string; prefix?: string }) {
  const tone = VERIFICATION_TONE[status];
  return (
    <span className={`badge badge--${tone}`}>
      <StatusIcon tone={tone} />
      {prefix ? `${prefix} ${label}` : label}
    </span>
  );
}

export function SeverityBadge({ severity, label }: { severity: Severity; label: string }) {
  const tone = severity === 'HIGH' ? 'alert' : 'caution';
  return (
    <span className={`badge badge--${tone}`}>
      <StatusIcon tone={tone} />
      {label}
    </span>
  );
}

/** 위험 등급. A·B 는 중립, C 는 주의 톤. */
export function GradeBadge({ grade, label }: { grade: RiskGrade; label: string }) {
  return (
    <span className={`badge badge--grade${grade === 'C' ? ' badge--caution' : ''}`}>
      <span className="badge-grade">{grade}</span>
      {label}
    </span>
  );
}

export function StatusIcon({ tone }: { tone: 'ok' | 'caution' | 'alert' }) {
  if (tone === 'ok') {
    return (
      <svg className="badge-icon" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (tone === 'caution') {
    return (
      <svg className="badge-icon" viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 4.8v3.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="8" cy="11" r="1" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg className="badge-icon" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 1.8l6.6 11.6H1.4z" fill="currentColor" />
      <path d="M8 6v3.4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="8" cy="11.4" r="0.95" fill="#fff" />
    </svg>
  );
}
