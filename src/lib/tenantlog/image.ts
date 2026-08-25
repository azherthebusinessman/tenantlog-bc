// Downscales images to max dimension and re-encodes as JPEG.
// Non-image files pass through untouched.

const MAX_DIMENSION = 1600
const JPEG_QUALITY = 0.82

export async function processFile(file: File): Promise<{ blob: Blob; name: string; mimeType: string }> {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    return { blob: file, name: file.name, mimeType: file.type || 'application/octet-stream' }
  }

  const bitmap = await loadBitmap(file)
  const { width, height } = scaleDimensions(bitmap.width, bitmap.height, MAX_DIMENSION)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')
  ctx.drawImage(bitmap, 0, 0, width, height)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Failed to encode image'))),
      'image/jpeg',
      JPEG_QUALITY,
    )
  })

  if ('close' in bitmap && typeof bitmap.close === 'function') bitmap.close()

  // Preserve original name but mark as jpeg-processed
  const baseName = file.name.replace(/\.[^.]+$/, '')
  return { blob, name: `${baseName}.jpg`, mimeType: 'image/jpeg' }
}

function scaleDimensions(w: number, h: number, max: number): { width: number; height: number } {
  if (w <= max && h <= max) return { width: w, height: h }
  if (w >= h) {
    return { width: max, height: Math.round((h / w) * max) }
  }
  return { width: Math.round((w / h) * max), height: max }
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file)
    } catch {
      // fall through to <img>
    }
  }
  return loadImgElement(file)
}

function loadImgElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    img.src = url
  })
}
