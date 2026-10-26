import type { CSSProperties } from 'react';
import { signColors } from '../lib/stores';

interface SignboardProps {
  name: string;
  category: string;
  size?: 'sm' | 'md' | 'lg';
  /** 간판 오른쪽 아래에 붙는 작은 글씨 (예: 동네 이름) */
  caption?: string;
}

/** 가게 간판. 업종 색 바탕에 가게 이름을 크게 쓰고, 네 귀퉁이에 간판 나사를 박는다. */
export function Signboard({ name, category, size = 'md', caption }: SignboardProps) {
  const colors = signColors(category);
  const style = {
    '--sb-bg': colors.bg,
    '--sb-fg': colors.fg,
    '--sb-edge': colors.edge,
  } as CSSProperties;

  return (
    <div className={`sb sb--${size}`} style={style}>
      <span className="sb-bolt sb-bolt--tl" aria-hidden="true" />
      <span className="sb-bolt sb-bolt--tr" aria-hidden="true" />
      <span className="sb-bolt sb-bolt--bl" aria-hidden="true" />
      <span className="sb-bolt sb-bolt--br" aria-hidden="true" />
      <span className="sb-name">{name}</span>
      {size !== 'sm' && <span className="sb-sub">{caption ?? category}</span>}
    </div>
  );
}
