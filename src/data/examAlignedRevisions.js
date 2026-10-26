// 11개 복원 회차에서 확인한 출제 개념으로 만든 창작 변형입니다. 원문 문제는 변경하지 않습니다.
const codeResult = (family, title, code, answerText, explanation, trace, anchors, examReferences) =>
  ({ family, title, tag: title, code, answerText: String(answerText), explanation, trace, anchors, examReferences });
const cProgram = (helpers, body) => `#include <stdio.h>\n#include <string.h>\n\n${helpers}\n\nint main(void) {\n${body}\n    return 0;\n}`;
const javaProgram = (members, body) => `import java.util.*;\n\nclass Main {\n${members}\n    public static void main(String[] args) {\n${body}\n    }\n}`;

const cRevisions = {
  'recursive-callback': (v) => {
    let calls = 0;
    const solve = (n) => { calls++; if (n <= 1) return n + 1; const left = solve(n - 1), right = solve(n - 2); return left - right + n; };
    const depth = v + 4, a = solve(depth), firstCalls = calls, b = solve(2);
    return codeResult('recursive-call-count', '분기 재귀의 반환값과 호출 횟수',
      cProgram(`int calls = 0;\nint solve(int n) {\n    calls++;\n    if (n <= 1) {\n        return n + 1;\n    }\n    int left = solve(n - 1);\n    int right = solve(n - 2);\n    return left - right + n;\n}`, `    int first = solve(${depth});\n    int saved = calls;\n    int second = solve(2);\n    printf("%d %d %d %d", first, saved, second, calls);`),
      `${a} ${firstCalls} ${b} ${calls}`,
      '전역 calls는 기저 호출을 포함한 모든 함수 진입에서 증가합니다. 각 호출의 left와 right는 별도 지역 변수이며 왼쪽 재귀가 끝난 뒤 오른쪽을 계산합니다. 두 번째 호출은 전역 카운터를 초기화하지 않습니다.',
      [`solve(${depth})의 반환값은 ${a}입니다.`, `첫 호출 트리에서 함수에 ${firstCalls}번 진입해 saved에 보관합니다.`, `solve(2)는 ${b}를 반환하고 3번 더 진입하므로 calls=${calls}입니다.`],
      ['int first =', 'int saved =', 'int second ='], ['past-2025-1-q16', 'past-2024-3-q7']);
  },
  'ring-command-callback': (v) => {
    const queue = Array.from({ length: 5 }, () => 0); let front = 0, rear = 0;
    const put = (n) => { const next = (rear + 1) % 5; if (next !== front) { queue[rear] = n; rear = next; } };
    const get = () => { if (front === rear) return -1; const n = queue[front]; front = (front + 1) % 5; return n; };
    put(8 + v); put(13 + v); put(21 + v); const first = get();
    put(34 + v); put(55 + v); put(89 + v); const second = get(); put(6 + v);
    const last = queue[(rear + 4) % 5];
    return codeResult('ring-buffer-boundary', '원형 큐의 순환과 가득 찬 경우',
      cProgram('int q[5], front = 0, rear = 0;\nvoid put(int n) {\n    int next = (rear + 1) % 5;\n    if (next == front) return;\n    q[rear] = n;\n    rear = next;\n}\nint get(void) {\n    if (front == rear) return -1;\n    int value = q[front];\n    front = (front + 1) % 5;\n    return value;\n}', `    put(${8 + v});\n    put(${13 + v});\n    put(${21 + v});\n    int a = get();\n    put(${34 + v});\n    put(${55 + v});\n    put(${89 + v});\n    int b = get();\n    put(${6 + v});\n    printf("%d %d %d %d %d", a, b, front, rear, q[(rear + 4) % 5]);`),
      `${first} ${second} ${front} ${rear} ${last}`,
      '배열 다섯 칸 중 한 칸을 비워 빈 큐와 가득 찬 큐를 구분하므로 실제 용량은 네 개입니다. rear는 다음 삽입 위치, front는 다음 삭제 위치이며 인덱스 4 다음은 0입니다. 꽉 찬 상태의 put은 값을 덮어쓰지 않고 무시됩니다.',
      [`첫 get은 ${first}를 꺼내고 front=1이 됩니다.`, `${89 + v} 삽입 시 큐가 가득 차 있어 해당 값은 저장되지 않습니다.`, `둘째 get은 ${second}입니다. 마지막 삽입 후 front=${front}, rear=${rear}, 마지막 값=${last}입니다.`],
      ['int a = get()', `put(${89 + v})`, 'printf('], ['past-2025-2-q12']);
  },
  'backtrack-restore': (v) => {
    const text = ['BUFFER', 'ROUTER', 'MEMORY', 'SCHEMA', 'MODULE'][v], at = v % 3 + 1, letter = String.fromCharCode(75 + v);
    const changed = text.slice(0, at) + letter + text.slice(at), selected = [...changed].filter((_, i) => i % 2 === 0).join('');
    return codeResult('string-insert-index', '문자 배열의 삽입과 간격 출력',
      cProgram('void insert(char *s, int at, char value) {\n    int length = (int)strlen(s);\n    for (int i = length; i >= at; i--) {\n        s[i + 1] = s[i];\n    }\n    s[at] = value;\n}', `    char text[16] = "${text}";\n    char *p = text;\n    insert(p, ${at}, '${letter}');\n    for (int i = 0; p[i] != '\\0'; i += 2) {\n        printf("%c", p[i]);\n        if (p[i + 1] == '\\0') break;\n    }\n    printf(" %s", text);`),
      `${selected} ${changed}`,
      '삽입 위치부터 오른쪽으로 옮길 때는 뒤에서 앞으로 복사해야 아직 읽지 않은 문자를 덮어쓰지 않습니다. 길이 위치의 널 문자도 한 칸 이동합니다. p와 text는 같은 배열을 가리키므로 삽입 후의 인덱스를 기준으로 출력합니다.',
      [`인덱스 ${at}부터 널 문자까지 오른쪽으로 이동합니다.`, `'${letter}' 삽입 후 배열의 문자열은 ${changed}입니다.`, `0·2·4·6번 문자를 차례로 출력하면 ${selected}이고, 이어 전체 문자열을 출력합니다.`],
      ['s[i + 1] =', 's[at] =', 'for (int i = 0;'], ['past-2025-1-q10', 'past-2024-1-q4']);
  },
  'return-pointer-dispatch': (v) => {
    const base = 20 + v + 3 + v, a = (3 + v) * 2 + 4 + v, b = 3 + v + 5 + 4 + v;
    return codeResult('struct-copy-pointer-member', '구조체 값 복사와 포인터 멤버 공유',
      cProgram('typedef struct Box {\n    int value;\n    int *shared;\n} Box;\nvoid change(Box *p, int delta) {\n    p->value += delta;\n    *p->shared += delta;\n}', `    int base = ${20 + v};\n    Box a = {${3 + v}, &base};\n    Box b = a;\n    b.value += 5;\n    *b.shared += a.value;\n    a.value *= 2;\n    Box *p = &b;\n    p->shared = &a.value;\n    change(p, ${4 + v});\n    printf("%d %d %d %d", base, a.value, b.value, *b.shared);`),
      `${base} ${a} ${b} ${a}`,
      '구조체 대입은 일반 정수 멤버의 값을 복사하지만 포인터 멤버가 가리키는 대상까지 복제하지 않습니다. 처음에는 a.shared와 b.shared가 base를 공유합니다. b.shared를 a.value의 주소로 바꾼 뒤에는 change가 base가 아니라 a.value를 간접 수정합니다.',
      [`b.value만 5 증가하며 base는 *b.shared를 통해 ${base}가 됩니다.`, `a.value를 두 배로 만든 다음 b.shared를 &a.value로 바꿉니다.`, `change는 b.value와 a.value에 ${4 + v}씩 더하므로 출력은 ${base} ${a} ${b} ${a}입니다.`],
      ['*b.shared +=', 'p->shared =', 'change(p,'], ['past-2025-2-q14', 'past-2024-3-q16']);
  },
};

