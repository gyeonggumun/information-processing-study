import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'rolldown';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { calculateSubnet, octetBits, subnetVisualExamples } from '../src/lib/subnetCalculation.js';

assert.deepEqual(octetBits(252), [1,1,1,1,1,1,0,0]);
const example = calculateSubnet('192.168.35.10', 22);
assert.equal(example.mask, '255.255.252.0');
assert.equal(example.hostBits, 10);
assert.equal(example.network, '192.168.32.0');
assert.equal(example.broadcast, '192.168.35.255');
assert.equal(example.usableFirst, '192.168.32.1');
assert.equal(example.usableLast, '192.168.35.254');
assert.equal(example.usableCount, 1022);
assert.equal(calculateSubnet('192.168.33.20',22).network, example.network);
assert.notEqual(calculateSubnet('192.168.36.20',22).network, example.network);
const toBig = ip => ip.split('.').reduce((sum, n) => (sum << 8n) + BigInt(n), 0n);
const max = (1n << 32n) - 1n;
for (const ip of ['0.0.0.0','255.255.255.255','192.168.35.10','172.16.9.130','192.168.10.77']) {
  for (let prefix = 0; prefix <= 32; prefix++) {
    const result = calculateSubnet(ip, prefix);
    const hostMask = (1n << BigInt(32 - prefix)) - 1n;
    const mask = max ^ hostMask;
    assert.equal(toBig(result.mask), mask);
    assert.equal(toBig(result.network), toBig(ip) & mask);
    assert.equal(toBig(result.broadcast), (toBig(ip) & mask) | hostMask);
    assert.equal(result.hasBroadcast, prefix <= 30);
  }
}
assert.equal(calculateSubnet('192.168.1.0',31).usableCount,2);
assert.equal(calculateSubnet('192.168.1.7',32).usableCount,1);
for (const [ip,prefix] of [['999.1.1.1',22],['1.2.3',22],['1.2.3.4',33],['1.2.3.4',-1],['1.2.3.4',1.5]]) assert.throws(()=>calculateSubnet(ip,prefix));
for (const q of subnetVisualExamples) assert.deepEqual(calculateSubnet(q.ip,q.prefix).octets,q.octets);

mkdirSync('tmp/pdfs', {recursive:true});
const output = resolve('tmp/pdfs/subnet-render-check.mjs');
const source = path => JSON.stringify(resolve(path).replaceAll('\\','/'));
await build({input:'subnet-check',platform:'node',external:['react','react/jsx-runtime'],plugins:[{
  name:'subnet-check-entry',resolveId:id=>id==='subnet-check'?'\0subnet-check':null,
  load:id=>id==='\0subnet-check'?`
    export {default as CalculationGuide,hasCalculationGuide} from ${source('src/components/CalculationGuide.jsx')};
    export {subjects} from ${source('src/data/studyData.js')};
    export {defaultSummaryOrder,availableSummaryOrder} from ${source('src/data/examSummaryCatalog.js')};
  `:null,
}],output:{file:output,format:'esm'}});
const {CalculationGuide,hasCalculationGuide,subjects,defaultSummaryOrder,availableSummaryOrder} = await import(pathToFileURL(output).href);
const id = 'subnet-cidr-calculation--g6-p1';
assert(hasCalculationGuide('subnet-cidr-calculation'), '전체 개요에서도 비트 표 표시');
assert(subjects.find(subject=>subject.id==='systems').materials.some(material=>material.id===id && material.kind==='세부 학습'));
assert(availableSummaryOrder.includes(`systems:${id}`));
assert(!defaultSummaryOrder.includes(`systems:${id}`), '기본 목록은 늘리지 않고 필요 시 개인 추가');
for (let group=1;group<=6;group++) {
  const materialId = `subnet-cidr-calculation--g${group}-p1`;
  assert(hasCalculationGuide(materialId));
  for (const compact of [true,false]) {
    const html = renderToStaticMarkup(createElement(CalculationGuide,{materialId,compact}));
    if ([3,5].includes(group)) assert(html.includes('subnet-split-visual') && html.includes('주어진 IP .82'));
    else assert(html.includes('subnet-octet-grid') && html.includes('192.168.35.255') && html.includes('호스트 10비트') && html.includes('scope="row"'));
  }
}
console.log('PASS: 165개 IPv4 경계값, 예시 정답·수신 범위·/31·/32, 학습 카드·개인 추가 연결, 6개 서브넷 카드의 상세/요약 도식 렌더링');
