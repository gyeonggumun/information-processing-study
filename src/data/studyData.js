export const subjects = [
  {
    id: 'software-design',
    short: '소프트웨어 설계',
    description: '요구사항, UML, 설계 원칙, 디자인 패턴',
    color: 'blue',
    progress: 64,
    lessons: ['요구사항 확인', 'UML과 모델링', '화면 설계', '디자인 패턴'],
    materials: [
      { id: 'design-requirement', title: '요구사항 분류와 검증', kind: '핵심 요약', minutes: 12, description: '기능·비기능 요구사항을 구분하고 검증 기준을 정리합니다.', points: ['기능 요구사항과 비기능 요구사항', '요구사항 검증 기준', '요구사항 명세서 구성'] },
      { id: 'design-uml', title: 'UML 다이어그램 한눈에 보기', kind: '개념 노트', minutes: 18, description: '시험에 자주 나오는 구조·행위 다이어그램을 비교합니다.', points: ['클래스·객체·컴포넌트 다이어그램', '유스케이스와 시퀀스 다이어그램', '관계 표기법'] },
      { id: 'design-ui', title: '사용자 인터페이스 설계 원칙', kind: '암기 카드', minutes: 10, description: 'UI 설계의 3원칙과 품질 기준을 짧게 복습합니다.', points: ['직관성·유효성·학습성', '일관성과 접근성', '화면 설계서 확인 항목'] },
      { id: 'design-pattern', title: '디자인 패턴 비교표', kind: '비교 정리', minutes: 15, description: '생성·구조·행위 패턴의 목적과 대표 사례를 정리합니다.', points: ['Factory·Singleton', 'Adapter·Facade', 'Observer·Strategy'] },
    ],
  },
  {
    id: 'software-development',
    short: '소프트웨어 개발',
    description: '자료구조, 테스트, 형상관리, 애플리케이션 테스트',
    color: 'violet',
    progress: 48,
    lessons: ['데이터 입출력 구현', '통합 구현', '애플리케이션 테스트', '제품 소프트웨어 패키징'],
    materials: [
      { id: 'development-io', title: '데이터 입출력 구현 체크리스트', kind: '핵심 요약', minutes: 14, description: '파일·DB·인터페이스 기반 데이터 처리 흐름을 정리합니다.', points: ['데이터 검증과 예외 처리', '인터페이스 구현 순서', '입출력 오류 대응'] },
      { id: 'development-integration', title: '통합 구현 방식 정리', kind: '개념 노트', minutes: 13, description: '모듈 통합 방식과 테스트 대역을 비교합니다.', points: ['빅뱅·점진적 통합', '상향식과 하향식', '드라이버와 스텁'] },
      { id: 'development-test', title: '애플리케이션 테스트 기법', kind: '비교 정리', minutes: 17, description: '화이트박스·블랙박스 테스트의 핵심 차이를 확인합니다.', points: ['동등 분할과 경계값 분석', '조건·결정 커버리지', '결함 관리 절차'] },
      { id: 'development-config', title: '형상관리와 배포 기본', kind: '암기 카드', minutes: 9, description: '형상 항목과 변경 통제 흐름을 짧게 복습합니다.', points: ['형상 식별·통제·감사', '버전과 베이스라인', '릴리스 관리'] },
    ],
  },
  {
    id: 'database',
    short: '데이터베이스 구축',
    description: '관계 데이터베이스, SQL, 정규화, 트랜잭션',
    color: 'cyan',
    progress: 73,
    lessons: ['논리 데이터베이스 설계', 'SQL 응용', '정규화와 무결성', '트랜잭션'],
    materials: [
      { id: 'database-model', title: '관계형 데이터 모델 핵심', kind: '핵심 요약', minutes: 13, description: '키와 관계, 무결성 제약조건을 한 번에 정리합니다.', points: ['후보키·기본키·외래키', '개체·관계·속성', '무결성 제약조건'] },
      { id: 'database-sql', title: 'SQL 조인·집계 패턴', kind: '문법 노트', minutes: 20, description: 'SELECT, JOIN, GROUP BY에서 자주 틀리는 포인트를 모았습니다.', points: ['INNER·OUTER JOIN', 'GROUP BY와 HAVING', '서브쿼리'] },
      { id: 'database-normal', title: '정규화 단계별 판단법', kind: '비교 정리', minutes: 16, description: '함수 종속성을 기준으로 1~3정규형을 구분합니다.', points: ['부분 함수 종속', '이행 함수 종속', '이상 현상'] },
      { id: 'database-transaction', title: '트랜잭션과 회복', kind: '암기 카드', minutes: 11, description: 'ACID 특성과 로그 기반 회복 개념을 복습합니다.', points: ['원자성·일관성·격리성·지속성', 'COMMIT과 ROLLBACK', '장애 회복'] },
    ],
  },
  {
    id: 'programming',
    short: '프로그래밍 언어 활용',
    description: 'C, Java, Python 코드 해석과 실행 결과',
    color: 'orange',
    progress: 39,
    lessons: ['C 언어', 'Java', 'Python', '운영체제와 알고리즘'],
    materials: [
      { id: 'programming-c', title: 'C 포인터와 배열 정리', kind: '코드 노트', minutes: 18, description: '주소 연산과 포인터 배열 문제 풀이 순서를 정리합니다.', points: ['포인터 연산', '배열과 포인터 관계', '함수 호출 방식'] },
      { id: 'programming-java', title: 'Java 객체지향 핵심', kind: '핵심 요약', minutes: 16, description: '상속·다형성·오버라이딩 출력 문제의 기반을 다룹니다.', points: ['생성자 호출 순서', '오버로딩과 오버라이딩', '접근 제어자'] },
      { id: 'programming-python', title: 'Python 컬렉션 문법', kind: '코드 노트', minutes: 12, description: '리스트·딕셔너리·슬라이싱을 문제 풀이 관점에서 정리합니다.', points: ['인덱싱과 슬라이싱', '얕은 복사와 깊은 복사', '반복문과 컴프리헨션'] },
      { id: 'programming-algorithm', title: '운영체제·알고리즘 빈출 공식', kind: '암기 카드', minutes: 14, description: '페이지 교체와 프로세스 스케줄링의 계산 포인트를 모았습니다.', points: ['FIFO·LRU·LFU', '스케줄링 지표', '정렬 알고리즘 특징'] },
    ],
  },
  {
    id: 'systems',
    short: '정보시스템 구축 관리',
    description: '네트워크, 보안, 시스템 운영, 신기술',
    color: 'green',
    progress: 55,
    lessons: ['정보시스템 구축', '네트워크', '보안 구축', '신기술 동향'],
    materials: [
      { id: 'systems-network', title: '네트워크 계층과 장비', kind: '핵심 요약', minutes: 15, description: 'OSI 7계층과 주요 네트워크 장비의 역할을 정리합니다.', points: ['계층별 프로토콜', '라우터·스위치·게이트웨이', 'IP 주소와 서브넷'] },
      { id: 'systems-security', title: '보안 솔루션 비교표', kind: '비교 정리', minutes: 17, description: '방화벽, IDS, IPS와 접근통제 모델을 비교합니다.', points: ['IDS와 IPS', 'DAC·MAC·RBAC', '암호화 방식'] },
      { id: 'systems-operation', title: '시스템 운영 관리', kind: '개념 노트', minutes: 12, description: '장애 관리와 백업·복구의 기본 흐름을 정리합니다.', points: ['장애 대응 절차', '백업 유형', '가용성과 신뢰성'] },
      { id: 'systems-trend', title: '신기술 키워드 카드', kind: '암기 카드', minutes: 10, description: '시험에 등장할 수 있는 IT 신기술 용어를 모았습니다.', points: ['클라우드 컴퓨팅', 'IoT와 디지털 트윈', '블록체인'] },
    ],
  },
];

