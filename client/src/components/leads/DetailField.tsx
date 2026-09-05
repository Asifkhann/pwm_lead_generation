import type { ReactNode } from 'react'

interface DetailFieldProps {
  label: string
  value?: string | null
  children?: ReactNode
  fullWidth?: boolean
}

/** One label/value pair inside a detail card. */
export default function DetailField({ label, value, children, fullWidth }: DetailFieldProps) {
  const hasValue = children ?? (value && value.trim() ? value : null)

  return (
    <div className={fullWidth ? 'sm:col-span-2' : undefined}>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900">
        {hasValue ?? <span className="text-slate-400">—</span>}
      </dd>
    </div>
  )
}
