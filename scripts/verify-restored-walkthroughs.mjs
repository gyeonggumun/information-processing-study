import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { buildRestoredWalkthrough, restoredExamWalkthroughs } from '../src/data/restoredExamWalkthroughs.js';
import { getRestoredProblemBlocks } from '../src/lib/restoredProblemPresentation.js';

const source = JSON.parse(readFileSync('src/data/restoredExamsSource.json', 'utf8'));
const questions = source.flatMap(exam => exam.questions);
const bank = questions.filter(q => restoredExamWalkthroughs[q.id.replace('past-', '')]).map(q => ({ ...q, walk: buildRestoredWalkthrough(q) }));
const normalize = value => value.replace(/\s/gu, '');
assert.equal(bank.length, 108);
assert.equal(Object.keys(restoredExamWalkthroughs).length, bank.length, '알 수 없는 문항 ID 금지');
assert(questions.filter(q => q.blocks.some(b => b.type === 'code')).every(q => bank.some(item => item.id === q.id)), '원문 코드 95문항 빠짐없이 보강');
for (const q of bank) {
  const w = q.walk;
  assert(w.steps.length >= 3 && w.pitfall.length >= 35, q.id);
  assert(w.steps.every(step => step.description.length >= 25 && w.code.split('\n')[step.lineIndex].trim() === step.statement), `${q.id}: 코드 위치 연결`);
  const prefix = w.language === 'Python' ? '#' : w.language === 'SQL' ? '--' : '//';
  for (const step of w.steps) assert(w.annotatedCode.includes(`${prefix} [${String(step.order).padStart(2, '0')}] ${step.description}`));
  const originalCode = q.blocks.filter(b => b.type === 'code').map(b => b.text).join('\n');
  if (w.code !== originalCode) assert(w.note?.length >= 20, `${q.id}: 완성·보정·이미지 전사 안내`);
  assert(!w.annotatedCode.includes('<script>'));
}
console.log(`PASS: 코드 108문항(C·Java·Python 92, SQL 16), 문항별 주석 ${bank.reduce((n,q) => n + q.walk.steps.length, 0)}개·코드 위치·보정 안내`);

