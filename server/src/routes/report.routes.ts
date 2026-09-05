import { Router } from 'express'
import { getReportSummary } from '../controllers/report.controller.js'

import { requirePermission } from '../middleware/auth.js'

const router = Router()

router.use(requirePermission('reports:read'))

router.get('/', getReportSummary)

export default router
