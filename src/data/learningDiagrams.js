// 복잡하거나 주제와 맞지 않는 정적 이미지를 대신하는, 확대 가능한 학습 도식.
export const learningDiagrams = {
  'advanced-uml-and-solid': {
    title: 'UML 분류와 설계 원칙',
    items: [
      ['구조 다이어그램', '복합체 구조: 부품·포트·커넥터로 내부 구성을 표현'],
      ['행동 → 상호작용', '타이밍: 시간에 따른 상태 / 상호작용 개요: 시나리오 간 흐름'],
      ['SOLID', '단일 책임 · 개방 폐쇄 · 리스코프 교체 · 인터페이스 분리 · 의존성 역전'],
      ['모듈 의존', '팬인: 나를 호출하는 모듈 수 / 팬아웃: 내가 호출하는 모듈 수'],
    ],
  },
  'relational-model-and-keys': {
    title: '키의 포함 관계와 참조 관계',
    items: [
      ['슈퍼키', '행을 유일하게 식별하는 모든 속성 조합'],
      ['후보키 ⊂ 슈퍼키', '유일성을 유지하며 불필요한 속성을 제거한 최소 조합'],
      ['기본키 ∈ 후보키', '후보키 중 대표로 선택한 키'],
      ['외래키는 별도 역할', '다른 테이블의 후보키·기본키 등을 참조하는 속성. 기본키의 하위 종류가 아님'],
    ],
  },
  'er-modeling-and-logical-design': {
    title: 'ER 모델을 테이블로 바꾸기',
    items: [
      ['고객 엔터티', '고객ID(PK), 이름'],
      ['주문 엔터티', '주문ID(PK), 고객ID(FK), 주문일'],
      ['고객 1 : N 주문', '고객 한 명은 주문 여러 건을 가질 수 있음'],
      ['논리 모델 변환', '주문.고객ID → 고객.고객ID를 참조해 관계를 표현'],
    ],
  },
  'normalization-and-functional-dependency': {
    title: '정규화: 중복을 줄이는 순서',
    flow: true,
    items: [
      ['1NF', '각 칸에 원자값 하나만 저장'],
      ['2NF', '복합키의 일부에만 의존하는 속성 분리'],
      ['3NF', '키가 아닌 속성을 거쳐 의존하는 속성 분리'],
      ['BCNF', '모든 결정자가 후보키가 되도록 분리'],
    ],
  },
  'programming-basics-and-execution': {
    title: '출력 문제 풀이 순서',
    flow: true,
    items: [
      ['자료형', '정수·실수·문자열과 초기값을 확인'],
      ['연산', '괄호와 우선순위, 정수 나눗셈을 계산'],
      ['상태 변화', '증감·대입·반복마다 변수 값을 갱신'],
      ['출력', '언어별 형식과 공백·줄바꿈을 마지막에 확인'],
    ],
  },
  'c-pointers-and-structures': {
    title: 'C 포인터와 상태 추적',
    items: [
      ['주소와 값', 'int x = 3; int *p = &x; → p는 주소, *p는 3'],
      ['배열 이동', 'p + 1은 다음 int 원소를 가리킴. 바이트 1칸 이동이 아님'],
      ['구조체 접근', '변수.member / 포인터->member'],
      ['static 지역 변수', '호출 사이 값을 유지. 연속 호출은 각각 별도 문장으로 추적'],
    ],
  },
  'java-static-operators-and-standard-features': {
    title: 'Java 참조 비교와 공유 멤버',
    items: [
      ['문자열 리터럴', 'String a = "Java", b = "Java"; → a == b 는 true (리터럴 공유)'],
      ['새 문자열 객체', 'String c = new String("Java"); → a == c 는 false'],
      ['내용 비교', 'a.equals(c)는 true. 같은 글자지만 참조는 다름'],
      ['static 멤버', '클래스에 속해 모든 인스턴스가 공유. 인스턴스 필드는 객체마다 별도'],
    ],
  },
  'process-scheduling-and-management': {
    title: '프로세스 상태 전이',
    items: [
      ['준비 → 실행', '디스패치: CPU를 할당받음'],
      ['실행 → 준비', '시간 할당량 만료 등으로 선점됨'],
      ['실행 → 대기 → 준비', '입출력을 기다리다 완료되면 준비 큐로 돌아감'],
      ['실행 → 종료', '프로세스의 작업이 끝남'],
    ],
  },
  'architecture-views-and-evaluation': {
    title: '아키텍처 뷰와 평가',
    items: [
      ['4+1 뷰', '유스케이스를 중심으로 논리·프로세스·구현·배포 뷰를 연결'],
      ['SAAM', '변경 시나리오로 수정 용이성을 분석'],
      ['ATAM', '품질 속성 사이의 절충과 위험을 분석'],
      ['CBAM', '품질 개선의 비용과 기대 이익까지 비교'],
    ],
  },
  'nonfunctional-requirements-and-architecture-patterns': {
    title: '비기능 요구와 구조 선택',
    items: [
      ['비기능 요구', '성능·보안·가용성·유지보수성처럼 동작의 품질을 정의'],
      ['계층형', '역할을 층으로 분리해 변경 영향을 제한'],
      ['파이프–필터', '입력을 순차 변환하는 처리 단계에 적합'],
      ['MVC', '모델·뷰·컨트롤러의 책임을 분리'],
    ],
  },
  'test-cases-coverage-and-eai': {
    title: '테스트 설계와 통합',
    items: [
      ['테스트 케이스', '입력·사전 조건·절차·기대 결과를 기록'],
      ['커버리지', '문장·분기·조건이 얼마나 실행됐는지 측정'],
      ['Stub / Driver', '하향식에서 하위 모듈 대역 / 상향식에서 상위 호출자 대역'],
      ['EAI', '서로 다른 업무 애플리케이션의 데이터·기능을 연계'],
    ],
  },
  'software-quality-cmmi-and-bad-code': {
    title: '품질 개선의 세 관점',
    items: [
      ['CMMI 성숙도', '초기 → 관리 → 정의 → 정량 관리 → 최적화'],
      ['코드 리뷰', '동료가 결함·규약·유지보수성을 검토'],
      ['코드 냄새', '중복 코드·긴 함수·불명확한 이름을 찾음'],
      ['개선', '리팩터링과 자동화 테스트로 변경 위험을 줄임'],
    ],
  },
  'database-design-procedure-and-access-method': {
    title: 'DB 설계와 접근 방식',
    items: [
      ['설계 절차', '요구사항 → 개념 → 논리 → 물리 → 구현'],
      ['순차 접근', '처음부터 차례로 읽음. 전체 처리에 적합'],
      ['색인 접근', '키로 위치를 찾음. 검색에 유리'],
      ['해시 접근', '키의 해시값으로 버킷 탐색. 동등 검색에 유리'],
    ],
  },
  'transaction-states-isolation-and-olap': {
    title: '트랜잭션과 분석 저장',
    items: [
      ['정상 상태', 'Active → Partially Committed → Committed'],
      ['오류 상태', 'Failed → Aborted(롤백 완료)'],
      ['격리 수준', 'Read Uncommitted → Read Committed → Repeatable Read → Serializable'],
      ['OLAP', 'MOLAP: 큐브 / ROLAP: 관계형 / HOLAP: 혼합'],
    ],
  },
  'c-dynamic-memory-and-function-pointers': {
    title: 'C의 힙과 함수 주소',
    items: [
      ['할당', 'malloc: 초기화하지 않음 / calloc: 0으로 초기화'],
      ['크기 변경', 'realloc은 새 주소를 반환할 수도 있음'],
      ['해제', 'free 이후 해당 메모리를 다시 읽거나 쓰면 안 됨'],
      ['함수 포인터', '반환형·매개변수형이 일치하는 함수 주소를 저장해 호출'],
    ],
  },
  'java-lambda-static-hiding-and-exceptions': {
    title: 'Java 호출과 예외 흐름',
    items: [
      ['람다', '추상 메서드 하나인 함수형 인터페이스를 간결하게 구현'],
      ['static 숨김', '참조 변수의 선언형 기준으로 메서드 선택'],
      ['인스턴스 재정의', '실제 객체의 타입 기준으로 메서드 선택'],
      ['예외', 'try → 일치하는 catch → finally 순서로 추적'],
    ],
  },
  'network-protocol-details-and-error-control': {
    title: '주소·제어·오류 처리',
    items: [
      ['주소 변환', 'ARP: IP→MAC / NAT: 사설·공인 주소 변환'],
      ['제어 메시지', 'ICMP: 오류·진단 / IGMP: 멀티캐스트 그룹 관리'],
      ['HDLC 프레임', 'I: 정보 / S: 감독 / U: 비번호 제어'],
      ['오류 처리', 'CRC: 검출 / 해밍 코드: 정정 가능'],
    ],
  },
  'security-named-terms-and-authentication': {
    title: '공격·인증·관리의 역할',
    items: [
      ['공격', '세션 탈취·피싱·랜섬웨어 등 대상과 목적을 확인'],
      ['OTP', '한 번만 쓰는 인증값'],
      ['OAuth / SSO', '권한 위임 / 한 번의 로그인으로 여러 서비스 이용'],
      ['ISMS', '조직의 정보보호 관리체계 인증 기준'],
    ],
  },
  'ipc-disaster-and-cloud-operations': {
    title: '운영 용어를 목적별로 구분',
    items: [
      ['IPC / Semaphore', '프로세스 간 정보 전달 / 공유 자원 사용 순서 제어'],
      ['BIA', '장애가 업무에 미치는 영향을 분석'],
      ['RTO / RPO', '복구까지 허용 시간 / 복구 가능한 데이터 시점'],
      ['SDDC / HDFS / MapReduce', '소프트웨어 정의 인프라 / 분산 저장 / 분산 계산'],
    ],
  },
  'project-planning-and-estimation': {
    title: '프로젝트 계획과 개발 단계',
    flow: true,
    items: [
      ['계획·분석', '범위·일정·비용을 정하고 요구사항을 분석'],
      ['설계·구현', '구조를 설계한 뒤 기능을 구현'],
      ['시험·배포', '요구 충족 여부를 검증하고 운영 환경에 반영'],
      ['운영·유지보수', '장애 수정과 환경·요구 변화에 대응'],
    ],
  },
  'server-program-implementation': {
    title: '서버 요청과 응답의 방향',
    items: [
      ['요청', '클라이언트 → Controller → Service'],
      ['데이터 접근', 'Service → Repository → DB'],
      ['응답', 'DB → Repository → Service → Controller → 클라이언트'],
      ['공통 관심사', '검증·인증·예외 처리·로그는 필요한 지점에 적용'],
    ],
  },
  'software-maintenance': {
    title: '유지보수는 목적에 따라 구분',
    items: [
      ['수정', '발견된 결함을 고침'],
      ['적응', '운영 환경 변화에 맞춤'],
      ['완전', '성능·기능·사용성을 개선'],
      ['예방', '장래의 장애를 줄이도록 구조와 품질을 개선'],
    ],
  },
  'sorting-and-data-structures': {
    title: '정렬과 자료구조의 핵심 동작',
    items: [
      ['버블 정렬', '인접한 두 값을 비교·교환해 큰 값을 끝으로 이동'],
      ['선택·삽입 정렬', '최솟값을 선택해 교환 / 현재 값을 정렬된 구간에 삽입'],
      ['스택', 'LIFO: 마지막으로 넣은 값을 먼저 꺼냄'],
      ['큐', 'FIFO: 먼저 넣은 값을 먼저 꺼냄. 삽입은 rear, 삭제는 front'],
    ],
  },
  'python-functions-classes-and-copy': {
    title: 'Python 객체와 복사의 차이',
    items: [
      ['변수 범위', '함수 안에서 만든 지역 변수는 함수 밖에서 직접 읽을 수 없음'],
      ['인스턴스 변수', 'self.name처럼 객체마다 따로 저장'],
      ['클래스 변수', '클래스에 정의하고 인스턴스가 공유할 수 있음'],
      ['얕은 / 깊은 복사', '중첩 객체를 공유 / 중첩 객체까지 재귀적으로 복사'],
    ],
  },
  'java-oop-and-polymorphism': {
    title: 'Java 상속과 실행 대상',
    items: [
      ['추상 클래스·인터페이스', '공통 규약을 정의하고 하위 클래스가 필요한 메서드를 구현'],
      ['오버라이딩', 'Animal a = new Dog(); a.sound(); → Dog의 인스턴스 메서드 실행'],
      ['super(...)', '현재 생성자에서 상위 클래스 생성자를 호출'],
      ['this(...)', '같은 클래스의 다른 생성자에 위임. 한 생성자에서 super(...)와 동시에 직접 호출할 수 없음'],
    ],
  },
  'access-control-and-security-systems': {
    title: '접근 통제 모델과 보안 장비',
    items: [
      ['DAC / MAC', '소유자가 권한 부여 / 보안 등급과 정책으로 통제'],
      ['RBAC / ABAC', '역할에 따른 권한 / 사용자·자원·환경 속성으로 판단'],
      ['탐지와 차단', 'IDS는 침입 탐지, IPS는 침입 시도 차단'],
      ['서로 다른 역할', '방화벽·WAF·VPN·NAC는 적용 지점과 목적이 다르며 반드시 직렬로 놓이지 않음'],
    ],
  },
  'backup-recovery-and-disaster-recovery': {
    title: '백업 방식과 복구 목표',
    items: [
      ['전체 백업', '선택한 데이터를 모두 복사'],
      ['증분 백업', '직전 백업 이후 변경분을 저장. 복구에 연속된 증분 백업이 필요'],
      ['차등 백업', '마지막 전체 백업 이후 변경분을 저장. 전체와 최신 차등 백업으로 복구'],
      ['RPO / RTO', '허용 가능한 데이터 손실 시점 / 서비스 복구에 허용되는 시간'],
    ],
  },
  'virtualization-cloud-and-containers': {
    title: '가상화와 클라우드의 서로 다른 분류',
    items: [
      ['가상 머신', '하이퍼바이저 위에 게스트 OS를 포함해 격리'],
      ['컨테이너', '호스트 커널을 공유하며 앱과 의존성을 격리'],
      ['서비스 모델', 'IaaS: 인프라 / PaaS: 실행 환경 / SaaS: 완성 소프트웨어 / FaaS: 함수 실행'],
      ['배포 모델', '공개형·사설형·혼합형은 자원을 제공·운영하는 방식의 구분'],
    ],
  },
  'web-service-and-system-integration': {
    title: '시스템 연계 방식 비교',
    items: [
      ['SOAP / WSDL', 'SOAP은 XML 메시지 형식, WSDL은 서비스 인터페이스 설명'],
      ['UDDI', '서비스 등록·검색을 위한 레지스트리. 모든 SOAP 호출에 필수는 아님'],
      ['REST API', 'HTTP의 자원·메서드를 활용하며 JSON은 흔한 표현 형식 중 하나'],
      ['메시지 브로커', '발행자와 구독자 사이에서 메시지를 비동기로 전달'],
    ],
  },
  'network-models-and-topology': {
    title: '네트워크 계층과 전송 특성',
    items: [
      ['네트워크 계층', 'IP 주소를 사용해 목적지까지 패킷을 전달'],
      ['TCP', '연결·순서·재전송을 통해 신뢰성 있는 전송 제공'],
      ['UDP', '연결 설정과 전달 보장이 없는 간결한 데이터그램 전송'],
      ['응용 계층', 'HTTP·DNS 등 응용 서비스별 프로토콜을 사용'],
    ],
  },
};