const javaRevisions = {
  'array-covariance': (v) => {
    const parent = 4 + v, child = 12 + v, pKind = 30 + v, cKind = 70 + v;
    return codeResult('static-hiding-instance-override', '정적 메서드 숨김과 인스턴스 재정의',
      javaProgram(`    static class Parent {\n        int value = ${parent};\n        static int kind() { return ${pKind}; }\n        int read() { return value; }\n    }\n    static class Child extends Parent {\n        int value = ${child};\n        static int kind() { return ${cKind}; }\n        int read() { return super.value + value; }\n    }`, '        Parent p = new Child();\n        Child c = (Child)p;\n        System.out.print(p.kind() + " " + c.kind() + " " + p.read() + " " + p.value);'),
      `${pKind} ${cKind} ${parent + child} ${parent}`,
      'static 메서드는 객체의 실제 종류가 아니라 호출식의 선언 타입에 따라 선택됩니다. 인스턴스 read는 실제 객체 Child의 재정의가 실행됩니다. 필드 value는 메서드와 달리 선언 타입을 기준으로 읽고 super.value는 부모 필드를 지정합니다.',
      [`p.kind()와 c.kind()는 각각 ${pKind}, ${cKind}입니다.`, `p.read()는 Child.read를 실행하여 부모·자식 필드의 합 ${parent + child}를 반환합니다.`, `p.value는 Parent 필드이므로 ${parent}입니다.`],
      ['System.out.print', 'int read() { return super', 'Parent p ='], ['past-2025-2-q10', 'past-2024-3-q11']);
  },
  'comparator-order': (v) => {
    const text = ['ARRAY', 'CLASS', 'VALUE', 'STACK', 'FIELD'][v];
    return codeResult('generic-overload-selection', '제네릭 타입 변수와 오버로딩 선택',
      javaProgram('    static String choose(Object value) { return "O"; }\n    static String choose(String value) { return "S"; }\n    static class Box<T> {\n        T value;\n        Box(T value) { this.value = value; }\n        String emit() { return choose(value); }\n    }', `        Box<String> box = new Box<>("${text}");\n        Object alias = box.value;\n        System.out.print(box.emit() + choose(box.value) + choose(alias) + " " + box.value.length());`),
      `OSO ${text.length}`,
      '오버로딩은 호출 위치에서 알 수 있는 선언 타입으로 결정합니다. Box의 emit 안에서 T의 상한은 Object이므로 choose(Object)를 선택합니다. main의 box.value는 String이고 alias는 Object이므로 동일한 문자열 객체여도 서로 다른 오버로드가 선택됩니다.',
      ['emit 내부의 T는 Object로 취급되어 O를 반환합니다.', 'main에서 String 타입 값은 S, Object 타입 별칭은 O를 반환합니다.', `실제 문자열 ${text}의 길이는 ${text.length}입니다.`],
      ['String emit()', 'Object alias =', 'System.out.print'], ['past-2024-3-q19', 'past-2026-1-q7']);
  },
  'graph-recursion': (v) => {
    const base = 3 + v, n = 5 + v % 2;
    const child = (x) => x <= 1 ? base : parent(x - 1) + child(x - 2);
    const parent = (x) => x <= 0 ? 1 : child(x - 1) + x;
    const answer = child(n);
    return codeResult('override-recursive-calls', '재정의된 메서드의 재귀와 super 호출',
      javaProgram(`    static class Parent {\n        int base = 2;\n        int calc(int n) {\n            if (n <= 0) return 1;\n            return calc(n - 1) + n;\n        }\n    }\n    static class Child extends Parent {\n        int base = ${base};\n        int calc(int n) {\n            if (n <= 1) return base;\n            return super.calc(n - 1) + calc(n - 2);\n        }\n    }`, `        Parent p = new Child();\n        System.out.print(p.calc(${n}) + " " + p.base + " " + ((Child)p).base);`),
      `${answer} 2 ${base}`,
      'super.calc는 부모 메서드 본문을 실행하지만 그 본문 안의 calc(n-1)는 여전히 실제 객체 Child에 동적 바인딩됩니다. 부모 함수를 호출했다고 이후의 모든 재귀가 부모 구현으로 고정되는 것은 아닙니다. 숨겨진 필드는 선언 타입에 따라 따로 읽습니다.',
      [`p.calc(${n})는 Child.calc에서 시작하며 n이 1 이하일 때 ${base}를 반환합니다.`, `부모 본문의 재귀도 Child.calc로 돌아가므로 최종 반환값은 ${answer}입니다.`, `p.base는 부모의 2, 형변환 후 base는 자식의 ${base}입니다.`],
      ['Parent p =', 'return calc(n - 1)', 'System.out.print'], ['past-2023-3-q11', 'past-2025-1-q20']);
  },
};

