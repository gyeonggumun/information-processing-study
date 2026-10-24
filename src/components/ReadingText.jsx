import { readingPassages } from '../lib/readingText';
import { conceptTextParts } from '../lib/studyConceptTable';
import { questionConceptNotes } from '../data/plainConceptNotes';
import { getExamTheoryDistinctions } from '../data/examTheoryDistinctions';

export default function ReadingText({ children, highlight = false }) {
  return readingPassages(children).map((passage, index) => <span className="reading-passage" key={index}>{highlight ? conceptTextParts(passage).map(({ text, kind }, i) => kind ? <strong className={`concept-highlight ${kind}`} key={i}>{text}</strong> : text) : passage}</span>);
}

export function AnswerConceptNotes({ question }) {
  const existing = questionConceptNotes(question);
  const notes = existing.length ? existing : getExamTheoryDistinctions(question);
  if (!notes.length) return null;
  const title = existing.length ? '정답 용어 정리' : '헷갈리기 쉬운 개념 구별';
  return <section className="answer-concept-notes" aria-label={title}><h3>{title}</h3><dl>{notes.map(note => <div key={note.name}><dt>{note.displayName}</dt><dd><p><ReadingText>{note.meaning}</ReadingText></p><p className="reading-distinction"><b>{existing.length ? '구별' : '구별점'}</b> <ReadingText>{note.contrast}</ReadingText></p></dd></div>)}</dl></section>;
}
