import { cProgram, javaProgram } from './additionalQuestionFactory.js';

// 3회 추가 검수: 반복 정의·과도한 합성 계산을 사례·결과 추적 문제로 교체합니다.
// 근거는 출제 개념의 연결이며, 향후 출제를 보장하거나 복원 원문을 복제하지 않습니다.
const specs = [
  ['design-008', '디자인 패턴 분류', '다음 세 패턴의 GoF 분류를 순서대로 쓰시오.\n① Prototype ② Composite ③ Command', ['생성 구조 행위', '생성, 구조, 행위', '생성 패턴 구조 패턴 행위 패턴'], 'Prototype은 원형 객체를 복제하므로 생성, Composite는 개별 객체와 객체 집합을 트리 구조로 다루므로 구조, Command는 요청을 객체로 표현하므로 행위 패턴입니다. 패턴 이름이 아니라 각 패턴이 해결하는 문제의 성격으로 분류합니다.', '2024-3-q6'],
  ['design-026', 'UML 다이어그램', '배송 시스템의 모델 요소를 주문·운송·정산이라는 이름 공간으로 묶고 묶음 사이에 점선 화살표로 의존성을 나타냈다. 사용한 UML 다이어그램 이름을 쓰시오.', ['패키지 다이어그램', '패키지', 'Package Diagram'], '패키지 다이어그램은 관련 모델 요소를 이름 공간으로 묶고 패키지 간 의존성을 표현합니다. 실행 장비에 프로그램을 배치하는 배포 다이어그램이나 클래스의 속성·연산을 표현하는 클래스 다이어그램과 구별합니다.', '2025-3-q1'],
  ['design-030', 'UML 관계', '결제 클래스가 결제수단 인터페이스의 명세를 구현한다. UML에서 속이 빈 삼각형을 향하는 점선으로 나타내는 이 관계를 쓰시오.', ['실체화', '실체화 관계', '구현 관계', 'Realization'], '실체화는 인터페이스와 같은 명세를 구체 클래스가 구현하는 관계입니다. 속이 빈 삼각형과 점선을 사용합니다. 같은 삼각형이라도 실선이면 일반화이며, 단순한 점선 화살표의 의존 관계와도 구별해야 합니다.', '2024-3-q14'],
  ['design-032', 'UML 관계', '문서가 생성되면서 문단 객체를 소유하고 문서를 제거하면 그 문단도 함께 제거된다. 문단은 다른 문서와 공유하지 않는다. 전체 쪽에 채워진 마름모로 표현하는 관계를 쓰시오.', ['합성', '합성 관계', '복합 연관', 'Composition'], '합성은 전체가 부분의 생명주기를 강하게 소유하는 관계이며 전체 쪽에 채워진 마름모를 표시합니다. 부분이 독립적으로 존재할 수 있는 집약은 빈 마름모입니다. 단순히 객체를 참조한다는 사실만으로 합성이라고 판단하지 않습니다.', '2024-3-q14'],
  ['design-050', '결합도', '① 두 모듈이 같은 전역 테이블을 읽고 갱신한다. ② 호출자는 고객 구조체 전체를 넘기지만 피호출자는 고객번호 필드만 사용한다. 결합도의 종류를 ①, ② 순서대로 쓰시오.', ['공통 결합도 스탬프 결합도', '공통 스탬프', 'Common Stamp', '공통 결합도 자료구조 결합도'], '①은 전역 데이터를 공유하는 공통 결합도입니다. ②는 필요한 한 값보다 큰 복합 자료구조를 통째로 전달하는 스탬프 결합도입니다. 단순 값만 전달하는 자료 결합도나 실행 분기를 지시하는 제어 결합도와 구별합니다.', '2026-2-q3'],
  ['design-052', '응집도', '① 장치 연결 확인→로그 기록→작업 요청을 반드시 이 순서로 수행하지만 서로의 출력값은 전달하지 않는다. ② 같은 고객 파일을 입력으로 사용하는 조회·집계 기능을 묶었으며 실행 순서는 상관없다. 응집도 종류를 순서대로 쓰시오.', ['절차적 교환적', '절차적 응집도 교환적 응집도', '절차적 통신적', '절차적 응집도 통신적 응집도'], '①은 정해진 수행 순서가 공통인 절차적 응집도입니다. ②는 같은 입력 자료를 공유하므로 교환적(통신적) 응집도입니다. 앞 처리의 출력이 다음 처리의 입력으로 이어져야 순차적 응집도이므로 단순한 순서만으로 판단하지 않습니다.', '2026-1-q20'],
  ['development-036', '문장 커버리지', '실행문은 s1, s2, s3, s4, s5, s6, s7, s8이다. 테스트 T1이 실행한 문장은 {s1,s2,s4,s8}, T2는 {s1,s3,s4,s5,s8}이다. 두 테스트를 합친 문장 커버리지를 백분율로 쓰시오.', ['75', '75%'], '두 집합의 합집합은 s1,s2,s3,s4,s5,s8의 6개입니다. 같은 문장을 두 번 실행해도 한 번만 세므로 6/8×100=75%입니다. 실행 횟수 4+5를 분자로 사용하면 중복 문장을 잘못 포함하게 됩니다.', '2024-3-q13'],
  ['development-038', '분기 커버리지', '결정문 D1,D2,D3가 각각 참·거짓 두 결과를 갖는다. 테스트 집합에서 D1은 참·거짓 모두, D2는 참만, D3는 거짓만 실행되었다. 분기 커버리지를 소수 둘째 자리까지 반올림하여 백분율로 쓰시오.', ['66.67', '66.67%'], '전체 결정 결과는 3×2=6개입니다. 실행한 결과는 D1의 2개, D2의 1개, D3의 1개를 합친 4개이므로 4/6×100=66.666…입니다. 소수 셋째 자리에서 반올림하면 66.67%가 됩니다.', '2024-3-q13'],
  ['development-040', '조건 커버리지', '결정식 (A AND B) OR C에서 단축 평가 없이 세 조건을 모두 평가한다. T1=(참,참,거짓), T2=(거짓,참,참)을 실행했다. 개별 조건의 참·거짓 총 6개를 기준으로 조건 커버리지를 소수 둘째 자리까지 반올림해 백분율로 쓰시오.', ['83.33', '83.33%'], 'A는 참·거짓 2개, B는 참 1개, C는 거짓·참 2개를 거쳤으므로 5/6×100=83.333…%입니다. B의 거짓만 빠졌습니다. 전체 결정 결과는 두 테스트 모두 참이지만 이 문제는 개별 조건의 결과를 셉니다.', '2025-3-q2'],
  ['development-042', 'MC/DC', '결정식 A AND B를 단축 평가 없이 계산한다. T1=(참,참), T2=(거짓,참), T3=(참,거짓), T4=(거짓,거짓)이다. A가 전체 결과에 독립적으로 영향을 준다는 것을 입증하는 테스트 두 개를 번호가 작은 순서로 쓰시오.', ['T1 T2', '1 2', 'T1, T2'], 'T1과 T2는 B를 참으로 고정하고 A만 참에서 거짓으로 바꿉니다. 전체 결과도 참에서 거짓으로 바뀌므로 A의 독립적인 영향을 확인합니다. B가 거짓인 T3·T4는 A를 바꿔도 전체 결과가 거짓이어서 해당 증거가 되지 않습니다.', '2024-1-q14'],
  ['development-056', '테스트 케이스', '다음 테스트 케이스의 ①, ② 구성 항목을 순서대로 쓰시오.\n준비: 잔액 20,000원인 활성 계정으로 로그인\n입력: 6,000원 출금\n① 실행 전에 명세로 정한 잔액 14,000원\n② 실행 후 실제 화면에서 관찰한 잔액 13,000원', ['예상 결과 실제 결과', '기대 결과 실제 결과', '예상결과 실행결과', '기대결과 실행결과'], '①은 실행 전에 명세에 따라 정한 예상(기대) 결과, ②는 실행으로 관찰한 실제 결과입니다. 둘이 다르므로 테스트는 실패입니다. 준비 조건과 입력값은 이 두 결과와 구분하여 기록해야 재현 가능한 테스트 케이스가 됩니다.', '2025-3-q9'],
  ['development-058', '경계값 분석', '예약 인원은 정수이며 4 이상 15 이하만 유효하다. 강건 경계값 분석에서 양 끝 경계와 각각 바로 안쪽·바깥쪽 값을 모두 선택한다. 중복 없이 작은 값부터 여섯 개를 쓰시오.', ['3 4 5 14 15 16', '3,4,5,14,15,16'], '하한 4에서 바로 바깥 3, 경계 4, 바로 안쪽 5를 고릅니다. 상한 15에서는 바로 안쪽 14, 경계 15, 바로 바깥 16입니다. 정수 조건 때문에 한 단위씩 이동하며 3과 16은 무효값입니다.', '2026-2-q1'],
  ['database-014', '키 판별', 'R(A,B,C)에서 A와 B는 각각 모든 튜플을 유일하게 식별하고 C는 중복될 수 있다. 제시된 {A}, {B}, {A,B}, {A,C} 중 슈퍼키이지만 후보키는 아닌 집합의 개수를 쓰시오.', ['2'], '{A}와 {B}는 유일성과 최소성을 모두 만족하는 후보키입니다. {A,B}와 {A,C}는 이미 A만으로 식별할 수 있어 불필요한 속성을 포함합니다. 유일성은 유지되지만 최소성을 잃으므로 후보키가 아닌 슈퍼키는 2개입니다.', '2024-3-q15'],
  ['database-028', '반정규화', '주문 조회의 반복 조인 비용을 줄이려고 이미 정규화된 테이블에 고객명을 중복 저장한다. 데이터 일관성 관리를 추가로 부담하면서 조회 성능을 높이는 이 설계 기법을 쓰시오.', ['반정규화', '비정규화', '역정규화', 'Denormalization'], '반정규화는 성능 등의 목적을 위해 의도적으로 중복을 허용하거나 테이블을 병합·분할하는 기법입니다. 중복 고객명을 갱신할 때 원본과 일치시키는 관리가 필요합니다. 단순히 데이터가 잘못 저장된 현상이나 정규화 자체와는 다릅니다.', '2024-2-q2'],
  ['database-030', '관계대수 계산', 'R(A,B)={(1,가),(2,나),(3,가),(4,다),(5,나)}이다. 관계대수 πB(σA>=3(R))의 결과 튜플 수를 쓰시오.', ['3'], '먼저 A>=3을 만족하는 (3,가),(4,다),(5,나)를 선택합니다. 다음 B 열만 남기면 가,다,나이며 중복이 없어 3개입니다. 셀렉션은 행을 고르고 프로젝션은 열을 고르되 관계대수에서는 중복 튜플을 제거합니다.', '2025-2-q20'],
  ['database-034', '정규형 판정', 'R(A,B,C)의 속성값은 모두 원자값이다. 후보키는 {A,B} 하나이고 비자명한 함수 종속은 AB→C, A→C 및 여기서 유도되는 것뿐이다. BCNF까지의 범위에서 만족하는 가장 높은 정규형을 쓰시오.', ['제1정규형', '1NF', '제 1정규형'], '후보키 AB의 일부 A만으로 비주요 속성 C를 결정하므로 부분 함수 종속이 존재합니다. 원자값 조건으로 1NF는 만족하지만 2NF는 위반합니다. A만으로 B를 결정할 수 없으므로 A 자체가 후보키인 것은 아닙니다.', '2026-2-q20'],
  ['database-064', 'SQL 집계', '기록(팀,점수)에 (가,20),(가,NULL),(가,40),(나,NULL)이 있다. SELECT COUNT(점수), SUM(점수) FROM 기록 WHERE 팀=\'가\'; 의 두 값을 순서대로 쓰시오.', ['2 60', '2,60'], 'WHERE로 가 팀의 세 행을 선택합니다. COUNT(점수)는 NULL을 제외해 2이고 SUM도 NULL을 제외해 20+40=60입니다. COUNT(*)라면 행 자체를 세어 3이 되므로 집계 대상이 별표인지 열인지 구분해야 합니다.', '2026-1-q18'],
  ['database-066', '참조 무결성', '부서(id)가 부모 테이블이고 직원(부서id)이 이를 참조한다. 부서 10을 참조하는 직원은 두 명이다. 외래키에 ON DELETE CASCADE가 있을 때 부서 10을 삭제하면 함께 삭제되는 직원 행 수를 쓰시오.', ['2'], 'CASCADE는 삭제되는 부모 키를 참조하는 자식 행도 연쇄 삭제합니다. 부서 10을 참조하는 두 직원 행이 없어지므로 2입니다. SET NULL처럼 외래키만 NULL로 바꾸거나 RESTRICT처럼 부모 삭제를 막는 동작이 아닙니다.', '2023-2-q17'],
  ['systems-004', '리눅스 권한', '파일 소유자는 읽기·쓰기, 그룹은 읽기만, 기타 사용자는 권한이 없도록 설정한다. chmod에 사용할 세 자리 8진수 권한 값을 쓰시오.', ['640'], '읽기 r은 4, 쓰기 w는 2, 실행 x는 1입니다. 소유자 rw-=6, 그룹 r--=4, 기타 ---=0을 순서대로 연결하면 640입니다. 세 자리의 위치는 소유자·그룹·기타 사용자 순서이므로 권한 합계만 쓰면 안 됩니다.', '2023-3-q3'],
  ['systems-014', '라운드 로빈 계산', 'A,B,C가 시각 0에 이 순서로 준비 큐에 들어온다. CPU 실행 시간은 각각 3,5,2ms이고 시간 할당량 2ms의 RR을 사용한다. 문맥 교환 시간은 0이다. 세 프로세스의 평균 대기시간을 ms 단위로, 소수 둘째 자리까지 반올림해 쓰시오.', ['4.33', '4.33ms'], '실행 순서는 A(0~2), B(2~4), C(4~6), A(6~7), B(7~9), B(9~10)입니다. 대기시간은 종료-도착-실행으로 구하며 A=7-0-3=4, B=10-0-5=5, C=6-0-2=4입니다. 평균은 (4+5+4)/3=4.33ms입니다.', '2025-2-q13'],
  ['systems-016', '비선점 SJF 계산', 'A(도착 0,실행 5), B(도착 1,실행 4), C(도착 2,실행 1)를 비선점 SJF로 실행한다. 단위는 ms이고 문맥 교환 시간은 0이다. 세 프로세스의 평균 대기시간을 소수 둘째 자리까지 반올림해 쓰시오.', ['2.67', '2.67ms'], 'A가 시각 0~5에 실행되는 동안 더 짧은 C가 도착해도 비선점이므로 A를 중단하지 않습니다. 이후 C(5~6), B(6~10)입니다. 대기시간 A=0, B=6-1=5, C=5-2=3의 평균은 8/3=2.67ms입니다.', '2025-2-q4'],
  ['systems-018', '선점 SRTF 계산', 'A(도착 0,실행 7), B(도착 2,실행 2), C(도착 3,실행 1)를 SRTF로 실행한다. 단위는 ms, 문맥 교환 시간은 0이며 남은 시간이 같으면 먼저 도착한 작업을 선택한다. 평균 대기시간을 소수 둘째 자리까지 반올림해 쓰시오.', ['1.33', '1.33ms'], 'A(0~2) 후 B가 선점합니다. 시각 3에는 B와 C의 잔여 시간이 모두 1이므로 먼저 도착한 B를 계속 실행합니다. B(2~4), C(4~5), A(5~10)이며 대기시간은 A=3, B=0, C=1입니다. 평균 4/3=1.33ms입니다.', '2026-2-q8'],
  ['systems-024', '페이지 교체 계산', '초기에 빈 프레임 3개에 참조열 2,5,2,7,5,8,2를 LRU로 처리한다. 페이지 부재 횟수를 쓰시오.', ['5'], '2와 5를 처음 적재하고 2는 적중합니다. 7을 적재한 뒤 5는 적중합니다. 8이 들어올 때 가장 오래 사용하지 않은 2를 내보내고, 마지막 2는 부재여서 7을 교체합니다. 최초 적재를 포함한 부재는 총 5회입니다.', '2024-3-q4'],
  ['systems-026', '서브넷 분할', '192.168.24.0/24를 같은 크기의 서브넷 8개로 나눈다. 낮은 주소부터 세었을 때 세 번째 서브넷의 브로드캐스트 주소를 쓰시오. 첫 서브넷을 1번째로 센다.', ['192.168.24.95'], '8=2³이므로 3비트를 빌려 /27로 나눕니다. 각 블록 크기는 32이고 네트워크 주소는 .0, .32, .64 순서입니다. 세 번째 블록은 .64~.95이므로 마지막 주소인 192.168.24.95가 브로드캐스트입니다.', '2026-1-q11'],
];

