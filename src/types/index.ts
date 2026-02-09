// Auth / App user types (custom login system)
/** Page keys that can be shown/hidden per user (nav + access). */
export const USER_PAGE_KEYS = [
  'storingen',
  'installation',
  'issue',
  'accessories',
  'inventory',
  'brands',
  'organizations',
  'radio_archive',
  'telefoon',
] as const

export type UserPageKey = (typeof USER_PAGE_KEYS)[number]

export type UserPageVisibility = Record<UserPageKey, boolean>

/** Session timeout in minutes. null = never expire. */
export type SessionTimeoutMinutes = 10 | 30 | 60 | null

export interface AppUser {
  id: string
  username: string
  email: string
  first_name: string
  last_name: string
  role: 'admin' | 'super_user' | 'user'
  is_active: boolean
  must_change_password: boolean
  last_login?: string
  last_login_ip?: string | null
  last_login_user_agent?: string | null
  created_at: string
  updated_at: string
  /** Minutes until auto logout. null = never. */
  session_timeout_minutes?: SessionTimeoutMinutes
  telefoonnummer?: string
  rang?: string
  organisatie?: string
  structuur?: string
  afdeling?: string
  /** Which pages are visible in nav (admin-configurable). Undefined = all visible. */
  page_visibility?: UserPageVisibility
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface CreateUserData {
  username: string
  email: string
  first_name: string
  last_name: string
  password: string
  role: 'admin' | 'super_user' | 'user'
  telefoonnummer?: string
  rang?: string
  organisatie?: string
  structuur?: string
  afdeling?: string
}

export interface UpdateUserData {
  first_name?: string
  last_name?: string
  email?: string
  role?: 'admin' | 'super_user' | 'user'
  is_active?: boolean
  session_timeout_minutes?: SessionTimeoutMinutes
  telefoonnummer?: string
  rang?: string
  organisatie?: string
  structuur?: string
  afdeling?: string
}

export interface ChangePasswordData {
  current_password: string
  new_password: string
  confirm_password: string
}

export interface ResetPasswordData {
  user_id: string
  new_password: string
}

export interface UserActivityLogEntry {
  id: string
  user_id: string
  username: string
  activity_type: 'login' | 'logout' | 'password_change' | 'profile_update'
  success: boolean
  error_message: string | null
  created_at: string
  ip_address?: string | null
  user_agent?: string | null
}

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
  structuur?: string
  voertuig?: string
  opmerking?: string
  status: 'Actief' | 'Defect' | 'Kwijtgeraakt' | 'Ingetrokken' | 'Uitgeschakeld' | 'Inactief'
  registratiedatum: string
  created_at: string
  updated_at: string
  /** Username of the user who added this radio; 'Admin' for legacy records. */
  added_by?: string | null
}

// Phone types (telefoontoestellen: geen id/alias, type = Smart Phone | Dumb Phone | Wired | Wireless)
export type PhoneType = 'Smart Phone' | 'Dumb Phone' | 'Wired Phone' | 'Wireless Phone'

export interface Phone {
  id: string
  merk: string
  model: string
  type: PhoneType
  serienummer: string
  telefoonnummer?: string | null
  provider?: string | null
  afdeling: string
  groep?: string
  structuur?: string
  voertuig?: string
  opmerking?: string
  status: 'Actief' | 'Defect' | 'Kwijtgeraakt' | 'Ingetrokken' | 'Uitgeschakeld' | 'Inactief'
  registratiedatum: string
  created_at: string
  updated_at: string
  added_by?: string | null
}

export interface PhoneFormData {
  merk: string
  model: string
  type: PhoneType
  serienummer: string
  telefoonnummer?: string
  provider?: string
  afdeling: string
  groep?: string
  structuur?: string
  voertuig?: string
  opmerking?: string
  status: 'Actief' | 'Defect' | 'Kwijtgeraakt' | 'Ingetrokken' | 'Uitgeschakeld' | 'Inactief'
  registratiedatum: string
  added_by?: string | null
}

