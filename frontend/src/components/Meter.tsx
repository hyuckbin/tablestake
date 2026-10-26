interface MeterProps {
  value: number;
  /** 스크린리더용 설명 (예: "모집률") */
  label: string;
  size?: 'thin' | 'thick';
}

/** 모집률·상환 진행률 막대. 채운 부분과 같은 색 계열의 옅은 트랙을 쓴다. */
export function Meter({ value, label, size = 'thin' }: MeterProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={`meter meter--${size}`}
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped * 10) / 10}
    >
      <div className="meter-fill" style={{ width: `${clamped}%` }} />
    </div>
  );
}
