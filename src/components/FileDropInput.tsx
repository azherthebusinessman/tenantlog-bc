import { useRef, useState, type DragEvent, type ChangeEvent } from 'react'

interface FileDropInputProps {
  files: File[]
  onFilesChange: (files: File[]) => void
  accept?: string
  capture?: boolean
  label?: string
  hint?: string
}

export function FileDropInput({
  files,
  onFilesChange,
  accept = 'image/*,application/pdf',
  capture = false,
  label = 'Add photos or files',
  hint = 'Images are downscaled automatically. Tap on mobile to use camera.',
}: FileDropInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    const dropped = Array.from(e.dataTransfer.files)
    onFilesChange([...files, ...dropped])
  }

  function handleSelect(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      onFilesChange([...files, ...Array.from(e.target.files)])
    }
    e.target.value = ''
  }

  function removeFile(idx: number) {
    onFilesChange(files.filter((_, i) => i !== idx))
  }

  return (
    <div>
      <div
        className={`file-drop ${dragging ? 'dragging' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--ink)' }}>
          {label}
        </div>
        <div className="file-drop-hint">{hint}</div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          capture={capture ? 'environment' : undefined}
          multiple
          onChange={handleSelect}
          style={{ display: 'none' }}
        />
      </div>
      {files.length > 0 && (
        <div className="file-list">
          {files.map((file, idx) => (
            <span key={idx} className="file-chip">
              <span>{file.name}</span>
              <button
                type="button"
                className="file-chip-remove"
                onClick={(e) => {
                  e.stopPropagation()
                  removeFile(idx)
                }}
                aria-label={`Remove ${file.name}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
