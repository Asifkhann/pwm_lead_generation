import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { fetchActivity } from '../api/activity'
import { getApiErrorMessage } from '../api/client'
import {
  COMMUNICATION_TYPES,
  COMMUNICATION_TYPE_LABELS,
} from '../constants/communication'
import type { RangePreset } from '../utils/dateRanges'
import { useDateRange } from '../hooks/useDateRange'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import DateRangePicker from '../components/DateRangePicker'
import StatTile from '../components/dashboard/StatTile'
import ActivityDayTable from '../components/activity/ActivityDayTable'

const PRESETS: RangePreset[] = ['today', 'yesterday', 'this_week', 'last_week', 'this_month']

export default function ActivityPage() {
  const { preset, setPreset, customFrom, setCustomFrom, customTo, setCustomTo, range } =
    useDateRange('today')

  const activityQuery = useQuery({
    queryKey: ['activity', range?.from.toISOString(), range?.to.toISOString()],
    queryFn: () => fetchActivity(range!.from.toISOString(), range!.to.toISOString()),
    enabled: range !== null,
    placeholderData: keepPreviousData,
  })

  const data = activityQuery.data

  return (
    <>
      <PageHeader
        title="Daily activity"
        description="What the team got done over a chosen period."
      />

      <DateRangePicker
        presets={PRESETS}
        preset={preset}
        onPresetChange={setPreset}
        customFrom={customFrom}
        customTo={customTo}
        onCustomFromChange={setCustomFrom}
        onCustomToChange={setCustomTo}
        range={range}
      />

      {range === null && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Choose a start and end date. The end date must not be before the start.
        </p>
      )}

      {activityQuery.isPending && range !== null && (
        <div className="space-y-6" aria-busy="true">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
        </div>
      )}

      {activityQuery.isError && (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Could not load activity</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            {getApiErrorMessage(activityQuery.error)}
          </p>
          <button
            type="button"
            onClick={() => void activityQuery.refetch()}
            className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Try again
          </button>
        </div>
      )}

      {data && (
        <div className={`space-y-6 ${activityQuery.isFetching ? 'opacity-60' : ''}`}>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile label="Leads created" value={data.totals.leadsCreated} />
            <StatTile label="Calls & messages" value={data.totals.communications} />
            <StatTile
              label="Follow-ups completed"
              value={data.totals.followUpsCompleted}
              hint={`${data.totals.followUpsScheduled} scheduled`}
            />
            <StatTile label="Became interested" value={data.totals.interested} />
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile label="Proposals" value={data.totals.proposals} />
            <StatTile
              label="Won"
              value={data.totals.won}
              tone={data.totals.won > 0 ? 'good' : 'default'}
            />
            <StatTile label="Lost" value={data.totals.lost} />
            <StatTile
              label="Total activity"
              value={
                data.totals.leadsCreated +
                data.totals.communications +
                data.totals.followUpsCompleted
              }
              hint="Leads, conversations and follow-ups"
            />
          </div>

          <Card title="Conversations by type" description="How the team reached out.">
            {data.totals.communications === 0 ? (
              <p className="py-4 text-sm text-slate-400">
                No calls, messages or meetings recorded in this period.
              </p>
            ) : (
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                {COMMUNICATION_TYPES.map((type) => (
                  <li key={type}>
                    <p className="text-xs font-medium text-slate-500">
                      {COMMUNICATION_TYPE_LABELS[type]}
                    </p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">
                      {data.communicationsByType[type]}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Day by day" description="Every day in the selected period.">
            {data.daily === null ? (
              <p className="py-4 text-sm text-slate-500">
                This range is too long to break down by day. Choose a shorter period to see it.
              </p>
            ) : (
              <ActivityDayTable days={data.daily} />
            )}
          </Card>
        </div>
      )}
    </>
  )
}
