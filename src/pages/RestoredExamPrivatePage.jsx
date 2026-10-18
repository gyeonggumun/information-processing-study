import { Link } from 'react-router-dom';

export default function RestoredExamPrivatePage() {
  return <div className="subpage"><section className="panel empty-review"><p className="eyebrow">PRIVATE PAGE</p><h1>비공개 페이지입니다.</h1><p>실기 복원 문제는 Pro·Admin 계정에만 공개됩니다.</p><Link to="/" className="secondary-button">홈으로 돌아가기</Link></section></div>;
}