export const recentQuestions = [
  { id: '2026-2-01', year: 2026, round: 2, number: 1, category: '테스트', type: '단답형', title: '동치분할 테스트 기법', solved: false },
  { id: '2026-2-11', year: 2026, round: 2, number: 11, category: '디자인 패턴', type: '단답형', title: 'Abstract Factory 패턴', solved: true },
  { id: '2025-3-18', year: 2025, round: 3, number: 18, category: '보안', type: '약술형', title: '접근통제 모델 MAC·RBAC·DAC', solved: true },
  { id: '2024-1-09', year: 2024, round: 1, number: 9, category: '운영체제', type: '계산형', title: 'LRU·LFU 페이지 부재', solved: false },
];

export const practiceQuestions = [
  { id: 'demo-01', year: 2026, round: 2, number: 1, category: '테스트', type: '객관식', title: '동등 분할 테스트', prompt: '동등 분할 테스트 기법에 대한 설명으로 가장 알맞은 것은 무엇인가요?', choices: ['입력 범위를 동일한 처리 결과가 예상되는 클래스로 나눈다.', '모든 실행 경로를 한 번 이상 수행한다.', '소스 코드의 조건식을 모두 검증한다.', '결함이 많은 모듈에만 테스트를 집중한다.'], answer: 0, explanation: '동등 분할은 같은 결과가 기대되는 입력 영역을 동등 클래스 단위로 나누어 대표값을 테스트하는 블랙박스 기법입니다.' },
  { id: 'demo-02', year: 2026, round: 2, number: 5, category: 'UML', type: '객관식', title: 'UML 클래스 다이어그램', prompt: '정적 구조를 표현하는 UML 다이어그램은 무엇인가요?', choices: ['시퀀스 다이어그램', '활동 다이어그램', '클래스 다이어그램', '상태 다이어그램'], answer: 2, explanation: '클래스 다이어그램은 클래스, 속성, 연산 및 클래스 간 관계를 표현하는 정적 구조 다이어그램입니다.' },
  { id: 'demo-03', year: 2026, round: 2, number: 9, category: '데이터베이스', type: '객관식', title: '제3정규형', prompt: '제3정규형에서 제거하려는 함수 종속은 무엇인가요?', choices: ['완전 함수 종속', '이행 함수 종속', '다치 종속', '조인 종속'], answer: 1, explanation: '제3정규형은 기본키가 아닌 속성이 다른 기본키가 아닌 속성에 종속되는 이행 함수 종속을 제거합니다.' },
  { id: 'demo-04', year: 2026, round: 2, number: 13, category: '데이터베이스', type: '객관식', title: '트랜잭션 ACID', prompt: '트랜잭션이 완료된 결과가 영구적으로 보존되는 특성은 무엇인가요?', choices: ['원자성', '일관성', '격리성', '지속성'], answer: 3, explanation: '지속성은 성공적으로 완료된 트랜잭션의 결과가 시스템 장애 이후에도 보존되는 특성입니다.' },
  { id: 'demo-05', year: 2025, round: 3, number: 4, category: '운영체제', type: '객관식', title: 'LRU 페이지 교체', prompt: 'LRU 페이지 교체 알고리즘이 교체 대상으로 선택하는 페이지는 무엇인가요?', choices: ['가장 오랫동안 사용되지 않은 페이지', '가장 최근에 사용한 페이지', '가장 먼저 적재된 페이지', '참조 횟수가 가장 많은 페이지'], answer: 0, explanation: 'LRU는 가장 오래 전에 사용된 페이지를 교체하는 알고리즘입니다.' },
  { id: 'demo-06', year: 2025, round: 3, number: 8, category: '보안', type: '객관식', title: '침입 방지 시스템', prompt: '침입을 탐지한 뒤 차단 기능까지 수행하는 보안 솔루션은 무엇인가요?', choices: ['IDS', 'IPS', 'VPN', 'NAT'], answer: 1, explanation: 'IPS는 침입 탐지 기능에 더해 의심 트래픽을 차단하는 기능을 수행합니다.' },
  { id: 'demo-07', year: 2025, round: 3, number: 12, category: '암호화', type: '객관식', title: 'RSA 공개키 암호화', prompt: 'RSA 암호화 방식의 특징으로 알맞은 것은 무엇인가요?', choices: ['하나의 동일한 키를 사용한다.', '해시 함수만 사용한다.', '공개키와 개인키를 쌍으로 사용한다.', '블록 크기가 항상 128비트이다.'], answer: 2, explanation: 'RSA는 공개키와 개인키가 서로 다른 비대칭키 암호화 방식입니다.' },
  { id: 'demo-08', year: 2025, round: 2, number: 6, category: '네트워크', type: '객관식', title: '전송 계층', prompt: 'OSI 7계층에서 종단 간 신뢰성 있는 전송을 담당하는 계층은 무엇인가요?', choices: ['물리 계층', '데이터 링크 계층', '네트워크 계층', '전송 계층'], answer: 3, explanation: '전송 계층은 TCP, UDP 등을 통해 종단 간 데이터 전송과 흐름 제어를 담당합니다.' },
  { id: 'demo-09', year: 2024, round: 2, number: 3, category: '디자인 패턴', type: '객관식', title: 'Observer 패턴', prompt: '객체의 상태 변화가 여러 객체에 자동으로 전달되도록 하는 패턴은 무엇인가요?', choices: ['Observer', 'Adapter', 'Singleton', 'Facade'], answer: 0, explanation: 'Observer 패턴은 한 객체의 상태 변화에 따라 의존 객체들에게 자동으로 알림을 보내는 행위 패턴입니다.' },
  { id: 'demo-10', year: 2024, round: 1, number: 7, category: '형상관리', type: '객관식', title: '형상관리 활동', prompt: '소프트웨어 형상관리 활동에 해당하지 않는 것은 무엇인가요?', choices: ['형상 식별', '형상 통제', '형상 감사', '요구사항 제거'], answer: 3, explanation: '형상관리는 식별, 통제, 감사, 기록 등의 활동으로 구성되며 요구사항 제거 자체는 형상관리 활동이 아닙니다.' },
  { id: 'demo-11', year: 2024, round: 1, number: 11, category: 'Java', type: '객관식', title: '메서드 오버라이딩', prompt: '상위 클래스의 메서드를 하위 클래스에서 같은 시그니처로 재정의하는 것은 무엇인가요?', choices: ['오버로딩', '오버라이딩', '캡슐화', '추상화'], answer: 1, explanation: '오버라이딩은 상속 관계에서 상위 클래스 메서드를 하위 클래스가 동일한 시그니처로 재정의하는 것입니다.' },
  { id: 'demo-12', year: 2024, round: 1, number: 15, category: 'SQL', type: '객관식', title: 'HAVING 절', prompt: 'GROUP BY로 그룹화한 결과에 조건을 적용할 때 사용하는 절은 무엇인가요?', choices: ['WHERE', 'ORDER BY', 'HAVING', 'DISTINCT'], answer: 2, explanation: 'HAVING 절은 GROUP BY로 생성된 그룹에 조건을 적용할 때 사용합니다.' },
];

