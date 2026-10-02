import { BookOpenCheck, Code2, Database, Network, Workflow, Wrench } from 'lucide-react';

const subjectIcons = {
  'software-design': Workflow,
  'software-development': Wrench,
  database: Database,
  programming: Code2,
  systems: Network,
};

export default function SubjectIcon({ subjectId }) {
  const Icon = subjectIcons[subjectId] ?? BookOpenCheck;
  return <Icon size={18} strokeWidth={2} aria-hidden="true" />;
}
