import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { PhoneNumbersService } from '../services/phoneNumbersService'
import { OrganizationService } from '../services/organizationService'
import type { PhoneNumber, PhoneNumberFormData, PhoneNumberStatus } from '../types'
import { ArrowLeft, Edit, Trash2 } from 'lucide-react'
import './PhoneNumbers.css'
import './PhoneNumberDetails.css'

const PHONE_NUMBER_STATUSES: PhoneNumberStatus[] = ['actief', 'buiten werking', 'defect', 'inactief']

export default function PhoneNumberDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isSuperUserOrAdmin } = useAuth()
  const queryClient = useQueryClient()
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const { data: phoneNumber, isLoading, error } = useQuery({
    queryKey: ['phone-number', id],
    queryFn: () => PhoneNumbersService.getById(id!),
    enabled: !!id,
  })

  const updateMutation = useMutation({
    mutationFn: (data: Partial<PhoneNumberFormData>) => PhoneNumbersService.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phone-number', id] })
      queryClient.invalidateQueries({ queryKey: ['phone-numbers'] })
      setShowEditModal(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => PhoneNumbersService.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phone-numbers'] })
      navigate('/phone-numbers')
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
        <p>Laden...</p>
      </div>
    )
  }

  if (error || !phoneNumber) {
    return (
      <div className="page">
        <div className="alert alert--error">
          <p>Telefoonnummer niet gevonden.</p>
          <button type="button" className="btn btn--primary" onClick={() => navigate('/phone-numbers')}>
            Terug naar Telefoonnummers
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page__header">
        <button type="button" className="btn btn--secondary" onClick={() => navigate('/phone-numbers')}>
          <ArrowLeft size={20} />
          Terug
        </button>
        <h1 className="page__title">Telefoonnummerdetails</h1>
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

      <div className="phone-number-details">
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Telefoonnummerinformatie</h3>
          </div>
          <div className="card__body">
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Contactpersoon</span>
                <span className="info-value">{phoneNumber.contactpersoon}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Organisatie</span>
                <span className="info-value">{phoneNumber.organisatie || '—'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Structuur</span>
                <span className="info-value">{phoneNumber.structuur || '—'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Afdeling</span>
                <span className="info-value">{phoneNumber.afdeling || '—'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Tel. Nummer</span>
                <span className="info-value">{phoneNumber.tel_nummer}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Extensie</span>
                <span className="info-value">{phoneNumber.extensie || '—'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Accountnummer</span>
                <span className="info-value">{phoneNumber.accountnummer || '—'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Rang</span>
                <span className="info-value">{phoneNumber.rang || '—'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Functie</span>
                <span className="info-value">{phoneNumber.functie || '—'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Adres</span>
                <span className="info-value">{phoneNumber.adres || '—'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Pandnummer</span>
                <span className="info-value">{phoneNumber.pand_no || '—'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Status</span>
                <span className="info-value">
                  <span className={`status-badge status-badge--${phoneNumber.status.replace(/\s+/g, '-')}`}>
                    {phoneNumber.status}
                  </span>
                </span>
              </div>
              <div className="info-item info-item--full">
                <span className="info-label">Tags</span>
                <span className="info-value">{phoneNumber.tags || '—'}</span>
              </div>
              <div className="info-item info-item--full">
                <span className="info-label">Opmerking</span>
                <span className="info-value">{phoneNumber.opmerking || '—'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showEditModal && phoneNumber && (
        <PhoneNumberEditModal
          item={phoneNumber}
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
              <h3 className="modal__title">Telefoonnummer verwijderen</h3>
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
              <p>
                Weet je zeker dat je dit telefoonnummer permanent wilt verwijderen? Type &quot;confirm&quot; om te
                bevestigen.
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type 'confirm'"
                className="phone-numbers-modal__input"
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

function PhoneNumberEditModal({
  item,
  onClose,
  onSave,
  isPending,
  error,
}: {
  item: PhoneNumber
  onClose: () => void
  onSave: (data: Partial<PhoneNumberFormData>) => void
  isPending: boolean
  error: string | undefined
}) {
  const [formData, setFormData] = useState<PhoneNumberFormData>({
    contactpersoon: item.contactpersoon,
    organisatie: item.organisatie ?? '',
    structuur: item.structuur ?? '',
    afdeling: item.afdeling ?? '',
    tel_nummer: item.tel_nummer,
    status: item.status,
    opmerking: item.opmerking ?? '',
    tags: item.tags ?? '',
    accountnummer: item.accountnummer ?? '',
    rang: item.rang ?? '',
    functie: item.functie ?? '',
    adres: item.adres ?? '',
    pand_no: item.pand_no ?? '',
    extensie: item.extensie ?? '',
  })

  const [groepen, setGroepen] = useState<{ id: string; name: string }[]>([])
  const [structuren, setStructuren] = useState<{ id: string; name: string }[]>([])
  const [afdelingen, setAfdelingen] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    OrganizationService.getAllGroepen().then(setGroepen).catch(console.error)
  }, [])

  useEffect(() => {
    if (formData.organisatie) {
      const g = groepen.find((x) => x.name === formData.organisatie)
      if (g) {
        OrganizationService.getStructurenByGroep(g.id).then(setStructuren).catch(console.error)
      } else setStructuren([])
    } else setStructuren([])
  }, [formData.organisatie, groepen])

  useEffect(() => {
    if (formData.structuur) {
      const s = structuren.find((x) => x.name === formData.structuur)
      if (s) {
        OrganizationService.getAfdelingenByStructuur(s.id).then(setAfdelingen).catch(console.error)
      } else setAfdelingen([])
    } else setAfdelingen([])
  }, [formData.structuur, structuren])

  useEffect(() => {
    if (item.organisatie && groepen.length > 0) {
      const g = groepen.find((x) => x.name === item.organisatie)
      if (g) OrganizationService.getStructurenByGroep(g.id).then(setStructuren).catch(console.error)
    }
  }, [item.organisatie, groepen])

  useEffect(() => {
    if (item.structuur && structuren.length > 0) {
      const s = structuren.find((x) => x.name === item.structuur)
      if (s) OrganizationService.getAfdelingenByStructuur(s.id).then(setAfdelingen).catch(console.error)
    }
  }, [item.structuur, structuren])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const dataToSave: Partial<PhoneNumberFormData> = {
      ...formData,
      organisatie: formData.organisatie || undefined,
      structuur: formData.structuur || undefined,
      afdeling: formData.afdeling || undefined,
      opmerking: formData.opmerking || undefined,
      tags: formData.tags || undefined,
      accountnummer: formData.accountnummer || undefined,
      rang: formData.rang || undefined,
      functie: formData.functie || undefined,
      adres: formData.adres || undefined,
      pand_no: formData.pand_no || undefined,
      extensie: formData.extensie || undefined,
    }
    onSave(dataToSave)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal phone-numbers-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h3 className="modal__title">Telefoonnummer bewerken</h3>
          <button type="button" className="modal__close" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal__body phone-numbers-modal__body">
            {error && <div className="phone-number-details-modal__error">{error}</div>}
            <div className="phone-numbers-modal__grid">
              <div className="phone-numbers-modal__group">
                <label className="phone-numbers-modal__label">Organisatie</label>
                <select
                  className="phone-numbers-modal__select"
                  value={formData.organisatie ?? ''}
                  onChange={(e) =>
                    setFormData({ ...formData, organisatie: e.target.value, structuur: '', afdeling: '' })
                  }
                >
                  <option value="">Selecteer organisatie</option>
                  {groepen.map((g) => (
                    <option key={g.id} value={g.name}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="phone-numbers-modal__group">
                <label className="phone-numbers-modal__label">Structuur</label>
                <select
                  className="phone-numbers-modal__select"
                  value={formData.structuur ?? ''}
                  onChange={(e) => setFormData({ ...formData, structuur: e.target.value, afdeling: '' })}
                  disabled={!formData.organisatie}
                >
                  <option value="">Selecteer structuur</option>
                  {structuren.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="phone-numbers-modal__group">
                <label className="phone-numbers-modal__label">Afdeling</label>
                <select
                  className="phone-numbers-modal__select"
                  value={formData.afdeling ?? ''}
                  onChange={(e) => setFormData({ ...formData, afdeling: e.target.value })}
                  disabled={!formData.structuur}
                >
                  <option value="">Selecteer afdeling</option>
                  {afdelingen.map((a) => (
                    <option key={a.id} value={a.name}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="phone-numbers-modal__group">
                <label className="phone-numbers-modal__label">Tel. Nummer *</label>
                <input
                  type="text"
                  className="phone-numbers-modal__input"
                  value={formData.tel_nummer}
                  onChange={(e) => setFormData({ ...formData, tel_nummer: e.target.value })}
                  required
                />
              </div>
              <div className="phone-numbers-modal__group">
                <label className="phone-numbers-modal__label">Extensie</label>
                <input
                  type="text"
                  className="phone-numbers-modal__input"
                  value={formData.extensie ?? ''}
                  onChange={(e) => setFormData({ ...formData, extensie: e.target.value })}
                />
              </div>
              <div className="phone-numbers-modal__group">
                <label className="phone-numbers-modal__label">Accountnummer</label>
                <input
                  type="text"
                  className="phone-numbers-modal__input"
                  value={formData.accountnummer ?? ''}
                  onChange={(e) => setFormData({ ...formData, accountnummer: e.target.value })}
                />
              </div>
              <div className="phone-numbers-modal__group">
                <label className="phone-numbers-modal__label">Contactpersoon *</label>
                <input
                  type="text"
                  className="phone-numbers-modal__input"
                  value={formData.contactpersoon}
                  onChange={(e) => setFormData({ ...formData, contactpersoon: e.target.value })}
                  required
                />
              </div>
              <div className="phone-numbers-modal__group">
                <label className="phone-numbers-modal__label">Rang</label>
                <input
                  type="text"
                  className="phone-numbers-modal__input"
                  value={formData.rang ?? ''}
                  onChange={(e) => setFormData({ ...formData, rang: e.target.value })}
                />
              </div>
              <div className="phone-numbers-modal__group">
                <label className="phone-numbers-modal__label">Functie</label>
                <input
                  type="text"
                  className="phone-numbers-modal__input"
                  value={formData.functie ?? ''}
                  onChange={(e) => setFormData({ ...formData, functie: e.target.value })}
                />
              </div>
              <div className="phone-numbers-modal__group phone-numbers-modal__group--full">
                <label className="phone-numbers-modal__label">Adres</label>
                <input
                  type="text"
                  className="phone-numbers-modal__input"
                  value={formData.adres ?? ''}
                  onChange={(e) => setFormData({ ...formData, adres: e.target.value })}
                />
              </div>
              <div className="phone-numbers-modal__group">
                <label className="phone-numbers-modal__label">Pandnummer</label>
                <input
                  type="text"
                  className="phone-numbers-modal__input"
                  value={formData.pand_no ?? ''}
                  onChange={(e) => setFormData({ ...formData, pand_no: e.target.value })}
                />
              </div>
              <div className="phone-numbers-modal__group">
                <label className="phone-numbers-modal__label">Status *</label>
                <select
                  className="phone-numbers-modal__select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as PhoneNumberStatus })}
                  required
                >
                  {PHONE_NUMBER_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div className="phone-numbers-modal__group phone-numbers-modal__group--full">
                <label className="phone-numbers-modal__label">Tags</label>
                <input
                  type="text"
                  className="phone-numbers-modal__input"
                  value={formData.tags ?? ''}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="Tags gescheiden door komma's"
                />
              </div>
              <div className="phone-numbers-modal__group phone-numbers-modal__group--full">
                <label className="phone-numbers-modal__label">Opmerking</label>
                <textarea
                  className="phone-numbers-modal__textarea"
                  value={formData.opmerking ?? ''}
                  onChange={(e) => setFormData({ ...formData, opmerking: e.target.value })}
                  rows={3}
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
