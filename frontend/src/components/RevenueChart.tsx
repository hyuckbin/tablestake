import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import type { RevenueRow, Severity } from '../lib/types';
import { manShort, monthLabel, monthTick, percent, won } from '../lib/format';

interface RevenueChartProps {
  /** 오래된 달부터 정렬된 월 매출 */
  rows: RevenueRow[];
  plotHeight?: number;
  /** x축 글자를 몇 달마다 쓸지 */
  tickEvery?: number;
  /** 가로 기준선 (예: 12개월 평균 매출) */
  reference?: { value: number; label: string };
}

const MARGIN = { top: 18, right: 8, bottom: 26, left: 48 };
const MAX_BAR = 24;

/** 월 신고 매출 막대 그래프. 이상 탐지에 걸린 달은 상태 색과 모양 표시(▲ 경고, ● 주의)를 함께 쓴다. */
export function RevenueChart({ rows, plotHeight = 150, tickEvery = 1, reference }: RevenueChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const width = useElementWidth(containerRef);
  const [active, setActive] = useState<number | null>(null);

  const plotWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const maxValue = Math.max(1, ...rows.map((row) => row.reportedRevenue), reference?.value ?? 0);
  const step = niceStep(maxValue / 3);
  const yMax = Math.ceil(maxValue / step) * step;
  const ticks = Array.from({ length: Math.round(yMax / step) + 1 }, (_, i) => i * step);
  const slot = rows.length > 0 ? plotWidth / rows.length : 0;
  const barWidth = Math.min(MAX_BAR, Math.max(4, slot * 0.62));
  const y = (value: number) => MARGIN.top + plotHeight - (value / yMax) * plotHeight;
  const totalHeight = MARGIN.top + plotHeight + MARGIN.bottom;

  const activeRow = active === null ? null : rows[active];
  const activeX = active === null ? 0 : MARGIN.left + slot * active + slot / 2;

  return (
    <div className="chart" ref={containerRef}>
      {width > 0 && (
        <svg
          width={width}
          height={totalHeight}
          role="img"
          aria-label={`최근 ${rows.length}개월 신고 매출 막대 그래프`}
          onPointerLeave={() => setActive(null)}
        >
          {ticks.map((tick) => (
            <g key={tick}>
              <line className="chart-grid" x1={MARGIN.left} x2={width - MARGIN.right} y1={y(tick)} y2={y(tick)} />
              <text className="chart-tick" x={MARGIN.left - 8} y={y(tick)} dy="0.32em" textAnchor="end">
                {tick === 0 ? '0' : manShort(tick)}
              </text>
            </g>
          ))}

          {rows.map((row, index) => {
            const severity = topSeverity(row);
            const x = MARGIN.left + slot * index + (slot - barWidth) / 2;
            const top = y(row.reportedRevenue);
            const base = y(0);
            const tone = severity === 'HIGH' ? 'alert' : severity === 'MEDIUM' ? 'caution' : 'normal';
            const showTick = (rows.length - 1 - index) % tickEvery === 0;
            return (
              <g key={row.month}>
                <path
                  className={`chart-bar chart-bar--${tone}${active === index ? ' is-active' : ''}`}
                  d={columnPath(x, top, barWidth, base - top)}
                />
                {severity && <SeverityMark severity={severity} cx={x + barWidth / 2} y={top - 9} />}
                {showTick && (
                  <text className="chart-tick" x={x + barWidth / 2} y={base + 17} textAnchor="middle">
                    {monthTick(row.month)}
                  </text>
                )}
                <rect
                  className="chart-hit"
                  x={MARGIN.left + slot * index}
                  y={MARGIN.top - 12}
                  width={slot}
                  height={plotHeight + 12}
                  tabIndex={0}
                  aria-label={`${monthLabel(row.month, true)} 신고 매출 ${won(row.reportedRevenue)}`}
                  onPointerEnter={() => setActive(index)}
                  onFocus={() => setActive(index)}
                  onBlur={() => setActive(null)}
                />
              </g>
            );
          })}

          {reference && (
            <g className="chart-reference">
              <line x1={MARGIN.left} x2={width - MARGIN.right} y1={y(reference.value)} y2={y(reference.value)} />
            </g>
          )}
          <line className="chart-axis" x1={MARGIN.left} x2={width - MARGIN.right} y1={y(0)} y2={y(0)} />
        </svg>
      )}

      {activeRow && (
        <div
          className="chart-tooltip"
          style={{ left: clamp(activeX, 84, width - 84), top: Math.max(0, y(activeRow.reportedRevenue) - 8) }}
        >
          <strong>{won(activeRow.reportedRevenue)}</strong>
          <span>{monthLabel(activeRow.month, true)} 신고 매출</span>
          <span>
            카드 {won(activeRow.cardRevenue)} ({percent(activeRow.cardRatioPercent)})
          </span>
          {activeRow.alerts.map((alert) => (
            <span key={alert.type} className="chart-tooltip-alert">
              {alert.title} ({alert.severityLabel})
            </span>
          ))}
        </div>
      )}

      {(reference || rows.some((row) => row.alerts.length > 0)) && (
        <div className="chart-legend">
          {reference && (
            <span>
              <i className="chart-key chart-key--line" aria-hidden="true" />
              {reference.label}
            </span>
          )}
          {rows.some((row) => topSeverity(row) === 'HIGH') && (
            <span>
              <i className="chart-key chart-key--alert" aria-hidden="true" />
              경고가 난 달
            </span>
          )}
          {rows.some((row) => topSeverity(row) === 'MEDIUM') && (
            <span>
              <i className="chart-key chart-key--caution" aria-hidden="true" />
              주의가 난 달
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function SeverityMark({ severity, cx, y }: { severity: Severity; cx: number; y: number }) {
  if (severity === 'HIGH') {
    return <path className="chart-mark chart-mark--alert" d={`M${cx} ${y - 5} L${cx + 5} ${y + 4} L${cx - 5} ${y + 4} Z`} />;
  }
  return <circle className="chart-mark chart-mark--caution" cx={cx} cy={y} r={4} />;
}

function topSeverity(row: RevenueRow): Severity | null {
  if (row.alerts.some((alert) => alert.severity === 'HIGH')) return 'HIGH';
  if (row.alerts.length > 0) return 'MEDIUM';
  return null;
}

/** 위쪽 모서리만 4px 둥근 기둥 (바닥은 기준선에 붙어 각진다) */
function columnPath(x: number, top: number, width: number, height: number): string {
  if (height <= 0) return '';
  const r = Math.min(4, width / 2, height);
  const bottom = top + height;
  return `M${x} ${bottom}V${top + r}Q${x} ${top} ${x + r} ${top}H${x + width - r}Q${x + width} ${top} ${x + width} ${top + r}V${bottom}Z`;
}

function niceStep(raw: number): number {
  const candidates = [500_000, 1_000_000, 2_000_000, 2_500_000, 5_000_000, 10_000_000, 20_000_000, 50_000_000];
  return candidates.find((candidate) => candidate >= raw) ?? candidates[candidates.length - 1];
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return value;
  return Math.max(min, Math.min(max, value));
}

function useElementWidth(ref: RefObject<HTMLElement>): number {
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
