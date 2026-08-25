import { useState, useEffect } from 'react'
import type { EntryType } from '../lib/tenantlog/types'
import { ENTRY_TYPE_LABELS } from '../lib/tenantlog/types'
import { FileDropInput } from './FileDropInput'
import { useAddEntry } from '../lib/tenantlog/hooks'
import { localDateISO, isFutureDate } from '../lib/tenantlog/dates'

interface AddUpdateSheetProps {
  issueId: string
  open: boolean
  onClose: () => void
  correctsEntryId?: string | null
}

const ENTRY_TYPES: EntryType[] = [
  'follow_up',
  'landlord_contact',
  'landlord_reply',
  'repair_visit',
  'other',
]

export function AddUpdateSheet({
  issueId,
  open,
  onClose,
  correctsEntryId = null,
}: AddUpdateSheetProps) {
  const [eventDate, setEventDate] = useState(localDateISO())
  const [type, setType] = useState<EntryType>('follow_up')
  const [note, setNote] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [dateError, setDateError] = useState('')
  const addEntry = useAddEntry()

  useEffect(() => {
    if (open) {
      setEventDate(localDateISO())
      setType(correctsEntryId ? 'correction' : 'follow_up')
      setNote('')
      setFiles([])
      setDateError('')
    }
  }, [open, correctsEntryId])

  if (!open) return null

  const isCorrection = !!correctsEntryId

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!note.trim() && files.length === 0) return
    if (isFutureDate(eventDate)) {
      setDateError('The event date cannot be in the future.')
      return
    }
    setDateError('')
    addEntry.mutate(
      {
        issueId,
        eventDate,
        type: isCorrection ? 'correction' : type,
        note: note.trim(),
        files,
        correctsEntryId,
      },
      {
        onSuccess: () => {
          onClose()
        },
      },
    )
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <h3>{isCorrection ? 'Add a correction' : 'Add update'}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {isCorrection && (
          <div className="disclaimer" style={{ marginBottom: 16 }}>
            A correction creates a new timeline entry — the original stays unchanged with its
            date intact. Both entries appear in the export.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="event-date">
              When did this happen?
            </label>
            <input
              id="event-date"
              type="date"
              className="form-input"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              max={localDateISO()}
              required
            />
            <div className="form-hint">
              The date the event occurred — separate from when you log it.
            </div>
            {dateError && (
              <div className="form-hint" style={{ color: '#a83232', marginTop: 6 }}>
                {dateError}
              </div>
            )}
          </div>

          {!isCorrection && (
            <div className="form-group">
              <label className="form-label">Type of update</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {ENTRY_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`radio-btn ${type === t ? 'selected' : ''}`}
                    style={{ flex: '0 1 auto' }}
                    onClick={() => setType(t)}
                  >
                    {ENTRY_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="entry-note">
              {isCorrection ? 'What needs correcting?' : 'Note'}
            </label>
            <textarea
              id="entry-note"
              className="form-textarea"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                isCorrection
                  ? 'Describe what was wrong and what the correct information is…'
                  : 'What happened? What was said or done?'
              }
              rows={4}
            />
          </div>

          <div className="form-group">
            <FileDropInput
              files={files}
              onFilesChange={setFiles}
              label="Attach photos or files (optional)"
              hint="Images downscale automatically. PDFs and docs listed by name."
            />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={addEntry.isPending || (!note.trim() && files.length === 0)}
            >
              {addEntry.isPending ? 'Saving…' : isCorrection ? 'Save correction' : 'Save update'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
