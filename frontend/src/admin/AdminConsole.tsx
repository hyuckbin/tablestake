import { useEffect } from 'react';
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { subscribe } from '../lib/sync';
import { useApi } from '../lib/useApi';
import type { StoreOverview } from '../lib/types';
import { manwon } from '../lib/format';
import { StatusIcon } from '../components/Badges';
import { ErrorNote } from '../components/ErrorNote';
import { StorePanel } from './StorePanel';
import './admin.css';

/** 운영 콘솔. 왼쪽에 가게 목록, 오른쪽에 고른 가게의 정산·매출·한도 심사. */
export function AdminConsole() {
  return (
    <Routes>
      <Route index element={<ConsoleLayout />} />
      <Route path="stores/:storeId" element={<ConsoleLayout />} />
    </Routes>
  );
}

const TONE = { NORMAL: 'ok', CAUTION: 'caution', WARNING: 'alert' } as const;

function ConsoleLayout() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const stores = useApi<StoreOverview[]>('/api/admin/stores');
  const selected = storeId ? Number(storeId) : null;

  // 처음 들어오면 첫 가게를 연다. 데모를 초기화하면 가게 번호가 바뀌므로 목록 첫 가게로 돌아간다.
  useEffect(() => {
    if (!stores.data || stores.data.length === 0) return;
    if (selected === null || !stores.data.some((store) => store.id === selected)) {
      navigate(`/admin/stores/${stores.data[0].id}`, { replace: true });
    }
  }, [stores.data, selected, navigate]);

  useEffect(
    () =>
      subscribe((event) => {
        if (event.type === 'reset') navigate('/admin', { replace: true });
      }),
    [navigate],
  );

  return (
    <div className="adm">
      <aside className="adm-side">
        <div className="adm-brand">
          <span className="adm-wordmark">Tablestake</span>
          <span className="adm-brand-sub">운영 콘솔</span>
        </div>
        <p className="adm-side-label">가게 (포항 실증 · 확장 예시)</p>
        {stores.error && <ErrorNote error={stores.error} />}
        <nav className="adm-stores" aria-label="가게 목록">
          {stores.data?.map((store) => {
            const offering = store.offerings[store.offerings.length - 1];
            const tone = TONE[store.verificationStatus];
            return (
              <Link
                key={store.id}
                to={`/admin/stores/${store.id}`}
                className={`adm-store${store.id === selected ? ' is-current' : ''}`}
                aria-current={store.id === selected ? 'page' : undefined}
              >
                <span className="adm-store-name">{store.name}</span>
                <span className="adm-store-meta">
                  {offering ? `${offering.statusLabel}, ${manwon(offering.raisedAmount)} / ${manwon(offering.targetAmount)}` : '상품 없음'}
                </span>
                <span className={`adm-store-status adm-store-status--${tone}`}>
                  <StatusIcon tone={tone} />
                  {store.verificationStatusLabel}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="adm-main">
        {selected !== null && stores.data?.some((store) => store.id === selected) && <StorePanel key={selected} storeId={selected} />}
      </main>
    </div>
  );
}
