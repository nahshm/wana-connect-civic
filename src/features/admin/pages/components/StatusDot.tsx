import type { HealthStatus } from '@/types/agent';

interface StatusDotProps {
  status: HealthStatus;
  label?: string;
  size?: 'sm' | 'md';
}

const statusConfig: Record<HealthStatus, { bg: string; pulse: boolean; text: string }> = {
  healthy: { bg: 'bg-emerald-500', pulse: false, text: 'Healthy' },
  degraded: { bg: 'bg-amber-500', pulse: true, text: 'Degraded' },
  error: { bg: 'bg-red-500', pulse: true, text: 'Error' },
  unknown: { bg: 'bg-slate-400', pulse: false, text: 'Unknown' },
};

export function StatusDot({ status, label, size = 'sm' }: StatusDotProps) {
  const cfg = statusConfig[status] ?? statusConfig.unknown;
  const dotSize = size === 'md' ? 'w-3 h-3' : 'w-2.5 h-2.5';

  return (
    <span className="flex items-center gap-1.5">
      <span className="relative flex items-center justify-center">
        {cfg.pulse && (
          <span className={`animate-ping absolute inline-flex ${dotSize} rounded-full ${cfg.bg} opacity-60`} />
        )}
        <span className={`relative inline-flex rounded-full ${dotSize} ${cfg.bg}`} />
      </span>
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
    </span>
  );
}
