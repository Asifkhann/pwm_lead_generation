import { Router } from 'express'
import { deleteNote, updateNote } from '../controllers/note.controller.js'

const router = Router()

router.route('/:id').put(updateNote).delete(deleteNote)

export default router
