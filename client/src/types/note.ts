export interface Note {
  id: string
  lead: string
  body: string
  /** Null for notes imported from the old single-field format. */
  createdBy: { id: string; name: string } | null
  createdAt: string
  updatedAt: string
}
