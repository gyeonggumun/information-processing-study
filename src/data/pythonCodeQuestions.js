// 정보처리기사 실기 Python 출제 개념을 조합한 창작 변형 문제입니다.
const questions = [];
const levels = { 하: 'easy', 중: 'medium', 상: 'hard' };
const literal = (values) => values.join(', ');
const program = (body, helpers = '') => (helpers ? helpers + '\n\n' : '') + body;
const result = (code, answer, explanation, trace, anchors) => ({
  code, answerText: String(answer), explanation, trace, anchors,
});

function addFamily(difficulty, family, title, tag, build) {
  for (let variant = 0; variant < 5; variant += 1) {
    const number = questions.filter((q) => q.difficulty === difficulty).length + 1;
    questions.push({
      id: 'python-' + levels[difficulty] + '-' + String(number).padStart(3, '0'),
      language: 'Python', difficulty, family, variant: variant + 1, number, title, tag,
      prompt: '다음 Python 프로그램의 표준 출력 결과를 실행 순서대로 작성하세요.',
      source: '실기 출제 개념 기반 창작 변형',
      ...build(variant),
    });
  }
}

// 하: 산술·조건·반복·슬라이싱·딕셔너리·기본 함수와 재귀.
addFamily('하', 'floor-modulo', '정수 나눗셈과 나머지', '연산자', (v) => {
  const a = 17 + v * 3, b = 2 + v % 3, q = Math.floor(a / b), r = a % b;
  return result(program('a, b = ' + a + ', ' + b + '\nq = a // b\nr = a % b\nprint(q, r, q * b + r)'),
    q + ' ' + r + ' ' + a, '//는 정수 몫을 구하고 %는 나머지를 구합니다. 양수끼리 계산할 때 몫×제수+나머지는 원래 수와 같습니다.',
    [a + ' // ' + b + '의 몫=' + q, a + ' % ' + b + '의 나머지=' + r, '검산 결과=' + a],
    ['q =', 'r =', 'print(']);
});

addFamily('하', 'augmented-precedence', '산술 우선순위와 복합 대입', '연산자', (v) => {
  const x = 5 + v, y = 2 + v % 3, increased = x + y * 2, final = Math.floor(increased / 3);
  return result(program('x, y = ' + x + ', ' + y + '\nx += y * 2\nx //= 3\nprint(x, y)'),
    final + ' ' + y, '곱셈이 덧셈보다 먼저 실행됩니다. x += 식은 계산 결과를 x에 다시 저장하고, //=는 정수 몫을 x에 저장합니다.',
    ['y * 2=' + (y * 2), 'x에 더하면 ' + increased, '3으로 나눈 몫 ' + final + '과 변경되지 않은 y=' + y + ' 출력'],
    ['x +=', 'x +=', 'x //=']);
});

addFamily('하', 'conditional-expression', '조건 표현식과 분기', '조건문', (v) => {
  const a = 4 + v, b = 8 - v, larger = Math.max(a, b), answer = larger % 2 === 0 ? larger / 2 : larger * 2;
  return result(program('a, b = ' + a + ', ' + b + '\nm = a if a > b else b\n' +
    'if m % 2 == 0:\n    m //= 2\nelse:\n    m *= 2\nprint(m)'),
    answer, '조건 표현식은 조건이 참이면 앞의 값, 거짓이면 else 뒤의 값을 선택합니다. 이어서 짝수이면 절반, 홀수이면 두 배로 바꿉니다.',
    ['a=' + a + ', b=' + b + '에서 m=' + larger + ' 선택', larger % 2 === 0 ? '짝수여서 2로 나눔' : '홀수여서 2배로 만듦', '최종 m=' + answer],
    ['m = a if', 'if m % 2', 'print(m)']);
});

addFamily('하', 'range-step', 'range의 끝값과 증가 폭', '반복문', (v) => {
  const start = 1 + v % 2, stop = 8 + v, selected = [];
  for (let i = start; i < stop; i += 2) selected.push(i);
  const sum = selected.reduce((a, b) => a + b, 0);
  return result(program('total = 0\nfor i in range(' + start + ', ' + stop + ', 2):\n    total += i\nprint(total, i)'),
    sum + ' ' + selected.at(-1), 'range(시작, 끝, 간격)은 시작을 포함하고 끝은 제외합니다. 반복이 끝난 뒤에도 Python의 for 변수 i에는 마지막 반복 값이 남아 있습니다.',
    ['range가 만드는 값은 ' + selected.join(', '), '누적 합계=' + sum, '반복 후 i=' + selected.at(-1)],
    ['for i in range', 'total += i', 'print(total']);
});

