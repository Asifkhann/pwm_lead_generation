import { Router } from 'express'
import { getSettings, updateSettings } from '../controllers/settings.controller.js'
import { requireAuth, requirePermission } from '../middleware/auth.js'

const router = Router()

// Readable without signing in so the login page can show the right name.
router.get('/', getSettings)
router.put('/', requireAuth, requirePermission('settings:manage'), updateSettings)

export default router
