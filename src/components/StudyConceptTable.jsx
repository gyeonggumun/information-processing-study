import { useId } from 'react';
import { studyComparisonNotes } from '../data/studyComparisonNotes';
import { studyUnderstandingNotes } from '../data/studyUnderstandingNotes';
import { buildConceptSections, conceptTextParts } from '../lib/studyConceptTable';

function ConceptText({ children }) {
  return conceptTextParts(children).map(({ text, kind }, index) => kind
    ? <strong className={`concept-highlight ${kind}`} key={index}>{text}</strong> : text);
}

export default function StudyConceptTable({ visual, groups, title }) {
  const titleId = useId();
  const sections = buildConceptSections({ visual, groups, notes: studyComparisonNotes, understanding: studyUnderstandingNotes });
  if (!sections.length) return null;

  return <section className="study-concept-sheet" aria-labelledby={titleId}>
    <header className="study-concept-heading"><h3 id={titleId}>{title ?? visual?.title ?? sections[0].name}</h3><p><span className="concept-highlight key">파랑: 핵심 용어</span><span className="concept-highlight caution">빨강: 제한·주의</span></p></header>
    {sections.map((section) => <div className="study-concept-section" key={section.name}>
        {section.intro && <div className="concept-reading-guide">{section.question && <strong>{section.question}</strong>}<p><ConceptText>{section.intro}</ConceptText></p></div>}
        <table className="study-concept-table" role="table">
          <caption>{sections.length > 1 ? section.name : '용어별 핵심 비교'}{section.memory && section.memory !== section.intro && <small>{section.memory}</small>}{section.flow && <small>위에서 아래 순서로 읽어보세요.</small>}</caption>
          <tbody>{section.items.map((item, index) => <tr key={`${item.name}-${index}`}>
            <th scope="row">{item.name}</th>
            <td>
              <p><ConceptText>{item.meaning}</ConceptText></p>
              {item.explanation && item.explanation !== item.meaning && <p className="concept-explanation"><span>쉽게 이해하기</span><ConceptText>{item.explanation}</ConceptText></p>}
              {item.example && <p className="concept-example"><span>예시</span><ConceptText>{item.example}</ConceptText></p>}
              {item.hint && item.hint !== item.meaning && <p className="concept-distinction"><span>구별 기준</span><ConceptText>{item.hint}</ConceptText></p>}
              {item.detailText && item.detailText !== item.explanation && item.detailText !== item.meaning && <details className="concept-extra"><summary>원리 더 알아보기</summary><p><ConceptText>{item.detailText}</ConceptText></p></details>}
            </td>
          </tr>)}</tbody>
        </table>
        {section.caution && <p className="concept-section-caution"><b>함께 기억하기</b><ConceptText>{section.caution}</ConceptText></p>}
      </div>)}
  </section>;
}
