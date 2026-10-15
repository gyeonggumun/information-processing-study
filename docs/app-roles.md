# User · Pro · Admin 권한

| 기능 | User | Pro | Admin |
| --- | --- | --- | --- |
| 학습·기출·코드·오답·통계·즐겨찾기 | 허용 | 허용 | 허용 |
| 실기 요약·개인 정렬/삭제·PDF 생성 | 차단 | 본인 자료만 허용 | 본인 자료만 허용 |
| 사용자 조회·계정 관리·User/Pro 변경 | 차단 | 차단 | 허용 |

- 신규·기존 일반 계정의 기본값은 User입니다. 기존 계정을 일괄 Pro로 승격하지 않습니다.
- Pro는 접근 등급 이름이며 결제·구독·자동 과금 기능을 추가한 것이 아닙니다.
- 관리 페이지의 `Pro로 변경` / `User로 변경`으로 전환합니다. 대상 사용자는 새로고침하거나 다시 로그인하면 새 권한이 반영됩니다.
- Admin은 기존과 같이 이메일이 확인되고 Google 계정이 연결된 지정 운영자 계정에만 부여합니다. 화면이나 RPC로 Admin을 새로 지정하거나 운영자를 강등할 수 없습니다.
- 역할은 `private.account_app_roles`에 서버가 관리합니다. 사용자가 수정할 수 있는 `user_metadata`, 브라우저 저장소, JWT의 임의 역할 값은 권한 부여 근거로 사용하지 않습니다.
- 권한 변경 RPC와 목록 RPC는 현재 유효한 관리자 세션을 검사합니다. 개인 요약의 RLS는 본인 소유 + Pro/Admin + 최신 로그인 세션을 함께 요구합니다. User로 강등해도 개인 요약 설정은 지우지 않아 재승격 시 복원됩니다.
- 이 기능은 앱 메뉴·페이지·개인 설정 접근 제어입니다. 기존 정적 학습 코드 및 공개 PDF 자산을 비공개 유료 콘텐츠로 바꾸는 DRM/서버 스트리밍 기능은 아닙니다.

## 검증

- `npm run verify:roles`: 권한 계층, 잘못된 역할의 기본 거부, 실제 보호 라우트의 렌더링, 라우트 연결 검사.
- `supabase/tests/app_roles.sql`: 트랜잭션 내 임시 계정으로 Pro 개인 설정 읽기/쓰기, 계정 간 접근 차단, User·Pro의 관리 기능 차단, 메타데이터 위조 차단, 세션 무효화, 관리자 승격/강등 및 운영자 보호 검사. 모든 검증 변경은 롤백합니다.
- 운영 DB 검사에서 모든 항목 통과. 기존 계정의 실제 권한·개인 설정은 변경하지 않았습니다.
- 실제 컴포넌트를 사용하는 검증 화면에서 User의 요약 차단, Pro의 요약 허용·관리 차단, 관리자 권한 전환 버튼과 결과 표시를 확인했습니다. 검증 화면은 실제 계정 API를 호출하지 않습니다.
- 보안 어드바이저의 private 권한 테이블 `RLS Enabled No Policy` 정보는 의도된 기본 거부입니다. 테이블 직접 접근은 회수하고 검사된 함수만 사용합니다. [RLS 안내](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)
- 프로젝트에 기존 `Leaked Password Protection Disabled` 경고가 남아 있습니다. Google 로그인 전용인 이번 역할 분리와 무관하므로 인증 설정은 변경하지 않았습니다. [관련 안내](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)
