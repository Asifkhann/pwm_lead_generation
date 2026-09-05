import FieldWrapper from './FieldWrapper'
import { controlClass } from './controlClass'

interface TextFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'email' | 'tel' | 'url'
  placeholder?: string
  error?: string
  hint?: string
  required?: boolean
  fullWidth?: boolean
}

export default function TextField({
  id,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  error,
  hint,
  required,
  fullWidth,
}: TextFieldProps) {
  return (
    <FieldWrapper
      id={id}
      label={label}
      error={error}
      hint={hint}
      required={required}
      fullWidth={fullWidth}
    >
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={controlClass(Boolean(error))}
      />
    </FieldWrapper>
  )
}
