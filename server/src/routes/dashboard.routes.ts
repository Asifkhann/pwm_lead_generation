import { Router } from 'express'
import { getDashboard } from '../controllers/dashboard.controller.js'

import { requirePermission } from '../middleware/auth.js'

const router = Router()

router.use(requirePermission('reports:read'))

router.get('/', getDashboard)

export default router
