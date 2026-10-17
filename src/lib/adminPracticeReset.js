export async function resetManagedUserPractice(client, account, confirmation) {
  const email = confirmation.trim().toLowerCase();
  if (!account?.user_id || !account.email || !email || email !== account.email.toLowerCase()) {
    throw new Error('대상 계정의 이메일을 정확하게 입력해주세요.');
  }
  const { data, error } = await client.rpc('reset_managed_user_practice', {
    p_user_id: account.user_id, p_confirm_email: email,
  });
  if (error?.code === '42501') throw new Error('관리자 권한과 로그인 상태를 확인한 뒤 다시 시도해주세요.');
  if (error?.code === '22023') throw new Error('대상 계정 또는 이메일이 변경되었습니다. 목록을 새로 불러와 확인해주세요.');
  if (error || data?.user_id !== account.user_id || !Number.isSafeInteger(data?.deleted_count) || data.deleted_count < 0) {
    throw new Error('풀이 상태를 초기화하지 못했습니다. 접속 상태를 확인한 뒤 다시 시도해주세요.');
  }
  return data;
}
