import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  useIssue,
  useEntries,
  useUpdateIssueStatus,
  useDeleteIssue,
} from '../lib/tenantlog/hooks'
import { CATEGORY_LABELS, STATUS_LABELS, type IssueStatus } from '../lib/tenantlog/types'
import { TimelineEntryView } from '../components/TimelineEntry'
import { AddUpdateSheet } from '../components/AddUpdateSheet'
import { StatusChip } from '../components/StatusChip'
import { DisclaimerNote } from '../components/DisclaimerNote'
import { exportIssuePdf } from '../lib/tenantlog/pdf'
import { formatDate } from '../lib/tenantlog/dates'
import { trackEvent } from '../lib/analytics'

export function IssueTimelinePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: issue, isLoading: issueLoading } = useIssue(id)
  const { data: entries = [], isLoading: entriesLoading } = useEntries(id)
  const updateStatus = useUpdateIssueStatus()
  const deleteIssue = useDeleteIssue()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [correctionTargetId, setCorrectionTargetId] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  if (issueLoading || entriesLoading) {
    return <div className="loading">Loading…</div>
  }

  if (!issue) {
    return (
      <div className="app-main">
        <div className="empty-state">
          <h3>Issue not found</h3>
          <p>This issue may have been deleted, or the link is incorrect.</p>
          <button
            className="btn btn-secondary"
            style={{ marginTop: 16 }}
            onClick={() => navigate('/issues')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Build correction maps
  const correctionsMap = new Map<string, typeof entries>() // entryId -> corrections
  const correctedByMap = new Map<string, typeof entries[number]>() // entryId -> correcting entry
  for (const entry of entries) {
    if (entry.correctsEntryId) {
      const list = correctionsMap.get(entry.correctsEntryId) ?? []
      list.push(entry)
      correctionsMap.set(entry.correctsEntryId, list)
      correctedByMap.set(entry.correctsEntryId, entry)
    }
  }

  async function handleExport() {
    if (!id) return
    setExporting(true)
    try {
      await exportIssuePdf(id)
      trackEvent('pdf_exported')
    } catch (err) {
      alert('Export failed: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setExporting(false)
    }
  }

  function handleDelete() {
    if (!issue || !id) return
    if (
      confirm(
        `Delete "${issue.title}"? This removes the issue and all its timeline entries and attachments. This cannot be undone.`,
      )
    ) {
      deleteIssue.mutate(id, {
        onSuccess: () => navigate('/issues'),
      })
    }
  }

  function openAddUpdate() {
    setCorrectionTargetId(null)
    setSheetOpen(true)
  }

  function openCorrection(entryId: string) {
    setCorrectionTargetId(entryId)
    setSheetOpen(true)
  }

  const statuses: IssueStatus[] = ['open', 'in_progress', 'resolved']

  return (
    <div className="app-main">
      <div style={{ marginBottom: 20 }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate('/issues')}
          style={{ padding: '4px 0' }}
        >
          ← All Issues
        </button>
      </div>

      {/* Issue header */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <h1 style={{ flex: 1, fontSize: '1.5rem' }}>{issue.title}</h1>
          <StatusChip status={issue.status} />
        </div>
        <div
          style={{
            display: 'flex',
            gap: 16,
            marginTop: 8,
            flexWrap: 'wrap',
            fontSize: '0.875rem',
          }}
        >
          <span className="muted">
            <strong style={{ color: 'var(--ink-secondary)', fontWeight: 600 }}>Room:</strong>{' '}
            {issue.room}
          </span>
          <span className="muted">
            <strong style={{ color: 'var(--ink-secondary)', fontWeight: 600 }}>Category:</strong>{' '}
            {CATEGORY_LABELS[issue.category]}
          </span>
          <span className="muted">
            <strong style={{ color: 'var(--ink-secondary)', fontWeight: 600 }}>
              First noticed:
            </strong>{' '}
            {formatDate(issue.noticedOn)}
          </span>
        </div>
        {issue.description && (
          <p style={{ marginTop: 12, lineHeight: 1.6, color: 'var(--ink)' }}>
            {issue.description}
          </p>
        )}
      </div>

      {/* Action bar */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          marginBottom: 24,
        }}
      >
        <button className="btn btn-primary btn-sm" onClick={openAddUpdate}>
          + Add Update
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? 'Generating…' : 'Export Evidence Pack (PDF)'}
        </button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '6px 10px', fontSize: '0.8125rem' }}
            value={issue.status}
            onChange={(e) =>
              updateStatus.mutate({
                id: issue.id,
                status: e.target.value as IssueStatus,
              })
            }
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <button className="btn btn-danger btn-sm" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>

      {/* Timeline */}
      <h2 style={{ fontSize: '1.125rem', marginBottom: 16 }}>
        Timeline ({entries.length} {entries.length === 1 ? 'entry' : 'entries'})
      </h2>

      {entries.length === 0 ? (
        <div className="card">
          <p className="muted">No entries yet. Add an update to start the timeline.</p>
        </div>
      ) : (
        <div className="timeline">
          {entries.map((entry) => (
            <TimelineEntryView
              key={entry.id}
              entry={entry}
              corrections={correctionsMap.get(entry.id) ?? []}
              correctedBy={correctedByMap.get(entry.id)}
              onAddCorrection={entry.type !== 'correction' ? openCorrection : undefined}
            />
          ))}
        </div>
      )}

      <div style={{ marginTop: 32 }}>
        <DisclaimerNote />
      </div>

      <AddUpdateSheet
        issueId={issue.id}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        correctsEntryId={correctionTargetId}
      />
    </div>
  )
}
