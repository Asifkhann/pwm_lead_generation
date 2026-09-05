import { useState } from 'react'
import Modal from '../Modal'
import { controlClass } from '../form/controlClass'
import { fromDateInputValue, todayInputValue } from '../../utils/format'
import type { FollowUpPayload } from '../../types/followUp'
import type { Lead } from '../../types/lead'
import LeadPicker from './LeadPicker'

interface FollowUpDialogProps {
  isOpen: boolean
  isSaving: boolean
  title: string
  initialDate: string
  initialNote: string
  error?: string
  /** When set, the dialog also asks which lead the follow-up is for. */
  withLeadPicker?: boolean
  onClose: () => void
  onSave: (payload: FollowUpPayload, lead: Lead | null) => void
}

/** Used for both scheduling a new follow-up and rescheduling an existing one. */
export default function FollowUpDialog({
  isOpen,
  isSaving,
  title,
  initialDate,
  initialNote,
  error,
  withLeadPicker,
  onClose,
  onSave,
}: FollowUpDialogProps) {
  const [date, setDate] = useState(initialDate || todayInputValue())
  const [note, setNote] = useState(initialNote)
  const [lead, setLead] = useState<Lead | null>(null)
  const [dateError, setDateError] = useState<string>()
  const [leadError, setLeadError] = useState<string>()

  const handleSave = () => {
    if (withLeadPicker && !lead) {
      setLeadError('Choose the lead this follow-up is for')
      return
    }
    if (!date) {
      setDateError('A due date is required')
      return
    }
    setDateError(undefined)
    setLeadError(undefined)
    onSave({ dueDate: fromDateInputValue(date), note: note.trim() }, lead)
  }

  return (
    <Modal
      title={title}
      description="When should this lead be contacted, and what for?"
      isOpen={isOpen}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {withLeadPicker && (
          <div>
            <label htmlFor="followUpLead" className="block text-xs font-medium text-slate-700">
              Lead <span className="text-rose-600">*</span>
            </label>
            <div className="mt-1.5">
              <LeadPicker
                selected={lead}
                error={leadError}
                onSelect={(next) => {
                  setLead(next)
                  if (next) setLeadError(undefined)
                }}
              />
            </div>
          </div>
        )}

        <div>
          <label htmlFor="followUpDue" className="block text-xs font-medium text-slate-700">
            Due date <span className="text-rose-600">*</span>
          </label>
          <input
            id="followUpDue"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className={`mt-1.5 ${controlClass(Boolean(dateError))}`}
          />
          {dateError && <p className="mt-1 text-xs text-rose-600">{dateError}</p>}
        </div>

        <div>
          <label htmlFor="followUpNote" className="block text-xs font-medium text-slate-700">
            What needs doing?
          </label>
          <textarea
            id="followUpNote"
            rows={3}
            value={note}
            placeholder="Send the proposal with two pricing tiers"
            onChange={(event) => setNote(event.target.value)}
            className={`mt-1.5 resize-y ${controlClass()}`}
          />
        </div>

        {error && <p className="text-xs text-rose-600">{error}</p>}
      </div>
    </Modal>
  )
}
