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
  const { subjects } = await server.ssrLoadModule('/src/data/studyData.js');
  const material = subjects[0].materials.find(item => item.studyRole !== 'overview');
  for (const [path, name] of pages.filter(([path, name]) => ['FavoritesPage', 'ExamSummaryPage'].includes(name) || name === 'StudyPage' && path === '/study/software-design')) {
    const { default: Page } = await server.ssrLoadModule(`/src/pages/${name}.jsx`);
    // 이동 기록에서 선택 상태가 사라지면 닫히고, 복원되면 해당 모드로 열려야 합니다.
    for (const view of [null, 'summary', 'detail', 'invalid']) {
      const html = renderToStaticMarkup(createElement(FixtureIdentity, null,
        createElement(MemoryRouter, { initialEntries: [{ pathname: path, state: view ? { studyModal: { materialId: material.id, view } } : null }] },
          createElement(Routes, null, createElement(Route, {
            path: path.startsWith('/study/') ? '/study/:subjectId' : path,
            element: createElement(Page),
          })))));
      const isOpen = view === 'summary' || view === 'detail';
      assert.equal(html.includes('role="dialog"'), isOpen, `${path}/${view}: 이동 기록에 따른 모달 표시`);
      if (isOpen) assert(html.includes(`aria-label="${material.title} ${view === 'detail' ? '상세 정리' : '빠른 요약'}"`));
    }
  }
  console.log(`PASS: ${pages.length}개 화면 회귀 검증 및 학습·즐겨찾기·실기 요약의 이동 기록별 모달 열림·닫힘·모드 복원`);
} finally { await server.close(); }
