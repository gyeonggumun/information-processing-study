// 정보처리기사 실기 Java 출제 개념을 조합한 창작 변형 문제입니다.
const questions = [];
const levels = { 하: 'easy', 중: 'medium', 상: 'hard' };
const literal = (values) => values.join(', ');
const program = (body, members = '') => 'import java.util.*;\n\nclass Main {\n' +
  (members ? members + '\n\n' : '') +
  '    public static void main(String[] args) {\n' + body + '\n    }\n}';
const result = (code, answer, explanation, trace, anchors) => ({
  code, answerText: String(answer), explanation, trace, anchors,
});

function addFamily(difficulty, family, title, tag, build) {
  for (let variant = 0; variant < 5; variant += 1) {
    const number = questions.filter((q) => q.difficulty === difficulty).length + 1;
    questions.push({
      id: 'java-' + levels[difficulty] + '-' + String(number).padStart(3, '0'),
      language: 'Java', difficulty, family, variant: variant + 1, number, title, tag,
      prompt: '다음 Java 프로그램의 표준 출력 결과를 실행 순서대로 작성하세요.',
      source: '실기 출제 개념 기반 창작 변형',
      ...build(variant),
    });
  }
}

// 하: 연산·제어문·배열·문자열·매개변수·기본 재귀.
addFamily('하', 'integer-division', '정수 나눗셈과 나머지', '연산자', (v) => {
  const a = 17 + v * 3, b = 2 + v % 3, q = Math.trunc(a / b), r = a % b;
  return result(program('        int a = ' + a + ', b = ' + b + ';\n        int q = a / b;\n        int r = a % b;\n        System.out.print(q + " " + r + " " + (q * b + r));'),
    q + ' ' + r + ' ' + a, '두 값이 모두 int이면 나눗셈은 소수 부분을 버립니다. 나머지는 %로 구하며 몫×제수+나머지로 원래 수를 검산할 수 있습니다.',
    [a + ' / ' + b + '의 정수 몫은 ' + q, a + ' % ' + b + '의 나머지는 ' + r, '검산한 원래 수는 ' + a],
    ['int q =', 'int r =', 'System.out.print']);
});

addFamily('하', 'increment-order', '전위·후위 증가 연산', '증감 연산자', (v) => {
  const start = 3 + v;
  return result(program('        int x = ' + start + ';\n        int a = x++;\n        int b = ++x;\n        System.out.print(a + " " + b + " " + x);'),
    start + ' ' + (start + 2) + ' ' + (start + 2), 'x++는 기존 값을 사용한 뒤 x를 증가시키고, ++x는 증가시킨 값을 즉시 사용합니다. 두 식의 평가 순서를 차례대로 추적하세요.',
    ['후위 증가로 a에는 기존 값 ' + start + '이 저장되고 x는 ' + (start + 1), '전위 증가로 x와 b가 모두 ' + (start + 2), 'a, b, x 순서로 출력'],
    ['int a =', 'int b =', 'System.out.print']);
});

addFamily('하', 'ternary-branch', '삼항 연산과 조건 분기', '조건문', (v) => {
  const x = 4 + v, y = 8 - v, m = Math.max(x, y), after = m % 2 === 0 ? m / 2 : m * 2;
  return result(program('        int x = ' + x + ', y = ' + y + ';\n        int m = x > y ? x : y;\n        if (m % 2 == 0) m /= 2;\n        else m *= 2;\n        System.out.print(m);'),
    after, '삼항 연산자로 더 큰 수를 고른 다음 짝수이면 절반, 홀수이면 두 배로 바꿉니다. 조건식의 참·거짓에 따라 실행되는 가지가 달라집니다.',
    ['x=' + x + ', y=' + y + ' 중 선택된 m=' + m, m + '은 ' + (m % 2 === 0 ? '짝수여서 2로 나눔' : '홀수여서 2배로 만듦'), '최종 m=' + after],
    ['int m =', 'if (m % 2', 'System.out.print']);
});