addFamily('하', 'continue-filter', 'continue로 일부 값 건너뛰기', '반복문', (v) => {
  const n = 6 + v, divisor = 2 + v % 2, picked = Array.from({ length: n }, (_, i) => i + 1).filter((x) => x % divisor !== 0);
  const sum = picked.reduce((a, b) => a + b, 0);
  return result(program('total = 0\nfor i in range(1, ' + (n + 1) + '):\n' +
    '    if i % ' + divisor + ' == 0:\n        continue\n    total += i\nprint(total)'),
    sum, 'continue가 실행되면 현재 반복의 나머지를 건너뛰고 다음 값으로 넘어갑니다. 제외 조건에 해당하지 않는 값만 합산합니다.',
    [divisor + '의 배수를 건너뜀', '합산하는 값은 ' + picked.join(', '), '최종 합계=' + sum],
    ['continue', 'total += i', 'print(total)']);
});

addFamily('하', 'list-slice', '리스트 인덱스와 슬라이싱', '리스트', (v) => {
  const values = [3 + v, 7 + v, 2 + v, 9 + v, 5 + v, 4 + v], slice = [values[1], values[3], values[5]];
  return result(program('values = [' + literal(values) + ']\nselected = values[1::2]\nprint(selected[0], selected[-1], sum(selected))'),
    slice[0] + ' ' + slice[2] + ' ' + slice.reduce((a, b) => a + b, 0), 'values[1::2]는 인덱스 1에서 시작해 두 칸씩 이동합니다. -1 인덱스는 선택된 리스트의 마지막 원소를 뜻합니다.',
    ['선택한 인덱스는 1, 3, 5', 'selected=' + slice.join(', '), '첫 값·마지막 값·합계를 출력'],
    ['selected =', 'selected =', 'print(']);
});

addFamily('하', 'string-slice', '문자열 슬라이싱과 길이', '문자열', (v) => {
  const word = ['DATABASE', 'NETWORK', 'PROGRAM', 'SOFTWARE', 'COMPUTER'][v], start = v % 2, stop = 7, part = word.slice(start, stop).split('').filter((_, i) => i % 2 === 0).join('');
  return result(program('text = "' + word + '"\npart = text[' + start + ':' + stop + ':2]\nprint(part, len(part))'),
    part + ' ' + part.length, '문자열 슬라이스 [시작:끝:간격]은 끝 인덱스를 포함하지 않습니다. 시작부터 두 칸씩 선택한 뒤 len으로 길이를 계산합니다.',
    ['시작=' + start + ', 끝=' + stop + '(제외), 간격=2', '선택된 문자열=' + part, '길이=' + part.length],
    ['part = text', 'part = text', 'print(part']);
});

addFamily('하', 'dictionary-overwrite', '딕셔너리 키 덮어쓰기', '딕셔너리', (v) => {
  const first = 2 + v, second = 7 + v;
  return result(program('scores = {"a": ' + first + ', "b": ' + (v + 3) + '}\nscores["a"] = ' + second + '\n' +
    'print(len(scores), scores["a"], scores.get("c", 9))'),
    '2 ' + second + ' 9', '딕셔너리에서 같은 키에 새 값을 넣으면 항목 수는 늘지 않고 기존 값만 바뀝니다. 없는 키를 get으로 읽을 때는 지정한 기본값을 사용합니다.',
    ['처음 키는 a와 b 두 개', 'a의 값이 ' + first + '에서 ' + second + '로 교체', 'c는 없어 기본값 9 출력'],
    ['scores =', 'scores["a"] =', 'print(len']);
});

