export const subjects = [
  {
    id: 'software-design',
    short: '소프트웨어 설계',
    description: '요구사항, UML, 설계 원칙, 디자인 패턴',
    color: 'blue',
    progress: 0,
    lessons: ['디자인 패턴'],
    materials: [
      {
        id: 'design-pattern',
        title: '디자인 패턴: 문제에 맞는 설계 도구',
        kind: '핵심 학습',
        minutes: 20,
        description: '디자인 패턴의 3가지 분류와 시험에 자주 연결되는 대표 패턴을 한 번에 정리합니다.',
        points: ['생성·구조·행위 패턴의 차이', '대표 패턴의 목적을 한 문장으로 기억하기', '문제에서 패턴의 의도를 먼저 찾기'],
        detail: {
          definition: '반복해서 등장하는 설계 문제에 검증된 해결 구조를 적용하는 방법입니다.',
          memoryTip: '생성은 만들기, 구조는 연결하기, 행위는 협력하기로 기억하세요.',
          image: '/learning/design-patterns-map.svg',
          imageAlt: '디자인 패턴을 생성, 구조, 행위 세 가지로 나눈 학습 도식',
          groups: [
            {
              name: '생성 패턴',
              color: 'blue',
              question: '무엇을 어떻게 만들까?',
              memory: '객체를 만드는 과정을 분리해 생성 방식이 바뀌어도 코드를 유연하게 합니다.',
              patterns: [
                ['Factory Method', '객체 생성을 하위 클래스에 맡겨 생성 로직을 분리'],
                ['Abstract Factory', '서로 연관된 객체 제품군을 묶어서 생성'],
                ['Builder', '복잡한 객체를 단계별로 조립'],
                ['Prototype', '기존 객체를 복제해 새로운 객체 생성'],
                ['Singleton', '클래스의 인스턴스를 하나만 만들고 공동 사용'],
              ],
            },
            {
              name: '구조 패턴',
              color: 'violet',
              question: '객체를 어떻게 연결할까?',
              memory: '객체와 클래스를 조합해 더 큰 구조를 만들고 호환성과 재사용성을 높입니다.',
              patterns: [
                ['Adapter', '서로 다른 인터페이스를 변환해 함께 사용'],
                ['Bridge', '추상화와 구현을 분리해 각각 확장'],
                ['Composite', '개별 객체와 복합 객체를 같은 방식으로 다룸'],
                ['Decorator', '객체를 감싸 기능을 동적으로 추가'],
                ['Facade', '복잡한 내부 기능을 단순한 창구로 제공'],
                ['Proxy', '실제 객체 앞에서 접근을 제어하거나 대리'],
              ],
            },
            {
              name: '행위 패턴',
              color: 'orange',
              question: '객체가 어떻게 협력할까?',
              memory: '객체 사이의 책임 분배와 알고리즘의 흐름을 유연하게 바꿉니다.',
              patterns: [
                ['Chain of Responsibility', '요청을 처리할 객체들을 연결해 순서대로 전달'],
                ['Command', '요청을 객체로 캡슐화해 실행·취소를 분리'],
                ['Iterator', '컬렉션 내부 구조를 숨기고 요소를 순차 접근'],
                ['Observer', '한 객체의 상태 변화를 여러 객체에 알림'],
                ['State', '상태에 따라 같은 동작을 다르게 처리'],
                ['Strategy', '알고리즘을 분리해 상황에 따라 교체'],
                ['Template Method', '공통 처리 흐름은 상위 클래스에 정의'],
              ],
            },
          ],
          examFocus: ['Abstract Factory: 연관된 객체 제품군 생성', 'Singleton: 인스턴스 하나만 생성', 'Observer: 상태 변화를 의존 객체에 전달', 'Strategy: 알고리즘을 교체 가능한 형태로 분리'],
        },
      },
    ],
  },
  {
    id: 'software-development',
    short: '소프트웨어 개발',
    description: '자료구조, 테스트, 형상관리, 애플리케이션 테스트',
    color: 'violet',
    progress: 0,
    lessons: [],
    materials: [],
  },
  {
    id: 'database',
    short: '데이터베이스 구축',
    description: '관계 데이터베이스, SQL, 정규화, 트랜잭션',
    color: 'cyan',
    progress: 0,
    lessons: [],
    materials: [],
  },
  {
    id: 'programming',
    short: '프로그래밍 언어 활용',
    description: 'C, Java, Python 코드 해석과 실행 결과',
    color: 'orange',
    progress: 0,
    lessons: [],
    materials: [],
  },
  {
    id: 'systems',
    short: '정보시스템 구축 관리',
    description: '네트워크, 보안, 시스템 운영, 신기술',
    color: 'green',
    progress: 0,
    lessons: [],
    materials: [],
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

export const practiceStats = [
  { label: '기출문제', solved: 24, correct: 18, color: 'blue' },
  { label: 'C', solved: 12, correct: 9, color: 'cyan' },
  { label: 'Java', solved: 10, correct: 8, color: 'orange' },
  { label: 'Python', solved: 14, correct: 12, color: 'green' },
];

export const stats = [
  { label: '소프트웨어 설계', value: 64, color: 'blue' },
  { label: '소프트웨어 개발', value: 48, color: 'violet' },
  { label: '데이터베이스 구축', value: 73, color: 'cyan' },
  { label: '프로그래밍 언어 활용', value: 39, color: 'orange' },
  { label: '정보시스템 구축 관리', value: 55, color: 'green' },
];
