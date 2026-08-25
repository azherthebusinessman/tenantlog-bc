import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { IssueCategory, CommsMethod } from '../lib/tenantlog/types'
import { CATEGORY_LABELS, COMMS_METHOD_LABELS } from '../lib/tenantlog/types'
import { useCreateIssue } from '../lib/tenantlog/hooks'
import { FileDropInput } from '../components/FileDropInput'
import { DisclaimerNote } from '../components/DisclaimerNote'
import { localDateISO, isFutureDate } from '../lib/tenantlog/dates'
import { trackEvent } from '../lib/analytics'

const CATEGORIES: IssueCategory[] = [
  'leak',
  'appliance',
  'damage',
  'mold',
  'heating',
  'plumbing',
  'electrical',
  'cleanliness',
  'other',
]

const COMMS_METHODS: CommsMethod[] = ['text', 'email', 'phone', 'in_person', 'portal']

export function NewIssuePage() {
  const navigate = useNavigate()
  const createIssue = useCreateIssue()

  const [title, setTitle] = useState('')
  const [room, setRoom] = useState('')
  const [category, setCategory] = useState<IssueCategory>('leak')
  const [noticedOn, setNoticedOn] = useState(localDateISO())
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [contactedLandlord, setContactedLandlord] = useState<boolean | null>(null)
  const [contactedOn, setContactedOn] = useState(localDateISO())
  const [commsMethod, setCommsMethod] = useState<CommsMethod>('text')
  const [commsFiles, setCommsFiles] = useState<File[]>([])
  const [dateError, setDateError] = useState('')
  const startFired = useRef(false)
  if (!startFired.current) {
    startFired.current = true
    trackEvent('start_issue')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !room.trim() || !description.trim()) return
    if (isFutureDate(noticedOn)) {
      setDateError('The date first noticed cannot be in the future.')
      return
    }
    if (contactedLandlord === true && isFutureDate(contactedOn)) {
      setDateError('The contact date cannot be in the future.')
      return
    }
    setDateError('')

    createIssue.mutate(
      {
        title: title.trim(),
        room: room.trim(),
        category,
        noticedOn,
        description: description.trim(),
        contactedLandlord: contactedLandlord === true,
        contactedOn: contactedLandlord === true ? contactedOn : undefined,
        commsMethod: contactedLandlord === true ? commsMethod : undefined,
        files,
        commsFiles: contactedLandlord === true ? commsFiles : undefined,
      },
      {
        onSuccess: (issue) => {
          trackEvent('issue_created')
          navigate(`/issues/${issue.id}`)
        },
      },
    )
  }

  return (
    <div className="app-main">
      <div style={{ marginBottom: 20 }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate(-1)}
          style={{ padding: '4px 0' }}
        >
          ← Back
        </button>
      </div>

      <h1 style={{ marginBottom: 8 }}>Log New Issue</h1>
      <p className="muted" style={{ marginBottom: 24 }}>
        Record what's happening while it's fresh. You can add updates and photos later.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="title">
            What's the issue? <span style={{ color: 'var(--accent)' }}>*</span>
          </label>
          <input
            id="title"
            className="form-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Kitchen sink leaking under cabinet"
            required
            autoFocus
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="room">
              Room / Location <span style={{ color: 'var(--accent)' }}>*</span>
            </label>
            <input
              id="room"
              className="form-input"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="e.g. Kitchen, bedroom, hallway"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="category">
              Category
            </label>
            <select
              id="category"
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value as IssueCategory)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="noticed-on">
            When did you first notice it? <span style={{ color: 'var(--accent)' }}>*</span>
          </label>
          <input
            id="noticed-on"
            type="date"
            className="form-input"
            value={noticedOn}
            onChange={(e) => setNoticedOn(e.target.value)}
            max={localDateISO()}
            required
          />
          <div className="form-hint">
            The date the issue started — separate from today's date.
          </div>
          {dateError && (
            <div className="form-hint" style={{ color: '#a83232', marginTop: 6 }}>
              {dateError}
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="description">
            Describe what's happening <span style={{ color: 'var(--accent)' }}>*</span>
          </label>
          <textarea
            id="description"
            className="form-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What do you see, hear, or smell? How bad is it? Any relevant context?"
            rows={4}
            required
          />
        </div>

        <div className="form-group">
          <FileDropInput
            files={files}
            onFilesChange={setFiles}
            label="Add photos of the issue"
            hint="Tap on mobile to use camera. Images downscale automatically."
            capture
          />
        </div>

        {/* Landlord contact section */}
        <div className="form-group">
          <label className="form-label">Have you contacted your landlord about this?</label>
          <div className="radio-group">
            <button
              type="button"
              className={`radio-btn ${contactedLandlord === true ? 'selected' : ''}`}
              onClick={() => setContactedLandlord(true)}
            >
              Yes
            </button>
            <button
              type="button"
              className={`radio-btn ${contactedLandlord === false ? 'selected' : ''}`}
              onClick={() => setContactedLandlord(false)}
            >
              Not yet
            </button>
          </div>
        </div>

        {contactedLandlord === true && (
          <div
            style={{
              padding: '20px',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius)',
              background: 'var(--paper-elevated)',
              marginBottom: 20,
            }}
          >
            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="contacted-on">
                  When did you contact them?
                </label>
                <input
                  id="contacted-on"
                  type="date"
                  className="form-input"
                  value={contactedOn}
                  onChange={(e) => setContactedOn(e.target.value)}
                  max={localDateISO()}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="comms-method">
                  How?
                </label>
                <select
                  id="comms-method"
                  className="form-select"
                  value={commsMethod}
                  onChange={(e) => setCommsMethod(e.target.value as CommsMethod)}
                >
                  {COMMS_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {COMMS_METHOD_LABELS[m]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0, marginTop: 16 }}>
              <FileDropInput
                files={commsFiles}
                onFilesChange={setCommsFiles}
                label="Screenshot of contact (optional)"
                hint="Text screenshot, email copy, etc."
              />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={createIssue.isPending}
          >
            {createIssue.isPending ? 'Saving…' : 'Save & View Timeline'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/issues')}
          >
            Cancel
          </button>
        </div>
      </form>

      <div style={{ marginTop: 32 }}>
        <DisclaimerNote />
      </div>
    </div>
  )
}
