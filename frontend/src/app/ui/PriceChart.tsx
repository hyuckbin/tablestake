import { useId, useRef, useState } from 'react';
import type { Point } from '../../lib/market';
import { useElementWidth } from './bits';

interface PriceChartProps {
  points: Point[];
  height?: number;
  /** 마지막 점에 깜빡이는 점을 찍는다 (실시간) */
  live?: boolean;
  /** 툴팁에 쓸 시각 표기 */
  timeFormat: (t: number) => string;
  ariaLabel: string;
}

const PAD = { top: 22, right: 12, bottom: 22, left: 12 };

/** 조각 가격 꺾은선. 기간 첫 가격보다 오르면 빨강, 내리면 파랑. 점선은 기간 첫 가격. */
export function PriceChart({ points, height = 200, live = false, timeFormat, ariaLabel }: PriceChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const width = useElementWidth(ref);
  const gradientId = useId();
  const [active, setActive] = useState<number | null>(null);

  if (points.length < 2) return <div className="pchart" ref={ref} style={{ height }} />;

  const prices = points.map((point) => point.p);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = Math.max(max - min, max * 0.004);
  const low = min - span * 0.12;
  const high = max + span * 0.12;
  const t0 = points[0].t;
  const t1 = points[points.length - 1].t;
  const plotW = Math.max(1, width - PAD.left - PAD.right);
  const plotH = height - PAD.top - PAD.bottom;
  const x = (t: number) => PAD.left + ((t - t0) / Math.max(1, t1 - t0)) * plotW;
  const y = (p: number) => PAD.top + (1 - (p - low) / (high - low)) * plotH;

  const first = points[0].p;
  const last = points[points.length - 1].p;
  const tone = last > first ? 'up' : last < first ? 'down' : 'flat';
  const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${x(point.t).toFixed(1)},${y(point.p).toFixed(1)}`).join('');
  const area = `${line}L${x(t1).toFixed(1)},${PAD.top + plotH}L${x(t0).toFixed(1)},${PAD.top + plotH}Z`;
  const maxIndex = prices.indexOf(max);
  const minIndex = prices.indexOf(min);

  function pick(clientX: number) {
    const box = ref.current?.getBoundingClientRect();
    if (!box) return;
    const t = t0 + ((clientX - box.left - PAD.left) / plotW) * (t1 - t0);
    let best = 0;
    for (let i = 1; i < points.length; i += 1) {
      if (Math.abs(points[i].t - t) < Math.abs(points[best].t - t)) best = i;
    }
    setActive(best);
  }

  const activePoint = active === null ? null : points[active];
  const extremeLabel = (index: number, kind: 'max' | 'min') => {
    const px = x(points[index].t);
    const anchor = px < 70 ? 'start' : px > width - 70 ? 'end' : 'middle';
    return (
      <text className={`pchart-extreme pchart-extreme--${kind}`} x={px} y={kind === 'max' ? y(max) - 8 : y(min) + 16} textAnchor={anchor}>
        {kind === 'max' ? '최고 ' : '최저 '}
        {points[index].p.toLocaleString('ko-KR')}
      </text>
    );
  };

  return (
    <div
      className={`pchart pchart--${tone}`}
      ref={ref}
      style={{ height }}
      onPointerMove={(event) => pick(event.clientX)}
      onPointerDown={(event) => pick(event.clientX)}
      onPointerLeave={() => setActive(null)}
    >
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={ariaLabel}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" className="pchart-fill-top" />
              <stop offset="1" className="pchart-fill-bottom" />
            </linearGradient>
          </defs>
          <line className="pchart-base" x1={PAD.left} x2={width - PAD.right} y1={y(first)} y2={y(first)} />
          <path d={area} fill={`url(#${gradientId})`} />
          <path className="pchart-line" d={line} />
          {max !== min && extremeLabel(maxIndex, 'max')}
          {max !== min && extremeLabel(minIndex, 'min')}
          {live && (
            <g className="pchart-live">
              <circle className="pchart-live-ring" cx={x(t1)} cy={y(last)} r={9} />
              <circle className="pchart-live-dot" cx={x(t1)} cy={y(last)} r={4} />
            </g>
          )}
          {activePoint && (
            <g className="pchart-cursor">
              <line x1={x(activePoint.t)} x2={x(activePoint.t)} y1={PAD.top - 6} y2={PAD.top + plotH} />
              <circle cx={x(activePoint.t)} cy={y(activePoint.p)} r={4.5} />
            </g>
          )}
        </svg>
      )}
      {activePoint && (
        <div className="pchart-tip" style={{ left: Math.min(Math.max(x(activePoint.t), 60), width - 60) }}>
          <strong>{activePoint.p.toLocaleString('ko-KR')}원</strong>
          <span>{timeFormat(activePoint.t)}</span>
        </div>
      )}
    </div>
  );
}
