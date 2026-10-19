// 저장된 문제 템플릿의 규칙만 명시적으로 추적합니다. 사용자 코드는 실행하지 않습니다.
// 코드 형식이 달라지면 추측하지 않고 null로 돌려주며, 출력은 기존 정답과 대조합니다.
const ints = text => text.split(',').map(value => Number(value.trim()));
const normalized = value => String(value).trim().replace(/\s+/gu, ' ');

export function buildCodeCalculationTrace(question) {
  const { code, family, language } = question;
  const rows = [];
  const add = (action, calculation, state) => rows.push([action, calculation, state]);
  let output;

  if (['integer-arithmetic', 'integer-division', 'floor-modulo'].includes(family)) {
    const pair = code.match(/int a = (\d+), b = (\d+)/u) ?? code.match(/a, b = (\d+), (\d+)/u);
    if (!pair) return null;
    const a = Number(pair[1]), b = Number(pair[2]), q = Math.trunc(a / b), r = a % b;
    add('몫을 저장', `${a} ÷ ${b} = ${a / b} → 정수 몫 ${q}`, `q=${q}; a=${a}, b=${b}는 유지`);
    add('나머지를 저장', `${a} - (${q} × ${b}) = ${r}`, `r=${r}`);
    add('마지막 출력식 계산', `${q} × ${b} + ${r} = ${a}`, `q, r, q*b+r 순서: ${q} ${r} ${a}`);
    output = `${q} ${r} ${a}`;
  } else if (['loop-continue', 'continue-filter', 'range-step'].includes(family)) {
    const loop = code.match(/for \(int i = (\d+); i <= (\d+); i\+\+\)/u);
    const range = code.match(/range\((\d+), (\d+)(?:, (\d+))?\)/u);
    if (!loop && !range) return null;
    const start = Number((loop ?? range)[1]);
    const end = loop ? Number(loop[2]) : Number(range[2]) - 1;
    const step = loop ? 1 : Number(range[3] ?? 1);
    const divisor = Number(code.match(/i % (\d+) == 0/u)?.[1]);
    let sum = 0, last;
    for (let i = start; i <= end; i += step) {
      const before = sum, skip = Boolean(divisor) && i % divisor === 0;
      if (!skip) sum += i;
      add(`i=${i}`, divisor ? `${i} % ${divisor} = ${i % divisor} → 제외 조건 ${skip ? '참' : '거짓'}` : `range에서 다음 값 ${i} 선택`, skip ? `continue → 합계 ${sum} 유지` : `${before} + ${i} = ${sum}`);
      last = i;
    }
    add('종료', `다음 i=${last + step}는 반복 범위 밖`, `최종 합계=${sum}${family === 'range-step' ? `, 마지막 i=${last}` : ''}`);
    output = family === 'range-step' ? `${sum} ${last}` : String(sum);
  } else if (['linear-recursion', 'recursive-sum'].includes(family)) {
    const call = code.match(/(?:total|sum)\((\d+)\)/u);
    if (!call) return null;
    const n = Number(call[1]);
    add('호출을 내려감', Array.from({ length: n + 1 }, (_, i) => n - i).join(' → '), '각 부모는 자식의 반환을 기다림');
    add('기저 n=0', '조건 n==0이 참 → 0 반환', '현재 반환값=0');
    let total = 0;
    for (let i = 1; i <= n; i++) {
      const child = total;
      total += i;
      add(`n=${i} 호출로 복귀`, `${i} + 자식 반환값 ${child} = ${total}`, `현재 호출이 ${total} 반환`);
    }
    output = String(total);
  } else if (family === 'increment-order') {
    const match = code.match(/int x = (\d+)/u);
    if (!match) return null;
    const x = Number(match[1]);
    add('a = x++', `기존 x=${x}를 a에 제공 → x를 1 증가`, `a=${x}, x=${x + 1}`);
    add('b = ++x', `현재 x=${x + 1}를 먼저 1 증가 → 새 값을 b에 제공`, `a=${x}, b=${x + 2}, x=${x + 2}`);
    output = `${x} ${x + 2} ${x + 2}`;
  } else if (family === 'augmented-precedence') {
    const match = code.match(/x, y = (\d+), (\d+)/u);
    if (!match) return null;
    const x = Number(match[1]), y = Number(match[2]), next = x + y * 2;
    add('오른쪽 식 계산', `${y} × 2 = ${y * 2}`, `대입 전 x=${x}, y=${y}`);
    add('x += y * 2', `${x} + ${y * 2} = ${next}`, `x=${next}, y=${y}`);
    add('x //= 3', `${next} ÷ 3의 내림 정수 = ${Math.floor(next / 3)}`, `x=${Math.floor(next / 3)}, y=${y}`);
    output = `${Math.floor(next / 3)} ${y}`;
  } else if (['switch-fallthrough', 'switch-flow'].includes(family)) {
    const match = code.match(/int k = (\d+), sum = 0/u);
    if (!match) return null;
    const k = Number(match[1]);
    const cases = [...code.matchAll(/(case (\d+)|default): sum \+= (\d+);( break;)?/gu)];
    let start = cases.findIndex(item => Number(item[2]) === k);
    if (start < 0) start = cases.findIndex(item => item[1] === 'default');
    let sum = 0;
    for (const item of cases.slice(start)) {
      const before = sum;
      sum += Number(item[3]);
      add(item[1], `${before} + ${item[3]} = ${sum}`, item[4] ? `sum=${sum} → break로 switch 종료` : `sum=${sum} → break가 없어 아래로 이어짐`);
      if (item[4]) break;
    }
    const delta = Number(code.match(/(?:print\(|%d", )sum \+ (\d+)/u)?.[1]);
    if (!Number.isFinite(delta)) return null;
    add('출력식', `${sum} + ${delta} = ${sum + delta}`, `출력값=${sum + delta}`);
    output = String(sum + delta);
  } else if (family === 'unsigned-bits') {
    const match = code.match(/unsigned int x = (\d+)u;\s+unsigned int y = \(x >> (\d+)\) & (\d+)u/u);
    if (!match) return null;
    const x = Number(match[1]), shift = Number(match[2]), mask = Number(match[3]), moved = x >>> shift, result = moved & mask;
    const width = Math.max(x.toString(2).length, mask.toString(2).length);
    const bits = value => value.toString(2).padStart(width, '0');
    add('원래 값', `${x}를 이진수로 표시`, bits(x));
    add('오른쪽 이동', `${bits(x)} >> ${shift} = ${bits(moved)}`, `10진수 ${moved}`);
    add('마스크 AND', `${bits(moved)} & ${bits(mask)} = ${bits(result)}`, `두 비트가 모두 1인 자리만 남아 ${result}`);
    output = String(result);
  } else if (['bubble-pass', 'insertion-prefix'].includes(family)) {
    const array = code.match(/int a\[\] = \{([\d, ]+)\}/u), end = code.match(/i < (\d+); i\+\+/u);
    if (!array || !end) return null;
    const a = ints(array[1]);
    add('초기 배열', '인덱스 0부터 왼쪽→오른쪽', `[${a.join(', ')}]`);
    if (family === 'bubble-pass') {
      const descending = code.includes('if (a[j] < a[j + 1])');
      for (let i = 0; i < Number(end[1]); i++) for (let j = 0; j < a.length - 1 - i; j++) {
        const left = a[j], right = a[j + 1], swap = descending ? left < right : left > right;
        if (swap) [a[j], a[j + 1]] = [right, left];
        add(`회전 ${i + 1}, j=${j}`, `${left} ${descending ? '<' : '>'} ${right} → ${swap ? '참: 교환' : '거짓: 유지'}`, `[${a.join(', ')}]`);
      }
      output = a.join(' ');
    } else {
      let moves = 0;
      for (let i = 1; i < Number(end[1]); i++) {
        const key = a[i];
        let j = i - 1;
        add(`i=${i} 시작`, `key=a[${i}]=${key}를 따로 보관`, `j=${j}, moves=${moves}`);
        while (j >= 0 && a[j] > key) {
          const moved = a[j];
          a[j + 1] = moved;
          moves++;
          add(`원소 오른쪽 이동`, `a[${j}]=${moved} > key=${key} → a[${j + 1}]에 ${moved} 복사`, `moves=${moves}, 배열=[${a.join(', ')}]; key는 별도 보관`);
          j--;
        }
        a[j + 1] = key;
        add('key 삽입', `멈춘 j=${j}의 다음 위치 a[${j + 1}]에 ${key} 저장`, `[${a.join(', ')}], moves=${moves}`);
      }
      output = `${moves} ${a[0]} ${a[Number(end[1]) - 1]}`;
    }
  } else if (family === 'branch-recursion') {
    const n = Number(code.match(/calc\((\d+)\)/u)?.[1]), factor = Number(code.match(/\+ (\d+) \* calc/u)?.[1]);
    if (!Number.isFinite(n) || !Number.isFinite(factor)) return null;
    // C의 두 피연산자 평가 순서는 보장되지 않으므로 시간순 호출 기록으로 표시하지 않습니다.
    const values = new Map([[-1, -1], [0, 0], [1, 1]]);
    for (const [key, value] of values) add(`기저 calc(${key})`, `${key} <= 1이므로 인수 그대로 반환`, `반환값=${value}`);
    for (let i = 2; i <= n; i++) {
      const left = values.get(i - 1), right = values.get(i - 3), value = left + factor * right;
      values.set(i, value);
      add(`calc(${i})의 반환식`, `calc(${i - 1}) + ${factor} × calc(${i - 3}) = ${left} + ${factor} × (${right})`, `반환값=${value}`);
    }
    output = String(values.get(n));
  } else if (family === 'static-state') {
    let state = Number(code.match(/static int state = (\d+)/u)?.[1]);
    const calls = [...code.matchAll(/int ([abc]) = next\((\d+)\)/gu)];
    if (!Number.isFinite(state) || calls.length !== 3) return null;
    const answers = [];
    for (const call of calls) {
      const x = Number(call[2]), before = state;
      state += x;
      const returned = state * 2 - x;
      add(`${call[1]} = next(${x})`, `state: ${before}+${x}=${state}; 반환식 ${state}×2-${x}=${returned}`, `state=${state} 유지, ${call[1]}=${returned}`);
      answers.push(returned);
    }
    output = answers.join(' ');
  } else if (family === 'recursive-call-count' || family === 'recursive-global') {
    const c = family === 'recursive-call-count', name = c ? 'solve' : 'calc';
    const initial = code.match(c ? /int calls = (\d+)/u : /int ticks = (\d+)/u);
    const calls = [...code.matchAll(new RegExp(`${name}\\((\\d+)\\)`, 'gu'))].map(match => Number(match[1]));
    if (!initial || !calls.length) return null;
    let counter = Number(initial[1]);
    const walk = n => {
      const before = counter++;
      add(`${name}(${n}) 진입`, `${c ? 'calls' : 'ticks'}: ${before} → ${counter}`, `n=${n}, 기저 조건 ${n <= 1 ? '참' : '거짓'}`);
      if (n <= 1) {
        const value = c ? n + 1 : counter + n;
        add(`${name}(${n}) 기저 반환`, c ? `${n}+1=${value}` : `현재 ticks(${counter})+${n}=${value}`, `부모로 ${value} 전달`);
        return value;
      }
      const left = walk(n - 1), right = walk(n - 2), value = c ? left - right + n : left + right + counter;
      add(`${name}(${n})로 복귀`, c ? `${left} - ${right} + ${n} = ${value}` : `${left} + ${right} + 최신 ticks(${counter}) = ${value}`, `반환값=${value}, ${c ? 'calls' : 'ticks'}=${counter}`);
      return value;
    };
    const first = walk(calls[0]), saved = counter;
    if (c) {
      add('첫 호출 결과 보관', `first=${first}, saved=calls=${saved}`, 'saved는 복사본이므로 이후 calls가 늘어도 유지');
      const second = walk(calls[1]);
      output = `${first} ${saved} ${second} ${counter}`;
    } else output = `${first} ${counter}`;
  } else if (family === 'memo-recursion') {
    const n = Number(code.match(/value = fib\((\d+), memo\)/u)?.[1]);
    if (!Number.isFinite(n)) return null;
    const memo = new Map();
    let hits = 0;
    const fib = value => {
      if (memo.has(value)) {
        add(`fib(${value}) 캐시 적중`, `이미 저장한 memo[${value}]=${memo.get(value)} 사용`, `hits: ${hits} → ${++hits}, 자식 호출 생략`);
        return memo.get(value);
      }
      add(`fib(${value}) 진입`, `memo에 ${value} 없음 → ${value < 2 ? '기저값 계산' : '왼쪽, 오른쪽 순서로 호출'}`, `저장한 n: ${[...memo.keys()].join(', ') || '아직 없음'}`);
      let result;
      if (value < 2) result = value + 1;
      else {
        const left = fib(value - 1), right = fib(value - 2);
        result = left + right;
        add(`fib(${value}) 자식 반환`, `${left} + ${right} = ${result}`, `memo[${value}]에 저장할 값=${result}`);
      }
      memo.set(value, result);
      add(`memo[${value}] 저장`, `${value < 2 ? `${value}+1` : '두 자식 반환값의 합'}=${result}`, `정수 키 ${memo.size}개, hits=${hits}`);
      return result;
    };
    const value = fib(n);
    output = `${value} ${memo.size} ${hits}`;
  } else if (family === 'override-recursive-calls') {
    const n = Number(code.match(/p.calc\((\d+)\)/u)?.[1]), base = Number(code.match(/class Child extends Parent \{\s+int base = (\d+)/u)?.[1]);
    if (!Number.isFinite(n) || !Number.isFinite(base)) return null;
    const child = value => {
      if (value <= 1) {
        add(`Child.calc(${value})`, `${value}<=1 → 자식 base 반환`, `반환=${base}`);
        return base;
      }
      add(`Child.calc(${value})`, `super.calc(${value - 1})를 먼저 실행`, `그 결과를 기다린 뒤 Child.calc(${value - 2}) 실행`);
      const left = parent(value - 1), right = child(value - 2);
      add(`Child.calc(${value}) 복귀`, `${left} + ${right} = ${left + right}`, `반환=${left + right}`);
      return left + right;
    };
    const parent = value => {
      if (value <= 0) {
        add(`Parent.calc(${value})`, '부모 기저 조건 충족', '반환=1');
        return 1;
      }
      add(`Parent.calc(${value})`, `본문의 calc(${value - 1})는 실제 객체 Child로 연결`, 'super 호출의 본문 안에서도 일반 호출은 동적 연결');
      const returned = child(value - 1);
      add(`Parent.calc(${value}) 복귀`, `${returned} + ${value} = ${returned + value}`, `반환=${returned + value}`);
      return returned + value;
    };
    output = `${child(n)} 2 ${base}`;
  } else if (family === 'ring-buffer-boundary') {
    const body = code.split('int main(void) {')[1];
    if (!body) return null;
    const queue = Array(5).fill(0), results = [];
    let front = 0, rear = 0;
    for (const call of body.matchAll(/put\((\d+)\)|int ([ab]) = get\(\)/gu)) {
      if (call[1]) {
        const value = Number(call[1]), next = (rear + 1) % 5;
        if (next === front) add(`put(${value})`, `(rear ${rear}+1)%5=${next} == front ${front}`, `가득 참 → 삽입 무시, front=${front}, rear=${rear}`);
        else {
          const at = rear;
          queue[rear] = value;
          rear = next;
          add(`put(${value})`, `q[${at}]=${value}; rear를 ${next}로 이동`, `front=${front}, rear=${rear}, 대기열=${Array.from({ length: (rear - front + 5) % 5 }, (_, i) => queue[(front + i) % 5]).join(' → ')}`);
        }
      } else {
        const at = front, value = queue[front];
        front = (front + 1) % 5;
        results.push(value);
        add(`${call[2]} = get()`, `q[${at}]=${value} 반환; front=(${at}+1)%5=${front}`, `${call[2]}=${value}, front=${front}, rear=${rear}`);
      }
    }
    output = `${results.join(' ')} ${front} ${rear} ${queue[(rear + 4) % 5]}`;
  } else if (['pointer-move', 'double-pointer'].includes(family)) {
    const array = code.match(/int a\[\] = \{([\d, ]+)\}/u), startMatch = code.match(/int \*p = a \+ (\d+)/u);
    const move = code.match(family === 'pointer-move' ? /\n\s+p \+= (\d+)/u : /\*pp \+= (\d+)/u);
    const change = code.match(family === 'pointer-move' ? /\*p \+= (\d+)/u : /\*\*pp \+= (\d+)/u);
    if (!array || !startMatch || !move || !change) return null;
    const a = ints(array[1]), start = Number(startMatch[1]), at = start + Number(move[1]), before = a[at];
    add('포인터 초기화', `p=a+${start} → &a[${start}]`, `p의 대상 값=${a[start]}, 배열=[${a.join(', ')}]`);
    add('가리키는 위치 이동', `${family === 'double-pointer' ? '*pp(호출자의 p)' : 'p'}: 인덱스 ${start}+${move[1]}=${at}`, `p=&a[${at}], 이 시점 배열 값은 아직 그대로`);
    a[at] += Number(change[1]);
    add('대상의 정수 변경', `a[${at}]: ${before}+${change[1]}=${a[at]}`, `배열=[${a.join(', ')}]; a[${start}]=${a[start]} 유지`);
    output = family === 'pointer-move' ? `${a[at]} ${a[start]}` : `${at} ${a[at]} ${a[start]}`;
  } else if (['string-offset', 'additional-string-alias-cut', 'string-mutation'].includes(family)) {
    const word = code.match(/char s\[\] = "([A-Z]+)"/u), offset = code.match(/char \*p = s \+ (\d+)/u);
    if (!word || !offset) return null;
    const chars = [...word[1]], start = Number(offset[1]);
    add('원본의 문자 위치', chars.map((char, i) => `[${i}]=${char}`).join(', '), `p는 s[${start}]부터 가리킴`);
    if (family === 'string-offset') {
      add('%c 출력', `*p = s[${start}] = '${chars[start]}'`, '문자 한 개만 출력');
      add('%s 출력', `s[${start}]부터 문자열 끝까지`, word[1].slice(start));
      output = `${chars[start]} ${word[1].slice(start)}`;
    } else if (family === 'additional-string-alias-cut') {
      const end = start + 2;
      add('p[2]에 널 문자', `p[2]는 s[${start}+2], 즉 s[${end}]`, `원본 s도 ${end}번에서 종료`);
      add('각 시작점에서 문자열 읽기', `s: 인덱스 0~${end - 1}, p: 인덱스 ${start}~${end - 1}`, `s=${word[1].slice(0, end)}, p=${word[1].slice(start, end)}, p-s=${start}`);
      output = `${word[1].slice(0, end)} ${word[1].slice(start, end)} ${start}`;
    } else {
      const end = Number(code.match(/s\[(\d+)\] = '\\0'/u)?.[1]);
      if (!Number.isFinite(end)) return null;
      const saved = chars[start];
      add('t = *p', `t에 기존 s[${start}]='${saved}' 저장`, `t='${saved}'`);
      chars[start] = chars[start + 3];
      add('*p = p[3]', `s[${start}]에 s[${start + 3}]='${chars[start + 3]}' 복사`, chars.join(''));
      chars[start + 3] = saved;
      add('p[3] = t', `s[${start + 3}]에 보관한 '${saved}' 저장`, chars.join(''));
      add('널 종료 후 출력', `s[${end}]에서 종료하므로 0~${end - 1}번만 읽음`, `문자열=${chars.slice(0, end).join('')}, strlen=${end}`);
      output = `${chars.slice(0, end).join('')} ${end}`;
    }
  } else if (['array-alias-clone', 'list-alias-copy'].includes(family)) {
    const values = code.match(/original = [[{]([\d, ]+)[\]}]/u), left = code.match(/alias\[0\] \+= (\d+)/u), right = code.match(/copy\[1\] \+= (\d+)/u);
    if (!values || !left || !right) return null;
    const original = ints(values[1]), copy = [...original];
    add('별칭과 복사본 생성', `original·alias → 객체 A, copy → 별도 객체 B`, `A=[${original.join(', ')}], B=[${copy.join(', ')}]`);
    const before = original[0];
    original[0] += Number(left[1]);
    add('alias[0] 변경', `공유 객체 A의 0번: ${before}+${left[1]}=${original[0]}`, `original도 [${original.join(', ')}], copy는 [${copy.join(', ')}]`);
    const oldCopy = copy[1];
    copy[1] += Number(right[1]);
    add('copy[1] 변경', `별도 객체 B의 1번: ${oldCopy}+${right[1]}=${copy[1]}`, `original=[${original.join(', ')}], copy=[${copy.join(', ')}]`);
    output = `${original[0]} ${original[1]} ${copy[1]}`;
  } else if (['nested-augmented-list', 'nested-list-rebind-mutate', 'additional-nested-augmented-sharing', 'additional-nested-array-clone'].includes(family)) {
    const match = language === 'Java' ? code.match(/int\[\]\[\] a = \{\{([\d, ]+)\}, \{([\d, ]+)\}\}/u) : code.match(/(?:rows|a) = \[\[([\d, ]+)\], \[([\d, ]+)\]\]/u);
    if (!match) return null;
    const original = [ints(match[1]), ints(match[2])], copy = [...original];
    const state = () => `원본=${JSON.stringify(original)}, 바깥 복사본=${JSON.stringify(copy)}`;
    add('바깥만 복사', '바깥 컨테이너는 다르지만 첫 행·둘째 행을 각각 공유', state());
    if (family === 'nested-augmented-list') {
      const x = code.match(/outer\[0\] \+= \[(\d+)\]/u), y = code.match(/outer\[1\] = outer\[1\] \+ \[(\d+)\]/u), delta = code.match(/rows\[0\]\[0\] \+= (\d+)/u);
      if (!x || !y || !delta) return null;
      copy[0].push(Number(x[1]));
      add('outer[0] += [...]', `공유 첫 행에 ${x[1]} 추가 → 원본 첫 행도 늘어남`, state());
      copy[1] = [...copy[1], Number(y[1])];
      add('outer[1] = outer[1] + [...]', `${y[1]}를 붙인 새 행을 outer의 둘째 슬롯에 대입`, state());
      const before = original[0][0];
      original[0][0] += Number(delta[1]);
      add('rows[0][0] 변경', `${before}+${delta[1]}=${original[0][0]}; 첫 행은 여전히 공유`, state());
      output = `${original[0].length} ${original[1].length} ${copy[1].at(-1)} ${copy[0][0]}`;
    } else if (family === 'nested-list-rebind-mutate') {
      const first = code.match(/b\[1\]\[0\] \+= (\d+)/u), second = code.match(/c\[1\]\[1\] \+= (\d+)/u);
      if (!first || !second) return null;
      copy[0] = [...copy[0]].reverse();
      add('b[0]에 역순 새 행 대입', '첫 행 공유가 끊기며 a의 첫 행은 유지', state());
      const before = copy[1][0];
      copy[1][0] += Number(first[1]);
      add('b[1][0] 변경', `둘째 행은 공유 중이므로 ${before}+${first[1]}=${copy[1][0]}가 a에도 반영`, state());
      const c = copy.map(row => [...row]);
      c[1][1] += Number(second[1]);
      add('c는 행까지 복사 후 변경', `c[1][1]에 ${second[1]} 추가; a·b의 둘째 행에는 영향 없음`, `${state()}, c=${JSON.stringify(c)}`);
      output = `${original[0][0]} ${original[1][0]} ${copy[0][0]} ${copy[1][1]} ${c[1][1]}`;
    } else if (family === 'additional-nested-augmented-sharing') {
      const x = code.match(/b\[0\] \+= \[(\d+)\]/u), y = code.match(/b\[1\] = b\[1\] \+ \[(\d+)\]/u), delta = code.match(/c\[0\]\[1\] \+= (\d+)/u), append = code.match(/a\[0\].append\((\d+)\)/u);
      if (!x || !y || !delta || !append) return null;
      copy[0].push(Number(x[1]));
      add('b[0] += [...]', `${x[1]}를 공유 첫 행에 추가`, state());
      copy[1] = [...copy[1], Number(y[1])];
      add('b[1] 새 행 대입', `${y[1]}를 붙인 별도 행으로 둘째 행 공유를 끊음`, state());
      const c = copy.map(row => [...row]);
      c[0][1] += Number(delta[1]);
      add('c는 행까지 복사 후 변경', `c[0][1]만 ${delta[1]} 증가`, `${state()}, c=${JSON.stringify(c)}`);
      original[0].push(Number(append[1]));
      add('a[0].append', `공유 첫 행에 ${append[1]} 추가 → b에서도 보이지만 c에는 반영되지 않음`, `${state()}, c=${JSON.stringify(c)}`);
      const sum = a => a.reduce((s, value) => s + value, 0);
      output = `${original[0].length} ${copy[0].length} ${c[0].length}\n${sum(original[0])} ${sum(copy[1])} ${sum(c[0])}`;
    } else {
      const delta = code.match(/b\[0\]\[1\] \+= (\d+)/u), row = code.match(/b\[1\] = new int\[\] \{([\d, ]+)\}/u);
      if (!delta || !row) return null;
      const before = copy[0][1];
      copy[0][1] += Number(delta[1]);
      add('b[0][1] 변경', `공유 첫 행에서 ${before}+${delta[1]}=${copy[0][1]}`, state());
      copy[1] = ints(row[1]);
      add('b[1]을 새 배열로 교체', '둘째 행 공유만 끊기고 첫 행 공유는 유지', state());
      copy[1][0]++;
      add('b[1][0]++', '새 둘째 행의 첫 값만 1 증가', state());
      output = `${original[0][1]} ${original[1][0]} ${copy[1][0]} true`;
    }
  } else if (family === 'function-alias-rebinding') {
    const array = code.match(/a = \[([\d, ]+)\]/u), amount = code.match(/alter\(b, (\d+)\)/u);
    if (!array || !amount) return null;
    const a = ints(array[1]), c = [...a], delta = Number(amount[1]);
    add('참조 관계', 'a·b·함수 인수 items는 같은 리스트, c는 별도 복사본', `a=b=items=[${a.join(', ')}], c=[${c.join(', ')}]`);
    const before = a[1];
    a[1] += delta;
    add('items[1] 변경', `${before}+${delta}=${a[1]}`, `공유 원본 a·b=[${a.join(', ')}]`);
    const items = [...a].reverse();
    add('지역 items 재대입', 'items[::-1]은 새 리스트 → 지역 이름만 새 대상을 가리킴', `지역 items=[${items.join(', ')}], a·b=[${a.join(', ')}]`);
    items[0] += 10;
    const r = items.filter((_, i) => i % 2 === 0);
    add('지역 새 리스트 변경 후 반환', `items[0]에 10 추가, [::2]로 인덱스 0·2 선택`, `items=[${items.join(', ')}], 반환 r=[${r.join(', ')}]`);
    const removed = c.pop(); r.push(removed);
    add('r.append(c.pop())', `c의 마지막 ${removed}를 꺼내 r 끝에 추가`, `c=[${c.join(', ')}], r=[${r.join(', ')}]`);
    output = `${a.join(' ')}\n${r.reduce((s, value) => s + value, 0)} ${c.length} True`;
  } else if (family === 'finally-return') {
    const calls = [...code.matchAll(/calc\((\d+)\)/gu)].map(match => Number(match[1]));
    if (calls.length !== 2) return null;
    const answers = calls.map(n => {
      const even = n % 2 === 0, pending = even ? n + 1 : n + 2;
      add(`calc(${n}) try`, `${n}%2=${n % 2} → ${even ? '참: n+1 반환 예정' : '거짓: 예외 발생'}`, even ? `반환 예정=${pending}` : 'try의 나머지를 건너뛰고 처리 블록으로 이동');
      if (!even) add(`calc(${n}) 예외 처리`, `${n}+2=${pending}`, `반환 예정=${pending}, 아직 finally가 남음`);
      const answer = n > 3 ? n * 2 : pending;
      add(`calc(${n}) finally`, `${n}>3 → ${n > 3 ? `참: ${n}×2=${answer} 새 반환` : '거짓: finally에서 별도 반환 없음'}`, n > 3 ? `예정 ${pending} 대신 ${answer} 반환` : `예정값 ${pending} 유지`);
      return answer;
    });
    output = answers.join(' ');
  } else if (family === 'mutable-default') {
    const calls = [...code.matchAll(/collect\((\d+)\)/gu)].map(match => Number(match[1])), bucket = [], answers = [];
    if (calls.length !== 3) return null;
    for (const x of calls) {
      const before = `[${bucket.join(', ')}]`;
      bucket.push(x);
      const sum = bucket.reduce((a, b) => a + b, 0);
      add(`collect(${x})`, `공유 기본 리스트 ${before}에 ${x} 추가`, `bucket=[${bucket.join(', ')}], sum=${bucket.join('+')}=${sum}`);
      answers.push(sum);
    }
    output = answers.join(' ');
  } else if (family === 'filtered-comprehension') {
    const array = code.match(/values = \[([\d, ]+)\]/u), condition = code.match(/if x % 2 == (\d+)/u);
    if (!array || !condition) return null;
    const out = [];
    for (const x of ints(array[1])) {
      const pass = x % 2 === Number(condition[1]);
      if (pass) out.push(x * x);
      add(`x=${x}`, `${x}%2=${x % 2}, 조건 ${pass ? '참' : '거짓'}`, pass ? `${x}×${x}=${x * x} 추가 → out=[${out.join(', ')}]` : `추가하지 않음 → out=[${out.join(', ')}]`);
    }
    add('출력식', `out[0]=${out[0]}, sum=${out.join('+')}, len=${out.length}`, `합계=${out.reduce((a, b) => a + b, 0)}`);
    output = `${out[0]} ${out.reduce((a, b) => a + b, 0)} ${out.length}`;
  } else if (family === 'struct-shallow-callback') {
    const values = code.match(/int shared\[\] = \{([\d, ]+)\}/u), local = code.match(/Box a = \{\{([\d, ]+)\}, shared, edit\}/u), at = code.match(/b.ref \+= (\d+)/u);
    const deltaMatch = code.match(/p->local\[1 - mode\] \+= (\d+)/u), cAt = code.match(/c.ref = a.ref \+ (\d+)/u);
    if (!values || !local || !at || !deltaMatch || !cAt) return null;
    const delta = Number(deltaMatch[1]);
    const shared = ints(values[1]), a = { local: ints(local[1]), at: 0 }, b = { local: ints(local[1]), at: Number(at[1]) };
    const show = (name, item) => `${name}.local=[${item.local.join(', ')}], ${name}.ref→shared[${item.at}], shared=[${shared.join(', ')}]`;
    add('a를 b로 복사', 'local 두 값은 독립 복사, ref의 주소값은 복사 후 이동', `${show('a', a)}; ${show('b', b)}`);
    const edit = (name, item, mode) => {
      const value = item.local[mode], oldShared = shared[item.at], opposite = 1 - mode, oldLocal = item.local[opposite];
      shared[item.at] += value;
      item.local[opposite] += delta;
      add(`${name}.apply(&${name}, ${mode})`, `shared[${item.at}]: ${oldShared}+${value}=${shared[item.at]}; ${name}.local[${opposite}]: ${oldLocal}+${delta}=${item.local[opposite]}`, show(name, item));
    };
    edit('b', b, 0); edit('a', a, 1);
    const c = { local: [...b.local], at: a.at + Number(cAt[1]) };
    c.local[0] = b.local[1] - a.local[0];
    add('c를 b에서 복사 후 재지정', `c.ref→shared[${c.at}]; c.local[0]=${b.local[1]}-${a.local[0]}=${c.local[0]}`, show('c', c));
    edit('c', c, 0);
    b.local[0] = c.local[1];
    add('b.local[0] 재대입', `c.local[1]=${c.local[1]}를 값으로 복사`, show('b', b));
    edit('b', b, 1);
    output = `${a.local[0]} ${b.local[1]} ${shared[0]} ${shared[1]} ${shared[b.at]} ${c.local[1]} ${b.local[0]}`;
  } else if (family === 'matrix-alias-fold') {
    const matrix = code.match(/int a\[3\]\[3\] = \{\{([\d, ]+)\}, \{([\d, ]+)\}, \{([\d, ]+)\}\}/u), pointers = code.match(/int \*p\[3\] = \{a\[(\d+)\], a\[(\d+)\], a\[(\d+)\]\}/u);
    if (!matrix || !pointers) return null;
    const a = matrix.slice(1).map(ints), p = pointers.slice(1).map(Number);
    add('행 주소 배열 구성', `p가 가리키는 원본 행: ${p.join(' → ')}`, a.map((row, i) => `a[${i}]=[${row.join(', ')}]`).join('; '));
    for (let i = 0; i < 3; i++) {
      const target = p[i], source = p[(i + 1) % 3], before = a[target][0], delta = a[source][1];
      a[target][0] += delta;
      add(`i=${i}의 원소 갱신`, `p[${i}][0]=a[${target}][0]: ${before}+a[${source}][1](${delta})=${a[target][0]}`, `a[${target}]=[${a[target].join(', ')}]`);
    }
    const saved = p[0]; p[0] = p[2]; p[2] = p[1]; p[1] = saved;
    add('포인터 순서 재배치', '원본 행을 이동하지 않고 p의 주소 슬롯만 교체', `p가 가리키는 원본 행: ${p.join(' → ')}`);
    let rest = 0;
    add('fold(p,3) 기저', 'i==3 → 0 반환', 'rest=0부터 거꾸로 복귀');
    for (let i = 2; i >= 0; i--) {
      const value = a[p[i]][0] * (i + 1) - rest;
      add(`fold(p,${i}) 복귀`, `a[${p[i]}][0](${a[p[i]][0]})×${i + 1} - 자식 반환 ${rest} = ${value}`, `현재 호출 반환=${value}`);
      rest = value;
    }
    const index = Number(code.match(/fold\(p, 0\), a\[(\d+)\]\[0\]/u)?.[1]);
    if (!Number.isFinite(index)) return null;
    output = `${rest} ${a[index][0]}`;
  } else if (family === 'enumerate-zip') {
    const left = code.match(/left = \[([\d, ]+)\]/u), right = code.match(/right = \[([\d, ]+)\]/u);
    if (!left || !right) return null;
    const a = ints(left[1]), b = ints(right[1]);
    let score = 0;
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      const before = score, term = (i + 1) * (a[i] - b[i]);
      score += term;
      add(`index=${i}, a=${a[i]}, b=${b[i]}`, `(${i}+1) × (${a[i]}-${b[i]}) = ${term}`, `score: ${before}+${term}=${score}`);
    }
    output = String(score);
  }

  if (output === undefined) return null;
  if (normalized(output) !== normalized(question.answerText)) throw new Error(`${question.id}: 상세 계산 표와 정답 불일치`);
  return { label: family === 'branch-recursion' ? '작은 인수부터 반환값 계산 (실제 호출 순서와 구분)' : '변화 과정을 한 단계씩 따라가기', columns: ['실행·대상', '계산·조건 판단', '변경 후 상태·반환값'], rows, output, language };
}
