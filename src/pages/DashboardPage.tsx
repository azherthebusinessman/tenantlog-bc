import { Link } from 'react-router-dom'
import { useIssues, useEntries } from '../lib/tenantlog/hooks'
import { IssueCard } from '../components/IssueCard'
import { EmptyState } from '../components/EmptyState'
import { DisclaimerNote } from '../components/DisclaimerNote'
import type { Issue } from '../lib/tenantlog/types'

export function DashboardPage() {
  const { data: issues = [], isLoading } = useIssues()

  if (isLoading) {
    return <div className="loading">Loading your issues…</div>
  }

  return (
    <div className="app-main app-main-wide">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <h1>Your Issues</h1>
        <Link to="/issues/new" className="btn btn-primary btn-sm">
          + Log New Issue
        </Link>
      </div>

      {issues.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No issues logged yet"
            message="When something needs documenting — a leak, a broken appliance, a repair request — log it here. You can add updates and photos over time, then export the full record as a PDF."
            action={
              <Link to="/issues/new" className="btn btn-primary">
                + Log Your First Issue
              </Link>
            }
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {issues.map((issue: Issue) => (
            <IssueWithLatest key={issue.id} issue={issue} />
          ))}
        </div>
      )}

      <div style={{ marginTop: 32 }}>
        <DisclaimerNote />
      </div>

      <div className="sticky-bottom">
        <Link to="/issues/new" className="btn btn-primary w-full">
          + Log New Issue
        </Link>
      </div>
    </div>
  )
}

function IssueWithLatest({ issue }: { issue: Issue }) {
  const { data: entries = [] } = useEntries(issue.id)
  const latest = entries.length > 0 ? entries[entries.length - 1] : undefined
  return <IssueCard issue={issue} latestEntry={latest} />
}