addFamily('하', 'switch-flow', 'switch의 break와 관통', '선택문', (v) => {
  const k = v % 3, sum = k === 0 ? 3 : k === 1 ? 2 : 4;
  return result(program('        int k = ' + k + ', sum = 0;\n        switch (k) {\n            case 0: sum += 1;\n            case 1: sum += 2; break;\n            default: sum += 4;\n        }\n        System.out.print(sum + ' + v + ');'),
    sum + v, 'switch는 일치하는 case부터 시작합니다. break가 없으면 다음 case도 이어서 실행되며, break를 만나면 switch를 빠져나옵니다.',
    ['k=' + k + '에 해당하는 case에서 시작', 'break를 만날 때까지 누적한 sum=' + sum, '마지막에 ' + v + '을 더해 ' + (sum + v) + ' 출력'],
    ['switch (k)', 'case 1:', 'System.out.print']);
});

addFamily('하', 'loop-continue', '반복문과 continue', '반복문', (v) => {
  const n = 6 + v, divisor = 2 + v % 2, selected = Array.from({ length: n }, (_, i) => i + 1).filter((x) => x % divisor !== 0);
  const sum = selected.reduce((a, b) => a + b, 0);
  return result(program('        int sum = 0;\n        for (int i = 1; i <= ' + n + '; i++) {\n            if (i % ' + divisor + ' == 0) continue;\n            sum += i;\n        }\n        System.out.print(sum);'),
    sum, 'continue를 만나면 현재 반복의 나머지를 건너뛰고 다음 i로 넘어갑니다. 조건에 걸리지 않은 값만 합계에 더해집니다.',
    [divisor + '의 배수일 때 continue로 누적을 건너뜀', '실제로 더하는 수는 ' + selected.join(', '), '최종 합계=' + sum],
    ['continue;', 'sum += i', 'System.out.print']);
});

addFamily('하', 'array-index', '배열 인덱스와 선택적 합계', '배열', (v) => {
  const a = [3 + v, 7 + v % 2, 2 + v, 9 - v % 3, 5 + v, 4 + v % 2];
  const sum = a[0] + a[2] + a[4];
  return result(program('        int[] a = {' + literal(a) + '};\n        int sum = a[0] + a[2] + a[4];\n        System.out.print(sum + " " + a[1]);'),
    sum + ' ' + a[1], 'Java 배열의 첫 인덱스는 0입니다. 인덱스 0·2·4의 원소만 합산하고, 두 번째 출력값은 a[1]입니다.',
    ['선택한 원소는 ' + a[0] + ', ' + a[2] + ', ' + a[4], '세 수의 합은 ' + sum, 'a[1]=' + a[1] + '을 이어서 출력'],
    ['int[] a =', 'int sum =', 'System.out.print']);
});

addFamily('하', 'substring-range', '문자열 substring 범위', '문자열', (v) => {
  const word = ['DATABASE', 'NETWORK', 'PROGRAM', 'SOFTWARE', 'COMPUTER'][v], start = 1 + v % 2, end = start + 3, part = word.slice(start, end);
  return result(program('        String text = "' + word + '";\n        String part = text.substring(' + start + ', ' + end + ');\n        System.out.print(part + " " + part.length());'),
    part + ' ' + part.length, 'substring(시작, 끝)은 시작 인덱스의 문자를 포함하고 끝 인덱스의 문자는 포함하지 않습니다. length()는 잘라낸 문자열 길이입니다.',
    [start + '번부터 ' + (end - 1) + '번 문자까지만 추출', '추출한 문자열은 ' + part, '길이는 ' + part.length],
    ['String part =', 'String part =', 'System.out.print']);
});

addFamily('하', 'char-conversion', 'char 증가와 정수 변환', '자료형', (v) => {
  const first = 65 + v, last = first + 2;
  return result(program("        char ch = (char) ('A' + " + v + ");\n        ch += 2;\n        System.out.print(ch + \" \" + (int) ch);"),
    String.fromCharCode(last) + ' ' + last, 'char에는 문자 코드가 저장됩니다. += 연산으로 코드값이 증가하며, (int)로 변환하면 해당 문자 코드의 숫자가 출력됩니다.',
    ['초기 문자는 ' + String.fromCharCode(first) + ', 코드값 ' + first, '2를 더한 문자는 ' + String.fromCharCode(last), '정수로 변환하면 ' + last],
    ['char ch =', 'ch +=', 'System.out.print']);
});

