import type { ReactNode } from 'react'

interface FormSectionProps {
  title: string
  description?: string
  children: ReactNode
}

/** One titled block of the lead form, with its fields in a responsive grid. */
export default function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <section className="border-b border-slate-200 px-4 py-5 last:border-0 sm:px-6">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </section>
  )
}
