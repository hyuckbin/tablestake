import { Link } from 'react-router-dom';
import { useMarketState } from '../lib/market';
import { daysUntil, dayLabel, manwon, percent } from '../lib/format';
import { Photo } from './ui/bits';
import { CheckIcon } from './ui/Icons';

/** 공모: 새 가게에 1만 원부터 처음 투자하는 곳 (뱅카우·뮤직카우 옥션 자리) */
export function OfferingsPage() {
  const { listings, ready } = useMarketState();
  const recruiting = listings.filter((listing) => listing.status === 'RECRUITING');
  const upcomingListings = listings.filter((listing) => listing.status === 'FUNDED');

  return (
    <div className="page page--offerings">
      <header className="hero hero--plain">
        <div className="hero-top">
          <h1 className="display hero-title">공모</h1>
        </div>
        <p className="hero-lead">새로 문을 넓히는 가게에 1만 원부터 투자하고, 다음 달부터 매출을 나눠 받아요.</p>
      </header>

      <div className="page-body">
        <ol className="steps">
          <li>
            <span className="steps-no">1</span>
            <span>
              <strong>1만 원 단위로 청약</strong>
              카드 매출로 검증한 가게만 공모를 열어요. 한 사람당 500만 원까지.
            </span>
          </li>
          <li>
            <span className="steps-no">2</span>
            <span>
              <strong>모집이 다 차면 다음 달부터 지급</strong>
              매달 매출의 5%에서 정산 수수료 2%를 뺀 돈을 투자금 비율대로 나눠 받아요.
            </span>
          </li>
          <li>
            <span className="steps-no">3</span>
            <span>
              <strong>1.3배를 갚거나 5년이 지나면 끝</strong>
              수수료를 빼면 최대 1.274배까지 받아요. 장사가 안 되면 받는 돈도 줄어요.
            </span>
          </li>
        </ol>

        {!ready && <div className="skeleton" aria-busy="true" />}
        <ul className="offer-list">
          {recruiting.map((listing) => {
            const days = daysUntil(listing.recruitEndsOn);
            return (
              <li key={listing.id}>
                <Link to={`/app/offerings/${listing.id}`} className="offer-tile">
                  <span className="offer-tile-photo">
                    <Photo imageKey={listing.imageKey} />
                    <span className="offer-card-badge">{days === 0 ? '오늘 마감' : `D-${days}`}</span>
                    <span className="city-chip">
                      {listing.city} · {listing.regionLabel}
                    </span>
                  </span>
                  <span className="offer-tile-body">
                    <span className="offer-tile-head">
                      <strong>{listing.storeName}</strong>
                      {listing.verificationStatus === 'NORMAL' && (
                        <span className="tag tag--ok">
                          <CheckIcon className="tag-icon" />
                          매출 검증
                        </span>
                      )}
                    </span>
                    <span className="offer-tile-title">{listing.title}</span>
                    <span className="offer-card-meter" aria-hidden="true">
                      <i style={{ width: `${Math.min(100, listing.fundingRatePercent)}%` }} />
                    </span>
                    <span className="offer-tile-meta">
                      <span>
                        <b className="num">{manwon(listing.raisedAmount)}</b> / {manwon(listing.targetAmount)}
                      </span>
                      <b className="num">{percent(listing.fundingRatePercent, 0)}</b>
                    </span>
                    <span className="offer-tile-facts">
                      <span>
                        예상 연 <b className="num">{percent(listing.expectedAnnualReturnPercent)}</b>
                      </span>
                      <span>위험 {listing.riskGrade}</span>
                      <span>{listing.investorCount}명 참여</span>
                      <span>{dayLabel(listing.recruitEndsOn)} 마감</span>
                    </span>
                    {listing.investorPerk && <span className="offer-tile-perk">단골 혜택 · {listing.investorPerk.replace('투자자 인증하면 ', '')}</span>}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        {ready && recruiting.length === 0 && <p className="empty">지금 모집 중인 공모가 없어요.</p>}
        {upcomingListings.length > 0 && <p className="empty">모집을 마친 상품 {upcomingListings.length}개가 지급 시작을 기다리고 있어요.</p>}

        <p className="page-foot">
          공모 상품은 만기까지 보유하는 투자계약증권이에요(1단계). 예금이 아니라 원금을 잃을 수 있고, 예금자 보호를 받지 않아요.
        </p>
      </div>
    </div>
  );
}