addFamily('하', 'function-default', '함수의 기본 매개변수', '함수', (v) => {
  const base = 3 + v, defaultStep = 2 + v, explicit = 5 + v;
  const helper = 'def add(x, step=' + defaultStep + '):\n    return x + step';
  return result(program('print(add(' + base + '), add(' + base + ', ' + explicit + '))', helper),
    (base + defaultStep) + ' ' + (base + explicit), '함수를 호출할 때 step을 생략하면 정의 시 지정한 기본값이 사용됩니다. 두 번째 호출처럼 직접 값을 전달하면 기본값 대신 전달한 값이 사용됩니다.',
    ['첫 호출은 기본 step=' + defaultStep + '을 사용해 ' + (base + defaultStep), '둘째 호출은 전달한 step=' + explicit + '을 사용해 ' + (base + explicit), '두 반환값을 순서대로 출력'],
    ['def add', 'return x + step', 'print(add']);
});

addFamily('하', 'recursive-sum', '재귀 호출의 누적 합계', '재귀', (v) => {
  const n = 3 + v, answer = n * (n + 1) / 2;
  const helper = 'def total(n):\n    if n == 0:\n        return 0\n    return n + total(n - 1)';
  return result(program('print(total(' + n + '))', helper),
    answer, 'n을 1씩 줄여 0까지 호출한 뒤, 되돌아오면서 현재 n을 반환값에 더합니다. 종료 조건이 없으면 재귀가 끝나지 않습니다.',
    [n + '부터 0까지 재귀 호출', 'n=0에서 0을 반환', '되돌아오며 1부터 ' + n + '까지 더해 ' + answer],
    ['return n +', 'if n == 0', 'return n +']);
});

// 중: 참조 공유·가변 기본값·가변 인수·클로저·컴프리헨션·예외·상속.
addFamily('중', 'list-alias-copy', '리스트 별칭과 얕은 복사', '참조형', (v) => {
  const first = 3 + v, second = 7 + v, delta = v + 1;
  return result(program('original = [' + first + ', ' + second + ']\nalias = original\ncopy = original[:]\n' +
    'alias[0] += ' + delta + '\ncopy[1] += 2\nprint(original[0], original[1], copy[1])'),
    (first + delta) + ' ' + second + ' ' + (second + 2), 'alias는 원본 리스트를 그대로 가리키지만 [:]는 별도 리스트를 만듭니다. 원본의 첫 값만 alias 변경에 영향을 받습니다.',
    ['alias는 원본과 같은 객체이고 copy는 새 리스트', 'alias 수정 후 original[0]=' + (first + delta), 'copy[1]=' + (second + 2) + '이지만 original[1]=' + second],
    ['copy =', 'alias[0] +=', 'copy[1] +=']);
});

addFamily('중', 'mutable-default', '가변 기본 인수의 재사용', '함수·리스트', (v) => {
  const a = 2 + v, b = 3 + v, c = 4 + v;
  const helper = 'def collect(x, bucket=[]):\n    bucket.append(x)\n    return sum(bucket)';
  return result(program('print(collect(' + a + '), collect(' + b + '), collect(' + c + '))', helper),
    a + ' ' + (a + b) + ' ' + (a + b + c), '기본 리스트는 함수 정의 시 한 번 생성되어 인수를 생략한 호출끼리 공유됩니다. 호출할 때마다 이전 원소가 남아 합계가 누적됩니다.',
    ['첫 호출 뒤 기본 리스트=[' + a + ']', '둘째 호출 뒤 기본 리스트=[' + a + ', ' + b + ']', '셋째 호출 뒤 기본 리스트=[' + a + ', ' + b + ', ' + c + ']'],
    ['bucket.append', 'bucket.append', 'bucket.append']);
});

addFamily('중', 'variadic-arguments', '*args와 **kwargs의 값 결합', '함수', (v) => {
  const base = 2 + v, x = 3 + v, y = 4 + v, bonus = 5 + v, scale = 2 + v % 2;
  const total = (base + x + y + bonus) * scale;
  const helper = 'def combine(base, *nums, scale=2, **extra):\n' +
    '    return (base + sum(nums) + extra.get("bonus", 0)) * scale';
  return result(program('print(combine(' + base + ', ' + x + ', ' + y + ', scale=' + scale + ', bonus=' + bonus + '))', helper),
    total, '*nums는 추가 위치 인수를 튜플로, **extra는 추가 키워드 인수를 딕셔너리로 받습니다. 각 값을 합한 뒤 scale을 곱합니다.',
    ['nums=(' + x + ', ' + y + '), bonus=' + bonus, '곱하기 전 합계=' + (base + x + y + bonus), 'scale=' + scale + '을 곱해 ' + total],
    ['def combine', 'return (base', 'print(combine']);
});

