// 출처 원문·문항 ID·정답은 보존하고 화면에 표시할 오타만 보정합니다.
const proseEdits = [
  ['알맞는', '알맞은'], ['따움표', '따옴표'], ['따음표', '따옴표'],
  ['갯수', '개수'], ['평군', '평균'], ['생락', '생략'], ['해깔려', '헷갈려'],
  ['괄호안', '괄호 안'], ['밑줄친', '밑줄 친'], ['Pyhon', 'Python'],
  ['&nbsp;', ' '], ['\u200b', ''], ['\ufeff', ''],
];

const textEdits = {
  'past-2025-2-q17': [['Python언어', 'Python 언어']],
  'past-2025-1-q1': [['네트워크 보완', '네트워크 보안'], ['공격 공격이다.', '공격이다.']],
  'past-2025-1-q8': [['속상이', '속성이']],
  'past-2025-1-q7': [['SELECT name, incentive FROM', 'SELECT name, incentives FROM']],
  'past-2025-3-q14': [['R%S', 'R÷S']],
  'past-2025-3-q16': [
    ['한 행(Row)을 의미하며, 하나의 레코드를 구성하는 요소', '한 행(Row)으로, 하나의 레코드를 의미한다.'],
    ['스키마(Structure)', '스키마(Schema)'],
  ],
  'past-2026-1-q10': [
    ['괄호 ①~⑤', '빈칸 ①~⑤'],
    ['( 1 ) TEAM_TF', '① TEAM_TF'], ['( 2 ) KEY ( 3 )', '② KEY (③)'], ['( 4 ) TEAM ( 5 )', '④ TEAM (⑤)'],
  ],
  'past-2024-2-q3': [
    ['사원 [사원번호(PK), 이름, 나이, 부서]', '사원 [사원번호(PK), 이름, 주소, 나이, 부서]'],
    ['INSERT INTO 부서 (사원번호, 이름, 나이, 부서)', 'INSERT INTO 부서 (사원번호, 이름, 주소, 나이)'],
    ['[ ② ] 사원번호, 이름, 나이, 23', '[ ② ] 사원번호, 이름, 주소, 23'],
  ],
  'past-2023-3-q13': [
    ['다음 자바 코드를 실행할 경우 에러가 발생이 된다. 에러가 발생하는 라인명을 작성하시오.', '다음 Java 코드는 컴파일 오류가 발생한다. 오류가 발생하는 줄 번호를 작성하시오.'],
  ],
  'past-2023-3-q20': [['기본 키 또는 키가 아닌 후보 키', '기본 키 또는 기본 키로 선택되지 않은 후보 키']],
  'past-2023-2-q1': [['입력값이 54321일 경우 출력값이 43215로 출력되어야 한다.', '정수 다섯 개를 5 4 3 2 1 순서로 입력하면 출력값은 43215가 되어야 한다.']],
  'past-2023-2-q4': [
    ['전화번호varchar', '전화번호 varchar'],
    ['문자열일 경우 작은따옴표\n(작은따옴표가 아니라 다른 단어로 명시되었습니다.)', '문자열은 작은따옴표로 감싸시오.'],
  ],
  'past-2023-2-q12': [['선형블록부호 및 순회부호에 속에 속한다.', '선형 블록 부호의 한 종류이다.']],
  'past-2023-2-q16': [['고정된 크기의 데이터(Value)로 변화시켜', '고정된 크기의 데이터(Value)로 변환하여']],
  'past-2023-1-q16': [['where사용하지 말하야 한다.', 'WHERE 절을 사용하지 않아야 한다.']],
};

const codeEdits = {
  'past-2026-1-q12': [['*mine.fn(n));', '(unsigned int)*mine.fn(n));']],
  'past-2025-3-q7': [['printf("%u\\n", sum);', 'printf("%u\\n", (unsigned int)sum);']],
  'past-2024-1-q10': [['this y=y;', 'this.y=y;'], ['extend Parent', 'extends Parent'], ['\u200b', '']],
  'past-2024-1-q13': [['D="k"', "D='k'"]],
  'past-2024-1-q18': [['    TABLE ', '    "TABLE" ']],
  'past-2023-3-q4': [['\u200b', '']],
  'past-2023-3-q8': [['#include\n', '#include <stdio.h>\n']],
  'past-2023-3-q10': [['#include\n', '#include <stdio.h>\n']],
  'past-2023-3-q14': [['print(num1 + " + "  + num2 + " = " + num3)', 'print(str(num1) + " + " + str(num2) + " = " + str(num3))']],
  'past-2023-2-q2': [[' m = 4620;', ' int m = 4620;'], ...['a','b','c','d'].map(name => [`\n ${name} = (`, `\n int ${name} = (`])],
  'past-2023-2-q3': [
    ['#include<stdlio.h>', '#include<stdio.h>'], ['printf(입력하세요 : );', 'printf("입력하세요 : ");'],
    ['gets(n);', 'scanf("%29s", n);'], ['printf(%s\\n,test1);', 'printf("%s\\n",test1);'],
    ['printf(%s\\n,test2);', 'printf("%s\\n",test2);'], ['printf(%s,test3);', 'printf("%s",test3);'],
  ],
  'past-2023-2-q5': [['void main()', 'int main(void)']],
  'past-2023-2-q14': [
    ["'Programming'", '"Programming"'],
    ['println(str1==str2)', 'System.out.println(str1==str2);'], ['println(str1==str3)', 'System.out.println(str1==str3);'],
    ['println(str1.equals(str3))', 'System.out.println(str1.equals(str3));'], ['print(str2.equals(str3))', 'System.out.print(str2.equals(str3));'],
  ],
  'past-2023-2-q18': [['#include\n', '#include <stdio.h>\n']],
  'past-2023-1-q9': [['break\n', 'break;\n']],
  'past-2023-1-q17': [['abstact class', 'abstract class']],
};
const prefixes = { 'past-2026-1-q12':'#include <stdio.h>\n', 'past-2023-2-q1':'#include <stdio.h>\n' };
const replace = (value, edits) => edits.reduce((text, [from,to]) => text.replaceAll(from,to), value);

export function correctRestoredProblemBlock(id, block) {
  if (block.type === 'text') return { ...block, text:replace(replace(block.text,proseEdits),textEdits[id] ?? []) };
  if (block.type !== 'code') return block;
  let text = replace(block.text,codeEdits[id] ?? []);
  if (prefixes[id] && !text.startsWith(prefixes[id])) text = prefixes[id] + text;
  if (id === 'past-2024-1-q10') text = text.replace(/^(?!.*\/\/)(.*\S)[ \t]+([①-⑦])[ \t]*$/gm,'$1 // $2');
  return text === block.text ? block : { ...block,text };
}
