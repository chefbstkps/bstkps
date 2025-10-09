// Radio types
export interface Radio {
  id: string
  merk: string
  model: string
  type: 'Portable' | 'Mobile' | 'Base'
  serienummer: string
  alias: string
  afdeling: string
  groep?: string
  voertuig?: string
  opmerking?: string
  registratiedatum: string
  created_at: string
  updated_at: string
}

export interface RadioHistory {
  id: string
  radio_id: string
  action: 'battery_replaced' | 'serviced' | 'department_changed' | 'alias_changed' | 'id_changed' | 'issued' | 'installed'
  description: string
  timestamp: string
  details?: {
    old_value?: string
    new_value?: string
    service_date?: string
    notes?: string
    vehicle_info?: {
      merk: string
      model: string
      afdeling: string
    }
  }
}

// Accessory types
export interface Accessory {
  id: string
  merk: string
  model: string
  serienummer?: string
  alias?: string
  opmerking?: string
  created_at: string
  updated_at: string
}

// Issue/Assignment types
export interface Issue {
  id: string
  item_type: 'radio' | 'accessory'
  item_id: string
  afdeling: string
  issued_to: string
  issued_at: string
  notes?: string
}

export interface Installation {
  id: string
  item_type: 'radio' | 'accessory'
  item_id: string
  vehicle_merk: string
  vehicle_model: string
  vehicle_afdeling: string
  installed_at: string
  notes?: string
}

// Dashboard types
export interface DashboardStats {
  total_radios: number
  portable_radios: number
  mobile_radios: number
  base_radios: number
  total_accessories: number
  recent_installations: Installation[]
  recent_issues: Issue[]
  recent_registrations: Radio[]
}

// Form types
export interface RadioFormData {
  id: string
  merk: string
  model: string
  type: 'Portable' | 'Mobile' | 'Base'
  serienummer: string
  alias: string
  afdeling: string
  groep?: string
  voertuig?: string
  opmerking?: string
  registratiedatum: string
}

export interface AccessoryFormData {
  merk: string
  model: string
  serienummer?: string
  opmerking?: string
}

export interface IssueFormData {
  item_type: 'radio' | 'accessory'
  item_id: string
  afdeling: string
  issued_to: string
  notes?: string
}

export interface InstallationFormData {
  item_type: 'radio' | 'accessory'
  item_id: string
  vehicle_merk: string
  vehicle_model: string
  vehicle_afdeling: string
  notes?: string
}

// Brands, Categories, and Models
export interface Brand {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  brand_id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
  brand?: Brand
}

export interface Model {
  id: string
  category_id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
  category?: Category
}

// Form data types for brands
export interface BrandFormData {
  name: string
  description?: string
}

export interface CategoryFormData {
  brand_id: string
  name: string
  description?: string
}

export interface ModelFormData {
  category_id: string
  name: string
  description?: string
}

// Hierarchical data structure for UI
export interface BrandWithDetails extends Brand {
  categories: CategoryWithDetails[]
}

export interface CategoryWithDetails extends Category {
  models: Model[]
}

// Stats
export interface BrandStats {
  total_brands: number
  total_categories: number
  total_models: number
}

// Storingen (Faults) types
export interface Storing {
  id: string
  storingnummer: string
  soort_storing: 'Radio' | 'Telefonie' | 'Waarschuwingsapparatuur'
  telefonie_type?: 'Glasvezel' | 'Koper'
  waarschuwingsapparatuur_type?: 'Zwaailicht' | 'Sirene'
  betrokken_afdeling: string
  adres: string
  locatie: 'Gebouw' | 'Voertuig' | 'Anders'
  aard_storing: string
  naam_contactpersoon: string
  telefoonnummer_contactpersoon: string
  aansluitnummer?: string
  telefoonnummer_storing?: string
  datum_storing_binnengekomen: string
  datum_storing_begonnen: string
  handeling: 'Zelf afhandelen' | 'Verwezen naar Telesur'
  telesur_ticketnummer?: string
  datum_verwezen?: string
  created_at: string
  updated_at: string
}

export interface StoringFeedback {
  id: string
  storing_id: string
  is_afgehandeld: boolean
  datum_afgehandeld?: string
  afgehandeld_door?: string
  hoe_afgehandeld?: string
  gebruikte_materialen?: string
  opmerkingen?: string
  created_at: string
  updated_at: string
}

export interface StoringFormData {
  storingnummer: string
  soort_storing: 'Radio' | 'Telefonie' | 'Waarschuwingsapparatuur'
  telefonie_type?: 'Glasvezel' | 'Koper'
  waarschuwingsapparatuur_type?: 'Zwaailicht' | 'Sirene'
  betrokken_afdeling: string
  adres: string
  locatie: 'Gebouw' | 'Voertuig' | 'Anders'
  aard_storing: string
  naam_contactpersoon: string
  telefoonnummer_contactpersoon: string
  aansluitnummer?: string
  telefoonnummer_storing?: string
  datum_storing_binnengekomen: string
  datum_storing_begonnen: string
  handeling: 'Zelf afhandelen' | 'Verwezen naar Telesur'
  telesur_ticketnummer?: string
  datum_verwezen?: string
}

export interface StoringFeedbackFormData {
  is_afgehandeld: boolean
  datum_afgehandeld?: string
  afgehandeld_door?: string
  hoe_afgehandeld?: string
  gebruikte_materialen?: string
  opmerkingen?: string
}

export interface StoringWithFeedback extends Storing {
  feedback: StoringFeedback[]
}

// Stats for storingen
export interface StoringStats {
  total_storingen: number
  open_storingen: number
  afgehandelde_storingen: number
  storingen_per_soort: {
    radio: number
    telefonie: number
    waarschuwingsapparatuur: number
  }
}