export const processes = [
  { id: 'P1', arrival: 0, burst: 6 },
  { id: 'P2', arrival: 1, burst: 3 },
  { id: 'P3', arrival: 3, burst: 1 },
];

export const nonPreemptiveSchedules = [
    { name: 'FCFS', slots: [['P1', 0, 6], ['P2', 6, 9], ['P3', 9, 10]], note: '도착 순서대로 실행합니다.' },
    { name: 'SJF', slots: [['P1', 0, 6], ['P3', 6, 7], ['P2', 7, 10]], note: '시각 6에 도착해 있는 P2(3)와 P3(1) 중 짧은 P3를 먼저 선택합니다.' },
    { name: 'HRN', slots: [['P1', 0, 6], ['P3', 6, 7], ['P2', 7, 10]], note: '시각 6의 응답률: P2=(5+3)/3=8/3, P3=(3+1)/1=4 → P3 선택.' },
];
export const preemptiveSchedules = [
    { name: 'SRTF', slots: [['P1', 0, 1], ['P2', 1, 4], ['P3', 4, 5], ['P1', 5, 10]], note: '시각 1에 P2가 P1을 선점합니다. 시각 3에는 P2·P3의 잔여시간이 같아 현재 작업 P2를 유지한다고 가정합니다.' },
    { name: 'RR · 할당량 2', slots: [['P1', 0, 2], ['P2', 2, 4], ['P1', 4, 6], ['P3', 6, 7], ['P2', 7, 8], ['P1', 8, 10]], note: '실행 중 도착한 작업은 준비 큐에 넣고, 할당량 후 미완료 작업은 큐 맨 뒤로 보냅니다.' },
];
const schedulingGuides = {
  'cpu-scheduling-calculation--g1-p1': [...nonPreemptiveSchedules, ...preemptiveSchedules],
  'cpu-scheduling-calculation--g2-p1': [...nonPreemptiveSchedules, ...preemptiveSchedules],
  'cpu-scheduling-calculation--g4-p1': nonPreemptiveSchedules,
  'cpu-scheduling-calculation--g5-p1': preemptiveSchedules,
};

export const subnetAddressExamples = [
  { input: '192.168.10.77/26', mask: '255.255.255.192', block: '마지막 옥텟 · 256−192=64', quotient: '⌊77÷64⌋×64=64', range: '마지막 옥텟 64~127', network: '192.168.10.64', broadcast: '192.168.10.127', usable: '192.168.10.65 ~ 192.168.10.126', hosts: '2⁶−2=62개' },
  { input: '172.16.9.130/22', mask: '255.255.252.0', block: '세 번째 옥텟 · 256−252=4', quotient: '⌊9÷4⌋×4=8', range: '세 번째 옥텟 8~11 · 네 번째 옥텟 0~255', network: '172.16.8.0', broadcast: '172.16.11.255', usable: '172.16.8.1 ~ 172.16.11.254', hosts: '2¹⁰−2=1022개' },
];

export const splitSubnets = [
  ['10.20.4.64/28', '10.20.4.79', '10.20.4.65 ~ 10.20.4.78'],
  ['10.20.4.80/28', '10.20.4.95', '10.20.4.81 ~ 10.20.4.94'],
];

const subnetAddressIds = ['subnet-cidr-calculation--g1-p1', 'subnet-cidr-calculation--g2-p1', 'subnet-cidr-calculation--g4-p1'];
const subnetSplitIds = ['subnet-cidr-calculation--g3-p1', 'subnet-cidr-calculation--g5-p1'];

export function hasCalculationGuide(materialId) {
  return Boolean(schedulingGuides[materialId] || subnetAddressIds.includes(materialId) || subnetSplitIds.includes(materialId));
}

