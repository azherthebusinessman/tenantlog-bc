import { useEffect, useState } from 'react'
import type { Attachment } from '../lib/tenantlog/types'

interface AttachmentGridProps {
  attachments: AttachmentMeta[]
  onPreview?: (attachment: Attachment) => void
}

export interface AttachmentMeta {
  id: string
  name: string
  mimeType: string
  size: number
  blob?: Blob
}

export function AttachmentGrid({ attachments }: AttachmentGridProps) {
  if (attachments.length === 0) return null

  const images = attachments.filter((a) => a.mimeType.startsWith('image/') && a.blob)
  const files = attachments.filter((a) => !a.mimeType.startsWith('image/') || !a.blob)

  return (
    <>
      {images.length > 0 && (
        <div className="attachment-grid">
          {images.map((img) => (
            <ImageThumb key={img.id} name={img.name} blob={img.blob!} />
          ))}
        </div>
      )}
      {files.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
          {files.map((f) => (
            <div key={f.id} className="attachment-file">
              <span className="attachment-file-icon">📎</span>
              <span>{f.name}</span>
              <span className="text-xs muted" style={{ marginLeft: 'auto' }}>
                {formatSize(f.size)}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function ImageThumb({ name, blob }: { name: string; blob: Blob }) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    const u = URL.createObjectURL(blob)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [blob])

  return (
    <div className="attachment-thumb" title={name}>
      {url && <img src={url} alt={name} loading="lazy" />}
    </div>
  )
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
