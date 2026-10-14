# 실기 핵심 요약 PDF 갱신

실기 요약 페이지의 다운로드 파일은 `public/downloads/exam-summary-quick-review.pdf`입니다. 전체 선별 카드를 과목별로 압축한 공통 요약본이며, 개인별 순서·삭제 목록은 반영하지 않습니다.

## 구성

- `examSummaryCardIds`에 포함된 세부 학습 카드의 핵심 용어와 비교 노트
- 학습 모달과 같은 데이터로 만든 CPU 스케줄링 시간축·평균 계산
- 서브넷 분할·브로드캐스트 주소 및 FIFO/LRU 계산 예제
- 과목별 책갈피, 카드별 책갈피, 페이지 번호와 자료 기준일
- 악성코드 종류와 구별, 보안 공격 유형, OTP·OAuth·SSO·ISMS 비교
- 릴레이션·튜플·속성·도메인·카디널리티·차수, 스키마·인스턴스·데이터 독립성, ER 구성·관계·참여 제약, NULL 비교

데이터베이스 기본 용어는 각 카드의 비교 노트에 예제를 함께 정리합니다. 릴레이션의 카디널리티(현재 행 수)와 ER 관계의 카디널리티(연결 수), 스키마와 인스턴스를 구별합니다. ER 관계는 [IBM ERD 설명](https://www.ibm.com/think/topics/entity-relationship-diagram), NULL 비교는 [PostgreSQL 공식 문서](https://www.postgresql.org/docs/current/functions-comparison.html)를 참고했습니다.

악성코드는 전파·위장·피해 행동이라는 서로 다른 분류 기준을 비교합니다. 바이러스·웜·트로이목마와 스파이웨어·백도어·논리 폭탄의 설명은 [NIST CSRC 용어집](https://csrc.nist.gov/glossary)에서 해당 정의를 확인해 작성했습니다. 기존 보안 세부 자료의 랜섬웨어·루트킷·키로거는 악성코드 카드로 모았으며, 원래 개요와 세부 카드 ID는 유지합니다.

## 다시 생성하기

Python에 `reportlab`과 `pypdf`가 필요합니다. 한글을 지원하고 PDF 임베딩이 허용되는 TTF 글꼴의 일반·굵은 파일을 지정하세요. Windows 기본값은 맑은 고딕입니다.

```powershell
node scripts/build-exam-summary-pdf.mjs --python "Python 실행 파일 경로" --font "일반 글꼴.ttf" --bold-font "굵은 글꼴.ttf" --date YYYY-MM-DD
```

출력은 `output/pdf/`에 생성되고 다운로드 폴더에도 복사됩니다. 웹 빌드에서는 미리 생성한 파일을 배포하므로 운영 환경에 Python이나 글꼴 설치는 필요하지 않습니다.

자료를 수정한 경우 PDF를 다시 생성하고, 전체 페이지를 이미지로 확인한 뒤 다운로드 파일도 함께 커밋합니다. 생성기는 모든 용어가 PDF 텍스트에 포함되는지 확인하며, PDF 생성 실패 시 기존 다운로드 파일은 갱신하지 않습니다.