const pythonRevisions = {
  'late-binding': (v) => {
    const a = [2 + v, 5, 8 + v, 11, 14 + v, 17], b = [...a].reverse();
    b[1] += v + 1;
    const picked = b.filter((_, i) => i % 2 === 0);
    return codeResult('reverse-alias-slice', '리스트 반전·별칭·슬라이스',
      `a = [${a.join(', ')}]\nb = a[::-1]\nc = b\nc[1] += ${v + 1}\nprint(a[1], b[1], *b[::2])`,
      [a[1], b[1], ...picked].join(' '),
      '역방향 슬라이스는 새로운 바깥 리스트를 만듭니다. 따라서 b 수정은 a를 바꾸지 않지만 c=b는 같은 리스트를 가리키므로 c의 수정은 b에도 반영됩니다. 마지막 슬라이스는 변경된 b의 짝수 인덱스 원소만 선택합니다.',
      [`b는 반전한 새 리스트이고 원본 a[1]은 ${a[1]}입니다.`, `c와 b는 같은 객체이므로 b[1]=${b[1]}입니다.`, `b[::2]는 ${picked.join(', ')}입니다.`],
      ['b = a[::-1]', 'c[1] +=', 'print('], ['past-2024-3-q2', 'past-2026-1-q14']);
  },
  'generator-send': (v) => {
    const n = v + 4, a = [[n, 2], [3, n + 1]], b = [...a];
    b[0] = [b[0][1], b[0][0]]; b[1][0] += n;
    return codeResult('nested-list-rebind-mutate', '중첩 리스트의 재대입과 내부 변경',
      `a = [[${n}, 2], [3, ${n + 1}]]\nb = a[:]\nb[0] = b[0][::-1]\nb[1][0] += ${n}\nc = [row[:] for row in b]\nc[1][1] += 5\nprint(a[0][0], a[1][0], b[0][0], b[1][1], c[1][1])`,
      `${n} ${3 + n} 2 ${n + 1} ${n + 6}`,
      'a[:]는 바깥 리스트만 복사하므로 처음에는 안쪽 행을 공유합니다. b[0]에 새 슬라이스를 대입하면 첫 행의 공유만 끊어지고, b[1][0] 수정은 공유 중인 둘째 행에 반영됩니다. 각 행도 복사한 c의 정수 원소 변경은 원본 행을 바꾸지 않습니다.',
      ['b[0] 재대입은 a의 첫 행을 변경하지 않습니다.', `공유 중인 둘째 행의 첫 값은 ${3 + n}이 됩니다.`, `c의 둘째 행 끝만 ${n + 6}으로 바뀌며 b에는 ${n + 1}이 남습니다.`],
      ['b[0] =', 'b[1][0] +=', 'c[1][1] +='], ['past-2026-1-q14']);
  },
  'multiple-inheritance-mro': (v) => {
    const n = v + 2;
    return codeResult('class-instance-shared-list', '클래스 속성과 인스턴스 속성의 공유 범위',
      `class Counter:\n    total = 0\n    history = []\n\n    def __init__(self, n):\n        self.value = n\n        Counter.total += n\n        self.history.append(n)\n\na = Counter(${n})\nb = Counter(${n + 3})\na.total = 100\nb.history = b.history[:]\nb.history.append(${n + 7})\na.history.append(${n + 5})\nprint(a.total, b.total, len(a.history), sum(b.history), Counter.total)`,
      `100 ${2 * n + 3} 3 ${3 * n + 10} ${2 * n + 3}`,
      '클래스 속성 total과 history는 인스턴스에 같은 이름의 속성을 만들기 전까지 공유합니다. a.total 대입은 a 전용 속성을 만들며 Counter.total을 바꾸지 않습니다. b.history에 복사본을 대입한 뒤에는 b의 리스트만 분리되므로 이후 a의 append와 섞이지 않습니다.',
      [`두 생성자가 누적한 Counter.total은 ${2 * n + 3}입니다.`, 'a.total=100은 a만 가리고 b.total은 클래스 속성을 읽습니다.', `b의 복사본 합은 ${3 * n + 10}, 공유 리스트를 쓰는 a의 길이는 3입니다.`],
      ['b = Counter', 'a.total =', 'b.history ='], ['past-2026-2-q5', 'past-2025-1-q17']);
  },
  'property-side-effects': (v) => {
    const a = [v + 1, v + 3, v + 5, v + 7], b = [v + 3, v + 7, v + 9];
    const answer = [...new Set([...a.filter(x => !b.includes(x)), v + 11])].sort((x, y) => x - y);
    return codeResult('set-algebra-mutation', '집합 연산과 별칭을 통한 원소 변경',
      `a = {${a.join(', ')}}\nb = {${b.join(', ')}}\nshared = a\nc = a & b\nshared.difference_update(c)\nc.add(${v + 11})\na.update(c - b)\nprint(*sorted(a))\nprint(len(c), len(shared), len(b))`,
      `${answer.join(' ')}\n3 3 3`,
      '교집합 c는 새 집합이고 shared는 a의 별칭입니다. difference_update는 a 자체에서 교집합 원소를 제거합니다. 이후 c에 추가한 원소 중 b에 없는 값만 a에 다시 합칩니다. 집합의 임의 순서가 아니라 sorted 결과를 출력하므로 정답 순서는 결정적입니다.',
      [`공통 원소 ${v + 3}, ${v + 7}을 a에서 제거합니다.`, `c에 ${v + 11}을 추가한 뒤 c-b에는 이 값만 남습니다.`, `a의 정렬 결과는 ${answer.join(' ')}이며 각 길이는 3입니다.`],
      ['shared.difference_update', 'c.add(', 'a.update('], ['past-2023-1-q15', 'past-2025-2-q17']);
  },
  'stable-sort-key': (v) => {
    const a = [11 + v, 3 + v, 17 + v, 5 + v, 23 + v, 7 + v];
    const b = [...a];
    for (let i = 0; i < b.length - 1; i += 2) [b[i], b[i + 1]] = [b[i + 1], b[i]];
    const selected = b.slice(1).filter((_, i) => i % 2 === 0);
    return codeResult('adjacent-swap-slicing', '인접 원소 교환과 변경 후 슬라이싱',
      `def exchange(items):\n    for i in range(0, len(items) - 1, 2):\n        items[i], items[i + 1] = items[i + 1], items[i]\n    return items[1::2]\n\na = [${a.join(', ')}]\nb = a[:]\nc = exchange(b)\nb[1] += ${v + 2}\nprint(a[0], b[1], sum(c), *b[::-2])`,
      [a[0], b[1] + v + 2, selected.reduce((s, x) => s + x, 0), ...b.slice().reverse().filter((_, i) => i % 2 === 0).map((x, i) => i === 2 ? x + v + 2 : x)].join(' '),
      '함수는 전달받은 b의 인접한 두 값을 직접 교환합니다. 반환하는 슬라이스 c는 새 리스트이므로 함수가 끝난 후 b[1]을 바꾸어도 이미 만든 c의 정수 원소는 바뀌지 않습니다. 역방향 간격 슬라이스는 마지막 인덱스부터 두 칸씩 선택합니다.',
      [`교환 직후 b는 ${b.join(', ')}입니다.`, `c의 합은 ${selected.reduce((s, x) => s + x, 0)}이며 이후 b[1] 변경과 독립적입니다.`, `b[1]에 ${v + 2}를 더한 상태에서 마지막·3번·1번 인덱스를 출력합니다.`],
      ['items[i], items[i + 1]', 'return items[1::2]', 'b[1] +='], ['past-2024-3-q12', 'past-2026-1-q13']);
  },
  'closure-alias': (v) => {
    const keys = ['AX', 'BY', 'CZ'], words = ['ALPHA', 'BRAVO', 'CHARLIE'];
    const stop = v % 3 + 1, changed = words.map((s, i) => s.slice(i + 1));
    const answer = keys.map((k, i) => k.at(-1) + changed[i].slice(0, stop)).join('');
    return codeResult('dictionary-string-slices', '딕셔너리 갱신과 문자열 인덱스 누적',
      `class Labels:\n    data = {"AX": "ALPHA", "BY": "BRAVO", "CZ": "CHARLIE"}\n\nitem = Labels()\ncopy = item.data.copy()\nfor i, key in enumerate(copy):\n    copy[key] = copy[key][i + 1:]\ntext = ""\nfor key, value in copy.items():\n    text += key[-1] + value[:${stop}]\nprint(text, item.data["AX"][-${v + 1}])`,
      `${answer} ${words[0].at(-(v + 1))}`,
      'dict.copy는 새 딕셔너리를 만듭니다. 문자열은 불변이므로 복사본의 값 재대입이 원본 클래스 속성의 문자열을 바꾸지 않습니다. 삽입 순서대로 키의 마지막 문자와 변경한 값의 앞부분을 누적하고, 마지막에는 변경되지 않은 원본 문자열의 음수 인덱스를 읽습니다.',
      [`복사본 문자열은 ${changed.join(', ')}입니다.`, `키 끝 문자와 앞 ${stop}글자를 이어 ${answer}를 만듭니다.`, `원본 ALPHA의 음수 인덱스 -${v + 1}은 ${words[0].at(-(v + 1))}입니다.`],
      ['copy[key] =', 'text +=', 'print('], ['past-2026-2-q5', 'past-2025-3-q6']);
  },
  'graph-dfs': (v) => {
    const a = [2 + v, 5 + v, 8 + v, 11 + v];
    const returned = a[3] + a[1] + v + 3;
    return codeResult('function-alias-rebinding', '함수 인수의 변경과 지역 참조 재대입',
      `def alter(items, amount):\n    items[1] += amount\n    items = items[::-1]\n    items[0] += 10\n    return items[::2]\n\na = [${a.join(', ')}]\nb = a\nc = a[:]\nr = alter(b, ${v + 3})\nr.append(c.pop())\nprint(*a)\nprint(sum(r), len(c), a is b)`,
      `${a[0]} ${a[1] + v + 3} ${a[2]} ${a[3]}\n${returned + 10 + a[3]} 3 True`,
      'items는 호출자가 넘긴 리스트를 처음에는 공유하므로 첫 변경이 a와 b에 반영됩니다. 역순 슬라이스를 지역 변수 items에 재대입한 뒤의 변경은 새 리스트에만 적용됩니다. 반환 슬라이스와 c 역시 별도 리스트이므로 pop·append가 원본 길이를 바꾸지 않습니다.',
      [`a와 b의 인덱스 1이 ${a[1] + v + 3}으로 바뀝니다.`, '지역 items의 역순 복사본만 수정하므로 원본 마지막 값은 유지됩니다.', `반환 리스트의 합은 ${returned + 10 + a[3]}, c의 길이는 3이며 a is b는 True입니다.`],
      ['items[1] +=', 'items = items[::-1]', 'r.append('], ['past-2026-1-q14', 'past-2024-3-q12']);
  },
};

