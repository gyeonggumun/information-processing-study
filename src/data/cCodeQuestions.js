// 기출의 출제 개념을 조합한 창작 변형 문제. 모든 출력은 scripts/verify-c-questions.mjs로 검증합니다.
const questions = [];
const levels = { 하: 'easy', 중: 'medium', 상: 'hard' };
const values = [3, 7, 2, 9, 5, 4];
const arrayFor = (v) => values.map((x, i) => x + (i + v) % 3 + Math.floor(v / 3));
const literal = (a) => a.join(', ');
const program = (body, helpers = '') => `#include <stdio.h>\n#include <string.h>\n\n${helpers}${helpers ? '\n\n' : ''}int main(void) {\n${body}\n    return 0;\n}`;
const caseResult = (code, answer, explanation, trace) => ({ code, answerText: String(answer), explanation, trace });

function addFamily(difficulty, family, title, tag, build) {
  for (let variant = 0; variant < 5; variant += 1) {
    const result = build(variant);
    const number = questions.filter((q) => q.difficulty === difficulty).length + 1;
    questions.push({
      id: `c-${levels[difficulty]}-${String(number).padStart(3, '0')}`,
      language: 'C', difficulty, family, variant: variant + 1, number,
      title: `${title} ${variant + 1}`, tag,
      prompt: '다음 C 프로그램의 표준 출력 결과를 실행 순서대로 작성하세요.',
      source: '실기 기출 유형 변형',
      ...result,
    });
  }
}

// 하: 단일 개념의 기본 연산·제어 흐름·주소 추적 (10유형 × 5문항).
addFamily('하', 'integer-arithmetic', '정수 나눗셈과 나머지', '연산자', (v) => {
  const a = 17 + v * 3, b = v + 2;
  const q = Math.trunc(a / b), r = a % b;
  return caseResult(program(`    int a = ${a}, b = ${b};\n    int q = a / b;\n    int r = a % b;\n    printf("%d %d %d", q, r, q * b + r);`), `${q} ${r} ${a}`,
    '두 피연산자가 int이면 나눗셈의 소수 부분은 버립니다. 나머지와 몫을 따로 구한 뒤 몫×제수+나머지로 원래 수를 검산합니다.', [`${a}/${b}의 정수 몫=${q}`, `${a}%${b}=${r}`, `${q}×${b}+${r}=${a}`]);
});

addFamily('하', 'loop-continue', '반복문과 continue', '반복문', (v) => {
  const end = 7 + v, div = v % 3 + 2;
  const used = Array.from({ length: end }, (_, i) => i + 1).filter((i) => i % div !== 0);
  const sum = used.reduce((a, b) => a + b, 0);
  return caseResult(program(`    int sum = 0;\n    for (int i = 1; i <= ${end}; i++) {\n        if (i % ${div} == 0) continue;\n        sum += i;\n    }\n    printf("%d", sum);`), sum,
    'continue는 현재 반복의 나머지 문장을 건너뛰고 증감식으로 이동합니다. 조건에 맞아 제외된 값은 sum에 더해지지 않습니다.', [`제외 조건: ${div}의 배수`, `누적하는 값: ${used.join(', ')}`, `합계=${sum}`]);
});

addFamily('하', 'nested-branch', '조건 분기와 삼항 연산', '조건문', (v) => {
  const x = [4, 9, 12, 15, 6][v], y = [8, 3, 12, 7, 10][v];
  const larger = Math.max(x, y), result = larger % 2 === 0 ? larger / 2 : larger * 2;
  return caseResult(program(`    int x = ${x}, y = ${y};\n    int m = x > y ? x : y;\n    if (m % 2 == 0) m /= 2;\n    else m *= 2;\n    printf("%d", m);`), result,
    '삼항 연산자로 두 수 중 큰 값을 고른 다음 if 조건을 평가합니다. 선택된 값의 짝수·홀수 여부만 다음 분기를 결정합니다.', [`x>y는 ${x > y ? '참' : '거짓'}, m=${larger}`, `${larger}는 ${larger % 2 ? '홀수' : '짝수'}`, `분기 후 m=${result}`]);
});

addFamily('하', 'switch-fallthrough', 'switch의 break와 관통', 'switch', (v) => {
  const k = v % 4;
  const result = [3, 2, 9, 5][k];
  return caseResult(program(`    int k = ${k}, sum = 0;\n    switch (k) {\n        case 0: sum += 1;\n        case 1: sum += 2; break;\n        case 2: sum += 4;\n        default: sum += 5;\n    }\n    printf("%d", sum + ${v});`), result + v,
    'switch는 일치하는 case로 이동한 뒤 break를 만날 때까지 다음 case의 문장도 실행합니다. 각 case가 독립된 if문처럼 동작하지 않는 점이 핵심입니다.', [`시작 case=${k === 3 ? 'default' : k}`, `switch 종료 시 sum=${result}`, `마지막에 ${v}을 더해 ${result + v} 출력`]);
});

