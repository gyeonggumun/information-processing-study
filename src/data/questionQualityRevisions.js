import { cProgram, javaProgram } from './additionalQuestionFactory.js';

// 무관한 두 정의를 붙여 재출제하던 비교 문항을 독립적인 실기형 사례로 교체합니다.
// [이전 ID, 주제, 지문, 허용 답안, 해설, 근거]. 복원 문제의 원문이 아닌 창작 변형입니다.
const writtenSpecs = [
  ['practice-design-028', '응집도', '하나의 모듈에 문자·파일·네트워크 입력 기능을 모아 두고 호출자가 넘긴 종류 코드에 따라 하나만 실행한다. 비슷한 범주의 기능을 선택적으로 묶은 응집도 종류를 쓰시오.', ['논리적 응집도', '논리적', '논리'], '논리적 응집도는 비슷한 종류의 기능을 묶고 외부의 선택 정보로 하나를 수행하는 경우입니다. 한 기능만 완성하는 기능적 응집도나 실행 시점만 같은 시간적 응집도와 구분합니다.', '2026-1-q20'],
  ['practice-design-038', '결합도', '보고서 모듈에 모드 값을 넘긴다. 값이 0이면 조회, 1이면 갱신을 수행하도록 피호출 모듈의 처리 경로가 달라진다. 결합도 종류를 쓰시오.', ['제어 결합도', '제어'], '제어 결합도는 전달한 플래그나 모드가 다른 모듈 내부의 분기를 결정하는 경우입니다. 값의 계산에 필요한 일반 데이터만 전달하는 자료 결합도와 구분해야 합니다.', '2024-2-q16'],
  ['practice-design-054', '응집도', '프로그램 시작 시 필요한 로그 열기, 캐시 비우기, 설정 읽기를 초기화 모듈에 묶었다. 데이터 흐름이나 단일 기능보다 실행 시점이 공통인 응집도 종류를 쓰시오.', ['시간적 응집도', '시간적', '시간'], '시간적 응집도는 같은 시점에 실행된다는 이유로 기능을 묶습니다. 앞의 출력이 뒤의 입력으로 이어지는 순차적 응집도나 하나의 목적만 수행하는 기능적 응집도와 다릅니다.', '2026-1-q20'],
  ['practice-design-068', 'UML 관계', '고객 클래스와 주문 클래스가 지속적으로 서로의 객체를 참조하며 한 고객이 여러 주문과 연결된다. 상속이나 일시적인 매개변수 사용이 아닌 일반적인 객체 연결 관계를 쓰시오.', ['연관', '연관 관계', 'Association'], '연관 관계는 클래스의 객체들이 지속적으로 연결되는 구조를 나타냅니다. 다중성 1 대 다 등을 함께 표현할 수 있습니다. 상속은 일반화, 일시적인 사용은 의존 관계입니다.', '2024-3-q14'],
  ['practice-development-010', '트리 순회', '루트 G의 자식은 왼쪽 H, 오른쪽 I이다. H의 자식은 왼쪽 J, 오른쪽 K이고 I는 오른쪽 자식 L만 갖는다. 나머지는 잎이다. 중위 순회 결과를 공백 없이 쓰시오.', ['JHKGIL', 'J H K G I L'], '중위 순회는 왼쪽 부분 트리→현재 노드→오른쪽 부분 트리입니다. H 부분 트리는 J-H-K, 루트는 G, I 부분 트리는 I-L이므로 JHKGIL입니다. 방문 방향과 부모의 방문 시점을 구분합니다.', '2026-2-q7'],
  ['practice-development-012', '해시 충돌 처리', '해시 테이블의 각 버킷에 연결 리스트를 두고 같은 해시 주소를 얻은 레코드들을 해당 리스트에 이어 저장한다. 충돌 해결 방법을 쓰시오.', ['체이닝', 'Chaining', '분리 연결법', '분리 연결'], '체이닝은 같은 버킷의 충돌 레코드를 연결 구조로 보관합니다. 다른 빈 버킷을 탐색하는 개방 주소법과 다릅니다. 해시 함수가 존재한다고 충돌 자체가 사라지는 것은 아닙니다.', '2023-2-q16'],
  ['practice-development-044', '커버리지 계산', '결정식은 A OR B이다. 테스트는 (A=참, B=거짓), (A=거짓, B=참) 두 개이며 단축 평가 없이 두 조건을 모두 평가한다. 전체 결정의 참·거짓 결과를 기준으로 분기 커버리지 백분율을 쓰시오.', ['50', '50%'], '두 테스트 모두 A OR B의 전체 결과는 참입니다. 전체 결정 결과 참·거짓 두 가지 중 참 하나만 실행하므로 분기 커버리지는 1/2×100=50%입니다. 개별 조건의 참·거짓을 모두 갖는 조건 커버리지와 혼동하지 않습니다.', '2024-3-q13'],
  ['practice-development-046', '통합 테스트', '① 상향식 통합에서 아직 없는 상위 호출자를 대신한다. ② 하향식 통합에서 아직 없는 하위 피호출자를 대신한다. ①, ②의 모듈 이름을 순서대로 쓰시오.', ['드라이버, 스텁', 'Driver, Stub', '드라이버, Stub', 'Driver, 스텁'], '①은 시험 대상을 호출하는 드라이버, ②는 시험 대상이 호출할 하위 기능을 흉내 내는 스텁입니다. 상향식은 아래에서 위로 결합하므로 상위 호출자, 하향식은 반대이므로 하위 모듈의 대역이 필요합니다.', '2026-1-q19'],
  ['practice-development-064', '경계값 분석', '정수 입력 n의 유효 범위는 -3 이상 8 이하이다. 경계값 분석에서 두 경계 바로 바깥의 무효값을 작은 값부터 쓰시오.', ['-4 9', '-4, 9'], '하한 -3 바로 바깥은 -4이고 상한 8 바로 바깥은 9입니다. -3과 8은 경계 자체이지만 유효값입니다. 부호와 포함 조건을 확인해야 하며 무효 구간의 임의 대표값을 묻는 문제가 아닙니다.', '2026-2-q1'],
  ['practice-development-066', '선택 정렬', '배열 [8,6,9,3,5]를 오름차순 선택 정렬한다. 매 회차 미정렬 구간의 최솟값을 찾아 그 구간의 첫 값과 교환한다. 두 회차 후 배열을 공백으로 구분해 쓰시오.', ['3 5 9 8 6', '3,5,9,8,6'], '첫 회차 최솟값 3과 맨 앞 8을 바꾸면 [3,6,9,8,5]입니다. 둘째 회차는 뒤 네 값 중 최솟값 5를 6과 바꾸므로 [3,5,9,8,6]입니다. 버블 정렬의 인접 교환 과정과 구분합니다.', '2023-2-q18'],
  ['practice-database-004', '관계대수', 'R(A,B,C)={(1,x,p),(1,x,q),(2,y,p),(2,x,p)}이다. 집합 의미의 관계대수에서 πA,B(R)의 튜플 수를 쓰시오.', ['3'], 'A와 B만 남기면 (1,x), (1,x), (2,y), (2,x)입니다. 관계대수 프로젝션은 중복 튜플을 제거하므로 서로 다른 세 튜플이 남습니다. 한 열이 같아도 다른 열이 다르면 별개 튜플입니다.', '2025-2-q20'],
  ['practice-database-022', '3단계 스키마', '데이터 파일의 레코드 배치, 저장 경로, 접근 방법처럼 물리적인 저장 구조를 정의하는 데이터베이스 스키마를 쓰시오.', ['내부 스키마', '내부', 'Internal Schema'], '내부 스키마는 저장 장치 관점의 물리 구조입니다. 개념 스키마는 조직 전체의 통합 논리 구조, 외부 스키마는 사용자나 응용 프로그램별 데이터 관점을 정의합니다.', '2023-1-q18'],
  ['practice-database-042', '조인', 'R(A,B)와 S(B,C)의 같은 이름 B 열에 대해 값이 같은 행을 연결한다. 결과에서는 두 B 열을 하나만 남기고 별도의 비교 조건을 지정하지 않는다. 관계대수 조인 이름을 쓰시오.', ['자연 조인', 'Natural Join'], '자연 조인은 같은 이름의 속성들을 동등 조건으로 연결하고 중복 조인 속성을 하나만 남깁니다. 일반 동등 조인은 두 조인 열을 모두 남길 수 있으며 단순 카티션 곱은 모든 행 조합을 만듭니다.', '2024-1-q8'],
  ['practice-database-054', 'SQL 삭제', '학생 테이블에서 점수가 40 미만인 행을 삭제한다. SQL의 ①에 들어갈 명령 키워드만 쓰시오.\n① FROM 학생 WHERE 점수 < 40;', ['DELETE'], 'DELETE FROM 테이블 WHERE 조건은 조건을 만족하는 행을 삭제합니다. DROP은 테이블이나 뷰 같은 객체 정의를 제거하며 TRUNCATE는 이와 같은 WHERE 조건을 붙여 일부 행만 삭제하는 명령이 아닙니다.', '2023-1-q13'],
  ['practice-database-056', 'SQL 갱신', '직원 테이블에서 부서가 개발인 직원의 수당을 100 늘린다. ①의 SQL 키워드만 쓰시오.\nUPDATE 직원 ① 수당 = 수당 + 100 WHERE 부서 = \'개발\';', ['SET'], 'UPDATE 뒤에는 대상 테이블, SET 뒤에는 열에 대입할 식을 씁니다. WHERE는 변경할 행을 선택합니다. VALUES는 INSERT에서 넣을 값을 지정하는 키워드이므로 이 자리에 사용할 수 없습니다.', '2024-2-q3'],
  ['practice-database-058', '정규형 판정', 'R(A,B,C)의 모든 속성은 원자값이고 후보키는 A 하나이다. 함수 종속 A→B, B→C가 성립하며 그 밖의 종속은 이들로부터 유도된다. BCNF까지의 범위에서 현재 만족하는 가장 높은 정규형을 쓰시오.', ['제2정규형', '2NF', '제 2정규형'], '후보키 A가 단일 속성이므로 비주요 속성에 대한 부분 함수 종속은 없고 2NF를 만족합니다. B→C에서 B는 슈퍼키가 아니고 C는 비주요 속성이므로 3NF를 위반합니다. 따라서 현재 최고는 2NF입니다.', '2026-2-q20'],
  ['practice-database-062', 'SQL 그룹 계산', '판매(지역,금액)에 (동,5),(동,15),(서,9),(서,12),(남,30)이 있다. 금액 10 이상인 행만 남긴 뒤 지역별로 묶고 SUM(금액)>=20인 그룹의 개수를 쓰시오.', ['1'], 'WHERE 적용 후 (동,15),(서,12),(남,30)이 남습니다. 지역별 합은 각각 15,12,30이고 HAVING 조건을 만족하는 것은 남 하나입니다. 집계 전에 제외된 5와 9를 합에 넣으면 안 됩니다.', '2023-1-q16'],
  ['practice-systems-044', '주소 변환', '여러 내부 호스트의 사설 IP 주소를 인터넷과 통신할 수 있는 공인 IP 주소로 변환한다. 이 주소 변환 기술의 약어를 쓰시오.', ['NAT', 'Network Address Translation', '네트워크 주소 변환'], 'NAT는 사설 주소와 공인 주소 등 서로 다른 주소 공간 사이에서 IP 주소를 변환합니다. ARP의 IP 대 MAC 주소 대응과 다릅니다. 포트 번호까지 이용해 다중 접속을 구분하는 경우는 NAPT/PAT로 세분합니다.', '2023-3-q12'],
  ['practice-systems-050', '암호 분류', '다음 중 비대칭키 알고리즘만 원래 나열 순서대로 쓰시오.\nAES, RSA, SEED, ECC, ARIA', ['RSA ECC', 'RSA, ECC'], 'RSA와 ECC는 공개키·개인키를 이용하는 비대칭키 계열입니다. AES·SEED·ARIA는 대칭키 계열입니다. 해시 함수처럼 원문 복원이 목적이 아닌 단방향 기술과도 구분합니다.', '2023-2-q15'],
  ['practice-systems-052', '네트워크 보안', 'IP 계층에서 패킷을 보호하며 AH와 ESP를 이용해 인증·무결성·기밀성 기능을 구성하는 보안 프로토콜 집합의 이름을 쓰시오.', ['IPsec', 'IPSec', 'IP Security'], 'IPsec은 IP 계층에서 사용하는 보안 프로토콜 집합입니다. AH는 인증·무결성에 초점을 두며 데이터 암호화를 제공하지 않고, ESP는 설정한 방식에 따라 기밀성과 인증 등을 제공합니다. 애플리케이션 원격 셸 프로토콜 SSH와 다릅니다.', '2024-2-q5'],
  ['practice-systems-064', '클라우드 서비스', '제공자가 가상 서버·스토리지·네트워크를 제공하고 이용자가 운영체제와 미들웨어, 응용 프로그램을 직접 설치·관리한다. 클라우드 서비스 모델의 약어를 쓰시오.', ['IaaS', 'Infrastructure as a Service'], 'IaaS는 가상화된 컴퓨팅 인프라를 제공하는 모델입니다. PaaS는 제공된 개발·실행 플랫폼에서 앱을 관리하고 SaaS는 완성된 소프트웨어를 이용하는 형태이므로 이용자의 관리 범위로 구분합니다.', '2023-3-q17'],
];

