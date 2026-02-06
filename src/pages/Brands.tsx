import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { BrandService } from '../services/brandService'
import { Brand, Category, Model, BrandFormData, CategoryFormData, ModelFormData } from '../types'
import { Plus, Edit, Trash2, ChevronRight, ChevronDown } from 'lucide-react'
import './Brands.css'

export default function Brands() {
  const { t } = useLanguage()
  const { isSuperUserOrAdmin } = useAuth()
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set())
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [showBrandModal, setShowBrandModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showModelModal, setShowModelModal] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [selectedModel, setSelectedModel] = useState<Model | null>(null)

  // Utility function to invalidate all brand-related queries
  const invalidateAllBrandQueries = () => {
    // The mutations will automatically refetch the data
  }

  // Queries
  const { data: brands = [], isLoading: brandsLoading } = useQuery({
    queryKey: ['brands'],
    queryFn: () => BrandService.getAll()
  })

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['brand-stats'],
    queryFn: () => BrandService.getStats()
  })

  // Mutations
  const deleteBrandMutation = useMutation({
    mutationFn: (id: string) => BrandService.delete(id),
    onSuccess: invalidateAllBrandQueries
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => BrandService.deleteCategory(id),
    onSuccess: invalidateAllBrandQueries
  })

  const deleteModelMutation = useMutation({
    mutationFn: (id: string) => BrandService.deleteModel(id),
    onSuccess: invalidateAllBrandQueries
  })

  const handleToggleBrand = (brandId: string) => {
    const newExpanded = new Set(expandedBrands)
    if (newExpanded.has(brandId)) {
      newExpanded.delete(brandId)
    } else {
      newExpanded.add(brandId)
    }
    setExpandedBrands(newExpanded)
  }

  const handleToggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const handleDeleteBrand = async (brand: Brand) => {
    if (window.confirm(`Weet je zeker dat je merk "${brand.name}" wilt verwijderen? Dit zal ook alle categorieën en modellen verwijderen.`)) {
      deleteBrandMutation.mutate(brand.id)
    }
  }

  const handleDeleteCategory = async (category: Category) => {
    if (window.confirm(`Weet je zeker dat je categorie "${category.name}" wilt verwijderen? Dit zal ook alle modellen verwijderen.`)) {
      deleteCategoryMutation.mutate(category.id)
    }
  }

  const handleDeleteModel = async (model: Model) => {
    if (window.confirm(`Weet je zeker dat je model "${model.name}" wilt verwijderen?`)) {
      deleteModelMutation.mutate(model.id)
    }
  }

  const isDeleting = deleteBrandMutation.isPending || deleteCategoryMutation.isPending || deleteModelMutation.isPending

  if (brandsLoading || statsLoading) {
    return (
      <div className="brands-page">
        <div className="brands-page__loading">
          <div className="loading-spinner"></div>
          <p>{t('common.loading')}...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="brands-page">
      <div className="brands-page__header">
        <div className="brands-page__title">
          <h1>{t('brands.title')}</h1>
          <p>{t('brands.subtitle')}</p>
        </div>
        {isSuperUserOrAdmin() && (
        <button
          onClick={() => setShowBrandModal(true)}
          className="btn btn--primary"
        >
          <Plus size={20} />
          {t('brands.addBrand')}
        </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="brands-page__stats">
        <div className="stat-card">
          <div className="stat-card__content">
            <h3>{stats?.total_brands || 0}</h3>
            <p>{t('brands.totalBrands')}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__content">
            <h3>{stats?.total_categories || 0}</h3>
            <p>{t('brands.totalCategories')}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__content">
            <h3>{stats?.total_models || 0}</h3>
            <p>{t('brands.totalModels')}</p>
          </div>
        </div>
      </div>

      {/* Brands List */}
      <div className="brands-page__content">
        <div className="brands-list">
          {brands.map((brand) => (
            <BrandItem
              key={brand.id}
              brand={brand}
              canEdit={isSuperUserOrAdmin()}
              isExpanded={expandedBrands.has(brand.id)}
              onToggle={handleToggleBrand}
              onEdit={() => {
                setSelectedBrand(brand)
                setShowBrandModal(true)
              }}
              onDelete={() => handleDeleteBrand(brand)}
              onAddCategory={() => {
                setSelectedBrand(brand)
                setShowCategoryModal(true)
              }}
              expandedCategories={expandedCategories}
              onToggleCategory={handleToggleCategory}
              onEditCategory={setSelectedCategory}
              onDeleteCategory={handleDeleteCategory}
              onAddModel={setSelectedCategory}
              onEditModel={setSelectedModel}
              onDeleteModel={handleDeleteModel}
              onShowModelModal={setShowModelModal}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      </div>

      {/* Modals */}
      {showBrandModal && (
        <BrandModal
          brand={selectedBrand}
          onClose={() => {
            setShowBrandModal(false)
            setSelectedBrand(null)
          }}
          invalidateAllBrandQueries={invalidateAllBrandQueries}
        />
      )}

      {showCategoryModal && (
        <CategoryModal
          category={selectedCategory}
          brand={selectedBrand}
          onClose={() => {
            setShowCategoryModal(false)
            setSelectedCategory(null)
            setSelectedBrand(null)
          }}
          invalidateAllBrandQueries={invalidateAllBrandQueries}
        />
      )}

      {showModelModal && (
        <ModelModal
          model={selectedModel}
          category={selectedCategory}
          onClose={() => {
            setShowModelModal(false)
            setSelectedModel(null)
            setSelectedCategory(null)
          }}
          invalidateAllBrandQueries={invalidateAllBrandQueries}
        />
      )}
    </div>
  )
}

// Brand Item Component
function BrandItem({ 
  brand, 
  canEdit,
  isExpanded, 
  onToggle, 
  onEdit, 
  onDelete, 
  onAddCategory,
  expandedCategories,
  onToggleCategory,
  onEditCategory,
  onDeleteCategory,
  onAddModel,
  onEditModel,
  onDeleteModel,
  onShowModelModal,
  isDeleting
}: {
  brand: Brand
  canEdit: boolean
  isExpanded: boolean
  onToggle: (id: string) => void
  onEdit: () => void
  onDelete: () => void
  onAddCategory: () => void
  expandedCategories: Set<string>
  onToggleCategory: (id: string) => void
  onEditCategory: (category: Category) => void
  onDeleteCategory: (category: Category) => void
  onAddModel: (category: Category) => void
  onEditModel: (model: Model) => void
  onDeleteModel: (model: Model) => void
  onShowModelModal: (show: boolean) => void
  isDeleting: boolean
}) {
  const { t } = useLanguage()

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', brand.id],
    queryFn: () => BrandService.getCategoriesByBrand(brand.id),
    enabled: isExpanded
  })

  return (
    <div className="brand-item">
      <div className="brand-item__header">
        <button
          className="brand-item__toggle"
          onClick={() => onToggle(brand.id)}
        >
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        <div className="brand-item__content">
          <h3>{brand.name}</h3>
          {brand.description && <p>{brand.description}</p>}
        </div>
        {canEdit && (
        <div className="brand-item__actions">
          <button
            onClick={onAddCategory}
            className="btn btn--small btn--secondary"
            title={t('brands.addCategory')}
          >
            <Plus size={16} />
          </button>
          <button
            onClick={onEdit}
            className="btn btn--small btn--secondary"
            title={t('common.edit')}
          >
            <Edit size={16} />
          </button>
          <button
            onClick={onDelete}
            className="btn btn--small btn--danger"
            title={t('common.delete')}
            disabled={isDeleting}
          >
            <Trash2 size={16} />
          </button>
        </div>
        )}
      </div>

      {isExpanded && (
        <div className="brand-item__categories">
          {categories.map((category) => (
            <CategoryItem
              key={category.id}
              category={category}
              canEdit={canEdit}
              isExpanded={expandedCategories.has(category.id)}
              onToggle={onToggleCategory}
              onEdit={onEditCategory}
              onDelete={onDeleteCategory}
              onAddModel={(category) => {
                onAddModel(category)
                onShowModelModal(true)
              }}
              onEditModel={onEditModel}
              onDeleteModel={onDeleteModel}
              onShowModelModal={onShowModelModal}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Category Item Component
function CategoryItem({
  category,
  canEdit,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onAddModel,
  onEditModel,
  onDeleteModel,
  onShowModelModal,
  isDeleting
}: {
  category: Category
  canEdit: boolean
  isExpanded: boolean
  onToggle: (id: string) => void
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
  onAddModel: (category: Category) => void
  onEditModel: (model: Model) => void
  onDeleteModel: (model: Model) => void
  onShowModelModal: (show: boolean) => void
  isDeleting: boolean
}) {
  const { t } = useLanguage()

  const { data: models = [] } = useQuery({
    queryKey: ['models', category.id],
    queryFn: () => BrandService.getModelsByCategory(category.id),
    enabled: isExpanded
  })

  return (
    <div className="category-item">
      <div className="category-item__header">
        <button
          className="category-item__toggle"
          onClick={() => onToggle(category.id)}
        >
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <div className="category-item__content">
          <h4>{category.name}</h4>
          {category.description && <p>{category.description}</p>}
        </div>
        {canEdit && (
        <div className="category-item__actions">
          <button
            onClick={() => onAddModel(category)}
            className="btn btn--small btn--secondary"
            title={t('brands.addModel')}
          >
            <Plus size={14} />
          </button>
          <button
            onClick={() => onEdit(category)}
            className="btn btn--small btn--secondary"
            title={t('common.edit')}
          >
            <Edit size={14} />
          </button>
          <button
            onClick={() => onDelete(category)}
            className="btn btn--small btn--danger"
            title={t('common.delete')}
            disabled={isDeleting}
          >
            <Trash2 size={14} />
          </button>
        </div>
        )}
      </div>

      {isExpanded && (
        <div className="category-item__models">
          {models.map((model) => (
            <ModelItem
              key={model.id}
              model={model}
              canEdit={canEdit}
              onEdit={onEditModel}
              onDelete={onDeleteModel}
              onShowModal={onShowModelModal}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Model Item Component
function ModelItem({
  model,
  canEdit,
  onEdit,
  onDelete,
  onShowModal,
  isDeleting
}: {
  model: Model
  canEdit: boolean
  onEdit: (model: Model) => void
  onDelete: (model: Model) => void
  onShowModal: (show: boolean) => void
  isDeleting: boolean
}) {
  const { t } = useLanguage()

  return (
    <div className="model-item">
      <div className="model-item__content">
        <h5>{model.name}</h5>
        {model.description && <p>{model.description}</p>}
      </div>
      {canEdit && (
      <div className="model-item__actions">
        <button
          onClick={() => {
            onEdit(model)
            onShowModal(true)
          }}
          className="btn btn--small btn--secondary"
          title={t('common.edit')}
        >
          <Edit size={12} />
        </button>
        <button
          onClick={() => onDelete(model)}
          className="btn btn--small btn--danger"
          title={t('common.delete')}
          disabled={isDeleting}
        >
          <Trash2 size={12} />
        </button>
      </div>
      )}
    </div>
  )
}

// Brand Modal Component
function BrandModal({ brand, onClose, invalidateAllBrandQueries }: { brand: Brand | null; onClose: () => void; invalidateAllBrandQueries: () => void }) {
  const { t } = useLanguage()
  const [formData, setFormData] = useState<BrandFormData>({
    name: brand?.name || '',
    description: brand?.description || '',
  })

  const createMutation = useMutation({
    mutationFn: (data: BrandFormData) => BrandService.create(data),
    onSuccess: () => {
      invalidateAllBrandQueries()
      onClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BrandFormData> }) =>
      BrandService.update(id, data),
    onSuccess: () => {
      invalidateAllBrandQueries()
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (brand) {
      updateMutation.mutate({ id: brand.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal__header">
          <h2>{brand ? t('brands.editBrand') : t('brands.addBrand')}</h2>
          <button onClick={onClose} className="modal__close">×</button>
        </div>
        <div className="modal__wrapper">
          <form onSubmit={handleSubmit} className="brand-modal__form">
            <div className="brand-modal__content">
              <div className="brand-modal__grid">
                <div className="brand-modal__group">
                  <label className="brand-modal__label">{t('brands.name')} *</label>
                  <input
                    type="text"
                    className="brand-modal__input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder={t('brands.namePlaceholder')}
                  />
                </div>
                
                <div className="brand-modal__group brand-modal__group--full">
                  <label className="brand-modal__label">{t('brands.description')}</label>
                  <textarea
                    className="brand-modal__textarea"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={t('brands.descriptionPlaceholder')}
                    rows={3}
                  />
                </div>
              </div>
            </div>
            <div className="brand-modal__actions">
              <button
                type="button"
                onClick={onClose}
                className="btn btn--secondary"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="btn btn--primary"
                disabled={isLoading}
              >
                {isLoading ? t('common.loading') : t('common.save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Category Modal Component
function CategoryModal({ category, brand, onClose, invalidateAllBrandQueries }: { category: Category | null; brand: Brand | null; onClose: () => void; invalidateAllBrandQueries: () => void }) {
  const { t } = useLanguage()
  const [formData, setFormData] = useState<CategoryFormData>({
    brand_id: brand?.id || category?.brand_id || '',
    name: category?.name || '',
    description: category?.description || '',
  })

  const createMutation = useMutation({
    mutationFn: (data: CategoryFormData) => BrandService.createCategory(data),
    onSuccess: () => {
      invalidateAllBrandQueries()
      onClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CategoryFormData> }) =>
      BrandService.updateCategory(id, data),
    onSuccess: () => {
      invalidateAllBrandQueries()
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (category) {
      updateMutation.mutate({ id: category.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal__header">
          <h2>{category ? t('brands.editCategory') : t('brands.addCategory')}</h2>
          <button onClick={onClose} className="modal__close">×</button>
        </div>
        <div className="modal__wrapper">
          <form onSubmit={handleSubmit} className="category-modal__form">
            <div className="category-modal__content">
              <div className="category-modal__grid">
                <div className="category-modal__group">
                  <label className="category-modal__label">{t('brands.name')} *</label>
                  <input
                    type="text"
                    className="category-modal__input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder={t('brands.categoryNamePlaceholder')}
                  />
                </div>
                
                <div className="category-modal__group category-modal__group--full">
                  <label className="category-modal__label">{t('brands.description')}</label>
                  <textarea
                    className="category-modal__textarea"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={t('brands.descriptionPlaceholder')}
                    rows={3}
                  />
                </div>
              </div>
            </div>
            <div className="category-modal__actions">
              <button
                type="button"
                onClick={onClose}
                className="btn btn--secondary"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="btn btn--primary"
                disabled={isLoading}
              >
                {isLoading ? t('common.loading') : t('common.save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Model Modal Component
function ModelModal({ model, category, onClose, invalidateAllBrandQueries }: { model: Model | null; category: Category | null; onClose: () => void; invalidateAllBrandQueries: () => void }) {
  const { t } = useLanguage()
  const [formData, setFormData] = useState<ModelFormData>({
    category_id: category?.id || model?.category_id || '',
    name: model?.name || '',
    description: model?.description || '',
  })

  const createMutation = useMutation({
    mutationFn: (data: ModelFormData) => BrandService.createModel(data),
    onSuccess: () => {
      invalidateAllBrandQueries()
      onClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ModelFormData> }) =>
      BrandService.updateModel(id, data),
    onSuccess: () => {
      invalidateAllBrandQueries()
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (model) {
      updateMutation.mutate({ id: model.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal__header">
          <h2>{model ? t('brands.editModel') : t('brands.addModel')}</h2>
          <button onClick={onClose} className="modal__close">×</button>
        </div>
        <div className="modal__wrapper">
          <form onSubmit={handleSubmit} className="model-modal__form">
            <div className="model-modal__content">
              <div className="model-modal__grid">
                <div className="model-modal__group">
                  <label className="model-modal__label">{t('brands.name')} *</label>
                  <input
                    type="text"
                    className="model-modal__input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder={t('brands.modelNamePlaceholder')}
                  />
                </div>
                
                <div className="model-modal__group model-modal__group--full">
                  <label className="model-modal__label">{t('brands.description')}</label>
                  <textarea
                    className="model-modal__textarea"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={t('brands.descriptionPlaceholder')}
                    rows={3}
                  />
                </div>
              </div>
            </div>
            <div className="model-modal__actions">
              <button
                type="button"
                onClick={onClose}
                className="btn btn--secondary"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="btn btn--primary"
                disabled={isLoading}
              >
                {isLoading ? t('common.loading') : t('common.save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
