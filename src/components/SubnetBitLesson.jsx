import { useState } from 'react';
import { bitWeights, octetBits, subnetVisualExamples } from '../lib/subnetCalculation';

function OctetTable({ example, index, operation = 'mask' }) {
  const source = example.octets[index];
  const mask = Number(example.mask.split('.')[index]);
  const result = operation === 'network' ? Number(example.network.split('.')[index]) : operation === 'broadcast' ? Number(example.broadcast.split('.')[index]) : null;
  const networkBits = Math.max(0, Math.min(8, example.prefix - index * 8));
  const role = position => position < networkBits ? 'network' : 'host';
  const cellClass = position => `subnet-bit ${role(position)}${networkBits > 0 && position === networkBits ? ' boundary' : ''}`;
  return <div className="subnet-octet">
    <table><caption>{index + 1}번째 옥텟 <strong>{source}{result !== null ? ` → ${result}` : ''}</strong><small>네트워크 {networkBits}비트 · 호스트 {8 - networkBits}비트</small></caption>
      <thead><tr><th scope="col">자리값</th>{bitWeights.map((weight, position) => <th scope="col" className={cellClass(position)} key={weight}>{weight}</th>)}</tr></thead>
      <tbody>
        <tr><th scope="row">마스크</th>{octetBits(mask).map((bit, position) => <td className={cellClass(position)} key={position}>{bit}</td>)}</tr>
        <tr><th scope="row">IP</th>{octetBits(source).map((bit, position) => <td className={cellClass(position)} key={position}>{bit}</td>)}</tr>
        {result !== null && <tr className="subnet-result-bits"><th scope="row">{operation === 'network' ? '호스트 0' : '호스트 1'}</th>{octetBits(result).map((bit, position) => <td className={cellClass(position)} key={position}>{bit}</td>)}</tr>}
      </tbody>
    </table>
    {result !== null && <p className="subnet-octet-equation">{octetBits(result).flatMap((bit, position) => bit ? [bitWeights[position]] : []).join(' + ') || '0'} = <strong>{result}</strong></p>}
  </div>;
}

function StepHeading({ number, title, children }) {
  return <div className="subnet-step-heading"><span aria-hidden="true">{number}</span><div><h4>{title}</h4><p>{children}</p></div></div>;
}

