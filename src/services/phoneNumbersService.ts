import { supabase } from '../lib/supabase'
import type { PhoneNumber, PhoneNumberFormData } from '../types'

export class PhoneNumbersService {
  static async getAll(): Promise<PhoneNumber[]> {
    const { data, error } = await supabase
      .from('phone_numbers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data || []
  }

  static async getById(id: string): Promise<PhoneNumber | null> {
    const { data, error } = await supabase
      .from('phone_numbers')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(error.message)
    }
    return data
  }

  static async create(formData: PhoneNumberFormData): Promise<PhoneNumber> {
    const { data, error } = await supabase
      .from('phone_numbers')
      .insert([formData])
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  }

  static async update(id: string, formData: Partial<PhoneNumberFormData>): Promise<PhoneNumber> {
    const { data, error } = await supabase
      .from('phone_numbers')
      .update(formData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('phone_numbers')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)
  }
}
