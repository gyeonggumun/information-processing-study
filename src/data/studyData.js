export const subjects = [
  {
    id: 'software-design',
    short: '소프트웨어 설계',
    description: '요구사항, UML, 설계 원칙, 디자인 패턴',
    color: 'blue',
    progress: 64,
    lessons: ['요구사항 확인', 'UML과 모델링', '화면 설계', '디자인 패턴'],
  },
  {
    id: 'software-development',
    short: '소프트웨어 개발',
    description: '자료구조, 테스트, 형상관리, 애플리케이션 테스트',
    color: 'violet',
    progress: 48,
    lessons: ['데이터 입출력 구현', '통합 구현', '애플리케이션 테스트', '제품 소프트웨어 패키징'],
  },
  {
    id: 'database',
    short: '데이터베이스 구축',
    description: '관계 데이터베이스, SQL, 정규화, 트랜잭션',
    color: 'cyan',
    progress: 73,
    lessons: ['논리 데이터베이스 설계', 'SQL 응용', '정규화와 무결성', '트랜잭션'],
  },
  {
    id: 'programming',
    short: '프로그래밍 언어 활용',
    description: 'C, Java, Python 코드 해석과 실행 결과',
    color: 'orange',
    progress: 39,
    lessons: ['C 언어', 'Java', 'Python', '운영체제와 알고리즘'],
  },
  {
    id: 'systems',
    short: '정보시스템 구축 관리',
    description: '네트워크, 보안, 시스템 운영, 신기술',
    color: 'green',
    progress: 55,
    lessons: ['정보시스템 구축', '네트워크', '보안 구축', '신기술 동향'],
  },
];

export const recentQuestions = [
  { id: '2026-2-01', year: 2026, round: 2, number: 1, category: '테스트', type: '단답형', title: '동치분할 테스트 기법', solved: false },
  { id: '2026-2-11', year: 2026, round: 2, number: 11, category: '디자인 패턴', type: '단답형', title: 'Abstract Factory 패턴', solved: true },
  { id: '2025-3-18', year: 2025, round: 3, number: 18, category: '보안', type: '약술형', title: '접근통제 모델 MAC·RBAC·DAC', solved: true },
  { id: '2024-1-09', year: 2024, round: 1, number: 9, category: '운영체제', type: '계산형', title: 'LRU·LFU 페이지 부재', solved: false },
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