const written = new Map(specs.map(([id, category, prompt, acceptedAnswers, explanation, ref]) => [`practice-${id}`, {
  category, title: `${category} 적용`, prompt, acceptedAnswers, answerText: acceptedAnswers[0], explanation,
  examReferences: [`past-${ref}`],
}]));

const guide = {
  rules: [
    '실행 시작 지점부터 함수 호출을 따라가고 반환 지점으로 돌아와 다음 문장을 처리합니다. 재귀에서는 종료 조건을 먼저 확인하고 각 호출의 인수와 반환값을 따로 기록합니다.',
    '배열의 인덱스·객체의 참조·자료의 실제 값을 구별해 적습니다. 같은 객체를 가리키는 경우에만 변경을 공유하며, 출력문이 실행될 때의 값과 순서로 최종 답을 구성합니다.',
  ], caution: '선언된 순서가 실제 실행 순서는 아닙니다. 호출 위치와 조건을 확인하고, 중간 계산값을 출력값에 섞지 마세요.',
};

function treeC(v) {
  const values = [17 + v * 3, 6 + v * 2, 28 + v, 3 + v, 11 + v * 2];
  const orders = [[3, 1, 0, 4, 2], [3, 1, 4, 2, 0], [0, 1, 3, 2, 4], [3, 1, 4, 2, 0], [3, 1, 0, 4, 2]];
  const kinds = ['중위', '후위', '전위', '후위', '중위'];
  const lines = ['    visit(p->left);', '    if (++count == target) selected = p->value;', '    visit(p->right);'];
  const calls = kinds[v] === '중위' ? lines : kinds[v] === '후위' ? [lines[0], lines[2], lines[1]] : [lines[1], lines[0], lines[2]];
  const target = [4, 3, 5, 2, 3][v], order = orders[v].map(i => values[i]);
  return { family: 'suitability-c-tree-position', title: '재귀 방문과 선택된 값',
    code: cProgram(`    Node d = {${values[3]}, NULL, NULL};\n    Node e = {${values[4]}, NULL, NULL};\n    Node b = {${values[1]}, &d, NULL};\n    Node c = {${values[2]}, &e, NULL};\n    Node a = {${values[0]}, &b, &c};\n    visit(&a);\n    printf("%d", selected);`, `typedef struct Node {\n    int value;\n    struct Node *left, *right;\n} Node;\nint count = 0, selected = 0;\nint target = ${target};\nvoid visit(Node *p) {\n    if (p == NULL) return;\n${calls.join('\n')}\n}`),
    answerText: String(order[target - 1]),
    explanation: `이 코드는 ${kinds[v]} 순회입니다. 실제 노드를 처리하는 if 문에서만 count가 증가하며 NULL 자식은 즉시 반환합니다. 방문 값은 ${order.join('→')}이고 ${target}번째 값 ${order[target - 1]}만 selected에 저장합니다. 이후 방문에서는 count가 target과 달라 이 값이 유지됩니다.`,
    trace: [`a는 b,c를 자식으로 가지며 b의 왼쪽은 d, c의 왼쪽은 e입니다. 노드 값은 a,b,c,d,e 순서로 ${values.join(', ')}입니다.`, `자식 호출과 if 문 위치에 따라 ${kinds[v]} 순회하며 값은 ${order.join('→')} 순서입니다.`, ...order.map((n, i) => `${i + 1}번째 방문: 값=${n}, count=${i + 1}. ${i + 1 === target ? `조건이 참이어서 selected=${n}으로 저장합니다.` : `조건은 거짓이므로 selected를 바꾸지 않습니다.`}`), `최종 selected=${order[target - 1]}를 출력합니다.`],
    anchors: ['visit(&a)', 'void visit', ...order.map(() => 'if (++count'), 'printf'], examReferences: ['past-2026-2-q7'] };
}

