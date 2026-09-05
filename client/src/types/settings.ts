import type { Currency } from '../constants/currency'

export interface Settings {
  organisationName: string
  defaultCurrency: Currency
  upcomingFollowUpDays: number
  leadsPerPage: number
  createdAt: string
  updatedAt: string
}

export type SettingsPayload = Partial<
  Pick<Settings, 'organisationName' | 'defaultCurrency' | 'upcomingFollowUpDays' | 'leadsPerPage'>
>
