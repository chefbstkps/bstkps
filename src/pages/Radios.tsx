import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { RadioService } from '../services/radioService'
import { BrandService } from '../services/brandService'
import { OrganizationService } from '../services/organizationService'
import { Radio, RadioFormData } from '../types'
import { Plus, Edit, Trash2, Search, Eye, EyeOff, Filter } from 'lucide-react'
import './Radios.css'

// Column visibility configuration
interface ColumnVisibility {
  id: boolean
  merk: boolean
  model: boolean
  type: boolean
  serienummer: boolean
  alias: boolean
  organisatie: boolean
  structuur: boolean
  afdeling: boolean
  voertuig: boolean
  opmerking: boolean
  status: boolean
  added_by: boolean
}

// Column labels for visibility menu
const COLUMN_LABELS: Record<keyof ColumnVisibility, string> = {
  id: 'ID',
  merk: 'Merk',
  model: 'Model',
  type: 'Type',
  serienummer: 'Serienummer',
  alias: 'Alias',
  organisatie: 'Organisatie',
  structuur: 'Structuur',
  afdeling: 'Afdeling',
  voertuig: 'Voertuig',
  opmerking: 'Opmerking',
  status: 'Status',
  added_by: 'Toegevoegd door'
}

const DEFAULT_COLUMN_VISIBILITY: ColumnVisibility = {
  id: true,
  merk: false,
  model: true,
  type: true,
  serienummer: true,
  alias: false,
  organisatie: false,
  structuur: false,
  afdeling: true,
  voertuig: false,
  opmerking: false,
  status: true,
  added_by: false,
}

