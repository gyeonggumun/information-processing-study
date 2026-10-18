# 실기 복원 출제 개념과 학습 카드 보강

2026-10-18, 기존 학습 자료의 세부 카드·설명·예시를 11개 복원 회차(2023-1~2026-2)와 대조했다. 단순 키워드 부재만으로 누락을 확정하지 않고 관련 카드 본문을 확인했다. 특정 주제에 대한 충분한 설명이 없거나 문제에 적용할 API·계산 사례가 부족한 부분을 아래 16개 카드로 추가했다.

| 과목 | 추가 카드 | 대조한 복원 회차·문항 |
| --- | --- | --- |
| 소프트웨어 설계 | URL 구성 요소와 서버로 전달되는 범위 | [2024-3 9번](https://chobopark.tistory.com/495) |
| 소프트웨어 개발 | 조건·분기·MC/DC의 참거짓 계산 | [2023-2 6번](https://chobopark.tistory.com/420), [2024-1 14번](https://chobopark.tistory.com/476), 2024-3 13번, [2025-3 2번](https://chobopark.tistory.com/558) |
| 데이터베이스 구축 | 외래키 삭제·갱신 옵션 비교 | 2023-2 17번, [2026-1 10번](https://chobopark.tistory.com/561) |
| 데이터베이스 구축 | CREATE DOMAIN과 CHECK 조건 읽기 | [2026-2 19번](https://chobopark.tistory.com/562) |
| 데이터베이스 구축 | 후보키로 판별하는 3NF와 BCNF | 2024-1 6번, 2026-2 20번 |
| 프로그래밍 언어 활용 | C 문자 판별과 ASCII 범위 변환 | 2024-1 19번 |
| 프로그래밍 언어 활용 | C 출력 서식과 16진수 해석 | 2026-1 12번, [2023-3 10번](https://chobopark.tistory.com/453) |
| 프로그래밍 언어 활용 | C 구조체 복사와 포인터 멤버의 공유 | [2025-2 14번](https://chobopark.tistory.com/554), 2024-3 16번의 간접 참조 |
| 프로그래밍 언어 활용 | Java 제네릭과 오버로딩의 선택 시점 | 2024-3 19번, 2026-1 7번 |
| 프로그래밍 언어 활용 | Java enum의 순서·ordinal·values | 2025-3 17번 |
| 프로그래밍 언어 활용 | Java static 문맥의 컴파일 오류 판별 | 2023-3 13번 |
| 정보시스템 구축 관리 | 탬퍼 프루핑과 프로그램 변조 탐지 | 2023-2 8번 |
| 정보시스템 구축 관리 | 심볼릭 링크 공격과 경로 검증 | 2026-1 15번 |
| 정보시스템 구축 관리 | ATM의 고정 길이 셀과 가상 연결 | 2023-3 9번 |
| 정보시스템 구축 관리 | L2TP 터널링과 IPsec 암호화 구분 | [2023-1 6·7번](https://chobopark.tistory.com/372) |
| 정보시스템 구축 관리 | chmod의 8진수 권한 계산 | 2023-3 3번 |

## 기존 자료와 중복을 피한 기준

- 디자인 패턴, 응집도·결합도, 관계대수, 3단계 스키마, 스케줄링·서브넷 계산, HDLC, Python 컬렉션·클래스 변수·슬라이싱은 기존 카드에 있어 새로 복제하지 않았다.
- enum은 정의만 있던 부분에 ordinal·values의 적용 예를 보강했다. chmod 역시 명령 설명은 있었지만 권한 비트 합 계산은 별도 설명이 부족했다.
- MC/DC와 정규형은 용어 자체의 누락이 아니라 판단 과정·반례가 부족했다. 개념 카드를 지우거나 재분할하지 않고 적용 예시 카드만 추가했다.
- 새로운 카드는 `past-study-...` ID를 사용하고 각 과목의 기존 카드 뒤에 추가했다. 같은 주제의 전체 개요·세부 카드를 중복 생성하지 않았다. 기존 카드 ID·즐겨찾기·정렬 데이터는 변경하지 않았다.
- 각 카드에 빠른 요약, 상세 개념, 용어별 정의·구별점·예시, 기존 반응형 비교표용 `visual`을 제공한다. 읽기 어려운 새 래스터 이미지는 만들지 않는다.
- 이번 변경 범위는 **학습 페이지**이다. 기존 실기 요약 선정 목록·PDF와 원문 복원 220문항, 연습문제 정답은 변경하지 않았다. 특정 회차 출제나 향후 출제를 보장하는 목록은 아니다.

## 기술 검수 기준

복원 자료는 공식 시험지·공식 해설이 아니므로 용어 정의와 동작은 공식 문서도 함께 확인했다.

- [URL 구조: RFC 3986](https://www.rfc-editor.org/rfc/rfc3986)
- [Java enum](https://docs.oracle.com/javase/tutorial/java/javaOO/enum.html), [제네릭 타입 소거](https://docs.oracle.com/javase/tutorial/java/generics/genMethods.html), [static 문맥: Java 언어 명세](https://docs.oracle.com/javase/specs/jls/se25/html/jls-8.html)
- [PostgreSQL CREATE DOMAIN](https://www.postgresql.org/docs/current/sql-createdomain.html), [외래키 제약](https://www.postgresql.org/docs/current/ddl-constraints.html)
- [C 문자 판별](https://man7.org/linux/man-pages/man3/isalpha.3.html), [chmod](https://man7.org/linux/man-pages/man2/chmod.2.html)
- [심볼릭 링크 취약점 CWE-61](https://cwe.mitre.org/data/definitions/61.html), [무결성 검사 CWE-353](https://cwe.mitre.org/data/definitions/353.html)
- [L2TP: RFC 2661](https://www.rfc-editor.org/rfc/rfc2661), [ATM 셀 구조: Cisco](https://www.cisco.com/c/en/us/td/docs/routers/7200/design/ATM-traffic_management_guide/atmtrafc_1/atmtshap.html)

검증: `npm run verify:study-concept-tables`, `npm run verify:study-supplements`, `npm run build`. 전자는 새 16개 카드의 과목 연결·분량·복원 문항 참조·반응형 비교표의 용어/원리/예시 렌더링을 검사하고, 후자는 기존 보강·실기 요약 선정과 개인 설정의 유지를 확인한다.
