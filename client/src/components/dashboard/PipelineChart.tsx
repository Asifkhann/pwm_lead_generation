import { LEAD_STATUSES, LEAD_STATUS_LABELS } from '../../constants/lead'
import type { LeadStatus } from '../../constants/lead'
import BarList from './BarList'

interface PipelineChartProps {
  counts: Record<LeadStatus, number>
}

/** How many leads sit at each stage; each row links to that filtered list. */
export default function PipelineChart({ counts }: PipelineChartProps) {
  return (
    <BarList
      emptyText="No leads to show yet."
      rows={LEAD_STATUSES.map((status) => ({
        key: status,
        label: LEAD_STATUS_LABELS[status],
        value: counts[status],
        to: `/leads?status=${status}`,
      }))}
    />
  )
}
