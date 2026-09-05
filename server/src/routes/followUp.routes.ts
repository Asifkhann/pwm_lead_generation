import { Router } from 'express'
import {
  completeFollowUp,
  deleteFollowUp,
  getPendingFollowUps,
  reopenFollowUp,
  updateFollowUp,
} from '../controllers/followUp.controller.js'
import { requirePermission } from '../middleware/auth.js'

const router = Router()

router.get('/', getPendingFollowUps)

router.use(requirePermission('followups:write'))

router.route('/:id').put(updateFollowUp).delete(deleteFollowUp)
router.post('/:id/complete', completeFollowUp)
router.post('/:id/reopen', reopenFollowUp)

export default router
