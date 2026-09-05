import { SettingsModel, type Settings } from '../models/Settings.js'

/** Returns the single settings document, creating it with defaults if absent. */
export async function getSettings() {
  const existing = await SettingsModel.findOne({ key: 'workspace' })
  if (existing) return existing

  // upsert:true so two simultaneous first requests cannot create two documents.
  return SettingsModel.findOneAndUpdate(
    { key: 'workspace' },
    { $setOnInsert: { key: 'workspace' } },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
  )
}

export async function updateSettings(payload: Partial<Settings>) {
  const settings = await getSettings()
  settings.set(payload)
  await settings.save()
  return settings
}
