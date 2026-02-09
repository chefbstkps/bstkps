import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { PhoneService } from '../services/phoneService'
import { BrandService } from '../services/brandService'
import { OrganizationService } from '../services/organizationService'
import { Phone, PhoneFormData } from '../types'
import { Plus, Edit, Trash2, Search, Filter, Eye, EyeOff } from 'lucide-react'
import './Telefoon.css'

// Column visibility configuration
interface ColumnVisibility {
  merk: boolean
  model: boolean
  type: boolean
  serienummer: boolean
  telefoonnummer: boolean
  provider: boolean
  organisatie: boolean
  structuur: boolean
  afdeling: boolean
  voertuig: boolean
  status: boolean
  registratiedatum: boolean
  opmerking: boolean
  added_by: boolean
}

const COLUMN_LABELS: Record<keyof ColumnVisibility, string> = {
  merk: 'Merk',
  model: 'Model',
  type: 'Type',
  serienummer: 'Serienummer',
  telefoonnummer: 'Telefoonnummer',
  provider: 'Provider',
  organisatie: 'Organisatie',
  structuur: 'Structuur',
  afdeling: 'Afdeling',
  voertuig: 'Voertuig',
  status: 'Status',
  registratiedatum: 'Registratiedatum',
  opmerking: 'Opmerking',
  added_by: 'Toegevoegd door',
}

const DEFAULT_COLUMN_VISIBILITY: ColumnVisibility = {
  merk: true,
  model: true,
  type: true,
  serienummer: true,
  telefoonnummer: true,
  provider: true,
  organisatie: true,
  structuur: false,
  afdeling: true,
  voertuig: false,
  status: true,
  registratiedatum: true,
  opmerking: false,
  added_by: false,
}

const PHONE_TYPES: PhoneFormData['type'][] = ['Smart Phone', 'Dumb Phone', 'Wired Phone', 'Wireless Phone']

