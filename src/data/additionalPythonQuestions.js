import { addCodeFamily, codeAnswer } from './additionalQuestionFactory.js';
const questions = [];
const add = (level, family, title, refs, build) => addCodeFamily(questions, 'Python', level, family, title, refs, build);
add('하', 'reverse-word-step', '음수 인덱스와 역방향 간격 슬라이스', ['past-2026-1-q13', 'past-2026-2-q6'], v => {
  const text = ['INFORMATION', 'COMPUTING', 'ALGORITHM', 'DATABASE', 'PROCESSOR'][v], selected = [];
  for (let i = text.length - 2; i > 0; i -= 2) selected.push(text[i]);
  return codeAnswer(`text = "${text}"\na = text[-2:0:-2]\nb = text[1:5]\nprint(a, b, len(a))`, `${selected.join('')} ${text.slice(1, 5)} ${selected.length}`,
    '시작 -2는 끝에서 두 번째 문자이고 간격 -2는 왼쪽으로 두 칸씩 이동하라는 뜻입니다. 끝 인덱스 0은 포함하지 않습니다. 양의 방향 슬라이스도 끝 5를 포함하지 않으며 len은 실제 선택한 문자 개수입니다.',
    [`선택 인덱스는 ${Array.from({ length: selected.length }, (_, i) => text.length - 2 - i * 2).join(', ')}입니다.`, `역방향 결과는 ${selected.join('')}, 1:5 결과는 ${text.slice(1, 5)}입니다.`, `역방향 부분 문자열 길이는 ${selected.length}입니다.`], ['a =', 'b =', 'print(']);
});
add('하', 'dict-reinsert-order', '딕셔너리 덮어쓰기와 재삽입 순서', ['past-2026-2-q5'], v => {
  const a = v + 3, b = v + 7, c = v + 11;
  return codeAnswer(`data = {"a": ${a}, "b": ${b}}\nalias = data\nalias["a"] += 2\ndata["c"] = ${c}\nsaved = data.pop("b")\ndata["b"] = saved + 1\ntext = ""\nfor key, value in data.items():\n    text += key + str(value)\nprint(text, len(alias))`, `a${a + 2}c${c}b${b + 1} 3`,
    'Python 3의 딕셔너리는 삽입 순서를 유지합니다. 기존 키의 값만 바꾸면 위치가 바뀌지 않지만 키를 삭제했다가 다시 삽입하면 뒤에 놓입니다. alias는 별도 복사본이 아니라 같은 딕셔너리를 가리킵니다.',
    [`a의 값은 ${a + 2}로 바뀌고 순서는 유지됩니다.`, 'b를 삭제 후 다시 넣어 키 순서는 a→c→b가 됩니다.', `문자열은 a${a + 2}c${c}b${b + 1}이고 공유 딕셔너리 길이는 3입니다.`], ['alias["a"] +=', 'data["b"] =', 'for key, value']);
});
add('중', 'set-update-copy', '집합 차집합과 갱신 및 별도 복사', ['past-2023-1-q15', 'past-2025-2-q17'], v => {
  const a = [v + 2, v + 4, v + 6, v + 8], b = [v + 4, v + 8, v + 10], final = [v + 2, v + 6, v + 12];
  return codeAnswer(`a = {${a.join(', ')}}\nb = {${b.join(', ')}}\ncopy = a.copy()\na.difference_update(b)\na.add(${v + 12})\ncopy.intersection_update(b)\nprint(*sorted(a))\nprint(*sorted(copy))`, `${final.join(' ')}\n${v + 4} ${v + 8}`,
    'copy는 별도 집합이므로 이후 a를 바꿔도 함께 바뀌지 않습니다. difference_update는 a에서 b와 공통인 원소를 제거하고 intersection_update는 copy에 공통 원소만 남깁니다. 집합의 임의 순서를 추측하지 않고 sorted 결과를 읽습니다.',
    [`차집합 후 a에는 ${v + 2}, ${v + 6}이 남습니다.`, `새 값 ${v + 12}를 넣어 첫 줄은 ${final.join(' ')}입니다.`, `원래 복사본과 b의 공통 값은 ${v + 4}, ${v + 8}입니다.`], ['a.difference_update', 'a.add(', 'copy.intersection_update']);
});
add('중', 'inherit-shared-history', '상속 메서드와 클래스 리스트의 공유', ['past-2025-1-q17', 'past-2026-2-q5'], v => {
  const n = v + 4;
  return codeAnswer(`class Base:\n    history = []\n    def __init__(self, n):\n        self.n = n\n        self.history.append(n)\n    def value(self):\n        return self.n\n\nclass Child(Base):\n    def value(self):\n        return super().value() * 2\n\na = Child(${n})\nb = Base(${n + 3})\na.history = a.history[:]\na.history.append(a.value())\nprint(a.value(), b.value(), len(Base.history), sum(a.history))`, `${n * 2} ${n + 3} 2 ${4 * n + 3}`,
    '자식이 생성자를 재정의하지 않아 부모 생성자가 실행됩니다. 두 객체는 처음 클래스 리스트를 공유하지만 a.history에 슬라이스 복사본을 대입하면 a만 별도 리스트를 갖습니다. 자식 value는 super의 반환값을 두 배로 만들며 원래 n 자체를 변경하지 않습니다.',
    [`클래스 history에는 ${n}, ${n + 3} 두 값이 들어갑니다.`, `자식 메서드는 ${n * 2}를 반환하고 a 전용 리스트에 이 값을 추가합니다.`, `부모 공유 리스트 길이는 2, a 리스트의 합은 ${4 * n + 3}입니다.`], ['b = Base', 'a.history =', 'a.history.append']);
});
add('중', 'split-row-fold', '문자열 분리와 행별 합계 누적', ['past-2024-2-q20', 'past-2025-3-q9'], v => {
  const rows = [[v + 2, v + 5], [v + 3, v + 7], [v + 4, v + 9]], sums = rows.map(r => r[0] + r[1]);
  return codeAnswer(`lines = [${rows.map(r => `"${r.join(':')}"`).join(', ')}]\nrows = [[int(x) for x in line.split(":")] for line in lines]\nresult = []\nfor row in rows:\n    result.append(sum(row))\nprint(*result[::-1])\nprint(sum(result), len(rows[1]))`, `${sums.slice().reverse().join(' ')}\n${sums.reduce((s, x) => s + x, 0)} 2`,
    'split은 문자열 조각들을 만들고 int는 각 조각을 숫자로 변환합니다. 문자열 상태에서의 연결과 정수 덧셈을 구분해야 합니다. 각 행의 합을 저장한 뒤 결과 리스트만 역순으로 출력하며 원본 rows의 행 길이는 유지됩니다.',
    [`숫자 행의 합은 차례로 ${sums.join(', ')}입니다.`, `역순 출력은 ${sums.slice().reverse().join(' ')}입니다.`, `전체 합은 ${sums.reduce((s, x) => s + x, 0)}이고 둘째 행의 길이는 2입니다.`], ['rows =', 'result.append', 'print(*result']);
});
add('상', 'nested-augmented-sharing', '중첩 리스트의 +=와 행 재대입', ['past-2026-1-q14'], v => {
  const n = v + 3;
  return codeAnswer(`a = [[${n}, ${n + 1}], [${n + 2}]]\nb = a[:]\nb[0] += [${n + 3}]\nb[1] = b[1] + [${n + 4}]\nc = [row[:] for row in b]\nc[0][1] += 10\na[0].append(${n + 5})\nprint(len(a[0]), len(b[0]), len(c[0]))\nprint(sum(a[0]), sum(b[1]), sum(c[0]))`, `4 4 3\n${4 * n + 9} ${2 * n + 6} ${3 * n + 14}`,
    '바깥만 복사한 a와 b는 처음 각 행 리스트를 공유합니다. b[0]의 +=는 공유 리스트 자체를 늘리지만 b[1]=b[1]+[...]는 새 리스트를 만들어 해당 행의 공유만 끊습니다. c는 각 행도 복사하여 이후 a의 append와 독립적입니다.',
    [`공유 첫 행은 ${n}, ${n + 1}, ${n + 3}으로 늘어납니다.`, `c를 만든 뒤 c의 둘째 원소에 10을 더하고 공유 첫 행에는 ${n + 5}를 추가합니다.`, `길이는 4·4·3이고 세 합은 ${4 * n + 9}·${2 * n + 6}·${3 * n + 14}입니다.`], ['b[0] +=', 'b[1] =', 'a[0].append']);
});
add('상', 'tree-depth-accumulator', '클래스 트리의 방문 순서와 깊이별 부호', ['past-2025-1-q17'], v => {
  const data = [v + 7, v + 3, v + 11, v + 2, v + 13], order = [0, 1, 3, 2, 4], score = data[0] - data[1] + data[3] - data[2] + data[4];
  return codeAnswer(`class Node:\n    def __init__(self, value, left=None, right=None):\n        self.value = value\n        self.left = left\n        self.right = right\n\norder = []\ndef walk(node, depth=0):\n    if node is None:\n        return 0\n    order.append(node.value)\n    current = node.value if depth % 2 == 0 else -node.value\n    return current + walk(node.left, depth + 1) + walk(node.right, depth + 1)\n\nroot = Node(${data[0]}, Node(${data[1]}, None, Node(${data[3]})), Node(${data[2]}, Node(${data[4]})))\nvalue = walk(root)\nprint(*order)\nprint(value, len(order))`, `${order.map(i => data[i]).join(' ')}\n${score} 5`,
    'order에 현재 노드를 먼저 넣으므로 출력 방문 순서는 전위 순회입니다. 반환값은 짝수 깊이에서 더하고 홀수 깊이에서 빼는 합이며 방문 순서와 부호 기준을 따로 적어야 합니다. None 자식은 리스트에 추가되지 않고 0만 반환합니다.',
    [`전위 방문 값은 ${order.map(i => data[i]).join(' → ')}입니다.`, `루트는 더하고 두 자식은 빼며 두 손자 값은 더해 ${score}입니다.`, '실제 노드는 다섯 개이므로 order 길이는 5입니다.'], ['order.append', 'current =', 'print(value']);
});
add('상', 'class-dictionary-row-alias', '클래스 딕셔너리와 내부 리스트 복사', ['past-2026-2-q5', 'past-2026-1-q14'], v => {
  const n = v + 4;
  return codeAnswer(`class Store:\n    rows = {"A": [${n}, ${n + 1}], "B": [${n + 2}]}\n\nfirst = Store()\nsecond = Store()\nsecond.rows = first.rows.copy()\nsecond.rows["A"].append(${n + 3})\nsecond.rows["B"] = second.rows["B"] + [${n + 4}]\nfirst.rows["A"][0] += 5\ntext = ""\nfor key, row in second.rows.items():\n    text += key + str(sum(row))\nprint(text)\nprint(sum(Store.rows["A"]), len(Store.rows["B"]), first.rows is second.rows)`, `A${3 * n + 9}B${2 * n + 6}\n${3 * n + 9} 1 False`,
    'dict.copy는 바깥 딕셔너리만 복사하므로 A와 B의 리스트 값은 처음 공유됩니다. A의 append와 원소 변경은 클래스 원본에도 반영되지만 B의 + 연산 결과 재대입은 second 쪽의 새 리스트를 만듭니다. 딕셔너리 자체의 동일성과 내부 리스트의 공유를 구분합니다.',
    [`공유 A 리스트의 합은 ${3 * n + 9}입니다.`, `second의 B 합은 ${2 * n + 6}이고 클래스 원본 B 길이는 여전히 1입니다.`, '삽입 순서 A→B로 문자열을 누적하며 두 바깥 딕셔너리는 달라 False입니다.'], ['second.rows =', 'second.rows["B"] =', 'text +=']);
});
export const additionalPythonQuestions = questions;
