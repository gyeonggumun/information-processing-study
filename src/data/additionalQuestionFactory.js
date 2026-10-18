// 원문 복제가 아닌 실기 유형별 창작 문제입니다. 자료형·표·조건을 변경해 새 ID로 추가합니다.
export function addCodeFamily(target, language, difficulty, family, title, refs, build) {
  for (let v = 0; v < 5; v++) {
    target.push({
      id: `${language.toLowerCase()}-additional-${String(target.length + 1).padStart(3, '0')}`,
      language, difficulty, family: `additional-${family}`, variant: v + 1, title, tag: title,
      source: '실기 복원 유형 기반 창작 추가', examReferences: refs,
      prompt: `다음 ${language} 프로그램의 표준 출력 결과를 실행 순서대로 작성하세요.`,
      ...build(v),
    });
  }
}
export const codeAnswer = (code, answer, explanation, trace, anchors) => ({ code, answerText: String(answer), explanation, trace, anchors });
export const cProgram = (body, members = '') => `#include <stdio.h>\n#include <string.h>\n#include <ctype.h>\n\n${members}\n\nint main(void) {\n${body}\n    return 0;\n}`;
export const javaProgram = (body, members = '') => `import java.util.*;\n\nclass Main {\n${members}\n    public static void main(String[] args) {\n${body}\n    }\n}`;