// 원문 표를 재현한 격리된 메모리 DB만 사용합니다. 서비스 DB에는 연결하지 않습니다.
const sqlCases = [
  ['2026-2-q12', "CREATE TABLE 학생(학번 INTEGER,성명 TEXT,학과 TEXT); INSERT INTO 학생 VALUES (202001,'이몽룡','컴퓨터공학과'),(202002,'김철수','전자공학과'),(202003,'이순신','정보통신공학과'),(202004,'박영희','컴퓨터공학과');"],
  ['2026-2-q13', 'CREATE TABLE A(id,x);INSERT INTO A VALUES(1,10),(2,20),(3,30),(4,40);CREATE TABLE B(id,y);INSERT INTO B VALUES(1,5),(1,15),(2,20),(3,35),(5,50);'],
  ['2026-2-q14', 'CREATE TABLE A(id,v);INSERT INTO A VALUES(1,10),(1,20),(2,30);CREATE TABLE B(id,w);INSERT INTO B VALUES(1,100),(3,300),(4,400);'],
  ['2026-1-q18', 'CREATE TABLE employee(dep_id);INSERT INTO employee VALUES(10),(20),(20);CREATE TABLE dept(dept_id,budget);INSERT INTO dept VALUES(10,100),(20,300),(30,200);'],
  ['2025-3-q10', "CREATE TABLE T1(CODE,NAME);INSERT INTO T1 VALUES(3258,'smith'),(4324,'allen'),(5432,'scott');CREATE TABLE T2(NO,RULE);INSERT INTO T2 VALUES(12,'s%'),(32,'%t%');"],
  ['2025-3-q20', 'CREATE TABLE A(col1,col2);INSERT INTO A VALUES(2,NULL),(3,6),(2,3),(NULL,3),(4,5);'],
  ['2025-1-q7', "CREATE TABLE emp(id,name);INSERT INTO emp VALUES(1001,'김철수'),(1002,'홍길동'),(1004,'강감찬'),(1008,'이순신');CREATE TABLE sal(id,incentives);INSERT INTO sal VALUES(1002,300),(1004,300),(1008,1000),(1009,500);"],
  ['2023-1-q16', "CREATE TABLE 성적(순번,과목이름,점수);INSERT INTO 성적 VALUES(1,'데이터베이스',89),(2,'데이터베이스',92),(3,'네트워크',88),(4,'소프트웨어',91),(5,'네트워크',89),(6,'소프트웨어',85);"],
  ['2024-3-q3', "CREATE TABLE employee(no,first_name,last_name,project_id);INSERT INTO employee VALUES(1,'John','Doe',10),(2,'Jim','Carry',20),(3,'Rachel','Redmond',10);CREATE TABLE project(project_id,name);INSERT INTO project VALUES(10,'Alpha'),(20,'Beta'),(10,'Gamma');", [['1']]],
  ['2024-1-q13', "CREATE TABLE R1(A,B,C);INSERT INTO R1 VALUES(1,'a','x'),(2,'b','x'),(1,'c','w'),(3,'d','w');CREATE TABLE R2(C,D,E);INSERT INTO R2 VALUES('x','k',3),('y','k',3),('z','s',2);", [['a'],['b']]],
  ['2024-1-q18', 'CREATE TABLE "TABLE"(EMPNO,SAL);INSERT INTO "TABLE" VALUES(100,1000),(200,3000),(300,1500);'],
];
for (const [id, setup, expected] of sqlCases) {
  const q = bank.find(q => q.id === `past-${id}`);
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(setup);
    const actual = db.prepare(q.walk.annotatedCode).all().map(row => Object.values(row).map(String));
    const spec = restoredExamWalkthroughs[id];
    assert.deepEqual(actual, expected ?? spec.resultRows, `${id}: 주석 포함 SQL의 실제 결과`);
    if (id === '2026-2-q14') assert.deepEqual(db.prepare('SELECT A.id aid,A.v,B.id bid,B.w FROM A RIGHT JOIN B ON A.id=B.id').all().map(row => Object.values(row)), [[1,10,1,100],[1,20,1,100],[null,null,3,300],[null,null,4,400]]);
    if (id === '2026-1-q18') assert.equal(db.prepare('SELECT AVG(budget) x FROM dept').get().x, 200);
  } finally { db.close(); }
}
for (const id of ['2023-2-q4','2023-1-q13','2026-1-q9']) {
  const db = new DatabaseSync(':memory:');
  try {
    const code = bank.find(q => q.id === `past-${id}`).walk.annotatedCode;
    if (id === '2023-2-q4') {
      db.exec('CREATE TABLE 학생(학번 INTEGER,이름 TEXT,학년 INTEGER,전공 TEXT,전화번호 TEXT);');
      db.exec(code);
      assert.deepEqual(Object.values(db.prepare('SELECT * FROM 학생').get()),[9830287,'뉴진스',3,'경영학개론','010-1234-1234']);
    } else if (id === '2023-1-q13') {
      db.exec("CREATE TABLE 학생(이름 TEXT);INSERT INTO 학생 VALUES('민수'),('지수'),('민수');");
      db.exec(code);
      assert.deepEqual(db.prepare('SELECT 이름 FROM 학생').all().map(row => row.이름),['지수']);
    } else {
      db.exec('CREATE TABLE STUDENT(DEPT TEXT);');
      for (const [name,n] of [['컴퓨터과',50],['인터넷과',100],['사무자동화과',50]]) for (let i=0;i<n;i++) db.prepare('INSERT INTO STUDENT VALUES(?)').run(name);
      assert.deepEqual(code.split(';').filter(s => s.trim()).map(s => db.prepare(s).all().length), [200,3,1]);
      assert.equal(db.prepare("SELECT COUNT(DISTINCT DEPT) n FROM STUDENT WHERE DEPT='컴퓨터과'").get().n,1);
    }
  } finally { db.close(); }
}
{
  const db=new DatabaseSync(':memory:');
  try {
    db.exec('CREATE TABLE 사원(사원번호 INTEGER PRIMARY KEY,이름 TEXT,주소 TEXT,나이 INTEGER,부서 TEXT); CREATE TABLE 부서(사원번호 INTEGER PRIMARY KEY,이름 TEXT,주소 TEXT,나이 INTEGER);');
    db.exec(bank.find(q=>q.id==='past-2024-2-q3').walk.annotatedCode);
    assert.deepEqual(Object.values(db.prepare('SELECT * FROM 부서').get()),[32431,'정실기','서울',23]);
  } finally {db.close();}
}
console.log('PASS: SQL 15문항 실제 실행, DOMAIN 문법 1문항은 별도 구분');

