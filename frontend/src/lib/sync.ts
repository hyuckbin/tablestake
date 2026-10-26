import { useEffect, useState } from 'react';
import type { Settlement } from './types';

/**
 * 시연 화면에서 투자자 앱(왼쪽)과 운영 콘솔(오른쪽)은 서로 다른 iframe 이다.
 * 한쪽에서 투자·정산을 하면 BroadcastChannel 로 알려 다른 쪽이 데이터를 다시 불러오게 한다.
 * (같은 브라우저 안에서만 동작. 실제 서비스라면 푸시 알림이나 폴링이 이 역할을 한다.)
 */
export type SyncEvent =
  | { type: 'invested'; offeringId: number }
  | { type: 'revenue'; storeId: number }
  | { type: 'settled'; settlement: Settlement }
  | { type: 'reset' };

const CHANNEL = 'tablestake-demo';
const channel: BroadcastChannel | null = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(CHANNEL);

type Listener = (event: SyncEvent) => void;
const listeners = new Set<Listener>();

channel?.addEventListener('message', (message: MessageEvent<SyncEvent>) => {
  listeners.forEach((listener) => listener(message.data));
});

/** 다른 화면에 알리고, 같은 화면 안의 구독자에게도 바로 전달한다. */
export function emit(event: SyncEvent): void {
  channel?.postMessage(event);
  listeners.forEach((listener) => listener(event));
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** 어떤 이벤트든 오면 1씩 올라가는 값. useApi 가 이 값이 바뀌면 다시 불러온다. */
export function useSyncVersion(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => subscribe(() => setVersion((v) => v + 1)), []);
  return version;
}
