import type { DateRange, RangePreset } from '../utils/dateRanges'
import { RANGE_PRESET_LABELS, describeRange } from '../utils/dateRanges'
import { controlClass } from './form/controlClass'

interface DateRangePickerProps {
  presets: RangePreset[]
  preset: RangePreset
  onPresetChange: (preset: RangePreset) => void
  customFrom: string
  customTo: string
  onCustomFromChange: (value: string) => void
  onCustomToChange: (value: string) => void
  /** Null when the custom dates are incomplete or reversed. */
  range: DateRange | null
}

/** One filter row that scopes everything below it. */
export default function DateRangePicker({
  presets,
  preset,
  onPresetChange,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
  range,
}: DateRangePickerProps) {
  const buttonClass = (option: RangePreset) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium ${
      preset === option
        ? 'bg-slate-900 text-white'
        : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
    }`

  return (
    <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap gap-1.5">
        {[...presets, 'custom' as const].map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onPresetChange(option)}
            aria-pressed={preset === option}
            className={buttonClass(option)}
          >
            {RANGE_PRESET_LABELS[option]}
          </button>
        ))}
      </div>

      {preset === 'custom' && (
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500">From</span>
            <input
              type="date"
              value={customFrom}
              max={customTo}
              onChange={(event) => onCustomFromChange(event.target.value)}
              className={controlClass()}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500">To</span>
            <input
              type="date"
              value={customTo}
              min={customFrom}
              onChange={(event) => onCustomToChange(event.target.value)}
              className={controlClass()}
            />
          </label>
        </div>
      )}

      {range && <p className="ml-auto text-sm text-slate-500">{describeRange(range)}</p>}
    </div>
  )
}
