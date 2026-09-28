import { useState } from 'react';
import { ArrowRight, BookOpenCheck, FileText, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { subjects } from '../data/studyData';
import { useFavorites } from '../contexts/FavoritesContext';
import { MaterialStudyModal } from './StudyPage';

export default function FavoritesPage() {
  const { favorites, isLoading, error, pendingMaterialId, toggleFavorite } = useFavorites();
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const favoriteItems = favorites.map((favorite) => {
    const subject = subjects.find((item) => item.id === favorite.subject_id);
    const material = subject?.materials.find((item) => item.id === favorite.material_id);
    return subject && material ? { subject, material } : null;
  }).filter(Boolean);

  return (
    <div className="subpage">
      <div className="subpage-header">
        <div><p className="eyebrow">FAVORITE STUDY</p><h1>즐겨찾기</h1><p>자주 복습할 학습 자료를 별표로 표시하고 한곳에서 다시 확인합니다.</p></div>
        <div className="favorites-count"><Star size={23} /><strong>{favoriteItems.length}</strong><span>개 자료</span></div>
      </div>
      {error && <p className="save-error" role="alert">{error}</p>}
      {isLoading ? <div className="empty-review panel"><div className="empty-icon"><Star size={22} /></div><h2>즐겨찾기를 불러오는 중입니다.</h2><p>계정에 저장된 학습 자료를 확인하고 있습니다.</p></div> : favoriteItems.length === 0 ? <EmptyFavorites /> : <div className="material-grid favorites-grid">{favoriteItems.map(({ subject, material }, index) => <FavoriteMaterialCard key={`${subject.id}-${material.id}`} subject={subject} material={material} index={index} isPending={pendingMaterialId === material.id} onToggle={() => toggleFavorite({ subjectId: subject.id, materialId: material.id })} onOpen={() => setSelectedMaterial(material)} />)}</div>}
      {selectedMaterial && <MaterialStudyModal material={selectedMaterial} studyView="summary" onClose={() => setSelectedMaterial(null)} />}
      <div className="notice-panel"><BookOpenCheck size={19} /><span>즐겨찾기는 로그인한 계정에 저장되며 다른 기기에서도 같은 자료를 확인할 수 있습니다.</span></div>
    </div>
  );
}

function FavoriteMaterialCard({ subject, material, index, isPending, onToggle, onOpen }) {
  return (
    <article className="material-card favorite-material-card">
      <span className={`material-number ${subject.color}`}>{String(index + 1).padStart(2, '0')}</span>
      <div>
        <div className="favorite-card-heading"><span className="material-kind">{subject.short}</span><button type="button" className="favorite-button active" onClick={onToggle} disabled={isPending} aria-label={`${material.title} 즐겨찾기 해제`} aria-pressed="true"><Star size={17} /></button></div>
        <h2>{material.title}</h2>
        <p>{material.description}</p>
        <div className="favorite-card-actions"><button type="button" className="material-card-study-button" onClick={onOpen}>학습 내용 보기 <ArrowRight size={14} /></button><Link to={`/study/${subject.id}`} className="favorite-subject-link"><FileText size={13} /> 과목으로 이동</Link></div>
      </div>
    </article>
  );
}

function EmptyFavorites() {
  return <div className="empty-review panel"><div className="empty-icon"><Star size={22} /></div><h2>아직 즐겨찾기한 자료가 없습니다.</h2><p>학습하기에서 자주 보고 싶은 카드의 별표를 누르면 이곳에 모아집니다.</p><Link to="/study" className="primary-button">학습 자료 둘러보기 <ArrowRight size={15} /></Link></div>;
}
