// All date helpers use the user's local browser timezone, not UTC.

/** Local calendar date as YYYY-MM-DD (for <input type="date"> values). */
export function localDateISO(d: Date = new Date()): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Current instant as a standard ISO-8601 UTC timestamp (with Z suffix). */
export function localTimestampISO(d: Date = new Date()): string {
  return d.toISOString()
}

/** True if the given YYYY-MM-DD date is after today's local date. */
export function isFutureDate(iso: string): boolean {
  return iso > localDateISO()
}

/** Format a date string for display, respecting local timezone. */
export function formatDate(iso: string): string {
  const d = iso.length <= 10 ? new Date(iso + 'T00:00:00') : new Date(iso)
  return d.toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })
}

/** Format a date string short form, respecting local timezone. */
export function formatDateShort(iso: string): string {
  const d = iso.length <= 10 ? new Date(iso + 'T00:00:00') : new Date(iso)
  return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** Format a full timestamp for display, respecting local timezone. */
export function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
