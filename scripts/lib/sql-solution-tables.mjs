import { DatabaseSync } from 'node:sqlite';

function tokensOf(sql) {
  let depth = 0;
  return [...sql.matchAll(/--[^\n]*|\/\*[\s\S]*?\*\/|'(?:''|[^'])*'|"(?:""|[^"])*"|[A-Za-z_][A-Za-z_0-9]*|[^\s]/gu)]
    .filter(match => !match[0].startsWith('--') && !match[0].startsWith('/*'))
    .map(match => {
      const text = match[0];
      if (text === ')') depth--;
      const token = { text, word: /^[A-Za-z_]/u.test(text) ? text.toUpperCase() : '', at: match.index, depth };
      if (text === '(') depth++;
      return token;
    });
}
const quote = name => `"${name.replaceAll('"', '""')}"`;
const normalize = value => String(value).trim().replace(/\s+/gu, ' ');

export function buildSqlSolutionTables(question) {
  if (question.family === 'create-domain-check') return [];
  const db = new DatabaseSync(':memory:');
  const tables = [];
  let sequence = 0;
  const capture = (query, title, description) => {
    const view = `__solution_${sequence++}`;
    db.exec(`CREATE TEMP VIEW ${view} AS ${query.replace(/;\s*$/u, '')};`);
    const columns = db.prepare(`PRAGMA table_info(${quote(view)})`).all().map(row => row.name);
    const rows = db.prepare(`SELECT * FROM ${view}`).all().map(row => columns.map(column => row[column]));
    const result = { title, description, columns, rows };
    tables.push(result);
    return result;
  };
  const addCalculationStages = sql => {
    const tokens = tokensOf(sql);
    if (tokens[0]?.word !== 'SELECT' || tokens.some(t => t.word === 'UNION' && t.depth === 0)) return;
    const find = word => tokens.findIndex(t => t.word === word && t.depth === 0);
    const from = find('FROM'), where = find('WHERE'), group = find('GROUP'), having = find('HAVING');
    if (from < 0 || tokens[from + 1]?.text === '(') return;
    const endAt = index => tokens[index]?.at ?? sql.length;
    const boundaryAfter = index => tokens.findIndex((t, i) => i > index && t.depth === 0 && (['GROUP', 'HAVING', 'ORDER', 'LIMIT'].includes(t.word) || t.text === ';'));
    const firstBoundary = tokens.findIndex((t, i) => i > from && t.depth === 0 && (['WHERE', 'GROUP', 'HAVING', 'ORDER', 'LIMIT'].includes(t.word) || t.text === ';'));
    const source = sql.slice(tokens[from].at, endAt(firstBoundary));
    const join = tokens.some(t => t.word === 'JOIN' && t.depth === 0);
    let filteredSource = source;
    if (where >= 0) {
      const end = boundaryAfter(where), condition = sql.slice(tokens[where].at + tokens[where].text.length, endAt(end));
      filteredSource = sql.slice(tokens[from].at, endAt(end));
      if (!join) {
        const scalar = [];
        for (let i = where + 1; i < tokens.length; i++) {
          if (tokens[i].text !== '(' || tokens[i + 1]?.word !== 'SELECT' || !['AVG', 'SUM', 'MIN', 'MAX', 'COUNT'].includes(tokens[i + 2]?.word)) continue;
          const close = tokens.findIndex((t, j) => j > i && t.text === ')' && t.depth === tokens[i].depth);
          if (close < 0 || tokens.slice(i, close).some(t => t.word === 'GROUP' && t.depth === tokens[i].depth + 1)) continue;
          scalar.push(`${sql.slice(tokens[i].at, tokens[close].at + 1)} AS ${quote(`안쪽 집계값 ${scalar.length + 1}`)}`);
          if (tokens[i + 2].word === 'AVG') {
            const argumentEnd = tokens.findIndex((t, j) => j > i + 3 && t.text === ')' && t.depth === tokens[i + 3].depth);
            const argument = sql.slice(tokens[i + 3].at + 1, tokens[argumentEnd].at);
            const prefix = sql.slice(tokens[i].at, tokens[i + 2].at), suffix = sql.slice(tokens[argumentEnd].at + 1, tokens[close].at + 1);
            scalar.push(`${prefix}GROUP_CONCAT(COALESCE(CAST(${argument} AS TEXT), 'NULL'), ', ')${suffix} AS "평균 대상 값"`);
            scalar.push(`${prefix}SUM(${argument})${suffix} AS "평균 분자(합)"`);
            scalar.push(`${prefix}COUNT(${argument})${suffix} AS "평균 분모(개수)"`);
          }
        }
        const extra = scalar.length ? `, ${scalar.join(', ')}` : '';
        const judgment = capture(`SELECT *${extra}, CASE WHEN (${condition}) THEN '참' WHEN NOT (${condition}) THEN '거짓' ELSE 'UNKNOWN(NULL)' END AS "WHERE 판정" ${source}`,
          '행별 조건 대입', '외부 행을 하나씩 고정해 조건을 대입한 표입니다. 안쪽 집계값은 해당 외부 행에 대응합니다. 참만 다음 단계에 남고 거짓과 UNKNOWN은 제외됩니다.');
        const numerator = judgment.columns.indexOf('평균 분자(합)'), denominator = judgment.columns.indexOf('평균 분모(개수)'), mean = judgment.columns.findIndex(column => column.startsWith('안쪽 집계값'));
        if (numerator >= 0) judgment.calculationNotes = judgment.rows.map(row => `${judgment.columns[0]}=${row[0]}: 평균 대상 [${row[numerator - 1] ?? '없음'}] → ${row[denominator] === 0 ? '대상이 없어 AVG는 NULL (0이 아님)' : `합 ${row[numerator]} ÷ NULL 아닌 ${row[denominator]}개 = ${row[mean]}`} → 조건 ${row.at(-1)}`);
        capture(`SELECT * ${filteredSource}`, 'WHERE 적용 결과', '조건이 참인 원본 행만 남긴 표입니다. 아래 집계는 이 행들로 계산하며 NULL은 숫자 0과 구분합니다.');
      }
    }
    const groupEnd = group >= 0 ? boundaryAfter(group) : -1;
    const groupClause = group >= 0 ? sql.slice(tokens[group].at, endAt(groupEnd)) : '';
    const groupKeys = group >= 0 ? sql.slice(tokens[group + 1].at + tokens[group + 1].text.length, endAt(groupEnd)).trim() : '';
    const aggregates = new Set();
    for (let i = 1; i < tokens.length; i++) {
      if (tokens[i].depth !== 0 || !['COUNT', 'SUM', 'AVG', 'MIN', 'MAX'].includes(tokens[i].word) || tokens[i + 1]?.text !== '(') continue;
      const close = tokens.findIndex((t, j) => j > i + 1 && t.text === ')' && t.depth === 0);
      if (close < 0) continue;
      const argument = sql.slice(tokens[i + 1].at + 1, tokens[close].at).trim();
      const aggregate = sql.slice(tokens[i].at, tokens[close].at + 1);
      if (aggregates.has(aggregate)) { i = close; continue; }
      aggregates.add(aggregate);
      const distinct = /^DISTINCT\s/iu.test(argument), expression = argument.replace(/^DISTINCT\s+/iu, '');
      const star = expression === '*', value = star ? '1' : expression;
      const average = tokens[i].word === 'AVG';
      const result = capture(`SELECT ${groupKeys ? `${groupKeys}, ` : ''}GROUP_CONCAT(COALESCE(CAST(${value} AS TEXT), 'NULL'), ', ') AS "대상 값", COUNT(*) AS "전체 행 수", COUNT(${value}) AS "NULL 제외 수"${average ? `, SUM(${value}) AS "값의 합"` : ''}, ${aggregate} AS "집계 결과" ${filteredSource} ${groupClause}`,
        `${aggregate} 계산${group >= 0 ? ' · HAVING 적용 전' : ''}`, star ? 'COUNT(*)는 남은 행마다 1씩 셉니다. GROUP BY가 있으면 그룹별로 따로 센 결과이며 HAVING 적용 전입니다.' : `${aggregate}의 실제 대상 값과 중간 계산입니다. NULL은 집계 대상에서 제외${distinct ? '하고 DISTINCT로 같은 값은 한 번만 처리' : ''}합니다. GROUP BY가 있으면 각 그룹을 따로 계산합니다.`);
      result.calculationNotes = result.rows.map(row => {
        const start = result.columns.indexOf('대상 값'), values = row[start], count = row[start + 2], answer = row.at(-1);
        const label = start ? row.slice(0, start).join(' / ') : '전체';
        if (average) return `${label}: NULL 아닌 ${count}개의 합 ${row[start + 3] ?? 'NULL'} ÷ ${count} = ${answer ?? 'NULL'}${count === 0 ? ' (대상이 없으므로 0이 아님)' : ''}`;
        if (tokens[i].word === 'COUNT') return `${label}: ${star ? `필터 후 ${row[start + 1]}행을 모두 셈` : `값 [${values ?? ''}]에서 NULL 제외${distinct ? ', 중복 제거' : ''}`} → ${answer}`;
        return `${label}: [${values ?? ''}] 중 NULL 제외${distinct ? ', 중복 제거' : ''} 후 ${tokens[i].word === 'SUM' ? '합계' : tokens[i].word === 'MIN' ? '최솟값' : '최댓값'} = ${answer ?? 'NULL'}`;
      });
      i = close;
    }
    if (group >= 0 && having >= 0) {
      const end = boundaryAfter(having), condition = sql.slice(tokens[having].at + tokens[having].text.length, endAt(end));
      const scalar = [];
      for (let i = having + 1; i < tokens.length; i++) {
        if (tokens[i].text !== '(' || tokens[i + 1]?.word !== 'SELECT') continue;
        const close = tokens.findIndex((t, j) => j > i && t.text === ')' && t.depth === tokens[i].depth);
        if (close >= 0) {
          scalar.push(`${sql.slice(tokens[i].at, tokens[close].at + 1)} AS ${quote(`비교 기준 ${scalar.length + 1}`)}`);
          addCalculationStages(sql.slice(tokens[i + 1].at, tokens[close].at));
        }
      }
      const values = [...aggregates].map((aggregate, i) => `${aggregate} AS ${quote(`그룹 집계 ${i + 1}`)}`);
      capture(`SELECT ${[groupKeys, ...values, ...scalar].filter(Boolean).join(', ')}, CASE WHEN (${condition}) THEN '참' WHEN NOT (${condition}) THEN '거짓' ELSE 'UNKNOWN(NULL)' END AS "HAVING 판정" ${filteredSource} ${groupClause}`,
        '그룹별 HAVING 판정', '모든 그룹의 집계값과 비교 기준을 대입합니다. HAVING이 참인 그룹만 최종 결과에 남으며, 개별 원본 행에 적용하는 WHERE와 다릅니다.');
    }
  };
  const addQueryStages = sql => {
    const tokens = tokensOf(sql), join = tokens.findIndex(token => token.word === 'JOIN');
    if (tokens[0]?.word === 'WITH' && tokens[2]?.word === 'AS' && tokens[3]?.text === '(' && tokens[4]?.word === 'SELECT') {
      const end = tokens.find((token, i) => i > 4 && token.depth < tokens[4].depth);
      capture(sql.slice(tokens[4].at, end?.at ?? sql.length), `WITH ${tokens[1].text} 완성 결과`, '공통 테이블 식으로 정의한 임시 결과입니다. 이어지는 SELECT는 이 결과를 테이블처럼 참조합니다.');
    }
    if (join >= 0) {
      const depth = tokens[join].depth;
      let from = join, select = join;
      while (from >= 0 && !(tokens[from].word === 'FROM' && tokens[from].depth === depth)) from--;
      while (select >= 0 && !(tokens[select].word === 'SELECT' && tokens[select].depth === depth)) select--;
      if (from < 0 || select < 0) throw new Error(`${question.id}: JOIN 범위 확인 실패`);
      let end = join + 1;
      while (end < tokens.length && tokens[end].depth >= depth && tokens[end].text !== ';') end++;
      const endAt = tokens[end]?.at ?? sql.length;
      const boundary = tokens.findIndex((token, i) => i > from && i < end && token.depth === depth && ['WHERE', 'GROUP', 'HAVING', 'ORDER', 'LIMIT', 'UNION'].includes(token.word));
      const fromEnd = boundary < 0 ? endAt : tokens[boundary].at;
      const fromSql = sql.slice(tokens[from].at, fromEnd);
      const projection = [];
      const reserved = new Set(['ON', 'USING', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'OUTER', 'CROSS', 'JOIN', 'WHERE', 'GROUP', 'ORDER']);
      for (let i = from; i < (boundary < 0 ? end : boundary); i++) {
        if (tokens[i].depth !== depth || !['FROM', 'JOIN'].includes(tokens[i].word)) continue;
        const name = tokens[i + 1]?.text;
        let alias = tokens[i + 2];
        if (alias?.word === 'AS') alias = tokens[i + 3];
        const aliasName = alias?.word && !reserved.has(alias.word) ? alias.text : name;
        const columns = db.prepare(`PRAGMA table_info(${quote(name)})`).all();
        if (!columns.length) throw new Error(`${question.id}: ${name}의 열 확인 실패`);
        for (const { name: column } of columns) projection.push(`${quote(aliasName)}.${quote(column)} AS ${quote(`${aliasName}.${column}`)}`);
      }
      const prefix = `SELECT ${projection.join(', ')} `;
      capture(prefix + fromSql, 'JOIN 결합 결과', 'ON 조건으로 연결한 직후의 모든 행입니다. 열 앞의 이름은 테이블 또는 별칭이며, 외부 조인의 미연결 값은 NULL로 표시합니다.');
      if (boundary >= 0 && tokens[boundary].word === 'WHERE') {
        let whereEnd = boundary + 1;
        while (whereEnd < end && !(tokens[whereEnd].depth === depth && ['GROUP', 'HAVING', 'ORDER', 'LIMIT', 'UNION'].includes(tokens[whereEnd].word))) whereEnd++;
        capture(prefix + sql.slice(tokens[from].at, tokens[whereEnd]?.at ?? endAt), 'WHERE 적용 결과', '결합한 행 중 WHERE 조건이 참인 행만 남긴 표입니다. 이후 집계가 있다면 이 표를 기준으로 계산합니다.');
      }
      if (depth > tokens.find(token => token.word === 'SELECT').depth) {
        addCalculationStages(sql.slice(tokens[select].at, endAt));
        capture(sql.slice(tokens[select].at, endAt), '파생 테이블 완성 결과', '안쪽 SELECT의 필터·그룹·집계를 마친 결과입니다. 바깥 SELECT는 이 결과를 하나의 테이블로 사용합니다.');
      }
    } else {
      const from = tokens.findIndex((token, i) => token.word === 'FROM' && tokens[i + 1]?.text === '(' && tokens[i + 2]?.word === 'SELECT');
      if (from >= 0) {
        const select = from + 2, depth = tokens[select].depth;
        const end = tokens.find((token, i) => i > select && token.depth < depth);
        addCalculationStages(sql.slice(tokens[select].at, end?.at ?? sql.length));
        capture(sql.slice(tokens[select].at, end?.at ?? sql.length), '파생 테이블 완성 결과', '안쪽 SELECT를 수행해 만든 테이블입니다. 바깥 질의의 조회·집계 대상이 됩니다.');
      }
    }
    addCalculationStages(sql);
  };
  try {
    for (const table of question.tables) {
      const definitions = table.columns.map((column, i) => `${quote(column)} ${table.rows.every(row => row[i] === null || typeof row[i] === 'number') ? 'INTEGER' : 'TEXT'}`);
      db.exec(`CREATE TABLE ${quote(table.name)} (${definitions.join(', ')});`);
      const insert = db.prepare(`INSERT INTO ${quote(table.name)} VALUES (${table.columns.map(() => '?').join(', ')});`);
      for (const row of table.rows) insert.run(...row);
    }
    const answers = question.answerText.split(',').map(part => part.trim());
    const code = question.answerMode === 'blanks' ? question.code.replace('①', () => answers[0]).replace('②', () => answers[1] ?? '') : question.code;
    const tokens = tokensOf(code), statements = [];
    let start = 0;
    for (const token of tokens) if (token.text === ';' && token.depth === 0) {
      statements.push(code.slice(start, token.at));
      start = token.at + 1;
    }
    statements.push(code.slice(start));
    const commands = statements.filter(sql => sql.trim());
    for (const [index, sql] of commands.entries()) {
      const words = tokensOf(sql);
      const isView = words[0]?.word === 'CREATE' && words[1]?.word === 'VIEW';
      if (isView) {
        db.exec(sql);
        addQueryStages(sql);
        const name = words[2].text;
        capture(`SELECT * FROM ${quote(name)}`, `VIEW ${name} 완성 결과`, 'CREATE VIEW의 SELECT로 정의된 가상 테이블입니다. 다음 질의가 뷰를 참조할 때 사용하는 행과 열을 보여줍니다.');
      } else if (index === commands.length - 1 && ['SELECT', 'WITH'].includes(words[0]?.word)) {
        addQueryStages(sql);
        const final = capture(sql, '최종 조회 결과', '문제의 마지막 SELECT가 반환하는 완성 표입니다. 정답은 이 표의 열 순서와 지정된 행 순서에 맞춰 작성합니다.');
        if (question.answerMode === 'result') {
          const actual = final.rows.map(row => row.map(value => value === null ? 'NULL' : String(value)).join(' ')).join('\n');
          if (normalize(actual) !== normalize(question.answerText)) throw new Error(`${question.id}: 완성 표와 정답 불일치`);
        }
      } else db.exec(sql);
    }
    return tables;
  } finally {
    db.close();
  }
}
