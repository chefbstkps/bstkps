import { Storing, StoringFormData, StoringFeedback, StoringFeedbackFormData, StoringWithFeedback, StoringStats } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const storingService = {
  // Get all storingen with optional filtering
  async getStoringen(filters?: {
    soort_storing?: string
    betrokken_afdeling?: string
    is_afgehandeld?: boolean
  }) {
    try {
      let url = `${supabaseUrl}/rest/v1/storingen?select=*,storing_feedback(*)&order=created_at.desc`
      
      if (filters?.soort_storing) {
        url += `&soort_storing=eq.${encodeURIComponent(filters.soort_storing)}`
      }
      if (filters?.betrokken_afdeling) {
        url += `&betrokken_afdeling=eq.${encodeURIComponent(filters.betrokken_afdeling)}`
      }

      const response = await fetch(url, {
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
      
      // Transform storing_feedback to feedback for consistency
      const transformedData = data.map((storing: any) => ({
        ...storing,
        feedback: storing.storing_feedback || []
      }))
      
      // Filter by is_afgehandeld if needed
      let filteredData = transformedData
      if (filters?.is_afgehandeld !== undefined) {
        filteredData = transformedData.filter((storing: any) => {
          const hasFeedback = storing.feedback && storing.feedback.length > 0
          const isAfgehandeld = hasFeedback && storing.feedback.some((f: any) => f.is_afgehandeld)
          return filters.is_afgehandeld ? isAfgehandeld : !isAfgehandeld
        })
      }

      return filteredData as StoringWithFeedback[]
    } catch (error) {
      console.error('Failed to fetch storingen:', error)
      throw error
    }
  },

  // Get single storing by ID
  async getStoringById(id: string) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/storingen?id=eq.${id}&select=*,storing_feedback(*)`, {
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
      const storing = data[0]
      
      // Transform storing_feedback to feedback for consistency
      return {
        ...storing,
        feedback: storing.storing_feedback || []
      } as StoringWithFeedback
    } catch (error) {
      console.error('Failed to fetch storing by ID:', error)
      throw error
    }
  },

  // Get next storingnummer
  async getNextStoringnummer() {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/storingen?select=storingnummer&order=storingnummer.desc&limit=1`, {
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

      if (!data || data.length === 0) {
        return '7000001'
      }

      const lastNumber = parseInt(data[0].storingnummer)
      const nextNumber = lastNumber + 1
      return nextNumber.toString()
    } catch (error) {
      console.error('Failed to get next storingnummer:', error)
      throw error
    }
  },

  // Create new storing
  async createStoring(formData: StoringFormData) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/storingen`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data[0] as Storing
    } catch (error) {
      console.error('Failed to create storing:', error)
      throw error
    }
  },

  // Update storing
  async updateStoring(id: string, formData: Partial<StoringFormData>) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/storingen?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data[0] as Storing
    } catch (error) {
      console.error('Failed to update storing:', error)
      throw error
    }
  },

  // Delete storing
  async deleteStoring(id: string) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/storingen?id=eq.${id}`, {
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
      console.error('Failed to delete storing:', error)
      throw error
    }
  },

  // Add feedback to storing
  async addFeedback(storingId: string, feedbackData: StoringFeedbackFormData) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/storing_feedback`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          storing_id: storingId,
          ...feedbackData
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data[0] as StoringFeedback
    } catch (error) {
      console.error('Failed to add feedback:', error)
      throw error
    }
  },

  // Update feedback
  async updateFeedback(feedbackId: string, feedbackData: Partial<StoringFeedbackFormData>) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/storing_feedback?id=eq.${feedbackId}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(feedbackData)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data[0] as StoringFeedback
    } catch (error) {
      console.error('Failed to update feedback:', error)
      throw error
    }
  },

  // Delete feedback
  async deleteFeedback(feedbackId: string) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/storing_feedback?id=eq.${feedbackId}`, {
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
      console.error('Failed to delete feedback:', error)
      throw error
    }
  },

  // Get storingen statistics
  async getStoringStats() {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/storingen?select=soort_storing,storing_feedback(is_afgehandeld)`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const storingen = await response.json()

      const total_storingen = storingen.length
      const afgehandelde_storingen = storingen.filter((s: any) => 
        s.storing_feedback && s.storing_feedback.some((f: any) => f.is_afgehandeld)
      ).length
      const open_storingen = total_storingen - afgehandelde_storingen

      const storingen_per_soort = storingen.reduce((acc: any, storing: any) => {
        const soort = storing.soort_storing.toLowerCase()
        if (soort === 'radio' || soort === 'telefonie' || soort === 'waarschuwingsapparatuur') {
          acc[soort as keyof typeof acc] = (acc[soort as keyof typeof acc] || 0) + 1
        }
        return acc
      }, {} as { radio: number; telefonie: number; waarschuwingsapparatuur: number })

      return {
        total_storingen,
        open_storingen,
        afgehandelde_storingen,
        storingen_per_soort: {
          radio: storingen_per_soort.radio || 0,
          telefonie: storingen_per_soort.telefonie || 0,
          waarschuwingsapparatuur: storingen_per_soort.waarschuwingsapparatuur || 0
        }
      } as StoringStats
    } catch (error) {
      console.error('Failed to get storing stats:', error)
      throw error
    }
  },

  // Search storingen
  async searchStoringen(searchTerm: string) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/storingen?select=*,storing_feedback(*)&or=storingnummer.ilike.%${searchTerm}%,adres.ilike.%${searchTerm}%,naam_contactpersoon.ilike.%${searchTerm}%,aard_storing.ilike.%${searchTerm}%&order=created_at.desc`, {
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
      
      // Transform storing_feedback to feedback for consistency
      const transformedData = data.map((storing: any) => ({
        ...storing,
        feedback: storing.storing_feedback || []
      }))
      
      return transformedData as StoringWithFeedback[]
    } catch (error) {
      console.error('Failed to search storingen:', error)
      throw error
    }
  }
}