const sqlRevisions = {
  'cte-aggregate': (v) => {
    const rows = [[1, 'A', 12 + v], [2, 'A', 17 + v], [3, 'B', 8 + v], [4, 'B', 11 + v], [5, 'C', 21 + v]], limit = 23 + v;
    const totals = ['A', 'B', 'C'].map(g => rows.filter(r => r[1] === g).reduce((s, r) => s + r[2], 0));
    return { family: 'derived-group-count', title: '그룹 합계와 중첩 SELECT 결과', tables: [{ name: 'SALES', columns: ['id', 'team', 'amount'], rows }],
      code: `SELECT COUNT(*) AS result\nFROM (\n  SELECT team, SUM(amount) AS total\n  FROM SALES\n  GROUP BY team\n  HAVING SUM(amount) > ${limit}\n) AS selected;`, answerText: String(totals.filter(n => n > limit).length), answerMode: 'result', prompt: '표와 SQL문을 참고하여 result 값을 작성하세요.',
      explanation: '안쪽 SELECT는 팀별 합계를 계산하고 HAVING으로 그룹을 걸러냅니다. 바깥 COUNT(*)는 원본 판매 행이 아니라 조건을 통과한 팀 그룹의 행 수를 셉니다. WITH 구문을 외우는 대신 집계 전후의 행 단위를 구분하는 유형입니다.',
      steps: [`팀 A·B·C의 합계는 각각 ${totals.join(', ')}입니다.`, `합계가 ${limit}보다 큰 팀만 남긴 뒤 그 그룹 수를 셉니다.`], examReferences: ['past-2023-1-q16', 'past-2024-3-q3'] };
  },
  'conditional-having': (v) => {
    const rows = [[1, 1, 13 + v], [2, 1, 23 + v], [3, 2, 9 + v], [4, 2, 15 + v], [5, 3, 31 + v]], avg = rows.reduce((s, r) => s + r[2], 0) / rows.length;
    const ids = [1, 2, 3].filter(id => rows.filter(r => r[1] === id).reduce((s, r) => s + r[2], 0) > avg);
    return { family: 'group-having-subquery-average', title: 'HAVING과 전체 평균 서브쿼리', tables: [{ name: 'PAYMENT', columns: ['id', 'member_id', 'amount'], rows }],
      code: 'SELECT member_id\nFROM PAYMENT\nGROUP BY member_id\nHAVING SUM(amount) > (SELECT AVG(amount) FROM PAYMENT)\nORDER BY member_id DESC;', answerText: ids.reverse().join('\n'), answerMode: 'result', prompt: '조회되는 member_id를 위에서 아래 순서로 작성하세요.',
      explanation: '서브쿼리의 AVG는 전체 결제 한 건의 평균입니다. HAVING은 회원별 합계를 그 평균과 비교합니다. 두 값의 단위가 다르므로 회원별 평균이나 회원 합계들의 평균으로 잘못 계산하지 않아야 하며 마지막 정렬도 반영합니다.',
      steps: [`전체 ${rows.length}건 평균은 ${avg}입니다.`, '회원별 amount 합계를 전체 평균과 비교합니다.', `통과한 member_id를 내림차순으로 쓰면 ${ids.join(', ')}입니다.`], examReferences: ['past-2026-1-q18', 'past-2026-2-q13'] };
  },
};

