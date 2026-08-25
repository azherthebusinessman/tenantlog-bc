import { Link } from 'react-router-dom'
import type { Issue, TimelineEntry } from '../lib/tenantlog/types'
import { CATEGORY_LABELS, STATUS_LABELS } from '../lib/tenantlog/types'
import { StatusChip } from './StatusChip'
import { formatDateShort as formatDate } from '../lib/tenantlog/dates'

interface IssueCardProps {
  issue: Issue
  latestEntry?: TimelineEntry
}

export function IssueCard({ issue, latestEntry }: IssueCardProps) {
  return (
    <Link to={`/issues/${issue.id}`} className="card card-link">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <h3 style={{ flex: 1 }}>{issue.title}</h3>
        <StatusChip status={issue.status} />
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
        <span className="category-badge">
          {issue.room} · {CATEGORY_LABELS[issue.category]}
        </span>
        <span className="text-sm muted">
          First noticed {formatDate(issue.noticedOn)}
        </span>
      </div>
      {latestEntry && (
        <p className="text-sm muted" style={{ marginTop: 10, lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--ink-secondary)', fontWeight: 600 }}>
            Latest:
          </strong>{' '}
          {latestEntry.note.slice(0, 120)}
          {latestEntry.note.length > 120 ? '…' : ''}
        </p>
      )}
    </Link>
  )
}

export { STATUS_LABELS }
