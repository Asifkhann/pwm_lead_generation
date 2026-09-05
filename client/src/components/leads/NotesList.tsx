import { useState } from 'react'
import type { Note } from '../../types/note'
import { formatDateTime } from '../../utils/format'
import { controlClass } from '../form/controlClass'

interface NotesListProps {
  notes: Note[]
  currentUserId: string | null
  canModerate: boolean
  isWorking: boolean
  onUpdate: (id: string, body: string) => void
  onDelete: (note: Note) => void
}

export default function NotesList({
  notes,
  currentUserId,
  canModerate,
  isWorking,
  onUpdate,
  onDelete,
}: NotesListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  /** You may change your own notes; an admin may change anyone's. */
  const mayEdit = (note: Note) =>
    canModerate || (note.createdBy !== null && note.createdBy.id === currentUserId)

  return (
    <ul className="space-y-3">
      {notes.map((note) => {
        const isEditing = editingId === note.id

        return (
          <li key={note.id} className="rounded-lg border border-slate-200 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-slate-500">
                <span className="font-medium text-slate-700">
                  {note.createdBy?.name ?? 'Unknown'}
                </span>
                {' · '}
                {formatDateTime(note.createdAt)}
                {note.updatedAt !== note.createdAt && (
                  <span className="text-slate-400"> · edited</span>
                )}
              </p>

              {mayEdit(note) && !isEditing && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(note.id)
                      setDraft(note.body)
                    }}
                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={isWorking}
                    onClick={() => onDelete(note)}
                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="mt-2">
                <textarea
                  rows={3}
                  autoFocus
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  className={`resize-y ${controlClass()}`}
                />
                <div className="mt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isWorking || !draft.trim()}
                    onClick={() => {
                      onUpdate(note.id, draft.trim())
                      setEditingId(null)
                    }}
                    className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-1.5 text-sm whitespace-pre-line text-slate-700">{note.body}</p>
            )}
          </li>
        )
      })}
    </ul>
  )
}