export default function Telefoon() {
  const { t } = useLanguage()
  const { isSuperUserOrAdmin } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterOrganisatie, setFilterOrganisatie] = useState<string>('Politie')
  const [showFilters, setShowFilters] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingPhone, setEditingPhone] = useState<Phone | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12
  const [showColumnMenu, setShowColumnMenu] = useState(false)
  const columnMenuRef = useRef<HTMLDivElement>(null)
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(() => {
    const saved = localStorage.getItem('telefoon-column-visibility')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return { ...DEFAULT_COLUMN_VISIBILITY, ...parsed }
      } catch {
        return DEFAULT_COLUMN_VISIBILITY
      }
    }
    return DEFAULT_COLUMN_VISIBILITY
  })

  const { data: phones, isLoading, error } = useQuery({
    queryKey: ['phones'],
    queryFn: () => PhoneService.getAll(),
  })

  const { data: groepen = [] } = useQuery({
    queryKey: ['groepen'],
    queryFn: () => OrganizationService.getAllGroepen(),
  })

  const { data: stats } = useQuery({
    queryKey: ['phone-stats'],
    queryFn: () => PhoneService.getStats(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => PhoneService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phones'] })
      queryClient.invalidateQueries({ queryKey: ['phone-stats'] })
      setDeleteConfirm(null)
    },
  })

  const allFilteredPhones =
    phones?.filter((phone) => {
      const matchSearch =
        phone.merk.toLowerCase().includes(searchTerm.toLowerCase()) ||
        phone.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        phone.serienummer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (phone.telefoonnummer && phone.telefoonnummer.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (phone.provider && phone.provider.toLowerCase().includes(searchTerm.toLowerCase())) ||
        phone.afdeling.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (phone.voertuig && phone.voertuig.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchType = filterType === 'all' || phone.type === filterType
      const matchStatus = filterStatus === 'all' || phone.status === filterStatus
      const matchOrg = filterOrganisatie === 'all' || phone.groep === filterOrganisatie
      return matchSearch && matchType && matchStatus && matchOrg
    }) || []

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterType, filterStatus, filterOrganisatie])

  useEffect(() => {
    localStorage.setItem('telefoon-column-visibility', JSON.stringify(columnVisibility))
  }, [columnVisibility])

  useEffect(() => {
    if (!showColumnMenu) return
    const handleClickOutside = (e: MouseEvent) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(e.target as Node)) {
        setShowColumnMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showColumnMenu])

  const toggleColumn = (column: keyof ColumnVisibility) => {
    setColumnVisibility((prev) => ({ ...prev, [column]: !prev[column] }))
  }

  const totalPages = Math.ceil(allFilteredPhones.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const filteredPhones = allFilteredPhones.slice(startIndex, startIndex + itemsPerPage)

  const handleEdit = (phone: Phone) => {
    setEditingPhone(phone)
    setShowAddModal(true)
  }

  const handleDelete = (id: string) => setDeleteConfirm(id)

  const confirmDelete = () => {
    if (deleteConfirm && deleteConfirmText.toLowerCase() === 'confirm') {
      deleteMutation.mutate(deleteConfirm)
      setDeleteConfirmText('')
    }
  }

  const handleRowClick = (phone: Phone, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.action-buttons')) return
    navigate(`/telefoon/${phone.id}`)
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
        <p>{t('common.error')}: {(error as Error).message}</p>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="telefoon-page-header">
        <div>
          <h1 className="page__title">Telefoon</h1>
          <p className="page__subtitle">Beheer telefoontoestellen</p>
        </div>
        {isSuperUserOrAdmin() && (
          <button onClick={() => setShowAddModal(true)} className="btn btn--primary">
            <Plus size={20} />
            Telefoon toevoegen
          </button>
        )}
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card__value">{stats?.total ?? 0}</div>
          <div className="stat-card__label">Totaal</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{stats?.smart_phone ?? 0}</div>
          <div className="stat-card__label">Smart Phone</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{stats?.dumb_phone ?? 0}</div>
          <div className="stat-card__label">Dumb Phone</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{stats?.wired_phone ?? 0}</div>
          <div className="stat-card__label">Wired Phone</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{stats?.wireless_phone ?? 0}</div>
          <div className="stat-card__label">Wireless Phone</div>
        </div>
      </div>

      <div className="telefoon-filters">
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="btn btn--secondary"
        >
          <Filter size={20} />
          {showFilters ? 'Verberg filters' : 'Toon filters'}
        </button>
        {showFilters && (
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
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-select"
            >
              <option value="all">{t('common.all')}</option>
              {PHONE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">Alle statussen</option>
              <option value="Actief">Actief</option>
              <option value="Defect">Defect</option>
              <option value="Kwijtgeraakt">Kwijtgeraakt</option>
              <option value="Ingetrokken">Ingetrokken</option>
              <option value="Uitgeschakeld">Uitgeschakeld</option>
              <option value="Inactief">Inactief</option>
            </select>
            <select
              value={filterOrganisatie}
              onChange={(e) => setFilterOrganisatie(e.target.value)}
              className="filter-select"
            >
              <option value="all">Alle organisaties</option>
              {groepen.map((g) => (
                <option key={g.id} value={g.name}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="telefoon-table-outer" style={{ position: 'relative' }}>
        <div className="telefoon-show-hide-columns">
          <div ref={columnMenuRef} className="telefoon-column-menu-wrapper">
            <button
              type="button"
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              className="btn-show-hide-columns"
              title="Kolommen weergeven/verbergen"
            >
              {showColumnMenu ? <EyeOff size={20} /> : <Eye size={20} />}
              Kolommen
            </button>
            {showColumnMenu && (
              <div className="column-menu">
                <div className="column-menu__header">
                  <h4>Kolommen weergeven</h4>
                  <button
                    type="button"
                    onClick={() => setShowColumnMenu(false)}
                    className="column-menu__close"
                  >
                    ×
                  </button>
                </div>
                <div className="column-menu__items">
                  {Object.entries(columnVisibility).map(([key, value]) => (
                    <label key={key} className="column-menu__item">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={() => toggleColumn(key as keyof ColumnVisibility)}
                      />
                      <span>{COLUMN_LABELS[key as keyof ColumnVisibility]}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                {columnVisibility.merk && <th>Merk</th>}
                {columnVisibility.model && <th>Model</th>}
                {columnVisibility.type && <th>Type</th>}
                {columnVisibility.serienummer && <th>Serienummer</th>}
                {columnVisibility.telefoonnummer && <th>Telefoonnummer</th>}
                {columnVisibility.provider && <th>Provider</th>}
                {columnVisibility.organisatie && <th>Organisatie</th>}
                {columnVisibility.structuur && <th>Structuur</th>}
                {columnVisibility.afdeling && <th>Afdeling</th>}
                {columnVisibility.voertuig && <th>Voertuig</th>}
                {columnVisibility.status && <th>Status</th>}
                {columnVisibility.registratiedatum && <th>Registratiedatum</th>}
                {columnVisibility.opmerking && <th>Opmerking</th>}
                {columnVisibility.added_by && <th>Toegevoegd door</th>}
                {isSuperUserOrAdmin() && <th>Acties</th>}
              </tr>
            </thead>
            <tbody>
              {filteredPhones.map((phone) => (
                <tr
                  key={phone.id}
                  onClick={(e) => handleRowClick(phone, e)}
                  className="table-row-clickable"
                >
                  {columnVisibility.merk && <td>{phone.merk}</td>}
                  {columnVisibility.model && <td>{phone.model}</td>}
                  {columnVisibility.type && (
                    <td>
                      <span className={`type-badge type-badge--${phone.type.toLowerCase().replace(' ', '-')}`}>
                        {phone.type}
                      </span>
                    </td>
                  )}
                  {columnVisibility.serienummer && <td>{phone.serienummer}</td>}
                  {columnVisibility.telefoonnummer && <td>{phone.telefoonnummer || '—'}</td>}
                  {columnVisibility.provider && <td>{phone.provider || '—'}</td>}
                  {columnVisibility.organisatie && <td>{phone.groep || '—'}</td>}
                  {columnVisibility.structuur && <td>{phone.structuur || '—'}</td>}
                  {columnVisibility.afdeling && <td>{phone.afdeling}</td>}
                  {columnVisibility.voertuig && <td>{phone.voertuig || '—'}</td>}
                  {columnVisibility.status && (
                    <td>
                      <span className={`status-badge status-badge--${phone.status.toLowerCase()}`}>
                        {phone.status}
                      </span>
                    </td>
                  )}
                  {columnVisibility.registratiedatum && <td>{phone.registratiedatum}</td>}
                  {columnVisibility.opmerking && <td>{phone.opmerking || '—'}</td>}
                  {columnVisibility.added_by && <td>{phone.added_by ?? '—'}</td>}
                  {isSuperUserOrAdmin() && (
                    <td className="action-buttons" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="btn-icon"
                        title="Bewerken"
                        onClick={() => handleEdit(phone)}
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        type="button"
                        className="btn-icon btn-icon--danger"
                        title="Verwijderen"
                        onClick={() => handleDelete(phone.id)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            type="button"
            className="btn btn--secondary"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            Vorige
          </button>
          <span className="pagination__info">
            Pagina {currentPage} van {totalPages}
          </span>
          <button
            type="button"
            className="btn btn--secondary"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Volgende
          </button>
        </div>
      )}

      {showAddModal && (
        <PhoneModal
          phone={editingPhone}
          onClose={() => {
            setShowAddModal(false)
            setEditingPhone(null)
          }}
        />
      )}

      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal__header">
              <h3 className="modal__title">Telefoon verwijderen</h3>
              <button
                type="button"
                className="modal__close"
                onClick={() => {
                  setDeleteConfirm(null)
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
                className="telefoon-modal__input"
              />
            </div>
            <div className="modal__actions">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => {
                  setDeleteConfirm(null)
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

function PhoneModal({ phone, onClose }: { phone: Phone | null; onClose: () => void }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState<PhoneFormData>({
    merk: phone?.merk ?? '',
    model: phone?.model ?? '',
    type: phone?.type ?? 'Smart Phone',
    serienummer: phone?.serienummer ?? '',
    telefoonnummer: phone?.telefoonnummer ?? '',
    provider: phone?.provider ?? '',
    afdeling: phone?.afdeling ?? '',
    groep: phone?.groep ?? '',
    structuur: phone?.structuur ?? '',
    voertuig: phone?.voertuig ?? '',
    opmerking: phone?.opmerking ?? '',
    status: phone?.status ?? 'Actief',
    registratiedatum: phone?.registratiedatum ?? new Date().toISOString().split('T')[0],
  })

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: () => BrandService.getAll(),
  })

  const { data: models = [] } = useQuery({
    queryKey: ['brand-models', formData.merk],
    queryFn: () => BrandService.getAllModelsByBrand(formData.merk),
    enabled: !!formData.merk && formData.merk.length === 36,
  })

  const [groepen, setGroepen] = useState<{ id: string; name: string }[]>([])
  const [structuren, setStructuren] = useState<{ id: string; name: string }[]>([])
  const [afdelingen, setAfdelingen] = useState<{ id: string; name: string }[]>([])
  const [serialValidation, setSerialValidation] = useState<{ status: 'idle' | 'checking' | 'valid' | 'invalid'; message: string }>({
    status: 'idle',
    message: '',
  })

  useEffect(() => {
    if (phone && brands.length > 0 && formData.merk === phone.merk) {
      const brand = brands.find((b) => b.name === phone.merk)
      if (brand) {
        setFormData((prev) => ({ ...prev, merk: brand.id }))
      }
    }
  }, [phone, brands])

  useEffect(() => {
    OrganizationService.getAllGroepen().then(setGroepen).catch(console.error)
  }, [])

  useEffect(() => {
    if (!formData.serienummer || phone) {
      setSerialValidation({ status: 'idle', message: '' })
      return
    }
    const ser = formData.serienummer
    const t = setTimeout(() => {
      setSerialValidation({ status: 'checking', message: 'Controleren...' })
      PhoneService.getBySerialNumber(ser)
        .then((existing) => {
          if (existing) {
            setSerialValidation({ status: 'invalid', message: 'Dit serienummer is al in gebruik' })
          } else {
            setSerialValidation({ status: 'valid', message: 'Serienummer is beschikbaar' })
          }
        })
        .catch(() => setSerialValidation({ status: 'invalid', message: 'Fout bij controleren' }))
    }, 500)
    return () => clearTimeout(t)
  }, [formData.serienummer, phone])

  useEffect(() => {
    if (formData.groep) {
      const g = groepen.find((x) => x.name === formData.groep)
      if (g) {
        OrganizationService.getStructurenByGroep(g.id).then(setStructuren).catch(console.error)
      } else setStructuren([])
    } else {
      setStructuren([])
    }
  }, [formData.groep, groepen])

  useEffect(() => {
    if (formData.structuur) {
      const s = structuren.find((x) => x.name === formData.structuur)
      if (s) {
        OrganizationService.getAfdelingenByStructuur(s.id).then(setAfdelingen).catch(console.error)
      } else setAfdelingen([])
    } else {
      setAfdelingen([])
    }
  }, [formData.structuur, structuren])

  const createMutation = useMutation({
    mutationFn: (data: PhoneFormData) =>
      PhoneService.create({ ...data, added_by: user?.username ?? null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phones'] })
      queryClient.invalidateQueries({ queryKey: ['phone-stats'] })
      onClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PhoneFormData> }) =>
      PhoneService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phones'] })
      queryClient.invalidateQueries({ queryKey: ['phone-stats'] })
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone && serialValidation.status !== 'valid') return
    const selectedBrand = brands.find((b) => b.id === formData.merk)
    const submissionData: PhoneFormData = {
      ...formData,
      merk: selectedBrand?.name ?? formData.merk,
    }
    if (phone) {
      updateMutation.mutate({ id: phone.id, data: submissionData })
    } else {
      createMutation.mutate(submissionData)
    }
  }

  const handleBrandChange = (brandId: string) => {
    setFormData((prev) => ({ ...prev, merk: brandId, model: '' }))
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal telefoon-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h3 className="modal__title">{phone ? 'Telefoon bewerken' : 'Telefoon toevoegen'}</h3>
          <button type="button" className="modal__close" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal__body telefoon-modal__body">
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
                  className={`telefoon-modal__input ${serialValidation.status === 'valid' ? 'telefoon-modal__input--valid' : ''} ${serialValidation.status === 'invalid' ? 'telefoon-modal__input--invalid' : ''}`}
                  value={formData.serienummer}
                  onChange={(e) => setFormData({ ...formData, serienummer: e.target.value })}
                  required
                />
                {serialValidation.message && (
                  <span className={`telefoon-modal__validation telefoon-modal__validation--${serialValidation.status}`}>
                    {serialValidation.message}
                  </span>
                )}
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
