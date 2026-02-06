/**
 * Client-side image compression for uploads.
 * Resizes and compresses images to reduce storage and bandwidth.
 */

const DEFAULT_MAX_WIDTH = 1920
const DEFAULT_MAX_HEIGHT = 1920
const DEFAULT_JPEG_QUALITY = 0.85
const DEFAULT_MAX_SIZE_KB = 500

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export interface CompressionOptions {
  /** Max width in pixels (keeps aspect ratio) */
  maxWidth?: number
  /** Max height in pixels (keeps aspect ratio) */
  maxHeight?: number
  /** JPEG quality 0–1 (only when output is JPEG) */
  quality?: number
  /** Target max file size in KB; quality is reduced until under this (approximate) */
  maxSizeKB?: number
  /** Output MIME: 'image/jpeg' saves most space; 'image/png' keeps transparency */
  outputType?: 'image/jpeg' | 'image/png'
}

const defaultOptions: Required<Omit<CompressionOptions, 'maxSizeKB'>> & { maxSizeKB?: number } = {
  maxWidth: DEFAULT_MAX_WIDTH,
  maxHeight: DEFAULT_MAX_HEIGHT,
  quality: DEFAULT_JPEG_QUALITY,
  maxSizeKB: DEFAULT_MAX_SIZE_KB,
  outputType: 'image/jpeg',
}

export function isImageFile(file: File): boolean {
  return IMAGE_TYPES.includes(file.type as (typeof IMAGE_TYPES)[number])
}

/**
 * Compress an image file: resize to max dimensions and reduce quality/size.
 * Non-image files are returned unchanged.
 */
export function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  if (!isImageFile(file)) {
    return Promise.resolve(file)
  }

  const opts = { ...defaultOptions, ...options }

  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      const { width, height } = img
      let targetWidth = width
      let targetHeight = height

      if (width > opts.maxWidth || height > opts.maxHeight) {
        const ratio = Math.min(opts.maxWidth / width, opts.maxHeight / height)
        targetWidth = Math.round(width * ratio)
        targetHeight = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = targetWidth
      canvas.height = targetHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(file)
        return
      }

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

      const tryBlob = (quality: number) => {
        return new Promise<Blob>((res, rej) => {
          canvas.toBlob(
            (blob) => (blob ? res(blob) : rej(new Error('toBlob failed'))),
            opts.outputType,
            quality
          )
        })
      }

      const finish = (blob: Blob, _usedQuality: number) => {
        const ext = opts.outputType === 'image/png' ? 'png' : 'jpg'
        const name = file.name.replace(/\.[^.]+$/i, '') || 'image'
        const newFile = new File([blob], `${name}.${ext}`, {
          type: opts.outputType,
          lastModified: Date.now(),
        })
        resolve(newFile)
      }

      const maxSizeKB = opts.maxSizeKB ?? 0
      const isJpeg = opts.outputType === 'image/jpeg'

      if (maxSizeKB <= 0 || !isJpeg) {
        tryBlob(opts.quality).then((blob) => finish(blob, opts.quality)).catch(reject)
        return
      }

      // Try to get under maxSizeKB by lowering quality (JPEG only)
      let quality = opts.quality
      const tryNext = () => {
        tryBlob(quality)
          .then((blob) => {
            if (blob.size / 1024 <= maxSizeKB || quality <= 0.2) {
              finish(blob, quality)
            } else {
              quality = Math.max(0.2, quality - 0.15)
              tryNext()
            }
          })
          .catch(reject)
      }
      tryNext()
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}
