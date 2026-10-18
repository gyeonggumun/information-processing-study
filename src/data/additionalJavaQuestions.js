import { addCodeFamily, codeAnswer, javaProgram } from './additionalQuestionFactory.js';
const questions = [];
const add = (level, family, title, refs, build) => addCodeFamily(questions, 'Java', level, family, title, refs, build);
add('하', 'enum-navigation', '열거 상수의 순서와 저장 값', ['past-2025-3-q17'], v => {
  const names = ['WAIT', 'READY', 'RUN', 'PAUSE', 'END'], codes = [3, 5, 8, 13, 21], next = (v + 2) % 5;
  return codeAnswer(javaProgram(`        Phase p = Phase.values()[${v}];\n        Phase next = Phase.values()[(p.ordinal() + 2) % 5];\n        System.out.print(p.name() + " " + next.ordinal() + " " + next.code);`, '    enum Phase {\n        WAIT(3), READY(5), RUN(8), PAUSE(13), END(21);\n        final int code;\n        Phase(int code) { this.code = code; }\n    }'), `${names[v]} ${next} ${codes[next]}`,
    'values는 선언 순서의 상수 배열이고 ordinal은 0부터 시작하는 위치입니다. 생성자로 저장한 code는 위치 번호와 별개입니다. 이동한 인덱스가 배열 길이를 넘으면 나머지 연산으로 처음 위치부터 다시 선택합니다.',
    [`처음 상수는 ${names[v]}이고 ordinal은 ${v}입니다.`, `두 칸 이동한 인덱스는 (${v}+2)%5=${next}입니다.`, `해당 상수의 별도 code는 ${codes[next]}입니다.`], ['Phase p =', 'Phase next =', 'System.out.print']);
});
add('하', 'string-addition-chain', '정수 덧셈과 문자열 연결의 경계', ['past-2026-1-q17'], v => {
  const a = 4 + v, b = 7 + v;
  return codeAnswer(javaProgram(`        int a = ${a}, b = ${b};\n        String left = a + b + "Q";\n        String right = "Q" + a + b;\n        System.out.print(left + " " + right + " " + ('A' + ${v}));`), `${a + b}Q Q${a}${b} ${65 + v}`,
    '같은 우선순위의 +는 왼쪽부터 계산합니다. 문자열을 만나기 전의 두 int는 덧셈이고 문자열 뒤의 +는 연결입니다. char와 int의 덧셈은 정수 연산으로 승격되므로 문자 자체가 아니라 문자 코드의 정수 결과를 출력합니다.',
    [`a+b는 먼저 ${a + b}가 되어 ${a + b}Q입니다.`, `문자열 Q 뒤에서는 각각 연결하여 Q${a}${b}가 됩니다.`, `'A'+${v}는 정수 ${65 + v}입니다.`], ['String left =', 'String right =', 'System.out.print']);
});
add('중', 'field-method-alias', '부모 필드 수정과 자식 메서드 호출', ['past-2024-3-q11', 'past-2026-2-q15'], v => {
  const base = 5 + v, child = 15 + v, delta = 3 + v;
  return codeAnswer(javaProgram(`        Parent p = new Child();\n        Child c = (Child)p;\n        p.value += ${delta};\n        c.value += 2;\n        System.out.print(p.value + " " + c.value + " " + p.read());`, `    static class Parent {\n        int value = ${base};\n        int read() { return value; }\n    }\n    static class Child extends Parent {\n        int value = ${child};\n        int read() { return super.value * 2 + value; }\n    }`), `${base + delta} ${child + 2} ${(base + delta) * 2 + child + 2}`,
    '하나의 Child 객체 안에도 숨겨진 부모 value와 자식 value는 별도로 존재합니다. 필드 접근은 참조의 선언 타입에 따라 달라지지만 read 호출은 실제 객체 Child의 재정의를 실행합니다. 같은 객체를 가리킨다고 두 value가 같은 저장 위치는 아닙니다.',
    [`p.value는 부모 필드이므로 ${base + delta}로 갱신합니다.`, `c.value는 자식 필드이므로 ${child + 2}로 갱신합니다.`, `재정의 read는 부모 값의 두 배와 자식 값을 더해 ${(base + delta) * 2 + child + 2}입니다.`], ['p.value +=', 'c.value +=', 'int read() { return super']);
});
add('중', 'catch-finally-counter', '예외 분기와 finally의 누적 상태', ['past-2025-1-q5', 'past-2024-3-q18'], v => {
  const n = v + 2, value = n % 2 === 0 ? -n : n * 3;
  return codeAnswer(javaProgram(`        int first = run(${n});\n        int second = run(${n + 1});\n        System.out.print(first + " " + second + " " + total);`, '    static int total = 0;\n    static int run(int n) {\n        try {\n            total += n;\n            if (n % 2 == 0) throw new IllegalArgumentException();\n            return n * 3;\n        } catch (IllegalArgumentException e) {\n            return -n;\n        } finally {\n            total += 10;\n        }\n    }'), `${value} ${(n + 1) % 2 === 0 ? -(n + 1) : (n + 1) * 3} ${2 * n + 21}`,
    '짝수 인수는 예외를 발생시켜 catch의 음수 값을 반환하고 홀수 인수는 try의 세 배를 반환합니다. 어느 경로로 반환하든 finally는 실행되어 static total에 10을 더합니다. 반환값과 공유 필드의 누적값은 서로 다른 상태입니다.',
    [`run(${n})의 반환값은 ${value}입니다.`, `다음 인수 ${n + 1}은 반대 경로로 반환합니다.`, `total은 두 인수와 finally의 20을 합한 ${2 * n + 21}입니다.`], ['int first =', 'int second =', 'total += 10']);
});
add('중', 'nested-array-clone', '이차원 배열의 바깥 복사와 행 교체', ['past-2024-2-q1', 'past-2025-2-q15'], v => {
  const n = v + 3;
  return codeAnswer(javaProgram(`        int[][] a = {{${n}, ${n + 2}}, {${n + 4}, ${n + 6}}};\n        int[][] b = a.clone();\n        b[0][1] += 5;\n        b[1] = new int[] {${n + 8}, ${n + 9}};\n        b[1][0]++;\n        System.out.print(a[0][1] + " " + a[1][0] + " " + b[1][0] + " " + (a[0] == b[0]));`), `${n + 7} ${n + 4} ${n + 9} true`,
    'a.clone은 바깥 배열만 새로 만들고 각 행 배열의 참조는 복사합니다. 첫 행의 원소 변경은 a에도 반영되지만 b[1]에 새 행을 대입한 뒤에는 둘째 행만 공유가 끊어집니다. ==는 행의 값 목록이 아니라 참조 동일성을 비교합니다.',
    [`공유 첫 행의 둘째 원소는 ${n + 7}입니다.`, `a의 둘째 행 첫 값은 ${n + 4}이고 b의 새 행 첫 값은 ${n + 9}입니다.`, '첫 행의 참조는 여전히 같아 비교 결과는 true입니다.'], ['b[0][1] +=', 'b[1] =', 'System.out.print']);
});
add('상', 'bounded-generic-overload', '제네릭 상한과 오버로딩의 선언 타입', ['past-2024-3-q19'], v => {
  const n = v + 12;
  return codeAnswer(javaProgram(`        Box<Integer> box = new Box<>(${n});\n        Object alias = box.value;\n        System.out.print(box.emit() + select(box.value) + select(alias) + " " + box.value);`, '    static String select(Object n) { return "O"; }\n    static String select(Number n) { return "N"; }\n    static String select(Integer n) { return "I"; }\n    static class Box<T extends Number> {\n        T value;\n        Box(T value) { this.value = value; }\n        String emit() { return select(value); }\n    }'), `NIO ${n}`,
    'Box 내부의 T는 Number 상한을 가지므로 select(Number)를 선택합니다. main에서 box.value의 타입은 Integer여서 Integer 오버로드를 선택하고 Object 별칭에서는 Object 오버로드를 선택합니다. 같은 객체라도 오버로딩 선택에 사용하는 호출식의 선언 타입이 다릅니다.',
    ['emit 안의 T 상한은 Number라서 N입니다.', 'main의 Integer 값은 I, Object 별칭은 O를 선택합니다.', `실제 저장한 정수는 ${n}이므로 NIO 뒤에 이 값을 출력합니다.`], ['String emit()', 'Object alias =', 'System.out.print']);
});
add('상', 'constructor-dispatch-state', '생성자 중 재정의 호출과 필드 초기화', ['past-2024-1-q10', 'past-2025-1-q13'], v => {
  const n = v + 4;
  return codeAnswer(javaProgram(`        Child c = new Child();\n        Parent p = c;\n        System.out.print(p.saved + " " + p.value + " " + c.value + " " + p.read());`, `    static class Parent {\n        int value = ${n};\n        int saved;\n        Parent() { saved = read(); }\n        int read() { return value; }\n    }\n    static class Child extends Parent {\n        int value = ${n + 5};\n        Child() { value += 2; }\n        int read() { return super.value + value; }\n    }`), `${n} ${n} ${n + 7} ${2 * n + 7}`,
    '부모 필드 초기화와 생성자가 먼저 실행됩니다. 그 생성자에서 read를 호출해도 실제 객체의 자식 재정의가 실행되지만 자식 필드의 명시적 초기화는 아직 전이어서 자식 value는 기본값 0입니다. 생성이 끝난 뒤에는 자식 필드 초기화와 생성자의 덧셈까지 반영됩니다.',
    [`부모 생성자 시점의 read는 부모 값 ${n}과 자식 기본값 0을 더해 saved=${n}입니다.`, `자식 value는 명시 초기화 후 2를 더해 ${n + 7}입니다.`, `최종 read는 ${n}+${n + 7}=${2 * n + 7}입니다.`], ['Parent() {', 'Child() {', 'System.out.print']);
});
add('상', 'overloaded-recursive-counter', '오버로드 선택 후 분기 재귀와 공유 카운터', ['past-2025-1-q20', 'past-2023-3-q11'], v => {
  const n = v + 4; let count = 0;
  const run = x => { count++; return x <= 1 ? x + 2 : run(Math.floor(x / 2)) + run(x - 2); };
  const first = run(n), saved = count, second = run(String(n + 2).length);
  return codeAnswer(javaProgram(`        int first = run(${n});\n        int saved = calls;\n        int second = run("${n + 2}");\n        System.out.print(first + " " + saved + " " + second + " " + calls);`, '    static int calls = 0;\n    static int run(int n) {\n        calls++;\n        if (n <= 1) return n + 2;\n        int left = run(n / 2);\n        int right = run(n - 2);\n        return left + right;\n    }\n    static int run(String text) {\n        return run(text.length());\n    }'), `${first} ${saved} ${second} ${count}`,
    '정수 인수와 문자열 인수는 컴파일 시 서로 다른 run 오버로드를 선택합니다. 문자열 오버로드는 문자열의 숫자 값을 해석하지 않고 길이를 정수 오버로드에 전달합니다. 정수 재귀의 두 갈래를 순서대로 계산하고 static calls는 두 최상위 호출 사이에도 유지됩니다.',
    [`첫 정수 재귀의 값은 ${first}, 진입 횟수는 ${saved}입니다.`, `문자열 "${n + 2}"의 길이 ${String(n + 2).length}를 정수 run에 전달하여 ${second}를 반환합니다.`, `문자열 오버로드 자체는 calls를 늘리지 않아 최종 횟수는 ${count}입니다.`], ['int first =', 'return run(text.length())', 'System.out.print']);
});
export const additionalJavaQuestions = questions;
