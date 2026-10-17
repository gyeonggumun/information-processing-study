import { useId } from 'react';
import { studyComparisonNotes } from '../data/studyComparisonNotes';
import { buildConceptSections, conceptTextParts } from '../lib/studyConceptTable';

function ConceptText({ children }) {
  return conceptTextParts(children).map(({ text, kind }, index) => kind
    ? <strong className={`concept-highlight ${kind}`} key={index}>{text}</strong> : text);
}

export default function StudyConceptTable({ visual, groups, title }) {
  const titleId = useId();
  const sections = buildConceptSections({ visual, groups, notes: studyComparisonNotes });
  if (!sections.length) return null;

  return <section className="study-concept-sheet" aria-labelledby={titleId}>
    <header className="study-concept-heading"><h3 id={titleId}>{title ?? visual?.title ?? sections[0].name}</h3><p><span className="concept-highlight key">파랑: 핵심 용어</span><span className="concept-highlight caution">빨강: 제한·주의</span></p></header>
    {sections.map((section) => {
      const examples = section.items.filter((item) => item.example);
      return <div className="study-concept-section" key={section.name}>
        <table className="study-concept-table" role="table">
          <caption>{sections.length > 1 ? section.name : '용어별 핵심 비교'}{section.flow && <small>위에서 아래 순서로 읽어보세요.</small>}</caption>
          <tbody>{section.items.map((item, index) => <tr key={`${item.name}-${index}`}>
            <th scope="row">{item.name}</th>
            <td><p><ConceptText>{item.meaning}</ConceptText></p>{item.hint && item.hint !== item.meaning && <p className="concept-distinction"><span>구별 포인트</span> <ConceptText>{item.hint}</ConceptText></p>}</td>
          </tr>)}</tbody>
        </table>
        {examples.length > 0 && <details className="study-concept-examples"><summary>예시로 이해하기</summary><dl>{examples.map((item, index) => <div key={`${item.name}-${index}`}><dt>{item.name}</dt><dd><ConceptText>{item.example}</ConceptText></dd></div>)}</dl></details>}
      </div>;
    })}
  </section>;
}