addFamily('중', 'late-binding', '반복문 클로저의 늦은 바인딩', '클로저', (v) => {
  const start = 2 + v, last = start + 2;
  return result(program('funcs = []\nfor i in range(' + start + ', ' + (start + 3) + '):\n' +
    '    funcs.append(lambda: i)\nprint(funcs[0](), funcs[1](), funcs[2]())'),
    last + ' ' + last + ' ' + last, '람다는 작성 당시 i의 값이 아니라 호출 시점의 같은 변수 i를 읽습니다. 반복이 끝나면 i가 마지막 값이므로 세 함수가 같은 값을 반환합니다.',
    ['반복 중 람다 세 개가 같은 변수 i를 캡처', '반복 종료 후 i=' + last, '세 함수를 호출하면 모두 ' + last + ' 반환'],
    ['funcs.append', 'for i in range', 'print(funcs']);
});

addFamily('중', 'filtered-comprehension', '조건부 리스트 컴프리헨션', '컴프리헨션', (v) => {
  const values = Array.from({ length: 6 }, (_, i) => i + v + 1), parity = v % 2, selected = values.filter((x) => x % 2 === parity);
  const squares = selected.map((x) => x * x), sum = squares.reduce((a, b) => a + b, 0);
  return result(program('values = [' + literal(values) + ']\nout = [x * x for x in values if x % 2 == ' + parity + ']\n' +
    'print(out[0], sum(out), len(out))'),
    squares[0] + ' ' + sum + ' ' + squares.length, '컴프리헨션의 if 조건을 통과한 값만 x*x로 변환되어 순서대로 새 리스트에 들어갑니다. 원본 리스트는 바뀌지 않습니다.',
    ['조건을 통과한 값=' + selected.join(', '), '제곱한 리스트=' + squares.join(', '), '첫 값·합계·개수=' + squares[0] + ', ' + sum + ', ' + squares.length],
    ['out =', 'out =', 'print(out']);
});

addFamily('중', 'try-except-finally', '예외 처리와 finally 순서', '예외', (v) => {
  const start = 4 + v, raised = v % 2 === 0, before = start + (raised ? 3 : 2), answer = before * 2;
  return result(program('x = ' + start + '\ntry:\n    if ' + v + ' % 2 == 0:\n        raise ValueError()\n' +
    '    x += 2\nexcept ValueError:\n    x += 3\nfinally:\n    x *= 2\nprint(x)'),
    answer, '예외가 발생하면 try 블록의 뒤 문장을 건너뛰고 except로 이동합니다. finally는 예외 여부와 관계없이 마지막에 실행됩니다.',
    [raised ? 'ValueError를 발생시켜 try의 x += 2를 건너뜀' : '예외 없이 try에서 x에 2를 더함', raised ? 'except에서 3을 더해 x=' + before : 'except는 실행하지 않아 x=' + before, 'finally에서 두 배로 바꿔 ' + answer],
    ['if ' + v, raised ? 'x += 3' : 'x += 2', 'x *= 2']);
});

addFamily('중', 'inherit-super', '오버라이딩과 super 호출', '상속', (v) => {
  const base = 2 + v, delta = 3 + v;
  const helper = 'class Base:\n    def value(self):\n        return ' + base + '\n\n' +
    'class Child(Base):\n    def value(self):\n        return super().value() + ' + delta;
  return result(program('item = Child()\nprint(item.value())', helper),
    base + delta, 'Child가 value를 재정의하므로 Child.value가 호출됩니다. 그 안에서 super().value()로 Base 구현을 실행한 뒤 추가 값을 더합니다.',
    ['Child 객체의 value 메서드를 찾음', 'super().value()가 ' + base + ' 반환', delta + '을 더해 ' + (base + delta) + ' 출력'],
    ['item = Child()', 'super().value()', 'print(item']);
});

