import type { CommunicationOutcome, CommunicationType } from '../constants/communication'

export interface Communication {
  id: string
  lead: string
  /** Who logged it. Null for entries made before this was recorded. */
  createdBy: { id: string; name: string } | null
  occurredAt: string
  type: CommunicationType
  contactPerson: string
  outcome: CommunicationOutcome
  discussionNotes: string
  clientRequirements: string
  clientConcerns: string
  servicesDiscussed: string[]
  nextAction: string
  followUpDate: string | null
  createdAt: string
  updatedAt: string
}

/** What the add/edit dialog holds; date and time are separate inputs. */
export interface CommunicationFormValues {
  date: string
  time: string
  type: CommunicationType
  contactPerson: string
  outcome: CommunicationOutcome
  discussionNotes: string
  clientRequirements: string
  clientConcerns: string
  servicesDiscussed: string[]
  nextAction: string
  followUpDate: string
}

/** Body sent to the API. */
export interface CommunicationPayload {
  occurredAt: string
  type: CommunicationType
  contactPerson: string
  outcome: CommunicationOutcome
  discussionNotes: string
  clientRequirements: string
  clientConcerns: string
  servicesDiscussed: string[]
  nextAction: string
  followUpDate: string | null
}
