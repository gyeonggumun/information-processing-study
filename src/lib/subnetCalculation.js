export const bitWeights = [128, 64, 32, 16, 8, 4, 2, 1];
export const octetBits = value => value.toString(2).padStart(8, '0').split('').map(Number);
const addressText = value => [24, 16, 8, 0].map(shift => (value >>> shift) & 255).join('.');

export function calculateSubnet(ip, prefix) {
  const octets = ip.split('.').map(Number);
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip) || octets.some(value => value > 255) || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) throw new Error('유효한 IPv4 주소와 /0~32 프리픽스가 필요합니다.');
  const hostBits = 32 - prefix;
  const addressCount = 2 ** hostBits;
  const value = octets.reduce((sum, octet) => sum * 256 + octet, 0);
  const networkValue = Math.floor(value / addressCount) * addressCount;
  const broadcastValue = networkValue + addressCount - 1;
  return {
    ip, prefix, octets, hostBits, addressCount,
    mask: addressText(2 ** 32 - addressCount),
    network: addressText(networkValue), broadcast: addressText(broadcastValue),
    // /31·/32는 일반 LAN의 브로드캐스트·두 예약 주소 제외 규칙을 적용하지 않습니다.
    usableFirst: addressText(prefix >= 31 ? networkValue : networkValue + 1),
    usableLast: addressText(prefix >= 31 ? broadcastValue : broadcastValue - 1),
    usableCount: prefix >= 31 ? addressCount : addressCount - 2,
    hasBroadcast: prefix <= 30,
  };
}

export const subnetVisualExamples = [
  { label: '이미지 예시 · /22', ...calculateSubnet('192.168.35.10', 22) },
  { label: '마지막 옥텟 · /26', ...calculateSubnet('192.168.10.77', 26) },
  { label: '세 번째 옥텟 · /22', ...calculateSubnet('172.16.9.130', 22) },
];
