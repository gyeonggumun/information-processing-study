import { build } from 'rolldown';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export async function validateSummaryPdfAssets() {
  mkdirSync('tmp/pdfs', { recursive: true });
  const bundle = resolve('tmp/pdfs/verify-summary-pdf-data.mjs');
  await build({ input: 'scripts/exam-summary-pdf-data.mjs', platform: 'node', output: { file: bundle, format: 'esm' } });
  const data = JSON.parse(execFileSync(process.execPath, [bundle], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }));
  const manifest = JSON.parse(readFileSync('public/downloads/exam-summary-atlas.json', 'utf8'));
  const atlas = readFileSync('public/downloads/exam-summary-atlas.pdf');
  const cards = (data.atlasSections ?? data.sections).flatMap((section) => section.cards.map((card) => ({ id: card.id, subject: section.title, signature: JSON.stringify(card) })));
  if (manifest.version !== 1 || cards.length !== Object.keys(manifest.cards).length || new Set(cards.map((card) => card.id)).size !== cards.length || createHash('sha256').update(atlas).digest('hex') !== manifest.sha256 || cards.some((card) => manifest.cards[card.id]?.signature !== card.signature || manifest.cards[card.id]?.subject !== card.subject)) {
    throw new Error('학습 자료와 개인 PDF 조판 자료가 다릅니다. pdf:summary로 자료를 다시 생성하고 함께 커밋해주세요.');
  }
  return { data, manifest, atlas, cards };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { cards } = await validateSummaryPdfAssets();
  console.log(`PASS: 개인 PDF ${cards.length}개 카드와 원본·버전·파일 해시 일치`);
}
