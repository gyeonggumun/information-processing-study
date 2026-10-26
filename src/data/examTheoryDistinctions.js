import { getPlainConcept, questionConceptNotes } from './plainConceptNotes.js';

const note = (name, meaning, contrast) => ({ name, displayName: name, meaning, contrast });
const concepts = (...names) => names.map(name => {
  const value = getPlainConcept(name);
  if (!value) throw new Error(`이론 구별점의 용어가 없습니다: ${name}`);
  return value;
});

// 보기 기호·복수 답안·숫자 답안은 문자열 추측 대신 검수한 문항 ID로 연결합니다.
const groups = {
  equivalence: concepts('동치 분할', '경계값 분석'),
  content: concepts('내용 결합도', '공통 결합도'),
  coupling: concepts('내용 결합도', '스탬프 결합도', '공통 결합도'),
  control: concepts('제어 결합도', '자료 결합도'),
  hash: [note('암호학적 해시와 암호화', '암호학적 해시는 입력을 고정 길이 요약값으로 바꾸어 원래 입력을 알아내거나 충돌을 찾기 어렵게 설계합니다.', '암호화는 대응하는 키로 복호화할 수 있지만 해시는 복호화용 키가 없습니다. 같은 해시값이 존재할 수 없다는 뜻은 아닙니다.')],
  hashTable: [note('해싱과 충돌', '해싱은 키에서 저장·검색 위치를 계산하는 방법이고, 충돌은 서로 다른 키가 같은 해시 위치나 값에 대응하는 현상입니다.', '해싱은 처리 방법, 충돌은 그 과정에서 생길 수 있는 사건입니다. 자료구조의 해싱이 항상 보안용 암호학적 해시를 뜻하지는 않습니다.')],
  normalization: [
    note('제3정규형(3NF)', '비자명 함수 종속 X→A마다 X가 슈퍼키이거나 A가 후보키를 구성하는 주요 속성이면 3NF를 만족합니다.', '2NF의 부분 함수 종속 제거와 구별합니다. 단일 속성 후보키라도 비키 속성 사이의 이행 종속 때문에 3NF를 위반할 수 있습니다.'),
    note('BCNF', '모든 비자명 함수 종속의 결정자가 슈퍼키여야 하는 정규형입니다. 3NF보다 엄격한 조건입니다.', '3NF에는 오른쪽 속성이 주요 속성인 예외가 있지만 BCNF에는 없습니다. 후보키·함수 종속을 먼저 확인해야 판정할 수 있습니다.'),
  ],
  bridgeObserver: concepts('Bridge', 'Observer'),
  design: [note('개념적·논리적·물리적 설계', '개념적 설계는 개체와 관계, 논리적 설계는 관계 스키마와 제약, 물리적 설계는 저장 구조와 접근 경로를 정합니다.', '무엇을 저장할지 모델링 → 표로 어떻게 표현할지 결정 → 실제로 어떻게 저장·접근할지 결정하는 단계입니다. 요구 분석과 실제 구현도 구분합니다.')],
  requirements: [note('운영·자원·성능 요구사항', '운영은 로그·모니터링 등 관리 방식, 자원은 메모리·저장 공간의 필요량과 한계, 성능은 응답 시간·처리량의 기준입니다.', '운영은 어떻게 관리하는지, 자원은 무엇을 얼마나 쓰는지, 성능은 얼마나 빨리·많이 처리하는지로 구별합니다. 문항에 제시된 분류를 기준으로 판단합니다.')],
  isms: [note('ISMS(정보보호 관리체계)', '조직이 정보보호 정책을 세우고 위험을 평가하며 보호 활동을 지속적으로 운영·점검하는 관리체계입니다.', '방화벽·백신은 개별 보호 도구이고 ISMS는 사람·절차·기술을 함께 관리하는 체계입니다. 보안 장비 하나를 도입했다는 뜻이 아닙니다.')],
  hdlc: [
    note('HDLC의 I·S·U 프레임', 'I 프레임은 사용자 데이터, S 프레임은 흐름·오류 제어, U 프레임은 연결 설정·해제 등 링크 관리를 주로 담당합니다.', '데이터 전달인지, 전송 상태 감독인지, 링크 관리인지를 나눕니다. ABM·ARM은 프레임 종류가 아니라 동작 모드입니다.'),
    note('ABM과 ARM', 'ABM은 균형국 간 비동기 균형 모드이고 ARM은 불균형 구성에서 종국도 허가 없이 전송할 수 있는 비동기 응답 모드입니다.', '둘 다 비동기라는 이유만으로 같지 않습니다. ABM은 균형국, ARM은 주국·종국이라는 구성 차이를 먼저 확인합니다.'),
  ],
  foreign: [note('FOREIGN KEY와 REFERENCES', 'FOREIGN KEY 뒤에는 참조하는 자식 열, REFERENCES 뒤에는 참조 대상 부모 표와 열을 지정합니다.', 'CONSTRAINT는 제약에 이름을 붙이는 부분입니다. 자식 열과 부모 열의 이름이 같아야 하는 것은 아니며 연결 방향을 뒤집지 않습니다.')],
  subnet: [
    note('네트워크·브로드캐스트·호스트 주소', '같은 접두부의 주소들에서 호스트 비트가 모두 0인 것은 네트워크 주소, 모두 1인 것은 브로드캐스트 주소입니다.', '일반 호스트 범위를 묻는 문제에서는 양 끝 주소를 제외하고 이미 사용 중인 주소도 뺍니다. 같은 옥텟 몇 개만 같다고 같은 서브넷인 것은 아닙니다.'),
    note('전체 주소 수와 사용 가능한 호스트 수', '호스트 비트가 h개이면 주소는 2^h개입니다. 일반적인 IPv4 서브넷 문제의 호스트 수는 여기서 양 끝 두 주소를 뺀 값입니다.', '주소 개수와 호스트 개수를 구별합니다. 서브넷 분할은 네트워크 비트를 늘리는 것이어서 접두부 길이는 커지고 각 블록은 작아집니다. /31·/32는 별도 조건을 확인합니다.'),
  ],
  symlink: [note('심볼릭 링크 공격과 TOCTOU', '심볼릭 링크 공격은 프로그램이 접근할 경로를 다른 파일을 가리키는 링크로 바꾸어 의도와 다른 파일 처리를 유도합니다.', '심볼릭 링크 자체는 정상적인 파일 시스템 기능입니다. TOCTOU는 검사와 사용 사이의 상태 변화가 핵심이며 링크를 이용한 공격과 함께 나타날 수 있습니다.')],
  integration: concepts('스텁', '드라이버'),
  cohesion: concepts('절차적 응집도', '교환적 응집도', '순차적 응집도', '기능적 응집도'),
  sequence: concepts('순차적 응집도', '교환적 응집도'),
  cohesionOrder: [note('응집도의 강도와 묶는 기준', '통상 강한 순서는 기능적 → 순차적 → 교환적 → 절차적 → 시간적 → 논리적 → 우연적 응집도입니다.', '하나의 기능 완성, 앞 출력의 다음 입력 사용, 같은 데이터 공유, 같은 실행 절차를 구별합니다. 같은 시점·비슷한 종류·무관한 기능의 혼합도 각각 다른 기준입니다.')],
  package: [note('패키지와 다른 UML 다이어그램', '패키지 다이어그램은 폴더 모양의 묶음으로 클래스·패키지를 조직하고 묶음 사이의 의존성을 표현합니다.', '클래스 다이어그램은 클래스의 구조·관계, 시퀀스 다이어그램은 메시지의 시간 순서입니다. 폴더 모양이라는 표시와 무엇을 묶었는지 함께 봅니다.')],
  condition: concepts('조건 커버리지', '분기 커버리지'),
  branch: concepts('분기 커버리지', '문장 커버리지'),
  coverage: concepts('문장 커버리지', '분기 커버리지', '조건 커버리지'),
  mcdc: concepts('MC/DC', '조건 커버리지'),
  linux: [note('pwd·ls·cd·cp', 'pwd는 현재 경로 출력, ls는 파일·디렉터리 목록 조회, cd는 작업 디렉터리 변경, cp는 파일·디렉터리 복사입니다.', '위치 확인·목록 확인·위치 이동·복사를 구분합니다. cp는 복사여서 원본이 남고, mv는 이동·이름 변경이라는 차이도 있습니다.')],
  errors: [
    note('검출·정정과 재전송', '패리티·CRC는 오류 검출에, 해밍 코드는 대표적으로 단일 비트 오류 위치를 찾아 정정하는 데 사용합니다.', '오류가 있음을 알아내는 검출과 원래 값을 복구하는 정정은 다릅니다. CRC를 계산했다고 수신 데이터의 오류가 자동 수정되는 것은 아닙니다.'),
    note('FEC와 BEC', 'FEC는 수신 측에서 중복 정보를 이용해 정정하는 전진 오류 제어이고 BEC는 재전송을 이용하는 후진 오류 제어입니다.', '재전송 없이 수신 측이 고치면 FEC, 송신 측에 다시 보내도록 요구하면 BEC입니다. 해밍·CRC 같은 코드 이름과 제어 방식의 분류를 혼동하지 않습니다.'),
  ],
  otp: [note('OTP와 고정 비밀번호', 'OTP는 한 번의 인증이나 짧은 유효 기간에 쓰는 인증값이며 TOTP는 시간, HOTP는 카운터를 바탕으로 값을 만듭니다.', '고정 비밀번호는 같은 값을 계속 쓰지만 OTP는 시간·사용 상태에 따라 유효값이 달라집니다. OTP도 실시간 피싱까지 자동으로 막는 것은 아닙니다.')],
  division: [note('관계대수 디비전과 조인', 'R÷S는 S의 모든 값과 대응되는 관계를 R 안에 갖는 대상을 고릅니다. 조건의 핵심은 하나 이상이 아니라 모든 값입니다.', '조인은 맞는 행을 결합하고, 디비전은 요구된 값 전부를 만족한 대상을 남깁니다. 일부 값만 대응해도 선택되는 것으로 해석하면 안 됩니다.')],
  relation: [...concepts('튜플', '릴레이션 인스턴스', '카디널리티', '차수'), note('속성(Attribute)과 도메인(Domain)', '속성은 릴레이션의 열이고 도메인은 그 열에 허용되는 값의 집합입니다.', '열 자체와 그 열이 가질 수 있는 값의 범위를 구별합니다. 속성의 수는 차수이고 행의 수는 카디널리티입니다.')],
  dbTerms: [...concepts('차수', '카디널리티', '외래키'), note('도메인(Domain)', '도메인은 한 속성에 허용되는 자료형·값의 집합입니다. 예를 들어 평점의 허용 범위나 학과 코드의 허용 목록입니다.', '차수는 열 개수, 카디널리티는 행 개수, 외래키는 참조 관계, 도메인은 값의 허용 범위를 뜻하므로 각각 다른 관점입니다.')],
  access: concepts('MAC', 'RBAC', 'DAC'),
  testCase: [note('테스트 조건·입력·예상 결과', '테스트 조건은 무엇을 검사할지, 입력값은 무엇을 넣을지, 예상 결과는 올바른 출력·상태가 무엇인지를 정합니다.', '테스트 환경은 실행할 장비·설정이고 수행 단계는 실행 순서입니다. 실행 전의 사전 조건, 넣는 값, 실행 뒤 기대하는 결과도 서로 구별합니다.')],
  index: [note('인덱스 접근과 순차 접근', '인덱스 접근은 키와 레코드 위치를 연결한 색인을 이용하고, 순차 접근은 정해진 순서로 레코드를 차례로 읽습니다.', '색인에서 위치를 찾아 가는지, 앞에서부터 순서대로 읽는지가 기준입니다. 해시 접근은 키를 해시 함수에 넣어 위치를 계산한다는 점에서 다릅니다.')],
  scheduling: concepts('SJF', 'SRT', 'FCFS'),
  rr: [...concepts('RR'), note('대기시간과 반환시간', '반환시간은 완료−도착이고 대기시간은 반환시간에서 실제 CPU 실행시간을 뺀 값입니다.', '시간 할당량은 한 번에 받을 수 있는 CPU 시간이지 총 실행시간이나 대기시간이 아닙니다. 여러 차례 기다린 시간도 모두 대기시간에 포함합니다.')],
  syn: [note('SYN Flooding과 정상 연결', 'SYN Flooding은 TCP 연결 요청을 대량으로 만들고 연결 완료를 지연·방해하여 반연결 대기 자원을 소모시키는 공격입니다.', '정상 TCP 연결은 SYN→SYN/ACK→ACK로 완료됩니다. ICMP 요청을 악용하는 공격과 달리 TCP 연결 설정 자원을 노린다는 점이 핵심입니다.')],
  projection: [note('프로젝션과 셀렉션', '관계대수의 프로젝션 π는 열을 선택하고 셀렉션 σ는 조건에 맞는 행을 선택합니다.', '집합 의미의 프로젝션은 중복 튜플을 제거합니다. SQL의 SELECT는 DISTINCT가 없으면 중복을 유지할 수 있으므로 결과 행 수가 다를 수 있습니다.')],
  session: [note('세션 하이재킹과 인증 공격', '세션 하이재킹은 이미 인증된 사용자의 세션 정보를 탈취·도용하여 그 사용자로 가장하는 공격입니다.', '비밀번호 대입 공격은 로그인 자격증명을 알아내려는 것이고 세션 하이재킹은 성립한 세션을 노립니다. 피싱으로 비밀번호를 얻는 것과도 공격 대상이 다릅니다.')],
  integrity: concepts('개체 무결성', '참조 무결성', '도메인 무결성'),
  crc: [note('CRC·패리티·해밍 코드', 'CRC는 생성 다항식에 따른 나머지, 패리티는 비트 수의 홀짝으로 오류를 검출하며 해밍 코드는 정정 가능한 검사 비트 구조를 사용합니다.', '전송 오류 검출용 CRC와 변조 저항성을 목표로 하는 암호학적 해시는 목적이 다릅니다. 단순 패리티 검사만으로 오류 위치를 항상 알 수는 없습니다.')],
  scare: concepts('스케어웨어'),
  arp: [...concepts('ARP'), note('RARP와 ARP', 'ARP는 IPv4 주소로 같은 링크의 MAC 주소를 찾고 RARP는 MAC 주소를 바탕으로 IP 주소를 알아내는 역방향 방식입니다.', 'IP→MAC과 MAC→IP의 질문 방향을 나눕니다. 서로 다른 네트워크 구간의 MAC 주소를 ARP로 직접 조회하는 것은 아닙니다.')],
  lru: [note('LRU·LFU·FIFO', 'LRU는 가장 오래 사용하지 않은 페이지, LFU는 참조 횟수가 가장 적은 페이지, FIFO는 가장 먼저 적재된 페이지를 교체합니다.', '최근 사용 시점·사용 횟수·들어온 순서는 다른 기준입니다. 적중해도 최근성·횟수는 갱신되며 처음 적재도 부재로 셉니다. 동률 처리 규칙은 문항의 조건을 확인합니다.')],
  smurf: [note('Smurf와 단순 ICMP Flooding', 'Smurf는 피해자 주소로 출발지를 위조한 ICMP 요청을 브로드캐스트로 보내 여러 호스트의 응답을 피해자에게 집중시킵니다.', '직접 요청을 많이 보내는 것과 달리 다른 호스트들의 응답을 반사·증폭에 이용합니다. 정상 ping 기능인 ICMP와 공격 기법 자체를 동일시하지 않습니다.')],
  patternCategory: [note('생성·구조·행위 패턴', '생성은 객체를 만드는 책임, 구조는 클래스·객체를 결합하는 형태, 행위는 객체 사이의 책임 분배와 상호작용에 초점을 둡니다.', 'Singleton·Factory Method는 생성, Adapter·Proxy는 구조, Observer·Visitor는 행위입니다. 이름의 느낌보다 해결하는 설계 문제를 기준으로 분류합니다.')],
  url: [note('URL의 구성 요소', 'scheme은 접근 방식, authority는 사용자 정보·host·port를 포함할 수 있는 부분이며 path는 자원 경로, query는 질의 정보, fragment는 자원 내부의 일부를 가리킵니다.', 'foo://localhost:8080/over/there?name=ferret#nose에서 localhost:8080 전체가 authority입니다. 8080은 그 안의 port이며 # 뒤 nose는 fragment입니다. query name=ferret와 구별합니다.')],
  uml: [note('일반화·연관·의존 관계', '일반화는 상속에 해당하는 is-a 관계, 연관은 객체 사이의 연결, 의존은 다른 요소의 사용·변경에 영향을 받는 관계입니다.', '일반화는 실선+빈 삼각형, 의존은 보통 점선 화살표로 표시합니다. 연관은 연결 관계를 나타내며 곧바로 상속이라는 뜻은 아닙니다.')],
  keys: concepts('슈퍼키', '후보키', '기본키', '대체키', '외래키'),
  vpn: [note('VPN과 IPsec·L2TP', 'VPN은 공용망을 이용하면서 논리적으로 사설 네트워크처럼 연결하는 구성이고 IPsec·L2TP 등은 이를 구현할 때 쓰는 기술입니다.', 'VPN은 구성 목적, IPsec은 보안 프로토콜 체계, L2TP는 터널링 프로토콜입니다. 터널 생성만으로 암호화나 완전한 익명성이 보장되지는 않습니다.')],
  adhoc: [note('Ad-hoc과 인프라 네트워크', '애드혹 네트워크는 중앙의 고정 인프라 없이 노드들이 직접 통신하도록 임시로 구성하는 네트워크입니다.', '인프라 방식은 AP 같은 기반 장비를 중심으로 연결합니다. P2P는 대등한 참여 구조, Mesh는 연결 토폴로지 관점이므로 무조건 같은 용어로 외우지 않습니다.')],
  ipsec: [note('IPsec의 AH와 ESP', 'IPsec은 IP 계층을 보호하는 체계로 AH는 인증·무결성 보호를, ESP는 암호화 등을 통한 기밀성 보호를 제공할 수 있습니다.', 'AH 자체는 암호화 기능이 아닙니다. L2TP처럼 터널을 만드는 기능과 실제 전송 내용을 보호하는 보안 기능을 구별하며 구체적인 보호는 선택한 구성에 따릅니다.')],
  aes: [note('AES·DES와 RSA·ECC', 'AES·DES는 대칭키 계열이고 RSA·ECC는 공개키·개인키를 이용하는 비대칭키 계열입니다.', 'AES의 블록 크기는 128비트이며 키 길이 128·192·256비트와 구별합니다. 암호 알고리즘 이름만 보고 블록 크기와 키 길이를 같은 값으로 외우지 않습니다.')],
  virtual: [note('가상회선과 데이터그램', '가상회선은 논리적 연결을 설정한 뒤 데이터를 보내는 방식이고 데이터그램은 패킷마다 독립적으로 전달하는 방식입니다.', '연결 설정 유무와 경로 선택 방식을 구별합니다. 가상회선이라고 물리 회선을 혼자 독점하는 회선 교환과 같은 것은 아닙니다.')],
  rip: concepts('RIP', 'OSPF'),
  rootkit: concepts('루트킷'),
  apt: [note('APT와 개별 공격 기법', 'APT는 특정 표적에 장기간 침투·은닉·정보 수집 등을 지속하는 위협 활동입니다. 여러 공격 기법을 함께 사용할 수 있습니다.', '피싱은 침투 수단, 루트킷은 은폐 도구, APT는 장기적인 표적 공격의 양상입니다. 서로 다른 분류여서 한 공격 안에 함께 나타날 수 있습니다.')],
  oauth: concepts('OAuth'),
  chmod: [note('chmod와 권한 숫자', 'chmod는 파일 접근 권한을 바꾸며 8진수 한 자리에서 읽기 r=4,쓰기 w=2,실행 x=1을 더해 표현합니다.', '세 자리는 소유자·그룹·기타 사용자 순서입니다. 파일 소유자를 바꾸는 chown과 다르며 파일의 실행 권한과 디렉터리의 탐색 권한도 문맥을 확인합니다.')],
  atm: [note('ATM 셀과 가변 길이 패킷', 'ATM은 고정 길이 53바이트 셀을 사용하며 일반적으로 헤더 5바이트와 정보 부분 48바이트로 구성합니다.', '53은 전체 셀 길이이고 사용자 정보 길이 48과 다릅니다. 셀 크기를 일정하게 쓰는 점을 가변 길이 패킷 방식과 구별합니다.')],
  cloud: concepts('IaaS', 'PaaS', 'SaaS'),
  algebra: [note('관계대수의 σ·π·⋈·÷', 'σ는 조건에 맞는 행 선택, π는 열 선택, ⋈는 행 결합, ÷는 요구한 모든 값과의 대응 여부를 검사합니다.', '행을 줄이는 셀렉션과 열을 줄이는 프로젝션을 나눕니다. 조인은 대응 행을 만들고 디비전은 모든 조건을 충족한 대상만 남깁니다.')],
  tamper: [note('템퍼프루핑과 워터마킹', '템퍼프루핑은 프로그램 변조를 탐지하거나 변조 시 정상 동작을 제한하도록 하는 보호 기법입니다.', '워터마킹은 식별 정보·소유권 표시를 삽입하는 데 초점이 있습니다. 변조 방지·대응과 소유자 식별은 서로 다른 목적입니다.')],
  singletonVisitor: concepts('Singleton', 'Visitor'),
  crypto: [note('대칭키와 비대칭키', 'DES·AES·ARIA·SEED는 대칭키 암호 계열이고 RSA·ECC는 공개키와 개인키 쌍을 이용하는 비대칭키 계열입니다.', '같은 비밀키를 공유하는지, 서로 대응하는 두 키를 쓰는지가 기준입니다. 키를 이용해 복호화하는 암호와 일방향 요약값인 해시도 구별합니다.')],
  cascade: [note('CASCADE와 RESTRICT', 'CASCADE는 대상 객체에 종속된 객체의 제거도 허용하는 옵션이고 RESTRICT는 종속 객체가 있으면 제거를 제한합니다.', '객체 삭제의 CASCADE와 외래키 ON DELETE CASCADE는 적용 위치를 함께 봐야 합니다. DELETE는 행, DROP은 표·뷰 같은 객체를 제거한다는 차이도 있습니다.')],
  schema: [note('외부·개념·내부 스키마', '외부는 사용자별 관점, 개념은 조직 전체의 통합 논리 구조, 내부는 파일 배치·인덱스 등 물리 저장 관점입니다.', '외부는 누구에게 어떻게 보이는지, 개념은 전체 데이터가 어떻게 연결되는지, 내부는 실제로 어떻게 저장하는지를 답합니다. 사용자별 관점은 여러 개일 수 있습니다.')],
  malware: concepts('웜', '트로이 목마', '바이러스'),
  update: [note('UPDATE의 SET과 WHERE', 'SET은 변경할 열과 새 값을, WHERE는 변경할 행의 조건을 지정합니다. UPDATE는 기존 행의 값을 수정합니다.', 'INSERT는 새 행 추가, DELETE는 행 삭제입니다. SET에 조건을 쓰거나 WHERE를 생략해 전체 행을 바꾸지 않도록 역할을 구별합니다.')],
};