addFamily('하', 'primitive-argument', '기본형 매개변수의 값 전달', '메서드', (v) => {
  const initial = 5 + v, delta = 2 + v;
  const members = '    static void increase(int x) {\n        x += ' + delta + ';\n    }';
  return result(program('        int value = ' + initial + ';\n        increase(value);\n        System.out.print(value);', members),
    initial, '기본형 인수는 값이 복사되어 전달됩니다. 메서드 안에서 복사본 x를 바꿔도 main의 value에는 영향을 주지 않습니다.',
    ['value=' + initial + '의 복사본을 메서드에 전달', '메서드 안의 x만 ' + (initial + delta) + '로 변경', '원본 value=' + initial + ' 그대로 출력'],
    ['increase(value)', 'x +=', 'System.out.print']);
});

addFamily('하', 'recursive-sum', '재귀 함수의 합계 반환', '재귀', (v) => {
  const n = 3 + v, answer = n * (n + 1) / 2;
  const members = '    static int sum(int n) {\n        if (n == 0) return 0;\n        return n + sum(n - 1);\n    }';
  return result(program('        System.out.print(sum(' + n + '));', members),
    answer, 'sum(n)은 n이 0이 될 때까지 작은 인수로 재귀 호출한 뒤, 되돌아오면서 1부터 n까지의 값을 더합니다.',
    [n + '부터 0까지 재귀 호출로 내려감', 'sum(0)=0에서 호출을 멈춤', '되돌아오며 1부터 ' + n + '까지 더한 값=' + answer],
    ['sum(n - 1)', 'if (n == 0)', 'return n +']);
});

// 중: 동적 바인딩·오버로딩·생성자·공유 상태·예외·컬렉션.
addFamily('중', 'override-dispatch', '상속과 오버라이딩의 동적 호출', '상속', (v) => {
  const base = 2 + v, delta = 3 + v;
  const members = '    static class Base {\n        int value() { return ' + base + '; }\n    }\n' +
    '    static class Child extends Base {\n        @Override int value() { return ' + base + ' + ' + delta + '; }\n    }';
  return result(program('        Base item = new Child();\n        System.out.print(item.value());', members),
    base + delta, '참조 변수의 선언 타입은 Base지만 실제 객체는 Child입니다. 오버라이딩된 인스턴스 메서드는 실행 시 실제 객체의 메서드가 선택됩니다.',
    ['Base 타입 참조에 Child 객체를 저장', '실제 객체가 Child이므로 Child.value() 실행', base + '+' + delta + '=' + (base + delta) + ' 출력'],
    ['Base item =', '@Override int value()', 'System.out.print']);
});

addFamily('중', 'overload-static-type', '오버로딩과 참조 변수의 선언 타입', '오버로딩', (v) => {
  const value = 4 + v;
  const members = '    static String pick(Number x) { return "N" + x.intValue(); }\n' +
    '    static String pick(Integer x) { return "I" + (x + 1); }';
  return result(program('        Number a = Integer.valueOf(' + value + ');\n        Integer b = Integer.valueOf(' + (value + 1) + ');\n        System.out.print(pick(a) + " " + pick(b));', members),
    'N' + value + ' I' + (value + 2), '오버로딩은 실행 시 객체의 실제 타입이 아니라 호출식에 보이는 인수의 선언 타입으로 선택됩니다. Number는 Number 버전, Integer는 Integer 버전을 호출합니다.',
    ['a의 선언 타입은 Number, b의 선언 타입은 Integer', 'pick(a)는 Number 매개변수 버전으로 N' + value, 'pick(b)는 Integer 버전으로 I' + (value + 2)],
    ['Number a =', 'pick(a)', 'pick(b)']);
});

addFamily('중', 'constructor-chain', 'this 생성자 연결과 필드 초기화', '생성자', (v) => {
  const initial = 2 + v, amount = 3 + v, answer = initial + amount + 1;
  const members = '    static class Box {\n        int value = ' + initial + ';\n' +
    '        Box() { this(' + amount + '); value += 1; }\n' +
    '        Box(int n) { value += n; }\n    }';
  return result(program('        Box box = new Box();\n        System.out.print(box.value);', members),
    answer, 'this(...)는 같은 클래스의 다른 생성자를 먼저 호출합니다. 객체의 필드 초기화는 한 번만 수행되며, 연결된 생성자가 끝나면 원래 생성자의 남은 문장이 실행됩니다.',
    ['value 필드가 ' + initial + '로 초기화', 'Box(int)의 n=' + amount + '을 더해 ' + (initial + amount), 'Box()의 마지막 문장에서 1을 더해 ' + answer],
    ['int value =', 'Box(int n)', 'value += 1']);
});

