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
          definition: '디자인 패턴은 반복해서 등장하는 설계 문제에 대해 객체의 역할과 협력 방법을 검증된 형태로 정리한 해결 아이디어입니다.',
          quickDescription: '반복되는 설계 문제를 푸는 검증된 방법입니다. 객체를 만들기·연결하기·협력하기 중 무엇이 핵심인지부터 고르면 됩니다.',
          memoryTip: '패턴 이름을 먼저 외우기보다 문제 상황을 보고 생성은 만들기, 구조는 연결하기, 행위는 협력하기로 분류하세요.',
          concept: '디자인 패턴은 그대로 복사하는 완성 코드가 아닙니다. 현재 프로그램의 문제를 패턴의 역할 구조로 바꾸어 적용하는 설계 설명서에 가깝습니다. 시험에서도 클래스 이름보다 어떤 문제를 해결하고 어떤 객체가 책임을 나누는지를 묻는 경우가 많습니다.',
          learningSteps: [
            { title: '1. 문제 상황 찾기', text: '생성 방식이 복잡한지, 서로 다른 객체를 연결해야 하는지, 객체 사이의 순서·통지가 복잡한지를 먼저 확인합니다.' },
            { title: '2. 패턴의 의도 선택하기', text: '패턴 이름을 떠올리기 전에 무엇을 바꾸고 싶은지 질문합니다. 생성·구조·행위 중 하나를 고르면 후보가 빠르게 좁혀집니다.' },
            { title: '3. 역할과 흐름 확인하기', text: '누가 객체를 만들고, 누가 요청을 전달하며, 누가 실제 작업을 수행하는지 역할을 나누어 봅니다. 이 흐름이 패턴의 핵심입니다.' },
            { title: '4. 장단점까지 설명하기', text: '패턴은 결합도를 낮추고 변경에 유리하지만 클래스 수와 간접 호출이 늘어날 수 있습니다. 적용 이유와 주의점을 함께 말할 수 있어야 합니다.' },
          ],
          image: '/learning/design-patterns-map.svg',
          imageAlt: '디자인 패턴을 생성, 구조, 행위 세 가지로 나눈 학습 도식',
          groups: [
            {
              name: '생성 패턴',
              color: 'blue',
              question: '무엇을 어떻게 만들까?',
              memory: '객체를 만드는 과정을 분리해 생성 방식이 바뀌어도 코드를 유연하게 합니다.',
              patterns: [
                ['Factory Method (팩토리 메서드)', '객체를 만드는 인터페이스는 유지하고 실제 객체의 종류는 하위 클래스가 결정합니다.', '상위 클래스는 작업 흐름과 생성 메서드의 규칙만 정의하고, 하위 클래스가 어떤 구체 객체를 만들지 선택합니다. 사용하는 쪽은 구체 클래스에 덜 의존합니다.', '알림 발송기가 EmailNotification 또는 SmsNotification을 직접 new하지 않고 하위 발송기의 생성 메서드가 알맞은 객체를 반환하는 경우입니다.', '하위 클래스가 생성할 구체 객체를 선택한다면 Factory Method를 의심합니다.'],
                ['Abstract Factory (추상 팩토리)', '서로 어울리는 객체 제품군을 한 번에 생성하는 인터페이스를 제공합니다.', '버튼·입력창처럼 함께 사용되어야 하는 제품들을 하나의 팩토리가 생성합니다. Windows용 제품과 macOS용 제품이 섞이지 않도록 제품군의 호환성을 보장합니다.', 'WindowsFactory는 WindowsButton과 WindowsCheckbox를, MacFactory는 MacButton과 MacCheckbox를 생성하는 UI 테마 시스템입니다.', '2026년 2회 복원 문제 연결: 연관된 객체 제품군 생성이라는 의도로 출제되었습니다.'],
                ['Builder (빌더)', '복잡한 객체를 여러 단계로 조립하면서 같은 조립 절차로 서로 다른 결과를 만들 수 있게 합니다.', '생성자 매개변수가 많거나 선택 항목이 많은 객체를 단계별 메서드로 구성합니다. 조립 순서를 고정하거나 필요한 단계만 선택할 수 있습니다.', '햄버거의 빵·패티·소스·토핑을 차례로 선택해 기본 햄버거와 채식 햄버거를 같은 절차로 만드는 경우입니다.', '생성자 인자가 많고 선택적 속성이 많아 가독성이 떨어지면 Builder가 적합합니다.'],
                ['Prototype (프로토타입)', '새 객체를 처음부터 만들지 않고 이미 만들어진 객체를 복제하여 생성합니다.', '객체 생성 비용이 크거나 초기 설정이 복잡할 때 원본 객체를 복사합니다. 얕은 복사와 깊은 복사에 따라 내부 참조 객체의 공유 여부가 달라집니다.', '게임에서 기본 적 캐릭터를 하나 만든 뒤 위치·색상·능력치만 바꾸어 여러 적을 복제하는 경우입니다.', '기존 객체의 clone 또는 복사로 생성 비용을 줄이는지가 핵심입니다.'],
                ['Singleton (싱글톤)', '클래스의 인스턴스가 하나만 존재하도록 보장하고 공용 접근점을 제공합니다.', '생성자를 외부에서 직접 호출하지 못하게 하고 이미 만들어진 인스턴스를 반환합니다. 전역 상태가 되어 테스트와 병렬 처리에 영향을 줄 수 있으므로 남용하지 않습니다.', '애플리케이션 전체에서 하나의 설정 저장소만 사용하도록 ConfigManager 인스턴스를 하나로 제한하는 경우입니다.', '인스턴스 하나만 생성과 전역 접근을 함께 기억하세요.'],
              ],
            },
            {
              name: '구조 패턴',
              color: 'violet',
              question: '객체를 어떻게 연결할까?',
              memory: '객체와 클래스를 조합해 더 큰 구조를 만들고 호환성과 재사용성을 높입니다.',
              patterns: [
                ['Adapter (어댑터)', '호환되지 않는 인터페이스를 변환하여 기존 클래스와 클라이언트가 함께 동작하게 합니다.', '클라이언트가 기대하는 인터페이스를 Adapter가 구현하고 내부에서 기존 객체의 메서드를 호출합니다. 기존 코드를 수정하지 않고 연결할 수 있습니다.', 'USB-C 포트만 있는 노트북에서 HDMI 모니터를 사용하기 위해 HDMI 신호를 USB-C 형식으로 바꾸는 변환기입니다.', '이미 존재하는 클래스의 인터페이스를 바꾸지 않고 맞춰 연결하면 Adapter입니다.'],
                ['Bridge (브리지)', '추상화 계층과 구현 계층을 분리하여 두 계층을 독립적으로 확장합니다.', '상속으로 모든 조합을 만들면 클래스 수가 늘어날 수 있습니다. 상위 기능은 Abstraction에, 실제 동작 방식은 Implementor에 나누고 참조로 연결합니다.', '리모컨 종류와 TV·라디오 같은 기기 종류를 각각 확장하고 리모컨이 기기 구현체를 참조하도록 만드는 경우입니다.', '기능의 변화 축과 구현의 변화 축을 모두 독립적으로 바꾸려는지 확인합니다.'],
                ['Composite (컴포지트)', '개별 객체와 객체들의 묶음을 동일한 인터페이스로 다루는 트리 구조 패턴입니다.', 'Leaf는 실제 작업을 수행하고 Composite는 자식들을 보관하며 같은 작업을 자식에게 전달합니다. 클라이언트는 파일 하나와 폴더를 구분하지 않고 처리할 수 있습니다.', '파일과 폴더 모두 size()를 제공하고 폴더 크기는 내부 파일과 하위 폴더 크기의 합으로 계산하는 파일 시스템입니다.', '부분-전체 계층과 트리 구조, Leaf와 Composite가 보이면 Composite입니다.'],
                ['Decorator (데코레이터)', '객체를 감싸서 기존 객체의 기능을 실행 시점에 동적으로 추가합니다.', 'Decorator도 같은 Component 인터페이스를 구현하므로 여러 장식을 겹쳐 사용할 수 있습니다. 상속보다 조합으로 기능 조합을 유연하게 만듭니다.', '기본 커피 객체에 우유·시럽·휘핑크림 데코레이터를 차례로 감싸 가격과 설명을 추가하는 경우입니다.', '원본 객체의 인터페이스를 유지한 채 기능을 겹겹이 추가하면 Decorator입니다.'],
                ['Facade (퍼사드)', '복잡한 여러 하위 시스템을 단순한 하나의 창구로 감싸 사용하기 쉽게 합니다.', 'Facade가 내부 subsystem 객체들의 호출 순서를 조정하므로 클라이언트가 내부 구조를 알 필요가 없습니다. 하위 시스템 자체를 없애는 패턴은 아닙니다.', '파일 읽기·디코더·오디오·화면 장치를 각각 호출하지 않고 videoPlayer.play() 하나만 호출하는 경우입니다.', '복잡한 내부 절차를 단순한 메서드 하나로 제공하면 Facade입니다.'],
                ['Flyweight (플라이웨이트)', '많은 객체가 공유할 수 있는 상태를 나누어 메모리 사용량을 줄입니다.', '변하지 않고 공유 가능한 intrinsic state는 Flyweight에 저장하고, 객체마다 달라지는 extrinsic state는 외부에서 전달합니다. 유사 객체가 매우 많을 때 효과가 큽니다.', '문서의 모든 글자마다 글꼴 객체를 새로 만들지 않고 같은 글꼴·크기 조합을 공유하는 텍스트 편집기입니다.', '대량의 유사 객체, 내재 상태 공유, 외재 상태 분리를 확인합니다.'],
                ['Proxy (프록시)', '실제 객체 대신 앞에 서서 접근 제어, 지연 생성, 캐시, 원격 호출 등을 담당합니다.', 'Proxy와 RealSubject가 같은 인터페이스를 구현하므로 클라이언트는 차이를 모릅니다. 실제 객체를 필요할 때만 만들거나 권한을 확인한 뒤 호출할 수 있습니다.', '큰 이미지를 처음부터 불러오지 않고 썸네일을 먼저 보여준 뒤 필요할 때 원본을 읽는 경우입니다.', '대리 객체가 실제 객체에 대한 접근을 통제하거나 대신 처리하면 Proxy입니다.'],
              ],
            },
            {
              name: '행위 패턴',
              color: 'orange',
              question: '객체가 어떻게 협력할까?',
              memory: '객체 사이의 책임 분배와 알고리즘의 흐름을 유연하게 바꿉니다.',
              patterns: [
                ['Chain of Responsibility (책임 연쇄)', '요청을 처리할 객체들을 연결하고 처리할 수 있는 객체까지 순서대로 전달합니다.', '발신자는 최종 처리자가 누구인지 알 필요가 없습니다. 각 Handler가 처리하거나 다음 Handler로 넘기므로 조건문을 줄일 수 있지만 아무도 처리하지 못하는 상황을 고려해야 합니다.', '로그인 요청을 인증 검사, 권한 검사, 관리자 검사 순으로 통과시키는 미들웨어 체인입니다.', '요청이 여러 처리기를 순서대로 이동하고 각 처리기가 처리 여부를 결정하면 Chain입니다.'],
                ['Command (커맨드)', '실행할 요청을 객체로 캡슐화하여 요청의 호출자와 실행자를 분리합니다.', 'Command 객체 안에 Receiver와 실행 정보를 담으면 요청을 큐에 저장하거나 기록하고 undo·redo를 구현할 수 있습니다. 버튼은 실제 작업 내용을 몰라도 execute()만 호출합니다.', '문서 편집기의 복사·붙여넣기·삭제 동작을 명령 객체로 만들어 실행 취소 목록에 저장하는 경우입니다.', '요청을 객체로 만들고 실행·취소·큐잉이 필요하면 Command입니다.'],
                ['Interpreter (인터프리터)', '간단한 문법을 클래스로 표현하고 문장을 해석하여 결과를 계산합니다.', '문법 규칙마다 Expression을 만들고 각 표현식이 context를 해석합니다. 문법이 복잡해지면 클래스가 급증하므로 작은 DSL이나 반복되는 규칙에 적합합니다.', '가격 > 10000 AND 재고 있음 같은 검색 조건을 문법 객체로 구성해 상품을 필터링하는 경우입니다.', '문법·표현식·해석 context가 등장하고 직접 언어를 처리하면 Interpreter입니다.'],
                ['Iterator (이터레이터)', '컬렉션의 내부 구조를 노출하지 않고 요소를 순차적으로 탐색합니다.', 'hasNext()와 next() 같은 인터페이스로 배열·트리·연결 리스트를 같은 방식으로 순회합니다. 컬렉션의 저장 방식과 순회 방식을 분리합니다.', '내부가 배열인지 연결 리스트인지 몰라도 next()로 회원 목록을 읽는 경우입니다.', '컬렉션의 내부 구조를 숨긴 채 순회 객체를 제공하면 Iterator입니다.'],
                ['Mediator (중재자)', '객체들이 서로 직접 통신하지 않고 중재자 객체를 통해 협력하게 합니다.', '여러 객체가 서로를 모두 참조하는 다대다 관계를 Mediator 중심의 일대다 관계로 바꿉니다. 객체 간 결합은 줄지만 중재자에 로직이 집중될 수 있습니다.', '채팅방이 참가자들의 메시지 전달을 중재하여 참가자끼리 서로 직접 참조하지 않게 하는 경우입니다.', '복잡한 객체 간 통신을 한 객체가 조정하면 Mediator입니다.'],
                ['Memento (메멘토)', '객체의 상태를 저장해 두었다가 나중에 이전 상태로 복원합니다.', 'Originator가 자신의 상태를 Memento에 저장하고 Caretaker가 보관합니다. Caretaker는 내부 상태를 해석하지 않고 저장·복원 시점만 관리합니다.', '게임 저장 지점이나 문서 편집기의 실행 취소 기능처럼 이전 상태를 복원하는 경우입니다.', 'Originator·Memento·Caretaker 역할과 undo가 연결되면 Memento입니다.'],
                ['Observer (옵저버)', '한 객체의 상태가 바뀌면 그 객체를 구독한 여러 객체에 변경 내용을 알립니다.', 'Subject는 Observer 목록을 관리하고 상태 변화 때 notify합니다. 구독자 추가·삭제가 쉬운 대신 알림 순서와 연쇄 갱신, 구독 해제를 관리해야 합니다.', '주문 상태가 배송 완료로 바뀌면 앱 알림·이메일·화면 UI가 각각 업데이트되는 경우입니다.', '2026년 2회 복원 문제 연결: 한 객체의 상태 변화를 의존 객체에 전달하는 의도입니다.'],
                ['State (상태)', '객체의 내부 상태가 바뀌면 같은 요청의 처리 방식도 바뀌도록 상태별 객체에 행동을 위임합니다.', 'Context가 현재 State 객체를 가지고 행동을 State에 위임합니다. 상태 전환을 각 State가 결정하도록 하면 거대한 if·switch를 줄일 수 있습니다.', 'TCP 연결이 Closed·Listen·Established 상태에 따라 같은 send() 요청을 다르게 처리하는 경우입니다.', '하나의 객체가 현재 상태에 따라 행동을 바꾸고 상태 전환이 있으면 State입니다.'],
                ['Strategy (전략)', '같은 목적을 수행하는 알고리즘군을 분리하고 필요할 때 교체합니다.', 'Context는 Strategy 인터페이스만 알고 구체 알고리즘은 모릅니다. 실행 중에도 정렬·결제·압축 알고리즘을 바꿀 수 있어 조건문을 줄입니다.', '결제 수단에 따라 카드·카카오페이·가상계좌 전략을 바꾸어 결제하는 경우입니다.', '알고리즘을 별도 객체로 분리하고 상황에 따라 교체하면 Strategy입니다.'],
                ['Template Method (템플릿 메서드)', '알고리즘의 전체 뼈대는 상위 클래스에 두고 일부 단계만 하위 클래스가 재정의합니다.', '상위 클래스의 template method가 고정된 순서를 호출하고 세부 단계를 하위 클래스에 맡깁니다. 공통 순서는 유지하면서 구현만 바꿀 수 있습니다.', '파일 처리 순서인 열기·읽기·변환·닫기는 같고 CSV와 JSON의 읽기·변환만 하위 클래스가 구현하는 경우입니다.', '상속, 공통 알고리즘 순서, 하위 클래스의 일부 단계 구현이 함께 나오면 Template Method입니다.'],
                ['Visitor (방문자)', '객체 구조의 원소 클래스를 바꾸지 않고 새로운 연산을 추가합니다.', 'Visitor가 각 Element 타입별 visit 메서드를 제공하고 Element가 accept(visitor)를 호출합니다. 구조는 안정적이고 연산이 자주 추가될 때 유리합니다.', '문서의 제목·본문·표 구조는 그대로 두고 PDF 출력·맞춤법 검사·통계 집계를 별도 Visitor로 추가하는 경우입니다.', '객체 구조와 그 위에서 수행할 연산을 분리하고 이중 디스패치를 사용하면 Visitor입니다.'],
              ],
            },
          ],
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
