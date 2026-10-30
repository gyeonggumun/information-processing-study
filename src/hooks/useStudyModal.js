import { useLocation, useNavigate } from 'react-router-dom';

// 모달도 이동 기록 한 칸을 사용하여 기기의 뒤로가기로 먼저 닫히게 합니다.
export function useStudyModal() {
  const location = useLocation();
  const navigate = useNavigate();
  const selection = location.state?.studyModal;
  const studyView = ['summary', 'detail'].includes(selection?.view) ? selection.view : null;

  const openStudyModal = (materialId, view) => {
    navigate(`${location.pathname}${location.search}${location.hash}`, {
      state: { ...location.state, studyModal: { materialId, view } },
      replace: Boolean(studyView),
      preventScrollReset: true,
    });
  };

  const closeStudyModal = () => {
    if (studyView) navigate(-1);
  };

  return { selectedMaterialId: selection?.materialId, studyView, openStudyModal, closeStudyModal };
}