if (process.argv.includes('--display')) {
  const blanks = {
    'past-2025-3-q8': [['(____빈칸____)','implements']], 'past-2025-3-q12': [['____(a,a)','super(a,a)']],
    'past-2023-3-q5': [['( )','->']], 'past-2023-3-q14': [['input()._____()','input().split()']],
    'past-2023-2-q1': [['(            )','n[(i+1) % 5]']],
    'past-2023-2-q2': [['a = (              )','a = m / 1000'],['b = (              )','b = (m % 1000) / 500'],['c = (              )','c = (m % 500) / 100'],['d = (              )','d = (m % 100) / 10']],
    'past-2023-2-q18': [['(     )','>']], 'past-2023-1-q9': [['input (a)(b)','input % 10']],
    'past-2023-1-q14': [['arr[( 1 )]','arr[idx2]'],['Usort(item, ( 2 ))','Usort(item, nx)']],
  };
  for (const q of bank.filter(q=>['C','Java','Python'].includes(q.walk.language))) {
    const display=getRestoredProblemBlocks(q).filter(b=>b.type==='code').map(b=>b.text).join('\n');
    const filled=(blanks[q.id]??[]).reduce((text,[from,to])=>text.replaceAll(from,to),display);
    q.walk={...q.walk,code:filled,annotatedCode:filled};
  }
  console.log('검증 대상: 실제 표시 코드(빈칸은 테스트에서만 정답을 채움)');
}

