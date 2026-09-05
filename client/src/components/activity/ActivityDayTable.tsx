import type { ActivityDay } from '../../types/activity'

const COLUMNS = [
  { key: 'leadsCreated', label: 'Leads' },
  { key: 'communications', label: 'Calls & messages' },
  { key: 'followUpsCompleted', label: 'Follow-ups done' },
] as const

function formatDay(value: string): string {
  const date = new Date(`${value}T00:00:00`)
  return date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
}

/**
 * Days as rows with an inline magnitude bar. A table rather than a chart:
 * the exact number is what a manager checks, the bar just adds shape.
 */
export default function ActivityDayTable({ days }: { days: ActivityDay[] }) {
  const max = Math.max(1, ...days.flatMap((day) => COLUMNS.map((column) => day[column.key])))
  const isQuiet = (day: ActivityDay) => COLUMNS.every((column) => day[column.key] === 0)

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[34rem] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th scope="col" className="py-2 pr-4 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Day
            </th>
            {COLUMNS.map((column) => (
              <th
                key={column.key}
                scope="col"
                className="py-2 pr-4 text-xs font-semibold tracking-wide text-slate-500 uppercase"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr
              key={day.date}
              className={`border-b border-slate-100 last:border-0 ${
                isQuiet(day) ? 'text-slate-400' : ''
              }`}
            >
              <th scope="row" className="py-2 pr-4 font-normal whitespace-nowrap text-slate-600">
                {formatDay(day.date)}
              </th>
              {COLUMNS.map((column) => {
                const value = day[column.key]
                return (
                  <td key={column.key} className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="w-6 shrink-0 text-right tabular-nums text-slate-900">
                        {value}
                      </span>
                      <span className="h-1.5 w-full max-w-[8rem] rounded-sm bg-slate-100">
                        <span
                          className="block h-1.5 rounded-r-[4px] bg-[#2a78d6]"
                          style={{ width: `${(value / max) * 100}%` }}
                        />
                      </span>
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
