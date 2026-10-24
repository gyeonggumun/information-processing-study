import ProtectedRoute from '../components/ProtectedRoute';
import RestoredExamsPage from './RestoredExamsPage';
import RestoredExamPrivatePage from './RestoredExamPrivatePage';

export default function SimilarExamsPage() {
  return <ProtectedRoute requiredRole="pro" accessDeniedElement={<RestoredExamPrivatePage similar />}><RestoredExamsPage similar /></ProtectedRoute>;
}