addFamily('중', 'enumerate-zip', 'zip과 enumerate의 결합', '반복', (v) => {
  const left = [3 + v, 5 + v, 7 + v], right = [1 + v % 2, 2 + v % 2, 4 + v % 2];
  const parts = left.map((x, i) => (i + 1) * (x - right[i])), score = parts.reduce((a, b) => a + b, 0);
  return result(program('left = [' + literal(left) + ']\nright = [' + literal(right) + ']\nscore = 0\n' +
    'for index, (a, b) in enumerate(zip(left, right)):\n    score += (index + 1) * (a - b)\nprint(score)'),
    score, 'zip은 같은 위치 원소를 묶고 enumerate는 묶음에 0부터 시작하는 인덱스를 붙입니다. 각 차이에 index+1을 곱해 누적합니다.',
    ['각 위치의 차이는 ' + left.map((x, i) => x - right[i]).join(', '), '가중 합 항목은 ' + parts.join(', '), '최종 score=' + score],
    ['enumerate(zip', 'score +=', 'print(score)']);
});

addFamily('중', 'dict-comprehension', '중복 키를 포함한 딕셔너리 컴프리헨션', '딕셔너리', (v) => {
  const first = 2 + v, second = 7 + v, other = 4 + v;
  return result(program('pairs = [("a", ' + first + '), ("b", ' + other + '), ("a", ' + second + ')]\n' +
    'result = {key: value for key, value in pairs}\nprint(len(result), result["a"], sum(result.values()))'),
    '2 ' + second + ' ' + (second + other), '딕셔너리 컴프리헨션도 앞에서부터 항목을 넣습니다. 같은 키 a가 다시 나오면 기존 값이 새 값으로 바뀌고 키 개수는 두 개로 유지됩니다.',
    ['첫 a의 값=' + first + ', b의 값=' + other, '뒤의 a가 ' + second + '로 덮어씀', '키 2개, 값 합계=' + (second + other)],
    ['pairs =', 'result =', 'print(len']);
});

addFamily('중', 'star-unpack', '별표 언패킹과 원본 리스트', '시퀀스', (v) => {
  const values = [2 + v, 3 + v, 4 + v, 5 + v, 6 + v], delta = v + 1;
  const middleSum = values[1] + delta + values[2] + values[3];
  return result(program('values = [' + literal(values) + ']\nfirst, *middle, last = values\n' +
    'middle[0] += ' + delta + '\nprint(first, last, sum(middle), values[1])'),
    values[0] + ' ' + values[4] + ' ' + middleSum + ' ' + values[1], '별표 언패킹의 middle은 원본에서 값을 모아 만든 새 리스트입니다. middle의 원소를 변경해도 정수값으로 이루어진 원본 values의 원소는 바뀌지 않습니다.',
    ['first=' + values[0] + ', last=' + values[4], 'middle 첫 값에 ' + delta + '을 더해 중간 합=' + middleSum, '원본 values[1]=' + values[1] + '은 그대로'],
    ['first, *middle', 'middle[0] +=', 'print(first']);
});

// 상: 중첩 참조·데코레이터·제너레이터·메모이제이션·MRO·프로퍼티·그래프.
addFamily('상', 'nested-shallow-copy', '중첩 리스트의 얕은 복사와 별칭', '참조형', (v) => {
  const first = 3 + v, second = 9 + v, delta = v + 1;
  return result(program('rows = [[' + first + ', ' + (5 + v) + '], [' + (7 + v) + ', ' + second + ']]\n' +
    'outer = rows.copy()\nalias = rows[0]\nouter[0][0] += ' + delta + '\n' +
    'outer[1] = outer[1].copy()\nouter[1][1] += 2\n' +
    'print(rows[0][0], rows[1][1], outer[1][1], alias[0])'),
    (first + delta) + ' ' + second + ' ' + (second + 2) + ' ' + (first + delta),
    '바깥 리스트만 복사하면 안쪽 리스트 참조는 공유됩니다. 첫 행 수정은 원본에도 반영되지만 둘째 행을 따로 복사한 후의 수정은 원본과 분리됩니다.',
    ['outer와 rows는 다른 바깥 리스트지만 첫 행은 공유', '첫 행 수정으로 rows[0][0]과 alias[0]이 모두 ' + (first + delta), '둘째 행은 재복사하여 원본=' + second + ', outer=' + (second + 2)],
    ['outer = rows.copy', 'outer[0][0] +=', 'outer[1][1] +=']);
});

