import { Router } from 'express'
import { getActivity } from '../controllers/activity.controller.js'

import { requirePermission } from '../middleware/auth.js'

const router = Router()

router.use(requirePermission('reports:read'))

router.get('/', getActivity)

export default router