addFamily('하', 'array-index', '배열의 선택적 누적', '배열', (v) => {
  const a = arrayFor(v), start = v % 2;
  const picked = a.filter((_, i) => i >= start && (i - start) % 2 === 0);
  const sum = picked.reduce((a, b) => a + b, 0);
  return caseResult(program(`    int a[] = {${literal(a)}};\n    int sum = 0;\n    for (int i = ${start}; i < 6; i += 2) sum += a[i];\n    printf("%d %d", sum, a[${v}]);`), `${sum} ${a[v]}`,
    '배열 인덱스는 0부터 시작합니다. 반복문의 시작 인덱스와 증가 폭을 먼저 나열한 뒤 해당 원소만 합산합니다.', [`시작 인덱스=${start}, 증가 폭=2`, `선택 원소=${picked.join(', ')}`, `합계=${sum}, a[${v}]=${a[v]}`]);
});

addFamily('하', 'string-offset', '문자열 포인터의 시작 위치', '문자열', (v) => {
  const s = ['NETWORK', 'POINTER', 'PROGRAM', 'COMPILER', 'DATABASE'][v], offset = v % 3 + 1;
  return caseResult(program(`    char s[] = "${s}";\n    char *p = s + ${offset};\n    printf("%c %s", *p, p);`), `${s[offset]} ${s.slice(offset)}`,
    '%c는 현재 문자를 하나 출력하고 %s는 전달한 주소에서 널 문자까지 출력합니다. s+오프셋은 문자열 복사가 아니라 시작 주소 이동입니다.', [`p는 s[${offset}]을 가리킴`, `*p='${s[offset]}'`, `p에서 시작하는 문자열=${s.slice(offset)}`]);
});

addFamily('하', 'value-address', '값 전달과 주소 전달', '함수·포인터', (v) => {
  const x = 5 + v, delta = v + 2;
  return caseResult(program(`    int x = ${x};\n    by_value(x);\n    printf("%d ", x);\n    by_address(&x);\n    printf("%d", x);`, `void by_value(int x) { x += ${delta}; }\nvoid by_address(int *p) { *p += ${delta}; }`), `${x} ${x + delta}`,
    '값 전달은 매개변수 복사본만 변경합니다. 주소를 전달하면 역참조를 통해 호출자의 원래 변수를 변경할 수 있습니다.', [`by_value 내부의 복사본만 ${x + delta}로 변경`, `첫 출력 x=${x}`, `by_address가 원본을 수정해 x=${x + delta}`]);
});

addFamily('하', 'pointer-move', '포인터 이동과 역참조', '포인터', (v) => {
  const a = arrayFor(v), start = v % 3, step = v % 2 + 1;
  return caseResult(program(`    int a[] = {${literal(a)}};\n    int *p = a + ${start};\n    p += ${step};\n    *p += ${v + 1};\n    printf("%d %d", *p, a[${start}]);`), `${a[start + step] + v + 1} ${a[start]}`,
    'int 포인터에 1을 더하면 다음 int 원소를 가리킵니다. p 이동은 주소 변경이고 *p 변경은 그 주소에 저장된 값의 변경입니다.', [`처음 p=&a[${start}]`, `이동 후 p=&a[${start + step}]`, `그 원소만 ${a[start + step] + v + 1}로 변경`]);
});

addFamily('하', 'linear-recursion', '단일 재귀의 누적 반환', '재귀', (v) => {
  const n = v + 3, sum = n * (n + 1) / 2;
  return caseResult(program(`    printf("%d", total(${n}));`, 'int total(int n) {\n    if (n == 0) return 0;\n    return n + total(n - 1);\n}'), sum,
    '기저 조건에서 0을 반환한 뒤 호출이 되돌아오며 각 n을 더합니다. 재귀가 내려가는 순서와 반환이 올라오는 순서를 구분합니다.', [`${n}부터 0까지 재귀 호출`, 'total(0)=0', `1부터 ${n}까지 합=${sum}`]);
});

addFamily('하', 'unsigned-bits', '비트 마스크와 시프트', '비트 연산', (v) => {
  const x = [29, 42, 55, 61, 38][v], shift = v % 3 + 1, mask = [7, 15, 3, 31, 7][v];
  const result = (x >> shift) & mask;
  return caseResult(program(`    unsigned int x = ${x}u;\n    unsigned int y = (x >> ${shift}) & ${mask}u;\n    printf("%u", y);`), result,
    '양수 unsigned 값을 오른쪽으로 이동한 뒤 AND 마스크에 1인 비트만 남깁니다. 논리 연산 &&와 비트 연산 &를 구분하세요.', [`${x}를 ${shift}비트 오른쪽 이동=${x >> shift}`, `마스크=${mask}`, `AND 결과=${result}`]);
});

// 중: 여러 단계의 값 변경과 자료구조 추적 (10유형 × 5문항).
addFamily('중', 'bubble-pass', '버블 정렬의 중간 상태', '정렬', (v) => {
  const input = arrayFor(v), a = [...input], passes = v % 3 + 1, descending = v % 2 === 1, trace = [`초기 배열: ${input.join(' ')}`];
  for (let i = 0; i < passes; i++) {
    for (let j = 0; j < 5 - i; j++) if (descending ? a[j] < a[j + 1] : a[j] > a[j + 1]) [a[j], a[j + 1]] = [a[j + 1], a[j]];
    trace.push(`${i + 1}회전 후: ${a.join(' ')}`);
  }
  return caseResult(program(`    int a[] = {${literal(input)}};\n    for (int i = 0; i < ${passes}; i++) {\n        for (int j = 0; j < 5 - i; j++) {\n            if (a[j] ${descending ? '<' : '>'} a[j + 1]) {\n                int t = a[j]; a[j] = a[j + 1]; a[j + 1] = t;\n            }\n        }\n    }\n    for (int i = 0; i < 6; i++) printf("%d ", a[i]);`), a.join(' '),
    `비교 조건에 따라 ${descending ? '작은' : '큰'} 값이 오른쪽으로 밀립니다. 전체 정렬 결과가 아니라 지정된 회전까지만 실행한 배열을 출력해야 합니다.`, trace);
});

