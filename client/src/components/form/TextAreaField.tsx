import FieldWrapper from './FieldWrapper'
import { controlClass } from './controlClass'

interface TextAreaFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  error?: string
  hint?: string
  rows?: number
}

export default function TextAreaField({
  id,
  label,
  value,
  onChange,
  placeholder,
  error,
  hint,
  rows = 3,
}: TextAreaFieldProps) {
  return (
    <FieldWrapper id={id} label={label} error={error} hint={hint} fullWidth>
      <textarea
        id={id}
        name={id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={`${controlClass(Boolean(error))} resize-y`}
      />
    </FieldWrapper>
  )
}
