import { build } from 'rolldown';
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const option = (name, fallback) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
};
const python = option('--python', 'python');
const font = option('--font', 'C:/Windows/Fonts/malgun.ttf');
const boldFont = option('--bold-font', 'C:/Windows/Fonts/malgunbd.ttf');
const date = option('--date', new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' }));
const tempDir = resolve('tmp/pdfs');
const outputDir = resolve('output/pdf');
const downloadDir = resolve('public/downloads');
for (const folder of [tempDir, outputDir, downloadDir]) mkdirSync(folder, { recursive: true });
const bundledData = resolve(tempDir, 'exam-summary-data.mjs');
await build({ input: 'scripts/exam-summary-pdf-data.mjs', platform: 'node', output: { file: bundledData, format: 'esm' } });
const data = execFileSync(process.execPath, [bundledData], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
const output = resolve(outputDir, 'exam-summary-quick-review.pdf');
const result = execFileSync(python, ['scripts/render-exam-summary-pdf.py', '--output', output, '--font', font, '--bold-font', boldFont, '--date', date], {
  input: data, encoding: 'utf8', env: { ...process.env, PYTHONIOENCODING: 'utf-8' }, maxBuffer: 8 * 1024 * 1024,
});
copyFileSync(output, resolve(downloadDir, 'exam-summary-quick-review.pdf'));
console.log(result.trim());
console.log(`PDF 다운로드 파일 갱신: ${output}`);
