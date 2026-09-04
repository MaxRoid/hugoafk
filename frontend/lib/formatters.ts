import { ClientStatus } from '@/types';

export function formatRuntime(seconds: number): string {
  if (seconds <= 0) return '00:00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatShortRuntime(seconds: number): string {
  if (seconds <= 0) return '0m';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins}m`;
}

export function getStatusBadgeConfig(status: ClientStatus) {
  switch (status) {
    case 'online':
      return {
        label: 'Online',
        dotColor: 'bg-emerald-400',
        textColor: 'text-emerald-400',
        bgColor: 'bg-emerald-950/40',
        borderColor: 'border-emerald-800/50',
        glow: 'shadow-[0_0_8px_rgba(52,211,153,0.35)]',
      };
    case 'starting':
      return {
        label: 'Starting',
        dotColor: 'bg-amber-400 animate-pulse',
        textColor: 'text-amber-400',
        bgColor: 'bg-amber-950/40',
        borderColor: 'border-amber-800/50',
        glow: 'shadow-[0_0_8px_rgba(251,191,36,0.35)]',
      };
    case 'stopped':
      return {
        label: 'Stopped',
        dotColor: 'bg-zinc-500',
        textColor: 'text-zinc-400',
        bgColor: 'bg-zinc-900/60',
        borderColor: 'border-zinc-800',
        glow: '',
      };
    case 'offline':
    default:
      return {
        label: 'Offline',
        dotColor: 'bg-rose-500',
        textColor: 'text-rose-400',
        bgColor: 'bg-rose-950/40',
        borderColor: 'border-rose-800/50',
        glow: 'shadow-[0_0_8px_rgba(244,63,94,0.35)]',
      };
  }
}
