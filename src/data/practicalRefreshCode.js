// 복원 문제의 핵심 연산을 유지하되 데이터·식·클래스는 새로 작성합니다.
// 기존 문항은 삭제하지 않고 복습 전용 목록으로 이동합니다.
import { cCodeQuestions as oldC, previousCCodeQuestions as archivedC } from './cCodeQuestions.js';
import { javaCodeQuestions as oldJava, previousJavaCodeQuestions as archivedJava } from './javaCodeQuestions.js';
import { pythonCodeQuestions as oldPython, previousPythonCodeQuestions as archivedPython } from './pythonCodeQuestions.js';
import { sqlCodeQuestions as oldSQL, previousSqlCodeQuestions as archivedSQL } from './sqlCodeQuestions.js';
import { cProgram, javaProgram } from './additionalQuestionFactory.js';

const guide = (first, second, caution) => ({ rules: [first, second], caution });
const codeGuide = guide(
  'main 또는 마지막 실행문에서 시작하여 호출한 함수로 이동하고, 함수가 반환하면 호출 지점으로 돌아옵니다. 반복문은 조건을 다시 확인하는 시점까지 한 회차씩 추적하세요.',
  '변수의 현재 값과 참조하는 저장 공간을 나누어 기록합니다. 같은 배열이나 객체를 가리키는 변수는 수정 결과를 공유하지만, 값만 복사한 지역 변수는 독립적으로 바뀝니다.',
  '출력문에 도달했을 때의 값만 답안에 적습니다. 계산 중간값이나 실행되지 않은 분기의 출력은 포함하지 마세요.',
);
const sqlGuide = guide(
  'FROM과 JOIN으로 대상 행을 만든 뒤 WHERE로 개별 행을 고릅니다. GROUP BY가 있으면 같은 키끼리 모아서 각 그룹의 COUNT·SUM·AVG를 따로 계산합니다.',
  'HAVING은 집계한 그룹을 거르고 SELECT는 최종 열을 고릅니다. 서브쿼리는 외부 행을 참조하는지 확인하고, 참조하면 외부 행마다 내부 대상부터 다시 계산합니다.',
  'COUNT(*)는 행을 세고 COUNT(열)은 NULL이 아닌 값만 셉니다. 표에 없는 행을 만들거나 평균을 미리 반올림하지 마세요.',
);
const result = (code, answer, explanation, trace, anchors) => ({
  code, answerText: String(answer), explanation, trace, anchors, solutionGuide: codeGuide,
});
const refs = (...ids) => ids.map(id => `past-${id}`);
const templates = {
  C: [
    { family: 'practical-c-string', title: '문자 배열의 출력', refs: refs('2023-3-q10', '2024-1-q4'), build(v) {
      const word = ['NETWORK', 'POINTER', 'COMPUTE', 'STORAGE', 'PROGRAM'][v % 5] + v;
      const shift = 1 + Math.floor(v / 5) % 4;
      const chars = [...word]; [chars[shift], chars[shift + 1]] = [chars[shift + 1], chars[shift]];
      const text = chars.join('');
      return result(cProgram(`    char s[] = "${word}";\n    char *p = s + ${shift};\n    char t = p[0];\n    p[0] = p[1];\n    p[1] = t;\n    printf("%s %s %c", s, p, *(p + 2));`), `${text} ${text.slice(shift)} ${text[shift + 2]}`,
        `p는 s의 ${shift}번 인덱스부터 가리키며 별도 문자열을 복사하지 않습니다. p[0]과 p[1]의 교환은 원본 s의 두 문자도 바꿉니다. %s는 해당 주소부터 널 문자 직전까지, %c는 문자 하나만 출력합니다.`,
        [`s=${word}, p=&s[${shift}]: p가 보는 문자열은 ${word.slice(shift)}입니다.`, `t에 ${word[shift]}를 보관하고 p[0]에 ${word[shift + 1]}를 대입합니다.`, `p[1]에 t를 넣으면 s=${text}, p=${text.slice(shift)}입니다.`, `*(p+2)는 s[${shift + 2}]=${text[shift + 2]}이므로 최종 출력은 ${text} ${text.slice(shift)} ${text[shift + 2]}입니다.`],
        ['char *p', 'char t', 'p[1] = t', 'printf']);
    } },
    { family: 'practical-c-struct', title: '구조체 대입과 함수 호출', refs: refs('2025-2-q14', '2023-3-q5'), build(v) {
      const n = v + 4, delta = v % 4 + 2, x = v + 1;
      return result(cProgram(`    int n = ${n};\n    Box a = {${x}, &n};\n    Box b = a;\n    edit(b, ${delta});\n    b.value += ${delta};\n    printf("%d %d %d", a.value, b.value, n);`, 'typedef struct { int value; int *link; } Box;\nvoid edit(Box x, int d) {\n    x.value += d;\n    *x.link += x.value;\n}'), `${x} ${x + delta} ${n + x + delta}`,
        '구조체 대입과 값 전달은 value의 값을 각각 복사하지만 link에 저장된 주소까지 새 공간으로 복제하지는 않습니다. edit의 지역 x.value는 호출자와 독립적이며 *x.link를 수정하면 main의 n이 바뀝니다. 함수가 끝난 뒤 b.value의 별도 변경도 구분합니다.',
        [`처음 a.value=b.value=${x}, 두 link 모두 n=${n}의 주소입니다.`, `edit의 지역 x.value=${x}+${delta}=${x + delta}입니다. a.value와 b.value는 아직 ${x}입니다.`, `*x.link += x.value이므로 n=${n}+${x + delta}=${n + x + delta}입니다.`, `함수 종료 후 b.value=${x}+${delta}=${x + delta}; a.value=${x}는 유지됩니다.`, `출력 순서 a.value, b.value, n에 따라 ${x} ${x + delta} ${n + x + delta}입니다.`],
        ['Box b = a', 'x.value += d', '*x.link +=', 'b.value +=', 'printf']);
    } },
    { family: 'practical-c-recursion', title: '재귀 함수의 반환값', refs: refs('2026-2-q18', '2024-3-q7'), build(v) {
      const n = 3 + v % 4, base = 1 + Math.floor(v / 4), step = v % 3 + 1;
      let value = base, count = 1;
      const trace = [`f(${n})에서 시작하여 인수가 1씩 작아집니다. f(0)까지 총 ${n + 1}번 호출합니다.`, `f(0)은 ${base}를 반환하고 calls는 기저 호출도 포함해 ${n + 1}입니다.`];
      for (let k = 1; k <= n; k++) { const before = value; value += k * step; count++; trace.push(`f(${k})=${before}+${k}×${step}=${value}를 상위 호출로 반환합니다.`); }
      trace.push(`f(${n})의 최종 반환값=${value}, calls=${count}를 차례로 출력합니다.`);
      return result(cProgram(`    int value = f(${n});\n    printf("%d %d", value, calls);`, `int calls = 0;\nint f(int n) {\n    calls++;\n    if (n == 0) return ${base};\n    int previous = f(n - 1);\n    return previous + n * ${step};\n}`), `${value} ${count}`,
        '호출 횟수는 calls++가 실행된 횟수이므로 기저 조건을 만족한 호출까지 포함합니다. 반환값은 기저값에서 시작해 각 호출의 지역 n을 이용하여 되돌아오는 순서로 계산합니다. 함수 인수는 호출마다 독립적이지만 전역 calls는 모든 호출이 공유합니다.', trace,
        ['int value = f', 'if (n == 0)', ...Array(n).fill('return previous'), 'printf']);
    } },
    { family: 'practical-c-matrix', title: '이차원 배열과 포인터', refs: refs('2024-2-q13', '2024-3-q16'), build(v) {
      const a = [[v + 2, v + 5, v + 1], [v + 6, v + 3, v + 8]];
      const before = a[1][1], delta = v % 3 + 2; a[1][1] += delta;
      return result(cProgram(`    int a[2][3] = {{${v + 2}, ${v + 5}, ${v + 1}}, {${v + 6}, ${v + 3}, ${v + 8}}};\n    int *p[2] = {a[1], a[0]};\n    int **q = p;\n    *(*(q + 0) + 1) += ${delta};\n    int total = p[0][1] + p[1][2];\n    printf("%d %d", total, a[1][1]);`), `${a[1][1] + a[0][2]} ${a[1][1]}`,
        'p는 행 포인터가 아니라 int 포인터 두 개를 담은 배열입니다. p[0]은 a[1], p[1]은 a[0]을 가리키며 q는 p의 첫 원소 주소입니다. 이중 역참조의 각 단계를 풀면 수정되는 실제 배열 원소를 정확히 찾을 수 있습니다.',
        [`p[0]=a[1], p[1]=a[0]이므로 행의 참조 순서가 원본과 반대입니다.`, `*(q+0)=p[0]=a[1]; *(*(q+0)+1)=a[1][1]=${before}입니다.`, `해당 원소에 ${delta}를 더하면 a[1][1]=${a[1][1]}입니다.`, `p[0][1]=${a[1][1]}, p[1][2]=a[0][2]=${a[0][2]}이므로 total=${a[1][1] + a[0][2]}입니다.`, `원본에도 변경이 반영되어 최종 출력은 ${a[1][1] + a[0][2]} ${a[1][1]}입니다.`],
        ['int *p', 'int **q', '*(*(q', 'int total', 'printf']);
    } },
  ],
  Java: [
    { family: 'practical-java-string', title: '문자열과 참조 비교', refs: refs('2023-2-q14', '2026-1-q17'), build(v) {
      const word = ['NODE', 'DATA', 'JAVA', 'CODE', 'TYPE'][v % 5], n = v + 2;
      return result(javaProgram(`        String a = "${word}${n}";\n        String b = new String(a);\n        String c = a;\n        System.out.print((a == b) + " " + a.equals(b) + " " + (a == c));\n        System.out.print(" " + ${n} + ${n + 1});`), `false true true ${n}${n + 1}`,
        'new String은 내용이 같아도 새로운 객체를 만들기 때문에 a==b는 false입니다. equals는 문자열 내용을 비교하므로 true이고 c=a는 같은 객체 참조를 복사하므로 a==c도 true입니다. 문자열에 이어 붙이는 +는 왼쪽부터 문자열 연결로 평가됩니다.',
        [`a의 내용은 ${word}${n}; b는 같은 내용의 새 객체, c는 a와 같은 객체입니다.`, 'a==b는 참조가 달라 false, a.equals(b)는 내용이 같아 true, a==c는 true입니다.', `두 번째 print는 " "+${n}으로 먼저 문자열이 된 뒤 ${n + 1}을 붙이므로 ${n}${n + 1}을 출력합니다.`],
        ['String c', 'System.out.print((a', 'System.out.print(" "']);
    } },
    { family: 'practical-java-dispatch', title: '상속 객체의 필드와 메서드', refs: refs('2024-3-q11', '2026-2-q15'), build(v) {
      const parent = v + 3, child = v + 8, delta = v % 3 + 1;
      return result(javaProgram('        Parent p = new Child();\n        Child c = (Child)p;\n        System.out.print(p.value + " " + p.read() + " " + c.value);', `    static class Parent {\n        int value = ${parent};\n        int read() { return value; }\n    }\n    static class Child extends Parent {\n        int value = ${child};\n        @Override int read() { return value + ${delta}; }\n    }`), `${parent} ${child + delta} ${child}`,
        '필드 접근은 변수의 선언 타입으로 결정되고 재정의된 인스턴스 메서드는 실제 객체 타입으로 결정됩니다. Child 객체 안에는 Parent.value와 Child.value가 따로 존재합니다. 캐스팅은 새 객체를 생성하지 않으며 참조를 통해 접근하는 타입만 바꿉니다.',
        [`Child 객체를 만들면 부모 필드=${parent}, 자식 필드=${child}가 각각 초기화됩니다.`, 'p의 선언 타입은 Parent이고 실제 객체는 Child입니다. c도 같은 객체를 가리킵니다.', `p.value는 Parent 필드라 ${parent}; p.read()는 Child 구현이라 ${child}+${delta}=${child + delta}입니다.`, `c.value는 Child 필드 ${child}이므로 최종 출력은 ${parent} ${child + delta} ${child}입니다.`],
        ['Parent p', 'Child c', '@Override', 'System.out.print']);
    } },
    { family: 'practical-java-exception', title: '예외 처리 후의 실행', refs: refs('2024-3-q18', '2025-1-q5'), build(v) {
      const n = v + 2, delta = v % 4 + 1, after = (n + delta) * 2;
      return result(javaProgram(`        int total = ${n};\n        try {\n            int[] a = {1, 2};\n            total += a[${2 + v % 3}];\n            total += 100;\n        } catch (ArrayIndexOutOfBoundsException e) {\n            total += ${delta};\n        } finally {\n            total *= 2;\n        }\n        System.out.print(total);`), after,
        '배열 인덱스가 길이 범위를 벗어나면 해당 문장의 대입이 완료되지 않고 catch로 이동합니다. 같은 try의 뒤 문장도 실행하지 않습니다. 일치하는 catch를 마친 다음 finally를 실행하고, 처리되지 않은 예외가 없으므로 그 뒤 출력문까지 진행합니다.',
        [`처음 total=${n}, 배열의 유효 인덱스는 0과 1입니다.`, `a[${2 + v % 3}]에서 예외가 발생해 total += 대입은 완료되지 않습니다. 뒤의 +100도 건너뜁니다.`, `catch에서 total=${n}+${delta}=${n + delta}입니다.`, `finally에서 total=${n + delta}×2=${after}가 되어 ${after}를 출력합니다.`],
        ['int total', 'total += a[', `total += ${delta};`, 'total *= 2']);
    } },
    { family: 'practical-java-recursion', title: '재정의 메서드의 재귀 호출', refs: refs('2023-3-q11', '2025-1-q20'), build(v) {
      const n = 3 + v % 4, k = 1 + Math.floor(v / 4), memo = [k];
      for (let i = 1; i <= n; i++) memo.push(memo[i - 1] + i + k);
      const trace = [`p의 실제 객체는 Child이므로 p.calc(${n})은 Child.calc에서 시작합니다.`, `Child.calc(0)은 ${k}를 반환합니다.`];
      for (let i = 1; i <= n; i++) trace.push(`calc(${i}): 부모 본문의 calc(${i - 1})도 Child 구현을 호출합니다. ${memo[i - 1]}+${i}+${k}=${memo[i]}입니다.`);
      return result(javaProgram(`        Parent p = new Child();\n        System.out.print(p.calc(${n}));`, `    static class Parent {\n        int calc(int n) {\n            if (n <= 0) return 0;\n            return calc(n - 1) + n;\n        }\n    }\n    static class Child extends Parent {\n        @Override int calc(int n) {\n            if (n <= 0) return ${k};\n            return super.calc(n) + ${k};\n        }\n    }`), memo[n],
        'super.calc(n)은 그 호출 한 번에 한해 Parent 구현을 선택합니다. 그러나 부모 본문의 calc(n-1)은 현재 Child 객체에 대한 인스턴스 메서드 호출이므로 다시 Child 구현을 실행합니다. 따라서 자식의 증가량은 최초 호출뿐 아니라 재귀 단계마다 더해집니다.', trace,
        ['Parent p', `if (n <= 0) return ${k}`, ...Array(n).fill('return super.calc')]);
    } },
  ],
  Python: [
    { family: 'practical-python-slice', title: '문자열 슬라이스의 결과', refs: refs('2023-2-q19', '2026-1-q13'), build(v) {
      const word = ['NETWORK', 'COMPUTER', 'DATABASE', 'ALGORITHM', 'SOFTWARE'][v % 5], start = Math.floor(v / 5) % 3;
      const part = word.slice(start, -1), rev = [...part].reverse().filter((_, i) => i % 2 === 0).join('');
      return result(`text = "${word}"\npart = text[${start}:-1]\nresult = part[::-2]\nprint(part, result, len(result))`, `${part} ${rev} ${rev.length}`,
        '양수 방향 슬라이스는 시작 인덱스를 포함하고 끝 인덱스를 제외합니다. -1은 마지막 문자 위치이므로 part에는 마지막 문자가 포함되지 않습니다. [::-2]는 part의 마지막 문자부터 두 칸씩 왼쪽으로 이동하며 원본 문자열 자체는 바뀌지 않습니다.',
        [`text=${word}, text[${start}:-1]은 ${start}부터 ${word.length - 2}번 인덱스까지라 part=${part}입니다.`, `part의 역방향 선택 인덱스는 ${Array.from({ length: rev.length }, (_, i) => part.length - 1 - i * 2).join(', ')}입니다.`, `선택 문자를 순서대로 연결하면 result=${rev}, 길이는 ${rev.length}입니다.`, `print는 공백을 사이에 넣어 ${part} ${rev} ${rev.length}를 출력합니다.`],
        ['part =', 'result =', 'result =', 'print(']);
    } },
    { family: 'practical-python-alias', title: '리스트 복사와 원소 변경', refs: refs('2026-1-q14', '2024-3-q2'), build(v) {
      const a = [v + 2, v + 5, v + 8], b = [...a], delta = v % 4 + 1;
      a[1] += delta; b[0] = a[1];
      return result(`a = [${v + 2}, ${v + 5}, ${v + 8}]\nb = a\nc = a[:]\nb[1] += ${delta}\nc[0] = b[1]\nprint(a[0], a[1], c[0], c[1])`, `${a[0]} ${a[1]} ${b[0]} ${b[1]}`,
        'b=a는 리스트를 복제하지 않고 같은 리스트를 참조합니다. c=a[:]는 바깥 리스트를 새로 만들며 여기서는 원소가 정수라 c의 원소 변경이 a에 영향을 주지 않습니다. b를 통한 변경이 a에도 보이는 점과 복사 당시 c가 가진 값을 구분합니다.',
        [`a와 b는 [${v + 2}, ${v + 5}, ${v + 8}] 하나를 공유하고 c는 같은 내용의 별도 리스트입니다.`, `b[1]에 ${delta}를 더하면 a[1]과 b[1]은 ${a[1]}입니다. c[1]은 ${b[1]}입니다.`, `c[0]=b[1]로 c[0]만 ${b[0]}가 됩니다. a[0]=${a[0]}는 바뀌지 않습니다.`, `출력할 네 원소를 순서대로 읽으면 ${a[0]} ${a[1]} ${b[0]} ${b[1]}입니다.`],
        ['c =', 'b[1] +=', 'c[0] =', 'print(']);
    } },
    { family: 'practical-python-split', title: '문자열을 나눈 뒤 계산', refs: refs('2023-3-q14', '2025-3-q9'), build(v) {
      const values = [v + 2, v + 5, v + 4, v + 7], sum = values.filter(x => x % 2 === 0).reduce((a, b) => a + b, 0);
      return result(`text = "${values.join(':')}"\nitems = text.split(":")\ntotal = 0\nfor item in items:\n    value = int(item)\n    if value % 2 == 0:\n        total += value\nprint(len(items), total)`, `4 ${sum}`,
        'split(":")는 구분 기호를 제외한 문자열 네 개를 만듭니다. 이 상태의 원소는 숫자가 아니라 문자열이므로 int로 변환해야 산술 연산을 합니다. 나머지가 0인 값만 누적하고 조건을 만족하지 않는 회차에서는 total을 유지합니다.',
        [`items=${values.map(x => `'${x}'`).join(', ')}로 원소 수는 4입니다.`, ...values.map((x, i) => `회차 ${i + 1}: int(item)=${x}, ${x}%2=${x % 2}, ${x % 2 ? '누적하지 않음' : 'total에 ' + x + '를 더함'}; 누적합=${values.slice(0, i + 1).filter(a => a % 2 === 0).reduce((a, b) => a + b, 0)}입니다.`), `최종 원소 수와 합계는 4 ${sum}입니다.`],
        ['items =', ...Array(4).fill('if value'), 'print(']);
    } },
    { family: 'practical-python-class', title: '클래스 속성과 인스턴스 속성', refs: refs('2026-2-q5', '2025-1-q17'), build(v) {
      const n = v + 2, m = v + 7;
      return result(`class Box:\n    data = {}\n    def __init__(self, name, value):\n        self.name = name\n        self.data[name] = value\n\na = Box("A", ${n})\nb = Box("B", ${m})\na.data["A"] += b.data["B"]\nb.data = {"B": ${n + 1}}\nprint(a.data["A"], len(a.data), b.data["B"])`, `${n + m} 2 ${n + 1}`,
        '클래스에 선언된 data 딕셔너리는 인스턴스 속성으로 가려지기 전까지 두 객체가 공유합니다. self.data[name] 대입은 공유 딕셔너리의 원소를 수정하는 반면 b.data={}는 b에만 새 속성을 생성합니다. a와 클래스의 data는 기존 딕셔너리를 계속 가리킵니다.',
        [`a 생성 후 공유 data는 {'A': ${n}}입니다.`, `b 생성 후 같은 data에 B가 추가되어 {'A': ${n}, 'B': ${m}}입니다.`, `a.data['A']=${n}+${m}=${n + m}; 공유 딕셔너리의 키는 여전히 두 개입니다.`, `b.data 대입으로 b만 {'B': ${n + 1}}을 참조하며 a의 data에는 영향이 없습니다.`, `따라서 a.data['A'], len(a.data), b.data['B']는 ${n + m} 2 ${n + 1}입니다.`],
        ['a = Box', 'b = Box', 'a.data["A"] +=', 'b.data =', 'print(']);
    } },
  ],
  SQL: [
    { family: 'practical-sql-count', title: '집계 질의의 결과', refs: refs('2025-3-q20', '2026-1-q9'), build(v) {
      const rows = [[1, v + 2], [2, null], [3, v + 2], [4, v + 5], [5, v + 7]];
      const threshold = v + [2, 4, 6, 8, 5][v % 5], selected = rows.filter(row => row[1] !== null && row[1] >= threshold);
      return { tables: [{ name: 'SCORE', columns: ['id', 'point'], rows }], code: `SELECT COUNT(*) AS result\nFROM SCORE\nWHERE point >= ${threshold};`, answerText: String(selected.length), explanation: `먼저 각 point를 ${threshold}와 비교합니다. NULL 비교는 UNKNOWN이라 WHERE를 통과하지 않습니다. 조건을 만족하는 id는 [${selected.map(row => row[0]).join(', ')}]이므로 COUNT(*)는 ${selected.length}입니다. COUNT(*)는 조건을 통과한 행 수를 세며 point의 합계나 id의 합계를 구하지 않습니다.`, steps: [`각 행의 point>=${threshold} 판정: ${rows.map(row => row[1] === null ? 'UNKNOWN' : row[1] >= threshold ? '참' : '거짓').join(', ')}입니다.`, `선택된 행 수가 ${selected.length}이므로 result=${selected.length}입니다.`] };
    } },
    { family: 'practical-sql-group', title: '두 표를 이용한 집계', refs: refs('2025-1-q7', '2026-1-q18'), build(v) {
      const a = v + 3, b = v + 6, limit = [a - 1, a, b, a + b, a + b - 1][v % 5];
      const sums = [a + b, a, b], selected = sums.map((sum, i) => sum > limit ? i + 1 : null).filter(id => id !== null);
      return { tables: [{ name: 'TEAM', columns: ['id', 'name'], rows: [[1, `개발${v}`], [2, `운영${v}`], [3, `분석${v}`]] }, { name: 'WORK', columns: ['team_id', 'hours'], rows: [[1, a], [1, b], [2, a], [3, b]] }],
        code: `SELECT COUNT(*) AS result\nFROM (\n  SELECT T.id\n  FROM TEAM T JOIN WORK W ON T.id = W.team_id\n  GROUP BY T.id\n  HAVING SUM(W.hours) > ${limit}\n) X;`, answerText: String(selected.length), explanation: `조인 결과에서 팀 1은 ${a}와 ${b} 두 행, 팀 2는 ${a}, 팀 3은 ${b} 한 행씩입니다. 합계가 ${limit}보다 큰 팀 id는 [${selected.join(', ')}]입니다. 바깥 COUNT(*)는 작업 건수가 아니라 HAVING을 통과한 팀의 개수 ${selected.length}를 셉니다.`, steps: [`조인 후 팀별 작업 시간: 1=[${a}, ${b}], 2=[${a}], 3=[${b}]입니다.`, `합계는 ${sums.join(', ')}이며 ${limit} 초과 판정은 ${sums.map(sum => sum > limit ? '참' : '거짓').join(', ')}입니다.`, `안쪽 결과는 ${selected.length}행이므로 바깥 result=${selected.length}입니다.`] };
    } },
    { family: 'practical-sql-view', title: '뷰 조회 결과', refs: refs('2023-1-q16', '2023-2-q17'), basis: '복원 자료의 GROUP BY 집계와 VIEW 개념을 결합한 확장 유형', build(v) {
      const n = v + 4, m = v + 9, limit = n * 2;
      return { tables: [{ name: 'SALE', columns: ['area', 'amount'], rows: [['동부', n], ['서부', m], ['동부', n + 2], ['서부', null]] }],
        code: `CREATE VIEW TOTAL AS\nSELECT area, SUM(amount) AS money\nFROM SALE GROUP BY area;\n\nSELECT COUNT(*) AS result FROM TOTAL\nWHERE money > ${limit};`, answerText: String(1 + (m > limit ? 1 : 0)), answerMode: 'output', explanation: `뷰는 지역별 합계를 조회하는 가상 테이블입니다. 동부 합계=${n}+${n + 2}=${n * 2 + 2}, 서부 합계=${m}이며 SUM은 NULL을 제외합니다. 합계가 ${limit}를 초과하는 지역만 세므로 결과는 ${1 + (m > limit ? 1 : 0)}입니다. 뷰를 만든다고 원본 행이 변경되지는 않습니다.`, steps: [`뷰 TOTAL에는 (동부, ${n * 2 + 2}), (서부, ${m}) 두 행이 만들어집니다.`, `money>${limit}: 동부는 참, 서부는 ${m > limit ? '참' : '거짓'}입니다.`, `선택된 행 수 result=${1 + (m > limit ? 1 : 0)}입니다.`] };
    } },
    { family: 'practical-sql-correlated', title: '서브쿼리를 포함한 조회', refs: refs('2026-2-q13'), build(v) {
      const shift = v * 2, xs = [8, 14, 21, 28].map(x => x + shift), ys = [10, 18, 24, 32].map(x => x + shift + v % 5 * 9);
      const detail = xs.map((x, i) => { const chosen = ys.slice(0, i); const sum = chosen.reduce((a, b) => a + b, 0); const avg = chosen.length ? sum / chosen.length : null; return { x, chosen, sum, avg, ok: avg !== null && x > avg }; });
      const count = detail.filter(x => x.ok).length;
      return { tables: [{ name: 'A', columns: ['id', 'x'], rows: xs.map((x, i) => [i + 1, x]) }, { name: 'B', columns: ['id', 'y'], rows: ys.map((y, i) => [i + 1, y]) }],
        code: 'SELECT COUNT(*) AS result FROM A\nWHERE x > (\n  SELECT AVG(y) FROM B\n  WHERE B.id IN (SELECT P.id FROM A P WHERE P.x < A.x)\n);', answerText: String(count), answerMode: 'output', explanation: `바깥 A의 한 행을 고정한 뒤 그 x보다 작은 P의 id를 구하고, 그 id에 해당하는 B.y의 평균을 계산합니다. 첫 행은 내부 대상이 없어 AVG가 NULL이므로 통과하지 않습니다. 나머지 행도 각각 다른 대상의 평균과 비교해야 하며 최종 통과 행은 ${count}개입니다.`, steps: detail.map((d, i) => `A.id=${i + 1}, x=${d.x}: 대상 y=[${d.chosen.join(', ')}], ${d.avg === null ? 'AVG=NULL → UNKNOWN' : `AVG=${d.sum}/${d.chosen.length}=${d.avg} → ${d.ok ? '참' : '거짓'}`}입니다.`) };
    } },
  ],
};

