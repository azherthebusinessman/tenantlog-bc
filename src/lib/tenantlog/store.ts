import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Issue, TimelineEntry, Attachment, NewIssueInput, NewEntryInput } from './types'
import { processFile } from './image'
import { localTimestampISO, localDateISO } from './dates'

interface TenantLogDB extends DBSchema {
  issues: { key: string; value: Issue }
  entries: { key: string; value: TimelineEntry; indexes: { 'by-issue': string } }
  attachments: { key: string; value: Attachment; indexes: { 'by-issue': string; 'by-entry': string } }
}

const DB_NAME = 'tenantlog-bc'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<TenantLogDB>> | null = null

function getDB(): Promise<IDBPDatabase<TenantLogDB>> {
  if (!dbPromise) {
    dbPromise = openDB<TenantLogDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('issues')) {
          db.createObjectStore('issues', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('entries')) {
          db.createObjectStore('entries', { keyPath: 'id' }).createIndex('by-issue', 'issueId')
        }
        if (!db.objectStoreNames.contains('attachments')) {
          const store = db.createObjectStore('attachments', { keyPath: 'id' })
          store.createIndex('by-issue', 'issueId')
          store.createIndex('by-entry', 'entryId')
        }
      },
    })
  }
  return dbPromise
}

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function nowISO(): string {
  return localTimestampISO()
}

function dateOffset(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return localDateISO(d)
}

// ── Issues ──────────────────────────────────────────────

export async function getAllIssues(): Promise<Issue[]> {
  const db = await getDB()
  const all = await db.getAll('issues')
  return all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function getIssue(id: string): Promise<Issue | undefined> {
  const db = await getDB()
  return db.get('issues', id)
}

export async function updateIssueStatus(id: string, status: Issue['status']): Promise<void> {
  const db = await getDB()
  const issue = await db.get('issues', id)
  if (!issue) return
  issue.status = status
  issue.updatedAt = nowISO()
  await db.put('issues', issue)
}

export async function deleteIssue(id: string): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(['issues', 'entries', 'attachments'], 'readwrite')
  const entryIds: string[] = []
  let cursor = await tx.objectStore('entries').index('by-issue').openCursor(id)
  while (cursor) {
    entryIds.push(cursor.primaryKey as string)
    await cursor.delete()
    cursor = await cursor.continue()
  }
  for (const entryId of entryIds) {
    let attCursor = await tx.objectStore('attachments').index('by-entry').openCursor(entryId)
    while (attCursor) {
      await attCursor.delete()
      attCursor = await attCursor.continue()
    }
  }
  await tx.objectStore('issues').delete(id)
  await tx.done
}

// ── Entries ─────────────────────────────────────────────

export async function getEntriesByIssue(issueId: string): Promise<TimelineEntry[]> {
  const db = await getDB()
  const entries = await db.getAllFromIndex('entries', 'by-issue', issueId)
  return entries.sort((a, b) => {
    // Sort by event date, then by creation time for same-date entries
    const dateCmp = a.eventDate.localeCompare(b.eventDate)
    if (dateCmp !== 0) return dateCmp
    return a.createdAt.localeCompare(b.createdAt)
  })
}

export async function addEntry(input: NewEntryInput): Promise<TimelineEntry> {
  const db = await getDB()
  const entryId = uid()
  const attachmentIds: string[] = []

  for (const file of input.files) {
    const { blob, name, mimeType } = await processFile(file)
    const attId = uid()
    attachmentIds.push(attId)
    const att: Attachment = {
      id: attId,
      issueId: input.issueId,
      entryId,
      name,
      mimeType,
      size: blob.size,
      blob,
    }
    await db.put('attachments', att)
  }

  const entry: TimelineEntry = {
    id: entryId,
    issueId: input.issueId,
    eventDate: input.eventDate,
    type: input.type,
    note: input.note,
    createdAt: nowISO(),
    correctsEntryId: input.correctsEntryId ?? null,
    comms: null,
    attachmentIds,
  }

  await db.put('entries', entry)

  // Touch issue updatedAt
  const issue = await db.get('issues', input.issueId)
  if (issue) {
    issue.updatedAt = nowISO()
    await db.put('issues', issue)
  }

  return entry
}