addFamily('중', 'insertion-prefix', '삽입 정렬과 이동 횟수', '정렬', (v) => {
  const input = arrayFor(v), a = [...input], end = v % 3 + 3, trace = []; let moves = 0;
  for (let i = 1; i < end; i++) { const key = a[i]; let j = i - 1; while (j >= 0 && a[j] > key) { a[j + 1] = a[j]; j--; moves++; } a[j + 1] = key; trace.push(`i=${i}: ${a.join(' ')}, 누적 이동=${moves}`); }
  return caseResult(program(`    int a[] = {${literal(input)}};\n    int moves = 0;\n    for (int i = 1; i < ${end}; i++) {\n        int key = a[i], j = i - 1;\n        while (j >= 0 && a[j] > key) {\n            a[j + 1] = a[j]; j--; moves++;\n        }\n        a[j + 1] = key;\n    }\n    printf("%d %d %d", moves, a[0], a[${end - 1}]);`), `${moves} ${a[0]} ${a[end - 1]}`,
    'key를 따로 보관하고 큰 원소를 오른쪽으로 이동합니다. moves는 비교 횟수나 교환 횟수가 아니라 while 몸체에서 실제 원소를 옮긴 횟수입니다.', trace);
});

addFamily('중', 'branch-recursion', '분기 재귀와 반환식', '재귀', (v) => {
  const n = v + 4, weight = v % 2 + 1, base = v % 3 + 1, memo = [base, base + 1];
  for (let i = 2; i <= n; i++) memo[i] = memo[i - 1] + weight * memo[i - 2];
  return caseResult(program(`    printf("%d", calc(${n}));`, `int calc(int n) {\n    if (n < 2) return ${base} + n;\n    int left = calc(n - 1);\n    int right = calc(n - 2);\n    return left + ${weight} * right;\n}`), memo[n],
    '각 호출은 독립적인 n을 갖습니다. 기저값 두 개를 먼저 적고 작은 n부터 반환식을 채우면 호출 트리를 모두 그리지 않고도 계산할 수 있습니다.', memo.map((x, i) => `calc(${i})=${x}`));
});

addFamily('중', 'static-state', 'static 지역 변수의 누적', '정적 변수', (v) => {
  const args = [v + 2, 1, v % 3 + 3], start = v + 1; let state = start;
  const out = args.map((x) => { state += x; return state * 2 - x; });
  return caseResult(program(`    int a = next(${args[0]});\n    int b = next(${args[1]});\n    int c = next(${args[2]});\n    printf("%d %d %d", a, b, c);`, `int next(int x) {\n    static int state = ${start};\n    state += x;\n    return state * 2 - x;\n}`), out.join(' '),
    'static 지역 변수는 함수 호출이 끝나도 값을 유지하며 초기화는 한 번만 수행됩니다. 매개변수 x는 매 호출 새로 생기지만 state는 이전 호출의 값에서 이어집니다.', args.map((x, i) => `${i + 1}번째 호출: x=${x}, 반환=${out[i]}`));
});

addFamily('중', 'row-pointer', '2차원 배열과 행 포인터', '다차원 배열', (v) => {
  const input = [arrayFor(v).slice(0, 3), arrayFor(v).slice(3)], a = input.map((row) => [...row]), col = v % 3;
  a[1][col] += a[0][2 - col]; const out = a[0].map((x, i) => x + a[1][i]);
  return caseResult(program(`    int a[2][3] = {{${literal(input[0])}}, {${literal(input[1])}}};\n    int (*p)[3] = a;\n    (*(p + 1))[${col}] += (*p)[${2 - col}];\n    for (int i = 0; i < 3; i++) printf("%d ", p[0][i] + p[1][i]);`), out.join(' '),
    'p는 int 세 개로 이루어진 행을 가리킵니다. p+1은 다음 원소 하나가 아니라 다음 행으로 이동합니다. p[r][c]와 (*(p+r))[c]는 같은 원소입니다.', [`변경되는 위치=a[1][${col}]`, `변경 후 두 번째 행=${a[1].join(' ')}`, `열별 합=${out.join(' ')}`]);
});

addFamily('중', 'string-mutation', '문자 배열 변경과 널 종료', '문자열', (v) => {
  const s = ['NETWORK', 'POINTER', 'PROGRAM', 'COMPILE', 'DATABASE'][v], a = [...s], i = v % 3, j = i + 3, end = 5 + v % 2;
  [a[i], a[j]] = [a[j], a[i]]; const text = a.slice(0, end).join('');
  return caseResult(program(`    char s[] = "${s}";\n    char *p = s + ${i};\n    char t = *p;\n    *p = p[3];\n    p[3] = t;\n    s[${end}] = '\\0';\n    printf("%s %zu", s, strlen(s));`), `${text} ${end}`,
    '쓰기 가능한 문자 배열에서 두 문자를 교환합니다. 문자열 길이는 배열 전체 크기가 아니라 첫 널 문자까지의 길이이며, 널 문자 뒤의 값은 %s로 출력하지 않습니다.', [`교환 위치=${i}, ${j}`, `널 문자 위치=${end}`, `출력 문자열=${text}, 길이=${end}`]);
});

