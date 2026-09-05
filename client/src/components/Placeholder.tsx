import type { ComponentType, ReactNode, SVGProps } from 'react'

interface PlaceholderProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  title: string
  description: string
  children?: ReactNode
}

/** Centred panel used while a feature is not built yet, and later for empty states. */
export default function Placeholder({ icon: Icon, title, description, children }: PlaceholderProps) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{description}</p>
      {children && <div className="mt-5">{children}</div>}
    </div>
  )
}
