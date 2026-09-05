import type { ComponentType, SVGProps } from 'react'
import {
  COMMUNICATION_OUTCOME_CLASSES,
  COMMUNICATION_OUTCOME_LABELS,
  COMMUNICATION_TYPE_LABELS,
  type CommunicationType,
} from '../../constants/communication'
import type { Communication } from '../../types/communication'
import { formatDate, formatDateTime } from '../../utils/format'
import {
  DotsIcon,
  EmailIcon,
  FollowUpsIcon,
  MeetingIcon,
  PhoneIcon,
  TrashIcon,
  WhatsAppIcon,
} from '../Icons'

const TYPE_ICONS: Record<CommunicationType, ComponentType<SVGProps<SVGSVGElement>>> = {
  phone: PhoneIcon,
  whatsapp: WhatsAppIcon,
  email: EmailIcon,
  meeting: MeetingIcon,
  other: DotsIcon,
}

interface CommunicationTimelineProps {
  communications: Communication[]
  onEdit: (communication: Communication) => void
  onDelete: (communication: Communication) => void
}

function Detail({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null
  return (
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm whitespace-pre-line text-slate-700">{value}</p>
    </div>
  )
}

export default function CommunicationTimeline({
  communications,
  onEdit,
  onDelete,
}: CommunicationTimelineProps) {
  return (
    <ol className="relative space-y-6">
      {communications.map((communication, index) => {
        const TypeIcon = TYPE_ICONS[communication.type]
        const isLast = index === communications.length - 1

        return (
          <li key={communication.id} className="relative pl-11">
            {/* Connecting line between entries. */}
            {!isLast && (
              <span
                className="absolute top-9 left-[15px] h-[calc(100%+0.75rem)] w-px bg-slate-200"
                aria-hidden="true"
              />
            )}
            <span className="absolute top-0 left-0 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500">
              <TypeIcon className="h-4 w-4" />
            </span>

            <div className="rounded-lg border border-slate-200 bg-white">
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900">
                    {COMMUNICATION_TYPE_LABELS[communication.type]}
                    {communication.contactPerson && (
                      <span className="font-normal text-slate-500">
                        {' '}
                        with {communication.contactPerson}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatDateTime(communication.occurredAt)}
                    {communication.createdBy && (
                      <span> · logged by {communication.createdBy.name}</span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                      COMMUNICATION_OUTCOME_CLASSES[communication.outcome]
                    }`}
                  >
                    {COMMUNICATION_OUTCOME_LABELS[communication.outcome]}
                  </span>
                  <button
                    type="button"
                    onClick={() => onEdit(communication)}
                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(communication)}
                    aria-label="Delete communication"
                    className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 px-4 py-3">
                <Detail label="Discussion" value={communication.discussionNotes} />
                <Detail label="Client requirements" value={communication.clientRequirements} />
                <Detail label="Client concerns" value={communication.clientConcerns} />

                {communication.servicesDiscussed.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-500">Services discussed</p>
                    <ul className="mt-1.5 flex flex-wrap gap-1.5">
                      {communication.servicesDiscussed.map((service) => (
                        <li
                          key={service}
                          className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700 ring-1 ring-slate-500/20 ring-inset"
                        >
                          {service}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {(communication.nextAction || communication.followUpDate) && (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 pt-3">
                    {communication.nextAction && (
                      <p className="text-sm text-slate-700">
                        <span className="text-xs font-medium text-slate-500">Next action: </span>
                        {communication.nextAction}
                      </p>
                    )}
                    {communication.followUpDate && (
                      <p className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                        <FollowUpsIcon className="h-3.5 w-3.5" />
                        Follow up {formatDate(communication.followUpDate)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
