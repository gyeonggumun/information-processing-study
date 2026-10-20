import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';

const css = readFileSync('src/styles/responsive.css', 'utf8');
const app = readFileSync('src/App.jsx', 'utf8');
assert(app.indexOf("import './styles/responsive.css'") > app.indexOf("import './styles/global.css'"), '반응형 보정은 기존 CSS 다음에 로드');
assert(/html, body\s*\{ min-width: 0;/u.test(css), '320px 강제 최소 폭으로 스크롤바 너비만큼 넘치는 문제 방지');
assert(!/(?:html|body)\s*\{[^}]*overflow(?:-x)?:\s*(?:hidden|clip)/u.test(css), '페이지 넘침을 숨겨 내용을 잘라내지 않음');
assert(css.includes('@media (max-width: 1180px)') && css.includes('grid-template-columns: minmax(0, 1fr) auto 44px'), '태블릿 메뉴 전환');
assert(css.includes('grid-column: 1 / -1; grid-row: 2'), '휴대폰 계정 영역 별도 줄');
assert(css.includes('100dvh') && css.includes('safe-area-inset-bottom'), '동적 높이 및 기기 안전 영역');
assert(css.includes('.top-navigation .dropdown-panel') && css.includes('visibility: visible'), '하위 메뉴 터치 접근');
assert(css.includes('overscroll-behavior-x: contain'), '표·타임라인 가로 스크롤 유지');
assert(css.includes('font-size: 16px'), '모바일 입력 시 자동 확대 예방');

const mockPath = fileURLToPath(new URL('./fixtures/responsive-ui/mocks.jsx', import.meta.url));
const names = ['AuthContext', 'FavoritesContext', 'usePracticeAttempts', 'useExamSummaryPreferences', 'useInquiries', 'supabase'];
const server = await createServer({ configFile: false, plugins: [react(), {
  name: 'responsive-ssr-isolated', enforce: 'pre',
  resolveId(id) { if (names.some(name => id.replace(/\.(jsx?|tsx?)$/u, '').endsWith(`/${name}`))) return mockPath; },
}], optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false } });
try {
  const { FixtureIdentity } = await server.ssrLoadModule('/scripts/fixtures/responsive-ui/mocks.jsx');
  const { default: Layout } = await server.ssrLoadModule('/src/components/Layout.jsx');
  const pages = [
    ['/', 'HomePage'], ['/study', 'StudyPage'],
    ...['software-design', 'software-development', 'database', 'programming', 'systems'].map(id => [`/study/${id}`, 'StudyPage']),
    ...['C', 'Java', 'Python', 'SQL'].map(id => [`/code/${id}`, 'CodePage']),
    ['/favorites', 'FavoritesPage'], ['/exam-summary', 'ExamSummaryPage'], ['/statistics', 'StatisticsPage'],
    ['/practice-history', 'PracticeHistoryPage'], ['/wrong-answers', 'WrongAnswersPage'], ['/inquiries', 'InquiriesPage'], ['/admin', 'AdminPage'],
  ];
  for (const [path, name] of pages) {
    const { default: Page } = await server.ssrLoadModule(`/src/pages/${name}.jsx`);
    const pattern = path.startsWith('/study/') ? '/study/:subjectId' : path.startsWith('/code/') ? '/code/:language' : path;
    const html = renderToStaticMarkup(createElement(FixtureIdentity, null,
      createElement(MemoryRouter, { initialEntries: [path] },
        createElement(Routes, null, createElement(Route, { element: createElement(Layout) },
          createElement(Route, { path: pattern, element: createElement(Page) }))))));
    assert(html.includes('<main') && html.includes('<h1'), `${path}: 페이지 내용 유지`);
    assert(html.includes('aria-label="메뉴 열기"') && html.includes('aria-expanded="false"') && html.includes('aria-controls="primary-navigation"'), `${path}: 메뉴 상태 및 연결`);
    assert(html.includes('id="primary-navigation"') && html.includes('aria-label="주요 메뉴"'), `${path}: 메뉴 영역 이름`);
    assert(html.includes('alt="정처기학습 플랫폼"') && html.includes('59:59'), `${path}: 로고와 타이머 유지`);
    for (const language of ['C', 'Java', 'Python', 'SQL']) assert(html.includes(`/code/${language}`), `${path}: 언어 하위 링크 유지`);
  }
  console.log(`PASS: ${pages.length}개 화면의 콘텐츠·메뉴 접근성·하위 이동·로고·타이머 보존, 최소 폭·태블릿 전환·모달 높이·터치 메뉴·입력 크기 회귀 검증`);
} finally { await server.close(); }
