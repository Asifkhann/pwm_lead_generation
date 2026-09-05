import { useMemo, useState } from 'react'
import {
  rangeFromInputs,
  resolvePreset,
  type DateRange,
  type RangePreset,
} from '../utils/dateRanges'
import { todayInputValue } from '../utils/format'

/** Shared state for the date range picker used by activity and reports. */
export function useDateRange(initialPreset: Exclude<RangePreset, 'custom'>) {
  const [preset, setPreset] = useState<RangePreset>(initialPreset)
  const [customFrom, setCustomFrom] = useState(todayInputValue())
  const [customTo, setCustomTo] = useState(todayInputValue())

  const range = useMemo<DateRange | null>(
    () => (preset === 'custom' ? rangeFromInputs(customFrom, customTo) : resolvePreset(preset)),
    [preset, customFrom, customTo],
  )

  return {
    preset,
    setPreset,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
    range,
  }
}