const theorySpecs = [
  ['design-055', 'UML', '모델 요소를 묶는 구조', '관련 클래스들을 이름 공간 단위로 묶고 그룹 간 의존 관계를 나타내는 UML 구조 다이어그램은 무엇입니까?', ['패키지 다이어그램', 'Package Diagram', '패키지'], '패키지 다이어그램은 모델 요소를 묶은 단위와 그룹 간 의존을 나타냅니다. 객체 메시지의 시간 순서는 시퀀스, 실행 노드 배치는 배포 다이어그램입니다.', 'past-2025-3-q1'],
  ['design-056', 'UML', '선택 동작의 유스케이스 관계', '주문 유스케이스는 단독으로 완료됩니다. 쿠폰이 있을 때만 할인 동작이 선택적으로 추가된다면 연결 관계는 무엇입니까?', ['extend', '확장', '확장 관계'], 'extend는 조건이 만족될 때 선택 동작을 추가하는 관계입니다. 항상 실행하는 공통 기능을 별도로 재사용하는 include와 구분해야 합니다.', 'past-2024-3-q14'],
  ['design-057', '응집도', '처리 결과를 이어받는 모듈', '모듈의 첫 연산이 만든 결과를 같은 모듈의 다음 연산이 입력으로 사용합니다. 이 응집도의 이름을 쓰세요.', ['순차적 응집도', '순차 응집도', 'Sequential Cohesion'], '앞 처리의 출력이 뒤 처리의 입력으로 연결되면 순차적 응집도입니다. 동일 데이터를 함께 처리하는 교환적 응집도나 실행 순서만 있는 절차적 응집도와 다릅니다.', 'past-2024-2-q9'],
  ['design-058', '응집도', '하나의 목적에 집중한 모듈', '환율 변환 모듈의 모든 요소가 통화 금액 변환이라는 하나의 명확한 작업만 수행합니다. 가장 높은 응집도 유형을 쓰세요.', ['기능적 응집도', '기능 응집도', 'Functional Cohesion'], '모든 요소가 단일 기능 완수에 직접 기여하면 기능적 응집도입니다. 응집도가 높을수록 보통 모듈의 역할이 명확하며 우연적·논리적 묶음과 구분합니다.', 'past-2026-1-q20'],
  ['design-059', '디자인 패턴', '컬렉션 내부를 감춘 순회', '저장 방식이 배열인지 연결 리스트인지 노출하지 않고 hasNext·next와 같은 공통 인터페이스로 요소에 접근하는 패턴을 쓰세요.', ['Iterator', '이터레이터', '반복자'], 'Iterator는 집합의 내부 표현과 순회 방법을 분리합니다. 객체 간 상태 변경을 통지하는 Observer나 객체 방문 연산을 분리하는 Visitor와 다릅니다.', 'past-2024-2-q10'],
  ['design-060', '디자인 패턴', '자료구조와 수행 연산의 분리', '문서 노드 구조를 바꾸지 않고 노드 종류별 통계·출력 연산을 새 방문 객체에 추가하려 합니다. 알맞은 패턴을 쓰세요.', ['Visitor', '비지터', '방문자'], 'Visitor는 안정된 객체 구조에서 수행할 연산을 방문 객체로 분리합니다. 단순히 요소를 순서대로 꺼내는 Iterator와 목적이 다르며 노드 종류 추가에는 변경 부담이 생깁니다.', 'past-2023-2-q11'],
  ['database-037', '정규화', '복합키 일부에 대한 종속 제거', '릴레이션 R(주문, 품목, 품목명)의 모든 값은 원자값이고 후보키는 (주문, 품목) 하나이며 품목→품목명이 성립합니다. 부분 함수 종속을 제거하는 정규화 단계의 명칭을 쓰세요.', ['제2정규형', '2NF', '2정규형'], '비주요 속성 품목명이 복합 후보키의 일부인 품목에만 의존합니다. 품목 정보를 별도 릴레이션으로 분해해 부분 함수 종속을 제거하는 단계가 2NF입니다.', 'past-2024-1-q6'],
  ['database-038', '관계대수', '모든 요구 항목을 만족하는 행', '수강={(가,DB),(가,OS),(나,DB),(다,DB),(다,OS)}이고 필수={(DB),(OS)}입니다. 수강÷필수 결과의 학생 이름을 순서 없이 쓰세요.', ['가, 다', '가 다', '다, 가', '다 가'], '디비전은 나누는 릴레이션의 모든 값과 짝을 이루는 대상을 남깁니다. 가와 다는 DB·OS를 모두 수강하지만 나는 OS가 없으므로 제외됩니다.', 'past-2025-3-q14'],
  ['database-039', '정규화', '후보키와 결정자 구별', 'R(A,B,C)의 후보키는 AB와 AC이고 함수 종속은 AB→C, C→B입니다. 속성은 원자값이며 다른 비자명 종속은 이들로부터 유도됩니다. 만족하는 가장 높은 정규형을 쓰세요.', ['제3정규형', '3NF', '3정규형'], 'C→B의 결정자 C는 슈퍼키가 아니므로 BCNF는 아닙니다. 그러나 B는 후보키 AB의 구성원인 주요 속성이어서 해당 종속은 3NF 조건을 만족합니다.', 'past-2026-2-q20'],
  ['database-040', '정규화', '모든 결정자의 조건', '모든 비자명 함수 종속 X→Y에서 X가 슈퍼키인 정규형은 무엇입니까? 주요 속성에 대한 예외를 허용하는 3NF보다 엄격합니다.', ['BCNF', '보이스 코드 정규형', '보이스코드정규형'], 'BCNF는 모든 비자명 함수 종속의 결정자가 슈퍼키여야 합니다. 후보키는 최소 슈퍼키이므로 “모든 결정자가 후보키”라는 암기 문구보다 이 정의가 정확합니다.', 'past-2024-1-q6'],
  ['database-069', '관계대수', '공통 열의 중복을 제거하는 조인', 'R(학생,학과)와 S(학과,학과명)를 같은 이름의 학과 열 값으로 연결하고 결과에는 학과 열을 하나만 남겼습니다. 이 조인을 쓰세요.', ['자연 조인', 'Natural Join', '자연조인'], '자연 조인은 같은 이름의 모든 공통 속성을 동등 비교하고 중복 공통 열을 하나로 만듭니다. 동등 조인은 동등 조건으로 연결하지만 양쪽의 조인 열을 반드시 하나로 줄이지는 않습니다.', 'past-2024-1-q8'],
  ['database-070', '키와 무결성', '참조 대상 삭제의 연쇄 동작', '부모 부서 행을 삭제할 때 그 부서를 참조하는 직원 행도 함께 자동 삭제하도록 외래키의 ON DELETE 뒤에 지정하는 옵션을 쓰세요.', ['CASCADE', '캐스케이드'], 'ON DELETE CASCADE는 참조 대상 삭제를 참조 행 삭제로 전파합니다. SET NULL은 외래키를 NULL로 바꾸고 RESTRICT는 참조 행이 남아 있을 때 삭제를 막으므로 결과가 다릅니다.', 'past-2023-2-q17'],
  ['systems-067', '페이지 교체', '최근 사용 기준 페이지 부재 횟수', '빈 프레임 3개에 참조열 1,2,3,1,4,2,5를 LRU로 처리합니다. 최초 적재를 포함한 페이지 부재 횟수를 쓰세요.', ['6', '6회'], '1·2·3에서 세 번 부재가 나고 다음 1은 적중합니다. 4는 가장 오래 쓰지 않은 2를, 2는 3을, 5는 1을 교체하므로 부재는 총 6회입니다.', 'past-2024-3-q4'],
  ['systems-068', '페이지 교체', '빈도 기준 페이지 부재 횟수', '빈 프레임 3개에 참조열 1,2,1,3,4,2를 LFU로 처리합니다. 빈도가 같으면 마지막 사용이 가장 오래된 페이지를 교체하고, 새로 적재한 페이지의 빈도는 1입니다. 부재 횟수를 쓰세요.', ['5', '5회'], '1과 2를 적재하고 1이 재참조되어 빈도 2가 됩니다. 3 적재 후 4가 올 때 빈도 1 중 오래된 2를, 마지막 2가 올 때 오래된 3을 교체하므로 총 5회 부재입니다.', 'past-2024-1-q9'],
  ['systems-069', '라우팅', '링크 비용과 홉 수의 차이', 'RIP에서 A-B-D는 별도 비용 합이 20이고 2홉, A-C-E-D는 비용 합이 3이고 3홉입니다. 모든 링크의 RIP 메트릭 증가량은 기본값 1이며 별도 비용 표는 RIP에 반영하지 않습니다. 다른 조건은 같을 때 선택되는 경로를 쓰세요.', ['A-B-D', 'A B D', 'ABD', 'A→B→D'], '문제의 기본 홉 수 설정에서는 별도 비용 합이 아니라 RIP 메트릭 합으로 경로를 선택하므로 2홉 A-B-D를 고릅니다. 임의의 링크 비용 표를 그대로 더하는 OSPF식 계산과 혼동하지 않아야 합니다.', 'past-2024-2-q11'],
  ['systems-070', '서브넷', '동일 크기 재분할의 프리픽스', '172.20.8.0/24를 동일 크기의 서브넷 8개로 나눕니다. 각 서브넷의 프리픽스 길이를 숫자로 쓰세요. 네트워크·브로드캐스트 주소를 포함해 같은 크기로 나눕니다.', ['27', '/27'], '8개는 2의 3제곱이므로 호스트 비트 3개를 네트워크 비트로 빌립니다. 새 프리픽스는 24+3=27이고 서브넷당 전체 주소는 32개, 일반적인 사용 가능 호스트는 30개입니다.', 'past-2026-2-q16'],
];
const theoryRevisions = Object.fromEntries(theorySpecs.map(([id, category, title, prompt, acceptedAnswers, explanation, ref]) =>
  [`practice-${id}`, { category, title, prompt, acceptedAnswers, answerText: acceptedAnswers[0], explanation, examReferences: [ref] }]));
const builders = { C: cRevisions, Java: javaRevisions, Python: pythonRevisions, SQL: sqlRevisions };

export function reviseExamQuestions(original, language) {
  const previous = [];
  const questions = original.map((question) => {
    const build = builders[language]?.[question.family];
    const change = language === 'exam' ? theoryRevisions[question.id] : build?.(question.variant - 1);
    if (!change) return question;
    previous.push(question);
    return { ...question, ...change, id: `${question.id}-r2`, revisionOf: question.id, source: '복원 출제 유형 기반 창작 변형' };
  });
  return { questions, previous };
}
