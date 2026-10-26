import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 백엔드(Spring Boot, 8080)로 /api 요청을 넘긴다. 프론트와 백이 같은 출처처럼 보여 CORS 설정이 필요 없다.
const backend = 'http://localhost:8080';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': backend },
  },
  preview: {
    port: 4173,
    proxy: { '/api': backend },
  },
});
