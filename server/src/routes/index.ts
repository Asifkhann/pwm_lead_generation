import { Router } from 'express'
import healthRoutes from './health.routes.js'
import authRoutes from './auth.routes.js'
import userRoutes from './user.routes.js'
import settingsRoutes from './settings.routes.js'
import leadRoutes from './lead.routes.js'
import communicationRoutes from './communication.routes.js'
import noteRoutes from './note.routes.js'
import followUpRoutes from './followUp.routes.js'
import dashboardRoutes from './dashboard.routes.js'
import activityRoutes from './activity.routes.js'
import reportRoutes from './report.routes.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// Public: health and signing in.
router.use('/health', healthRoutes)
router.use('/auth', authRoutes)
// Settings are readable publicly (organisation name only); writing needs admin.
router.use('/settings', settingsRoutes)

// Everything below needs a signed-in user.
router.use(requireAuth)

router.use('/users', userRoutes)
router.use('/leads', leadRoutes)
router.use('/communications', communicationRoutes)
router.use('/notes', noteRoutes)
router.use('/follow-ups', followUpRoutes)
router.use('/dashboard', dashboardRoutes)
router.use('/activity', activityRoutes)
router.use('/reports', reportRoutes)

export default router
