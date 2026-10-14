import { useSyncExternalStore } from 'react';
import { Clock3 } from 'lucide-react';
import { formatIdleTime } from '../lib/idleSession';

export default function IdleSessionCountdown({ store }) {
  const seconds = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  return (
    <span className={`idle-session-countdown${seconds <= 300 ? ' warning' : ''}`} role="timer" aria-live="off" aria-label={`자동 로그아웃까지 ${Math.floor(seconds / 60)}분 ${seconds % 60}초`} title="1시간 동안 활동이 없으면 자동 로그아웃됩니다. 마우스 이동·클릭·키 입력·스크롤 시 시간이 갱신됩니다.">
      <Clock3 size={13} aria-hidden="true" /><span>{formatIdleTime(seconds)}</span>
    </span>
  );
}
