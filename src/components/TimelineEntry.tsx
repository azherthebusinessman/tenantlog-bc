import { useQuery } from '@tanstack/react-query'
import type { TimelineEntry, Attachment } from '../lib/tenantlog/types'
import { ENTRY_TYPE_LABELS } from '../lib/tenantlog/types'
import { getAttachmentsByEntry } from '../lib/tenantlog/store'
import { AttachmentGrid, type AttachmentMeta } from './AttachmentGrid'
import { formatDateShort, formatTimestamp } from '../lib/tenantlog/dates'

interface TimelineEntryViewProps {
  entry: TimelineEntry
  corrections: TimelineEntry[] // entries that correct this one
  correctedBy?: TimelineEntry // the entry that corrects this one (if any)
  onAddCorrection?: (entryId: string) => void
}

export function TimelineEntryView({
  entry,
  corrections,
  correctedBy,
  onAddCorrection,
}: TimelineEntryViewProps) {
  const { data: attachments = [] } = useQuery({
    queryKey: ['attachments', 'entry', entry.id],
    queryFn: () => getAttachmentsByEntry(entry.id),
  })

  const attMeta: AttachmentMeta[] = attachments.map((a: Attachment) => ({
    id: a.id,
    name: a.name,
    mimeType: a.mimeType,
    size: a.size,
    blob: a.blob,
  }))

  return (
    <div className="timeline-entry">
      <div className="timeline-entry-header">
        <div>
          <div className="timeline-entry-date">{formatDateShort(entry.eventDate)}</div>
          <div className="entry-type" style={{ marginTop: 2 }}>
            {ENTRY_TYPE_LABELS[entry.type]}
          </div>
        </div>
        {onAddCorrection && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onAddCorrection(entry.id)}
            title="Add a correction to this entry"
          >
            + Correction
          </button>
        )}
      </div>

      <div className="timeline-entry-meta">
        Added to TenantLog on {formatTimestamp(entry.createdAt)}
      </div>

      {correctedBy && (
        <div className="correction-marker">
          Corrected — see {formatDateShort(correctedBy.eventDate)} entry
        </div>
      )}

      {entry.note && (
        <p style={{ marginTop: 10, lineHeight: 1.6, color: 'var(--ink)' }}>
          {entry.note}
        </p>
      )}

      {entry.comms && (
        <p className="text-sm muted" style={{ marginTop: 8, fontStyle: 'italic' }}>
          Contact method: {entry.comms.method.replace(/_/g, ' ')} · Contacted on{' '}
          {formatDateShort(entry.comms.contactedOn)}
        </p>
      )}

      <AttachmentGrid attachments={attMeta} />

      {corrections.length > 0 && (
        <div style={{ marginTop: 12 }}>
          {corrections.map((c) => (
            <div key={c.id} className="correction-marker" style={{ marginTop: 4 }}>
              Correction to the {formatDateShort(entry.eventDate)} entry — see{' '}
              {formatDateShort(c.eventDate)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