function overloadJava(v) {
  const seed = v + 2, n = v + 4;
  const result = [seed, seed + 1];
  for (let k = 2; k <= n; k++) result[k] = result[k - 1] + result[k - 2];
  return { family: 'suitability-java-overload-recursion', title: '메서드 호출과 반환값',
    code: javaProgram(`        System.out.print(calc("${n}") + " " + calc(${n - 1}));`, `    static int calc(int n) {\n        if (n <= 1) return n + ${seed};\n        return calc(n - 1) + calc(n - 2);\n    }\n    static int calc(String s) {\n        int n = Integer.parseInt(s);\n        return calc(n - 1) - calc(n - 2);\n    }`),
    answerText: `${result[n - 1] - result[n - 2]} ${result[n - 1]}`,
    explanation: `문자열 인수는 String 오버로드, 정수 인수는 int 오버로드를 선택합니다. String 메서드가 숫자를 읽은 후 호출하는 두 calc에는 정수 인수가 전달되므로 int 메서드가 재귀 실행됩니다. int는 두 결과를 더하지만 String의 마지막 연산은 뺄셈입니다. 왼쪽 출력은 ${result[n - 1]}-${result[n - 2]}=${result[n - 1] - result[n - 2]}, 오른쪽은 ${result[n - 1]}입니다.`,
    trace: [`calc("${n}")는 String 메서드로 들어가 n=${n}을 얻습니다.`, `calc(0)=${seed}, calc(1)=${seed + 1}은 종료 조건에서 바로 반환합니다.`, ...result.slice(2, n).map((r, i) => `int calc(${i + 2})=calc(${i + 1})+calc(${i})=${result[i + 1]}+${result[i]}=${r}입니다. 같은 인수의 반환값을 아래에서 위로 정리한 표이며 실제 호출 시간순은 아닙니다.`), `String 메서드는 calc(${n - 1})-calc(${n - 2})=${result[n - 1] - result[n - 2]}를 반환합니다.`, `뒤의 calc(${n - 1})는 int 메서드이므로 ${result[n - 1]}입니다. 공백으로 구분해 두 값을 출력합니다.`],
    anchors: ['int n = Integer', 'if (n <=', ...result.slice(2, n).map(() => 'return calc(n - 1) +'), 'return calc(n - 1) -', 'System.out.print'], examReferences: ['past-2025-1-q20'] };
}

