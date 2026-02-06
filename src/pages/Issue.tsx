import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { IssueService } from '../services/issueService'
import { RadioService } from '../services/radioService'
import { AccessoryService } from '../services/accessoryService'
import type { Issue, IssueFormData, Radio, Accessory } from '../types'
import { Plus, Edit, Trash2, Search, Radio as RadioIcon, Package } from 'lucide-react'
import './Issue.css'

export default function Issue() {
  const { t } = useLanguage()
  const { isSuperUserOrAdmin } = useAuth()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const { data: issues, isLoading, error } = useQuery({
    queryKey: ['issues'],
    queryFn: () => IssueService.getAll(),
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
    mutationFn: (id: string) => IssueService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] })
      setDeleteConfirm(null)
    },
  })

  const filteredIssues = issues?.filter(issue => {
    const item = issue.item_type === 'radio' 
      ? radios?.find(r => r.id === issue.item_id)
      : accessories?.find(a => a.id === issue.item_id)
    
    if (!item) return false
    
    const searchLower = searchTerm.toLowerCase()
    return item.merk.toLowerCase().includes(searchLower) ||
           item.model.toLowerCase().includes(searchLower) ||
           issue.issued_to.toLowerCase().includes(searchLower) ||
           issue.afdeling.toLowerCase().includes(searchLower)
  }) || []

  const handleEdit = (issue: Issue) => {
    setEditingIssue(issue)
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
        <h1 className="page__title">{t('issue.title')}</h1>
        <p className="page__subtitle">
          Beheer afgifte van radio's en accessoires
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
          Nieuwe Afgifte
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
              <th>Afgegeven aan</th>
              <th>Afdeling</th>
              <th>Datum</th>
              <th>Notities</th>
              {isSuperUserOrAdmin() && <th>Acties</th>}
            </tr>
          </thead>
          <tbody>
            {filteredIssues.map((issue) => {
              const item = issue.item_type === 'radio' 
                ? radios?.find(r => r.id === issue.item_id)
                : accessories?.find(a => a.id === issue.item_id)
              
              return (
                <tr key={issue.id}>
                  <td>
                    <div className="item-type">
                      {issue.item_type === 'radio' ? (
                        <RadioIcon size={16} />
                      ) : (
                        <Package size={16} />
                      )}
                      <span>{issue.item_type === 'radio' ? 'Radio' : 'Accessoire'}</span>
                    </div>
                  </td>
                  <td>
                    {item ? `${item.merk} ${item.model}` : 'Onbekend item'}
                  </td>
                  <td>{issue.issued_to}</td>
                  <td>{issue.afdeling}</td>
                  <td>{new Date(issue.issued_at).toLocaleDateString('nl-NL')}</td>
                  <td>{issue.notes || '-'}</td>
                  {isSuperUserOrAdmin() && (
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => handleEdit(issue)}
                        className="btn btn--icon btn--secondary"
                        title={t('common.edit')}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(issue.id)}
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
        <IssueModal
          issue={editingIssue}
          radios={radios || []}
          accessories={accessories || []}
          onClose={() => {
            setShowAddModal(false)
            setEditingIssue(null)
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
              <p>Weet je zeker dat je deze afgifte permanent wilt verwijderen?</p>
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

// Issue Modal Component
function IssueModal({ 
  issue, 
  radios, 
  accessories, 
  onClose 
}: { 
  issue: Issue | null
  radios: Radio[]
  accessories: Accessory[]
  onClose: () => void 
}) {
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState<IssueFormData>({
    item_type: issue?.item_type || 'radio',
    item_id: issue?.item_id || '',
    afdeling: issue?.afdeling || '',
    issued_to: issue?.issued_to || '',
    notes: issue?.notes || '',
  })

  const createMutation = useMutation({
    mutationFn: (data: IssueFormData) => IssueService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] })
      onClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<IssueFormData> }) =>
      IssueService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] })
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (issue) {
      updateMutation.mutate({ id: issue.id, data: formData })
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
            {issue ? 'Afgifte Bewerken' : 'Nieuwe Afgifte'}
          </h3>
          <button onClick={onClose} className="modal__close">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="issue-modal__form">
          <div className="issue-modal__grid">
            <div className="issue-modal__group">
              <label className="issue-modal__label">Item Type *</label>
              <select
                className="issue-modal__select"
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
            
            <div className="issue-modal__group">
              <label className="issue-modal__label">Item *</label>
              <select
                className="issue-modal__select"
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
            
            <div className="issue-modal__group">
              <label className="issue-modal__label">Afgegeven aan *</label>
              <input
                type="text"
                className="issue-modal__input"
                value={formData.issued_to}
                onChange={(e) => setFormData({ ...formData, issued_to: e.target.value })}
                required
                placeholder="Bijv. Jan de Vries"
              />
            </div>
            
            <div className="issue-modal__group">
              <label className="issue-modal__label">Afdeling *</label>
              <input
                type="text"
                className="issue-modal__input"
                value={formData.afdeling}
                onChange={(e) => setFormData({ ...formData, afdeling: e.target.value })}
                required
                placeholder="Bijv. Brandweer"
              />
            </div>
          </div>
          
          <div className="issue-modal__group issue-modal__group--full">
            <label className="issue-modal__label">Notities</label>
            <textarea
              className="issue-modal__textarea"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Optionele notities over deze afgifte..."
            />
          </div>
          
          <div className="issue-modal__actions">
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
