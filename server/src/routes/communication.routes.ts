import { Router } from 'express'
import {
  deleteCommunication,
  updateCommunication,
} from '../controllers/communication.controller.js'
import { requirePermission } from '../middleware/auth.js'

const router = Router()

router.use(requirePermission('communications:write'))

router.route('/:id').put(updateCommunication).delete(deleteCommunication)

export default router