export default function SubnetBitLesson({ compact = false }) {
  const [selected, setSelected] = useState(0);
  const example = subnetVisualExamples[selected];
  const affected = [0, 1, 2, 3].filter(index => (index + 1) * 8 > example.prefix);
  const changedIndex = Math.floor(example.prefix / 8);
  const partialMask = Number(example.mask.split('.')[changedIndex]);
  const blockSize = 256 - partialMask;
  const start = Math.floor(example.octets[changedIndex] / blockSize) * blockSize;
  return <section className="subnet-lesson" aria-label="비트 표로 이해하는 서브넷 계산">
    <div className="subnet-lesson-title"><span className="section-kicker">BIT BY BIT</span><h3>비트 표로 푸는 네트워크·브로드캐스트</h3><p>파란 부분은 그대로 두고, 주황 부분만 0 또는 1로 바꿉니다.</p></div>
    <div className="subnet-example-tabs" aria-label="서브넷 계산 예시 선택">{subnetVisualExamples.map((item, index) => <button type="button" aria-pressed={selected === index} key={item.ip} onClick={() => setSelected(index)}>{item.label}</button>)}</div>
    <div className="subnet-inputs"><div><span>주어진 IP 주소</span><strong>{example.ip}</strong></div><div><span>서브넷 마스크</span><strong>{example.mask}</strong><small>앞에서부터 1이 {example.prefix}개 → /{example.prefix}</small></div></div>
    <div className="subnet-bit-legend"><span className="network">네트워크 비트 · 유지</span><span className="host">호스트 비트 · 바꾸는 부분</span><small>굵은 경계선은 네트워크와 호스트의 경계입니다.</small></div>
    <section className="subnet-step">
      <StepHeading number="1" title="마스크의 0을 세어 호스트 비트 찾기">마스크가 1인 자리는 네트워크, 0인 자리는 호스트입니다.</StepHeading>
      <div className="subnet-octet-grid">{(compact ? affected : [0, 1, 2, 3]).map(index => <OctetTable example={example} index={index} key={index} />)}</div>
      <p className="subnet-step-answer">32 − {example.prefix} = <strong>호스트 {example.hostBits}비트</strong><span>전체 2<sup>{example.hostBits}</sup> = {example.addressCount.toLocaleString('ko-KR')}주소 · 일반 LAN 할당 가능 {example.usableCount.toLocaleString('ko-KR')}개</span></p>
    </section>
    <section className="subnet-step">
      <StepHeading number="2" title="호스트 비트를 전부 0으로 → 네트워크 주소">네트워크 비트는 원래 IP와 똑같이 유지합니다. IP AND 마스크와 같은 결과입니다.</StepHeading>
      <div className="subnet-octet-grid">{affected.map(index => <OctetTable example={example} index={index} operation="network" key={index} />)}</div>
      <p className="subnet-step-answer">네트워크 주소 <strong>{example.network}</strong></p>
    </section>
    <section className="subnet-step">
      <StepHeading number="3" title="호스트 비트를 전부 1로 → 브로드캐스트 주소">네트워크 비트까지 전부 1로 바꾸는 것이 아닙니다. 주황 부분만 1로 채웁니다.</StepHeading>
      <div className="subnet-octet-grid">{affected.map(index => <OctetTable example={example} index={index} operation="broadcast" key={index} />)}</div>
      <p className="subnet-step-answer broadcast">브로드캐스트 주소 <strong>{example.broadcast}</strong></p>
      {selected === 0 && <p className="calculation-note">35는 이미 뒤 2비트가 11이어서 35 그대로입니다. 마지막 옥텟 10만 호스트 8비트를 전부 1로 바꿔 255가 됩니다.</p>}
    </section>
    <div className="subnet-shortcut"><strong>빠른 검산 · {changedIndex + 1}번째 옥텟에서 블록 찾기</strong><p>256 − {partialMask} = {blockSize} → {example.octets[changedIndex]}은 <b>{start}~{start + blockSize - 1}</b> 구간</p><small>뒤에 남은 옥텟은 네트워크에서 0, 브로드캐스트에서 255로 채웁니다.</small></div>
    <div className="subnet-final-range" aria-label="최종 주소 범위"><div><span>시작 · 호스트에 할당하지 않음</span><strong>{example.network}</strong><small>네트워크 주소</small></div><div><span>가운데 · 일반 호스트에 할당</span><strong>{example.usableFirst}<br />~ {example.usableLast}</strong><small>{example.usableCount.toLocaleString('ko-KR')}개</small></div><div><span>끝 · 전체에게 보내는 목적지</span><strong>{example.broadcast}</strong><small>브로드캐스트 주소</small></div></div>
    {!compact && <div className="subnet-receiver-note"><strong>“다른 PC 중 누가 받을 수 있나요?”라고 묻는다면</strong><p>같은 마스크를 적용했을 때 네트워크 주소가 <b>{example.network}</b>인 일반 호스트를 찾습니다. 송신 PC 본인을 제외하라는 조건이면 <b>{example.ip}</b>도 답에서 뺍니다.</p><p>목적지에 쓰는 브로드캐스트 주소와 수신 PC에 할당된 IP는 서로 다릅니다. 실제 수신은 같은 브로드캐스트 도메인과 장비의 전달·차단 설정도 영향을 줍니다.</p></div>}
    <p className="calculation-note">이 예제들은 일반 IPv4 LAN 기준입니다. /31 점대점 링크와 /32 단일 호스트에는 두 예약 주소를 빼는 공식을 그대로 적용하지 않습니다.</p>
  </section>;
}
