type Tone = 'amber' | 'sky' | 'slate'

const toneClasses: Record<Tone, string> = {
  amber: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  sky: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  slate: 'bg-slate-100 text-slate-700 ring-slate-500/20',
}

interface TagGroupProps {
  values: string[]
  tone?: Tone
  emptyText: string
}

export default function TagGroup({ values, tone = 'slate', emptyText }: TagGroupProps) {
  if (values.length === 0) return <p className="text-sm text-slate-400">{emptyText}</p>

  return (
    <ul className="flex flex-wrap gap-1.5">
      {values.map((value) => (
        <li
          key={value}
          className={`rounded-full px-2.5 py-1 text-xs ring-1 ring-inset ${toneClasses[tone]}`}
        >
          {value}
        </li>
      ))}
    </ul>
  )
}
