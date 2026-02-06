import { supabase } from '../lib/supabase'
import { compressImage, isImageFile, type CompressionOptions } from '../lib/imageCompression'

export interface UploadOptions {
  /** Compress images before upload to reduce storage (default: true) */
  compress?: boolean
  /** Options passed to image compression when compress is true */
  compressionOptions?: CompressionOptions
  /** Overwrite if file already exists (default: false) */
  upsert?: boolean
}

const DEFAULT_BUCKET = 'uploads'

/**
 * Upload a file to Supabase Storage.
 * For image files, compression can be enabled to reduce file size before upload.
 */
export async function uploadFile(
  file: File,
  path: string,
  options: UploadOptions & { bucket?: string } = {}
): Promise<{ path: string; url: string | null; error: Error | null }> {
  const {
    bucket = DEFAULT_BUCKET,
    compress = true,
    compressionOptions,
    upsert = false,
  } = options

  let fileToUpload = file

  if (compress && isImageFile(file)) {
    try {
      fileToUpload = await compressImage(file, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.85,
        maxSizeKB: 500,
        outputType: 'image/jpeg',
        ...compressionOptions,
      })
    } catch (err) {
      console.warn('Image compression failed, uploading original:', err)
    }
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, fileToUpload, {
      cacheControl: '3600',
      upsert,
    })

  if (error) {
    return { path: '', url: null, error }
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)
  return { path: data.path, url: urlData?.publicUrl ?? null, error: null }
}

/**
 * Get a public URL for a file in storage.
 */
export function getPublicUrl(path: string, bucket: string = DEFAULT_BUCKET): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

/**
 * Delete a file from Supabase Storage.
 */
export async function deleteFile(
  path: string,
  bucket: string = DEFAULT_BUCKET
): Promise<{ error: Error | null }> {
  const { error } = await supabase.storage.from(bucket).remove([path])
  return { error }
}
