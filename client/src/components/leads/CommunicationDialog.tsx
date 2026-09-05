import { useState } from 'react'
import {
  COMMUNICATION_OUTCOMES,
  COMMUNICATION_OUTCOME_LABELS,
  COMMUNICATION_TYPES,
  COMMUNICATION_TYPE_LABELS,
  type CommunicationOutcome,
  type CommunicationType,
} from '../../constants/communication'
import type { CommunicationFormValues, CommunicationPayload } from '../../types/communication'
import { fromDateTimeInputs, fromDateInputValue } from '../../utils/format'
import Modal from '../Modal'
import TagInput from '../form/TagInput'
import { controlClass } from '../form/controlClass'

interface CommunicationDialogProps {
  isOpen: boolean
  isSaving: boolean
  title: string
  initialValues: CommunicationFormValues
  error?: string
  onClose: () => void
  onSave: (payload: CommunicationPayload) => void
}

const labelClass = 'block text-xs font-medium text-slate-700'

export default function CommunicationDialog({
  isOpen,
  isSaving,
  title,
  initialValues,
  error,
  onClose,
  onSave,
}: CommunicationDialogProps) {
  const [values, setValues] = useState<CommunicationFormValues>(initialValues)
  const [dateError, setDateError] = useState<string>()

  const setField = <K extends keyof CommunicationFormValues>(
    key: K,
    value: CommunicationFormValues[K],
  ) => setValues((current) => ({ ...current, [key]: value }))

  const handleSave = () => {
    if (!values.date) {
      setDateError('A date is required')
      return
    }
    setDateError(undefined)

    onSave({
      occurredAt: fromDateTimeInputs(values.date, values.time),
      type: values.type,
      contactPerson: values.contactPerson.trim(),
      outcome: values.outcome,
      discussionNotes: values.discussionNotes.trim(),
      clientRequirements: values.clientRequirements.trim(),
      clientConcerns: values.clientConcerns.trim(),
      servicesDiscussed: values.servicesDiscussed,
      nextAction: values.nextAction.trim(),
      followUpDate: values.followUpDate ? fromDateInputValue(values.followUpDate) : null,
    })
  }

  return (
    <Modal
      title={title}
      description="Record what was discussed and what happens next."
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
      <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="commDate" className={labelClass}>
              Date <span className="text-rose-600">*</span>
            </label>
            <input
              id="commDate"
              type="date"
              value={values.date}
              onChange={(event) => setField('date', event.target.value)}
              className={`mt-1.5 ${controlClass(Boolean(dateError))}`}
            />
            {dateError && <p className="mt-1 text-xs text-rose-600">{dateError}</p>}
          </div>
          <div>
            <label htmlFor="commTime" className={labelClass}>
              Time
            </label>
            <input
              id="commTime"
              type="time"
              value={values.time}
              onChange={(event) => setField('time', event.target.value)}
              className={`mt-1.5 ${controlClass()}`}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="commType" className={labelClass}>
              Type
            </label>
            <select
              id="commType"
              value={values.type}
              onChange={(event) => setField('type', event.target.value as CommunicationType)}
              className={`mt-1.5 bg-white ${controlClass()}`}
            >
              {COMMUNICATION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {COMMUNICATION_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="commOutcome" className={labelClass}>
              Outcome
            </label>
            <select
              id="commOutcome"
              value={values.outcome}
              onChange={(event) => setField('outcome', event.target.value as CommunicationOutcome)}
              className={`mt-1.5 bg-white ${controlClass()}`}
            >
              {COMMUNICATION_OUTCOMES.map((outcome) => (
                <option key={outcome} value={outcome}>
                  {COMMUNICATION_OUTCOME_LABELS[outcome]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="commContact" className={labelClass}>
            Contact person
          </label>
          <input
            id="commContact"
            type="text"
            value={values.contactPerson}
            placeholder="Who did you speak to?"
            onChange={(event) => setField('contactPerson', event.target.value)}
            className={`mt-1.5 ${controlClass()}`}
          />
        </div>

        <div>
          <label htmlFor="commNotes" className={labelClass}>
            Discussion notes
          </label>
          <textarea
            id="commNotes"
            rows={3}
            value={values.discussionNotes}
            placeholder="What was discussed…"
            onChange={(event) => setField('discussionNotes', event.target.value)}
            className={`mt-1.5 resize-y ${controlClass()}`}
          />
        </div>

        <div>
          <label htmlFor="commRequirements" className={labelClass}>
            Client requirements
          </label>
          <textarea
            id="commRequirements"
            rows={2}
            value={values.clientRequirements}
            placeholder="What the client asked for…"
            onChange={(event) => setField('clientRequirements', event.target.value)}
            className={`mt-1.5 resize-y ${controlClass()}`}
          />
        </div>

        <div>
          <label htmlFor="commConcerns" className={labelClass}>
            Client concerns
          </label>
          <textarea
            id="commConcerns"
            rows={2}
            value={values.clientConcerns}
            placeholder="Objections, budget worries, hesitations…"
            onChange={(event) => setField('clientConcerns', event.target.value)}
            className={`mt-1.5 resize-y ${controlClass()}`}
          />
        </div>

        <TagInput
          id="servicesDiscussed"
          label="Services discussed"
          values={values.servicesDiscussed}
          onChange={(value) => setField('servicesDiscussed', value)}
          placeholder="Website Development"
        />

        <div>
          <label htmlFor="commNextAction" className={labelClass}>
            Next action
          </label>
          <input
            id="commNextAction"
            type="text"
            value={values.nextAction}
            placeholder="Send proposal with pricing"
            onChange={(event) => setField('nextAction', event.target.value)}
            className={`mt-1.5 ${controlClass()}`}
          />
        </div>

        <div>
          <label htmlFor="commFollowUp" className={labelClass}>
            Follow-up date
          </label>
          <input
            id="commFollowUp"
            type="date"
            value={values.followUpDate}
            onChange={(event) => setField('followUpDate', event.target.value)}
            className={`mt-1.5 ${controlClass()}`}
          />
          <p className="mt-1 text-xs text-slate-500">
            Setting this also schedules the lead's next follow-up.
          </p>
        </div>

        {error && <p className="text-xs text-rose-600">{error}</p>}
      </div>
    </Modal>
  )
}
