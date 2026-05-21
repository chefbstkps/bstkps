import { Radio, RadioFormData, RadioHistory } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export class RadioService {
  static async getAll(): Promise<Radio[]> {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/radios?select=*&order=created_at.desc`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data || []
    } catch (error) {
      console.error('Failed to fetch radios:', error)
      throw error
    }
  }

  static async getById(id: string): Promise<Radio | null> {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/radios?id=eq.${id}&select=*`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data[0] || null
    } catch (error) {
      console.error('Failed to fetch radio:', error)
      throw error
    }
  }

  static async getBySerialNumber(serienummer: string): Promise<Radio | null> {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/radios?serienummer=eq.${encodeURIComponent(serienummer)}&select=*`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data[0] || null
    } catch (error) {
      console.error('Failed to fetch radio by serial number:', error)
      throw error
    }
  }

  static async create(radioData: RadioFormData): Promise<Radio> {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/radios`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(radioData)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Supabase error response:', errorText)
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      return data[0]
    } catch (error) {
      console.error('Failed to create radio:', error)
      throw error
    }
  }

  static async update(id: string, radioData: Partial<RadioFormData>): Promise<Radio> {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/radios?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(radioData)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data[0]
    } catch (error) {
      console.error('Failed to update radio:', error)
      throw error
    }
  }

  static async delete(id: string, archivedBy?: string | null): Promise<void> {
    try {
      // Archive the radio before deleting (same id/serienummer may be archived multiple times)
      const radio = await this.getById(id)
      if (radio) {
        const archiveResponse = await fetch(`${supabaseUrl}/rest/v1/radios_archive`, {
          method: 'POST',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            id: radio.id,
            merk: radio.merk,
            model: radio.model,
            type: radio.type,
            serienummer: radio.serienummer,
            alias: radio.alias,
            afdeling: radio.afdeling,
            groep: radio.groep ?? undefined,
            structuur: radio.structuur ?? undefined,
            voertuig: radio.voertuig ?? undefined,
            opmerking: radio.opmerking ?? undefined,
            status: radio.status,
            registratiedatum: radio.registratiedatum,
            created_at: radio.created_at ?? undefined,
            updated_at: radio.updated_at ?? undefined,
            archived_at: new Date().toISOString(),
            archived_by: archivedBy ?? undefined
          })
        })
        if (!archiveResponse.ok) {
          const errText = await archiveResponse.text()
          console.warn('Archive failed (continuing with delete):', errText)
          // Continue with delete even if archive fails (e.g. table not yet created)
        }
      }

      const response = await fetch(`${supabaseUrl}/rest/v1/radios?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      console.error('Failed to delete radio:', error)
      throw error
    }
  }

  static async getHistoryById(historyId: string): Promise<RadioHistory | null> {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/radio_history?id=eq.${historyId}&select=*`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data[0] || null
    } catch (error) {
      console.error('Failed to fetch radio history by id:', error)
      throw error
    }
  }

  static async getAllHistory(): Promise<RadioHistory[]> {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/radio_history?select=*&order=timestamp.desc`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data || []
    } catch (error) {
      console.error('Failed to fetch all radio history:', error)
      throw error
    }
  }

  static async getHistory(radioId: string): Promise<RadioHistory[]> {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/radio_history?radio_id=eq.${radioId}&select=*&order=timestamp.desc`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data || []
    } catch (error) {
      console.error('Failed to fetch radio history:', error)
      throw error
    }
  }

  static async addHistoryEntry(radioId: string, action: string, description: string, details?: any, executedBy?: string | null): Promise<RadioHistory> {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/radio_history`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          radio_id: radioId,
          action,
          description,
          ...(details != null && { details }),
          timestamp: new Date().toISOString(),
          ...(executedBy != null && executedBy !== '' && { executed_by: executedBy })
        })
      })

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}))
        const msg = errBody?.message ?? errBody?.error_description ?? response.statusText
        throw new Error(`HTTP error! status: ${response.status}${msg ? ` - ${msg}` : ''}`)
      }

      const data = await response.json()
      return data[0]
    } catch (error) {
      console.error('Failed to add history entry:', error)
      throw error
    }
  }

  static async getStats(): Promise<{
    total: number
    portable: number
    mobile: number
    base: number
  }> {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/radios?select=type`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      const stats = {
        total: data?.length || 0,
        portable: data?.filter((r: any) => r.type === 'Portable').length || 0,
        mobile: data?.filter((r: any) => r.type === 'Mobile').length || 0,
        base: data?.filter((r: any) => r.type === 'Base').length || 0,
      }

      return stats
    } catch (error) {
      console.error('Failed to fetch radio stats:', error)
      throw error
    }
  }
}
