import {
  LEAD_PRIORITY_CLASSES,
  LEAD_PRIORITY_LABELS,
  LEAD_STATUS_CLASSES,
  LEAD_STATUS_LABELS,
  type LeadPriority,
  type LeadStatus,
} from '../constants/lead'

const base =
  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap'

export function StatusBadge({ status }: { status: LeadStatus }) {
  return <span className={`${base} ${LEAD_STATUS_CLASSES[status]}`}>{LEAD_STATUS_LABELS[status]}</span>
}

export function PriorityBadge({ priority }: { priority: LeadPriority }) {
  return (
    <span className={`${base} ${LEAD_PRIORITY_CLASSES[priority]}`}>
      {LEAD_PRIORITY_LABELS[priority]}
    </span>
  )
}
