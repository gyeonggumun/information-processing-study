import { readingPassages } from '../lib/readingText';
import { conceptTextParts } from '../lib/studyConceptTable';
import { questionConceptNotes } from '../data/plainConceptNotes';

export default function ReadingText({ children, highlight = false }) {
  return readingPassages(children).map((passage, index) => <span className="reading-passage" key={index}>{highlight ? conceptTextParts(passage).map(({ text, kind }, i) => kind ? <strong className={`concept-highlight ${kind}`} key={i}>{text}</strong> : text) : passage}</span>);
}

export function AnswerConceptNotes({ question }) {
  const notes = questionConceptNotes(question);
  if (!notes.length) return null;
  return <section className="answer-concept-notes" aria-label="정답 용어 정리"><h3>정답 용어 정리</h3><dl>{notes.map(note => <div key={note.name}><dt>{note.displayName}</dt><dd><p><ReadingText>{note.meaning}</ReadingText></p><p className="reading-distinction"><b>구별</b> <ReadingText>{note.contrast}</ReadingText></p></dd></div>)}</dl></section>;
}
