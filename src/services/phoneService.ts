import { Phone, PhoneFormData } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export class PhoneService {
  static async getAll(): Promise<Phone[]> {
    const response = await fetch(`${supabaseUrl}/rest/v1/phones?select=*&order=created_at.desc`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
    })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const data = await response.json()
    return data || []
  }

  static async getById(id: string): Promise<Phone | null> {
    const response = await fetch(`${supabaseUrl}/rest/v1/phones?id=eq.${id}&select=*`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
    })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const data = await response.json()
    return data[0] || null
  }

  static async getBySerialNumber(serienummer: string): Promise<Phone | null> {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/phones?serienummer=eq.${encodeURIComponent(serienummer)}&select=*`,
      {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
      }
    )
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const data = await response.json()
    return data[0] || null
  }

  static async create(data: PhoneFormData): Promise<Phone> {
    const response = await fetch(`${supabaseUrl}/rest/v1/phones`, {
      method: 'POST',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const err = await response.text()
      throw new Error(`HTTP error! status: ${response.status} - ${err}`)
    }
    const result = await response.json()
    return result[0]
  }

  static async update(id: string, data: Partial<PhoneFormData>): Promise<Phone> {
    const response = await fetch(`${supabaseUrl}/rest/v1/phones?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const result = await response.json()
    return result[0]
  }

  static async delete(id: string): Promise<void> {
    const response = await fetch(`${supabaseUrl}/rest/v1/phones?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
    })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
  }

  static async getStats(): Promise<{
    total: number
    smart_phone: number
    dumb_phone: number
    wired_phone: number
    wireless_phone: number
  }> {
    const response = await fetch(`${supabaseUrl}/rest/v1/phones?select=type`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
    })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const data = await response.json()
    const list = data || []
    return {
      total: list.length,
      smart_phone: list.filter((p: { type: string }) => p.type === 'Smart Phone').length,
      dumb_phone: list.filter((p: { type: string }) => p.type === 'Dumb Phone').length,
      wired_phone: list.filter((p: { type: string }) => p.type === 'Wired Phone').length,
      wireless_phone: list.filter((p: { type: string }) => p.type === 'Wireless Phone').length,
    }
  }
}
