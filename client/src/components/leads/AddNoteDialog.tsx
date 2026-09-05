import { useState } from 'react'
import Modal from '../Modal'

interface AddNoteDialogProps {
  isOpen: boolean
  isSaving: boolean
  error?: string
  onClose: () => void
  onSave: (note: string) => void
}

export default function AddNoteDialog({
  isOpen,
  isSaving,
  error,
  onClose,
  onSave,
}: AddNoteDialogProps) {
  const [note, setNote] = useState('')

  const handleSave = () => {
    const trimmed = note.trim()
    if (!trimmed) return
    onSave(trimmed)
    setNote('')
  }

  const handleClose = () => {
    setNote('')
    onClose()
  }

  return (
    <Modal
      title="Add note"
      description="Dated and added above the existing notes."
      isOpen={isOpen}
      onClose={handleClose}
      footer={
        <>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSaving}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !note.trim()}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {isSaving ? 'Saving…' : 'Add note'}
          </button>
        </>
      }
    >
      <textarea
        autoFocus
        rows={5}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="What happened, what was agreed, what to do next…"
        className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
      />
      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
    </Modal>
  )
}