function treePython(v) {
  const values = [9 + v, 4 + v * 2, 13 + v, 7 + v, 2 + v, 16 + v, 5 + v * 2];
  const conditions = ['level % 2 == 0', 'level == 1', 'not node.children', 'level >= 2', 'level != 1'];
  const chosen = [[0, 3, 4, 5, 6], [1, 2], [3, 4, 5, 6], [3, 4, 5, 6], [0, 3, 4, 5, 6]][v];
  const answer = chosen.reduce((sum, i) => sum + values[i], 0);
  return { family: 'suitability-python-tree-selection', title: '객체 트리의 재귀 반환',
    code: `class Node:\n    def __init__(self, value):\n        self.value = value\n        self.children = []\n\ndef total(node, level=0):\n    own = node.value if ${conditions[v]} else 0\n    for child in node.children:\n        own += total(child, level + 1)\n    return own\n\nnodes = [Node(v) for v in [${values.join(', ')}]]\nfor i in range(1, len(nodes)):\n    nodes[(i - 1) // 2].children.append(nodes[i])\nprint(total(nodes[0]))`,
    answerText: String(answer),
    explanation: `부모 인덱스 (i-1)//2로 트리를 구성합니다. 조건 ${conditions[v]}을 만족할 때만 자기 값을 더하고 자식의 반환값은 항상 합칩니다. 자신의 값이 제외되어도 자식 순회를 중단하지 않습니다. 선택된 값 ${chosen.map(i => values[i]).join('+')}의 합 ${answer}가 출력되며 노드 자체의 값은 변경되지 않습니다.`,
    trace: [`레벨 0은 ${values[0]}, 레벨 1은 ${values[1]},${values[2]}, 레벨 2는 ${values.slice(3).join(',')}입니다.`, `조건 ${conditions[v]}에 따라 자기 값을 더하는 노드들은 ${chosen.map(i => values[i]).join(', ')}입니다.`, ...[1, 2].map(i => { const group = [i, 2 * i + 1, 2 * i + 2].filter(j => chosen.includes(j)); return `루트의 ${i === 1 ? '왼쪽' : '오른쪽'} 자식 부분 트리는 ${group.length ? group.map(j => values[j]).join('+') : '0'}=${group.reduce((sum, j) => sum + values[j], 0)}를 반환합니다.`; }), `루트는 자신의 기여 ${chosen.includes(0) ? values[0] : 0}와 두 부분 트리 합을 더해 ${answer}를 출력합니다.`],
    anchors: ['nodes[(i - 1)', 'own =', 'own +=', 'own +=', 'print(total'], examReferences: ['past-2025-1-q17'] };
}