if (process.argv.includes('--execute')) {
  const folder = resolve('node_modules/.cache/restored-walkthroughs');
  mkdirSync(folder, { recursive: true });
  const expected = q => q.walk.expectedOutput ?? q.answerBlocks.filter(b => b.type === 'text').map(b => b.text).join('\n');
  const python = bank.filter(q => q.walk.language === 'Python');
  const runner = 'import ast,contextlib,io,json,sys\noutputs=[]\nfor item in json.load(sys.stdin):\n stream=io.StringIO()\n saved=sys.stdin\n sys.stdin=io.StringIO(item["input"])\n try:\n  with contextlib.redirect_stdout(stream):\n   exec(compile(item["code"],"<restored-question>","exec"),{})\n finally:\n  sys.stdin=saved\n result=stream.getvalue()\n outputs.append(sorted(ast.literal_eval(result)) if item["kind"]=="set" else result)\njson.dump(outputs,sys.stdout,ensure_ascii=True)';
  const outputs = JSON.parse(execFileSync('python', ['-c', runner], { input: JSON.stringify(python.map(q => ({ code: q.walk.annotatedCode, input: q.walk.input, kind: q.walk.kind }))), env: { ...process.env, PYTHONUTF8: '1' }, encoding: 'utf8', timeout: 30000 }));
  for (const [i,q] of python.entries()) {
    if (q.walk.kind === 'set') assert.deepEqual(new Set(outputs[i]), new Set(['한국','중국','베트남','홍콩','태국']), q.id);
    else assert.equal(normalize(outputs[i]), normalize(expected(q)), `${q.id}: Python 결과`);
  }
  console.log(`PASS: Python ${python.length}문항 주석 포함 코드 실행(입력·집합 포함)`);

  const java = bank.filter(q => q.walk.language === 'Java' && q.walk.kind !== 'compile-error');
  const classNames = [];
  const mainMethods = [];
  const javaSources = java.map((q, i) => {
    let code = q.walk.annotatedCode;
    const names = new Set([...code.matchAll(/\b(?:class|interface|enum)\s+(\w+)/g)].map(m => m[1]));
    const mainClass = code.match(/public class (\w+)/)?.[1] ?? code.match(/class (Main|main)\b/)[1];
    classNames.push(`Q${i}_${mainClass}`);
    mainMethods.push(names.has('main') ? `Q${i}_main` : 'main');
    code = code.replace(/public class /g, 'class ');
    return code.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b[A-Za-z_]\w*\b/g, token => names.has(token) ? `Q${i}_${token}` : token);
  });
  const javaFile = resolve(folder, 'Runner.java');
  writeFileSync(javaFile, javaSources.join('\n') + '\npublic class Runner { public static void main(String[] args) {\n' + java.map((q,i) => `System.out.print("\\n@@${q.id}@@\\n"); ${classNames[i]}.${mainMethods[i]}(args);`).join('\n') + '\n}}');
  execFileSync('javac', ['-encoding','UTF-8','-d',folder,javaFile], { timeout: 60000 });
  function check(output, items) {
    const parts = output.split(/\r?\n@@([\w-]+)@@\r?\n/u).slice(1);
    assert.equal(parts.length, items.length * 2);
    items.forEach((q,i) => { assert.equal(parts[i*2],q.id); assert.equal(normalize(parts[i*2+1]),normalize(expected(q)),`${q.id}: 실행 결과`); });
  }
  check(execFileSync('java', ['-Dfile.encoding=UTF-8','-cp',folder,'Runner'], { encoding: 'utf8', timeout: 30000 }), java);
  const errorQuestion = bank.find(q => q.walk.kind === 'compile-error');
  const errorFile = resolve(folder,'main.java');
  writeFileSync(errorFile, errorQuestion.walk.annotatedCode);
  assert.throws(() => execFileSync('javac',['-J-Duser.language=en','-encoding','UTF-8','-d',folder,errorFile],{ encoding:'utf8',timeout:30000,stdio:'pipe' }), error => error.status !== 0 && /non-static variable name cannot be referenced from a static context/.test(error.stderr), '원문의 의도된 static 오류를 보존');
  console.log(`PASS: Java ${java.length}문항 컴파일·실행 + 오류 찾기 1문항 컴파일 실패 원인 확인`);

  const c = bank.filter(q => q.walk.language === 'C' && q.walk.kind !== 'flow');
  const reserved = new Set('define auto break case char const continue default do double else enum extern float for goto if inline int long register restrict return short signed sizeof static struct switch typedef union unsigned void volatile while printf scanf strlen strcpy malloc free putchar isupper islower isdigit NULL EOF'.split(' '));
  const isolate = (code,i) => {
    // main의 암묵적 return 0은 이름을 바꾼 검증 함수에서는 적용되지 않으므로 명시합니다.
    const withReturn = code.replace(/}\s*$/, 'return 0;\n}');
    return withReturn.replace(/^#include.*$/gm,'').replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b[A-Za-z_]\w*\b/g, token => /^[A-Za-z_]\w*$/.test(token) && !reserved.has(token) ? `q${i}_${token}` : token);
  };
  const cFile = resolve(folder,'questions.c');
  writeFileSync(cFile, '#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#include <ctype.h>\n' + c.map((q,i) => isolate(q.walk.annotatedCode,i)).join('\n') + '\nint main(void) {\n' + c.map((q,i) => `printf("\\n@@${q.id}@@\\n"); q${i}_main(${/main\(int argc/.test(q.walk.code) ? '0, NULL' : ''});`).join('\n') + '\nreturn 0;}');
  const input = c.map(q => q.walk.input).join('');
  for (const opt of ['-O0','-O2']) {
    const exe = resolve(folder,`restored-${opt.slice(1)}.exe`);
    execFileSync(resolve('node_modules/.cache/c-verifier/zig-x86_64-windows-0.15.2/zig.exe'), ['cc','-std=c11','-fexec-charset=UTF-8',opt,cFile,'-o',exe],{ timeout:120000,stdio:'pipe' });
    check(execFileSync(exe,[],{ input,encoding:'utf8',timeout:10000 }),c);
  }
  console.log(`PASS: C ${c.length}문항 주석 포함 코드 O0/O2 실행 + 제어 흐름 1문항 별도 구분`);
}
