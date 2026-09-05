interface Option {
  value: string
  label: string
}

interface SelectProps {
  label: string
  value: string
  options: Option[]
  placeholder: string
  onChange: (value: string) => void
  disabled?: boolean
}

/** Compact labelled dropdown used by the leads filter bar. */
export default function Select({
  label,
  value,
  options,
  placeholder,
  onChange,
  disabled,
}: SelectProps) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