function dictPython(v) {
  const data = [
    [['AX', 'map'], ['BY', 'tree'], ['CZ', 'loop']],
    [['DU', 'grid'], ['EV', 'node'], ['FW', 'path']],
    [['GK', 'heap'], ['HL', 'link'], ['IM', 'sort']],
    [['JN', 'byte'], ['KO', 'mask'], ['LP', 'queue']],
    [['MQ', 'stack'], ['NR', 'graph'], ['OS', 'field']],
  ][v];
  const updated = ['cache', 'array', 'index', 'value', 'table'][v];
  const tokens = data.map(([k, value], i) => k.slice(-1) + (i === 1 ? updated : value)[0]);
  return { family: 'suitability-python-class-dictionary', title: '클래스 자료의 갱신과 순회',
    code: `class Catalog:\n    items = {${data.map(([k, s]) => `'${k}': '${s}'`).join(', ')}}\n\na = Catalog()\nb = Catalog()\na.items['${data[1][0]}'] = '${updated}'\ntext = ''\nfor key, value in b.items.items():\n    text += key[-1] + value[0]\nprint(text)`,
    answerText: tokens.join(''),
    explanation: `a와 b는 별도 인스턴스이지만 인스턴스 속성을 새로 대입하지 않아 클래스의 items 딕셔너리를 공유합니다. a를 통해 ${data[1][0]}의 값을 ${updated}로 바꾸면 b로 조회할 때도 반영됩니다. 기존 키 갱신은 삽입 순서를 바꾸지 않으며 키의 마지막 글자와 값의 첫 글자를 차례로 이어 붙입니다.`,
    trace: [`클래스 items의 키 삽입 순서는 ${data.map(([k]) => k).join('→')}입니다. a와 b가 같은 딕셔너리를 참조합니다.`, `${data[1][0]}의 값만 ${data[1][1]}에서 ${updated}로 갱신합니다. 키의 위치는 유지됩니다.`, ...tokens.map((t, i) => `${i + 1}회차: ${data[i][0]}에서 마지막 글자, ${i === 1 ? updated : data[i][1]}에서 첫 글자를 가져와 ${t}를 덧붙입니다. 누적 문자열은 ${tokens.slice(0, i + 1).join('')}입니다.`), `최종 문자열 ${tokens.join('')}를 한 줄로 출력합니다.`],
    anchors: ['a = Catalog', 'a.items[', ...tokens.map(() => 'text +='), 'print(text)'], examReferences: ['past-2026-2-q5'] };
}

const builders = {
  C: { 'additional-postorder-selection': treeC },
  Java: { 'additional-overloaded-recursive-counter': overloadJava },
  Python: { 'tree-odd-level': treePython, 'additional-tree-depth-accumulator': dictPython },
};

export function revisePracticalSuitability(questions, type) {
  const previous = [], audit = [], positions = new Map();
  const revised = questions.map(q => {
    const build = builders[type]?.[q.family];
    const position = positions.get(q.family) || 0;
    const change = type === 'exam' ? written.get(q.id) : build?.(position);
    if (!change) return q;
    positions.set(q.family, position + 1);
    previous.push(q);
    const next = { ...q, ...change, id: `${q.id}-r5`, suitabilityRevisionOf: q.id,
      source: '실기 유형 기반 창작·3회 추가 검수',
      referenceBasis: '복원 자료에서 확인한 개념을 새 조건과 데이터에 적용한 창작·확장 문제',
      ...(type === 'exam' ? {} : { solutionGuide: guide, tag: change.title }),
    };
    audit.push({ type, previousId: q.id, id: next.id, previousTopic: q.family || q.category,
      topic: next.family || next.category, examReferences: next.examReferences });
    return next;
  });
  return { questions: revised, previous, audit };
}