addFamily('중', 'struct-copy', '구조체 복사와 원본 수정', '구조체', (v) => {
  const x = v + 3, y = v * 2 + 5, delta = v + 2;
  return caseResult(program(`    Pair a = {${x}, ${y}};\n    Pair b = change_copy(a);\n    change_original(&a);\n    printf("%d %d %d %d", a.x, a.y, b.x, b.y);`, `typedef struct { int x; int y; } Pair;\nPair change_copy(Pair p) {\n    p.x += ${delta}; p.y -= ${delta}; return p;\n}\nvoid change_original(Pair *p) {\n    p->y += p->x; p->x *= 2;\n}`), `${x * 2} ${y + x} ${x + delta} ${y - delta}`,
    '구조체를 값으로 전달하면 멤버가 복사됩니다. 반환된 복사본 b와 주소로 변경한 원본 a를 별도로 추적하고, 원본 수정 함수 안에서도 문장 실행 순서를 지킵니다.', [`복사본 b=(${x + delta}, ${y - delta})`, `원본 y는 기존 x를 더해 ${y + x}`, `원본 x는 두 배인 ${x * 2}`]);
});

addFamily('중', 'double-pointer', '이중 포인터로 대상 변경', '이중 포인터', (v) => {
  const a = arrayFor(v), start = v % 2, step = v % 3 + 1, at = start + step, delta = v + 2;
  return caseResult(program(`    int a[] = {${literal(a)}};\n    int *p = a + ${start};\n    move(&p);\n    printf("%d %d %d", (int)(p - a), *p, a[${start}]);`, `void move(int **pp) {\n    *pp += ${step};\n    **pp += ${delta};\n}`), `${at} ${a[at] + delta} ${a[start]}`,
    'pp는 포인터 변수 p의 주소입니다. *pp를 바꾸면 p의 가리키는 위치가 달라지고, **pp를 바꾸면 새 위치의 배열 값이 달라집니다.', [`원래 p의 인덱스=${start}`, `이동 후 인덱스=${at}`, `해당 값=${a[at] + delta}, 기존 위치 값=${a[start]}`]);
});

addFamily('중', 'ring-basic', '원형 큐의 인덱스 회전', '원형 큐', (v) => {
  const a = arrayFor(v), out = [a[0], a[1], a[2]], final = [a[3], a[4], a[5]];
  return caseResult(program(`    put(${a[0]}); put(${a[1]}); put(${a[2]});\n    int x = get();\n    put(${a[3]});\n    int y = get();\n    put(${a[4]}); put(${a[5]});\n    int z = get();\n    printf("%d %d %d %d", x, y, z, q[front]);`, 'int q[4], front = 0, rear = 0, count = 0;\nvoid put(int x) { if (count < 4) { q[rear] = x; rear = (rear + 1) % 4; count++; } }\nint get(void) { if (!count) return -1; int x = q[front]; front = (front + 1) % 4; count--; return x; }'),
    `${out.join(' ')} ${final[0]}`, 'FIFO 순서는 유지되지만 배열 인덱스는 나머지 연산으로 0에 돌아옵니다. front는 다음 삭제 위치, rear는 다음 삽입 위치이며 count로 가득 참과 비어 있음을 구별합니다.', [`삭제 순서=${out.join(' → ')}`, `남은 논리적 큐=${final.join(' → ')}`, `front=3, rear=2, count=3`]);
});

addFamily('중', 'binary-search', '이진 탐색의 방문 기록', '탐색', (v) => {
  const a = [2, 5, 8, 11, 14, 17, 20], target = [2, 17, 9, 20, 5][v]; let lo = 0, hi = 6, found = -1, visits = 0; const trace = [];
  while (lo <= hi) { const mid = Math.trunc((lo + hi) / 2); visits = visits * 10 + mid; trace.push(`범위 [${lo}, ${hi}], mid=${mid}, 값=${a[mid]}`); if (a[mid] === target) { found = mid; break; } if (a[mid] < target) lo = mid + 1; else hi = mid - 1; }
  return caseResult(program(`    int a[] = {${literal(a)}};\n    int lo = 0, hi = 6, found = -1, visits = 0;\n    while (lo <= hi) {\n        int mid = (lo + hi) / 2;\n        visits = visits * 10 + mid;\n        if (a[mid] == ${target}) { found = mid; break; }\n        if (a[mid] < ${target}) lo = mid + 1;\n        else hi = mid - 1;\n    }\n    printf("%d %d", found, visits);`), `${found} ${visits}`,
    '정렬된 배열에서 중간값 비교 후 탐색 범위를 절반으로 줄입니다. visits는 방문 횟수가 아니라 mid를 십진 자릿수로 누적한 기록입니다. 찾지 못하면 found는 -1입니다.', trace);
});

