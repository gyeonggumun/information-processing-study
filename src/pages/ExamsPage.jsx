import { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Search } from 'lucide-react';
import { recentQuestions } from '../data/studyData';

const extraQuestions = [
  { id: '2026-2-04', year: 2026, round: 2, number: 4, category: '네트워크', type: '단답형', title: 'OSPF 라우팅 프로토콜' },
  { id: '2026-2-08', year: 2026, round: 2, number: 8, category: '데이터베이스', type: '계산형', title: 'RIGHT OUTER JOIN COUNT 결과' },
  { id: '2026-2-16', year: 2026, round: 2, number: 16, category: '네트워크', type: '계산형', title: '서브넷 프리픽스 길이' },
  { id: '2025-3-19', year: 2025, round: 3, number: 19, category: '테스트', type: '약술형', title: '테스트케이스 구성요소' },
  { id: '2024-2-10', year: 2024, round: 2, number: 10, category: '디자인 패턴', type: '단답형', title: 'Iterator 패턴' },
];

export default function ExamsPage() {
  const [query, setQuery] = useState('');
  const questions = useMemo(() => [...recentQuestions, ...extraQuestions].filter((question) => `${question.title} ${question.category} ${question.type}`.toLowerCase().includes(query.toLowerCase())), [query]);
  return (
    <div className="subpage">
      <div className="subpage-header"><div><p className="eyebrow">ALL PAST QUESTIONS</p><h1>기출문제</h1><p>과목 구분 없이 전체 회차의 문제를 한 흐름으로 풀어봅니다.</p></div><div className="exam-count"><strong>280</strong><span>문항 준비</span></div></div>
      <div className="toolbar panel"><div className="search-box"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="문제, 키워드, 유형 검색" /></div><span className="toolbar-meta">전체 기출 · {questions.length}개 표시</span></div>
      <div className="exam-list panel">{questions.map((question) => <div className="exam-row" key={question.id}><span className="exam-id">{question.year}<b>{question.round}회</b><small>{String(question.number).padStart(2, '0')}</small></span><div className="exam-content"><div><span className="tag">{question.category}</span><span className="muted-tag">{question.type}</span></div><h2>{question.title}</h2><p>문제 풀이와 해설을 확인할 수 있는 학습 항목입니다.</p></div><button className="row-action" type="button">풀기 <ArrowRight size={15} /></button></div>)}{questions.length === 0 && <div className="empty-state"><strong>검색 결과가 없습니다.</strong><span>다른 키워드로 다시 검색해보세요.</span></div>}</div>
      <div className="notice-panel"><CheckCircle2 size={19} /><span>현재 화면은 전체 기출 학습 흐름을 검증하기 위한 뼈대입니다. 이후 280문항과 해설 데이터를 연결합니다.</span></div>
    </div>
  );
}
