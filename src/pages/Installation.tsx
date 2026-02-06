import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { InstallationService } from '../services/installationService'
import { RadioService } from '../services/radioService'
import { AccessoryService } from '../services/accessoryService'
import type { Installation, InstallationFormData, Radio, Accessory } from '../types'
import { Plus, Edit, Trash2, Search, Radio as RadioIcon, Package, Car } from 'lucide-react'
import './Installation.css'

export default function Installation() {
  const { t } = useLanguage()
  const { isSuperUserOrAdmin } = useAuth()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingInstallation, setEditingInstallation] = useState<Installation | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const { data: installations, isLoading, error } = useQuery({
    queryKey: ['installations'],
    queryFn: () => InstallationService.getAll(),
  })

  const { data: radios } = useQuery({
    queryKey: ['radios'],
    queryFn: () => RadioService.getAll(),
  })

  const { data: accessories } = useQuery({
    queryKey: ['accessories'],
    queryFn: () => AccessoryService.getAll(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => InstallationService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installations'] })
      setDeleteConfirm(null)
    },
  })

  const filteredInstallations = installations?.filter(installation => {
    const item = installation.item_type === 'radio' 
      ? radios?.find(r => r.id === installation.item_id)
      : accessories?.find(a => a.id === installation.item_id)
    
    if (!item) return false
    
    const searchLower = searchTerm.toLowerCase()
    return item.merk.toLowerCase().includes(searchLower) ||
           item.model.toLowerCase().includes(searchLower) ||
           installation.vehicle_merk.toLowerCase().includes(searchLower) ||
           installation.vehicle_model.toLowerCase().includes(searchLower) ||
           installation.vehicle_afdeling.toLowerCase().includes(searchLower)
  }) || []

  const handleEdit = (installation: Installation) => {
    setEditingInstallation(installation)
    setShowAddModal(true)
  }

  const handleDelete = (id: string) => {
    setDeleteConfirm(id)
  }

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteMutation.mutate(deleteConfirm)
    }
  }

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>{t('common.loading')}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="alert alert--error">
        <p>{t('common.error')}: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">{t('installation.title')}</h1>
        <p className="page__subtitle">
          Beheer installaties van radio's en accessoires in voertuigen
        </p>
      </div>

      {/* Controls */}
      <div className="page__actions">
        {isSuperUserOrAdmin() && (
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn--primary"
        >
          <Plus size={20} />
          Nieuwe Installatie
        </button>
        )}
        <div className="search-controls">
          <div className="search-input">
            <Search size={20} />
            <input
              type="text"
              placeholder={t('common.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Item</th>
              <th>Voertuig</th>
              <th>Afdeling</th>
              <th>Datum</th>
              <th>Notities</th>
              {isSuperUserOrAdmin() && <th>Acties</th>}
            </tr>
          </thead>
          <tbody>
            {filteredInstallations.map((installation) => {
              const item = installation.item_type === 'radio' 
                ? radios?.find(r => r.id === installation.item_id)
                : accessories?.find(a => a.id === installation.item_id)
              
              return (
                <tr key={installation.id}>
                  <td>
                    <div className="item-type">
                      {installation.item_type === 'radio' ? (
                        <RadioIcon size={16} />
                      ) : (
                        <Package size={16} />
                      )}
                      <span>{installation.item_type === 'radio' ? 'Radio' : 'Accessoire'}</span>
                    </div>
                  </td>
                  <td>
                    {item ? `${item.merk} ${item.model}` : 'Onbekend item'}
                  </td>
                  <td>
                    <div className="vehicle-info">
                      <div className="vehicle-info__name">
                        {installation.vehicle_merk} {installation.vehicle_model}
                      </div>
                      <div className="vehicle-info__icon">
                        <Car size={14} />
                      </div>
                    </div>
                  </td>
                  <td>{installation.vehicle_afdeling}</td>
                  <td>{new Date(installation.installed_at).toLocaleDateString('nl-NL')}</td>
                  <td>{installation.notes || '-'}</td>
                  {isSuperUserOrAdmin() && (
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => handleEdit(installation)}
                        className="btn btn--icon btn--secondary"
                        title={t('common.edit')}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(installation.id)}
                        className="btn btn--icon btn--danger"
                        title={t('common.delete')}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <InstallationModal
          installation={editingInstallation}
          radios={radios || []}
          accessories={accessories || []}
          onClose={() => {
            setShowAddModal(false)
            setEditingInstallation(null)
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal__header">
              <h3 className="modal__title">{t('common.confirm_delete')}</h3>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="modal__close"
              >
                ×
              </button>
            </div>
            <div className="modal__body">
              <p>Weet je zeker dat je deze installatie permanent wilt verwijderen?</p>
            </div>
            <div className="modal__actions">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="btn btn--secondary"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={confirmDelete}
                className="btn btn--danger"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? t('common.loading') : t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Installation Modal Component
function InstallationModal({ 
  installation, 
  radios, 
  accessories, 
  onClose 
}: { 
  installation: Installation | null
  radios: Radio[]
  accessories: Accessory[]
  onClose: () => void 
}) {
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState<InstallationFormData>({
    item_type: installation?.item_type || 'radio',
    item_id: installation?.item_id || '',
    vehicle_merk: installation?.vehicle_merk || '',
    vehicle_model: installation?.vehicle_model || '',
    vehicle_afdeling: installation?.vehicle_afdeling || '',
    notes: installation?.notes || '',
  })

  const createMutation = useMutation({
    mutationFn: (data: InstallationFormData) => InstallationService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installations'] })
      onClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InstallationFormData> }) =>
      InstallationService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installations'] })
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (installation) {
      updateMutation.mutate({ id: installation.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  const availableItems = formData.item_type === 'radio' ? radios : accessories

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal__header">
          <h3 className="modal__title">
            {installation ? 'Installatie Bewerken' : 'Nieuwe Installatie'}
          </h3>
          <button onClick={onClose} className="modal__close">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="form form--modal">
          <div className="form__grid">
            <div className="form__group">
              <label className="form__label">Item Type *</label>
              <select
                className="form__select"
                value={formData.item_type}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  item_type: e.target.value as 'radio' | 'accessory',
                  item_id: '' // Reset item selection when type changes
                })}
                required
              >
                <option value="">Selecteer type</option>
                <option value="radio">Radio</option>
                <option value="accessory">Accessoire</option>
              </select>
            </div>
            
            <div className="form__group">
              <label className="form__label">Item *</label>
              <select
                className="form__select"
                value={formData.item_id}
                onChange={(e) => setFormData({ ...formData, item_id: e.target.value })}
                required
              >
                <option value="">Selecteer een item</option>
                {availableItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.merk} {item.model} {item.alias ? `(${item.alias})` : ''}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form__group">
              <label className="form__label">Voertuig Merk *</label>
              <input
                type="text"
                className="form__input"
                value={formData.vehicle_merk}
                onChange={(e) => setFormData({ ...formData, vehicle_merk: e.target.value })}
                required
                placeholder="Bijv. Mercedes"
              />
            </div>
            
            <div className="form__group">
              <label className="form__label">Voertuig Model *</label>
              <input
                type="text"
                className="form__input"
                value={formData.vehicle_model}
                onChange={(e) => setFormData({ ...formData, vehicle_model: e.target.value })}
                required
                placeholder="Bijv. Sprinter"
              />
            </div>
            
            <div className="form__group">
              <label className="form__label">Voertuig Afdeling *</label>
              <input
                type="text"
                className="form__input"
                value={formData.vehicle_afdeling}
                onChange={(e) => setFormData({ ...formData, vehicle_afdeling: e.target.value })}
                required
                placeholder="Bijv. Brandweer"
              />
            </div>
          </div>
          
          <div className="form__group form__group--full">
            <label className="form__label">Notities</label>
            <textarea
              className="form__textarea"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Optionele notities over deze installatie..."
            />
          </div>
          
          <div className="form__actions">
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
  )
}
