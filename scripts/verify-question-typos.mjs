import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { DatabaseSync } from 'node:sqlite';
import { getRestoredProblemBlocks } from '../src/lib/restoredProblemPresentation.js';

const server = await createServer({ configFile:false,optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false} });
try {
  const { practiceQuestions,codeQuestions,previousQuestions } = await server.ssrLoadModule('/src/data/studyData.js');
  const { restoredExamQuestions } = await server.ssrLoadModule('/src/data/restoredExams.js');
  const { similarExamQuestions } = await server.ssrLoadModule('/src/data/similarExams.js');
  const bank = new Map([
    ...Object.entries(previousQuestions).flatMap(([type,qs]) => qs.map(q => [`${type}:${q.id}`,q])),
    ...practiceQuestions.map(q => [`exam:${q.id}`,q]),
    ...Object.entries(codeQuestions).flatMap(([type,qs]) => qs.map(q => [`${type}:${q.id}`,q])),
    ...restoredExamQuestions.map(q => [`exam:${q.id}`,q]),...similarExamQuestions.map(q => [`exam:${q.id}`,q]),
  ]);
  const issues = [];
  const prosePatterns = [/알맞는/g,/따[움음]표/g,/생락/g,/말하야/g,/갯수/g,/평군/g,/속상이/g,/네트워크 보완/g,/공격 공격/g,/해깔려/g,/속에 속한다/g,/R%S/g,/전화번호varchar/g,/스키마\(Structure\)/g,/&nbsp;/g,/트랜젝션/g,/카디널러티/g,/릴레션/g,/리레이션/g,/반홤/g,/되었을떄/g,/했을떄/g,/Phthon|Pyhton|Phython|Pyhon/g,/\bINSTER\b/g,/Network Address Transformation/g,/\uFFFD|\u200B|\uFEFF/g];
  const codePatterns = [/\babstact\b/g,/\bstdlio\.h\b/g,/\bextend\s+Parent\b/g,/\bthis y\b/g,/^\s*#include\s*$/gm,/\bgets\(/g,/^\s*void main\(/gm,/printf\(%[cs]/g,/\uFFFD|\u200B|\uFEFF/g];
  function scan(id,field,value,isCode=false) {
    if (typeof value !== 'string') return;
    for (const pattern of isCode ? codePatterns : prosePatterns) {
      for (const match of value.matchAll(pattern)) issues.push({id,field,word:match[0],context:value.slice(Math.max(0,match.index-25),match.index+match[0].length+45).replaceAll('\n',' ')});
    }
  }
  for (const [id,q] of bank) {
    for (const field of ['title','prompt','answerText']) scan(id,field,q[field]);
    for (const field of ['explanation','trace','steps']) {
      if (typeof q[field] === 'string') scan(id,field,q[field]);
      else q[field]?.forEach((text,i) => scan(id,`${field}.${i}`,text));
    }
    const blocks = q.restored ? getRestoredProblemBlocks(q) : q.blocks;
    for (const [field,items] of [['blocks',blocks],['answerBlocks',q.answerBlocks]]) items?.forEach((block,i) => {
      scan(id,`${field}.${i}`,block.text,block.type === 'code');
      block.rows?.forEach((row,r) => row.forEach((cell,c) => scan(id,`${field}.${i}.${r}.${c}`,cell)));
    });
    scan(id,'code',q.code,true);
  }
  const counts = Object.fromEntries([...new Set(issues.map(i => i.word))].map(word => [word,issues.filter(i => i.word===word).length]));
  console.log(JSON.stringify({questions:bank.size,issues:issues.length,counts,samples:issues.filter((item,i,all) => all.findIndex(other => other.word===item.word && other.context===item.context)===i).slice(0,12)},null,2));
  assert.equal(issues.length,0,'화면에 표시되는 문제·정답·해설의 검수 대상 오타');

  let changed=0,codeChanged=0;
  for (const q of restoredExamQuestions) {
    const original=JSON.stringify(q.blocks);
    const display=getRestoredProblemBlocks(q);
    if (JSON.stringify(display)!==original) changed++;
    if (display.some((b,i)=>b.type==='code'&&b.text!==q.blocks[i].text)) codeChanged++;
    assert.equal(JSON.stringify(q.blocks),original,`${q.id}: 복원 원본 보존`);
  }
  const find = id => restoredExamQuestions.find(q=>q.id===`past-${id}`);
  const code = id => getRestoredProblemBlocks(find(id)).find(b=>b.type==='code').text;
  const expectedError=find('2023-3-q13');
  assert.deepEqual(getRestoredProblemBlocks(expectedError).filter(b=>b.type==='code'),expectedError.blocks.filter(b=>b.type==='code'),'오류 찾기 문항의 의도된 static 오류·줄 번호 보존');
  assert(code('2023-3-q14').includes('input()._____()'),'split 빈칸은 채우지 않음');
  assert(code('2023-3-q5').includes('( )'),'구조체 포인터 빈칸 보존');
  assert(code('2023-1-q9').includes('(a)(b)'),'연산자·피연산자 빈칸 보존');
  assert(code('2025-3-q8').includes('____빈칸____'),'인터페이스 예약어 빈칸 보존');
  assert(!/4장 출력|1개 출력|2개 출력/.test(code('2023-2-q2')),'출력값 힌트 주석 재노출 금지');
  assert.deepEqual([...code('2024-1-q10').matchAll(/\/\/ ([①-⑦])/g)].map(m=>m[1]),['①','②','③','④','⑤','⑥','⑦'],'호출 순서 문제의 위치 번호 보존');
  const union=getRestoredProblemBlocks(find('2023-3-q6')).filter(b=>b.type==='table');
  assert.deepEqual(union.map(b=>b.rows[0]),[['A'],['A'],['A']],'UNION 표의 열 이름 보완');
  assert.deepEqual(union.slice(0,2).map(b=>b.rows.slice(1)),[[['3'],['1'],['4']],[['2'],['4'],['3']]],'원본 SQL 자료값 보존');

  const db=new DatabaseSync(':memory:');
  try {
    db.exec('CREATE TABLE 사원(사원번호 INTEGER PRIMARY KEY,이름 TEXT,주소 TEXT,나이 INTEGER,부서 TEXT); CREATE TABLE 부서(사원번호 INTEGER PRIMARY KEY,이름 TEXT,주소 TEXT,나이 INTEGER);');
    const sql=getRestoredProblemBlocks(find('2024-2-q3')).filter(b=>b.type==='text').map(b=>b.text).filter(t=>/^(INSERT|SELECT|UPDATE|\[ ② \])/.test(t)).join('\n')
      .replace('[ ① ]','VALUES').replace('[ ② ]','SELECT').replace('[ ③ ]','FROM').replace('[ ④ ]','SET');
    db.exec(sql);
    assert.deepEqual(Object.values(db.prepare('SELECT * FROM 부서').get()),[32431,'정실기','서울',23]);
    assert.equal(db.prepare('SELECT 부서 FROM 사원').get().부서,'퇴사','네 빈칸 정답 유지·스키마와 SQL 실행 일치');
    const player=getRestoredProblemBlocks(find('2026-1-q10')).find(b=>b.text?.startsWith('CREATE TABLE PLAYER')).text;
    db.exec('PRAGMA foreign_keys=ON;CREATE TABLE TEAM(TEAM_ID2 CHAR(3) PRIMARY KEY);');
    db.exec(player.replace('①','CONSTRAINT').replace('②','FOREIGN').replace('③','TEAM_ID').replace('④','REFERENCES').replace('⑤','TEAM_ID2'));
    assert.equal(db.prepare('PRAGMA foreign_key_list(PLAYER)').get().from,'TEAM_ID');
    assert.equal(db.prepare('PRAGMA foreign_key_list(PLAYER)').get().to,'TEAM_ID2');
  } finally {db.close();}
  console.log(`PASS: 복원 표시 ${changed}문항 보정(코드 ${codeChanged}개), 원문·정답 빈칸·고의 오류 보존, SQL 스키마·외래키 실제 실행`);
} finally { await server.close(); }