addFamily('중', 'static-shared', 'static 필드와 객체별 필드', '공유 상태', (v) => {
  const start = 1 + v, a = 2 + v, b = 3 + v, first = start + a, total = first + b;
  const members = '    static class Counter {\n        static int shared = ' + start + ';\n        int local;\n' +
    '        Counter(int x) { shared += x; local = shared; }\n    }';
  return result(program('        Counter a = new Counter(' + a + ');\n        Counter b = new Counter(' + b + ');\n        System.out.print(Counter.shared + " " + a.local + " " + b.local);', members),
    total + ' ' + first + ' ' + total, 'static 필드는 모든 객체가 공유하지만 local은 각 객체마다 따로 존재합니다. 생성 순서대로 shared가 변하고 각 local에는 생성 당시 값이 저장됩니다.',
    ['초기 shared=' + start, '첫 객체 뒤 shared와 a.local=' + first, '둘째 객체 뒤 shared와 b.local=' + total],
    ['static int shared =', 'Counter a =', 'Counter b =']);
});

addFamily('중', 'string-builder', 'String 불변성과 StringBuilder 변경', '문자열', (v) => {
  const text = 'CAT' + v, changed = 'COT' + v, appended = text + (v + 1);
  return result(program('        String text = "' + text + '";\n        String changed = text.replace("A", "O");\n' +
    '        StringBuilder builder = new StringBuilder(text);\n        builder.append(' + (v + 1) + ');\n        System.out.print(text + " " + changed + " " + builder);'),
    text + ' ' + changed + ' ' + appended, 'String의 replace는 새 문자열을 만들고 원본은 바꾸지 않습니다. StringBuilder의 append는 같은 객체의 내용을 직접 바꿉니다.',
    ['원본 text=' + text, 'replace 결과 changed=' + changed + '이고 text는 그대로', 'builder에 숫자를 붙여 ' + appended],
    ['String text =', 'String changed =', 'builder.append']);
});

addFamily('중', 'array-alias-clone', '배열 별칭과 clone 복사', '참조형', (v) => {
  const first = 3 + v, second = 7 + v, delta = v + 1;
  return result(program('        int[] original = {' + first + ', ' + second + '};\n        int[] alias = original;\n' +
    '        int[] copy = original.clone();\n        alias[0] += ' + delta + ';\n        copy[1] += 2;\n' +
    '        System.out.print(original[0] + " " + original[1] + " " + copy[1]);'),
    (first + delta) + ' ' + second + ' ' + (second + 2), 'alias는 original과 같은 배열을 가리키므로 alias의 수정이 원본에 반영됩니다. clone은 새 배열을 만들기 때문에 copy의 수정은 원본과 분리됩니다.',
    ['alias는 original과 동일한 배열을 참조, copy는 별도 배열', 'alias[0] 변경으로 original[0]=' + (first + delta), 'copy[1]=' + (second + 2) + '이지만 original[1]=' + second],
    ['int[] copy =', 'alias[0] +=', 'copy[1] +=']);
});

addFamily('중', 'catch-finally', '예외 처리와 finally 실행 순서', '예외', (v) => {
  const start = 4 + v, raised = v % 2 === 0, beforeFinally = start + (raised ? 3 : 2), answer = beforeFinally * 2;
  return result(program('        int x = ' + start + ';\n        try {\n            if (' + v + ' % 2 == 0) throw new IllegalArgumentException();\n' +
    '            x += 2;\n        } catch (IllegalArgumentException e) {\n            x += 3;\n        } finally {\n            x *= 2;\n        }\n        System.out.print(x);'),
    answer, '예외가 발생하면 try의 남은 문장은 건너뛰고 일치하는 catch로 이동합니다. 예외 발생 여부와 관계없이 finally는 마지막에 실행됩니다.',
    [raised ? '예외가 발생해 x += 2는 건너뜀' : '예외 없이 try의 x += 2 실행', raised ? 'catch에서 3을 더해 x=' + beforeFinally : 'catch는 실행되지 않아 x=' + beforeFinally, 'finally에서 2배로 만들어 ' + answer],
    ['if (', raised ? 'x += 3' : 'x += 2', 'x *= 2']);
});