addFamily('상', 'decorator-state', '데코레이터의 클로저 상태 누적', '데코레이터', (v) => {
  const factor = 2 + v, a = 3 + v, b = 4 + v;
  const helper = 'def decorate(fn):\n    calls = 0\n    def wrapper(x):\n        nonlocal calls\n' +
    '        calls += 1\n        return fn(x) + calls\n    return wrapper\n\n' +
    '@decorate\ndef compute(x):\n    return x * ' + factor;
  return result(program('print(compute(' + a + '), compute(' + b + '), compute(' + a + '))', helper),
    (a * factor + 1) + ' ' + (b * factor + 2) + ' ' + (a * factor + 3),
    '@decorate는 compute를 wrapper로 감쌉니다. wrapper 안의 nonlocal calls는 호출 사이에 유지되므로 같은 인수를 다시 주어도 호출 횟수만큼 결과가 달라집니다.',
    ['첫 호출: 본래 계산 ' + (a * factor) + ' + 호출 횟수 1', '둘째 호출: 본래 계산 ' + (b * factor) + ' + 호출 횟수 2', '셋째 호출: 본래 계산 ' + (a * factor) + ' + 호출 횟수 3'],
    ['calls += 1', 'calls += 1', 'calls += 1']);
});

addFamily('상', 'generator-send', '제너레이터 send와 재개 지점', '제너레이터', (v) => {
  const start = 3 + v;
  const helper = 'def sequence(start):\n    current = start\n    while current < start + 6:\n' +
    '        step = yield current\n        current += step if step is not None else 1';
  return result(program('g = sequence(' + start + ')\nfirst = next(g)\nsecond = g.send(2)\n' +
    'third = next(g)\nprint(first, second, third)', helper),
    start + ' ' + (start + 2) + ' ' + (start + 3),
    'next는 제너레이터를 다음 yield까지 진행합니다. send(2)는 멈춘 yield 표현식의 값으로 2를 전달하므로 current가 2 증가하고, 다음 next는 None을 보내 1 증가시킵니다.',
    ['첫 next에서 current=' + start + '을 산출', 'send(2)로 이전 yield가 2를 받아 current=' + (start + 2), '다음 next에서 None을 받아 current=' + (start + 3)],
    ['first = next', 'second = g.send', 'third = next']);
});

addFamily('상', 'memo-recursion', '메모이제이션 재귀와 캐시 적중', '재귀·딕셔너리', (v) => {
  const n = 4 + v, memo = new Map(), computed = [];
  let hits = 0;
  function fib(x) {
    if (memo.has(x)) { hits += 1; return memo.get(x); }
    const value = x < 2 ? x + 1 : fib(x - 1) + fib(x - 2);
    memo.set(x, value); computed.push(x);
    return value;
  }
  const answer = fib(n);
  const helper = 'def fib(n, memo):\n    if n in memo:\n        memo["hits"] += 1\n' +
    '        return memo[n]\n    if n < 2:\n        memo[n] = n + 1\n    else:\n' +
    '        memo[n] = fib(n - 1, memo) + fib(n - 2, memo)\n    return memo[n]';
  return result(program('memo = {"hits": 0}\nvalue = fib(' + n + ', memo)\n' +
    'print(value, len(memo) - 1, memo["hits"])', helper),
    answer + ' ' + computed.length + ' ' + hits,
    '한 번 계산한 n의 결과를 memo에 저장합니다. 같은 n을 다시 만나면 재귀 호출 없이 저장된 값을 반환하고 hits가 증가합니다. 문자열 키 hits는 계산한 n의 개수에서 제외합니다.',
    ['새로 계산한 n의 순서=' + computed.join(', '), '캐시에서 바로 꺼낸 횟수=' + hits, '최종 값=' + answer + ', 저장된 n의 개수=' + computed.length],
    ['memo[n] =', 'if n in memo', 'print(value']);
});

