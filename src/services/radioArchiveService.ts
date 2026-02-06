import { ArchivedRadio } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export class RadioArchiveService {
  static async getAll(): Promise<ArchivedRadio[]> {
    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/radios_archive?select=*&order=archived_at.desc`,
        {
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data || []
    } catch (error) {
      console.error('Failed to fetch archived radios:', error)
      throw error
    }
  }

  /** Fetch one archived row by archive_id (UUID) or by id (legacy/original radio id). */
  static async getById(archiveIdOrId: string): Promise<ArchivedRadio | null> {
    if (!archiveIdOrId || archiveIdOrId === 'undefined') {
      return null
    }
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(archiveIdOrId)
      const filter = isUuid ? `archive_id=eq.${archiveIdOrId}` : `id=eq.${encodeURIComponent(archiveIdOrId)}`
      const response = await fetch(
        `${supabaseUrl}/rest/v1/radios_archive?${filter}&select=*`,
        {
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const row = data[0] || null
      if (row && !row.archive_id && row.id) {
        row.archive_id = row.id
      }
      return row
    } catch (error) {
      console.error('Failed to fetch archived radio:', error)
      throw error
    }
  }
}