addFamily('중', 'interface-default', '인터페이스 기본 메서드 호출', '인터페이스', (v) => {
  const base = 2 + v, field = 3 + v, answer = base + field;
  const members = '    interface Value { default int get() { return ' + base + '; } }\n' +
    '    static class Item implements Value {\n        int x;\n        Item(int x) { this.x = x; }\n' +
    '        @Override public int get() { return Value.super.get() + x; }\n    }';
  return result(program('        Value item = new Item(' + field + ');\n        System.out.print(item.get());', members),
    answer, '구현 클래스는 인터페이스의 default 메서드를 재정의할 수 있습니다. Value.super.get()으로 기본 구현을 호출한 결과에 객체의 필드 x를 더합니다.',
    ['Item 객체의 x=' + field, 'Value.super.get()이 ' + base + '을 반환', '재정의된 get()은 ' + answer + '을 반환'],
    ['Value item =', 'Value.super.get()', 'System.out.print']);
});

addFamily('중', 'map-replace', 'Map 키 덮어쓰기와 기본값', '컬렉션', (v) => {
  const first = 2 + v, second = 7 + v, extra = 4 + v;
  return result(program('        Map<String, Integer> map = new HashMap<>();\n        map.put("a", ' + first + ');\n' +
    '        map.put("a", ' + second + ');\n        map.put("b", ' + extra + ');\n' +
    '        System.out.print(map.size() + " " + map.get("a") + " " + map.getOrDefault("c", 9));'),
    '2 ' + second + ' 9', 'Map에서 동일한 키를 다시 put하면 항목 수가 늘지 않고 기존 값만 바뀝니다. 존재하지 않는 키를 getOrDefault로 읽으면 지정한 기본값을 받습니다.',
    ['a에 처음 저장한 값=' + first, 'a를 다시 put하여 값이 ' + second + '로 변경', '키는 a와 b 두 개이고 c는 없어 기본값 9 사용'],
    ['map.put("a", ' + first, 'map.put("a", ' + second, 'System.out.print']);
});

addFamily('중', 'ragged-array', '가변 길이 이차원 배열 순회', '배열', (v) => {
  const rows = [[2 + v, 3 + v], [4 + v], [5 + v, 6 + v, 7 + v]];
  const sums = rows.map((row) => row.reduce((a, b) => a + b, 0)), total = sums.reduce((a, b) => a + b, 0);
  return result(program('        int[][] a = {{' + literal(rows[0]) + '}, {' + literal(rows[1]) + '}, {' + literal(rows[2]) + '}};\n' +
    '        int sum = 0;\n        for (int[] row : a) {\n            for (int value : row) sum += value;\n        }\n' +
    '        System.out.print(sum + " " + a[2].length);'),
    total + ' 3', 'Java의 이차원 배열은 각 행의 길이가 달라도 됩니다. 바깥 반복은 행을, 안쪽 반복은 해당 행의 실제 원소만 순회합니다.',
    ['각 행의 길이는 2, 1, 3', '행별 합은 ' + sums.join(', '), '전체 합계=' + total + ', 마지막 행 길이=3'],
    ['int[][] a =', 'sum += value', 'System.out.print']);
});

// 상: 초기화 시점·예외의 반환 덮어쓰기·공유 상태 재귀·다형성·자료구조를 결합.
addFamily('상', 'constructor-virtual', '생성자 중 가상 메서드 호출과 필드 숨김', '상속·초기화', (v) => {
  const parent = 3 + v, child = 5 + v, delta = v + 1, after = child + delta;
  const members = '    static class Parent {\n        int value = ' + parent + ';\n' +
    '        Parent() { System.out.print(read() + " "); }\n        int read() { return value; }\n    }\n' +
    '    static class Child extends Parent {\n        int value = ' + child + ';\n' +
    '        @Override int read() { return value; }\n        Child() { value += ' + delta + '; }\n    }';
  return result(program('        Child item = new Child();\n        System.out.print(item.read() + " " + ((Parent) item).value);', members),
    '0 ' + after + ' ' + parent, 'Parent 생성자에서 호출한 read()는 실제 Child의 메서드로 동적 바인딩됩니다. 이때 Child 필드 초기화 전이므로 value는 기본값 0입니다. Parent.value와 Child.value는 서로 다른 필드입니다.',
    ['Parent 생성자에서 Child.read()가 먼저 호출되어 아직 초기화되지 않은 Child.value=0 출력', '이후 Child.value가 ' + child + '로 초기화', 'Child 생성자에서 ' + delta + '을 더해 ' + after, 'Parent로 형변환한 필드는 Parent.value=' + parent],
    ['Parent() {', 'int value = ' + child, 'Child() {', '((Parent) item).value']);
});

