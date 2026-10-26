import { Link } from 'react-router-dom';
import type { FeedItem } from '../lib/news';
import { Photo } from './ui/bits';

const TAG_TONE: Record<string, string> = {
  검증: 'warn',
  정산: 'ok',
  매출: 'sun',
  공모: 'night',
  가게: 'plain',
  메뉴: 'plain',
};

/** 가게 소식 목록. withPhoto 가 거짓이면 사진 없이 시간선만 그린다(가게 상세용). */
export function FeedList({ items, withPhoto = true }: { items: FeedItem[]; withPhoto?: boolean }) {
  if (items.length === 0) return <p className="empty">아직 소식이 없어요.</p>;
  return (
    <ul className={`feed card${withPhoto ? '' : ' feed--timeline'}`}>
      {items.map((item) => {
        const tagTone = item.tag === '검증' && item.tone !== 'down' ? 'ok' : TAG_TONE[item.tag];
        const body = (
          <>
            {withPhoto ? <Photo imageKey={item.imageKey} className="feed-thumb" /> : <span className={`feed-dot feed-dot--${item.tone}`} aria-hidden="true" />}
            <span className="feed-body">
              <span className="feed-meta">
                <span className={`tag tag--${tagTone}`}>{item.tag}</span>
                {withPhoto && <span>{item.storeName}</span>}
                {item.when && <span>{item.when}</span>}
              </span>
              <strong>{item.title}</strong>
              {item.sub && <span className={`feed-sub feed-sub--${item.tone}`}>{item.sub}</span>}
            </span>
          </>
        );
        return (
          <li key={item.key}>
            {withPhoto ? (
              <Link to={`/app/offerings/${item.offeringId}`} className="feed-item">
                {body}
              </Link>
            ) : (
              <div className="feed-item">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
