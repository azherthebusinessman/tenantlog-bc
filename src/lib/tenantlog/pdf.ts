import type { Attachment } from './types'
import { getIssue, getEntriesByIssue, getAttachmentsByIssue } from './store'
import { jsPDF } from 'jspdf'
import { localTimestampISO, localDateISO, formatDate, formatTimestamp } from './dates'

const DISCLAIMER =
  'This document is a record you created and stored locally in your browser. ' +
  'TenantLog BC does not verify when events happened or that this record is ' +
  'legally sufficient. It is your personal documentation of the issue.'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'issue'
}

const PAGE_MARGIN = 56 // 0.78in
const PAGE_WIDTH = 595.28 // A4 in pt
const PAGE_HEIGHT = 841.89

export async function exportIssuePdf(issueId: string): Promise<void> {
  const issue = await getIssue(issueId)
  if (!issue) throw new Error('Issue not found')

  const entries = await getEntriesByIssue(issueId)
  const allAttachments = await getAttachmentsByIssue(issueId)

  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  const contentWidth = PAGE_WIDTH - PAGE_MARGIN * 2

  let y = PAGE_MARGIN

  // ── Cover block ─────────────────────────────────
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(20)
  pdf.setTextColor(30, 27, 22)
  const titleLines = pdf.splitTextToSize(issue.title, contentWidth)
  pdf.text(titleLines, PAGE_MARGIN, y + 8)
  y += titleLines.length * 24 + 16

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(11)
  pdf.setTextColor(90, 82, 72)

  const meta: [string, string][] = [
    ['Room / Location', issue.room],
    ['Category', issue.category.replace(/_/g, ' ')],
    ['Date first noticed', formatDate(issue.noticedOn)],
    ['Current status', issue.status.replace(/_/g, ' ')],
    ['Exported on', formatTimestamp(localTimestampISO())],
  ]

  for (const [label, value] of meta) {
    pdf.setFont('helvetica', 'bold')
    pdf.text(`${label}:`, PAGE_MARGIN, y)
    pdf.setFont('helvetica', 'normal')
    pdf.text(value, PAGE_MARGIN + 140, y)
    y += 16
  }

  y += 8
  pdf.setFont('helvetica', 'italic')
  pdf.setFontSize(9)
  pdf.setTextColor(120, 110, 100)
  const disclaimerLines = pdf.splitTextToSize(DISCLAIMER, contentWidth)
  pdf.text(disclaimerLines, PAGE_MARGIN, y)
  y += disclaimerLines.length * 12 + 4
  pdf.text(
    'Source records are stored locally in this browser. This exported PDF is a separate copy.',
    PAGE_MARGIN,
    y,
  )
  y += 20

  // Divider
  pdf.setDrawColor(200, 192, 180)
  pdf.setLineWidth(0.5)
  pdf.line(PAGE_MARGIN, y, PAGE_WIDTH - PAGE_MARGIN, y)
  y += 24

  // ── Timeline ────────────────────────────────────
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(14)
  pdf.setTextColor(30, 27, 22)
  pdf.text('Timeline', PAGE_MARGIN, y)
  y += 20

  // Build a map of attachment number -> attachment
  const attachmentNumberMap = new Map<string, number>()
  const photoAttachments: Attachment[] = []
  allAttachments.forEach((att, i) => {
    attachmentNumberMap.set(att.id, i + 1)
    if (att.mimeType.startsWith('image/')) {
      photoAttachments.push(att)
    }
  })

  const entryTypeLabels: Record<string, string> = {
    observation: 'Observation',
    landlord_contact: 'Landlord contact',
    landlord_reply: 'Landlord reply',
    follow_up: 'Follow-up',
    repair_visit: 'Repair visit',
    correction: 'Correction',
    other: 'Other',
  }

  for (const entry of entries) {
    if (y > PAGE_HEIGHT - 80) {
      pdf.addPage()
      y = PAGE_MARGIN
    }

    // Entry header
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(11)
    pdf.setTextColor(30, 27, 22)
    pdf.text(formatDate(entry.eventDate), PAGE_MARGIN, y)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(120, 60, 40)
    pdf.text(`— ${entryTypeLabels[entry.type] ?? entry.type}`, PAGE_MARGIN + 130, y)
    y += 14

    // "added to TenantLog on"
    pdf.setFont('helvetica', 'italic')
    pdf.setFontSize(8)
    pdf.setTextColor(140, 130, 120)
    pdf.text(`Added to TenantLog on ${formatTimestamp(entry.createdAt)}`, PAGE_MARGIN, y)
    y += 12

    // Correction marker
    if (entry.correctsEntryId) {
      const corrected = entries.find((e) => e.id === entry.correctsEntryId)
      if (corrected) {
        pdf.setFont('helvetica', 'italic')
        pdf.setFontSize(9)
        pdf.setTextColor(120, 80, 40)
        pdf.text(`Correction to the ${formatDate(corrected.eventDate)} entry`, PAGE_MARGIN, y)
        y += 12
      }
    }

    // Note
    if (entry.note) {
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(10)
      pdf.setTextColor(60, 54, 48)
      const noteLines = pdf.splitTextToSize(entry.note, contentWidth)
      for (const line of noteLines) {
        if (y > PAGE_HEIGHT - 40) {
          pdf.addPage()
          y = PAGE_MARGIN
        }
        pdf.text(line, PAGE_MARGIN, y)
        y += 13
      }
    }

    // Comms info
    if (entry.comms) {
      pdf.setFont('helvetica', 'italic')
      pdf.setFontSize(9)
      pdf.setTextColor(90, 82, 72)
      const commsText = `Contact method: ${entry.comms.method.replace(/_/g, ' ')}, contacted on ${formatDate(entry.comms.contactedOn)}`
      const commsLines = pdf.splitTextToSize(commsText, contentWidth)
      for (const line of commsLines) {
        if (y > PAGE_HEIGHT - 40) {
          pdf.addPage()
          y = PAGE_MARGIN
        }
        pdf.text(line, PAGE_MARGIN, y)
        y += 12
      }
    }

    // Attachment references
    if (entry.attachmentIds.length > 0) {
      const refs: string[] = []
      for (const attId of entry.attachmentIds) {
        const num = attachmentNumberMap.get(attId)
        const att = allAttachments.find((a) => a.id === attId)
        if (num && att) {
          refs.push(`#${num} (${att.name})`)
        }
      }
      if (refs.length > 0) {
        pdf.setFont('helvetica', 'italic')
        pdf.setFontSize(9)
        pdf.setTextColor(100, 92, 82)
        const refText = `Attachments: ${refs.join(', ')}`
        const refLines = pdf.splitTextToSize(refText, contentWidth)
        for (const line of refLines) {
          if (y > PAGE_HEIGHT - 40) {
            pdf.addPage()
            y = PAGE_MARGIN
          }
          pdf.text(line, PAGE_MARGIN, y)
          y += 12
        }
      }
    }

    y += 14
  }

  // ── Photo pages ─────────────────────────────────
  for (const att of photoAttachments) {
    const num = attachmentNumberMap.get(att.id)!
    pdf.addPage()
    y = PAGE_MARGIN

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(12)
    pdf.setTextColor(30, 27, 22)
    pdf.text(`Attachment #${num}`, PAGE_MARGIN, y)
    y += 14
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.setTextColor(100, 92, 82)
    pdf.text(att.name, PAGE_MARGIN, y)
    y += 16

    const dataUrl = await blobToDataURL(att.blob)
    const imgProps = pdf.getImageProperties(dataUrl)
    const maxW = contentWidth
    const maxH = PAGE_HEIGHT - y - PAGE_MARGIN - 20
    const ratio = Math.min(maxW / imgProps.width, maxH / imgProps.height, 1)
    const imgW = imgProps.width * ratio
    const imgH = imgProps.height * ratio

    let format: 'JPEG' | 'PNG'
    if (att.mimeType === 'image/jpeg') {
      format = 'JPEG'
    } else if (att.mimeType === 'image/png') {
      format = 'PNG'
    } else {
      format = 'JPEG'
    }

    pdf.addImage(dataUrl, format, PAGE_MARGIN, y, imgW, imgH)
  }

  const filename = `tenantlog-${slugify(issue.title)}-${localDateISO()}.pdf`
  pdf.save(filename)
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read blob'))
    reader.readAsDataURL(blob)
  })
}