addFamily('상', 'finally-return', 'finally의 반환값 덮어쓰기', '예외·반환', (v) => {
  const a = 2 + v, b = 3 + v;
  const outcome = (n) => n > 3 ? n * 2 : n % 2 === 0 ? n + 1 : n + 2;
  const reason = (n) => n > 3 ? 'finally의 return이 이전 값을 덮어써 ' + outcome(n) : 'finally가 반환하지 않아 ' + outcome(n);
  const members = '    static int calc(int n) {\n        try {\n            if (n % 2 == 0) return n + 1;\n' +
    '            throw new IllegalStateException();\n        } catch (IllegalStateException e) {\n            return n + 2;\n' +
    '        } finally {\n            if (n > 3) return n * 2;\n        }\n    }';
  return result(program('        System.out.print(calc(' + a + ') + " " + calc(' + b + '));', members),
    outcome(a) + ' ' + outcome(b), 'try나 catch에 return이 있어도 finally가 실행됩니다. finally에서도 return하면 앞서 결정된 반환값을 덮어쓰며, 조건이 거짓이면 기존 값이 유지됩니다.',
    ['calc(' + a + '): ' + reason(a), 'calc(' + b + '): ' + reason(b), '왼쪽 호출 결과부터 순서대로 출력'],
    ['if (n % 2', 'if (n > 3)', 'System.out.print']);
});

addFamily('상', 'recursive-global', '재귀와 공유 static 카운터', '재귀·상태', (v) => {
  const n = 3 + v % 3, trace = [], anchors = [];
  let ticks = v;
  function calc(x) {
    ticks += 1;
    if (x <= 1) {
      const returned = ticks + x;
      trace.push('기저 n=' + x + ': ticks=' + ticks + ', 반환=' + returned);
      anchors.push('if (n <= 1)');
      return returned;
    }
    const left = calc(x - 1), right = calc(x - 2), returned = left + right + ticks;
    trace.push('n=' + x + ': ' + left + ' + ' + right + ' + 현재 ticks(' + ticks + ') = ' + returned);
    anchors.push('return left + right + ticks');
    return returned;
  }
  const answer = calc(n);
  trace.push('최종 반환값=' + answer + ', 공유 ticks 최종값=' + ticks);
  anchors.push('System.out.print');
  const members = '    static int ticks = ' + v + ';\n    static int calc(int n) {\n        ticks++;\n' +
    '        if (n <= 1) return ticks + n;\n        int left = calc(n - 1);\n' +
    '        int right = calc(n - 2);\n        return left + right + ticks;\n    }';
  return result(program('        System.out.print(calc(' + n + ') + " " + ticks);', members),
    answer + ' ' + ticks, 'static ticks는 재귀 호출 전체가 공유합니다. 각 호출에서 먼저 증가하고, 자식 호출이 모두 끝난 뒤의 최신 ticks가 부모의 반환식에 사용됩니다. 일반적인 피보나치 합과 달라집니다.',
    trace, anchors);
});

addFamily('상', 'array-covariance', '배열 공변성과 저장 예외', '참조형·예외', (v) => {
  const label = 'S' + v;
  return result(program('        Object[] slots = new String[2];\n        int caught = 0;\n        try {\n' +
    '            slots[0] = "' + label + '";\n            slots[1] = ' + (v + 1) + ';\n' +
    '        } catch (ArrayStoreException e) {\n            caught = 1;\n        }\n' +
    '        System.out.print(slots[0] + " " + (slots[1] == null) + " " + caught);'),
    label + ' true 1', '변수 타입은 Object[]지만 실제 배열은 String[]입니다. 숫자가 Integer로 박싱되어도 String[]에는 저장할 수 없어 ArrayStoreException이 발생합니다. 첫 칸의 저장은 유지됩니다.',
    ['실제 배열 타입은 String[]', '첫 칸에는 문자열 ' + label + ' 저장 성공', '둘째 칸의 Integer 저장에서 예외가 나며 둘째 칸은 null', 'catch에서 caught=1로 변경'],
    ['Object[] slots =', 'slots[0] =', 'slots[1] =', 'caught = 1']);
});

