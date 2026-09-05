import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { fetchReports } from '../api/reports'
import { getApiErrorMessage } from '../api/client'
import {
  LEAD_SOURCE_LABELS,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  type LeadSource,
} from '../constants/lead'
import type { RangePreset } from '../utils/dateRanges'
import { useDateRange } from '../hooks/useDateRange'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import DateRangePicker from '../components/DateRangePicker'
import StatTile from '../components/dashboard/StatTile'
import BarList from '../components/dashboard/BarList'
import ValueTotals from '../components/dashboard/ValueTotals'
import TrendChart from '../components/dashboard/TrendChart'
import { ReportsIcon } from '../components/Icons'

const PRESETS: RangePreset[] = ['last_7_days', 'last_30_days', 'last_90_days', 'this_month', 'this_year']

function sourceLabel(value: string): string {
  return LEAD_SOURCE_LABELS[value as LeadSource] ?? value
}

/** Completed share of the follow-ups that fell due in the period. */
function CompletionMeter({
  completed,
  total,
  rate,
}: {
  completed: number
  total: number
  rate: number | null
}) {
  if (total === 0) {
    return <p className="py-4 text-sm text-slate-400">No follow-ups were due in this period.</p>
  }

  return (
    <div>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-semibold text-slate-900">{rate}%</p>
        <p className="text-sm text-slate-500">
          {completed} of {total} completed
        </p>
      </div>
      <div className="mt-3 h-2 rounded-sm bg-slate-100">
        <div
          className="h-2 rounded-r-[4px] bg-[#2a78d6]"
          style={{ width: `${rate ?? 0}%` }}
        />
      </div>
    </div>
  )
}

