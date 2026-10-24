import { useId } from 'react';
import { studyComparisonNotes } from '../data/studyComparisonNotes';
import { studyUnderstandingNotes } from '../data/studyUnderstandingNotes';
import { buildConceptSections } from '../lib/studyConceptTable';
import ReadingText from './ReadingText';

export default function StudyConceptTable({ visual, groups, title }) {
  const titleId = useId();
  const sections = buildConceptSections({ visual, groups, notes: studyComparisonNotes, understanding: studyUnderstandingNotes });
  if (!sections.length) return null;

  return <section className="study-concept-sheet" aria-labelledby={titleId}>
    <header className="study-concept-heading"><h3 id={titleId}>{title ?? visual?.title ?? sections[0].name}</h3><p><span className="concept-highlight key">파랑: 핵심 용어</span><span className="concept-highlight caution">빨강: 제한·주의</span></p></header>
    {sections.map((section) => <div className="study-concept-section" key={section.name}>
        {section.intro && <div className="concept-reading-guide">{section.question && <strong>{section.question}</strong>}<p><ReadingText highlight>{section.intro}</ReadingText></p></div>}
        <table className="study-concept-table" role="table">
          <caption>{sections.length > 1 ? section.name : '용어별 핵심 비교'}{section.memory && section.memory !== section.intro && <small>{section.memory}</small>}{section.flow && <small>위에서 아래 순서로 읽어보세요.</small>}</caption>
          <tbody>{section.items.map((item, index) => <tr key={`${item.name}-${index}`}>
            <th scope="row">{item.name}</th>
            <td>
              <p className="concept-plain-meaning"><ReadingText highlight>{item.plainMeaning ?? item.meaning}</ReadingText></p>
              {(item.example || item.explanation !== item.meaning && item.explanation) && <p className="concept-example"><span>{item.example ? '예시' : '풀어 보면'}</span><ReadingText highlight>{item.example || item.explanation}</ReadingText></p>}
              {item.hint && item.hint !== item.meaning && <p className="concept-distinction"><span>구별 기준</span><ReadingText highlight>{item.hint}</ReadingText></p>}
              {(item.plainMeaning && item.meaning !== item.plainMeaning || item.detailText && item.detailText !== item.explanation && item.detailText !== item.meaning || item.example && item.explanation && item.explanation !== item.meaning) && <details className="concept-extra"><summary>원리와 보충 설명</summary>
                {item.plainMeaning && item.meaning !== item.plainMeaning && <p><ReadingText highlight>{item.meaning}</ReadingText></p>}
                {item.example && item.explanation && item.explanation !== item.meaning && <p><ReadingText highlight>{item.explanation}</ReadingText></p>}
                {item.detailText && item.detailText !== item.explanation && item.detailText !== item.meaning && <p><ReadingText highlight>{item.detailText}</ReadingText></p>}
              </details>}
            </td>
          </tr>)}</tbody>
        </table>
        {section.caution && <p className="concept-section-caution"><b>함께 기억하기</b><ReadingText highlight>{section.caution}</ReadingText></p>}
      </div>)}
  </section>;
}
