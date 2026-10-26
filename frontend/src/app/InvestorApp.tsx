import { useEffect, useState } from 'react';
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { subscribe } from '../lib/sync';
import { useApi } from '../lib/useApi';
import { syncListings, syncPortfolio } from '../lib/market';
import type { OfferingSummary, Portfolio } from '../lib/types';
import { HomePage } from './HomePage';
import { MarketPage } from './MarketPage';
import { OfferingsPage } from './OfferingsPage';
import { StorePage } from './StorePage';
import { InvestPage } from './InvestPage';
import { PortfolioPage } from './PortfolioPage';
import { PayoutReceipt } from './PayoutReceipt';
import { Toasts } from './ui/Toasts';
import { ErrorNote } from '../components/ErrorNote';
import { HomeIcon, MarketIcon, OfferingIcon, WalletIcon } from './ui/Icons';
import './app.css';
import './pages.css';
import './store.css';

const TABS = [
  { to: '/app', label: '홈', Icon: HomeIcon, end: true },
  { to: '/app/market', label: '마켓', Icon: MarketIcon, end: false },
  { to: '/app/offerings', label: '공모', Icon: OfferingIcon, end: true },
  { to: '/app/portfolio', label: '내 자산', Icon: WalletIcon, end: false },
];

/** 투자자 앱. 발표 화면에서는 휴대폰 틀 안의 iframe 으로 뜬다. */
export function InvestorApp() {
  const navigate = useNavigate();
  const framed = useIsFramed();
  const { pathname } = useLocation();

  // 상품 목록과 내 투자 현황을 시장(모의)에 반영한다. 다른 화면에서 투자·정산하면 자동으로 다시 불러온다.
  const offerings = useApi<OfferingSummary[]>('/api/offerings');
  const portfolio = useApi<Portfolio>('/api/me/portfolio');
  useEffect(() => {
    if (offerings.data) syncListings(offerings.data);
  }, [offerings.data]);
  useEffect(() => {
    if (portfolio.data) syncPortfolio(portfolio.data);
  }, [portfolio.data]);

  useEffect(
    () =>
      subscribe((event) => {
        if (event.type === 'reset') navigate('/app', { replace: true });
      }),
    [navigate],
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const top = topOf(pathname);
  const showTabs = TABS.some((tab) => tab.to === pathname.replace(/\/$/, ''));

  return (
    <div className={`app${framed ? ' app--framed' : ''}`}>
      <div className="app-shell" data-top={top} data-tabs={showTabs}>
        {framed && <StatusBar />}
        <div className="app-content">
          {offerings.error && !offerings.data && (
            <div className="app-error">
              <ErrorNote error={offerings.error} />
            </div>
          )}
          <Routes>
            <Route index element={<HomePage />} />
            <Route path="market" element={<MarketPage />} />
            <Route path="offerings" element={<OfferingsPage />} />
            <Route path="offerings/:offeringId" element={<StorePage />} />
            <Route path="offerings/:offeringId/invest" element={<InvestPage />} />
            <Route path="offerings/:offeringId/trade" element={<TradeRedirect />} />
            <Route path="portfolio" element={<PortfolioPage />} />
            <Route path="*" element={<Navigate to="/app" replace />} />
          </Routes>
        </div>
        {showTabs && (
          <nav className="tabbar" aria-label="메뉴">
            {TABS.map(({ to, label, Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => `tabbar-item${isActive ? ' is-current' : ''}`}>
                <Icon className="tabbar-icon" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        )}
        <Toasts />
        <PayoutReceipt />
      </div>
    </div>
  );
}

/** 예전 주소(/trade)는 가게 화면에서 바로 구매 시트를 연다. */
function TradeRedirect() {
  const { offeringId } = useParams();
  return <Navigate to={`/app/offerings/${offeringId}?order=buy`} replace />;
}

/** 화면 맨 위 색: 어두운 머리(홈·마켓·내 자산), 사진(가게), 밝은 바탕(투자하기) */
function topOf(pathname: string): 'dark' | 'photo' | 'light' {
  const path = pathname.replace(/\/$/, '');
  if (/^\/app\/offerings\/\d+$/.test(path)) return 'photo';
  if (/^\/app\/offerings\/\d+\/invest$/.test(path)) return 'light';
  return 'dark';
}

/** 휴대폰 틀 안에서만 보이는 상단 상태 표시줄 (시계·배터리) */
function StatusBar() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 20_000);
    return () => window.clearInterval(timer);
  }, []);
  const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
  return (
    <div className="statusbar" aria-hidden="true">
      <span className="statusbar-time">{time}</span>
      <span className="statusbar-icons">
        <svg viewBox="0 0 18 12">
          <rect x="0" y="8" width="3" height="4" rx="0.8" />
          <rect x="5" y="5.5" width="3" height="6.5" rx="0.8" />
          <rect x="10" y="3" width="3" height="9" rx="0.8" />
          <rect x="15" y="0" width="3" height="12" rx="0.8" />
        </svg>
        <svg viewBox="0 0 26 12">
          <rect x="0.5" y="0.5" width="22" height="11" rx="3" fill="none" stroke="currentColor" />
          <rect x="2.5" y="2.5" width="16" height="7" rx="1.5" />
          <rect x="24" y="4" width="1.6" height="4" rx="0.8" />
        </svg>
      </span>
    </div>
  );
}

function useIsFramed(): boolean {
  const [framed] = useState(() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  });
  return framed;
}