// ── Attachments ─────────────────────────────────────────

export async function getAttachment(id: string): Promise<Attachment | undefined> {
  const db = await getDB()
  return db.get('attachments', id)
}

export async function getAttachmentsByEntry(entryId: string): Promise<Attachment[]> {
  const db = await getDB()
  return db.getAllFromIndex('attachments', 'by-entry', entryId)
}

export async function getAttachmentsByIssue(issueId: string): Promise<Attachment[]> {
  const db = await getDB()
  return db.getAllFromIndex('attachments', 'by-issue', issueId)
}

// ── Create issue with first entries ─────────────────────

export async function createIssueWithEntries(input: NewIssueInput): Promise<Issue> {
  const db = await getDB()
  const issueId = uid()
  const now = nowISO()

  const issue: Issue = {
    id: issueId,
    title: input.title,
    room: input.room,
    category: input.category,
    noticedOn: input.noticedOn,
    description: input.description,
    status: 'open',
    createdAt: now,
    updatedAt: now,
  }
  await db.put('issues', issue)

  // First entry: the initial observation
  const obsEntryId = uid()
  const obsAttachmentIds: string[] = []
  for (const file of input.files) {
    const { blob, name, mimeType } = await processFile(file)
    const attId = uid()
    obsAttachmentIds.push(attId)
    await db.put('attachments', {
      id: attId,
      issueId,
      entryId: obsEntryId,
      name,
      mimeType,
      size: blob.size,
      blob,
    })
  }
  const obsEntry: TimelineEntry = {
    id: obsEntryId,
    issueId,
    eventDate: input.noticedOn,
    type: 'observation',
    note: input.description,
    createdAt: now,
    correctsEntryId: null,
    comms: null,
    attachmentIds: obsAttachmentIds,
  }
  await db.put('entries', obsEntry)

  // If landlord was contacted, create a landlord_contact entry
  if (input.contactedLandlord && input.contactedOn && input.commsMethod) {
    const commsEntryId = uid()
    const commsAttachmentIds: string[] = []
    if (input.commsFiles) {
      for (const file of input.commsFiles) {
        const { blob, name, mimeType } = await processFile(file)
        const attId = uid()
        commsAttachmentIds.push(attId)
        await db.put('attachments', {
          id: attId,
          issueId,
          entryId: commsEntryId,
          name,
          mimeType,
          size: blob.size,
          blob,
        })
      }
    }
    const commsEntry: TimelineEntry = {
      id: commsEntryId,
      issueId,
      eventDate: input.contactedOn,
      type: 'landlord_contact',
      note: `Contacted landlord via ${input.commsMethod}.`,
      createdAt: now,
      correctsEntryId: null,
      comms: { method: input.commsMethod, contactedOn: input.contactedOn },
      attachmentIds: commsAttachmentIds,
    }
    await db.put('entries', commsEntry)
  }

  return issue
}

// ── Demo data ───────────────────────────────────────────