addFamily('상', 'comparator-order', '복합 Comparator 정렬 결과', '정렬', (v) => {
  const base = 3 + v;
  const rows = [[base, 3 + v], [base + 1, 2 + v], [base + 2, 5 - v], [base + 3, 4 + v % 2]];
  const sorted = [...rows].sort((a, b) => (a[0] % 3 - b[0] % 3) || (b[1] - a[1]));
  return result(program('        int[][] rows = {{' + rows.map(literal).join('}, {') + '}};\n' +
    '        Arrays.sort(rows, (a, b) -> {\n            int group = Integer.compare(a[0] % 3, b[0] % 3);\n' +
    '            return group != 0 ? group : Integer.compare(b[1], a[1]);\n        });\n' +
    '        System.out.print(rows[0][0] + " " + rows[1][0] + " " + rows[3][0]);'),
    sorted[0][0] + ' ' + sorted[1][0] + ' ' + sorted[3][0], '먼저 첫 값의 3으로 나눈 나머지를 오름차순 정렬합니다. 같은 그룹 안에서는 둘째 값을 내림차순 정렬한 뒤 새 배열 순서의 첫 값을 읽습니다.',
    ['초기 행의 첫 값 순서=' + rows.map((r) => r[0]).join(', '), '그룹·둘째 값 기준으로 정렬된 첫 값 순서=' + sorted.map((r) => r[0]).join(', '), '0·1·3번 행의 첫 값 출력'],
    ['int[][] rows =', 'Arrays.sort', 'System.out.print']);
});

addFamily('상', 'stream-lazy', 'Stream의 지연 실행과 limit', '스트림', (v) => {
  const input = Array.from({ length: 6 }, (_, i) => i + v + 1), parity = (v + 1) % 2, visited = [], selected = [];
  for (const x of input) {
    visited.push(x);
    if (x % 2 === parity) selected.push(x);
    if (selected.length === 2) break;
  }
  const sum = selected.reduce((a, b) => a + b * 2, 0);
  return result(program('        List<Integer> input = Arrays.asList(' + literal(input) + ');\n' +
    '        int[] seen = {0};\n        int result = input.stream()\n' +
    '            .filter(x -> { seen[0]++; return x % 2 == ' + parity + '; })\n' +
    '            .mapToInt(x -> x * 2)\n            .limit(2)\n            .sum();\n' +
    '        System.out.print(result + " " + seen[0]);'),
    sum + ' ' + visited.length, 'Stream 연산은 최종 sum()이 호출될 때 실행됩니다. limit(2)가 조건을 통과한 값 두 개만 요구하므로 뒤의 원소는 필터에서 확인하지 않고 seen도 더 증가하지 않습니다.',
    ['필터가 실제 확인한 원소=' + visited.join(', '), '조건을 통과해 두 배로 만든 원소=' + selected.join(', '), '합계=' + sum + ', 필터 실행 횟수=' + visited.length],
    ['seen[0]++', '.mapToInt', 'System.out.print']);
});

addFamily('상', 'deque-ends', 'Deque 양쪽 끝 삽입과 제거', '자료구조', (v) => {
  const a = 2 + v, b = 5 + v, c = 8 + v;
  return result(program('        Deque<Integer> deque = new ArrayDeque<>();\n        deque.addLast(' + a + ');\n' +
    '        deque.addLast(' + b + ');\n        deque.addFirst(' + c + ');\n' +
    '        int last = deque.removeLast();\n        int first = deque.removeFirst();\n' +
    '        deque.addLast(last + first);\n' +
    '        System.out.print(deque.peekFirst() + " " + deque.peekLast() + " " + deque.size());'),
    a + ' ' + (b + c) + ' 2', 'Deque는 양쪽 끝에서 삽입·삭제할 수 있습니다. addFirst와 addLast가 만드는 순서를 먼저 적고, 제거한 값을 다시 마지막에 더해 넣는 과정을 추적해야 합니다.',
    ['세 번 삽입한 뒤 앞→뒤 순서=' + c + ', ' + a + ', ' + b, '뒤에서 ' + b + ', 앞에서 ' + c + ' 제거해 남은 값=' + a, '마지막에 ' + (b + c) + '을 삽입하여 앞=' + a + ', 뒤=' + (b + c)],
    ['deque.addFirst', 'int last =', 'deque.addLast(last']);
});

