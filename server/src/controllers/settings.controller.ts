import type { Request, Response } from 'express'
import * as settingsService from '../services/settings.service.js'
import { pickSettingsFields } from '../validators/settings.validator.js'
import { sendSuccess } from '../utils/apiResponse.js'

export async function getSettings(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, await settingsService.getSettings())
}

export async function updateSettings(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await settingsService.updateSettings(pickSettingsFields(req.body)))
}