const written = new Map(writtenSpecs.map(([id, category, prompt, acceptedAnswers, explanation, ref]) => [id, {
  category, title: `${category} 실기형 연습`, prompt, acceptedAnswers, answerText: acceptedAnswers[0], explanation,
  examReferences: [`past-${ref}`], referenceBasis: '복원 자료의 핵심 개념을 적용한 창작 사례·확장 유형',
}]));
const solutionGuide = {
  rules: [
    '프로그램 시작 지점에서 호출과 반환 순서를 따라가며 변수값을 기록합니다. 호출마다 생기는 지역 변수와 객체 또는 노드에 계속 남는 값을 구분해야 합니다.',
    '참조나 포인터를 대입하면 객체나 노드 자체를 복제하는 것이 아니라 같은 저장 공간을 가리킬 수 있습니다. 각 문장에서 실제로 바뀌는 대상과 출력 시점의 값을 확인하세요.',
  ], caution: '함수나 메서드를 정의한 위치가 실행 순서는 아닙니다. 호출 지점에서 실제 객체와 연결 관계를 확인한 뒤 출력할 값만 답안에 적으세요.',
};

function codeReplacement(q, type, index) {
  if (type === 'C' && q.family === 'additional-list-relink-weight') {
    const values = [index + 3, index + 7, index + 2, index + 9];
    return { family: 'quality-c-list-links', title: '연결 리스트의 연결 변경',
      code: cProgram(`    Node a = {${values[0]}, NULL};\n    Node b = {${values[1]}, NULL};\n    Node c = {${values[2]}, NULL};\n    Node d = {${values[3]}, NULL};\n    a.next = &b; b.next = &c; c.next = &d;\n    Node *p = a.next;\n    a.next = p->next;\n    p->next = a.next->next;\n    a.next->next = p;\n    for (Node *n = &a; n != NULL; n = n->next) {\n        printf("%d ", n->value);\n    }`, 'typedef struct Node {\n    int value;\n    struct Node *next;\n} Node;'),
      answerText: [values[0], values[2], values[1], values[3]].join(' '),
      explanation: '초기 연결 a→b→c→d에서 p는 b를 가리킵니다. a.next를 c로 바꾸고 b.next를 d로 바꾼 뒤 c.next에 b를 연결하므로 a→c→b→d 순서가 됩니다. 값은 수정하지 않고 연결만 변경합니다. 가중합이나 추가 필터 없이 실제 방문 순서의 값만 출력합니다.',
      trace: [`초기 노드 값은 a=${values[0]}, b=${values[1]}, c=${values[2]}, d=${values[3]}이고 연결은 a→b→c→d입니다.`, 'p=a.next이므로 p는 b입니다. a.next=p->next를 실행하면 a는 c를 가리킵니다.', 'p->next=a.next->next에서 a.next는 c, c.next는 d이므로 b.next=d입니다.', 'a.next->next=p로 c.next=b를 설정해 최종 연결은 a→c→b→d입니다.', `a부터 next를 따라가며 ${[values[0], values[2], values[1], values[3]].join(' ')}를 출력하고 d.next가 NULL이어서 종료합니다.`],
      anchors: ['a.next = &b', 'a.next = p->next', 'p->next = a.next->next', 'a.next->next = p', 'printf'],
      examReferences: ['past-2025-2-q16', 'past-2025-1-q18'], solutionGuide };
  }
  if (type === 'Java' && q.family === 'finally-return') {
    const a = index + 2, b = index + 5;
    return { family: 'quality-java-constructor-order', title: '생성자와 공유 변수',
      code: javaProgram(`        Parent p = new Child(${b});\n        System.out.print(Parent.total + " " + p.read());`, `    static class Parent {\n        static int total = 0;\n        int value;\n        Parent(int x) {\n            value = x;\n            total += x;\n        }\n        int read() { return value; }\n    }\n    static class Child extends Parent {\n        int value;\n        Child(int x) {\n            super(x - ${a});\n            value = x;\n            total += value * 2;\n        }\n        @Override int read() { return super.read() + value; }\n    }`),
      answerText: `${b - a + b * 2} ${b - a + b}`,
      explanation: 'Child 생성자는 먼저 super로 Parent 생성자를 실행한 뒤 자기 필드를 초기화합니다. 부모 value와 자식 value는 별도 필드이며 static total은 클래스가 공유합니다. p.read()는 실제 Child 객체의 재정의 메서드를 호출하고 그 안의 super.read()는 부모 필드를 읽습니다.',
      trace: [`new Child(${b})에서 super(${b}-${a})가 먼저 호출됩니다.`, `Parent.value=${b - a}, total=0+${b - a}=${b - a}입니다.`, `Child.value=${b}, total=${b - a}+${b}×2=${b - a + b * 2}가 됩니다.`, `p.read()는 Child.read()를 실행합니다. super.read()는 Parent.value=${b - a}를 반환합니다.`, `Child.read()=${b - a}+${b}=${b - a + b}이므로 출력은 ${b - a + b * 2} ${b - a + b}입니다.`],
      anchors: ['Parent p', 'total += x', 'total += value', '@Override', 'System.out.print'],
      examReferences: ['past-2025-1-q13', 'past-2023-1-q20'], solutionGuide };
  }
  return null;
}

export function reviseQuestionQuality(questions, type) {
  const previous = [], audit = [];
  let index = 0;
  const revised = questions.map(q => {
    const change = type === 'exam' ? written.get(q.id) : codeReplacement(q, type, index);
    if (!change) return q;
    if (type !== 'exam') index++;
    previous.push(q);
    const next = { ...q, ...change, id: `${q.id}-r4`, qualityRevisionOf: q.id, source: '실기 복원 유형 기반 검수 창작' };
    audit.push({ type, previousId: q.id, id: next.id, topic: next.category || next.family, examReferences: next.examReferences });
    return next;
  });
  return { questions: revised, previous, audit };
}
