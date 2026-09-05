import { Router } from 'express'
import {
  createUser,
  deleteUser,
  listUsers,
  updateUser,
} from '../controllers/user.controller.js'
import { requireAuth, requirePermission } from '../middleware/auth.js'

const router = Router()

// Everything here is admin-only.
router.use(requireAuth, requirePermission('users:manage'))

router.route('/').get(listUsers).post(createUser)
router.route('/:id').put(updateUser).delete(deleteUser)

export default router