const restoredGroups = {
  '2026-2': { 1:'equivalence',3:'content',8:'scheduling',10:'subnet',16:'subnet',17:'hash',20:'normalization' },
  '2026-1': { 2:'bridgeObserver',3:'design',4:'requirements',5:'isms',6:'hdlc',10:'foreign',11:'subnet',15:'symlink',19:'integration',20:'cohesion' },
  '2025-3': { 1:'package',2:'condition',3:'linux',4:'errors',11:'otp',14:'division',16:'relation',18:'access',19:'testCase' },
  '2025-2': { 1:'index',2:'relation',4:'scheduling',6:'subnet',11:'branch',13:'rr',19:'syn',20:'projection' },
  '2025-1': { 1:'session',2:'integrity',3:'crc',4:'scare',6:'arp',8:'dbTerms',9:'subnet',12:'coupling' },
  '2024-3': { 4:'lru',5:'smurf',6:'patternCategory',8:'integrity',9:'url',13:'coverage',14:'uml',15:'keys',17:'vpn',20:'adhoc' },
  '2024-2': { 4:'relation',5:'ipsec',7:'aes',8:'virtual',9:'sequence',11:'rip',12:'scheduling',16:'control' },
  '2024-1': { 3:'cohesionOrder',5:'subnet',6:'normalization',8:'join',9:'lru',14:'mcdc',15:'rootkit',17:'apt' },
  '2023-3': { 2:'oauth',3:'chmod',7:'access',9:'atm',15:'package',16:'equivalence',17:'cloud',19:'algebra',20:'integrity' },
  '2023-2': { 6:'condition',8:'tamper',10:'design',11:'singletonVisitor',12:'errors',13:'hdlc',15:'crypto',16:'hash',17:'cascade',20:'integration' },
  '2023-1': { 5:'virtual',8:'malware',12:'relation',18:'schema',19:'branch' },
};
groups.join = [note('세타·동등·자연 조인', '세타 조인은 비교 조건으로 결합하고, 동등 조인은 그중 등호를 사용합니다. 자연 조인은 같은 이름의 공통 속성으로 결합합니다.', '동등 조인은 두 조인 열을 모두 남길 수 있지만 자연 조인은 공통 조인 열을 한 번만 남깁니다. 모든 조인이 자동으로 중복 행을 제거하는 것은 아닙니다.')];

