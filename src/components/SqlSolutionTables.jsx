import solutions from '../data/sqlSolutionTables.json';

export default function SqlSolutionTables({ questionId }) {
  const tables = solutions.questions[questionId];
  if (!tables?.length) return null;
  return <section className="sql-solution-tables" aria-label="SQL 단계별 완성 표">
    <h3>표로 보는 SQL 실행 과정</h3>
    {tables.map((table, index) => <article className="sql-solution-stage" key={`${index}-${table.title}`}>
      <h4>{index + 1}. {table.title}</h4><p>{table.description}</p>
      <div className="sql-table-scroll" role="region" aria-label={`${table.title} 표 · 가로 스크롤 가능`} tabIndex={0}>
        <table className="sql-data-table"><caption>{table.title} · {table.rows.length}행</caption><thead><tr>{table.columns.map((column, i) => <th scope="col" key={`${i}-${column}`}>{column}</th>)}</tr></thead>
          <tbody>{table.rows.length ? table.rows.map((row, i) => <tr key={i}>{row.map((value, j) => <td key={j}>{value === null ? <em>NULL</em> : String(value)}</td>)}</tr>) : <tr><td colSpan={table.columns.length}>조건에 맞는 행이 없습니다. (0행)</td></tr>}</tbody>
        </table>
      </div>
      {table.calculationNotes?.length > 0 && <ul className="sql-calculation-notes">{table.calculationNotes.map((note, i) => <li key={i}>{note}</li>)}</ul>}
    </article>)}
  </section>;
}
