// 실제 인증·DB·사용자 기록에 접근하지 않는 반응형 화면 검증 전용 서버입니다.
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
const mocks = fileURLToPath(new URL('./fixtures/responsive-ui/mocks.jsx', import.meta.url));
const names = ['AuthContext', 'FavoritesContext', 'usePracticeAttempts', 'useExamSummaryPreferences', 'useInquiries', 'supabase'];
const server = await createServer({ configFile: false, plugins: [react(), {
  name: 'isolated-responsive-fixtures', enforce: 'pre',
  resolveId(id) {
    if (names.some(name => id.replace(/\.(jsx?|tsx?)$/u, '').endsWith(`/${name}`))) return mocks;
  },
}], optimizeDeps: { noDiscovery: true, include: ['react', 'react-dom/client', 'react/jsx-dev-runtime', 'react-router-dom', 'lucide-react', 'pdf-lib'] }, server: { host: '127.0.0.1', port: 5191, strictPort: true } });
await server.listen();
console.log('반응형 검증: http://127.0.0.1:5191/scripts/fixtures/responsive-ui/index.html');
