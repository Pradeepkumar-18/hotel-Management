import type { ReactNode } from 'react';

export interface MetricCardProps {
  label: string;
  value?: number | string;
  detail: string;
  icon: ReactNode;
  tone?: 'green' | 'blue' | 'amber' | 'red' | 'slate' | 'teal' | 'sand' | string;
  loading?: boolean;
  className?: string;
}

interface ToneConfig {
  cardBg: string;
  borderColor: string;
  iconBg: string;
  iconColor: string;
  valueColor: string;
  detailColor: string;
  stroke: string;
  stopColor: string;
  gradId: string;
}

const toneConfigs: Record<string, ToneConfig> = {
  green: {
    cardBg: 'bg-gradient-to-br from-[#ebfbee]/90 via-[#f3fbf6]/90 to-[#f9fdfa]',
    borderColor: 'border-[#cbf2d8]',
    iconBg: 'bg-[#dcfce7]',
    iconColor: 'text-[#166534]',
    valueColor: 'text-slate-900',
    detailColor: 'text-emerald-700',
    stroke: '#10b981',
    stopColor: '#10b981',
    gradId: 'wave-grad-green',
  },
  blue: {
    cardBg: 'bg-gradient-to-br from-[#eff6ff]/90 via-[#f5f9ff]/90 to-[#fafcff]',
    borderColor: 'border-[#dbeafe]',
    iconBg: 'bg-[#dbeafe]',
    iconColor: 'text-[#1d4ed8]',
    valueColor: 'text-slate-900',
    detailColor: 'text-slate-500',
    stroke: '#3b82f6',
    stopColor: '#3b82f6',
    gradId: 'wave-grad-blue',
  },
  amber: {
    cardBg: 'bg-gradient-to-br from-[#fffbeb]/90 via-[#fefcf6]/90 to-[#fffefc]',
    borderColor: 'border-[#fef3c7]',
    iconBg: 'bg-[#fef3c7]',
    iconColor: 'text-[#b45309]',
    valueColor: 'text-slate-900',
    detailColor: 'text-slate-500',
    stroke: '#f59e0b',
    stopColor: '#f59e0b',
    gradId: 'wave-grad-amber',
  },
  red: {
    cardBg: 'bg-gradient-to-br from-[#fff1f2]/90 via-[#fff8f8]/90 to-[#fffdfd]',
    borderColor: 'border-[#ffe4e6]',
    iconBg: 'bg-[#ffe4e6]',
    iconColor: 'text-[#be123c]',
    valueColor: 'text-slate-900',
    detailColor: 'text-slate-500',
    stroke: '#f43f5e',
    stopColor: '#f43f5e',
    gradId: 'wave-grad-red',
  },
  slate: {
    cardBg: 'bg-gradient-to-br from-[#f8fafc]/90 via-[#fcfdfe]/90 to-[#ffffff]',
    borderColor: 'border-[#e2e8f0]',
    iconBg: 'bg-[#e2e8f0]',
    iconColor: 'text-[#475569]',
    valueColor: 'text-slate-900',
    detailColor: 'text-slate-500',
    stroke: '#94a3b8',
    stopColor: '#94a3b8',
    gradId: 'wave-grad-slate',
  },
};

export function MetricCard({
  label,
  value,
  detail,
  icon,
  tone = 'green',
  loading = false,
  className = '',
}: MetricCardProps) {
  const normalizedTone = tone === 'teal' ? 'green' : tone === 'sand' ? 'amber' : tone;
  const config = toneConfigs[normalizedTone] || toneConfigs.green;

  return (
    <article
      className={`px-4 py-3 rounded-xl border ${config.cardBg} ${config.borderColor} shadow-2xs relative overflow-hidden flex flex-col justify-between min-h-[96px] transition-all duration-200 hover:shadow-xs ${className}`.trim()}
    >
      {/* Top Row: Icon squircle on left, Title on right */}
      <div className="flex items-center justify-between gap-2 relative z-10">
        <span
          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-2xs ${config.iconBg} ${config.iconColor}`}
        >
          {icon}
        </span>
        <span className="text-xs font-bold text-slate-700 tracking-tight text-right truncate">
          {label}
        </span>
      </div>

      {/* Bottom Row: Big Number and Detail on left, Sparkline wave on right */}
      <div className="flex items-end justify-between gap-2 mt-1.5 relative z-10">
        <div className="min-w-0">
          <strong className={`text-2xl font-extrabold tracking-tight block leading-none ${config.valueColor}`}>
            {loading ? '—' : value ?? 0}
          </strong>
          <span className={`text-[11px] font-medium leading-tight mt-1 block truncate ${config.detailColor}`}>
            {detail}
          </span>
        </div>

        {/* Smooth SVG Wave Sparkline with Gradient Area */}
        <div className="w-18 h-7 shrink-0 overflow-visible -mb-1 -mr-1">
          <svg className="w-full h-full" viewBox="0 0 100 45" fill="none">
            <defs>
              <linearGradient id={config.gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={config.stopColor} stopOpacity="0.32" />
                <stop offset="100%" stopColor={config.stopColor} stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path
              d="M0,35 C20,38 35,20 50,28 C65,36 80,10 100,15 L100,45 L0,45 Z"
              fill={`url(#${config.gradId})`}
            />
            <path
              d="M0,35 C20,38 35,20 50,28 C65,36 80,10 100,15"
              stroke={config.stroke}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </article>
  );
}
