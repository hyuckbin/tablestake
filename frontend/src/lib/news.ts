import type { OfferingSummary } from './types';
import { profileOf, type NewsTag, type Tone } from './catalog';
import { daysUntil, monthLabel, percent } from './format';
import { PIECE_FACE } from './market';

export interface FeedItem {
  key: string;
  offeringId: number;
  storeName: string;
  imageKey: string;
  tag: NewsTag;
  title: string;
  sub?: string;
  tone: Tone;
  /** 정렬용. 작을수록 위 */
  rank: number;
  /** "오늘", "3일 전" 같은 시점. 없으면 표시하지 않는다 */
  when?: string;
}

function whenOf(daysAgo: number): string {
  if (daysAgo <= 0) return '오늘';
  if (daysAgo === 1) return '어제';
  return `${daysAgo}일 전`;
}

/**
 * 가게 소식. 백엔드 데이터에서 나온 사건(정산 보류, 정산 완료, 공모 진행, 매출 성장)과
 * 가게가 올린 소식(시연용)을 섞는다. 검증·정산 소식을 위로 올린다.
 */
export function feedOf(listings: OfferingSummary[]): FeedItem[] {
  const items: FeedItem[] = [];
  for (const listing of listings) {
    const base = { offeringId: listing.id, storeName: listing.storeName, imageKey: listing.imageKey };
    if (listing.holdMonth) {
      items.push({
        ...base,
        key: `${listing.id}-hold`,
        tag: '검증',
        title: `${monthLabel(listing.holdMonth)} 매출 정산을 보류했어요`,
        sub: `${listing.holdReason ?? '이상 매출 신호'} · 운영팀이 확인하고 있어요`,
        tone: 'down',
        rank: 0,
      });
    } else if (listing.status === 'ACTIVE' && listing.lastSettledMonth) {
      const pieces = Math.max(1, Math.round(listing.raisedAmount / PIECE_FACE));
      items.push({
        ...base,
        key: `${listing.id}-settled-${listing.lastSettledMonth}`,
        tag: '정산',
        title: `${monthLabel(listing.lastSettledMonth)} 매출분 정산을 마쳤어요`,
        sub: `카드 매출 대조 일치 · 1조각당 약 ${Math.round(listing.monthlyPayout / pieces).toLocaleString('ko-KR')}원`,
        tone: 'neutral',
        rank: 30,
      });
    }
    if (listing.status === 'RECRUITING' && listing.fundingRatePercent >= 50) {
      items.push({
        ...base,
        key: `${listing.id}-funding`,
        tag: '공모',
        title: `모집 ${percent(listing.fundingRatePercent, 0)} 달성, ${daysUntil(listing.recruitEndsOn)}일 남았어요`,
        tone: 'up',
        rank: 5,
      });
    }
    if (listing.revenueGrowthPercent >= 10) {
      items.push({
        ...base,
        key: `${listing.id}-growth`,
        tag: '매출',
        title: `최근 3개월 매출이 1년 전보다 ${percent(listing.revenueGrowthPercent, 0)} 늘었어요`,
        sub: '카드사 승인 매출로 확인한 숫자예요',
        tone: 'up',
        rank: 8,
      });
    }
    for (const [index, news] of profileOf(listing.imageKey).news.entries()) {
      items.push({
        ...base,
        key: `${listing.id}-news-${index}`,
        tag: news.tag,
        title: news.title,
        tone: news.tone,
        rank: 10 + news.daysAgo,
        when: whenOf(news.daysAgo),
      });
    }
  }
  return items.sort((a, b) => a.rank - b.rank);
}