export default function ReportsPage() {
  const { preset, setPreset, customFrom, setCustomFrom, customTo, setCustomTo, range } =
    useDateRange('last_90_days')

  const reportsQuery = useQuery({
    queryKey: ['reports', range?.from.toISOString(), range?.to.toISOString()],
    queryFn: () => fetchReports(range!.from.toISOString(), range!.to.toISOString()),
    enabled: range !== null,
    placeholderData: keepPreviousData,
  })

  const data = reportsQuery.data

  return (
    <>
      <PageHeader
        title="Reports"
        description="Performance, conversion and pipeline analytics."
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

      {reportsQuery.isPending && range !== null && (
        <div className="space-y-6" aria-busy="true">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
        </div>
      )}

      {reportsQuery.isError && (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Could not load reports</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            {getApiErrorMessage(reportsQuery.error)}
          </p>
          <button
            type="button"
            onClick={() => void reportsQuery.refetch()}
            className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Try again
          </button>
        </div>
      )}

      {data && data.totalLeads === 0 && data.outcomes.decided === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <ReportsIcon className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-slate-900">Nothing in this period</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            No leads were added and nothing was won or lost. Try a longer date range.
          </p>
        </div>
      )}

      {data && (data.totalLeads > 0 || data.outcomes.decided > 0) && (
        <div className={`space-y-6 ${reportsQuery.isFetching ? 'opacity-60' : ''}`}>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile label="Leads added" value={data.totalLeads} />
            <StatTile
              label="Won"
              value={data.outcomes.won}
              tone={data.outcomes.won > 0 ? 'good' : 'default'}
            />
            <StatTile label="Lost" value={data.outcomes.lost} />
            <StatTile
              label="Conversion rate"
              value={data.outcomes.conversionRate === null ? '—' : `${data.outcomes.conversionRate}%`}
              hint={
                data.outcomes.decided === 0
                  ? 'Nothing decided yet'
                  : `${data.outcomes.won} of ${data.outcomes.decided} decided`
              }
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <ValueTotals
              label="Won value"
              totals={data.value.won}
              tone="good"
              emptyText="Nothing won in this period."
            />
            <ValueTotals
              label="Lost value"
              totals={data.value.lost}
              emptyText="Nothing lost in this period."
            />
            <ValueTotals
              label="Open pipeline"
              totals={data.value.open}
              emptyText="No priced leads still open."
            />
          </div>

          <Card
            title="Leads over time"
            description={
              data.leadsOverTime.granularity === 'month'
                ? 'Leads added per month.'
                : 'Leads added per day.'
            }
          >
            <TrendChart
              points={data.leadsOverTime.points}
              granularity={data.leadsOverTime.granularity}
              label="Leads"
            />
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card title="By status" description="Where this period's leads sit now.">
              <BarList
                emptyText="No leads in this period."
                rows={LEAD_STATUSES.map((status) => ({
                  key: status,
                  label: LEAD_STATUS_LABELS[status],
                  value: data.byStatus[status],
                  to: `/leads?status=${status}`,
                }))}
              />
            </Card>

            <Card title="By industry" description="Which industries you are reaching.">
              <BarList
                emptyText="No industries recorded."
                rows={data.byIndustry.map((row) => ({
                  key: row.key,
                  label: row.label,
                  value: row.value,
                  // The folded tail and unset values are not filterable.
                  to: row.key.startsWith('__')
                    ? undefined
                    : `/leads?industry=${encodeURIComponent(row.key)}`,
                }))}
              />
            </Card>

            <Card title="By source" description="Where your leads come from.">
              <BarList
                emptyText="No sources recorded."
                rows={data.bySource.map((row) => ({
                  key: row.key,
                  label: sourceLabel(row.key),
                  value: row.value,
                  to: row.key.startsWith('__') ? undefined : `/leads?leadSource=${row.key}`,
                }))}
              />
            </Card>

            <Card
              title="Follow-up completion"
              description="Of the follow-ups due in this period."
            >
              <CompletionMeter
                completed={data.followUps.completed}
                total={data.followUps.total}
                rate={data.followUps.rate}
              />
              {data.followUps.total > 0 && (
                <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 text-sm">
                  <div>
                    <dt className="text-xs text-slate-500">Completed</dt>
                    <dd className="font-medium text-slate-900">{data.followUps.completed}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Still pending</dt>
                    <dd className="font-medium text-slate-900">{data.followUps.pending}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Overdue</dt>
                    <dd
                      className={`font-medium ${
                        data.followUps.overdue > 0 ? 'text-rose-700' : 'text-slate-900'
                      }`}
                    >
                      {data.followUps.overdue}
                    </dd>
                  </div>
                </dl>
              )}
            </Card>
          </div>

          <Card title="Manager performance" description="Activity and outcomes per manager.">
            {data.managers.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">
                No manager activity in this period.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[40rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      {['Manager', 'Leads', 'Calls', 'Follow-ups', 'Won', 'Lost', 'Conversion'].map(
                        (heading) => (
                          <th
                            key={heading}
                            scope="col"
                            className="py-2 pr-4 text-xs font-semibold tracking-wide text-slate-500 uppercase"
                          >
                            {heading}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {data.managers.map((row) => (
                      <tr key={row.manager} className="border-b border-slate-100 last:border-0">
                        <th scope="row" className="py-2.5 pr-4 font-medium text-slate-900">
                          {row.manager}
                        </th>
                        <td className="py-2.5 pr-4 tabular-nums text-slate-700">
                          {row.leadsCreated}
                        </td>
                        <td className="py-2.5 pr-4 tabular-nums text-slate-700">
                          {row.communications}
                        </td>
                        <td className="py-2.5 pr-4 tabular-nums text-slate-700">
                          {row.followUpsCompleted}
                        </td>
                        <td className="py-2.5 pr-4 tabular-nums text-emerald-700">{row.won}</td>
                        <td className="py-2.5 pr-4 tabular-nums text-slate-700">{row.lost}</td>
                        <td className="py-2.5 pr-4 tabular-nums text-slate-900">
                          {row.conversionRate === null ? '—' : `${row.conversionRate}%`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  )
}