function CalculationTable({ caption, columns, rows }) {
  return <div className="calculation-table-scroll"><table className="calculation-table"><caption>{caption}</caption><thead><tr>{columns.map((column) => <th key={column} scope="col">{column}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => cellIndex === 0 ? <th key={cellIndex} scope="row">{cell}</th> : <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div>;
}

function scheduleResults(slots) {
  return processes.map((process) => {
    const runs = slots.filter(([id]) => id === process.id);
    const completion = runs.at(-1)[2];
    const turnaround = completion - process.arrival;
    return [process.id, completion, turnaround, turnaround - process.burst, runs[0][1] - process.arrival];
  });
}

function SchedulingGuide({ scenarios, compact }) {
  const summaryRows = scenarios.map((scenario) => {
    const results = scheduleResults(scenario.slots);
    const average = results.reduce((sum, row) => sum + row[3], 0) / results.length;
    return [scenario.name, scenario.slots.map(([id, start, end]) => `${id} ${start}~${end}`).join(' → '), `${Number.isInteger(average) ? average : average.toFixed(2)}`];
  });

  return <section className="calculation-guide" aria-label="CPU 스케줄링 계산 표">
    <h3>간트 차트로 계산하기</h3>
    <CalculationTable caption="공통 입력 · 시간 단위 ms" columns={['프로세스', '도착 A', '실행 B']} rows={processes.map(({ id, arrival, burst }) => [id, arrival, burst])} />
    <div className="calculation-formulas"><span>반환 T = 완료 C − 도착 A</span><span>대기 W = T − 실행 B</span><span>응답 R = 첫 실행 − 도착 A</span></div>
    {compact ? <CalculationTable caption="알고리즘별 시간축과 평균 대기시간" columns={['알고리즘', '실행 순서·시간축', '평균 W']} rows={summaryRows} /> : scenarios.map((scenario) => {
      const results = scheduleResults(scenario.slots);
      const totalWait = results.reduce((sum, row) => sum + row[3], 0);
      return <section className="calculation-case" key={scenario.name}>
        <h4>{scenario.name}</h4>
        <div className="calculation-timeline-scroll"><div className="calculation-timeline" aria-label={`${scenario.name} 시간축`}>
          {scenario.slots.map(([id, start, end], index) => <div className={`calculation-slot ${id.toLowerCase()}`} style={{ flexGrow: end - start }} key={`${id}-${start}-${index}`}><strong>{id}</strong><span>{start} → {end}</span></div>)}
        </div></div>
        <p className="calculation-note">{scenario.note}</p>
        <CalculationTable caption={`${scenario.name} 계산 결과 · 평균 대기시간 = (${results.map((row) => row[3]).join(' + ')}) ÷ 3 = ${Number.isInteger(totalWait / 3) ? totalWait / 3 : `${totalWait}/3 ≈ ${(totalWait / 3).toFixed(2)}`}ms`} columns={['프로세스', '완료 C', '반환 T', '대기 W', '응답 R']} rows={results} />
      </section>;
    })}
  </section>;
}

function AddressRange({ network, usable, broadcast }) {
  return <div className="calculation-address-range" aria-label={`네트워크 ${network}, 사용 가능 ${usable}, 브로드캐스트 ${broadcast}`}><span><small>네트워크</small>{network}</span><span><small>사용 가능 호스트</small>{usable}</span><span><small>브로드캐스트</small>{broadcast}</span></div>;
}

function SubnetAddressGuide({ compact }) {
  return <section className="calculation-guide" aria-label="브로드캐스트 주소 계산 표">
    <h3>IP → 네트워크 → 브로드캐스트</h3>
    <div className="calculation-formulas"><span>네트워크 = IP AND 마스크</span><span>브로드캐스트 = 네트워크 OR 호스트 비트 전체 1</span><span>블록 크기 = 256 − 변화 옥텟 마스크</span></div>
    {subnetAddressExamples.map((example) => <section className="calculation-case" key={example.input}>
      <h4>{example.input}</h4>
      {!compact && <p className="calculation-note">마스크 {example.mask} → {example.block} → 시작값 {example.quotient} → {example.range} → 구간의 끝이 브로드캐스트</p>}
      <AddressRange network={example.network} usable={example.usable} broadcast={example.broadcast} />
      <CalculationTable caption={`${example.input} 계산 결과`} columns={['항목', '계산값']} rows={compact ? [['마스크', example.mask], ['네트워크', example.network], ['브로드캐스트', example.broadcast]] : [['마스크', example.mask], ['블록 크기', example.block], ['시작값 계산', example.quotient], ['네트워크', example.network], ['브로드캐스트', example.broadcast], ['사용 가능 호스트', example.hosts]]} />
    </section>)}
    {!compact && <p className="calculation-note">예외: /31 점대점 링크에서는 두 주소를 모두 끝점 주소로 사용하며 일반적인 지향 브로드캐스트 주소를 두지 않습니다.</p>}
  </section>;
}

function SubnetSplitGuide({ compact }) {
  return <section className="calculation-guide" aria-label="서브넷 분할 계산 표">
    <h3>실기형 변형 예제 · /27을 2분할</h3>
    <p className="calculation-question">10.20.4.64/27을 같은 크기의 두 서브넷으로 나누었다. 10.20.4.82가 속한 서브넷의 프리픽스 길이와 브로드캐스트 주소를 구하시오.</p>
    <div className="calculation-formulas"><span>원래 주소 수 2⁵ = 32개</span><span>2분할 → 1비트 빌림 → /28</span><span>/28 마스크 255.255.255.240 → 블록 16개</span></div>
    {!compact && <ol className="calculation-steps"><li>원래 /27 대역의 마지막 옥텟은 64~95입니다.</li><li>새 프리픽스는 27+1=28, 블록 크기는 256−240=16입니다.</li><li>64~79와 80~95로 나누고, 82가 포함된 둘째 구간을 고릅니다.</li><li>둘째 구간의 시작은 80, 끝은 95입니다.</li></ol>}
    {!compact && <div className="calculation-blocks" aria-label="원래 대역의 마지막 옥텟 64부터 95까지를 두 블록으로 분할">{splitSubnets.map(([network, broadcast]) => <div key={network}><strong>{network}</strong><span>→ {broadcast}</span></div>)}</div>}
    <CalculationTable caption="10.20.4.64/27을 2개로 분할한 결과" columns={['새 서브넷', '브로드캐스트', '사용 가능 범위']} rows={splitSubnets} />
    <p className="calculation-answer"><strong>정답</strong> /28 · 10.20.4.95 <span>(10.20.4.82는 10.20.4.80~95에 속함)</span></p>
    {!compact && <p className="calculation-note">검산: /28의 호스트 비트는 4개이므로 전체 16주소, 일반적인 할당 가능 호스트는 2⁴−2=14개입니다. 실제 시험 원문이 아닌 변형 예제입니다.</p>}
  </section>;
}

export default function CalculationGuide({ materialId, compact = false }) {
  const scenarios = schedulingGuides[materialId];
  if (scenarios) return <SchedulingGuide scenarios={scenarios} compact={compact} />;
  if (subnetAddressIds.includes(materialId)) return <SubnetAddressGuide compact={compact} />;
  if (subnetSplitIds.includes(materialId)) return <SubnetSplitGuide compact={compact} />;
  return null;
}
