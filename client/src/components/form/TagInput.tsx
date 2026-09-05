import { useState, type KeyboardEvent } from 'react'
import FieldWrapper from './FieldWrapper'
import { controlClass } from './controlClass'
import { CloseIcon } from '../Icons'

interface TagInputProps {
  id: string
  label: string
  values: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  hint?: string
  error?: string
}

/** Chip input for the list fields: services, problems and opportunities. */
export default function TagInput({
  id,
  label,
  values,
  onChange,
  placeholder,
  hint,
  error,
}: TagInputProps) {
  const [draft, setDraft] = useState('')

  const addTag = () => {
    const tag = draft.trim()
    if (!tag) return
    // Case-insensitive duplicate check so "SEO" and "seo" are not both added.
    if (!values.some((value) => value.toLowerCase() === tag.toLowerCase())) {
      onChange([...values, tag])
    }
    setDraft('')
  }

  const removeTag = (index: number) => {
    onChange(values.filter((_, i) => i !== index))
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      // Enter must not submit the form while the user is adding tags.
      event.preventDefault()
      addTag()
    } else if (event.key === 'Backspace' && draft === '' && values.length > 0) {
      removeTag(values.length - 1)
    }
  }

  return (
    <FieldWrapper
      id={id}
      label={label}
      error={error}
      hint={hint ?? 'Press Enter or comma to add'}
      fullWidth
    >
      {values.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-1.5">
          {values.map((value, index) => (
            <li
              key={value}
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 py-1 pr-1 pl-2.5 text-xs text-slate-700"
            >
              {value}
              <button
                type="button"
                onClick={() => removeTag(index)}
                aria-label={`Remove ${value}`}
                className="rounded-full p-0.5 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
              >
                <CloseIcon className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <input
        id={id}
        type="text"
        value={draft}
        placeholder={placeholder}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        // Keep whatever the user typed but did not confirm.
        onBlur={addTag}
        aria-describedby={error ? `${id}-error` : `${id}-hint`}
        className={controlClass(Boolean(error))}
      />
    </FieldWrapper>
  )
}
