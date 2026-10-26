import type { ReactNode } from 'react';

/* 앱에서 쓰는 선 아이콘. 24x24, currentColor. */

type IconProps = { className?: string };

function Svg({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg className={className ?? 'icon'} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

export function HomeIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z" />
    </Svg>
  );
}

export function MarketIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 19V5M4 19h16" />
      <path d="M7.5 15l3.5-4 3 2.5L19 8" />
      <path d="M15.5 8H19v3.5" />
    </Svg>
  );
}

export function OfferingIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M5 9.5h14l-1.2 9.6a1 1 0 0 1-1 .9H7.2a1 1 0 0 1-1-.9z" />
      <path d="M8.5 9.5V8a3.5 3.5 0 0 1 7 0v1.5" />
      <path d="M12 13v4M10 15h4" />
    </Svg>
  );
}

export function WalletIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3" />
      <path d="M4 7.5V18a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1H6.5A2.5 2.5 0 0 1 4 7.5z" />
      <circle cx="16" cy="14.5" r="1.3" />
    </Svg>
  );
}

export function BackIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M15 5l-7 7 7 7" />
    </Svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Svg>
  );
}

export function HeartIcon({ className, filled }: IconProps & { filled?: boolean }) {
  return (
    <Svg className={className}>
      <path
        d="M12 20s-7-4.4-8.6-8.7C2.3 8.4 4.2 5 7.6 5c1.9 0 3.3 1 4.4 2.6C13.1 6 14.5 5 16.4 5c3.4 0 5.3 3.4 4.2 6.3C19 15.6 12 20 12 20z"
        fill={filled ? 'currentColor' : 'none'}
      />
    </Svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M5 12.5l4.2 4.2L19 7" />
    </Svg>
  );
}

export function AlertIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 4l9 16H3z" />
      <path d="M12 10v4M12 17v.5" />
    </Svg>
  );
}

export function CardIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18M7 15h4" />
    </Svg>
  );
}

export function PauseIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M10 9v6M14 9v6" />
    </Svg>
  );
}

export function CeilingIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 5h16" />
      <path d="M12 20V9M8 13l4-4 4 4" />
    </Svg>
  );
}

export function WaveIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M3 15c2.5 0 2.5-4 5-4s2.5 4 5 4 2.5-4 5-4 2.5 2 3 2" />
      <path d="M3 19h18" />
    </Svg>
  );
}

export function GiftIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="4" y="9" width="16" height="11" rx="1" />
      <path d="M3 9h18M12 9v11M12 9c-1.5-3-5-3.5-5-1.5S10 9 12 9zm0 0c1.5-3 5-3.5 5-1.5S14 9 12 9z" />
    </Svg>
  );
}

export function ArrowIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Svg>
  );
}

export function ChevronIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M9 6l6 6-6 6" />
    </Svg>
  );
}
