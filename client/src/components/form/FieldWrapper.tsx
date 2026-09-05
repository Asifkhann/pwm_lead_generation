import type { ReactNode } from 'react'

interface FieldWrapperProps {
  id: string
  label: string
  error?: string
  hint?: string
  required?: boolean
  fullWidth?: boolean
  children: ReactNode
}

/** Shared label / hint / error scaffolding for every form control. */
export default function FieldWrapper({
  id,
  label,
  error,
  hint,
  required,
  fullWidth,
  children,
}: FieldWrapperProps) {
  return (
    <div className={fullWidth ? 'sm:col-span-2' : undefined}>
      <label htmlFor={id} className="block text-xs font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-rose-600">*</span>}
      </label>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-rose-600">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1 text-xs text-slate-500">
            {hint}
          </p>
        )
      )}
    </div>
  )
}