export async function seedDemoData(): Promise<void> {
  const db = await getDB()
  const now = nowISO()

  // Relative dates so demo events are never in the future
  const d4 = localDateISO()               // today — repair visit
  const d3 = dateOffset(-1)               // yesterday — landlord reply
  const d2 = dateOffset(-2)               // 2 days ago — landlord contact
  const d1 = dateOffset(-4)               // 4 days ago — first noticed

  const issueId = uid()
  const issue: Issue = {
    id: issueId,
    title: 'Kitchen sink leak under cabinet',
    room: 'Kitchen',
    category: 'leak',
    noticedOn: d1,
    description:
      'Water pooling under the kitchen sink cabinet. Appears to be coming from the pipe joint where the P-trap meets the drain. Dripping steadily.',
    status: 'in_progress',
    createdAt: now,
    updatedAt: now,
  }
  await db.put('issues', issue)

  // Entry 1: Observation (4 days ago)
  const e1Id = uid()
  const e1Atts = await createDemoAttachments(db, issueId, e1Id, ['leak-1', 'leak-2'])
  await db.put('entries', {
    id: e1Id,
    issueId,
    eventDate: d1,
    type: 'observation',
    note: 'Water pooling under the kitchen sink cabinet. Appears to be coming from the pipe joint where the P-trap meets the drain. Dripping steadily.',
    createdAt: now,
    correctsEntryId: null,
    comms: null,
    attachmentIds: e1Atts,
  })

  // Entry 2: Landlord contact (2 days ago)
  const e2Id = uid()
  await db.put('entries', {
    id: e2Id,
    issueId,
    eventDate: d2,
    type: 'landlord_contact',
    note: 'Sent a text message to the property manager describing the leak and asking for a plumber.',
    createdAt: now,
    correctsEntryId: null,
    comms: { method: 'text', contactedOn: d2 },
    attachmentIds: [],
  })

  // Entry 3: Landlord reply (yesterday)
  const e3Id = uid()
  const e3Atts = await createDemoAttachments(db, issueId, e3Id, ['landlord-reply'])
  await db.put('entries', {
    id: e3Id,
    issueId,
    eventDate: d3,
    type: 'landlord_reply',
    note: 'Property manager replied: "Thanks for letting me know. I will send a plumber soon. Please keep the area clear."',
    createdAt: now,
    correctsEntryId: null,
    comms: null,
    attachmentIds: e3Atts,
  })

  // Entry 4: Repair visit (today)
  const e4Id = uid()
  await db.put('entries', {
    id: e4Id,
    issueId,
    eventDate: d4,
    type: 'repair_visit',
    note: 'Plumber arrived, replaced the P-trap joint and tightened connections. Leak stopped. Cabinet still drying out.',
    createdAt: now,
    correctsEntryId: null,
    comms: null,
    attachmentIds: [],
  })
}

async function createDemoAttachments(
  db: IDBPDatabase<TenantLogDB>,
  issueId: string,
  entryId: string,
  labels: string[],
): Promise<string[]> {
  const ids: string[] = []
  for (const label of labels) {
    const blob = createPlaceholderImage(label)
    const id = uid()
    ids.push(id)
    await db.put('attachments', {
      id,
      issueId,
      entryId,
      name: `${label}.jpg`,
      mimeType: 'image/jpeg',
      size: blob.size,
      blob,
    })
  }
  return ids
}

function createPlaceholderImage(label: string): Blob {
  const canvas = document.createElement('canvas')
  canvas.width = 800
  canvas.height = 600
  const ctx = canvas.getContext('2d')!
  // Paper-toned background
  ctx.fillStyle = '#e8e2d6'
  ctx.fillRect(0, 0, 800, 600)
  // Border
  ctx.strokeStyle = '#b8ad99'
  ctx.lineWidth = 4
  ctx.strokeRect(20, 20, 760, 560)
  // Label
  ctx.fillStyle = '#6b6253'
  ctx.font = '28px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Placeholder image', 400, 280)
  ctx.font = '20px system-ui, sans-serif'
  ctx.fillText(label.replace(/-/g, ' '), 400, 320)
  ctx.font = '16px system-ui, sans-serif'
  ctx.fillText('(demo data — not a real photo)', 400, 360)
  // Simulate async by converting synchronously
  // toBlob is async but we need a Blob; use a fallback
  const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
  return dataUrlToBlob(dataUrl)
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
  const bytes = atob(base64)
  const arr = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) {
    arr[i] = bytes.charCodeAt(i)
  }
  return new Blob([arr], { type: mime })
}

// ── Wipe all data ───────────────────────────────────────

export async function clearAllData(): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(['issues', 'entries', 'attachments'], 'readwrite')
  await tx.objectStore('issues').clear()
  await tx.objectStore('entries').clear()
  await tx.objectStore('attachments').clear()
  await tx.done
}