/** Gearchiveerde radio: unieke archive_id, originele radio-velden (id mag duplicaat zijn), archived_at + archived_by. */
export interface ArchivedRadio extends Radio {
  archive_id: string
  archived_at: string
  archived_by?: string | null
}

export interface RadioHistory {
  id: string
  radio_id: string
  action: 'battery_replaced' | 'serviced' | 'department_changed' | 'alias_changed' | 'id_changed' | 'issued' | 'installed' | 'inlevering' | 'retour' | 'toewijzing'
  description: string
  timestamp: string
  /** Username of the user who performed this action; 'Admin' for legacy records. */
  executed_by?: string | null
  details?: {
    old_value?: string
    new_value?: string
    service_date?: string
    notes?: string
    naam?: string
    voornaam?: string
    telefoonnummer?: string
    rang_functie?: string
    accessory_info?: string
    quantity?: number
    reden_van_inlevering?: string
    reden?: string
    reden_van_toewijzing?: string
    previous_afdeling?: string
    previous_groep?: string
    previous_structuur?: string
    previous_voertuig?: string
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
  omschrijving?: string
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
  accessory_info?: string
  quantity?: number
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
  active_radios: number
  defect_radios: number
  total_accessories: number
  recent_installations: Installation[]
  recent_issues: Issue[]
  recent_registrations: Radio[]
  recent_storingen: Storing[]
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
  structuur?: string
  voertuig?: string
  opmerking?: string
  status: 'Actief' | 'Defect' | 'Kwijtgeraakt' | 'Ingetrokken' | 'Uitgeschakeld' | 'Inactief'
  registratiedatum: string
  /** Set when creating a radio; username of the user who adds it. */
  added_by?: string | null
}

export interface AccessoryFormData {
  merk: string
  model: string
  omschrijving?: string
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

// Organizations types (Groepen, Structuren, Afdelingen)
export interface Groep {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Structuur {
  id: string
  groep_id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
  groep?: Groep
}

export interface Afdeling {
  id: string
  structuur_id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
  structuur?: Structuur
}

// Form data types for organizations
export interface GroepFormData {
  name: string
  description?: string
}

export interface StructuurFormData {
  groep_id: string
  name: string
  description?: string
}

export interface AfdelingFormData {
  structuur_id: string
  name: string
  description?: string
}

// Hierarchical data structure for UI
export interface GroepWithDetails extends Groep {
  structuren: StructuurWithDetails[]
}

export interface StructuurWithDetails extends Structuur {
  afdelingen: Afdeling[]
}

// Stats for organizations
export interface OrganizationStats {
  total_groepen: number
  total_structuren: number
  total_afdelingen: number
}

// Inventory types
export interface Inventory {
  id: string
  organization_id: string
  accessory_id: string
  current_stock: number
  low_stock_threshold: number
  created_at: string
  updated_at: string
  accessory?: Accessory
}

export interface InventoryTransaction {
  id: string
  organization_id: string
  accessory_id: string
  transaction_type: 'purchase' | 'issue'
  quantity: number
  transaction_date: string
  // Purchase-specific fields
  unit_price?: number
  total_price?: number
  supplier?: string
  invoice_number?: string
  // Issue-specific fields
  issued_to_type?: 'radio' | 'installation' | 'employee'
  issued_to_id?: string
  issue_reason?: string
  // Common fields
  notes?: string
  created_by?: string
  created_at: string
  accessory?: Accessory
}

// Form data types for inventory
export interface PurchaseFormData {
  organization_id: string
  accessory_id: string
  quantity: number
  transaction_date: string
  unit_price: number
  total_price: number
  supplier: string
  invoice_number: string
  notes?: string
}

export interface InventoryIssueFormData {
  organization_id: string
  accessory_id: string
  quantity: number
  transaction_date: string
  issued_to_type: 'radio' | 'installation' | 'employee'
  issued_to_id: string
  issue_reason: string
  notes?: string
}

// Inventory with details
export interface InventoryWithDetails extends Inventory {
  accessory: Accessory
  transactions: InventoryTransaction[]
}

// Stats for inventory
export interface InventoryStats {
  total_value: number
  unique_products: number
  low_stock_count: number
  recent_transactions_count: number
  total_items: number
}