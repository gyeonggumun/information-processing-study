export const inquiryCategories = Object.freeze({ general: '일반 문의', content: '학습 자료', bug: '오류 신고', account: '계정 문의' });
export const inquiryStatuses = Object.freeze({ pending: '접수 대기', in_progress: '확인 중', answered: '답변 완료' });

export function validateInquiry({ category, title, body }) {
  if (!Object.hasOwn(inquiryCategories, category)) return '문의 유형을 선택해 주세요.';
  if (Array.from(title.trim()).length < 2 || title.length > 120) return '제목을 2~120자로 작성해 주세요.';
  if (Array.from(body.trim()).length < 10 || body.length > 5000) return '문의 내용을 10~5,000자로 작성해 주세요.';
  return '';
}

export function parseInquiryPage(data) {
  if (!Array.isArray(data?.items) || data.items.length > 10 || typeof data.has_more !== 'boolean'
    || (data.has_more && data.items.length !== 10)
    || data.items.some(item => !item.id || !item.created_at || !item.updated_at || !Object.hasOwn(inquiryStatuses, item.status))) {
    throw new Error('Invalid inquiry page');
  }
  const last = data.items.at(-1);
  return { items: data.items, nextCursor: data.has_more ? { id: last.id, created_at: last.created_at } : null };
}

export function inquiryError(error) {
  const message = error?.message ?? '';
  if (message.includes('INQUIRY_RATE_LIMIT')) return '문의는 1분에 1회, 24시간에 최대 10회 등록할 수 있습니다. 잠시 후 다시 시도해 주세요.';
  if (message.includes('INQUIRY_CONFLICT')) return '다른 화면에서 변경된 문의입니다. 내용을 다시 불러온 뒤 저장해 주세요.';
  if (message.includes('INQUIRY_REPLY_INVALID')) return '답변을 입력하고 답변 완료를 선택하거나, 답변을 비운 뒤 접수 대기·확인 중으로 저장해 주세요.';
  if (message.includes('INQUIRY_INVALID')) return '제목은 2~120자, 내용은 10~5,000자로 작성해 주세요.';
  return '문의 처리에 실패했습니다. 로그인·연결 상태를 확인한 뒤 다시 시도해 주세요.';
}
