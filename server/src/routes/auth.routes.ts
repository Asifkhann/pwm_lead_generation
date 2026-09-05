import { Router } from 'express'
import { changePassword, login, logout, me } from '../controllers/auth.controller.js'
import { requireAuth } from '../middleware/auth.js'
import { rateLimit } from '../middleware/rateLimit.js'

const router = Router()

const loginLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 20,
  message: 'Too many sign-in attempts. Try again in a few minutes.',
})

router.post('/login', loginLimiter, login)
router.post('/logout', logout)
router.get('/me', requireAuth, me)
router.post('/change-password', requireAuth, changePassword)

export default router