export default function Radios() {
  const { t } = useLanguage()
  const { isSuperUserOrAdmin, user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterOrganisatie, setFilterOrganisatie] = useState<string>('Politie')
  const [showFilters, setShowFilters] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingRadio, setEditingRadio] = useState<Radio | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [showMultiDeleteModal, setShowMultiDeleteModal] = useState(false)
  const [multiDeleteConfirmText, setMultiDeleteConfirmText] = useState('')
  const [showCsvModal, setShowCsvModal] = useState(false)
  const [selectedRadios, setSelectedRadios] = useState<Set<string>>(new Set())
  const [showColumnMenu, setShowColumnMenu] = useState(false)
  const columnMenuRef = useRef<HTMLDivElement>(null)
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(() => {
    // Load from localStorage or use defaults
    const saved = localStorage.getItem('radios-column-visibility')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Merge with defaults to ensure new columns are included
        return { ...DEFAULT_COLUMN_VISIBILITY, ...parsed }
      } catch (e) {
        return DEFAULT_COLUMN_VISIBILITY
      }
    }
    return DEFAULT_COLUMN_VISIBILITY
  })
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)

  const { data: radios, isLoading, error } = useQuery({
    queryKey: ['radios'],
    queryFn: () => RadioService.getAll(),
  })

  // Load all groepen for organisatie filter
  const { data: groepen = [] } = useQuery({
    queryKey: ['groepen'],
    queryFn: () => OrganizationService.getAllGroepen(),
  })

  const { data: stats } = useQuery({
    queryKey: ['radio-stats'],
    queryFn: () => RadioService.getStats(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => RadioService.delete(id, user?.username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['radios'] })
      queryClient.invalidateQueries({ queryKey: ['radio-stats'] })
      queryClient.invalidateQueries({ queryKey: ['radios-archive'] })
      setDeleteConfirm(null)
    },
  })

  const multiDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map(id => RadioService.delete(id, user?.username)))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['radios'] })
      queryClient.invalidateQueries({ queryKey: ['radio-stats'] })
      queryClient.invalidateQueries({ queryKey: ['radios-archive'] })
      setSelectedRadios(new Set())
    },
  })

  // Save column visibility to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('radios-column-visibility', JSON.stringify(columnVisibility))
  }, [columnVisibility])

  // Close column menu when clicking outside
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
    setColumnVisibility(prev => ({
      ...prev,
      [column]: !prev[column]
    }))
  }

  const toggleSelectAll = () => {
    if (selectedRadios.size === allFilteredRadios.length) {
      setSelectedRadios(new Set())
    } else {
      setSelectedRadios(new Set(allFilteredRadios.map(r => r.id)))
    }
  }

  const toggleSelectRadio = (id: string) => {
    const newSelected = new Set(selectedRadios)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedRadios(newSelected)
  }

  const handleMultiDelete = () => {
    if (selectedRadios.size === 0) return
    setShowMultiDeleteModal(true)
  }

  const confirmMultiDelete = () => {
    if (multiDeleteConfirmText.toLowerCase() === 'confirm') {
      multiDeleteMutation.mutate(Array.from(selectedRadios))
      setShowMultiDeleteModal(false)
      setMultiDeleteConfirmText('')
    }
  }

  const allFilteredRadios = radios?.filter(radio => {
    const matchesSearch = radio.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         radio.merk.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         radio.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         radio.alias.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         radio.serienummer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         radio.afdeling.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (radio.voertuig && radio.voertuig.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesFilter = filterType === 'all' || radio.type === filterType
    const matchesStatus = filterStatus === 'all' || radio.status === filterStatus
    const matchesOrganisatie = filterOrganisatie === 'all' || radio.groep === filterOrganisatie
    
    return matchesSearch && matchesFilter && matchesStatus && matchesOrganisatie
  }).sort((a, b) => {
    // Sort by ID (numeric comparison)
    const idA = parseInt(a.id)
    const idB = parseInt(b.id)
    return idA - idB
  }) || []

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterType, filterStatus, filterOrganisatie])

  // Calculate pagination
  const totalItems = allFilteredRadios.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const filteredRadios = allFilteredRadios.slice(startIndex, endIndex)

  // Generate page numbers with smart ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      // Show all pages if 7 or less
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const pages: (number | string)[] = []
    
    if (currentPage <= 4) {
      // Near the start: 1,2,3,4,5,...,last
      for (let i = 1; i <= 5; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(totalPages)
    } else if (currentPage >= totalPages - 3) {
      // Near the end: 1,...,last-4,last-3,last-2,last-1,last
      pages.push(1)
      pages.push('...')
      for (let i = totalPages - 4; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // In the middle: 1,...,current-1,current,current+1,...,last
      pages.push(1)
      pages.push('...')
      pages.push(currentPage - 1)
      pages.push(currentPage)
      pages.push(currentPage + 1)
      pages.push('...')
      pages.push(totalPages)
    }

    return pages
  }

  const handleEdit = (radio: Radio) => {
    setEditingRadio(radio)
    setShowAddModal(true)
  }

  const handleDelete = (id: string) => {
    setDeleteConfirm(id)
  }

  const confirmDelete = () => {
    if (deleteConfirm && deleteConfirmText.toLowerCase() === 'confirm') {
      deleteMutation.mutate(deleteConfirm)
      setDeleteConfirmText('')
    }
  }

  const handleRowClick = (radio: Radio, e: React.MouseEvent) => {
    // Don't navigate if clicking on checkbox or action buttons
    const target = e.target as HTMLElement
    if (target.closest('.row-checkbox') || target.closest('.action-buttons')) {
      return
    }
    navigate(`/radios/${radio.id}`)
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
      <div className="radios-page-header">
        <div className="radios-page-header-left">
        <h1 className="page__title">{t('radios.title')}</h1>
        <p className="page__subtitle">
            Beheer alle radiocommunicatie apparatuur
          </p>
        </div>

        <div className="radios-page-header-right">
        {isSuperUserOrAdmin() && (
          <>
          <button
            onClick={() => setShowCsvModal(true)}
            className="btn-radios-import-export"
          >
            📊 Import/Export
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn--primary"
          >
            <Plus size={20} />
            {t('radios.add')}
          </button>
          </>
        )}
          
          

          

          
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card__value">{stats?.total || 0}</div>
          <div className="stat-card__label">{t('radios.total')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{stats?.portable || 0}</div>
          <div className="stat-card__label">{t('radios.portable')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{stats?.mobile || 0}</div>
          <div className="stat-card__label">{t('radios.mobile')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{stats?.base || 0}</div>
          <div className="stat-card__label">{t('radios.base')}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="radios-page-filters">
        <div className="radios-show-hide-filters">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-radios-import-export"
            style={{ marginBottom: showFilters ? '1rem' : '0' }}
          >
            <Filter size={20} />
            {showFilters ? 'Verberg Filters' : 'Toon Filters'}
          </button>
        </div>

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
            <option value="Portable">{t('radios.portable')}</option>
            <option value="Mobile">{t('radios.mobile')}</option>
            <option value="Base">{t('radios.base')}</option>
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">Alle Statussen</option>
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
            <option value="all">Alle Organisaties</option>
            {groepen.map(groep => (
              <option key={groep.id} value={groep.name}>
                {groep.name}
              </option>
            ))}
          </select>
        </div>
        )}
      </div>

      {/* Table */}
      <div className="radios-table-outer" style={{ position: 'relative' }}>
        <div className="radios-show-hide-columns">
          {isSuperUserOrAdmin() && selectedRadios.size > 0 && (
            <button
              onClick={handleMultiDelete}
              className="btn btn--danger"
              disabled={multiDeleteMutation.isPending}
            >
              <Trash2 size={20} />
              Verwijder {selectedRadios.size} geselecteerd
            </button>
          )}
          <div ref={columnMenuRef} className="radios-column-menu-wrapper">
            <button
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
              {isSuperUserOrAdmin() && (
              <th style={{ width: '40px' }}>
                <input
                  type="checkbox"
                  checked={selectedRadios.size === allFilteredRadios.length && allFilteredRadios.length > 0}
                  onChange={toggleSelectAll}
                  title="Selecteer alles"
                />
              </th>
              )}
              {columnVisibility.id && <th>{t('radios.id')}</th>}
              {columnVisibility.merk && <th>{t('radios.merk')}</th>}
              {columnVisibility.model && <th>{t('radios.model')}</th>}
              {columnVisibility.type && <th>{t('radios.type')}</th>}
              {columnVisibility.serienummer && <th>{t('radios.serienummer')}</th>}
              {columnVisibility.alias && <th>{t('radios.alias')}</th>}
              {columnVisibility.organisatie && <th>Organisatie</th>}
              {columnVisibility.structuur && <th>Structuur</th>}
              {columnVisibility.afdeling && <th>{t('radios.afdeling')}</th>}
              {columnVisibility.voertuig && <th>Voertuig</th>}
              {columnVisibility.opmerking && <th>{t('radios.opmerking')}</th>}
              {columnVisibility.status && <th>Status</th>}
              {columnVisibility.added_by && <th>Toegevoegd door</th>}
              {isSuperUserOrAdmin() && <th>{t('radios.actions')}</th>}
            </tr>
          </thead>
          <tbody>
            {filteredRadios.map((radio) => (
              <tr 
                key={radio.id} 
                onClick={(e) => handleRowClick(radio, e)} 
                className={`table-row-clickable ${selectedRadios.has(radio.id) ? 'row-selected' : ''}`}
              >
                {isSuperUserOrAdmin() && (
                <td className="row-checkbox" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedRadios.has(radio.id)}
                    onChange={() => toggleSelectRadio(radio.id)}
                  />
                </td>
                )}
                {columnVisibility.id && <td>{radio.id}</td>}
                {columnVisibility.merk && <td>{radio.merk}</td>}
                {columnVisibility.model && <td>{radio.model}</td>}
                {columnVisibility.type && (
                  <td>
                    <span className={`type-badge type-badge--${radio.type.toLowerCase()}`}>
                      {radio.type}
                    </span>
                  </td>
                )}
                {columnVisibility.serienummer && <td>{radio.serienummer}</td>}
                {columnVisibility.alias && <td>{radio.alias}</td>}
                {columnVisibility.organisatie && <td>{radio.groep || '-'}</td>}
                {columnVisibility.structuur && <td>{radio.structuur || '-'}</td>}
                {columnVisibility.afdeling && <td>{radio.afdeling}</td>}
                {columnVisibility.voertuig && <td>{radio.type === 'Mobile' ? (radio.voertuig || '-') : '-'}</td>}
                {columnVisibility.opmerking && <td>{radio.opmerking || '-'}</td>}
                {columnVisibility.status && (
                  <td>
                    <span className={`status-badge status-badge--${radio.status.toLowerCase()}`}>
                      {radio.status}
                    </span>
                  </td>
                )}
                {columnVisibility.added_by && <td>{radio.added_by ?? '-'}</td>}
                {isSuperUserOrAdmin() && (
                <td>
                  <div className="radios-action-buttons" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleEdit(radio)}
                      className="btn btn--icon btn--secondary"
                      title={t('common.edit')}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(radio.id)}
                      className="btn btn--icon btn--danger"
                      title={t('common.delete')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Toon {startIndex + 1}-{Math.min(endIndex, totalItems)} van {totalItems} radio's
            </div>
            
            <div className="pagination-controls">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="pagination-btn pagination-btn--nav"
                title="Vorige pagina"
              >
                ‹
              </button>

              {getPageNumbers().map((page, index) => (
                typeof page === 'number' ? (
                  <button
                    key={index}
                    onClick={() => setCurrentPage(page)}
                    className={`pagination-btn ${currentPage === page ? 'pagination-btn--active' : ''}`}
                  >
                    {page}
                  </button>
                ) : (
                  <span key={index} className="pagination-ellipsis">
                    {page}
                  </span>
                )
              ))}

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="pagination-btn pagination-btn--nav"
                title="Volgende pagina"
              >
                ›
              </button>
            </div>

            <div className="pagination-page-size">
              <label htmlFor="pageSize">Items per pagina:</label>
              <select
                id="pageSize"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="pagination-select"
              >
                <option value={12}>12</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        )}
      </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <RadioModal
          radio={editingRadio}
          onClose={() => {
            setShowAddModal(false)
            setEditingRadio(null)
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
                onClick={() => {
                  setDeleteConfirm(null)
                  setDeleteConfirmText('')
                }}
                className="modal__close"
              >
                ×
              </button>
            </div>
            <div className="radios-modal-body">
              <p style={{ marginBottom: '1rem', color: '#c62828', fontWeight: '500' }}>
                ⚠️ Weet je zeker dat je deze radio permanent wilt verwijderen?
              </p>
              <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#666' }}>
                Deze actie kan niet ongedaan worden gemaakt. Type <strong>"Confirm"</strong> om te bevestigen:
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type 'Confirm' om te bevestigen"
                className="radio-modal__input"
                style={{ width: '100%', marginBottom: '0' }}
                autoFocus
              />
            </div>
            <div className="modal__actions">
              <button
                onClick={() => {
                  setDeleteConfirm(null)
                  setDeleteConfirmText('')
                }}
                className="btn btn--secondary"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={confirmDelete}
                className="btn btn--danger"
                disabled={deleteMutation.isPending || deleteConfirmText.toLowerCase() !== 'confirm'}
              >
                {deleteMutation.isPending ? t('common.loading') : t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi Delete Confirmation Modal */}
      {showMultiDeleteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal__header">
              <h3 className="modal__title">Meerdere Radio's Verwijderen</h3>
              <button
                onClick={() => {
                  setShowMultiDeleteModal(false)
                  setMultiDeleteConfirmText('')
                }}
                className="modal__close"
              >
                ×
              </button>
            </div>
            <div className="modal__body">
              <p style={{ marginBottom: '1rem', color: '#c62828', fontWeight: '500' }}>
                ⚠️ Weet je zeker dat je <strong>{selectedRadios.size} radio's</strong> permanent wilt verwijderen?
              </p>
              <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#666' }}>
                Deze actie kan niet ongedaan worden gemaakt. Type <strong>"Confirm"</strong> om te bevestigen:
              </p>
              <input
                type="text"
                value={multiDeleteConfirmText}
                onChange={(e) => setMultiDeleteConfirmText(e.target.value)}
                placeholder="Type 'Confirm' om te bevestigen"
                className="radio-modal__input"
                style={{ width: '100%', marginBottom: '0' }}
                autoFocus
              />
            </div>
            <div className="modal__actions">
              <button
                onClick={() => {
                  setShowMultiDeleteModal(false)
                  setMultiDeleteConfirmText('')
                }}
                className="btn btn--secondary"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={confirmMultiDelete}
                className="btn btn--danger"
                disabled={multiDeleteMutation.isPending || multiDeleteConfirmText.toLowerCase() !== 'confirm'}
              >
                {multiDeleteMutation.isPending ? t('common.loading') : `Verwijder ${selectedRadios.size} radio's`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import/Export Modal */}
      {showCsvModal && (
        <CSVImportExportModal
          onClose={() => setShowCsvModal(false)}
          radios={radios || []}
          onImportComplete={() => {
            queryClient.invalidateQueries({ queryKey: ['radios'] })
            queryClient.invalidateQueries({ queryKey: ['radio-stats'] })
            setShowCsvModal(false)
          }}
          onExport={() => {
            try {
              if (!radios) {
                alert('Geen radio data beschikbaar voor export.')
                return
              }
              
              const headers = ['ID', 'Merk', 'Model', 'Type', 'Serienummer', 'Alias', 'Organisatie', 'Structuur', 'Afdeling', 'Voertuig', 'Registratiedatum', 'Status', 'Opmerking']
              const csvContent = [
                headers.join(','),
                ...radios.map(radio => [
                  radio.id,
                  radio.merk,
                  radio.model,
                  radio.type,
                  radio.serienummer,
                  radio.alias,
                  radio.groep || '',
                  radio.structuur || '',
                  radio.afdeling,
                  radio.voertuig || '',
                  radio.registratiedatum,
                  radio.status,
                  radio.opmerking || ''
                ].join(','))
              ].join('\n')
              
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
              const link = document.createElement('a')
              const url = URL.createObjectURL(blob)
              link.setAttribute('href', url)
              link.setAttribute('download', `radios_export_${new Date().toISOString().split('T')[0]}.csv`)
              link.style.visibility = 'hidden'
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
              
              alert(`${radios?.length || 0} radio's succesvol geëxporteerd!`)
            } catch (error) {
              console.error('Export failed:', error)
              alert('Fout bij exporteren.')
            }
          }}
        />
      )}
    </div>
  )
}

// CSV Import/Export Modal Component
function CSVImportExportModal({ 
  onClose, 
  radios,
  onImportComplete,
  onExport
}: { 
  onClose: () => void
  radios: Radio[]
  onImportComplete: () => void
  onExport: () => void
}) {
  const { user } = useAuth()
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [parsedData, setParsedData] = useState<{
    valid: RadioFormData[]
    errors: { row: number; message: string }[]
    warnings: { row: number; message: string }[]
  } | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  // Parse and validate CSV file
  const parseCSVFile = async (file: File) => {
    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        alert('CSV bestand moet minimaal een header en één data rij bevatten.')
        return
      }
      
      const headers = lines[0].split(',').map(h => h.trim())
      const expectedHeaders = ['ID', 'Merk', 'Model', 'Type', 'Serienummer', 'Alias', 'Organisatie', 'Structuur', 'Afdeling', 'Voertuig', 'Registratiedatum', 'Status', 'Opmerking']
      
      // Validate headers
      const missingHeaders = expectedHeaders.filter(h => !headers.includes(h))
      if (missingHeaders.length > 0) {
        alert(`Ontbrekende kolommen in CSV: ${missingHeaders.join(', ')}`)
        return
      }
      
      const validRadios: RadioFormData[] = []
      const errors: { row: number; message: string }[] = []
      const warnings: { row: number; message: string }[] = []
      const existingIds = new Set<string>()
      const existingSerials = new Set<string>()
      
      // Get existing data for validation
      radios.forEach(radio => {
        existingIds.add(radio.id)
        existingSerials.add(radio.serienummer)
      })
      
      // Process data rows
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim())
        const rowNumber = i + 1
        
        if (values.length < 12) {
          errors.push({ row: rowNumber, message: `Onvoldoende kolommen (${values.length}/13 verwacht)` })
          continue
        }
        
        const [id, merk, model, type, serienummer, alias, organisatie, structuur, afdeling, voertuig, registratiedatum, status, opmerking] = values
        
        let hasError = false
        
        // Validate ID
        if (!id || id.length !== 4 || !/^\d{4}$/.test(id)) {
          errors.push({ row: rowNumber, message: `ID moet 4 cijfers zijn (huidige waarde: "${id}")` })
          hasError = true
        } else if (existingIds.has(id)) {
          errors.push({ row: rowNumber, message: `ID ${id} bestaat al in het systeem` })
          hasError = true
        }
        
        // Validate serial number
        if (!serienummer) {
          errors.push({ row: rowNumber, message: 'Serienummer is verplicht' })
          hasError = true
        } else if (existingSerials.has(serienummer)) {
          errors.push({ row: rowNumber, message: `Serienummer ${serienummer} bestaat al` })
          hasError = true
        }
        
        // Validate type
        if (!['Portable', 'Mobile', 'Base'].includes(type)) {
          errors.push({ row: rowNumber, message: `Type moet Portable, Mobile of Base zijn (huidige waarde: "${type}")` })
          hasError = true
        }
        
        // Validate status
        if (!['Actief', 'Defect', 'Kwijtgeraakt', 'Ingetrokken', 'Uitgeschakeld', 'Inactief'].includes(status)) {
          errors.push({ row: rowNumber, message: `Status ongeldig: "${status}"` })
          hasError = true
        }
        
        // Validate required fields
        if (!merk) {
          errors.push({ row: rowNumber, message: 'Merk is verplicht' })
          hasError = true
        }
        if (!model) {
          errors.push({ row: rowNumber, message: 'Model is verplicht' })
          hasError = true
        }
        if (!alias) {
          errors.push({ row: rowNumber, message: 'Alias is verplicht' })
          hasError = true
        }
        if (!afdeling) {
          errors.push({ row: rowNumber, message: 'Afdeling is verplicht' })
          hasError = true
        }
        
        // Warnings for optional fields
        if (!organisatie) {
          warnings.push({ row: rowNumber, message: 'Organisatie is leeg' })
        }
        if (!structuur) {
          warnings.push({ row: rowNumber, message: 'Structuur is leeg' })
        }
        
        if (!hasError) {
          validRadios.push({
            id,
            merk,
            model,
            type: type as 'Portable' | 'Mobile' | 'Base',
            serienummer,
            alias,
            afdeling,
            groep: organisatie || '',
            structuur: structuur || '',
            voertuig: voertuig || '',
            registratiedatum: registratiedatum || new Date().toISOString().split('T')[0],
            status: status as 'Actief' | 'Defect' | 'Kwijtgeraakt' | 'Ingetrokken' | 'Uitgeschakeld' | 'Inactief',
            opmerking: opmerking || ''
          })
          
          // Add to existing sets to prevent duplicates within the same import
          existingIds.add(id)
          existingSerials.add(serienummer)
        }
      }
      
      setParsedData({ valid: validRadios, errors, warnings })
      setShowPreview(true)
    } catch (error) {
      console.error('Parse failed:', error)
      alert('Fout bij het lezen van het CSV bestand.')
    }
  }

  // Perform actual import
  const performImport = async () => {
    if (!parsedData || parsedData.valid.length === 0) return
    
    setIsImporting(true)
    try {
      const addedBy = user?.username ?? 'Admin'
      for (const radio of parsedData.valid) {
        await RadioService.create({ ...radio, added_by: addedBy })
      }
      alert(`✅ ${parsedData.valid.length} radio's succesvol geïmporteerd!`)
      onImportComplete()
    } catch (error) {
      console.error('Import failed:', error)
      alert('Er is een fout opgetreden tijdens het importeren.')
    } finally {
      setIsImporting(false)
    }
  }

  // Download CSV template
  const downloadTemplate = () => {
    const headers = ['ID', 'Merk', 'Model', 'Type', 'Serienummer', 'Alias', 'Organisatie', 'Structuur', 'Afdeling', 'Voertuig', 'Registratiedatum', 'Status', 'Opmerking']
    
    // Sample data rows with unique IDs
    const sampleData = [
      ['2001', 'Motorola', 'DP4400', 'Portable', '426CPB2001', 'Recherche-01', 'Politie', 'Regio Oost', 'Recherche', '', '2024-01-15', 'Actief', 'Nieuwe radio voor recherche team'],
      ['2002', 'Motorola', 'DP4400', 'Portable', '426CPB2002', 'Recherche-02', 'Politie', 'Regio Oost', 'Recherche', '', '2024-01-15', 'Actief', 'Reserve radio'],
      ['2003', 'Motorola', 'APX8000', 'Mobile', '426CMB2001', 'Patrouille-01', 'Politie', 'Regio West', 'Patrouille', 'Toyota Land Cruiser - PZ-123', '2024-01-20', 'Actief', 'Geïnstalleerd in voertuig 123'],
      ['2004', 'Kenwood', 'NX-5200', 'Base', '426CBB2001', 'Base-01', 'Brandweer', 'District Noord', 'Communicatie', '', '2024-01-25', 'Actief', 'Hoofdstation communicatie'],
      ['2005', 'Motorola', 'DP4400', 'Portable', '426CPB2003', 'Recherche-03', 'Politie', 'Regio Oost', 'Recherche', '', '2024-02-01', 'Defect', ''],
      ['2006', 'Kenwood', 'NX-5200', 'Mobile', '426CMB2002', 'Patrouille-02', 'EMS', 'Regio Zuid', 'Ambulance', 'Mercedes Sprinter - PZ-456', '2024-02-05', 'Actief', 'Geïnstalleerd in voertuig 456'],
      ['2007', 'Motorola', 'APX8000', 'Portable', '426CPB2004', 'Recherche-04', 'Politie', 'Regio Oost', 'Recherche', '', '2024-02-10', 'Actief', 'Nieuwe radio met GPS'],
      ['2008', 'Kenwood', 'NX-5200', 'Base', '426CBB2002', 'Base-02', 'Brandweer', 'District Zuid', 'Communicatie', '', '2024-02-15', 'Inactief', 'Backup station']
    ]
    
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'radio_import_template.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  // Handle drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setSelectedFile(file)
      } else {
        alert('Alleen CSV bestanden zijn toegestaan.')
      }
    }
  }

  // Handle file input change
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setSelectedFile(file)
      } else {
        alert('Alleen CSV bestanden zijn toegestaan.')
      }
    }
  }

  // Handle import - start preview
  const handleImport = () => {
    if (selectedFile) {
      parseCSVFile(selectedFile)
    }
  }
  
  // Go back from preview
  const handleBack = () => {
    setShowPreview(false)
    setParsedData(null)
    setSelectedFile(null)
  }

  return (
    <div className="modal-overlay">
      <div className="modal csv-modal" style={{ maxWidth: showPreview ? '900px' : '700px' }}>
        <div className="modal__header">
          <h2>{showPreview ? 'Import Preview' : 'CSV Import/Export'}</h2>
          <button onClick={onClose} className="modal__close">×</button>
        </div>
        <div className="csv-modal__content">
          
          {/* PREVIEW MODE */}
          {showPreview && parsedData && (
            <>
              {/* Summary */}
              <div className="csv-modal__section">
                <h3>📊 Samenvatting</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1rem' }}>
                  <div style={{ padding: '1rem', background: '#e8f5e9', borderRadius: '0.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2e7d32' }}>{parsedData.valid.length}</div>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>Geldige rijen</div>
                  </div>
                  <div style={{ padding: '1rem', background: '#ffebee', borderRadius: '0.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#c62828' }}>{parsedData.errors.length}</div>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>Fouten</div>
                  </div>
                  <div style={{ padding: '1rem', background: '#fff3e0', borderRadius: '0.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef6c00' }}>{parsedData.warnings.length}</div>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>Waarschuwingen</div>
                  </div>
                </div>
              </div>

              {/* Errors */}
              {parsedData.errors.length > 0 && (
                <div className="csv-modal__section" style={{ borderLeft: '4px solid #c62828' }}>
                  <h3 style={{ color: '#c62828' }}>❌ Fouten ({parsedData.errors.length})</h3>
                  <p style={{ color: '#666', marginBottom: '1rem' }}>
                    De volgende rijen bevatten fouten en zullen <strong>niet</strong> worden geïmporteerd:
                  </p>
                  <div style={{ maxHeight: '200px', overflowY: 'auto', background: '#fff', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #ffcdd2' }}>
                    {parsedData.errors.map((error, idx) => (
                      <div key={idx} style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: '#333' }}>
                        <strong style={{ color: '#c62828' }}>Rij {error.row}:</strong> {error.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {parsedData.warnings.length > 0 && (
                <div className="csv-modal__section" style={{ borderLeft: '4px solid #ef6c00' }}>
                  <h3 style={{ color: '#ef6c00' }}>⚠️ Waarschuwingen ({parsedData.warnings.length})</h3>
                  <p style={{ color: '#666', marginBottom: '1rem' }}>
                    De volgende rijen bevatten waarschuwingen maar worden wel geïmporteerd:
                  </p>
                  <div style={{ maxHeight: '150px', overflowY: 'auto', background: '#fff', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #ffe0b2' }}>
                    {parsedData.warnings.slice(0, 10).map((warning, idx) => (
                      <div key={idx} style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: '#333' }}>
                        <strong style={{ color: '#ef6c00' }}>Rij {warning.row}:</strong> {warning.message}
                      </div>
                    ))}
                    {parsedData.warnings.length > 10 && (
                      <div style={{ fontSize: '0.875rem', color: '#666', fontStyle: 'italic' }}>
                        ... en {parsedData.warnings.length - 10} meer waarschuwingen
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Preview Data */}
              {parsedData.valid.length > 0 && (
                <div className="csv-modal__section">
                  <h3>👁️ Preview (eerste 5 rijen)</h3>
                  <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
                    <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f5f5f5' }}>
                          <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>ID</th>
                          <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Merk</th>
                          <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Model</th>
                          <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Type</th>
                          <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Alias</th>
                          <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Afdeling</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedData.valid.slice(0, 5).map((radio, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '0.5rem' }}>{radio.id}</td>
                            <td style={{ padding: '0.5rem' }}>{radio.merk}</td>
                            <td style={{ padding: '0.5rem' }}>{radio.model}</td>
                            <td style={{ padding: '0.5rem' }}>{radio.type}</td>
                            <td style={{ padding: '0.5rem' }}>{radio.alias}</td>
                            <td style={{ padding: '0.5rem' }}>{radio.afdeling}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parsedData.valid.length > 5 && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666', fontStyle: 'italic' }}>
                        ... en {parsedData.valid.length - 5} meer rijen
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="modal__actions" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
                <button
                  onClick={handleBack}
                  className="btn btn--secondary"
                  disabled={isImporting}
                >
                  ← Terug
                </button>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    onClick={onClose}
                    className="btn btn--secondary"
                    disabled={isImporting}
                  >
                    Annuleren
                  </button>
                  <button
                    onClick={performImport}
                    className="btn btn--primary"
                    disabled={parsedData.valid.length === 0 || isImporting}
                  >
                    {isImporting ? 'Bezig met importeren...' : `✅ Importeer ${parsedData.valid.length} radio's`}
                  </button>
                </div>
              </div>
            </>
          )}
          
          {/* UPLOAD MODE */}
          {!showPreview && (
            <>
          
          {/* Template Download */}
          <div className="csv-modal__section">
            <h3>📄 Template Downloaden</h3>
            <p>Download een CSV template om de juiste format te zien. <strong>ID's moeten uniek zijn en bestaan uit 4 cijfers.</strong></p>
            <button
              onClick={downloadTemplate}
              className="btn btn--secondary"
            >
              📥 Template Downloaden
            </button>
          </div>

          {/* Import Section */}
          <div className="csv-modal__section">
            <h3>📤 CSV Importeren</h3>
            <p>Upload een CSV bestand om radio's te importeren. Het systeem controleert automatisch op:</p>
            <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', fontSize: '0.9rem', color: '#666' }}>
              <li>Unieke ID's (4 cijfers)</li>
              <li>Unieke serienummers</li>
              <li>Geldige radio types (Portable, Mobile, Base)</li>
              <li>Verplichte velden</li>
            </ul>
            
            {/* Drag and Drop Area */}
            <div
              className={`csv-modal__dropzone ${dragActive ? 'csv-modal__dropzone--active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="csv-modal__dropzone-content">
                <div className="csv-modal__dropzone-icon">📁</div>
                <p>Sleep hier een CSV bestand naartoe</p>
                <p className="csv-modal__dropzone-subtitle">of klik om een bestand te selecteren</p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileInput}
                  className="csv-modal__file-input"
                />
              </div>
            </div>

            {/* Selected File */}
            {selectedFile && (
              <div className="csv-modal__selected-file">
                <div className="csv-modal__file-info">
                  <span className="csv-modal__file-icon">📄</span>
                  <span className="csv-modal__file-name">{selectedFile.name}</span>
                  <span className="csv-modal__file-size">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="csv-modal__remove-file"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Import Button */}
            <button
              onClick={handleImport}
              className="btn btn--primary"
              disabled={!selectedFile}
            >
              📋 Valideren & Preview
            </button>
          </div>

          {/* Export Section */}
          <div className="csv-modal__section">
            <h3>📥 CSV Exporteren</h3>
            <p>Exporteer alle radio's naar een CSV bestand.</p>
            <button
              onClick={onExport}
              className="btn btn--primary"
            >
              📥 Exporteren
            </button>
          </div>
          
          <div className="modal__actions">
            <button
              onClick={onClose}
              className="btn btn--secondary"
            >
              Sluiten
            </button>
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Radio Modal Component
function RadioModal({ radio, onClose }: { radio: Radio | null; onClose: () => void }) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState<RadioFormData>({
    id: radio?.id || '',
    merk: radio?.merk || '',
    model: radio?.model || '',
    type: radio?.type || 'Portable',
    serienummer: radio?.serienummer || '',
    alias: radio?.alias || '',
    afdeling: radio?.afdeling || '',
    groep: radio?.groep || '',
    structuur: radio?.structuur || '',
    voertuig: radio?.voertuig || '',
    opmerking: radio?.opmerking || '',
    status: radio?.status || 'Actief',
    registratiedatum: radio?.registratiedatum || new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
  })
  
  // Organization data for dropdowns
  const [groepen, setGroepen] = useState<any[]>([])
  const [structuren, setStructuren] = useState<any[]>([])
  const [afdelingen, setAfdelingen] = useState<any[]>([])
  
  // Load all groepen
  useEffect(() => {
    OrganizationService.getAllGroepen().then(setGroepen).catch(console.error)
  }, [])
  
  // Load structuren when groep changes
  useEffect(() => {
    if (formData.groep) {
      const selectedGroep = groepen.find(g => g.name === formData.groep)
      if (selectedGroep) {
        OrganizationService.getStructurenByGroep(selectedGroep.id)
          .then(setStructuren)
          .catch(console.error)
      } else {
        setStructuren([])
      }
    } else {
      setStructuren([])
      setFormData(prev => ({ ...prev, structuur: '', afdeling: '' }))
    }
  }, [formData.groep, groepen])
  
  // Load afdelingen when structuur changes
  useEffect(() => {
    if (formData.structuur) {
      const selectedStructuur = structuren.find(s => s.name === formData.structuur)
      if (selectedStructuur) {
        OrganizationService.getAfdelingenByStructuur(selectedStructuur.id)
          .then(setAfdelingen)
          .catch(console.error)
      } else {
        setAfdelingen([])
      }
    } else {
      setAfdelingen([])
      setFormData(prev => ({ ...prev, afdeling: '' }))
    }
  }, [formData.structuur, structuren])
  
  const [idValidation, setIdValidation] = useState<{
    status: 'idle' | 'checking' | 'valid' | 'invalid'
    message: string
  }>({ status: 'idle', message: '' })

  const [serialValidation, setSerialValidation] = useState<{
    status: 'idle' | 'checking' | 'valid' | 'invalid'
    message: string
  }>({ status: 'idle', message: '' })

  // Fetch brands with radio categories
  const { data: brands = [] } = useQuery({
    queryKey: ['brands-with-radios'],
    queryFn: () => BrandService.getBrandsWithRadioCategories()
  })

  // Fetch models for selected brand
  const { data: models = [] } = useQuery({
    queryKey: ['radio-models', formData.merk],
    queryFn: () => BrandService.getRadioModelsByBrand(formData.merk),
    enabled: !!formData.merk
  })

  // Initialize form data for existing radio
  useEffect(() => {
    if (radio && brands.length > 0) {
      // Find brand ID by name for existing radio
      const brand = brands.find(b => b.name === radio.merk)
      if (brand) {
        setFormData(prev => ({
          ...prev,
          merk: brand.id
        }))
      }
    }
  }, [radio, brands])

  // Handle brand change - reset model when brand changes
  const handleBrandChange = (brandId: string) => {
    setFormData(prev => ({
      ...prev,
      merk: brandId,
      model: '' // Reset model when brand changes
    }))
  }

  // Function to check ID uniqueness
  const checkIdUniqueness = async (id: string) => {
    if (!id || id.length !== 4 || radio) {
      setIdValidation({ status: 'idle', message: '' })
      return
    }

    setIdValidation({ status: 'checking', message: 'Controleren...' })

    try {
      const existingRadio = await RadioService.getById(id)
      if (existingRadio) {
        setIdValidation({ status: 'invalid', message: 'Dit ID is al in gebruik' })
      } else {
        setIdValidation({ status: 'valid', message: 'ID is beschikbaar' })
      }
    } catch (error) {
      setIdValidation({ status: 'invalid', message: 'Fout bij controleren' })
    }
  }

  // Function to check serial number uniqueness
  const checkSerialUniqueness = async (serienummer: string) => {
    if (!serienummer || radio) {
      setSerialValidation({ status: 'idle', message: '' })
      return
    }

    setSerialValidation({ status: 'checking', message: 'Controleren...' })

    try {
      const existingRadio = await RadioService.getBySerialNumber(serienummer)
      if (existingRadio) {
        setSerialValidation({ status: 'invalid', message: 'Dit serienummer is al in gebruik' })
      } else {
        setSerialValidation({ status: 'valid', message: 'Serienummer is beschikbaar' })
      }
    } catch (error) {
      setSerialValidation({ status: 'invalid', message: 'Fout bij controleren' })
    }
  }

  // Debounced ID check
  const [idCheckTimeout, setIdCheckTimeout] = useState<NodeJS.Timeout | null>(null)

  const handleIdChange = (value: string) => {
    // Clear existing timeout
    if (idCheckTimeout) {
      clearTimeout(idCheckTimeout)
    }

    // Update form data
    setFormData({ ...formData, id: value })

    // Set new timeout for checking
    const timeout = setTimeout(() => {
      checkIdUniqueness(value)
    }, 500) // 500ms delay

    setIdCheckTimeout(timeout)
  }

  // Debounced serial number check
  const [serialCheckTimeout, setSerialCheckTimeout] = useState<NodeJS.Timeout | null>(null)

  const handleSerialChange = (value: string) => {
    // Convert to uppercase
    const upperValue = value.toUpperCase()
    
    // Clear existing timeout
    if (serialCheckTimeout) {
      clearTimeout(serialCheckTimeout)
    }

    // Update form data
    setFormData({ ...formData, serienummer: upperValue })

    // Set new timeout for checking
    const timeout = setTimeout(() => {
      checkSerialUniqueness(upperValue)
    }, 500) // 500ms delay

    setSerialCheckTimeout(timeout)
  }

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (idCheckTimeout) {
        clearTimeout(idCheckTimeout)
      }
      if (serialCheckTimeout) {
        clearTimeout(serialCheckTimeout)
      }
    }
  }, [idCheckTimeout, serialCheckTimeout])

  const createMutation = useMutation({
    mutationFn: (data: RadioFormData) => RadioService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['radios'] })
      queryClient.invalidateQueries({ queryKey: ['radio-stats'] })
      onClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<RadioFormData, 'id'>> }) =>
      RadioService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['radios'] })
      queryClient.invalidateQueries({ queryKey: ['radio-stats'] })
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if ID is valid for new radios
    if (!radio && (idValidation.status !== 'valid' || formData.id.length !== 4)) {
      return
    }
    
    // Check if serial number is valid for new radios
    if (!radio && serialValidation.status !== 'valid') {
      return
    }
    
    // Convert brand ID back to brand name for submission
    const selectedBrand = brands.find(b => b.id === formData.merk)
    const submissionData = {
      ...formData,
      merk: selectedBrand?.name || formData.merk,
      ...(!radio && { added_by: user?.username ?? 'Admin' })
    }
    
    if (radio) {
      // Exclude ID from update data
      const { id, ...updateData } = submissionData
      updateMutation.mutate({ id: radio.id, data: updateData })
    } else {
      createMutation.mutate(submissionData)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal__header">
          <h3 className="modal__title">
            {radio ? 'Radio Bewerken' : 'Radio Toevoegen'}
          </h3>
          <button onClick={onClose} className="modal__close">
            ×
          </button>
        </div>
        <div className="radio-modal__wrapper">
          <form onSubmit={handleSubmit} className="radio-modal__form">
            <div className="radio-modal__content">
              <div className="radio-modal__grid">
                <div className="radio-modal__group">
                  <label className="radio-modal__label">{t('radios.id')} *</label>
                  <input
                    type="text"
                    className={`radio-modal__input ${idValidation.status === 'valid' ? 'radio-modal__input--valid' : idValidation.status === 'invalid' ? 'radio-modal__input--invalid' : ''}`}
                    value={formData.id}
                    onChange={(e) => {
                      // Only allow 4 digits and only when creating new radio
                      if (!radio) {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                        handleIdChange(value)
                      }
                    }}
                    required
                    placeholder="Bijv. 1001"
                    maxLength={4}
                    readOnly={!!radio}
                    disabled={!!radio}
                  />
                  {idValidation.message && (
                    <div className={`radio-modal__validation radio-modal__validation--${idValidation.status}`}>
                      {idValidation.message}
                    </div>
                  )}
                </div>
                
                <div className="radio-modal__group">
                  <label className="radio-modal__label">{t('radios.merk')} *</label>
                  <select
                    className="radio-modal__select"
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
                
                <div className="radio-modal__group">
                  <label className="radio-modal__label">{t('radios.model')} *</label>
                  <select
                    className="radio-modal__select"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    required
                    disabled={!formData.merk}
                  >
                    <option value="">Selecteer model</option>
                    {models.map((model) => (
                      <option key={model.id} value={model.name}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="radio-modal__group">
                  <label className="radio-modal__label">{t('radios.type')} *</label>
                  <select
                    className="radio-modal__select"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'Portable' | 'Mobile' | 'Base' })}
                    required
                  >
                    <option value="">Selecteer type</option>
                    <option value="Portable">{t('radios.portable')}</option>
                    <option value="Mobile">{t('radios.mobile')}</option>
                    <option value="Base">{t('radios.base')}</option>
                  </select>
                </div>
                
                <div className="radio-modal__group">
                  <label className="radio-modal__label">{t('radios.serienummer')} *</label>
                  <input
                    type="text"
                    className={`radio-modal__input ${serialValidation.status === 'valid' ? 'radio-modal__input--valid' : serialValidation.status === 'invalid' ? 'radio-modal__input--invalid' : ''}`}
                    value={formData.serienummer}
                    onChange={(e) => handleSerialChange(e.target.value)}
                    required
                    placeholder="Bijv. 426CPB0001"
                  />
                  {serialValidation.message && (
                    <div className={`radio-modal__validation radio-modal__validation--${serialValidation.status}`}>
                      {serialValidation.message}
                    </div>
                  )}
                </div>
                
                <div className="radio-modal__group">
                  <label className="radio-modal__label">{t('radios.alias')} *</label>
                  <input
                    type="text"
                    className="radio-modal__input"
                    value={formData.alias}
                    onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                    required
                    placeholder="Bijv. Recherche-01"
                  />
                </div>
                
                <div className="radio-modal__group">
                  <label className="radio-modal__label">Organisatie</label>
                  <select
                    className="radio-modal__select"
                    value={formData.groep || ''}
                    onChange={(e) => setFormData({ ...formData, groep: e.target.value, structuur: '', afdeling: '' })}
                  >
                    <option value="">Selecteer organisatie</option>
                    {groepen.map(groep => (
                      <option key={groep.id} value={groep.name}>
                        {groep.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="radio-modal__group">
                  <label className="radio-modal__label">Structuur</label>
                  <select
                    className="radio-modal__select"
                    value={formData.structuur || ''}
                    onChange={(e) => setFormData({ ...formData, structuur: e.target.value, afdeling: '' })}
                    disabled={!formData.groep}
                  >
                    <option value="">Selecteer structuur</option>
                    {structuren.map(structuur => (
                      <option key={structuur.id} value={structuur.name}>
                        {structuur.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="radio-modal__group">
                  <label className="radio-modal__label">{t('radios.afdeling')} *</label>
                  <select
                    className="radio-modal__select"
                    value={formData.afdeling}
                    onChange={(e) => setFormData({ ...formData, afdeling: e.target.value })}
                    disabled={!formData.structuur}
                    required
                  >
                    <option value="">Selecteer afdeling</option>
                    {afdelingen.map(afdeling => (
                      <option key={afdeling.id} value={afdeling.name}>
                        {afdeling.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="radio-modal__group">
                  <label className="radio-modal__label">
                    Voertuig {formData.type === 'Mobile' && <span style={{ fontSize: '0.85em', color: '#666' }}>(alleen voor Mobile)</span>}
                  </label>
                  <input
                    type="text"
                    className="radio-modal__input"
                    value={formData.voertuig}
                    onChange={(e) => setFormData({ ...formData, voertuig: e.target.value })}
                    placeholder="Bijv. Toyota Land Cruiser - PZ-123"
                    disabled={formData.type !== 'Mobile'}
                  />
                </div>
                
                <div className="radio-modal__group">
                  <label className="radio-modal__label">{t('radios.registratiedatum')} *</label>
                  <input
                    type="date"
                    className="radio-modal__input"
                    value={formData.registratiedatum}
                    onChange={(e) => setFormData({ ...formData, registratiedatum: e.target.value })}
                    required
                  />
                </div>
                
                <div className="radio-modal__group">
                  <label className="radio-modal__label">Status *</label>
                  <select
                    className="radio-modal__select"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Actief' | 'Defect' | 'Kwijtgeraakt' | 'Ingetrokken' | 'Uitgeschakeld' | 'Inactief' })}
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
              </div>
              
              <div className="radio-modal__group radio-modal__group--full">
                <label className="radio-modal__label">{t('radios.opmerking')}</label>
                <textarea
                  className="radio-modal__textarea"
                  value={formData.opmerking}
                  onChange={(e) => setFormData({ ...formData, opmerking: e.target.value })}
                  rows={3}
                  placeholder="Optionele opmerkingen over deze radio..."
                />
              </div>
            </div>
            
            <div className="radio-modal__actions">
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
                disabled={isLoading || (!radio && (idValidation.status !== 'valid' || serialValidation.status !== 'valid'))}
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
