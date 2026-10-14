# 계정별 단일 접속

- 같은 계정의 최신 Google 로그인만 학습·문제 풀이·개인 데이터 API를 사용할 수 있습니다.
- 같은 브라우저의 여러 탭은 같은 Auth 세션을 공유하므로 사용할 수 있습니다.
- 다른 브라우저·시크릿 창·기기에서 새로 로그인하면 이전 접속을 종료합니다.
- 활성 화면은 15초마다 서버를 확인하고, 탭 복귀·포커스 시에도 확인합니다. 배경 탭의 화면 갱신은 복귀 시 이루어지지만 서버 API는 이전 세션을 바로 차단합니다.
- 세션 확인에 실패하거나 10초 내 응답이 없으면 보호 화면을 차단하고 로컬 로그아웃합니다. 인터넷이 복구되면 다시 로그인해야 합니다.
- 자동 종료·일반 로그아웃은 `scope: local`이므로 새 접속까지 종료하지 않습니다. 회원 탈퇴의 전체 세션 종료는 기존대로 유지합니다.
- 기존 1시간 미활동 제한은 별도로 유지합니다.

## 서버

JWT의 검증된 `session_id`·`auth.uid()`를 `auth.sessions`와 대조합니다. 클라이언트가 세션 ID나 사용자 ID를 인자로 지정하지 않습니다. `private.account_login_sessions`에는 계정별 마지막으로 허용한 로그인만 보관하고 Auth 세션 삭제 시에도 기준을 지우지 않아 이전 접속이 다시 살아나지 않습니다. 계정 영구 삭제 시에는 외래 키로 함께 삭제합니다.

POST `check_single_session` RPC만 최신 세션 기준을 등록할 수 있습니다. 새로고침·토큰 갱신·이전 기기의 재검사로 더 오래된 세션이 기준을 덮어쓸 수 없습니다. 검사 결과 외에 세션 정보는 반환하지 않습니다.

Data API는 `pgrst.db_pre_request`로 테이블 및 RPC 호출을 차단합니다. 네 개의 개인 데이터 테이블에는 기존 소유권 정책에 추가되는 restrictive RLS를 적용했습니다. 관리자 작업은 `can_manage_users`에서도 검사하며 회원 탈퇴 Edge Function도 서비스 키로 쓰기 전에 요청자 세션을 검사합니다.

Auth 자체의 액세스 토큰을 즉시 취소하는 유료 설정이 아니라 앱 접속/API 권한을 제한하는 방식입니다. 기존 토큰으로 이미 받은 정적 학습 자료를 회수하거나 동일 토큰 자체의 복제까지 구별하지는 못합니다. 향후 Storage·새 Edge Function·별도 데이터 API를 추가할 때도 동일 세션 검사를 적용해야 합니다.

## 검증

`npm run verify:single-session`, `npm run verify:idle-session`으로 클라이언트 동작과 기존 제한을 확인합니다. `scripts/verify-single-session.sql`은 가상 사용자·두 세션을 생성한 뒤 모두 롤백하는 서버 통합 검증입니다. 해당 파일은 DB 쓰기 권한이 있는 검증 환경에서 실행해야 합니다.

이번 작업에서는 연결 도구 오류 및 CLI 인증 부재로 가상 사용자 생성·롤백 통합 검증을 실행하지 못했습니다. 서버의 최신 세션 허용·알 수 없는 세션 거부, authenticated 역할의 GET·RPC 차단 및 세션 확인 POST 예외는 읽기 전용 검사로 확인했습니다. 브라우저에서는 실제 AuthProvider·보호 라우트·알림과 가상 서버 응답을 연결해 이전 접속 종료·새 접속 유지·같은 세션의 여러 탭 허용을 확인했습니다. 실제 두 Google 로그인 기기로 수행하는 검증과는 구별합니다.

보안 점검의 비공개 테이블 RLS 무정책 INFO는 사용자 직접 접근을 의도적으로 모두 거부하는 설정입니다. [RLS 무정책 안내](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy). 기존 [유출 비밀번호 보호 경고](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)는 Google 전용 로그인을 변경하거나 유료 옵션을 활성화하지 않고 유지했습니다.

근거: [Supabase 세션 문서](https://supabase.com/docs/guides/auth/sessions), [Data API 요청 검사](https://supabase.com/docs/guides/api/securing-your-api).