// 상: 기출의 포인터·재귀·구조체·자료구조를 결합한 킬러 변형 (10유형 × 5문항).
addFamily('상', 'tree-state', '트리 순회와 순번 선택 및 갱신', '트리·재귀·상태', (v) => {
  const data = [v + 4, 2, v + 7, 3, 6, v + 1, 8], target = v + 2, reverse = v % 2 === 1, order = [], trace = []; let seen = 0, chosen = -1;
  function walk(i, depth) { if (i >= 7) return 0; const l = walk(reverse ? i * 2 + 2 : i * 2 + 1, depth + 1); const r = walk(reverse ? i * 2 + 1 : i * 2 + 2, depth + 1); data[i] += depth; order.push(i); seen++; if (seen === target) chosen = data[i]; const result = data[i] + l - r; trace.push(`노드 ${i}: 갱신 값=${data[i]}, 반환=${result}, 순번=${seen}`); return result; }
  const fold = walk(0, 0), initial = [v + 4, 2, v + 7, 3, 6, v + 1, 8];
  return caseResult(program(`    Node n[7];\n    int value[] = {${literal(initial)}};\n    for (int i = 0; i < 7; i++) {\n        n[i].value = value[i];\n        n[i].left = i * 2 + 1 < 7 ? &n[i * 2 + 1] : NULL;\n        n[i].right = i * 2 + 2 < 7 ? &n[i * 2 + 2] : NULL;\n    }\n    int result = walk(&n[0], 0);\n    printf("%d %d %d", chosen, result, n[${v + 1}].value);`, `typedef struct Node { int value; struct Node *left, *right; } Node;\nint seen = 0, chosen = -1;\nint walk(Node *p, int depth) {\n    if (p == NULL) return 0;\n    int a = walk(p->${reverse ? 'right' : 'left'}, depth + 1);\n    int b = walk(p->${reverse ? 'left' : 'right'}, depth + 1);\n    p->value += depth;\n    seen++;\n    if (seen == ${target}) chosen = p->value;\n    return p->value + a - b;\n}`), `${chosen} ${fold} ${data[v + 1]}`,
    '배열의 구조체들이 포인터로 연결된 완전 이진 트리입니다. 자식을 모두 처리한 뒤 자기 값을 깊이만큼 갱신하는 후위 순회입니다. 전역 순번과 각 호출의 반환값은 서로 다른 상태이므로 따로 기록합니다.', [`방문 노드 순서=${order.join(' → ')}`, ...trace]);
});

addFamily('상', 'list-filter-reverse', '연결 리스트 삭제·역순·가중합', '연결 리스트·이중 포인터', (v) => {
  const input = arrayFor(v), divisor = v % 3 + 2, kept = input.filter((x) => x % divisor !== 0).map((x) => x + v + 1).reverse(), sum = kept.reduce((s, x, i) => s + x * (i + 1), 0);
  return caseResult(program(`    Node n[6];\n    int a[] = {${literal(input)}};\n    for (int i = 0; i < 6; i++) { n[i].value = a[i]; n[i].next = i < 5 ? &n[i + 1] : NULL; }\n    Node *head = &n[0];\n    filter(&head);\n    head = reverse(head);\n    int sum = 0, weight = 1;\n    for (Node *p = head; p != NULL; p = p->next) sum += weight++ * p->value;\n    printf("%d %d", head ? head->value : -1, sum);`, `typedef struct Node { int value; struct Node *next; } Node;\nvoid filter(Node **link) {\n    while (*link != NULL) {\n        Node *p = *link;\n        if (p->value % ${divisor} == 0) *link = p->next;\n        else { p->value += ${v + 1}; link = &p->next; }\n    }\n}\nNode *reverse(Node *p) {\n    Node *prev = NULL;\n    while (p) {\n        Node *next = p->next;\n        p->next = prev; prev = p; p = next;\n    }\n    return prev;\n}`), `${kept[0] ?? -1} ${sum}`,
    'link는 현재 노드가 아니라 현재 노드를 가리키는 연결 필드의 주소입니다. 삭제할 때는 *link만 다음 노드로 바꾸고, 남길 때만 다음 연결 필드로 이동합니다. 남은 값을 갱신한 후 역순으로 연결하므로 가중치의 적용 순서도 뒤집힙니다.', [`삭제 대상: 기존 값이 ${divisor}의 배수`, `갱신·역순 후=${kept.join(' → ') || '빈 리스트'}`, `가중합=${kept.map((x, i) => `${i + 1}×${x}`).join(' + ') || '0'}=${sum}`]);
});

addFamily('상', 'recursive-callback', '재귀 호출과 static 상태 및 콜백', '재귀·함수 포인터', (v) => {
  let tick = v + 1; const trace = [], depth = 4 + v % 2;
  const op = (x, y) => v % 2 ? x - y : x + y;
  function run(n) { tick++; const stamp = tick; if (n <= 1) { trace.push(`기저 n=${n}: stamp=${stamp}`); return stamp + n; } const a = run(n - 1), b = run(n - 2), r = op(a, b) + stamp; trace.push(`n=${n}: op(${a}, ${b})+${stamp}=${r}`); return r; }
  const first = run(depth), second = run(2);
  return caseResult(program(`    int a = run(${depth}, ${v % 2 ? 'sub' : 'add'});\n    int b = run(2, ${v % 2 ? 'sub' : 'add'});\n    printf("%d %d", a, b);`, `int add(int a, int b) { return a + b; }\nint sub(int a, int b) { return a - b; }\nint run(int n, int (*op)(int, int)) {\n    static int tick = ${v + 1};\n    tick++;\n    int stamp = tick;\n    if (n <= 1) return stamp + n;\n    int a = run(n - 1, op);\n    int b = run(n - 2, op);\n    return op(a, b) + stamp;\n}`), `${first} ${second}`,
    'tick는 모든 재귀 호출과 이후 호출이 공유하지만 stamp는 각 호출의 지역 복사본입니다. 왼쪽 재귀가 모두 끝난 다음 오른쪽 재귀를 실행합니다. 두 번째 run에서도 static tick를 초기화하지 않습니다.', trace);
});

