import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { PhoneService } from '../services/phoneService'
import { BrandService } from '../services/brandService'
import { OrganizationService } from '../services/organizationService'
import type { Phone, PhoneFormData } from '../types'
import { ArrowLeft, Edit, Trash2 } from 'lucide-react'
import './Telefoon.css'
import './TelefoonDetails.css'
// Edit modal is defined below (PhoneEditModal)
// We'll import the modal component from Telefoon - but Telefoon exports default. So we need to either export PhoneModal from Telefoon or duplicate the modal here. Duplicating would create a lot of code. Better: export PhoneModal from Telefoon as a named export and import here.
// For now I'll inline a simple Edit modal in TelefoonDetails that only allows editing (same fields as PhoneModal but no create flow).

export default function TelefoonDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { isSuperUserOrAdmin } = useAuth()
  const queryClient = useQueryClient()
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const { data: phone, isLoading, error } = useQuery({
    queryKey: ['phone', id],
    queryFn: () => PhoneService.getById(id!),
    enabled: !!id,
  })

  const updateMutation = useMutation({
    mutationFn: (data: Partial<PhoneFormData>) => PhoneService.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phone', id] })
      queryClient.invalidateQueries({ queryKey: ['phones'] })
      queryClient.invalidateQueries({ queryKey: ['phone-stats'] })
      setShowEditModal(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => PhoneService.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phones'] })
      queryClient.invalidateQueries({ queryKey: ['phone-stats'] })
      navigate('/telefoon')
    },
  })

  const confirmDelete = () => {
    if (deleteConfirmText.toLowerCase() === 'confirm') {
      deleteMutation.mutate()
      setShowDeleteModal(false)
      setDeleteConfirmText('')
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

  if (error || !phone) {
    return (
      <div className="page">
        <div className="alert alert--error">
          <p>Telefoon niet gevonden.</p>
          <button type="button" className="btn btn--primary" onClick={() => navigate('/telefoon')}>
            Terug naar Telefoon
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page__header">
        <button type="button" className="btn btn--secondary" onClick={() => navigate('/telefoon')}>
          <ArrowLeft size={20} />
          Terug
        </button>
        <h1 className="page__title">Telefoondetails</h1>
        {isSuperUserOrAdmin() && (
          <div className="page__actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => setShowEditModal(true)}
            >
              <Edit size={20} />
              Bewerken
            </button>
            <button
              type="button"
              className="btn btn--danger"
              onClick={() => setShowDeleteModal(true)}
              disabled={deleteMutation.isPending}
            >
              <Trash2 size={20} />
              Verwijderen
            </button>
          </div>
        )}
      </div>

      <div className="telefoon-details">
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Telefooninformatie</h3>
          </div>
          <div className="card__body">
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Merk</span>
                <span className="info-value">{phone.merk}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Model</span>
                <span className="info-value">{phone.model}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Type</span>
                <span className="info-value">
                  <span className={`type-badge type-badge--${phone.type.toLowerCase().replace(' ', '-')}`}>
                    {phone.type}
                  </span>
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Serienummer</span>
                <span className="info-value">{phone.serienummer}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Telefoonnummer</span>
                <span className="info-value">{phone.telefoonnummer || '—'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Provider</span>
                <span className="info-value">{phone.provider || '—'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Organisatie</span>
                <span className="info-value">{phone.groep || '—'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Structuur</span>
                <span className="info-value">{phone.structuur || '—'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Afdeling</span>
                <span className="info-value">{phone.afdeling}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Voertuig</span>
                <span className="info-value">{phone.voertuig || '—'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Registratiedatum</span>
                <span className="info-value">
                  {new Date(phone.registratiedatum).toLocaleDateString('nl-NL')}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Status</span>
                <span className="info-value">
                  <span className={`status-badge status-badge--${phone.status.toLowerCase()}`}>
                    {phone.status}
                  </span>
                </span>
              </div>
              <div className="info-item info-item--full">
                <span className="info-label">Opmerking</span>
                <span className="info-value">{phone.opmerking || '—'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Toegevoegd door</span>
                <span className="info-value">{phone.added_by ?? '—'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showEditModal && phone && (
        <PhoneEditModal
          phone={phone}
          onClose={() => setShowEditModal(false)}
          onSave={(data) => updateMutation.mutate(data)}
          isPending={updateMutation.isPending}
          error={updateMutation.error?.message}
        />
      )}

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal__header">
              <h3 className="modal__title">Telefoon verwijderen</h3>
              <button
                type="button"
                className="modal__close"
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteConfirmText('')
                }}
              >
                ×
              </button>
            </div>
            <div className="modal__body">
              <p>Weet je zeker dat je deze telefoon permanent wilt verwijderen? Type &quot;confirm&quot; om te bevestigen.</p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type 'confirm'"
                className="telefoon-details-modal__input"
              />
            </div>
            <div className="modal__actions">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteConfirmText('')
                }}
              >
                Annuleren
              </button>
              <button
                type="button"
                className="btn btn--danger"
                disabled={deleteMutation.isPending || deleteConfirmText.toLowerCase() !== 'confirm'}
                onClick={confirmDelete}
              >
                {deleteMutation.isPending ? 'Bezig...' : 'Verwijderen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PhoneEditModal({
  phone,
  onClose,
  onSave,
  isPending,
  error,
}: {
  phone: Phone
  onClose: () => void
  onSave: (data: Partial<PhoneFormData>) => void
  isPending: boolean
  error: string | undefined
}) {
  const [formData, setFormData] = useState<PhoneFormData>({
    merk: phone.merk,
    model: phone.model,
    type: phone.type,
    serienummer: phone.serienummer,
    telefoonnummer: phone.telefoonnummer ?? '',
    provider: phone.provider ?? '',
    afdeling: phone.afdeling,
    groep: phone.groep ?? '',
    structuur: phone.structuur ?? '',
    voertuig: phone.voertuig ?? '',
    opmerking: phone.opmerking ?? '',
    status: phone.status,
    registratiedatum: phone.registratiedatum,
  })

  const [groepen, setGroepen] = useState<{ id: string; name: string }[]>([])
  const [structuren, setStructuren] = useState<{ id: string; name: string }[]>([])
  const [afdelingen, setAfdelingen] = useState<{ id: string; name: string }[]>([])

  const PHONE_TYPES: PhoneFormData['type'][] = ['Smart Phone', 'Dumb Phone', 'Wired Phone', 'Wireless Phone']

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: () => BrandService.getAll(),
  })

  const { data: models = [] } = useQuery({
    queryKey: ['brand-models', formData.merk],
    queryFn: () => BrandService.getAllModelsByBrand(formData.merk),
    enabled: !!formData.merk && formData.merk.length === 36,
  })

  useEffect(() => {
    if (phone && brands.length > 0) {
      const brand = brands.find((b) => b.name === phone.merk)
      if (brand && formData.merk === phone.merk) {
        setFormData((prev) => ({ ...prev, merk: brand.id }))
      }
    }
  }, [phone, brands])

  useEffect(() => {
    OrganizationService.getAllGroepen().then(setGroepen).catch(console.error)
  }, [])

  useEffect(() => {
    if (formData.groep) {
      const g = groepen.find((x) => x.name === formData.groep)
      if (g) {
        OrganizationService.getStructurenByGroep(g.id).then(setStructuren).catch(console.error)
      } else setStructuren([])
    } else setStructuren([])
  }, [formData.groep, groepen])

  useEffect(() => {
    if (formData.structuur) {
      const s = structuren.find((x) => x.name === formData.structuur)
      if (s) {
        OrganizationService.getAfdelingenByStructuur(s.id).then(setAfdelingen).catch(console.error)
      } else setAfdelingen([])
    } else setAfdelingen([])
  }, [formData.structuur, structuren])

  useEffect(() => {
    if (phone.groep && groepen.length > 0) {
      const g = groepen.find((x) => x.name === phone.groep)
      if (g) OrganizationService.getStructurenByGroep(g.id).then(setStructuren).catch(console.error)
    }
  }, [phone.groep, groepen])

  useEffect(() => {
    if (phone.structuur && structuren.length > 0) {
      const s = structuren.find((x) => x.name === phone.structuur)
      if (s) OrganizationService.getAfdelingenByStructuur(s.id).then(setAfdelingen).catch(console.error)
    }
  }, [phone.structuur, structuren])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const selectedBrand = brands.find((b) => b.id === formData.merk)
    const dataToSave: Partial<PhoneFormData> = {
      ...formData,
      merk: selectedBrand?.name ?? formData.merk,
    }
    onSave(dataToSave)
  }

  const handleBrandChange = (brandId: string) => {
    setFormData((prev) => ({ ...prev, merk: brandId, model: '' }))
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal telefoon-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h3 className="modal__title">Telefoon bewerken</h3>
          <button type="button" className="modal__close" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal__body telefoon-modal__body">
            {error && <div className="telefoon-details-modal__error">{error}</div>}
            <div className="telefoon-modal__grid">
              <div className="telefoon-modal__group">
                <label className="telefoon-modal__label">Merk *</label>
                <select
                  className="telefoon-modal__select"
                  value={formData.merk}
                  onChange={(e) => handleBrandChange(e.target.value)}
                  required
                >
                  <option value="">Selecteer merk</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="telefoon-modal__group">
                <label className="telefoon-modal__label">Model *</label>
                <select
                  className="telefoon-modal__select"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  required
                  disabled={!formData.merk || formData.merk.length !== 36}
                >
                  <option value="">Selecteer model</option>
                  {models.map((model) => (
                    <option key={model.id} value={model.name}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="telefoon-modal__group">
                <label className="telefoon-modal__label">Type *</label>
                <select
                  className="telefoon-modal__select"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as PhoneFormData['type'] })}
                  required
                >
                  {PHONE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="telefoon-modal__group">
                <label className="telefoon-modal__label">Serienummer *</label>
                <input
                  type="text"
                  className="telefoon-modal__input"
                  value={formData.serienummer}
                  onChange={(e) => setFormData({ ...formData, serienummer: e.target.value })}
                  required
                />
              </div>
              <div className="telefoon-modal__group">
                <label className="telefoon-modal__label">Telefoonnummer</label>
                <input
                  type="text"
                  className="telefoon-modal__input"
                  value={formData.telefoonnummer ?? ''}
                  onChange={(e) => setFormData({ ...formData, telefoonnummer: e.target.value })}
                />
              </div>
              <div className="telefoon-modal__group">
                <label className="telefoon-modal__label">Provider</label>
                <select
                  className="telefoon-modal__select"
                  value={formData.provider ?? ''}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                >
                  <option value="">Selecteer provider</option>
                  <option value="Telesur">Telesur</option>
                  <option value="Digicel">Digicel</option>
                </select>
              </div>
              <div className="telefoon-modal__group">
                <label className="telefoon-modal__label">Organisatie</label>
                <select
                  className="telefoon-modal__select"
                  value={formData.groep ?? ''}
                  onChange={(e) => setFormData({ ...formData, groep: e.target.value, structuur: '', afdeling: '' })}
                >
                  <option value="">Selecteer organisatie</option>
                  {groepen.map((g) => (
                    <option key={g.id} value={g.name}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="telefoon-modal__group">
                <label className="telefoon-modal__label">Structuur</label>
                <select
                  className="telefoon-modal__select"
                  value={formData.structuur ?? ''}
                  onChange={(e) => setFormData({ ...formData, structuur: e.target.value, afdeling: '' })}
                  disabled={!formData.groep}
                >
                  <option value="">Selecteer structuur</option>
                  {structuren.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="telefoon-modal__group">
                <label className="telefoon-modal__label">Afdeling *</label>
                <select
                  className="telefoon-modal__select"
                  value={formData.afdeling}
                  onChange={(e) => setFormData({ ...formData, afdeling: e.target.value })}
                  disabled={!formData.structuur}
                  required
                >
                  <option value="">Selecteer afdeling</option>
                  {afdelingen.map((a) => (
                    <option key={a.id} value={a.name}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="telefoon-modal__group">
                <label className="telefoon-modal__label">Voertuig</label>
                <input
                  type="text"
                  className="telefoon-modal__input"
                  value={formData.voertuig ?? ''}
                  onChange={(e) => setFormData({ ...formData, voertuig: e.target.value })}
                />
              </div>
              <div className="telefoon-modal__group">
                <label className="telefoon-modal__label">Registratiedatum *</label>
                <input
                  type="date"
                  className="telefoon-modal__input"
                  value={formData.registratiedatum}
                  onChange={(e) => setFormData({ ...formData, registratiedatum: e.target.value })}
                  required
                />
              </div>
              <div className="telefoon-modal__group">
                <label className="telefoon-modal__label">Status *</label>
                <select
                  className="telefoon-modal__select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as PhoneFormData['status'] })}
                  required
                >
                  <option value="Actief">Actief</option>
                  <option value="Defect">Defect</option>
                  <option value="Kwijtgeraakt">Kwijtgeraakt</option>
                  <option value="Ingetrokken">Ingetrokken</option>
                  <option value="Uitgeschakeld">Uitgeschakeld</option>
                  <option value="Inactief">Inactief</option>
                </select>
              </div>
              <div className="telefoon-modal__group telefoon-modal__group--full">
                <label className="telefoon-modal__label">Opmerking</label>
                <textarea
                  className="telefoon-modal__input"
                  value={formData.opmerking ?? ''}
                  onChange={(e) => setFormData({ ...formData, opmerking: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
          </div>
          <div className="modal__actions">
            <button type="button" className="btn btn--secondary" onClick={onClose}>
              Annuleren
            </button>
            <button type="submit" className="btn btn--primary" disabled={isPending}>
              {isPending ? 'Opslaan...' : 'Opslaan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
