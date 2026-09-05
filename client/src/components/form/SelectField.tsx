import FieldWrapper from './FieldWrapper'
import { controlClass } from './controlClass'

interface SelectFieldProps {
  id: string
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
  error?: string
  hint?: string
  required?: boolean
  fullWidth?: boolean
}

export default function SelectField({
  id,
  label,
  value,
  options,
  onChange,
  error,
  hint,
  required,
  fullWidth,
}: SelectFieldProps) {
  return (
    <FieldWrapper
      id={id}
      label={label}
      error={error}
      hint={hint}
      required={required}
      fullWidth={fullWidth}
    >
      <select
        id={id}
        name={id}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={`${controlClass(Boolean(error))} bg-white`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  )
}