addFamily('상', 'multiple-inheritance-mro', '다중 상속의 MRO와 super 연결', '상속', (v) => {
  const base = 2 + v, multiplier = 2 + v % 2, addition = 3 + v, answer = base * multiplier + addition;
  const helper = 'class Root:\n    def value(self):\n        return ' + base + '\n\n' +
    'class A(Root):\n    def value(self):\n        return super().value() + ' + addition + '\n\n' +
    'class B(Root):\n    def value(self):\n        return super().value() * ' + multiplier + '\n\n' +
    'class C(A, B):\n    pass';
  return result(program('item = C()\nprint(item.value(), C.__mro__[1].__name__, C.__mro__[2].__name__)', helper),
    answer + ' A B', 'C의 메서드 탐색 순서는 C→A→B→Root입니다. A의 super()는 곧바로 Root가 아니라 MRO상의 다음 클래스 B를 부릅니다. 따라서 Root의 반환값에 B의 곱셈을 적용한 뒤 A의 덧셈을 적용합니다.',
    ['MRO의 앞부분은 C→A→B→Root', 'Root의 ' + base + '에 B의 곱셈을 적용해 ' + (base * multiplier), 'A에서 ' + addition + '을 더해 ' + answer],
    ['class C(A, B)', 'return super().value() *', 'return super().value() +']);
});

addFamily('상', 'finally-return', 'finally의 반환값 덮어쓰기', '예외·반환', (v) => {
  const a = 2 + v, b = 3 + v;
  const outcome = (n) => n > 3 ? n * 2 : n % 2 === 0 ? n + 1 : n + 2;
  const reason = (n) => n > 3 ? 'finally의 return이 이전 반환값을 덮어써 ' + outcome(n) : 'finally가 반환하지 않아 ' + outcome(n);
  const helper = 'def calc(n):\n    try:\n        if n % 2 == 0:\n            return n + 1\n' +
    '        raise ValueError()\n    except ValueError:\n        return n + 2\n' +
    '    finally:\n        if n > 3:\n            return n * 2';
  return result(program('print(calc(' + a + '), calc(' + b + '))', helper),
    outcome(a) + ' ' + outcome(b), 'try나 except의 return이 결정되어도 finally는 마지막에 실행됩니다. finally에서도 return하면 이전 반환값이 덮어써지고, 그렇지 않으면 기존 반환값이 유지됩니다.',
    ['calc(' + a + '): ' + reason(a), 'calc(' + b + '): ' + reason(b), '두 호출 결과를 왼쪽부터 출력'],
    ['if n % 2', 'if n > 3', 'print(calc']);
});

addFamily('상', 'property-side-effects', '프로퍼티 접근과 setter의 상태 변화', '클래스', (v) => {
  const initial = 3 + v, delta = 2 + v, first = initial + 1, stored = (first + delta) * 2, second = stored + 2;
  const helper = 'class Meter:\n    def __init__(self, value):\n        self._value = value\n' +
    '        self.reads = 0\n\n    @property\n    def value(self):\n        self.reads += 1\n' +
    '        return self._value + self.reads\n\n    @value.setter\n    def value(self, new):\n' +
    '        self._value = new * 2';
  return result(program('meter = Meter(' + initial + ')\nfirst = meter.value\n' +
    'meter.value = first + ' + delta + '\nprint(meter.value, meter.reads, meter._value)', helper),
    second + ' 2 ' + stored, '@property 읽기는 단순한 필드 조회가 아니라 getter 실행입니다. 읽을 때마다 reads가 증가하며, 대입 시에는 setter가 전달 값을 두 배로 저장합니다.',
    ['첫 읽기: reads=1, first=' + first, 'setter에 ' + (first + delta) + '을 전달해 내부값=' + stored, '둘째 읽기: reads=2, 반환값=' + second],
    ['first = meter.value', 'meter.value =', 'print(meter.value']);
});