const similarGroups = {
  requirements:'requirements','pattern-category':'patternCategory',boundary:'equivalence','branch-min':'branch','case-input':'testCase',
  'integration-order':'integration','foreign-key':'foreign','drop-view':'cascade','domain-check':'domain','design-order':'design',
  'update-keyword':'update',lru:'lru','subnet-split':'subnet',crypto:'crypto',cohesion:'sequence',uml:'uml',stub:'integration',branch:'branch',
  mcdc:'mcdc',statements:'coverage',case:'testCase',hash:'hashTable',relation:'relation',integrity:'integrity',normalization:'normalization',
  schema:'schema',algebra:'projection',subnet:'subnet',srtf:'scheduling',malware:'malware',access:'access','error-code':'errors',
};
groups.domain = [...concepts('도메인 무결성'), note('CHECK·NOT NULL·DEFAULT', 'CHECK는 값이 만족할 조건, NOT NULL은 NULL 금지, DEFAULT는 값을 생략했을 때 사용할 기본값을 지정합니다.', '허용 목록을 CHECK로 제한해도 NULL을 자동 금지하지는 않습니다. 기본값을 지정하는 것과 허용 범위를 제한하는 것도 서로 다릅니다.')];

export const examTheoryDistinctionGroups = {
  ...Object.fromEntries(Object.entries(restoredGroups).flatMap(([exam, questions]) => Object.entries(questions).map(([number, group]) => [`past-${exam}-q${number}`, group]))),
  ...Object.fromEntries(Object.entries(similarGroups).map(([key, group]) => [`similar-${key}`, group])),
};

export function getExamTheoryDistinctions(question) {
  if ((!question.restored && !question.similar) || question.walkthrough || question.code || question.blocks?.some(block => block.type === 'code')) return [];
  if (question.similar && question.language !== '이론·계산') return [];
  // 기존 용어 정리에 이미 구별점이 있으면 같은 설명을 덧붙이지 않습니다.
  if (questionConceptNotes(question).length) return [];
  const key = examTheoryDistinctionGroups[question.id];
  if (!key) return [];
  if (!groups[key]) throw new Error(`이론 구별점 분류가 없습니다: ${question.id}/${key}`);
  return groups[key];
}
