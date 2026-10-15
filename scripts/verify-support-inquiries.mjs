import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateInquiry, parseInquiryPage, inquiryError } from '../src/lib/supportInquiries.js';

const valid = { category: 'content', title: '학습 자료 문의', body: '학습 자료의 설명을 확인하고 싶습니다.' };
assert.equal(validateInquiry(valid), '');
for (const change of [{category:'__proto__'}, {title:' '}, {title:'x'.repeat(121)}, {body:'짧음'}, {body:' '.repeat(30)}, {body:'x'.repeat(5001)}]) {
  assert.notEqual(validateInquiry({...valid,...change}), '');
}
const items = Array.from({length:10},(_,i)=>({id:`test-${i}`,status:'pending',created_at:'2026-10-15T00:00:00Z',updated_at:'2026-10-15T00:00:00.123456Z'}));
const first = parseInquiryPage({items,has_more:true});
assert.deepEqual(first.nextCursor,{id:'test-9',created_at:items[9].created_at});
assert.equal(first.items[0].updated_at,items[0].updated_at); // Preserve DB microseconds for concurrency checks.
assert.equal(parseInquiryPage({items:[],has_more:false}).nextCursor,null);
for (const invalid of [null,{}, {items:[],has_more:true},{items:[...items,items[0]],has_more:true},{items:[{...items[0],status:'admin'}],has_more:false}]) assert.throws(()=>parseInquiryPage(invalid));
assert.match(inquiryError({message:'INQUIRY_RATE_LIMIT'}),/1분/);
assert.match(inquiryError({message:'INQUIRY_CONFLICT'}),/다시 불러온/);
assert.match(inquiryError({message:'INQUIRY_REPLY_INVALID'}),/답변 완료/);
assert.doesNotMatch(inquiryError({message:'private database detail'}),/private database/);
const app = readFileSync('src/App.jsx','utf8');
assert.match(app,/path="\/inquiries" element=\{<ProtectedRoute>/);
assert.match(app,/path="\/admin\/inquiries" element=\{<ProtectedRoute requiredRole="admin">/);
assert.doesNotMatch(readFileSync('src/pages/InquiriesPage.jsx','utf8'),/dangerouslySetInnerHTML/);
console.log('PASS: inquiry validation, cursor bounds, timestamp precision, safe errors and protected routes');