addFamily('상', 'stable-sort-key', '복합 정렬 키와 안정 정렬', '정렬', (v) => {
  const rows = [[0, 4 + v, 'A'], [1, 5 + v % 2, 'B'], [0, 4 + v, 'C'], [1, 3 + v, 'D']];
  const sorted = [...rows].sort((a, b) => a[0] - b[0] || b[1] - a[1]);
  const firstTwo = sorted[0][1] + sorted[1][1];
  const source = rows.map((row) => '(' + row[0] + ', ' + row[1] + ', "' + row[2] + '")').join(', ');
  return result(program('rows = [' + source + ']\nrows.sort(key=lambda row: (row[0], -row[1]))\n' +
    'print(rows[0][2], rows[-1][2], sum(row[1] for row in rows[:2]))'),
    sorted[0][2] + ' ' + sorted.at(-1)[2] + ' ' + firstTwo,
    '정렬 키의 첫 값은 오름차순, 음수로 바꾼 둘째 값은 원래 점수의 내림차순입니다. 키가 같은 A와 C는 Python의 안정 정렬에 따라 원래 상대 순서를 유지합니다.',
    ['첫 그룹의 A와 C는 같은 키이므로 A→C 순서 유지', '정렬 뒤 레이블 순서=' + sorted.map((row) => row[2]).join('→'), '앞 두 행의 점수 합=' + firstTwo],
    ['rows =', 'rows.sort', 'print(rows[0]']);
});

addFamily('상', 'closure-alias', '클로저 별칭과 독립 상태', '클로저', (v) => {
  const startA = 2 + v, startB = 8 + v, x = 1 + v, y = 2 + v, z = 3 + v, w = 4 + v;
  const helper = 'def make(start):\n    total = start\n    def step(delta):\n' +
    '        nonlocal total\n        total += delta\n        return total\n    return step';
  return result(program('f = make(' + startA + ')\ng = f\nh = make(' + startB + ')\n' +
    'print(f(' + x + '), g(' + y + '), h(' + z + '), f(' + w + '))', helper),
    (startA + x) + ' ' + (startA + x + y) + ' ' + (startB + z) + ' ' + (startA + x + y + w),
    'g=f는 같은 클로저 함수의 별칭을 만듭니다. f와 g는 nonlocal total을 공유하지만 h는 make를 다시 호출해 만든 독립적인 상태를 가집니다.',
    ['f와 g는 초기 total=' + startA + '을 공유', 'f 다음 g 호출 후 공유 total=' + (startA + x + y), 'h의 독립 total=' + (startB + z) + ', 마지막 f 결과=' + (startA + x + y + w)],
    ['g = f', 'print(f(', 'h = make']);
});

addFamily('상', 'graph-dfs', '순환 그래프 DFS와 방문 집합', '그래프·재귀', (v) => {
  const graph = [[1, 2], [2, 3], [0, 4], [4], [1]], weights = [2, 4, 1, 3, 5].map((x) => x + v);
  const start = v % 3, seen = new Set(), order = [], visitTrace = [];
  let skipped = 0;
  function walk(u) {
    if (seen.has(u)) { skipped += 1; return 0; }
    seen.add(u); order.push(u);
    visitTrace.push('노드 ' + u + ' 방문, 현재 순서=' + order.join('→'));
    let sum = weights[u];
    for (const next of graph[u]) sum += walk(next);
    return sum;
  }
  const total = walk(start);
  const helper = 'graph = [[1, 2], [2, 3], [0, 4], [4], [1]]\n' +
    'weights = [' + literal(weights) + ']\nseen = set()\norder = []\nskipped = []\n\n' +
    'def walk(u):\n    if u in seen:\n        skipped.append(u)\n        return 0\n' +
    '    seen.add(u)\n    order.append(u)\n    subtotal = weights[u]\n' +
    '    for next_node in graph[u]:\n        subtotal += walk(next_node)\n    return subtotal';
  return result(program('total = walk(' + start + ')\nprint("".join(map(str, order)), total, len(skipped))', helper),
    order.join('') + ' ' + total + ' ' + skipped,
    'DFS는 방문한 노드를 집합에 기록해 순환 간선을 다시 따라가지 않습니다. 처음 방문한 노드만 순서와 가중치 합계에 포함하고, 재방문은 skipped에 기록합니다.',
    [...visitTrace, '재방문하여 건너뛴 횟수=' + skipped, '고유 노드 가중치 합=' + total],
    [...visitTrace.map(() => 'order.append(u)'), 'if u in seen', 'print(']);
});

export const pythonCodeQuestions = questions;
