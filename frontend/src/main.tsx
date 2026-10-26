import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import '@fontsource/ibm-plex-sans-kr/400.css';
import '@fontsource/ibm-plex-sans-kr/500.css';
import '@fontsource/ibm-plex-sans-kr/600.css';
import '@fontsource/ibm-plex-sans-kr/700.css';
import '@fontsource/do-hyeon/400.css';
import '@fontsource/black-han-sans/400.css';
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import './styles/base.css';

import { Stage } from './stage/Stage';
import { InvestorApp } from './app/InvestorApp';
import { AdminConsole } from './admin/AdminConsole';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* 발표용: 왼쪽 투자자 휴대폰 + 오른쪽 운영 콘솔 */}
        <Route path="/" element={<Stage />} />
        <Route path="/app/*" element={<InvestorApp />} />
        <Route path="/admin/*" element={<AdminConsole />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
