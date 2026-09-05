import { useQuery } from '@tanstack/react-query'
import { fetchSettings } from '../api/settings'
import { DEFAULT_CURRENCY } from '../constants/currency'
import type { Settings } from '../types/settings'

/** Values used until the real settings arrive, so nothing renders blank. */
const FALLBACK: Settings = {
  organisationName: 'Perfect Web Metrix',
  defaultCurrency: DEFAULT_CURRENCY,
  upcomingFollowUpDays: 30,
  leadsPerPage: 20,
  createdAt: '',
  updatedAt: '',
}

/**
 * Workspace settings. Shared across the app and rarely change, so they are
 * cached for a long time rather than refetched per page.
 */
export function useSettings() {
  const query = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
    staleTime: 10 * 60_000,
  })

  return { settings: query.data ?? FALLBACK, isLoaded: query.isSuccess }
}
