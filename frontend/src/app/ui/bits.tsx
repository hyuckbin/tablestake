import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { photoOf } from '../../lib/catalog';
import { percent } from '../../lib/format';

/** 가게 사진. 파일이 없으면 기본 그림으로 바꾼다. */
export function Photo({ imageKey, className, alt = '' }: { imageKey: string | null | undefined; className?: string; alt?: string }) {
  return (
    <img
      className={className ?? 'photo'}
      src={photoOf(imageKey)}
      alt={alt}
      onError={(event) => {
        const img = event.currentTarget;
        if (!img.src.endsWith('/photos/default.jpg')) img.src = '/photos/default.jpg';
      }}
    />
  );
}

export type Trend = 'up' | 'down' | 'flat';

export function trendOf(value: number): Trend {
  if (value > 0.0001) return 'up';
  if (value < -0.0001) return 'down';
  return 'flat';
}

/**
 * 등락률: ▲1.24% / ▼0.80% (signed 면 +1.24% / −0.80%).
 * 한국 증권 관례대로 오르면 빨강, 내리면 파랑.
 */
export function Delta({
  value,
  digits = 2,
  chip = false,
  signed = false,
  className = '',
}: {
  value: number;
  digits?: number;
  chip?: boolean;
  signed?: boolean;
  className?: string;
}) {
  const trend = trendOf(value);
  const mark = signed ? (trend === 'up' ? '+' : trend === 'down' ? '−' : '') : trend === 'up' ? '▲' : trend === 'down' ? '▼' : '';
  return (
    <span className={`delta delta--${trend}${chip ? ' delta--chip' : ''} ${className}`.trim()}>
      {mark && <span aria-hidden="true">{mark}</span>}
      <span className="visually-hidden">{trend === 'up' ? '상승 ' : trend === 'down' ? '하락 ' : ''}</span>
      {percent(Math.abs(value), digits)}
    </span>
  );
}

/** 금액 등락: ▲1,240원 */
export function DeltaWon({ value, className = '' }: { value: number; className?: string }) {
  const trend = trendOf(value);
  const mark = trend === 'up' ? '▲' : trend === 'down' ? '▼' : '';
  return (
    <span className={`delta delta--${trend} ${className}`.trim()}>
      {mark && <span aria-hidden="true">{mark}</span>}
      {Math.abs(Math.round(value)).toLocaleString('ko-KR')}원
    </span>
  );
}

/** 작은 꺾은선 (축 없음) */
export function Sparkline({ values, className, stroke }: { values: number[]; className?: string; stroke?: string }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values.map((value, index) => `${(index / (values.length - 1)) * 100},${40 - ((value - min) / span) * 36 - 2}`).join(' ');
  return (
    <svg className={className ?? 'sparkline'} viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} fill="none" stroke={stroke ?? 'currentColor'} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

/** 요소 너비를 재서 돌려준다 (SVG 그래프용) */
export function useElementWidth(ref: RefObject<HTMLElement>): number {
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    if (ref.current) setWidth(ref.current.getBoundingClientRect().width);
  }, [ref]);
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.width ?? 0;
      setWidth((previous) => (Math.abs(previous - next) > 0.5 ? next : previous));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return Math.floor(width);
}

/** 값이 바뀔 때마다 잠깐 깜빡이는 클래스 (실시간 시세용) */
export function useFlash(value: number): string {
  const previous = useRef(value);
  const [flash, setFlash] = useState('');
  useEffect(() => {
    if (value === previous.current) return;
    setFlash(value > previous.current ? 'flash-up' : 'flash-down');
    previous.current = value;
    const timer = window.setTimeout(() => setFlash(''), 650);
    return () => window.clearTimeout(timer);
  }, [value]);
  return flash;
}

/** 1초마다 바뀌는 지금 시각 */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);
  return now;
}

export function timeLabel(t: number): string {
  const date = new Date(t);
  const h = date.getHours();
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h < 12 ? '오전' : '오후'} ${h % 12 === 0 ? 12 : h % 12}:${m}`;
}

export function clockLabel(t: number): string {
  const date = new Date(t);
  return [date.getHours(), date.getMinutes(), date.getSeconds()].map((part) => String(part).padStart(2, '0')).join(':');
}
