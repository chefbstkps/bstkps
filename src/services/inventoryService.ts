import { 
  Inventory, 
  InventoryTransaction, 
  PurchaseFormData, 
  InventoryIssueFormData,
  InventoryStats
} from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export class InventoryService {
  // Get all inventory items for an organization
  static async getInventoryByOrganization(organizationId: string): Promise<Inventory[]> {
    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/inventory?organization_id=eq.${organizationId}&select=*,accessory:accessories(*)&order=created_at.desc`,
        {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data || []
    } catch (error) {
      console.error('Failed to fetch inventory:', error)
      throw error
    }
  }

  // Get all inventory items (all organizations)
  static async getAllInventory(): Promise<Inventory[]> {
    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/inventory?select=*,accessory:accessories(*)&order=created_at.desc`,
        {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data || []
    } catch (error) {
      console.error('Failed to fetch all inventory:', error)
      throw error
    }
  }

  // Get inventory item by ID
  static async getInventoryById(id: string): Promise<Inventory | null> {
    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/inventory?id=eq.${id}&select=*,accessory:accessories(*)`,
        {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data[0] || null
    } catch (error) {
      console.error('Failed to fetch inventory item:', error)
      throw error
    }
  }

  // Get inventory for a specific accessory in an organization
  static async getInventoryByAccessory(organizationId: string, accessoryId: string): Promise<Inventory | null> {
    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/inventory?organization_id=eq.${organizationId}&accessory_id=eq.${accessoryId}&select=*,accessory:accessories(*)`,
        {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data[0] || null
    } catch (error) {
      console.error('Failed to fetch inventory for accessory:', error)
      throw error
    }
  }

  // Get low stock items
  static async getLowStockItems(organizationId: string): Promise<Inventory[]> {
    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/inventory?organization_id=eq.${organizationId}&select=*,accessory:accessories(*)&order=current_stock.asc`,
        {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      // Filter items where current_stock <= low_stock_threshold
      return data.filter((item: Inventory) => item.current_stock <= item.low_stock_threshold) || []
    } catch (error) {
      console.error('Failed to fetch low stock items:', error)
      throw error
    }
  }

  // Get all transactions for an organization
  static async getTransactionsByOrganization(organizationId: string): Promise<InventoryTransaction[]> {
    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/inventory_transactions?organization_id=eq.${organizationId}&select=*,accessory:accessories(*)&order=transaction_date.desc,created_at.desc`,
        {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data || []
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
      throw error
    }
  }

  // Get all transactions (all organizations)
  static async getAllTransactions(): Promise<InventoryTransaction[]> {
    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/inventory_transactions?select=*,accessory:accessories(*)&order=transaction_date.desc,created_at.desc`,
        {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data || []
    } catch (error) {
      console.error('Failed to fetch all transactions:', error)
      throw error
    }
  }

  // Get transactions for a specific accessory
  static async getTransactionsByAccessory(accessoryId: string): Promise<InventoryTransaction[]> {
    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/inventory_transactions?accessory_id=eq.${accessoryId}&select=*,accessory:accessories(*)&order=transaction_date.desc,created_at.desc`,
        {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data || []
    } catch (error) {
      console.error('Failed to fetch transactions for accessory:', error)
      throw error
    }
  }

  // Add a purchase (increases stock)
  static async addPurchase(purchaseData: PurchaseFormData): Promise<InventoryTransaction> {
    try {
      const transactionData = {
        ...purchaseData,
        transaction_type: 'purchase'
      }

      const response = await fetch(`${supabaseUrl}/rest/v1/inventory_transactions`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(transactionData)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }

      const data = await response.json()
      return data[0]
    } catch (error) {
      console.error('Failed to add purchase:', error)
      throw error
    }
  }

  // Add an issue (decreases stock)
  static async addIssue(issueData: InventoryIssueFormData): Promise<InventoryTransaction> {
    try {
      // First check if there's enough stock
      const inventory = await this.getInventoryByAccessory(
        issueData.organization_id,
        issueData.accessory_id
      )

      if (!inventory || inventory.current_stock < issueData.quantity) {
        throw new Error('Onvoldoende voorraad beschikbaar')
      }

      const transactionData = {
        ...issueData,
        transaction_type: 'issue'
      }

      const response = await fetch(`${supabaseUrl}/rest/v1/inventory_transactions`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(transactionData)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }

      const data = await response.json()
      return data[0]
    } catch (error) {
      console.error('Failed to add issue:', error)
      throw error
    }
  }

  // Update inventory low stock threshold
  static async updateLowStockThreshold(id: string, threshold: number): Promise<Inventory> {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/inventory?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ low_stock_threshold: threshold })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data[0]
    } catch (error) {
      console.error('Failed to update low stock threshold:', error)
      throw error
    }
  }

  // Get inventory statistics for an organization
  static async getInventoryStats(organizationId: string): Promise<InventoryStats> {
    try {
      const [inventory, transactions] = await Promise.all([
        this.getInventoryByOrganization(organizationId),
        this.getTransactionsByOrganization(organizationId)
      ])

      // Calculate total value from purchases
      const totalValue = transactions
        .filter(t => t.transaction_type === 'purchase' && t.total_price)
        .reduce((sum, t) => sum + (t.total_price || 0), 0)

      // Count unique products
      const uniqueProducts = inventory.length

      // Count low stock items
      const lowStockCount = inventory.filter(
        item => item.current_stock <= item.low_stock_threshold
      ).length

      // Count recent transactions (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const recentTransactionsCount = transactions.filter(
        t => new Date(t.transaction_date) >= sevenDaysAgo
      ).length

      // Total items in stock
      const totalItems = inventory.reduce((sum, item) => sum + item.current_stock, 0)

      return {
        total_value: totalValue,
        unique_products: uniqueProducts,
        low_stock_count: lowStockCount,
        recent_transactions_count: recentTransactionsCount,
        total_items: totalItems
      }
    } catch (error) {
      console.error('Failed to get inventory stats:', error)
      throw error
    }
  }

  // Delete a transaction (admin only - be careful with this)
  static async deleteTransaction(id: string): Promise<void> {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/inventory_transactions?id=eq.${id}`, {
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
      console.error('Failed to delete transaction:', error)
      throw error
    }
  }
}