addFamily('상', 'builder-alias', 'StringBuilder 별칭과 문자열 스냅샷', '문자열·참조', (v) => {
  const original = 'AB' + v + 'CD', changed = 'ZB' + v + 'CD' + (v + 1), part = 'B' + v;
  return result(program('        StringBuilder a = new StringBuilder("' + original + '");\n' +
    '        StringBuilder b = a;\n        String snapshot = a.toString();\n' +
    "        b.setCharAt(0, 'Z');\n" +
    '        a.append(' + (v + 1) + ');\n        String part = b.substring(1, 3);\n' +
    '        System.out.print(snapshot + " " + part + " " + a);'),
    original + ' ' + part + ' ' + changed, 'a와 b는 같은 가변 StringBuilder를 가리킵니다. toString()으로 만든 snapshot과 substring()의 결과는 독립적인 String이므로 이후 변경의 영향을 받지 않습니다.',
    ['snapshot은 변경 전 문자열 ' + original, 'b로 첫 글자를 바꾸면 a도 같은 객체라 Z로 변경', 'a에 숫자를 붙인 뒤 part=' + part + ', 최종 a=' + changed],
    ['String snapshot =', 'b.setCharAt', 'System.out.print']);
});

addFamily('상', 'overload-override', '오버로딩과 오버라이딩 동시 추적', '다형성', (v) => {
  const members = '    static class Base {\n        String pick(Object x) { return "BO"; }\n' +
    '        String pick(String x) { return "BS" + x.length(); }\n    }\n' +
    '    static class Child extends Base {\n        @Override String pick(Object x) { return "CO' + v + '"; }\n    }';
  return result(program('        Base ref = new Child();\n        Object a = "ab";\n        String b = "xyz";\n' +
    '        System.out.print(ref.pick(a) + " " + ref.pick(b));', members),
    'CO' + v + ' BS3', '먼저 선언 타입을 기준으로 오버로딩 메서드를 고릅니다. a는 Object여서 pick(Object)가 선택되고, 이 메서드는 Child가 오버라이딩했으므로 Child 구현이 실행됩니다. b는 pick(String)을 선택합니다.',
    ['a의 선언 타입 Object → pick(Object)를 선택', '실제 객체 Child의 오버라이딩 결과 CO' + v, 'b의 선언 타입 String → 상속받은 pick(String)의 결과 BS3'],
    ['Object a =', 'ref.pick(a)', 'ref.pick(b)']);
});

addFamily('상', 'graph-recursion', '순환 그래프 재귀와 방문 상태', '그래프·재귀', (v) => {
  const graph = [[1, 2], [2, 3], [0, 4], [4], [1]], weights = [2, 4, 1, 3, 5].map((x) => x + v);
  const start = v % 3, seen = Array(5).fill(false), order = [], visitTrace = [];
  let skips = 0;
  function walk(u) {
    if (seen[u]) { skips += 1; return 0; }
    seen[u] = true;
    order.push(u);
    visitTrace.push('노드 ' + u + ' 방문, 누적 방문 순서=' + order.join('→'));
    let sum = weights[u];
    for (const next of graph[u]) sum += walk(next);
    return sum;
  }
  const total = walk(start);
  const members = '    static StringBuilder order = new StringBuilder();\n    static int skips = 0;\n' +
    '    static int walk(int u, int[][] graph, int[] weight, boolean[] seen) {\n' +
    '        if (seen[u]) { skips++; return 0; }\n        seen[u] = true;\n        order.append(u);\n' +
    '        int sum = weight[u];\n        for (int next : graph[u]) sum += walk(next, graph, weight, seen);\n' +
    '        return sum;\n    }';
  return result(program('        int[][] graph = {{1, 2}, {2, 3}, {0, 4}, {4}, {1}};\n' +
    '        int[] weight = {' + literal(weights) + '};\n        boolean[] seen = new boolean[5];\n' +
    '        int total = walk(' + start + ', graph, weight, seen);\n' +
    '        System.out.print(order + " " + total + " " + skips);', members),
    order.join('') + ' ' + total + ' ' + skips, 'DFS 재귀에서 방문 여부를 먼저 검사해야 순환 간선을 다시 따라가지 않습니다. 처음 방문한 노드만 순서에 추가하고 가중치를 합산하며, 재방문은 skips만 증가시킵니다.',
    [...visitTrace, '이미 방문한 노드로 되돌아간 횟수=' + skips, '방문한 노드 가중치 합=' + total],
    [...visitTrace.map(() => 'order.append(u)'), 'if (seen[u])', 'System.out.print']);
});

export const javaCodeQuestions = questions;
