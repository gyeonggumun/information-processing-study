# 문제 표·해설 5차 검수 (2026-10-24)

## 범위와 보존 원칙

현재 출제·보관 문제 2,341문항을 대상으로 문제·정답·해설 표와 계산 설명을 점검했다. 표 2,419개는 문제 자료, 복원·유사 해설 표, 코드 중간 계산 표, 저장된 SQL 실행 단계 표를 합산한 수다. 이미지 안의 표는 이 자동 집계에 포함하지 않는다.

복원 원본 JSON·자료 이미지·문항 ID·정답·사용자의 풀이 기록은 보존한다. 잘못된 지문은 화면 표시 보정으로 처리하고 수정 사실은 해당 해설에 안내한다. 실제 계정이나 서비스 DB에 검증 데이터를 쓰지 않았다.

## 5차 점검 기록

| 차수 | 확인 범위 | 결과와 조치 |
| --- | --- | --- |
| 1 | 표 머리글·행·열·빈칸 | 첫 설명이 머리글로 처리되던 접근 통제 표에 `구분/설명` 제목을 추가했다. 한 셀에 합쳐진 보기 표 6개를 기호/보기 행으로 분리하고 클라우드 보기도 행별로 정리했다. `thead/tbody`를 분리하고 답안 빈칸·키보드 가로 스크롤을 표시했다. |
| 2 | 문제·정답·해설의 대응 | 튜플·인스턴스·카디널리티 표의 자료형/열 통계 혼동을 관계형 모델의 행·데이터 상태·행 수로 보정했다. 보정된 Java·Python·C 코드를 여전히 미완성 코드처럼 설명하던 안내와 흐름도 경로 설명을 정리했다. |
| 3 | 실제 실행·자료 이미지 | 복원 SQL 자료 이미지 13개를 실행 데이터와 대조했다. 일반 SQL 210문항, 현재·보관 SQL 387문항의 표, 유사 SQL 30문항을 확인했다. INSERT/UPDATE/DELETE 34문장의 변경 전후 표를 추가하고 별도 메모리 DB 실행 결과와 비교했다. |
| 4 | 중간 계산·개념 구별 | 흩어진 UNION SQL을 한 코드 블록으로 묶고 6행 합치기→4행 중복 제거→내림차순 결과를 주석과 표로 설명했다. 정렬과 중복 제거, JOIN과 UNION의 차이도 유지했다. 바이러스 전파 경로와 트로이목마 상주 여부의 잘못된 단정을 보정했다. SRT/RR의 완료·대기시간과 LRU 부재 수를 독립 시뮬레이션했다. |
| 5 | 수정 후 회귀·실제 화면 | 표 구조·숫자 계산식 검사를 다시 수행했다. 제출 전 해설 숨김, Pro 권한, 오답노트, 원문 보존을 확인했다. 데스크톱·모바일에서 보기/정의 표, UNION 답 공개, SQL 변경 전후 값을 직접 확인했다. |

## 실행 검증

- 일반 코드: C 210문항 O0/O2, Java 210문항 컴파일·실행, Python 210문항 실행 결과 일치.
- 복원 코드: C 41문항 O0/O2, Java 34문항·의도된 컴파일 오류 1문항, Python 15문항. 실제 표시 코드와 주석 해설 코드를 각각 실행했다. 흐름도용 C 1문항은 의도대로 실행 대상에서 제외했다.
- 복원 SQL: UNION을 포함해 16문항 실제 실행. DOMAIN 1문항은 SQLite가 지원하지 않는 문법이므로 별도 구분했다. 코드/SQL 상세 해설은 총 109문항, 위치별 주석 551개다.
- 유사 코드: C·Java·Python 각 40문항 실제 실행. SQL 30문항의 최종 결과와 JOIN/VIEW 표도 대조했다.
- 현재·보관 코드의 상세 계산 표 대상 C 87·Java 50·Python 75문항, 총 1,640단계는 기존 출력 답안과 일치했다.

```powershell
npm run verify:problem-tables
npm run verify:sql-tables
npm run verify:restored-walkthroughs
node --experimental-sqlite scripts/verify-restored-walkthroughs.mjs --execute --display
node --experimental-sqlite scripts/verify-restored-walkthroughs.mjs --execute
node --experimental-sqlite scripts/verify-similar-exams.mjs --execute
```

표 구조와 실행 결과가 통과했다고 모든 자연어 해설에 오류가 전혀 없다는 의미는 아니다. 자동 검산은 숫자로 명시된 식과 지원하는 코드 템플릿을 대상으로 하며, 의미 판단은 이번에 확인한 충돌을 기준으로 보정했다. 정수 나눗셈·정렬 미지정·집합 순서 등은 해당 언어/문제 조건에 맞게 구별한다.

## 보충 근거

- [PostgreSQL 표의 행·열과 미지정 행 순서](https://www.postgresql.org/docs/current/ddl-basics.html)
- [PostgreSQL 용어집의 tuple](https://www.postgresql.org/docs/17/glossary.html)
- [Microsoft 악성코드 분류 기준](https://learn.microsoft.com/en-us/defender-xdr/criteria)
- [Microsoft 트로이목마 설명](https://learn.microsoft.com/en-us/defender-endpoint/malware/trojans-malware)
