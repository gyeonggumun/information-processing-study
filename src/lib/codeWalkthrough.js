// 각 단계가 설명하는 원본 코드 줄. 반복·재귀 문항은 같은 줄이 여러 번 실행됩니다.
const stepAnchors = {
  'integer-arithmetic': ['int q =', 'int r =', 'printf('],
  'loop-continue': ['continue;', 'sum += i', 'printf('],
  'nested-branch': ['int m =', 'if (m % 2', 'printf('],
  'switch-fallthrough': ['switch (k)', 'case 1:', 'printf('],
  'array-index': ['i += 2) sum += a[i]', 'sum += a[i]', 'printf('],
  'string-offset': ['char *p =', 'printf('],
  'value-address': ['by_value(x)', 'printf(', 'by_address(&x)'],
  'pointer-move': ['int *p =', 'p +=', '*p +='],
  'linear-recursion': ['total(n - 1)', 'if (n == 0)', 'return n +'],
  'unsigned-bits': ['x >>', ') &', 'printf('],
  'bubble-pass': ['int a[]', 'a[j] = a[j + 1]'],
  'insertion-prefix': ['int key ='],
  'branch-recursion': ['if (n < 2)', 'return left +'],
  'static-state': ['return state *'],
  'row-pointer': ['(*(p + 1))', '(*(p + 1))', 'printf('],
  'string-mutation': ['char t =', "= '\\0'", 'printf('],
  'struct-copy': ['Pair b =', 'p->y +=', 'p->x *='],
  'double-pointer': ['int *p =', '*pp +=', '**pp +='],
  'ring-basic': ['int x = get()', 'int y = get()', 'printf('],
  'binary-search': ['int mid ='],
  'tree-state': ['int result = walk', 'return p->value +'],
  'list-filter-reverse': ['filter(&head)', 'head = reverse', 'sum += weight++'],
  'recursive-callback': ['if (n <= 1)', 'return op(a, b)'],
  'matrix-alias-fold': ['i < 3; i++) p[i][', 'p[1] = saved', 'return p[i][', 'printf('],
  'string-double-alias': ['redirect(&p[', '][0] = p[', 'cut(p[', 'else s[2] =', 'printf('],
  'ring-command-callback': ['for (int i = 0; i < 12; i++)'],
  'struct-shallow-callback': ['Box b = a', 'b.apply(&b, 0)', 'a.apply(&a, 1)', 'c.apply(&c, 0)', 'b.apply(&b, 1)', 'printf('],
  'postfix-state': ['stack[top++] = token[i]', 'stack[top++] = op['],
  'backtrack-restore': ['hits++; score +=', 'a[pos] = saved;'],
  'return-pointer-dispatch': ['dispatch(&p', 'sum += (i + 1)'],
};

function anchorFor(question, step, index) {
  if (question.anchors) return question.anchors[index];
  const anchors = stepAnchors[question.family];
  switch (question.family) {
    case 'postfix-state':
      return step.includes('토큰 -') ? anchors[1] : anchors[0];
    case 'recursive-callback':
      return step.startsWith('기저') ? anchors[0] : anchors[1];
    case 'matrix-alias-fold':
      return index < 3 ? anchors[0] : anchors[Math.min(index - 2, 3)];
    case 'tree-state':
      return index === 0 ? anchors[0] : anchors[1];
    case 'backtrack-restore':
    case 'return-pointer-dispatch':
      return index === question.trace.length - 1 ? anchors[1] : anchors[0];
    default:
      return anchors?.[Math.min(index, anchors.length - 1)];
  }
}

export function buildCodeWalkthrough(question) {
  const lines = question.code.split('\n');
  const steps = question.trace.map((description, index) => {
    const anchor = anchorFor(question, description, index);
    const lineIndex = lines.findIndex((line) => line.includes(anchor));
    if (lineIndex < 0) throw new Error(`풀이 코드 위치를 찾을 수 없습니다: ${question.id} / ${anchor}`);
    return { order: index + 1, lineIndex, lineNumber: lineIndex + 1, statement: lines[lineIndex].trim(), description };
  });

  const annotatedCode = lines.flatMap((line, index) => {
    const indentation = line.match(/^\s*/)[0];
    const comments = steps.filter((step) => step.lineIndex === index)
      .map((step) => `${indentation}// [${String(step.order).padStart(2, '0')}] ${step.description}`);
    return [...comments, line];
  }).join('\n');

  return { annotatedCode, steps };
}
