import { DashboardStats } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export class DashboardService {
  static async getStats(): Promise<DashboardStats> {
    try {
      // Get radio stats
      const radiosResponse = await fetch(`${supabaseUrl}/rest/v1/radios?select=type`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!radiosResponse.ok) {
        throw new Error(`HTTP error! status: ${radiosResponse.status}`)
      }

      const radios = await radiosResponse.json()

      // Get accessory stats
      const accessoriesResponse = await fetch(`${supabaseUrl}/rest/v1/accessories?select=count`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!accessoriesResponse.ok) {
        throw new Error(`HTTP error! status: ${accessoriesResponse.status}`)
      }

      const accessories = await accessoriesResponse.json()

      // Get recent installations
      const installationsResponse = await fetch(`${supabaseUrl}/rest/v1/installations?select=*&order=installed_at.desc&limit=5`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!installationsResponse.ok) {
        throw new Error(`HTTP error! status: ${installationsResponse.status}`)
      }

      const recentInstallations = await installationsResponse.json()

      // Get recent issues from inventory_transactions (new system)
      const issuesResponse = await fetch(`${supabaseUrl}/rest/v1/inventory_transactions?select=*,accessories(merk,model,omschrijving),groepen(name)&transaction_type=eq.issue&order=transaction_date.desc,created_at.desc&limit=5`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!issuesResponse.ok) {
        throw new Error(`HTTP error! status: ${issuesResponse.status}`)
      }

      const inventoryIssues = await issuesResponse.json()
      
      // Fetch radio information for issues where issued_to_type is 'radio'
      const radioIds = inventoryIssues
        .filter((t: any) => t.issued_to_type === 'radio' && t.issued_to_id)
        .map((t: any) => t.issued_to_id)
      
      let radiosMap = new Map()
      if (radioIds.length > 0) {
        const radiosResponse = await fetch(`${supabaseUrl}/rest/v1/radios?select=id,merk,model,alias&id=in.(${radioIds.join(',')})`, {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json'
          }
        })
        if (radiosResponse.ok) {
          const radiosData = await radiosResponse.json()
          radiosData.forEach((radio: any) => {
            radiosMap.set(radio.id, radio)
          })
        }
      }
      
      // Transform inventory transactions to match the Issue interface
      const recentIssues = inventoryIssues.map((transaction: any) => {
        let issuedTo = transaction.issued_to_id || 'Onbekend'
        
        // If issued to a radio, get radio info
        if (transaction.issued_to_type === 'radio' && radiosMap.has(transaction.issued_to_id)) {
          const radio = radiosMap.get(transaction.issued_to_id)
          issuedTo = `Radio ${radio.id}${radio.alias ? ` (${radio.alias})` : ''}`
        }
        
        return {
          id: transaction.id,
          item_type: 'accessory',
          item_id: transaction.accessory_id,
          afdeling: transaction.groepen?.name || 'Onbekend',
          issued_to: issuedTo,
          issued_at: transaction.transaction_date || transaction.created_at,
          notes: transaction.notes,
          accessory_info: transaction.accessories 
            ? `${transaction.accessories.merk} ${transaction.accessories.model}${transaction.accessories.omschrijving ? ` (${transaction.accessories.omschrijving})` : ''}`
            : 'Onbekend accessoire',
          quantity: transaction.quantity
        }
      })

      // Get recent registrations
      const registrationsResponse = await fetch(`${supabaseUrl}/rest/v1/radios?select=*&order=created_at.desc&limit=5`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!registrationsResponse.ok) {
        throw new Error(`HTTP error! status: ${registrationsResponse.status}`)
      }

      const recentRegistrations = await registrationsResponse.json()

      const radioStats = {
        total_radios: radios?.length || 0,
        portable_radios: radios?.filter((r: any) => r.type === 'Portable').length || 0,
        mobile_radios: radios?.filter((r: any) => r.type === 'Mobile').length || 0,
        base_radios: radios?.filter((r: any) => r.type === 'Base').length || 0,
      }

      return {
        ...radioStats,
        total_accessories: accessories.length || 0,
        recent_installations: recentInstallations || [],
        recent_issues: recentIssues || [],
        recent_registrations: recentRegistrations || [],
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
      throw error
    }
  }
}
