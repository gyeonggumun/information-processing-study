# 남은 문제 5차 검수

검수 기간: 2026-10-25~26 (한국 시간). 이전 `PROBLEM_TABLE_SOLUTION_AUDIT.md`에서 자동 검사 위주였던 일반 필답형·보관 코드와 비SQL 이미지 자료를 중점 확인했다.

## 범위

- 일반 필답형 724문항: 현재 601, 보관 123. 유사 이론 50문항을 합쳐 774문항의 지문·답안·식별자·허용 답안 검사를 수행했다.
- 보관 코드 C 55·Java 45·Python 80문항은 실제 컴파일/실행했다. C는 O0/O2 모두 확인했고 Java·Python은 주석 위치도 검사했다.
- 이전에 직접 대조하지 않았던 비SQL 자료 이미지 21개를 원본 문제·정답·해설과 대조했다. SQL 자료 이미지 13개는 이전 검수 범위다.
- 전체 회귀 검사: 현재·보관 2,341문항, 문제/정답/중간 계산/SQL 풀이 표 2,420개. 이미지 내부 표는 이 자동 표 개수에 포함하지 않는다.

## 5차 점검과 수정

| 차수 | 점검 | 결과 |
| --- | --- | --- |
| 1 | 일반·유사·보관 자료 구조 | ID 중복, 빈 지문/답, 명시적 오타 패턴, 표시 정답과 허용 답안의 일치를 확인했다. 보관 코드 180문항의 실제 출력도 저장 답안과 일치했다. |
| 2 | 개념 정의와 문제 전제 | `practical-extra-database-11`에 남아 있던 BCNF의 후보키/슈퍼키 혼동을 수정했다. 정규화 단계 문제 9개에 원자값·후보키 전제를 명시하고, 높은 정규형도 함께 만족할 수 있는 사례는 묻는 대상을 정규화 '단계'로 분명히 했다. 보관 4NF 두 문항은 모든 다치 종속을 없앤다는 식의 축약 대신 비자명 다치 종속의 결정자 슈퍼키 조건으로 설명했다. 기본키 사례 하나에는 NULL이 없다는 전제를 보완했다. |
| 3 | 이미지의 항목과 실제 설명 | 2024년 3회 9번은 그림의 authority·fragment를 host·port로 잘못 설명해 수정했다. 2025년 1회 2번은 모호한 NULL/제약 개수 표를 검사 기준·위반 예시의 텍스트 표로 재구성했다. 보기 ㄱ·ㄴ·ㄷ의 대응은 유지했다. |
| 4 | 계산·경로 독립 검산 | 주소·마스크 12, CPU 대기시간 13, 페이지 교체 10문항을 별도 알고리즘으로 검산했다. 2025년 2회 11번·2023년 1회 19번의 분기 커버리지 예시는 부분 경로 대신 종료점 7까지 이어 제시하고, 네 분기를 모두 포함하는지 검사했다. 유일/최소 경로라고 단정하지 않고 SUB 내부·입력 명세 미제공도 안내한다. |
| 5 | 재검사·화면 | 새 5차 검사, 전체 표/오타/기출 품질/복원/이론 구별점/오답노트 검사와 린트·빌드를 통과했다. 실제 화면에서 답 공개 전 해설 비노출, 공개 후 검수 안내·답안, 모바일 가로 넘침 없음을 확인했다. |

주요 보정 대상은 필답형 12문항(현재 9·보관 3)과 복원 4문항이다. 복원 원본 JSON·이미지·문항 ID는 보존하며 표시 보정만 적용한다. 분기 커버리지의 표시 답안은 완결된 경로 예시로 보완했지만 사용자 자기채점·풀이 기록을 재작성하지 않는다. 실제 계정·서비스 DB에는 검증 데이터를 쓰지 않았다.

## 재검증 명령

```powershell
npm run verify:remaining-questions
npm run verify:problem-tables
npm run verify:question-typos
npm run verify:restored-exams
npm run verify:question-quality
npm run verify:theory-distinctions
npm run verify:wrong-answers
node scripts/verify-python-questions.mjs --archive
node scripts/verify-java-questions.mjs --archive
node scripts/verify-c-questions.mjs <zig 실행 파일 경로> --archive
```

숫자·표 구조 검사를 통과했다고 모든 자연어 표현의 무오류를 보장하는 것은 아니다. 독립 계산 대상 35문항과 이미지 대조 대상 21개를 구분해 기록했으며, 전체 문항을 같은 실행 방식으로 검산했다고 주장하지 않는다.

## 설명 보정 근거

- URL의 scheme/authority/path/query/fragment 구분: [RFC 3986 §3](https://www.rfc-editor.org/rfc/rfc3986#section-3)
- 4NF의 비자명 다치 종속·슈퍼키 조건: [University of Waterloo 정규화 이론 강의](https://cs.uwaterloo.ca/~david/cs348/handout-FD.pdf)
- 정규화 단계: [Microsoft 데이터베이스 정규화 설명](https://learn.microsoft.com/en-us/troubleshoot/microsoft-365-apps/access/database-normalization-description)
