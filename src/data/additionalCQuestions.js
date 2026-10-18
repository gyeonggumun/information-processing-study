import { addCodeFamily, codeAnswer, cProgram } from './additionalQuestionFactory.js';
const questions = [];
const add = (level, family, title, refs, build) => addCodeFamily(questions, 'C', level, family, title, refs, build);

add('하', 'character-cycle', '문자 종류별 순환 변환', ['past-2024-1-q19'], v => {
  const text = ['Az7_B2', 'Yb8_C3', 'Cx9_D4', 'Wd0_E5', 'Ev1_F6'][v], step = v + 2;
  const output = [...text].map(c => /[A-Z]/.test(c) ? String.fromCharCode((c.charCodeAt(0) - 65 + step) % 26 + 65) : /[a-z]/.test(c) ? String.fromCharCode((c.charCodeAt(0) - 97 + step) % 26 + 97) : /[0-9]/.test(c) ? String((Number(c) + step) % 10) : c).join('');
  return codeAnswer(cProgram(`    char s[] = "${text}";\n    for (int i = 0; s[i] != '\\0'; i++) {\n        unsigned char c = (unsigned char)s[i];\n        if (isupper(c)) s[i] = (char)((c - 'A' + ${step}) % 26 + 'A');\n        else if (islower(c)) s[i] = (char)((c - 'a' + ${step}) % 26 + 'a');\n        else if (isdigit(c)) s[i] = (char)((c - '0' + ${step}) % 10 + '0');\n    }\n    printf("%s", s);`), output,
    '문자를 대문자·소문자·숫자·기타로 분류한 뒤 해당 기준 문자를 빼 상대 위치를 구합니다. 영문은 26, 숫자는 10으로 나눈 나머지를 사용하므로 끝을 넘으면 처음으로 돌아갑니다. 밑줄은 어느 조건에도 해당하지 않아 유지됩니다.',
    [`입력 문자열은 ${text}, 이동량은 ${step}입니다.`, '영문은 대소문자를 유지하고 숫자만 0~9 범위에서 순환합니다.', `변환된 배열을 널 문자 전까지 출력하면 ${output}입니다.`], ['char s[]', 'if (isupper', 'printf(']);
});
add('하', 'string-alias-cut', '문자 배열의 공유와 중간 널 문자', ['past-2023-1-q2', 'past-2023-3-q10'], v => {
  const word = ['NETWORK', 'PROGRAM', 'POINTER', 'ROUTING', 'MEMORY'][v], offset = v % 3 + 1;
  return codeAnswer(cProgram(`    char s[] = "${word}";\n    char *p = s + ${offset};\n    p[2] = '\\0';\n    printf("%s %s %d", s, p, (int)(p - s));`), `${word.slice(0, offset + 2)} ${word.slice(offset, offset + 2)} ${offset}`,
    'p는 문자열을 복사한 새 배열이 아니라 s의 중간 주소입니다. p[2]는 s[offset+2]와 같은 저장 위치이므로 널 문자를 쓰면 원본 문자열의 출력 길이도 줄어듭니다. 포인터 차이는 같은 배열 안에서 떨어진 원소 수입니다.',
    [`p는 s의 인덱스 ${offset}부터 가리킵니다.`, `s[${offset + 2}]에 널 문자를 넣으므로 원본 출력은 ${word.slice(0, offset + 2)}입니다.`, `p 기준 출력은 ${word.slice(offset, offset + 2)}, 주소 차이는 ${offset}입니다.`], ['char *p =', 'p[2] =', 'printf(']);
});
add('중', 'struct-parameter', '구조체 값 인수와 포인터 인수', ['past-2025-2-q14', 'past-2026-2-q9'], v => {
  const a = v + 4, b = v + 9, delta = v + 2;
  return codeAnswer(cProgram(`    Pair p = {${a}, ${b}};\n    by_value(p, ${delta});\n    by_pointer(&p, ${delta});\n    printf("%d %d", p.x, p.y);`, 'typedef struct Pair { int x, y; } Pair;\nvoid by_value(Pair p, int n) {\n    p.x += n;\n    p.y = p.x;\n}\nvoid by_pointer(Pair *p, int n) {\n    p->x += n;\n    p->y += p->x;\n}'), `${a + delta} ${b + a + delta}`,
    '값으로 받은 구조체 p는 호출자 구조체의 복사본이므로 by_value의 변경은 원본에 남지 않습니다. 주소로 받은 포인터는 호출자 저장 위치를 수정합니다. by_pointer 안에서는 x를 먼저 갱신한 뒤 갱신된 x를 y에 더합니다.',
    [`값 전달 후 원본은 (${a}, ${b})로 유지됩니다.`, `포인터 호출에서 x=${a}+${delta}=${a + delta}입니다.`, `새 x를 y에 더하면 y=${b + a + delta}입니다.`], ['by_value(p', 'p->x +=', 'p->y +=']);
});
add('중', 'matrix-row-selection', '행 포인터 선택과 배열 값 갱신', ['past-2024-2-q13', 'past-2024-3-q16'], v => {
  const a = [[v + 2, v + 5, v + 8], [v + 3, v + 7, v + 11]], before = a.map(r => [...r]);
  a[1][v % 3] += a[0][(v + 1) % 3];
  return codeAnswer(cProgram(`    int a[2][3] = {{${before[0].join(', ')}}, {${before[1].join(', ')}}};\n    int (*p)[3] = a;\n    int *q = *(p + 1);\n    q[${v % 3}] += *(*(p + 0) + ${(v + 1) % 3});\n    printf("%d %d", a[1][${v % 3}], *(*(p + 1) + 2));`), `${a[1][v % 3]} ${a[1][2]}`,
    'p는 정수 한 개가 아니라 정수 세 개로 이루어진 행을 가리키는 포인터입니다. p+1은 둘째 행이고 q는 그 행의 첫 원소 주소입니다. q를 통한 쓰기는 a[1]의 실제 원소를 바꾸므로 뒤의 포인터 식에도 변경이 반영됩니다.',
    ['q는 a[1]의 첫 원소를 가리킵니다.', `인덱스 ${v % 3}의 값에 첫 행 인덱스 ${(v + 1) % 3}의 값을 더해 ${a[1][v % 3]}이 됩니다.`, `둘째 행 마지막 값은 ${a[1][2]}이므로 두 값을 순서대로 출력합니다.`], ['int *q =', `q[${v % 3}] +=`, 'printf(']);
});
add('중', 'recursion-negative-base', '간격이 다른 분기 재귀의 기저 조건', ['past-2026-2-q18'], v => {
  const n = v + 3; let calls = 0;
  const calc = x => { calls++; return x <= 0 ? 1 : x === 1 ? 2 : calc(x - 2) + calc(x - 3); };
  const answer = calc(n);
  return codeAnswer(cProgram(`    int value = calc(${n});\n    printf("%d %d", value, calls);`, 'int calls = 0;\nint calc(int n) {\n    calls++;\n    if (n <= 0) return 1;\n    if (n == 1) return 2;\n    int a = calc(n - 2);\n    int b = calc(n - 3);\n    return a + b;\n}'), `${answer} ${calls}`,
    '재귀 호출 인수가 0보다 작아져도 n<=0이라는 첫 기저 조건이 적용됩니다. 음수 인수를 임의로 오류나 0으로 처리하면 안 됩니다. calls는 기저 호출까지 포함하고 왼쪽 재귀가 끝난 다음 오른쪽 재귀를 실행합니다.',
    [`calc(${n})에서 2와 3을 각각 뺀 두 갈래를 추적합니다.`, 'n<=0은 1, n==1은 2를 반환하고 나머지는 두 반환값을 더합니다.', `전체 반환값은 ${answer}, 함수 진입 횟수는 ${calls}입니다.`], ['int value =', 'if (n <= 0)', 'printf(']);
});
add('상', 'list-relink-weight', '연결 리스트 재연결과 순서별 갱신', ['past-2025-2-q16', 'past-2025-1-q18'], v => {
  const data = [v + 3, v + 7, v + 11, v + 15], order = [0, 2, 1, 3], changed = order.map((i, j) => data[i] + j), sum = changed.reduce((s, x, j) => s + x * (j + 1), 0);
  return codeAnswer(cProgram(`    Node n[4];\n    int values[] = {${data.join(', ')}};\n    for (int i = 0; i < 4; i++) {\n        n[i].value = values[i];\n        n[i].next = i < 3 ? &n[i + 1] : NULL;\n    }\n    Node *head = &n[0];\n    Node *moved = head->next;\n    head->next = moved->next;\n    moved->next = head->next->next;\n    head->next->next = moved;\n    int sum = 0, index = 0;\n    for (Node *p = head; p != NULL; p = p->next) {\n        p->value += index;\n        sum += p->value * (index + 1);\n        index++;\n    }\n    printf("%d %d %d", head->next->value, n[1].value, sum);`, 'typedef struct Node {\n    int value;\n    struct Node *next;\n} Node;'), `${changed[1]} ${changed[2]} ${sum}`,
    '노드 배열의 물리 순서는 바뀌지 않고 next 연결만 바뀝니다. 두 번째 노드를 떼어 세 번째 노드 뒤로 연결하면 실제 방문 인덱스는 0→2→1→3입니다. 방문 순번을 노드 값에 더하므로 배열 인덱스와 방문 순번을 구분해 계산합니다.',
    ['재연결한 노드 순서는 0→2→1→3입니다.', `방문 순번으로 갱신한 값은 ${changed.join(' → ')}입니다.`, `head->next는 원래 n[2], n[1]은 셋째 방문 노드이며 가중합은 ${sum}입니다.`], ['head->next =', 'p->value +=', 'printf(']);
});
add('상', 'postorder-selection', '후위 순회의 순번과 누적값', ['past-2026-2-q7'], v => {
  const values = [v + 9, v + 4, v + 14, v + 2, v + 18], order = [3, 1, 4, 2, 0], target = v + 1;
  const sum = order.reduce((s, i, j) => s + values[i] * (j + 1), 0);
  return codeAnswer(cProgram(`    Node d = {${values[3]}, NULL, NULL};\n    Node e = {${values[4]}, NULL, NULL};\n    Node b = {${values[1]}, &d, NULL};\n    Node c = {${values[2]}, NULL, &e};\n    Node a = {${values[0]}, &b, &c};\n    visit(&a);\n    printf("%d %d %d", chosen, count, weighted);`, `typedef struct Node {\n    int value;\n    struct Node *left, *right;\n} Node;\nint count = 0, chosen = -1, weighted = 0;\nvoid visit(Node *p) {\n    if (p == NULL) return;\n    visit(p->left);\n    visit(p->right);\n    count++;\n    weighted += count * p->value;\n    if (count == ${target}) chosen = p->value;\n}`), `${values[order[target - 1]]} 5 ${sum}`,
    '함수는 왼쪽 자식, 오른쪽 자식, 자기 노드 순서로 처리하는 후위 순회입니다. count는 NULL 호출에서는 증가하지 않으며 실제 노드를 처리할 때만 증가합니다. 선택 순번과 가중합 모두 이 방문 순서를 기준으로 계산합니다.',
    [`방문 순서는 d→b→e→c→a이고 값은 ${order.map(i => values[i]).join(', ')}입니다.`, `${target}번째 값은 ${values[order[target - 1]]}입니다.`, `실제 노드 수는 5이고 순번×값의 합은 ${sum}입니다.`], ['visit(&a)', 'if (count ==', 'weighted +=']);
});
add('상', 'callback-unsigned-hex', '함수 포인터 선택과 부호 없는 16진수 출력', ['past-2026-1-q12'], v => {
  const start = 19 + v * 3, steps = v + 3; let value = start; const states = [];
  for (let i = 0; i < steps; i++) { value = i % 2 === 0 ? value + i + 2 : value ^ (i + 2); states.push(value); }
  return codeAnswer(cProgram(`    unsigned int value = ${start}u;\n    Operation operations[2] = {add, mix};\n    Box box = {&value, operations[0]};\n    for (unsigned int i = 0; i < ${steps}u; i++) {\n        box.apply = operations[i % 2u];\n        *box.value = box.apply(*box.value, i + 2u);\n    }\n    printf("%x %u", value, *box.value);`, 'typedef unsigned int (*Operation)(unsigned int, unsigned int);\ntypedef struct Box {\n    unsigned int *value;\n    Operation apply;\n} Box;\nunsigned int add(unsigned int x, unsigned int y) {\n    return x + y;\n}\nunsigned int mix(unsigned int x, unsigned int y) {\n    return x ^ y;\n}'), `${value.toString(16)} ${value}`,
    '함수 포인터 배열은 덧셈과 비트 XOR 함수를 번갈아 선택합니다. Box.value는 원본 value의 주소이므로 역참조 대입마다 같은 저장 위치가 바뀝니다. 마지막 두 출력은 같은 값이지만 %x는 소문자 16진수, %u는 10진수입니다.',
    [`초기 unsigned int 값은 ${start}입니다.`, `각 반복 후 값은 ${states.join(' → ')}입니다.`, `최종 값 ${value}를 16진수로 쓰면 ${value.toString(16)}이며 이어 같은 값의 10진수를 출력합니다.`], ['Box box =', '*box.value =', 'printf(']);
});
export const additionalCQuestions = questions;