addFamily('상', 'matrix-alias-fold', '행 포인터 재배열과 재귀 누적', '배열·별칭·재귀', (v) => {
  const input = [arrayFor(v).slice(0, 3), [v + 2, 8, 3], [6, v + 1, 5]], a = input.map((r) => [...r]), order = [[2, 0, 1], [1, 2, 0], [0, 2, 1], [2, 1, 0], [1, 0, 2]][v], col = v % 3, trace = [];
  for (let i = 0; i < 3; i++) { a[order[i]][col] += a[order[(i + 1) % 3]][(col + 1) % 3]; trace.push(`i=${i}: 실제 배열 행 ${order[i]}=${a[order[i]].join(' ')}`); }
  [order[0], order[1], order[2]] = [order[2], order[0], order[1]];
  trace.push(`포인터 재배열 후 가리키는 행 순서=${order.join(' → ')}`);
  function fold(i) { if (i === 3) return 0; return a[order[i]][col] * (i + 1) - fold(i + 1); }
  const result = fold(0);
  return caseResult(program(`    int a[3][3] = {${input.map((r) => `{${literal(r)}}`).join(', ')}};\n    int *p[3] = {a[${order[1]}], a[${order[2]}], a[${order[0]}]};\n    for (int i = 0; i < 3; i++) p[i][${col}] += p[(i + 1) % 3][${(col + 1) % 3}];\n    int *saved = p[0];\n    p[0] = p[2];\n    p[2] = p[1];\n    p[1] = saved;\n    printf("%d %d", fold(p, 0), a[${order[1]}][${col}]);`, `int fold(int **p, int i) {\n    if (i == 3) return 0;\n    int rest = fold(p, i + 1);\n    return p[i][${col}] * (i + 1) - rest;\n}`), `${result} ${a[order[1]][col]}`,
    'p는 행 포인터들의 배열이며 실제 a의 행 순서는 바뀌지 않습니다. p를 통해 수정하면 대응되는 a의 행도 바뀝니다. 재귀 반환식은 매 단계에서 나머지를 빼므로 단순한 가중합이 아니라 부호가 번갈아 나타납니다.', [...trace, `재귀 반환=${result}`, `원본 a의 지정 원소=${a[order[1]][col]}`]);
});

addFamily('상', 'string-double-alias', '문자열 별칭과 포인터 재지정', '문자열·이중 포인터', (v) => {
  const initial = ['POINTER', 'NETWORK', 'PROGRAM'], a = initial.map((s) => [...s]), at = v % 3, next = (at + 1) % 3, offset = v % 2 + 1, p = initial.map((_, i) => ({ row: i, offset: 0 })), delta = v + 1;
  p[at] = { row: next, offset }; const src = p[(at + 2) % 3]; a[next][offset] = a[src.row][src.offset];
  if (delta % 2) [a[next][offset], a[next][offset + 1]] = [a[next][offset + 1], a[next][offset]];
  a[next][offset + 2] = '\0';
  const str = (ref) => a[ref.row].slice(ref.offset).join('').split('\0')[0]; const out = `${str(p[at])} ${str(p[next])} ${str(p[(at + 2) % 3])}`;
  return caseResult(program(`    char a[] = "POINTER", b[] = "NETWORK", c[] = "PROGRAM";\n    char *p[] = {a, b, c};\n    redirect(&p[${at}], p[${next}] + ${offset});\n    p[${at}][0] = p[${(at + 2) % 3}][0];\n    cut(p[${at}], ${delta});\n    printf("%s %s %s", p[${at}], p[${next}], p[${(at + 2) % 3}]);`, `void redirect(char **slot, char *target) { *slot = target; }\nvoid cut(char *s, int n) {\n    if (n > 0) {\n        char saved = s[0];\n        s[0] = s[1];\n        s[1] = saved;\n        cut(s, n - 1);\n    } else s[2] = '\\0';\n}`), out,
    'redirect는 포인터 배열의 슬롯만 바꾸며 문자를 복사하지 않습니다. 두 슬롯이 같은 문자 배열의 서로 다른 위치를 가리키므로 문자와 널 문자의 수정이 양쪽 출력에 반영됩니다. cut은 같은 두 문자를 재귀 호출마다 교환하므로 교환 횟수의 홀짝을 따져야 합니다.', [`p[${at}]가 문자열 ${initial[next]}의 ${offset}번째 위치를 가리킴`, `그 위치를 '${initial[(at + 2) % 3][0]}'로 수정`, `앞 두 문자 ${delta}회 교환: ${delta % 2 ? '순서 반전' : '원래 순서'}`, `원본 문자열 인덱스 ${offset + 2}에 널 문자 삽입`, `세 문자열 출력=${out}`]);
});

