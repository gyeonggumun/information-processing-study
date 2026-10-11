import { useState } from 'react';
import { BookOpenCheck } from 'lucide-react';
import { subjects } from '../data/studyData';
import { examSummaryCardIds } from '../data/examSummaryCards';
import { MaterialStudyModal } from './StudyPage';

const summaryCards = subjects.flatMap((subject) =>
  (examSummaryCardIds[subject.id] ?? [])
    .map((id) => subject.materials.find((material) => material.id === id && material.kind === '세부 학습'))
    .filter(Boolean)
    .map((material) => ({ subject, material })),
);

export default function ExamSummaryPage() {
  const [activeSubject, setActiveSubject] = useState('all');
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [studyView, setStudyView] = useState(null);
  const visibleCards = activeSubject === 'all'
    ? summaryCards
    : summaryCards.filter(({ subject }) => subject.id === activeSubject);

  return (
    <div className="subpage">
      <div className="subpage-header">
        <div>
          <p className="eyebrow">EXAM STUDY</p>
          <h1>실기 요약</h1>
          <p>사이트의 기출 유형·코드 연습과 연결되는 세부 학습 카드만 모았습니다.</p>
        </div>
        <div className="favorites-count"><BookOpenCheck size={23} /><strong>{summaryCards.length}</strong><span>개 카드</span></div>
      </div>
      <div className="exam-summary-tabs" aria-label="실기 요약 과목 선택">
        <button type="button" className={activeSubject === 'all' ? 'active' : ''} onClick={() => setActiveSubject('all')} aria-pressed={activeSubject === 'all'}>전체</button>
        {subjects.map((subject) => (
          <button key={subject.id} type="button" className={activeSubject === subject.id ? 'active' : ''} onClick={() => setActiveSubject(subject.id)} aria-pressed={activeSubject === subject.id}>
            {subject.short} <span>{examSummaryCardIds[subject.id]?.length ?? 0}</span>
          </button>
        ))}
      </div>
      <p className="exam-summary-count">{visibleCards.length}개 세부 학습 카드</p>
      <div className="material-grid exam-summary-grid">
        {visibleCards.map(({ subject, material }, index) => (
          <article className={`material-card${selectedMaterial?.id === material.id ? ' selected' : ''}`} key={`${subject.id}-${material.id}`}>
            <span className={`material-number ${subject.color}`}>{String(index + 1).padStart(2, '0')}</span>
            <div>
              <span className="material-kind">{subject.short} · 세부 학습</span>
              <h2>{material.title}</h2>
              <p>{material.description}</p>
              <div className="material-card-actions">
                <button type="button" className={selectedMaterial?.id === material.id && studyView === 'summary' ? 'active' : ''} onClick={() => { setSelectedMaterial(material); setStudyView('summary'); }}>빠른 요약</button>
                <button type="button" className={selectedMaterial?.id === material.id && studyView === 'detail' ? 'active' : ''} onClick={() => { setSelectedMaterial(material); setStudyView('detail'); }}>상세 정리</button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {selectedMaterial && studyView && <MaterialStudyModal material={selectedMaterial} studyView={studyView} onClose={() => { setSelectedMaterial(null); setStudyView(null); }} />}
      <div className="notice-panel"><BookOpenCheck size={19} /><span>기출 유형에 맞춰 선별한 복습 목록입니다. 특정 회차의 실제 시험 원문을 수록한 페이지는 아닙니다.</span></div>
    </div>
  );
}
