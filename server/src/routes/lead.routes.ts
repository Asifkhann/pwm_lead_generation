import { Router } from 'express'
import {
  createLead,
  deleteLead,
  checkDuplicates,
  getFilterOptions,
  getLead,
  listLeads,
  updateLead,
} from '../controllers/lead.controller.js'
import {
  createCommunication,
  listCommunications,
} from '../controllers/communication.controller.js'
import {
  createFollowUp,
  listFollowUpsForLead,
} from '../controllers/followUp.controller.js'
import { createNote, listNotes } from '../controllers/note.controller.js'
import { requirePermission } from '../middleware/auth.js'

const router = Router()

router.route('/').get(listLeads).post(requirePermission('leads:write'), createLead)
// Declared before "/:id" so "filter-options" is not treated as a lead id.
router.get('/filter-options', getFilterOptions)
router.get('/check-duplicates', checkDuplicates)
router
  .route('/:id')
  .get(getLead)
  .put(requirePermission('leads:write'), updateLead)
  .delete(requirePermission('leads:delete'), deleteLead)
router
  .route('/:id/communications')
  .get(listCommunications)
  .post(requirePermission('communications:write'), createCommunication)
router
  .route('/:id/notes')
  .get(listNotes)
  .post(requirePermission('leads:write'), createNote)
router
  .route('/:id/follow-ups')
  .get(listFollowUpsForLead)
  .post(requirePermission('followups:write'), createFollowUp)

export default router
