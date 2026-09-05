import { ApiError } from './ApiError.js'

/** Helpers for reading and validating Express query parameters. */

/** Returns a trimmed string, or undefined when the parameter is absent/blank. */
export function getString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

/** Returns the value only when it is one of the allowed options. */
export function getEnum<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  const raw = getString(value)
  return raw !== undefined && (allowed as readonly string[]).includes(raw) ? (raw as T) : undefined
}

/** Returns a positive integer clamped between min and max. */
export function getInt(value: unknown, fallback: number, min: number, max: number): number {
  const raw = getString(value)
  const parsed = raw === undefined ? Number.NaN : Number.parseInt(raw, 10)
  if (Number.isNaN(parsed)) return fallback
  return Math.min(Math.max(parsed, min), max)
}

/** Express 5 types route params as string | string[]; leads only use single values. */
export function getRouteParam(value: unknown, name: string): string {
  const param = getString(value)
  if (param === undefined) throw ApiError.badRequest(`Missing route parameter "${name}"`)
  return param
}