addFamily('상', 'ring-command-callback', '원형 큐 명령과 콜백 재삽입', '원형 큐·콜백', (v) => {
  const commands = [1, 1, 1, 2, 1, 3, 1, 2, 3, 1, 1, 2], args = [2 + v, 7, 4 + v, 0, 8, 0, 3, 0, 0, 6 + v, 9, 0], queue = [], trace = []; let front = 0, rear = 0, score = 0;
  function put(x) { if (queue.length < 4) { queue.push(x); rear = (rear + 1) % 4; } }
  function get() { if (!queue.length) return -1; front = (front + 1) % 4; return queue.shift(); }
  for (let i = 0; i < commands.length; i++) { const op = commands[i]; if (op === 1) put(args[i]); else { const x = get(); if (op === 2) score += x; else if (x >= 0) put(x % (v + 3) + v + 1); } trace.push(`${i + 1}번째 명령 후: 큐=[${queue.join(', ')}], front=${front}, rear=${rear}, score=${score}`); }
  return caseResult(program(`    int op[] = {${literal(commands)}};\n    int arg[] = {${literal(args)}};\n    int score = 0;\n    int (*transform)(int) = change;\n    for (int i = 0; i < 12; i++) {\n        if (op[i] == 1) put(arg[i]);\n        else {\n            int x = get();\n            if (op[i] == 2) score += x;\n            else if (x >= 0) put(transform(x));\n        }\n    }\n    printf("%d %d %d %d", score, q[front], front, rear);`, `int q[4], front = 0, rear = 0, count = 0;\nint change(int x) { return x % ${v + 3} + ${v + 1}; }\nvoid put(int x) {\n    if (count == 4) return;\n    q[rear] = x; rear = (rear + 1) % 4; count++;\n}\nint get(void) {\n    if (count == 0) return -1;\n    int x = q[front]; front = (front + 1) % 4; count--;\n    return x;\n}`), `${score} ${queue[0]} ${front} ${rear}`,
    '명령 1은 삽입, 2는 삭제해 점수에 더하기, 3은 삭제한 값을 콜백으로 변환해 재삽입하기입니다. 큐가 가득 차면 삽입이 무시되며 논리적 순서와 물리적 인덱스를 함께 추적해야 합니다.', trace);
});

addFamily('상', 'struct-shallow-callback', '구조체 얕은 복사와 간접 수정', '구조체·별칭·콜백', (v) => {
  const input = arrayFor(v).slice(0, 3), shared = [...input], aLocal = [v + 1, v + 4], bLocal = [...aLocal], shift = v % 2, delta = v + 2;
  shared[shift] += bLocal[0]; bLocal[1] += delta; shared[0] += aLocal[1]; aLocal[0] += delta;
  const cLocal = [bLocal[1] - aLocal[0], bLocal[1]], cShift = 1 - shift;
  shared[cShift] += cLocal[0]; cLocal[1] += delta;
  bLocal[0] = cLocal[1]; shared[shift] += bLocal[1]; bLocal[0] += delta;
  return caseResult(program(`    int shared[] = {${literal(input)}};\n    Box a = {{${v + 1}, ${v + 4}}, shared, edit};\n    Box b = a;\n    b.ref += ${shift};\n    b.apply(&b, 0);\n    a.apply(&a, 1);\n    Box c = b;\n    c.ref = a.ref + ${cShift};\n    c.local[0] = b.local[1] - a.local[0];\n    c.apply(&c, 0);\n    b.local[0] = c.local[1];\n    b.apply(&b, 1);\n    printf("%d %d %d %d %d %d %d", a.local[0], b.local[1], shared[0], shared[1], *b.ref, c.local[1], b.local[0]);`, `typedef struct Box {\n    int local[2]; int *ref;\n    void (*apply)(struct Box *, int);\n} Box;\nvoid edit(Box *p, int mode) {\n    p->ref[0] += p->local[mode];\n    p->local[1 - mode] += ${delta};\n}`), `${aLocal[0]} ${bLocal[1]} ${shared[0]} ${shared[1]} ${shared[shift]} ${cLocal[1]} ${bLocal[0]}`,
    '구조체 대입은 내부 배열 local의 원소를 별도로 복사하지만 ref에는 주소만 복사합니다. b.ref를 이동해도 a.ref는 움직이지 않습니다. c는 b의 변경된 값을 복사한 뒤 다른 공유 원소를 가리킵니다. 콜백의 mode에 따라 읽는 local과 변경하는 local이 달라지므로 구조체별 상태와 공유 배열을 분리해 추적합니다.', [`처음 a.local과 b.local=[${v + 1}, ${v + 4}], ref는 같은 배열`, `첫 b 호출: shared[${shift}]에 ${v + 1} 누적, b.local[1]=${bLocal[1]}`, `a 호출: shared[0]에 ${v + 4} 누적, a.local[0]=${aLocal[0]}`, `c 호출: shared[${cShift}]에 ${cLocal[0]} 누적, c.local[1]=${cLocal[1]}`, `마지막 b 호출: shared[${shift}]에 ${bLocal[1]} 누적, b.local[0]=${bLocal[0]}`, `최종 shared=[${shared.join(', ')}]`]);
});

