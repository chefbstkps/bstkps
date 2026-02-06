import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { RadioArchiveService } from '../services/radioArchiveService'
import { OrganizationService } from '../services/organizationService'
import { ArchivedRadio } from '../types'
import { Search, Eye, EyeOff, Filter } from 'lucide-react'
import './Radios.css'

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
  archived_at: boolean
  archived_by: boolean
}

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
  archived_at: 'Gearchiveerd op',
  archived_by: 'Gearchiveerd door',
}

const DEFAULT_COLUMN_VISIBILITY: ColumnVisibility = {
  id: true,
  merk: false,
  model: true,
  type: true,
  serienummer: true,
  alias: false,
  organisatie: true,
  structuur: true,
  afdeling: true,
  voertuig: true,
  opmerking: true,
  status: true,
  archived_at: true,
  archived_by: true,
}

export default function RadioArchive() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterOrganisatie, setFilterOrganisatie] = useState<string>('Politie')
  const [showFilters, setShowFilters] = useState(false)
  const [showColumnMenu, setShowColumnMenu] = useState(false)
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(() => {
    const saved = localStorage.getItem('radio-archive-column-visibility')
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
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)

  const { data: archivedRadios, isLoading, error } = useQuery({
    queryKey: ['radios-archive'],
    queryFn: () => RadioArchiveService.getAll(),
  })

  const { data: groepen = [] } = useQuery({
    queryKey: ['groepen'],
    queryFn: () => OrganizationService.getAllGroepen(),
  })

  useEffect(() => {
    localStorage.setItem('radio-archive-column-visibility', JSON.stringify(columnVisibility))
  }, [columnVisibility])

  const toggleColumn = (column: keyof ColumnVisibility) => {
    setColumnVisibility((prev) => ({ ...prev, [column]: !prev[column] }))
  }

  const allFiltered = (archivedRadios ?? []).filter((radio: ArchivedRadio) => {
    const matchesSearch =
      radio.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      radio.merk.toLowerCase().includes(searchTerm.toLowerCase()) ||
      radio.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      radio.alias.toLowerCase().includes(searchTerm.toLowerCase()) ||
      radio.serienummer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      radio.afdeling.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (radio.voertuig && radio.voertuig.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesType = filterType === 'all' || radio.type === filterType
    const matchesStatus = filterStatus === 'all' || radio.status === filterStatus
    const matchesOrganisatie = filterOrganisatie === 'all' || radio.groep === filterOrganisatie
    return matchesSearch && matchesType && matchesStatus && matchesOrganisatie
  }).sort((a, b) => {
    const idA = parseInt(a.id, 10)
    const idB = parseInt(b.id, 10)
    return idA - idB
  })

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterType, filterStatus, filterOrganisatie])

  const totalItems = allFiltered.length
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const filteredRows = allFiltered.slice(startIndex, endIndex)

  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages: (number | string)[] = []
    if (currentPage <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i)
      pages.push('...')
      pages.push(totalPages)
    } else if (currentPage >= totalPages - 3) {
      pages.push(1)
      pages.push('...')
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      pages.push('...')
      pages.push(currentPage - 1, currentPage, currentPage + 1)
      pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }

  const handleRowClick = (radio: ArchivedRadio) => {
    const detailId = radio.archive_id ?? radio.id
    if (!detailId) return
    navigate(`/radio-archive/${detailId}`)
  }

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
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
      <div className="radios-page-header">
        <div className="radios-page-header-left">
          <h1 className="page__title">Radio archief</h1>
          <p className="page__subtitle">Gearchiveerde (verwijderde) radio's – alleen bekijken</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card__value">{archivedRadios?.length ?? 0}</div>
          <div className="stat-card__label">Gearchiveerd totaal</div>
        </div>
      </div>

      <div className="radios-page-filters">
        <div className="radios-show-hide-filters">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="btn-radios-import-export"
            style={{ marginBottom: showFilters ? '1rem' : '0' }}
          >
            <Filter size={20} />
            {showFilters ? 'Verberg filters' : 'Toon filters'}
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
                <option key={g.id} value={g.name}>{g.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="radios-table-outer" style={{ position: 'relative' }}>
        <div className="radios-show-hide-columns">
          <button
            type="button"
            onClick={() => setShowColumnMenu(!showColumnMenu)}
            className="btn-show-hide-columns"
            title="Kolommen weergeven/verbergen"
          >
            {showColumnMenu ? <EyeOff size={20} /> : <Eye size={20} />}
            Kolommen
          </button>
        </div>
        {showColumnMenu && (
          <div className="column-menu">
            <div className="column-menu__header">
              <h4>Kolommen weergeven</h4>
              <button type="button" onClick={() => setShowColumnMenu(false)} className="column-menu__close">×</button>
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
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
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
              {columnVisibility.archived_at && <th>Gearchiveerd op</th>}
              {columnVisibility.archived_by && <th>Gearchiveerd door</th>}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={Object.values(columnVisibility).filter(Boolean).length} className="text-muted" style={{ textAlign: 'center', padding: '2rem' }}>
                  Geen gearchiveerde radio's gevonden.
                </td>
              </tr>
            ) : (
              filteredRows.map((radio) => (
                <tr
                  key={radio.id}
                  onClick={() => handleRowClick(radio)}
                  className="table-row-clickable"
                >
                  {columnVisibility.id && <td>{radio.id}</td>}
                  {columnVisibility.merk && <td>{radio.merk}</td>}
                  {columnVisibility.model && <td>{radio.model}</td>}
                  {columnVisibility.type && (
                    <td>
                      <span className={`type-badge type-badge--${radio.type.toLowerCase()}`}>{radio.type}</span>
                    </td>
                  )}
                  {columnVisibility.serienummer && <td>{radio.serienummer}</td>}
                  {columnVisibility.alias && <td>{radio.alias}</td>}
                  {columnVisibility.organisatie && <td>{radio.groep ?? '-'}</td>}
                  {columnVisibility.structuur && <td>{radio.structuur ?? '-'}</td>}
                  {columnVisibility.afdeling && <td>{radio.afdeling}</td>}
                  {columnVisibility.voertuig && <td>{radio.type === 'Mobile' ? (radio.voertuig ?? '-') : '-'}</td>}
                  {columnVisibility.opmerking && <td>{radio.opmerking ?? '-'}</td>}
                  {columnVisibility.status && (
                    <td>
                      <span className={`status-badge status-badge--${radio.status.toLowerCase()}`}>{radio.status}</span>
                    </td>
                  )}
                  {columnVisibility.archived_at && (
                    <td>{radio.archived_at ? new Date(radio.archived_at).toLocaleString('nl-NL') : '-'}</td>
                  )}
                  {columnVisibility.archived_by && (
                    <td>{radio.archived_by ?? '-'}</td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Toon {startIndex + 1}-{Math.min(endIndex, totalItems)} van {totalItems} radio's
            </div>
            <div className="pagination-controls">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="pagination-btn pagination-btn--nav"
                title="Vorige pagina"
              >
                ‹
              </button>
              {getPageNumbers().map((page, idx) =>
                typeof page === 'number' ? (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`pagination-btn ${currentPage === page ? 'pagination-btn--active' : ''}`}
                  >
                    {page}
                  </button>
                ) : (
                  <span key={idx} className="pagination-ellipsis">{page}</span>
                )
              )}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="pagination-btn pagination-btn--nav"
                title="Volgende pagina"
              >
                ›
              </button>
            </div>
            <div className="pagination-page-size">
              <label htmlFor="pageSizeArchive">Items per pagina:</label>
              <select
                id="pageSizeArchive"
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
    </div>
  )
}
