import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchDashboard } from '../api/dashboard'
import { getApiErrorMessage } from '../api/client'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import StatTile from '../components/dashboard/StatTile'
import PipelineChart from '../components/dashboard/PipelineChart'
import ValueTotals from '../components/dashboard/ValueTotals'
import TrendChart from '../components/dashboard/TrendChart'
import { DashboardIcon } from '../components/Icons'

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-72 animate-pulse rounded-xl bg-slate-100" />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
    staleTime: 60_000,
  })

  if (isPending) {
    return (
      <>
        <PageHeader title="Dashboard" description="Overview of your leads, activity and follow-ups." />
        <DashboardSkeleton />
      </>
    )
  }

  if (isError) {
    return (
      <>
        <PageHeader title="Dashboard" description="Overview of your leads, activity and follow-ups." />
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <DashboardIcon className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-slate-900">Could not load the dashboard</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{getApiErrorMessage(error)}</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Try again
          </button>
        </div>
      </>
    )
  }

  const { totals, followUps, today, month, conversionRate, value, trend } = data
  const isEmpty = totals.total === 0

  if (isEmpty) {
    return (
      <>
        <PageHeader title="Dashboard" description="Overview of your leads, activity and follow-ups." />
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <DashboardIcon className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-slate-900">Nothing to report yet</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            Add your first lead and the numbers will start filling in here.
          </p>
          <Link
            to="/leads/new"
            className="mt-5 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Add a lead
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of your leads, activity and follow-ups."
      />

      <div className="space-y-6">
        {/* The four numbers worth acting on first. */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile label="Total leads" value={totals.total} to="/leads" />
          <StatTile
            label="Overdue follow-ups"
            value={followUps.overdue}
            tone={followUps.overdue > 0 ? 'critical' : 'default'}
            hint={followUps.overdue > 0 ? 'Needs attention today' : 'All caught up'}
            to="/follow-ups"
          />
          <StatTile
            label="Due today"
            value={followUps.dueToday}
            hint={`${followUps.upcoming} upcoming`}
            to="/follow-ups"
          />
          <StatTile
            label="Won this month"
            value={month.won}
            tone={month.won > 0 ? 'good' : 'default'}
            hint={conversionRate === null ? 'No decided leads yet' : `${conversionRate}% conversion`}
            to="/leads?status=won"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ValueTotals
            label="Won this month"
            totals={value.wonThisMonth}
            tone="good"
            emptyText="Nothing won yet this month."
          />
          <ValueTotals
            label="Open pipeline"
            totals={value.openPipeline}
            emptyText="No priced leads still open."
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card title="Pipeline" description="Where every lead currently sits.">
            <PipelineChart counts={totals} />
          </Card>

          <Card title="New leads" description="Leads added over the last 14 days.">
            <TrendChart
              points={trend.map((point) => ({ date: point.date, value: point.leads }))}
              label="New leads"
            />
          </Card>
        </div>

        <Card title="Today" description="Activity recorded so far today.">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile variant="plain" label="Leads added" value={today.leadsAdded} />
            <StatTile variant="plain" label="Calls & messages" value={today.communications} />
            <StatTile
              variant="plain"
              label="Follow-ups completed"
              value={today.followUpsCompleted}
            />
            <StatTile
              variant="plain"
              label="Leads added this month"
              value={month.leadsAdded}
              hint={`${month.won} won · ${month.lost} lost`}
            />
          </div>
        </Card>
      </div>
    </>
  )
}
