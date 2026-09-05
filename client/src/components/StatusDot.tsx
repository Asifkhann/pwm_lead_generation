type Tone = 'success' | 'warning' | 'danger' | 'neutral'

const toneClasses: Record<Tone, string> = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  neutral: 'bg-slate-400',
}

export default function StatusDot({ tone, label }: { tone: Tone; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-slate-700">
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${toneClasses[tone]}`} aria-hidden="true" />
      {label}
    </span>
  )
}
