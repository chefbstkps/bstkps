import { Brand, Category, Model, BrandFormData, CategoryFormData, ModelFormData, BrandStats } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export class BrandService {
  // Brands
  static async getAll(): Promise<Brand[]> {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/brands?select=*&order=name.asc`, {
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
      console.error('Failed to fetch brands:', error)
      throw error
    }
  }

  static async getById(id: string): Promise<Brand> {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/brands?select=*&id=eq.${id}`, {
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
        throw new Error('Brand not found')
      }
      return data[0]
    } catch (error) {
      console.error('Failed to fetch brand:', error)
      throw error
    }
  }

  static async create(brandData: BrandFormData): Promise<Brand> {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/brands`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(brandData)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Supabase error response:', errorText)
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      return data[0]
    } catch (error) {
      console.error('Failed to create brand:', error)
      throw error
    }
  }

  static async update(id: string, brandData: Partial<BrandFormData>): Promise<Brand> {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/brands?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(brandData)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Supabase error response:', errorText)
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      return data[0]
    } catch (error) {
      console.error('Failed to update brand:', error)
      throw error
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/brands?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Supabase error response:', errorText)
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('Failed to delete brand:', error)
      throw error
    }
  }

  // Categories
  static async getCategoriesByBrand(brandId: string): Promise<Category[]> {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/categories?select=*&brand_id=eq.${brandId}&order=name.asc`, {
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
      console.error('Failed to fetch categories:', error)
      throw error
    }
  }

  static async createCategory(categoryData: CategoryFormData): Promise<Category> {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/categories`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(categoryData)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Supabase error response:', errorText)
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      return data[0]
    } catch (error) {
      console.error('Failed to create category:', error)
      throw error
    }
  }

  static async updateCategory(id: string, categoryData: Partial<CategoryFormData>): Promise<Category> {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/categories?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(categoryData)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Supabase error response:', errorText)
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      return data[0]
    } catch (error) {
      console.error('Failed to update category:', error)
      throw error
    }
  }

  static async deleteCategory(id: string): Promise<void> {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/categories?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Supabase error response:', errorText)
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('Failed to delete category:', error)
      throw error
    }
  }

  // Models
  static async getModelsByCategory(categoryId: string): Promise<Model[]> {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/models?select=*&category_id=eq.${categoryId}&order=name.asc`, {
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
      console.error('Failed to fetch models:', error)
      throw error
    }
  }

  static async createModel(modelData: ModelFormData): Promise<Model> {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/models`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(modelData)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Supabase error response:', errorText)
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      return data[0]
    } catch (error) {
      console.error('Failed to create model:', error)
      throw error
    }
  }

  static async updateModel(id: string, modelData: Partial<ModelFormData>): Promise<Model> {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/models?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(modelData)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Supabase error response:', errorText)
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      return data[0]
    } catch (error) {
      console.error('Failed to update model:', error)
      throw error
    }
  }

  static async deleteModel(id: string): Promise<void> {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/models?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Supabase error response:', errorText)
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('Failed to delete model:', error)
      throw error
    }
  }

  // Get brands that have radio categories
  static async getBrandsWithRadioCategories(): Promise<Brand[]> {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/brands?select=*`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const brands = await response.json()
      
      // Filter brands that have radio categories
      const brandsWithRadios = []
      for (const brand of brands) {
        const categories = await this.getCategoriesByBrand(brand.id)
        const hasRadioCategory = categories.some(cat => 
          cat.name.toLowerCase().includes('radio') || 
          cat.name.toLowerCase().includes('portable') ||
          cat.name.toLowerCase().includes('mobile') ||
          cat.name.toLowerCase().includes('base')
        )
        if (hasRadioCategory) {
          brandsWithRadios.push(brand)
        }
      }
      
      return brandsWithRadios
    } catch (error) {
      console.error('Failed to fetch brands with radio categories:', error)
      throw error
    }
  }

  // Get models for a specific brand (filtered by radio categories)
  static async getRadioModelsByBrand(brandId: string): Promise<Model[]> {
    try {
      const categories = await this.getCategoriesByBrand(brandId)
      const radioCategories = categories.filter(cat => 
        cat.name.toLowerCase().includes('radio') || 
        cat.name.toLowerCase().includes('portable') ||
        cat.name.toLowerCase().includes('mobile') ||
        cat.name.toLowerCase().includes('base')
      )
      
      const allModels = []
      for (const category of radioCategories) {
        const models = await this.getModelsByCategory(category.id)
        allModels.push(...models)
      }
      
      return allModels
    } catch (error) {
      console.error('Failed to fetch radio models for brand:', error)
      throw error
    }
  }

  // Get all models for a specific brand (for accessories)
  static async getAllModelsByBrand(brandId: string): Promise<Model[]> {
    try {
      const categories = await this.getCategoriesByBrand(brandId)
      
      const allModels = []
      for (const category of categories) {
        const models = await this.getModelsByCategory(category.id)
        allModels.push(...models)
      }
      
      return allModels
    } catch (error) {
      console.error('Failed to fetch models for brand:', error)
      throw error
    }
  }

  // Stats
  static async getStats(): Promise<BrandStats> {
    try {
      const [brandsResponse, categoriesResponse, modelsResponse] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/brands?select=count`, {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${supabaseUrl}/rest/v1/categories?select=count`, {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${supabaseUrl}/rest/v1/models?select=count`, {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json'
          }
        })
      ])

      if (!brandsResponse.ok || !categoriesResponse.ok || !modelsResponse.ok) {
        throw new Error('Failed to fetch stats')
      }

      const [brandsData, categoriesData, modelsData] = await Promise.all([
        brandsResponse.json(),
        categoriesResponse.json(),
        modelsResponse.json()
      ])

      return {
        total_brands: brandsData.length,
        total_categories: categoriesData.length,
        total_models: modelsData.length
      }
    } catch (error) {
      console.error('Failed to fetch brand stats:', error)
      throw error
    }
  }
}
