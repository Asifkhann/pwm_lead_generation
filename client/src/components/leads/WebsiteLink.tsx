import { toDisplayUrl, toExternalUrl } from '../../utils/format'
import { ExternalLinkIcon } from '../Icons'

/** Renders a lead's website as a shortened external link, or nothing when unset. */
export default function WebsiteLink({ website }: { website: string }) {
  if (!website.trim()) return null

  return (
    <a
      href={toExternalUrl(website)}
      target="_blank"
      rel="noopener noreferrer"
      title={website}
      className="inline-flex max-w-full items-center gap-1 text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline"
    >
      <span className="truncate">{toDisplayUrl(website)}</span>
      <ExternalLinkIcon className="h-3 w-3 shrink-0" />
    </a>
  )
}
