import { ArrowRight, BookmarkX, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function WrongAnswersPage() {
  return <div className="subpage"><div className="subpage-header"><div><p className="eyebrow">REVIEW DESK</p><h1>오답노트</h1><p>전체 과목에서 틀린 문제를 모아 다시 풀이하는 공간입니다.</p></div><BookmarkX className="header-line-icon" size={42} /></div><div className="wrong-summary"><div className="summary-card"><span>누적 오답</span><strong>18</strong><small>다시 풀어볼 문제</small></div><div className="summary-card"><span>복습 완료</span><strong>42%</strong><small>이번 주 기준</small></div><div className="summary-card"><span>취약 영역</span><strong>SQL</strong><small>가장 많은 오답</small></div></div><div className="empty-review panel"><div className="empty-icon"><RotateCcw size={22} /></div><h2>오답 문제를 연결할 준비 중입니다.</h2><p>문제 풀이 기록이 저장되면 이곳에서 과목 구분 없이 오답을 확인할 수 있습니다.</p><Link to="/exams" className="primary-button">기출문제 풀기 <ArrowRight size={15} /></Link></div></div>;
}
