import { supabase } from '../lib/supabase'
import {
  Groep,
  Structuur,
  Afdeling,
  GroepFormData,
  StructuurFormData,
  AfdelingFormData,
  OrganizationStats
} from '../types'

export const OrganizationService = {
  // Groepen (Groups) operations
  async getAllGroepen(): Promise<Groep[]> {
    const { data, error } = await supabase
      .from('groepen')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data || []
  },

  async createGroep(groepData: GroepFormData): Promise<Groep> {
    const { data, error } = await supabase
      .from('groepen')
      .insert([groepData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateGroep(id: string, groepData: Partial<GroepFormData>): Promise<Groep> {
    const { data, error } = await supabase
      .from('groepen')
      .update(groepData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deleteGroep(id: string): Promise<void> {
    const { error } = await supabase
      .from('groepen')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // Structuren (Structures) operations
  async getStructurenByGroep(groepId: string): Promise<Structuur[]> {
    const { data, error } = await supabase
      .from('structuren')
      .select('*')
      .eq('groep_id', groepId)
      .order('name')
    
    if (error) throw error
    return data || []
  },

  async createStructuur(structuurData: StructuurFormData): Promise<Structuur> {
    const { data, error } = await supabase
      .from('structuren')
      .insert([structuurData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateStructuur(id: string, structuurData: Partial<StructuurFormData>): Promise<Structuur> {
    const { data, error } = await supabase
      .from('structuren')
      .update(structuurData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deleteStructuur(id: string): Promise<void> {
    const { error } = await supabase
      .from('structuren')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // Afdelingen (Departments) operations
  async getAfdelingenByStructuur(structuurId: string): Promise<Afdeling[]> {
    const { data, error } = await supabase
      .from('afdelingen')
      .select('*')
      .eq('structuur_id', structuurId)
      .order('name')
    
    if (error) throw error
    return data || []
  },

  async createAfdeling(afdelingData: AfdelingFormData): Promise<Afdeling> {
    const { data, error } = await supabase
      .from('afdelingen')
      .insert([afdelingData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateAfdeling(id: string, afdelingData: Partial<AfdelingFormData>): Promise<Afdeling> {
    const { data, error } = await supabase
      .from('afdelingen')
      .update(afdelingData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deleteAfdeling(id: string): Promise<void> {
    const { error } = await supabase
      .from('afdelingen')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // Stats
  async getStats(): Promise<OrganizationStats> {
    const [groepenResult, structurenResult, afdelingenResult] = await Promise.all([
      supabase.from('groepen').select('id', { count: 'exact', head: true }),
      supabase.from('structuren').select('id', { count: 'exact', head: true }),
      supabase.from('afdelingen').select('id', { count: 'exact', head: true })
    ])

    if (groepenResult.error) throw groepenResult.error
    if (structurenResult.error) throw structurenResult.error
    if (afdelingenResult.error) throw afdelingenResult.error

    return {
      total_groepen: groepenResult.count || 0,
      total_structuren: structurenResult.count || 0,
      total_afdelingen: afdelingenResult.count || 0
    }
  }
}