export const codeQuestions = {
  C: [
    { title: '포인터와 배열 주소 계산', difficulty: '중', tag: '포인터', solved: true },
    { title: '재귀 함수 실행 결과', difficulty: '중', tag: '재귀', solved: false },
    { title: '구조체와 함수 포인터', difficulty: '상', tag: '구조체', solved: false },
  ],
  Java: [
    { title: '상속과 오버라이딩 출력 결과', difficulty: '중', tag: '상속', solved: true },
    { title: '생성자 호출 순서', difficulty: '상', tag: '생성자', solved: false },
    { title: '예외처리와 finally', difficulty: '중', tag: '예외', solved: false },
  ],
  Python: [
    { title: '문자열 슬라이싱과 리스트', difficulty: '하', tag: '문자열', solved: true },
    { title: '딕셔너리 순회와 출력', difficulty: '중', tag: '딕셔너리', solved: false },
    { title: '얕은 복사와 리스트 연산', difficulty: '상', tag: '자료구조', solved: false },
  ],
};

export const stats = [
  { label: '소프트웨어 설계', value: 64, color: 'blue' },
  { label: '소프트웨어 개발', value: 48, color: 'violet' },
  { label: '데이터베이스 구축', value: 73, color: 'cyan' },
  { label: '프로그래밍 언어 활용', value: 39, color: 'orange' },
  { label: '정보시스템 구축 관리', value: 55, color: 'green' },
];
