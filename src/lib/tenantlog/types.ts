export type IssueStatus = 'open' | 'in_progress' | 'resolved'

export type IssueCategory =
  | 'leak'
  | 'appliance'
  | 'damage'
  | 'mold'
  | 'heating'
  | 'plumbing'
  | 'electrical'
  | 'cleanliness'
  | 'other'

export type EntryType =
  | 'observation'
  | 'landlord_contact'
  | 'landlord_reply'
  | 'follow_up'
  | 'repair_visit'
  | 'correction'
  | 'other'

export type CommsMethod = 'text' | 'email' | 'phone' | 'in_person' | 'portal'

export interface CommsInfo {
  method: CommsMethod
  contactedOn: string // ISO date (event date of contact)
}

export interface Issue {
  id: string
  title: string
  room: string
  category: IssueCategory
  noticedOn: string // ISO event date
  description: string
  status: IssueStatus
  createdAt: string // ISO timestamp
  updatedAt: string // ISO timestamp
}

export interface TimelineEntry {
  id: string
  issueId: string
  eventDate: string // ISO event date (when the event happened)
  type: EntryType
  note: string
  createdAt: string // ISO timestamp (when entry was logged)
  correctsEntryId: string | null
  comms: CommsInfo | null
  attachmentIds: string[]
}

export interface Attachment {
  id: string
  issueId: string
  entryId: string
  name: string
  mimeType: string
  size: number
  blob: Blob
}

export interface IssueWithMeta extends Issue {
  entryCount: number
  lastEntrySummary: string | null
  lastEntryDate: string | null
}

export interface EntryWithAttachments extends TimelineEntry {
  attachments: AttachmentMeta[]
}

export interface AttachmentMeta {
  id: string
  name: string
  mimeType: string
  size: number
}

export interface NewIssueInput {
  title: string
  room: string
  category: IssueCategory
  noticedOn: string
  description: string
  contactedLandlord: boolean
  contactedOn?: string
  commsMethod?: CommsMethod
  files: File[]
  commsFiles?: File[]
}

export interface NewEntryInput {
  issueId: string
  eventDate: string
  type: EntryType
  note: string
  files: File[]
  correctsEntryId?: string | null
}

export const CATEGORY_LABELS: Record<IssueCategory, string> = {
  leak: 'Leak',
  appliance: 'Appliance',
  damage: 'Damage',
  mold: 'Mold / Moisture',
  heating: 'Heating',
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  cleanliness: 'Cleanliness',
  other: 'Other',
}

export const STATUS_LABELS: Record<IssueStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
}

export const ENTRY_TYPE_LABELS: Record<EntryType, string> = {
  observation: 'Observation',
  landlord_contact: 'Landlord contact',
  landlord_reply: 'Landlord reply',
  follow_up: 'Follow-up',
  repair_visit: 'Repair visit',
  correction: 'Correction',
  other: 'Other',
}

export const COMMS_METHOD_LABELS: Record<CommsMethod, string> = {
  text: 'Text message',
  email: 'Email',
  phone: 'Phone call',
  in_person: 'In person',
  portal: 'Online portal',
}
