import { cProgram, javaProgram } from './additionalQuestionFactory.js';

// 원본의 핵심 연산은 유지하고 식별자·입력·선택 위치·결과를 새로 구성합니다.
// 한 템플릿을 5개 값으로 무한 생성하지 않고 검증되는 150개의 고정 ID만 제공합니다.
export const similarExamCode = [];
function add(language, key, v, ref, topic, code, answer, trace, anchors) {
  similarExamCode.push({ key: `${language.toLowerCase()}-${key}-${v + 1}`, ref, category: topic, language, code,
    answer: String(answer), steps: trace, trace, anchors });
}

for (let v = 0; v < 5; v++) {
  const word = ['PLANET', 'STREAM', 'MODULE', 'VECTOR', 'BUFFER'][v], offset = v % 3 + 1;
  add('C', 'pointer', v, '2023-3-q10', '문자열 포인터', cProgram(`    const char *label = "${word}";\n    const char *cursor = label + ${offset};\n    printf("%s\\n%c\\n%c", cursor, *label, *(cursor + 1));`), `${word.slice(offset)}\n${word[0]}\n${word[offset + 1]}`,
    [`label은 문자열 ${word}의 첫 문자를 가리킵니다. cursor=label+${offset}이므로 인덱스 ${offset} 위치입니다.`, `%s는 cursor에서 널 문자 전까지 읽으므로 ${word.slice(offset)}가 출력됩니다. 포인터 위치를 바꿔도 원본 문자는 변하지 않습니다.`, `*label=${word[0]}, *(cursor+1)=${word[offset + 1]}을 각각 다음 줄에 출력합니다.`], ['const char *cursor', 'printf', 'printf']);

  const text = ['ALGORITHM', 'DATABASE', 'COMPUTER', 'NETWORKS', 'LANGUAGE'][v], start = v % 2, step = v % 2 + 2;
  const reversed = [...text].reverse().join(''), selected = [...reversed].filter((_, i) => i >= start && (i - start) % step === 0).join('');
  add('C', 'reverse', v, '2024-1-q4', '문자 배열과 포인터', cProgram(`    char text[] = "${text}";\n    flip(text);\n    for (int k = ${start}; k < (int)strlen(text); k += ${step}) {\n        printf("%c", text[k]);\n    }`, 'void flip(char *s) {\n    char *left = s, *right = s + strlen(s) - 1;\n    while (left < right) {\n        char saved = *left;\n        *left = *right;\n        *right = saved;\n        left++; right--;\n    }\n}'), selected,
    [`양 끝 문자를 교환한 뒤 포인터를 안쪽으로 이동합니다. ${text} 전체가 뒤집혀 ${reversed}가 됩니다.`, `반복문의 시작 인덱스는 ${start}, 증가 폭은 ${step}입니다. 방문 인덱스는 ${[...reversed].map((_, i) => i).filter(i => i >= start && (i - start) % step === 0).join(', ')}입니다.`, `해당 위치의 문자만 순서대로 출력하므로 ${selected}입니다. 널 문자는 strlen에 포함하지 않습니다.`], ['flip(text)', 'for (int k', 'printf']);

  const ns = [v + 7, v + 14, v + 21, v + 28];
  add('C', 'links', v, '2025-2-q16', '구조체 연결 리스트', cProgram(`    Node first = {${ns[0]}, NULL}, second = {${ns[1]}, NULL};\n    Node third = {${ns[2]}, NULL}, last = {${ns[3]}, NULL};\n    first.next = &second; second.next = &third; third.next = &last;\n    third.next = &first;\n    first.next = &last;\n    last.next = &second;\n    second.next = NULL;\n    Node *cursor = &third;\n    while (cursor != NULL) {\n        printf("%d ", cursor->value);\n        cursor = cursor->next;\n    }`, 'typedef struct Node {\n    int value;\n    struct Node *next;\n} Node;'), `${ns[2]} ${ns[0]} ${ns[3]} ${ns[1]}`,
    ['초기 연결은 first→second→third→last입니다. 이후 next를 대입하는 문장이 기존 연결을 덮어씁니다.', 'third→first, first→last, last→second, second→NULL로 재연결됩니다. 객체의 값은 그대로이고 링크만 바뀝니다.', `third부터 읽으므로 ${ns[2]}, ${ns[0]}, ${ns[3]}, ${ns[1]} 순서로 출력하고 NULL에서 끝납니다.`], ['first.next = &second', 'third.next = &first', 'Node *cursor']);

  const vals = [31 + v, 12 + v * 2, 43 + v, 9 + v, 24 + v], nth = [2, 4, 1, 5, 3][v];
  const post = [vals[3], vals[4], vals[1], vals[2], vals[0]];
  add('C', 'tree', v, '2026-2-q7', '재귀 트리 방문', cProgram(`    Branch d = {${vals[3]}, NULL, NULL};\n    Branch e = {${vals[4]}, NULL, NULL};\n    Branch b = {${vals[1]}, &d, &e};\n    Branch c = {${vals[2]}, NULL, NULL};\n    Branch root = {${vals[0]}, &b, &c};\n    scan(&root);\n    printf("%d", result);`, `typedef struct Branch {\n    int item;\n    struct Branch *left, *right;\n} Branch;\nint visits = 0, result = 0;\nvoid scan(Branch *p) {\n    if (p == NULL) return;\n    scan(p->left);\n    scan(p->right);\n    visits++;\n    if (visits == ${nth}) result = p->item;\n}`), post[nth - 1],
    ['왼쪽 자식, 오른쪽 자식을 먼저 방문하고 자기 값을 처리하므로 후위 순회입니다. NULL에서는 visits를 늘리지 않습니다.', `실제 방문 순서는 d→e→b→c→root이며 값은 ${post.join('→')}입니다.`, `${nth}번째 방문 때 result=${post[nth - 1]}를 저장합니다. 이후 조건이 다시 참이 되지 않아 그 값을 출력합니다.`], ['scan(&root)', 'visits++', 'if (visits ==']);

  const n = v + 4, factorial = Array.from({ length: n }, (_, i) => i + 1).reduce((a, b) => a * b, 1);
  add('C', 'factorial', v, '2023-3-q8', '재귀 반환', cProgram(`    printf("%d", product(${n}));`, 'int product(int value) {\n    if (value <= 1) return 1;\n    return value * product(value - 1);\n}'), factorial,
    [`product(${n})에서 인수를 하나씩 줄이며 product(1)까지 호출합니다. 1 이하에서는 바로 1을 반환합니다.`, `반환 시 각 호출의 value를 곱합니다. 곱셈 식은 ${Array.from({ length: n }, (_, i) => i + 1).join('×')}입니다.`, `모든 호출이 반환한 뒤 main의 출력문이 ${factorial}를 출력합니다. 재귀 호출 자체에는 출력문이 없습니다.`], ['printf', 'return value', 'printf']);

  const rn = v + 5, rec = k => k <= 1 ? k : rec(k - 1) + rec(k - 3);
  add('C', 'branch-recursion', v, '2026-2-q18', '분기 재귀', cProgram(`    printf("%d", evaluate(${rn}));`, 'int evaluate(int k) {\n    if (k <= 1) return k;\n    return evaluate(k - 1) + evaluate(k - 3);\n}'), rec(rn),
    ['k가 1 이하이면 k 자체를 반환합니다. 따라서 음수 인수가 생기면 0으로 바꾸지 않고 음수를 반환합니다.', `반환값을 인수별로 정리하면 ${Array.from({ length: rn + 3 }, (_, i) => i - 2).map(k => `f(${k})=${rec(k)}`).join(', ')}입니다. 이는 반환값 표이며 피연산자의 실제 평가 시간순을 뜻하지 않습니다.`, `최종 evaluate(${rn})=${rec(rn)}을 출력합니다. 기저 조건을 k==1로만 해석하면 다른 결과가 됩니다.`], ['if (k <=', 'return evaluate', 'printf']);

  const words = [['MINT', 'LIME', 'PEAR'], ['RED', 'GOLD', 'BLUE'], ['DESK', 'BOOK', 'LAMP'], ['SUN', 'MOON', 'STAR'], ['CAT', 'BIRD', 'FISH']][v];
  add('C', 'shared-buffer', v, '2023-2-q3', '문자 배열의 공유', cProgram(`    char *a = store("${words[0]}");\n    char *b = store("${words[1]}");\n    char *c = store("${words[2]}");\n    printf("%s %s %s", a, b, c);`, 'char buffer[20];\nchar *store(const char *value) {\n    strcpy(buffer, value);\n    return buffer;\n}'), `${words[2]} ${words[2]} ${words[2]}`,
    [`세 번의 store 호출은 모두 같은 전역 buffer 주소를 반환합니다. a,b,c에 문자열의 별도 복사본이 저장되는 것이 아닙니다.`, `buffer는 ${words.join('→')} 순서로 덮어써지며 마지막 문자열은 ${words[2]}입니다. strcpy는 널 종료 문자도 복사합니다.`, `출력 시 세 포인터가 같은 최종 내용을 읽으므로 ${words[2]}를 세 번 출력합니다.`], ['char *a =', 'char *c =', 'printf']);

  const nums = [18 + v * 3, 39 + v * 5, 67 + v * 7], jump = v % 2 + 1;
  add('C', 'callback', v, '2026-1-q12', '함수 포인터', cProgram(`    int values[] = {${nums.join(', ')}};\n    struct Operations ops;\n    ops.select = advance;\n    int *selected = ops.select(values);\n    printf("%x", (unsigned int)*selected);`, `struct Operations { int *(*select)(int *); };\nint *advance(int *p) {\n    return p + ${jump};\n}`), nums[jump].toString(16),
    ['ops.select에 advance 함수의 주소를 저장합니다. 호출하면 배열의 첫 원소 주소가 인수 p로 전달됩니다.', `advance는 p+${jump}를 반환하므로 selected는 values[${jump}]=${nums[jump]}를 가리킵니다. int 포인터의 한 칸은 int 원소 하나입니다.`, `%x에 맞게 unsigned int로 변환하여 소문자 16진수 ${nums[jump].toString(16)}를 출력합니다. 0x 접두사는 출력하지 않습니다.`], ['ops.select =', 'int *selected', 'printf']);

  const s = ['Orbit', 'Signal', 'Vector', 'Pixel', 'Module'][v];
  add('Java', 'strings', v, '2023-2-q14', '문자열 비교', javaProgram(`        String left = "${s}";\n        String alias = left;\n        String copy = new String("${s}");\n        System.out.println(left == alias);\n        System.out.println(alias == copy);\n        System.out.print(copy.equals(left));`), 'true\nfalse\ntrue',
    ['alias=left는 같은 String 객체를 참조하게 합니다. 따라서 left==alias는 true입니다.', 'new String으로 생성한 copy는 별도 객체이므로 alias==copy는 false입니다. ==는 이 경우 참조 동일성을 검사합니다.', `copy와 left의 문자열 내용은 모두 ${s}이므로 equals의 결과는 true입니다.`], ['String alias', 'String copy', 'System.out.print(copy']);

  const initial = v + 6, field = v * 2 + 17;
  add('Java', 'static', v, '2023-1-q1', '클래스 변수와 객체 변수', javaProgram(`        int number = ${initial};\n        Counter.shared = number;\n        Counter first = new Counter();\n        Counter second = new Counter();\n        first.local += 3;\n        System.out.println(Counter.shared++);\n        System.out.println(second.shared);\n        System.out.print(number + " " + first.local + " " + second.local);`, `    static class Counter {\n        int local = ${field};\n        static int shared;\n    }`), `${initial}\n${initial + 1}\n${initial} ${field + 3} ${field}`,
    [`shared는 클래스에서 공유하지만 local은 객체마다 따로 생깁니다. first.local만 ${field}+3=${field + 3}으로 바뀝니다.`, `후위 증가 shared++는 이전 값 ${initial}을 출력한 다음 공유 값을 ${initial + 1}로 바꿉니다. second로 접근해도 같은 값을 읽습니다.`, `지역 변수 number는 변하지 않아 ${initial}입니다. first.local=${field + 3}, second.local=${field}를 함께 출력합니다.`], ['first.local +=', 'System.out.println(Counter.shared', 'System.out.print(number']);

  const parent = v * 20 + 140, child = v * 30 + 900;
  add('Java', 'constructors', v, '2023-1-q20', '생성자와 필드 숨김', javaProgram('        Child object = new Child();\n        System.out.print(object.read() + " " + object.value);', `    static class Parent {\n        int value = 20;\n        Parent() { this(${parent}); }\n        Parent(int x) { value = x; }\n        int read() { return value; }\n    }\n    static class Child extends Parent {\n        int value = 80;\n        Child() { this(${child}); }\n        Child(int x) { value = x; }\n    }`), `${parent} ${child}`,
    [`Child()는 this(${child})로 Child(int)를 호출하고, 그 생성자에서 생략된 super()가 Parent()를 호출합니다.`, `Parent()의 this(${parent})로 부모 value=${parent}가 됩니다. 이후 자식 필드가 초기화되고 Child(int)에서 자식 value=${child}로 대입합니다.`, `read는 Parent에 선언된 메서드여서 부모 value=${parent}를 읽습니다. object.value는 자식 필드 ${child}이므로 출력은 ${parent} ${child}입니다.`], ['Child() {', 'Parent() {', 'System.out.print']);

  const a = ['P', 'K', 'M', 'R', 'X'][v], b = ['Q', 'L', 'N', 'S', 'Y'][v], c = ['Z', 'T', 'U', 'V', 'W'][v];
  add('Java', 'dispatch', v, '2026-1-q7', '오버로드와 재정의', javaProgram('        Base ref = new Derived();\n        System.out.print(ref.run());', `    static class Base {\n        String choose(Object item) { return "${a}"; }\n        String run() { return choose("hello"); }\n    }\n    static class Derived extends Base {\n        @Override String choose(Object item) { return "${b}"; }\n        String choose(String item) { return "${c}"; }\n    }`), b,
    ['run은 Base에서 정의되어 있으므로 그 본문에서 보이는 choose(Object) 시그니처로 호출이 결정됩니다. Derived에만 있는 String 오버로드를 나중에 다시 고르지 않습니다.', `실제 객체는 Derived이므로 choose(Object)의 재정의 메서드가 실행되어 ${b}를 반환합니다.`, `따라서 run의 반환값 ${b}만 출력합니다. 오버로드 선택 시점과 재정의 메서드 실행 시점을 구별합니다.`], ['String run()', '@Override String choose', 'System.out.print']);

  const codes = [['N', 'NO', 'NORTH'], ['S', 'SO', 'SOUTH'], ['E', 'EA', 'EAST'], ['W', 'WE', 'WEST'], ['U', 'UP', 'UPPER']][v];
  const enumIndex = v % 2 + 1;
  add('Java', 'enum', v, '2025-3-q17', '열거형', javaProgram(`        Mode selected = Mode.values()[${enumIndex}];\n        System.out.print(selected.text() + " " + selected.ordinal());`, `    enum Mode {\n        FIRST("${codes[0]}"), SECOND("${codes[1]}"), THIRD("${codes[2]}");\n        private final String label;\n        Mode(String label) { this.label = label; }\n        String text() { return label; }\n    }`), `${codes[enumIndex]} ${enumIndex}`,
    ['values는 선언 순서의 열거 상수 배열입니다. FIRST, SECOND, THIRD의 인덱스는 각각 0,1,2입니다.', `인덱스 ${enumIndex}의 상수를 선택하므로 저장한 label은 ${codes[enumIndex]}입니다. 상수 이름과 저장 문자열은 별개입니다.`, `text()의 반환 문자열과 0부터 시작하는 ordinal ${enumIndex}을 공백으로 구분해 출력합니다.`], ['Mode selected', 'String text()', 'System.out.print']);

  const value = v * 7 + 12;
  add('Java', 'generic', v, '2024-3-q19', '제네릭과 오버로딩', javaProgram(`        new Box<Integer>(${value}).show();`, '    static class Box<T> {\n        T item;\n        Box(T value) { item = value; }\n        void show() { new Printer().write(item); }\n    }\n    static class Printer {\n        void write(Integer x) { System.out.print("I" + x); }\n        void write(Number x) { System.out.print("N" + x); }\n        void write(Object x) { System.out.print("O" + x); }\n    }'), `O${value}`,
    ['Box<T>의 T에는 상한이 지정되지 않아 본문에서 item의 타입은 Object 상한으로 취급됩니다. show의 호출 시그니처는 이 선언 타입을 기준으로 선택합니다.', '런타임에 item이 Integer라는 사실만으로 write(Integer)를 다시 선택하지 않습니다. 선택된 메서드는 write(Object)입니다.', `Object 오버로드는 O와 값 ${value}를 연결하므로 O${value}를 출력합니다.`], ['void show()', 'void write(Object', 'new Box<Integer>']);

  const av = [v + 2, v + 5, v + 9];
  add('Java', 'array-reference', v, '2024-2-q1', '배열 참조 비교', javaProgram(`        int[] first = {${av.join(', ')}};\n        int[] same = first;\n        int[] copy = {${av.join(', ')}};\n        same[1] += ${v + 1};\n        System.out.println(first == same);\n        System.out.println(first == copy);\n        System.out.print(first[1] + " " + copy[1]);`), `true\nfalse\n${av[1] + v + 1} ${av[1]}`,
    ['same와 first는 동일 배열을 참조하므로 same을 통한 수정은 first에도 보입니다. copy는 원소값이 같아도 별도로 만든 배열입니다.', `first==same는 true이고 first==copy는 false입니다. 배열의 ==는 원소별 비교가 아닙니다.`, `first[1]은 ${av[1]}+${v + 1}=${av[1] + v + 1}, copy[1]은 ${av[1]}이므로 마지막 줄에 두 값을 출력합니다.`], ['int[] same', 'System.out.println(first', 'System.out.print(first[1]']);

  const limit = v + 5, jf = n => n <= 1 ? n : jf(n - 1) + jf(n - 3);
  add('Java', 'recursive-override', v, '2023-3-q11', '재정의와 재귀 호출', javaProgram(`        Parent task = new Child();\n        System.out.print(task.compute(${limit}));`, '    static class Parent {\n        int compute(int n) {\n            if (n <= 1) return n;\n            return compute(n - 1) + compute(n - 2);\n        }\n    }\n    static class Child extends Parent {\n        @Override int compute(int n) {\n            if (n <= 1) return n;\n            return compute(n - 1) + compute(n - 3);\n        }\n    }'), jf(limit),
    ['참조 변수 타입은 Parent이지만 실제 객체가 Child이므로 재정의된 Child.compute가 실행됩니다. 그 안의 재귀도 Child 메서드로 이어집니다.', `종료 조건은 n<=1일 때 n 그대로 반환하는 것입니다. 반환값 표는 ${Array.from({ length: limit + 3 }, (_, i) => i - 2).map(n => `f(${n})=${jf(n)}`).join(', ')}입니다.`, `Parent의 n-2 식을 섞지 않고 Child의 n-3 식으로 계산하면 최종 출력은 ${jf(limit)}입니다.`], ['Parent task', '@Override int compute', 'System.out.print']);

  const cities = [['AB', 'Oslo'], ['CD', 'Lima'], ['EF', 'Rome']].map(([k, s], i) => [k + String.fromCharCode(75 + v + i), s]);
  add('Python', 'class-dict', v, '2026-2-q5', '클래스 딕셔너리', `class Places:\n    names = {${cities.map(([k, s]) => `'${k}': '${s}'`).join(', ')}}\n\nrecord = Places()\nresult = ''\nfor key, value in record.names.items():\n    result += key[-1] + value[${v % 2}]\nprint(result)`, cities.map(([k, s]) => k.slice(-1) + s[v % 2]).join(''),
    [`딕셔너리 삽입 순서는 ${cities.map(([k]) => k).join('→')}입니다. 인스턴스에 names가 따로 없어 클래스 속성을 읽습니다.`, ...cities.map(([k, s]) => `${k}의 마지막 글자 ${k.slice(-1)}와 ${s}의 인덱스 ${v % 2} 글자 ${s[v % 2]}를 이어 붙입니다.`), '각 조각을 삽입 순서대로 누적하여 최종 문자열을 한 줄로 출력합니다.'], ['record =', ...cities.map(() => 'result +='), 'print(result)']);

  const setBase = [v + 1, v + 3, v + 5], extra = v + 8;
  add('Python', 'set', v, '2023-1-q15', '집합 원소 변경', `items = {${setBase.join(', ')}}\nitems.add(${setBase[1]})\nitems.remove(${setBase[0]})\nitems.update({${setBase[2]}, ${extra}})\nprint(sorted(items))`, `[${[setBase[1], setBase[2], extra].join(', ')}]`,
    [`집합에 이미 있는 ${setBase[1]}을 추가해도 원소 수는 늘지 않습니다. remove(${setBase[0]})로 해당 원소를 제거합니다.`, `update는 ${setBase[2]}과 ${extra}를 합칩니다. ${setBase[2]}는 이미 있어 중복되지 않습니다.`, `남은 세 원소를 sorted로 정렬한 리스트 [${[setBase[1], setBase[2], extra].join(', ')}]가 출력됩니다. 집합의 순회 순서에 의존하지 않습니다.`], ['items.add', 'items.update', 'print(sorted']);

  const phrase = ['ababaabab', 'xyxyxxyxy', '121211212', 'cacaccaca', 'totottoot'][v], pattern = phrase.slice(0, 2), other = phrase.slice(1, 3);
  const count = token => [...phrase].filter((_, i) => phrase.slice(i, i + token.length) === token).length;
  add('Python', 'slice-count', v, '2024-2-q6', '문자열 구간 비교', `def occurrences(text, token):\n    found = 0\n    for pos in range(len(text)):\n        if text[pos:pos + len(token)] == token:\n            found += 1\n    return found\n\nmessage = '${phrase}'\nprint(occurrences(message, '${pattern}'), occurrences(message, '${other}'))`, `${count(pattern)} ${count(other)}`,
    ['각 인덱스에서 token 길이만큼의 슬라이스를 만듭니다. 다음 검사는 한 칸 뒤에서 시작하므로 겹치는 구간도 비교합니다.', ...[pattern, other].map(p => `${p}와 일치하는 시작 인덱스는 ${[...phrase].map((_, i) => i).filter(i => phrase.slice(i, i + p.length) === p).join(', ')}이므로 ${count(p)}회입니다.`), '두 함수의 반환 횟수를 인수 순서대로 공백으로 구분해 출력합니다.'], ['for pos', 'if text[pos', 'if text[pos', 'print(occurrences']);

  const input = ['Blue Map', 'Code Lab', 'Data Flow', 'Logic Net', 'Study Hub'][v], excluded = ['ae', 'oa', 'ao', 'ie', 'uy'][v];
  const joined = input.replaceAll(' ', ''), filtered = [...joined].reverse().filter(ch => !excluded.includes(ch)).join('');
  add('Python', 'split-reverse', v, '2026-1-q8', '분리와 역순 처리', `text = '${input}'\nparts = text.split()\nmerged = ''.join(parts)\nanswer = ''.join(ch for ch in merged[::-1] if ch not in '${excluded}')\nprint(answer)`, filtered,
    [`split()은 공백을 기준으로 나누고 빈 문자열 구분자로 join하여 ${joined}를 만듭니다.`, `[::-1]로 뒤집은 ${[...joined].reverse().join('')}에서 ${excluded}에 포함된 문자만 제거합니다. 대소문자는 구분합니다.`, `남은 문자를 원래 역순 처리 순서대로 이어 붙이면 ${filtered}입니다.`], ['parts =', 'answer =', 'print(answer)']);

  const end = v + 9, stride = v % 2 + 2, range = Array.from({ length: end }, (_, i) => i + 1).reverse().filter((_, i) => i % stride === 0);
  add('Python', 'range-slice', v, '2026-1-q13', '리스트 역방향 슬라이스', `values = list(range(1, ${end + 1}))\nfor number in values[::-${stride}]:\n    print(number, end='B')\nprint()`, range.map(n => `${n}B`).join(''),
    [`range(1,${end + 1})는 끝값을 포함하지 않아 1부터 ${end}까지 만듭니다.`, `[::-${stride}]는 마지막 원소부터 ${stride}칸씩 뒤로 이동하므로 ${range.join(', ')} 순서입니다.`, '각 print의 end가 B이므로 마지막 숫자 뒤에도 B가 붙습니다. 마지막 print()는 줄바꿈만 추가합니다.'], ['values =', 'for number', 'print(number']);

  const arr = [3 + v, 8 + v, 2 + v, 11 + v, 7 + v, 15 + v], rev = [...arr].reverse();
  const sums = [0, 1].map(parity => rev.filter((_, i) => i % 2 === parity).reduce((a, b) => a + b, 0));
  add('Python', 'reverse-list', v, '2024-3-q2', '리스트 교환과 합계', `def mirror(values):\n    for pos in range(len(values) // 2):\n        values[pos], values[-pos - 1] = values[-pos - 1], values[pos]\n\nnumbers = [${arr.join(', ')}]\nmirror(numbers)\nprint(sum(numbers[::2]) - sum(numbers[1::2]))`, sums[0] - sums[1],
    [`양 끝 원소를 차례로 교환합니다. 함수에 전달한 리스트 자체를 수정하여 ${JSON.stringify(rev)}가 됩니다.`, `인덱스 0,2,4의 합은 ${sums[0]}, 인덱스 1,3,5의 합은 ${sums[1]}입니다. 슬라이스는 변경된 리스트를 기준으로 합니다.`, `앞 슬라이스의 합에서 뒤 슬라이스의 합을 빼므로 ${sums[0]}-${sums[1]}=${sums[0] - sums[1]}을 출력합니다. 함수의 반환값이 아니라 변경된 리스트의 합계를 계산합니다.`], ['mirror(numbers)', 'print(sum', 'print(sum']);

  const nodes = [8 + v, 5 + v, 12 + v, 3 + v, 10 + v, 17 + v, 6 + v], level = v % 2 + 1;
  const chosen = level === 1 ? nodes.slice(1, 3) : nodes.slice(3), total = chosen.reduce((a, b) => a + b, 0);
  add('Python', 'tree', v, '2025-1-q17', '객체 트리와 재귀', `class Node:\n    def __init__(self, value):\n        self.value = value\n        self.children = []\n\ndef collect(node, depth=0):\n    own = node.value if depth == ${level} else 0\n    return own + sum(collect(child, depth + 1) for child in node.children)\n\nnodes = [Node(n) for n in [${nodes.join(', ')}]]\nfor pos in range(1, len(nodes)):\n    nodes[(pos - 1) // 2].children.append(nodes[pos])\nprint(collect(nodes[0]))`, total,
    [`부모 인덱스 (pos-1)//2로 연결합니다. 깊이 0은 ${nodes[0]}, 깊이 1은 ${nodes.slice(1, 3).join(', ')}, 깊이 2는 ${nodes.slice(3).join(', ')}입니다.`, `자기 값은 깊이 ${level}인 경우에만 더하지만 자식의 합은 항상 재귀 계산합니다. 선택된 값은 ${chosen.join(', ')}입니다.`, `선택값 합 ${chosen.join('+')}=${total}를 루트에서 반환하여 출력합니다.`], ['nodes[(pos - 1)', 'own =', 'print(collect']);

  const keys = [v + 2, v + 4, v + 6], factor = v + 2, changed = 91 + v;
  add('Python', 'dict-set', v, '2025-2-q17', '딕셔너리와 집합', `keys = [${keys.join(', ')}]\nmapping = {key: key * ${factor} for key in keys}\nsnapshot = set(mapping.values())\nkeys[0] = 99\nmapping[${keys[1]}] = ${changed}\nsnapshot.add(${changed})\nprint(len(snapshot & set(mapping.values())))`, 3,
    [`처음 mapping의 값은 ${keys.map(k => k * factor).join(', ')}입니다. snapshot은 그 시점의 값을 새 집합으로 복사합니다.`, `keys[0]을 바꿔도 이미 생성된 mapping은 변하지 않습니다. mapping[${keys[1]}]만 ${changed}로 바뀌고 snapshot에도 ${changed}를 더합니다.`, `현재 mapping의 세 값 ${keys[0] * factor},${changed},${keys[2] * factor}가 snapshot에 모두 있어 교집합 크기는 3입니다.`], ['snapshot =', 'mapping[', 'print(len']);
}