addFamily('상', 'postfix-state', '후위식 스택과 연산 콜백', '스택·함수 포인터', (v) => {
  const tokens = [v + 3, 2, -1, 5, v + 1, -2, -1, 3, -2], stack = [], trace = []; let calls = 0;
  for (const token of tokens) { if (token >= 0) stack.push(token); else { const b = stack.pop(), a = stack.pop(); calls++; stack.push(token === -1 ? a + b + calls : a * b - calls); } trace.push(`토큰 ${token} 처리 후 스택=[${stack.join(', ')}], calls=${calls}`); }
  return caseResult(program(`    int token[] = {${literal(tokens)}};\n    int stack[10], top = 0;\n    int (*op[2])(int, int) = {add, mul};\n    for (int i = 0; i < 9; i++) {\n        if (token[i] >= 0) stack[top++] = token[i];\n        else {\n            int b = stack[--top];\n            int a = stack[--top];\n            stack[top++] = op[-token[i] - 1](a, b);\n        }\n    }\n    printf("%d %d", stack[0], calls);`, 'int calls = 0;\nint add(int a, int b) { calls++; return a + b + calls; }\nint mul(int a, int b) { calls++; return a * b - calls; }'), `${stack[0]} ${calls}`,
    '음수가 아닌 토큰은 피연산자이고 -1과 -2는 연산 함수의 인덱스로 바뀝니다. 먼저 꺼낸 값이 오른쪽 피연산자 b입니다. 일반 후위식과 달리 연산마다 전역 calls가 결과에 반영됩니다.', trace);
});

addFamily('상', 'backtrack-restore', '백트래킹과 공유 배열 복원', '재귀·백트래킹', (v) => {
  const initial = [v + 1, 2, v + 3], a = [...initial], depth = 3 + v % 2, trace = []; let hits = 0, score = 0;
  function search(k) { if (k === depth) { const sum = a.reduce((x, y) => x + y, 0); if (sum % (v % 3 + 2) === 0) { hits++; score += a[0] * 100 + a[1] * 10 + a[2]; trace.push(`유효 리프 [${a.join(', ')}], 누적 score=${score}`); } return; } const pos = k % 3, saved = a[pos]; a[pos] = saved + 1; search(k + 1); a[pos] = saved + 2; search(k + 1); a[pos] = saved; }
  search(0);
  return caseResult(program(`    int a[] = {${literal(initial)}};\n    search(a, 0);\n    printf("%d %d %d", hits, score, a[0]);`, `int hits = 0, score = 0;\nvoid search(int *a, int k) {\n    if (k == ${depth}) {\n        if ((a[0] + a[1] + a[2]) % ${v % 3 + 2} == 0) {\n            hits++; score += a[0] * 100 + a[1] * 10 + a[2];\n        }\n        return;\n    }\n    int pos = k % 3, saved = a[pos];\n    a[pos] = saved + 1; search(a, k + 1);\n    a[pos] = saved + 2; search(a, k + 1);\n    a[pos] = saved;\n}`), `${hits} ${score} ${a[0]}`,
    '모든 호출이 같은 배열을 공유합니다. 각 호출의 saved는 독립적이며 두 분기를 탐색한 뒤 배열을 복원하므로 함수 종료 후 a는 원래 값입니다. 조건을 만족한 리프만 hits와 score에 누적됩니다.', [...trace, `복원 완료: [${a.join(', ')}], hits=${hits}`]);
});

addFamily('상', 'return-pointer-dispatch', '포인터 반환과 함수 테이블 순환', '반환 포인터·이중 포인터', (v) => {
  const input = arrayFor(v), a = [...input], n = 6, steps = v + 5, trace = []; let at = v % 3;
  for (let i = 0; i < steps; i++) { if (i % 2 === 0) { at = (at + 2) % n; a[at] += i + 1; } else { a[at] -= i + 1; at = (at + n - 1) % n; } trace.push(`i=${i}: p의 인덱스=${at}, 배열=[${a.join(', ')}]`); }
  const sum = a.reduce((s, x, i) => s + x * (i + 1), 0);
  return caseResult(program(`    int a[] = {${literal(input)}};\n    int *p = a + ${v % 3};\n    int *(*op[2])(int *, int *, int) = {advance, retreat};\n    for (int i = 0; i < ${steps}; i++) dispatch(&p, a, i, op);\n    int sum = 0;\n    for (int i = 0; i < 6; i++) sum += (i + 1) * a[i];\n    printf("%d %d %d", (int)(p - a), *p, sum);`, 'int *advance(int *p, int *base, int delta) {\n    int index = (int)(p - base);\n    p = base + (index + 2) % 6;\n    *p += delta; return p;\n}\nint *retreat(int *p, int *base, int delta) {\n    *p -= delta;\n    int index = (int)(p - base);\n    return base + (index + 5) % 6;\n}\nvoid dispatch(int **pp, int *base, int step, int *(*op[])(int *, int *, int)) {\n    *pp = op[step % 2](*pp, base, step + 1);\n}'), `${at} ${a[at]} ${sum}`,
    '함수 테이블은 int 포인터를 반환하는 함수 두 개를 보관합니다. advance는 먼저 이동한 후 수정하지만 retreat는 현재 값을 수정한 후 이동합니다. dispatch는 이중 포인터로 호출자의 p에 반환 주소를 저장합니다. 모든 주소는 동일한 배열 범위 안에서 계산합니다.', [...trace, `최종 가중합=${sum}`]);
});

export const cCodeQuestions = questions;