const replacements = {
  C: { 'tree-state': 2, 'list-filter-reverse': 1, 'matrix-alias-fold': 3, 'string-double-alias': 0, 'struct-shallow-callback': 1 },
  Java: { 'string-builder': 0, 'interface-default': 1, 'deque-ends': 2, 'builder-alias': 3 },
  Python: { 'mutable-default': 1, 'variadic-arguments': 2, 'try-except-finally': 0, 'enumerate-zip': 2, 'star-unpack': 1, 'memo-recursion': 3, 'finally-return': 3 },
  SQL: { division: 2, 'additional-division-missing-course': 2, 'join-having-average': 1 },
};
const inputs = { C: [oldC, archivedC], Java: [oldJava, archivedJava], Python: [oldPython, archivedPython], SQL: [oldSQL, archivedSQL] };
export const refreshedCodeQuestions = {};
export const refreshedPreviousCodeQuestions = {};
export const codeRefreshAudit = [];
for (const [language, [bank, previous]] of Object.entries(inputs)) {
  const removed = [], positions = new Map();
  const build = (template, v) => ({ ...template.build(v), ...(language === 'SQL' ? { answerMode: 'result' } : {}), family: template.family, examReferences: template.refs,
    referenceBasis: template.basis || '복원 자료에서 확인한 핵심 연산을 변형한 창작 유형', title: template.title,
    source: '실기 복원 유형 기반 창작', language, solutionGuide: language === 'SQL' ? sqlGuide : codeGuide,
    prompt: language === 'SQL' ? '다음 표와 SQL을 실행했을 때 result 값을 작성하세요.' : `다음 ${language} 프로그램의 표준 출력 결과를 작성하세요.` });
  const current = bank.map(q => {
    const index = replacements[language][q.family];
    if (index === undefined) return q;
    const position = positions.get(index) || 0; positions.set(index, position + 1);
    const template = templates[language][index]; removed.push(q);
    const replacement = { ...build(template, position), id: `${q.id}-r3`, difficulty: q.difficulty, alignmentRevisionOf: q.id };
    codeRefreshAudit.push({ language, previousId: q.id, id: replacement.id, previousFamily: q.family, family: template.family, examReferences: template.refs });
    return replacement;
  });
  templates[language].forEach((template, index) => {
    for (let v = 0; v < 5; v++) current.push({ ...build(template, v + 40), id: `practical-extra-${language.toLowerCase()}-${index * 5 + v + 1}`, difficulty: ['하', '중', '중', '상'][index] });
  });
  refreshedCodeQuestions[language] = current;
  refreshedPreviousCodeQuestions[language] = [...previous, ...removed];
}
// 실제 출제·실행 검증·SQL 해설 표 생성이 동일한 최종 목록을 사용합니다.
export const { C: cCodeQuestions, Java: javaCodeQuestions, Python: pythonCodeQuestions, SQL: sqlCodeQuestions } = refreshedCodeQuestions;
export const { C: previousCCodeQuestions, Java: previousJavaCodeQuestions, Python: previousPythonCodeQuestions, SQL: previousSqlCodeQuestions } = refreshedPreviousCodeQuestions;
