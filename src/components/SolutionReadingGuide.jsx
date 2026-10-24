import ReadingText from './ReadingText';

export default function SolutionReadingGuide({ guide }) {
  if (!guide) return null;
  return <section className="solution-reading-guide" aria-label="이 문제의 풀이 기준">
    <h3>먼저 이해할 풀이 기준</h3>
    <ol className="reading-steps">{guide.rules.map(rule => <li key={rule}><ReadingText>{rule}</ReadingText></li>)}</ol>
    <p className="solution-caution"><strong>헷갈리기 쉬운 점</strong> <ReadingText>{guide.caution}</ReadingText></p>
  </section>;
}
