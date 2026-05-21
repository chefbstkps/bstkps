import { useState, useMemo, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { RadioService } from '../services/radioService'
import type { RadioHistory as RadioHistoryType } from '../types'
import {
  Battery,
  Wrench,
  Building,
  Tag,
  Hash,
  Upload,
  Car,
  Package,
  RotateCcw,
  UserPlus,
  History,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react'
import './RadioHistory.css'

interface ColumnVisibility {
  tijd: boolean
  radio: boolean
  actie: boolean
  beschrijving: boolean
  executed_by: boolean
  details: boolean
}

const COLUMN_LABELS: Record<keyof ColumnVisibility, string> = {
  tijd: 'Tijd',
  radio: 'Radio',
  actie: 'Actie',
  beschrijving: 'Beschrijving',
  executed_by: 'Uitgevoerd door',
  details: 'Details',
}

const DEFAULT_COLUMN_VISIBILITY: ColumnVisibility = {
  tijd: true,
  radio: true,
  actie: true,
  beschrijving: false,
  executed_by: false,
  details: false,
}

const ACTION_TYPES: Array<RadioHistoryType['action']> = [
  'battery_replaced',
  'serviced',
  'department_changed',
  'alias_changed',
  'id_changed',
  'issued',
  'installed',
  'inlevering',
  'retour',
  'toewijzing',
]

const ACTION_LABELS: Record<RadioHistoryType['action'], string> = {
  battery_replaced: 'Accessoir vervangen',
  serviced: 'Geserviced',
  department_changed: 'Afdeling gewijzigd',
  alias_changed: 'Alias gewijzigd',
  id_changed: 'ID gewijzigd',
  issued: 'Afgegeven',
  installed: 'Geïnstalleerd',
  inlevering: 'Ingeleverd',
  retour: 'Retour',
  toewijzing: 'Toewijzing',
}

function getActionIcon(action: string) {
  switch (action) {
    case 'battery_replaced':
      return <Battery size={16} />
    case 'serviced':
      return <Wrench size={16} />
    case 'department_changed':
      return <Building size={16} />
    case 'alias_changed':
      return <Tag size={16} />
    case 'id_changed':
      return <Hash size={16} />
    case 'issued':
      return <Upload size={16} />
    case 'installed':
      return <Car size={16} />
    case 'inlevering':
      return <Package size={16} />
    case 'retour':
      return <RotateCcw size={16} />
    case 'toewijzing':
      return <UserPlus size={16} />
    default:
      return <History size={16} />
  }
}

function formatDetails(details: RadioHistoryType['details']): string {
  if (!details) return ''
  const parts: string[] = []
  if (details.old_value != null) parts.push(`Van: ${details.old_value}`)
  if (details.new_value != null) parts.push(`Naar: ${details.new_value}`)
  if (details.service_date) parts.push(`Datum: ${details.service_date}`)
  if (details.naam) parts.push(`Naam: ${details.naam}`)
  if (details.voornaam) parts.push(`Voornaam: ${details.voornaam}`)
  if (details.telefoonnummer) parts.push(`Tel: ${details.telefoonnummer}`)
  if (details.reden) parts.push(`Reden: ${details.reden}`)
  if (details.reden_van_inlevering) parts.push(`Reden inlevering: ${details.reden_van_inlevering}`)
  if (details.reden_van_toewijzing) parts.push(`Reden toewijzing: ${details.reden_van_toewijzing}`)
  if (details.notes) parts.push(details.notes)
  return parts.join(' · ') || ''
}

export default function RadioHistory() {
  const navigate = useNavigate()
  const [actionFilter, setActionFilter] = useState<string>('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [radioFilter, setRadioFilter] = useState('')
  const [executedByFilter, setExecutedByFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [showColumnMenu, setShowColumnMenu] = useState(false)
  const columnMenuRef = useRef<HTMLDivElement>(null)
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(() => {
    const saved = localStorage.getItem('radio-history-column-visibility')
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

  const { data: history = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['radio-history-all'],
    queryFn: () => RadioService.getAllHistory(),
  })

  const { data: radios = [] } = useQuery({
    queryKey: ['radios'],
    queryFn: () => RadioService.getAll(),
  })

  const radioMap = useMemo(() => {
    const map: Record<string, { alias?: string }> = {}
    for (const r of radios) {
      map[r.id] = { alias: r.alias }
    }
    return map
  }, [radios])

  const filteredHistory = useMemo(() => {
    let list = [...history]
    if (actionFilter) {
      list = list.filter((h) => h.action === actionFilter)
    }
    if (fromDate) {
      const from = new Date(fromDate)
      from.setHours(0, 0, 0, 0)
      list = list.filter((h) => new Date(h.timestamp) >= from)
    }
    if (toDate) {
      const to = new Date(toDate)
      to.setHours(23, 59, 59, 999)
      list = list.filter((h) => new Date(h.timestamp) <= to)
    }
    if (radioFilter.trim()) {
      const q = radioFilter.trim().toLowerCase()
      list = list.filter((h) => {
        const alias = radioMap[h.radio_id]?.alias ?? ''
        return (
          h.radio_id.toLowerCase().includes(q) || alias.toLowerCase().includes(q)
        )
      })
    }
    if (executedByFilter.trim()) {
      const q = executedByFilter.trim().toLowerCase()
      list = list.filter(
        (h) =>
          (h.executed_by ?? '')
            .toLowerCase()
            .includes(q)
      )
    }
    return list
  }, [
    history,
    actionFilter,
    fromDate,
    toDate,
    radioFilter,
    executedByFilter,
    radioMap,
  ])

  useEffect(() => {
    setCurrentPage(1)
  }, [actionFilter, fromDate, toDate, radioFilter, executedByFilter])

  useEffect(() => {
    localStorage.setItem('radio-history-column-visibility', JSON.stringify(columnVisibility))
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

  const totalItems = filteredHistory.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedItems = filteredHistory.slice(startIndex, endIndex)

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
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
      pages.push(currentPage - 1)
      pages.push(currentPage)
      pages.push(currentPage + 1)
      pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }

  const formatDate = (s: string) => {
    try {
      return new Date(s).toLocaleString('nl-NL')
    } catch {
      return s
    }
  }

  if (isLoading) {
    return (
      <div className="radio-history-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="radio-history-page">
      <div className="radio-history-page__header">
        <div>
          <h1>Radio geschiedenis</h1>
          <p>Overzicht van alle handelingen op radio&apos;s</p>
        </div>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => refetch()}
          disabled={isFetching}
          title="Vernieuwen"
        >
          <RefreshCw
            size={20}
            className={isFetching ? 'radio-history-page__spin' : ''}
          />
          Vernieuwen
        </button>
      </div>

      <div className="radio-history-page__stats">
        <div className="radio-history-stat">
          <span className="radio-history-stat__value">{filteredHistory.length}</span>
          <span className="radio-history-stat__label">Totaal</span>
        </div>
      </div>

      <div className="radio-history-page__filters">
        <div className="radio-history-page__filter">
          <label className="radio-history-page__filter-label">Actie</label>
          <select
            className="radio-history-page__filter-select"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="">Alle</option>
            {ACTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {ACTION_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="radio-history-page__filter">
          <label className="radio-history-page__filter-label">Vanaf datum</label>
          <input
            type="date"
            className="radio-history-page__filter-input"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div className="radio-history-page__filter">
          <label className="radio-history-page__filter-label">Tot datum</label>
          <input
            type="date"
            className="radio-history-page__filter-input"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
        <div className="radio-history-page__filter">
          <label className="radio-history-page__filter-label">Radio</label>
          <input
            type="text"
            className="radio-history-page__filter-input"
            placeholder="ID of alias zoeken..."
            value={radioFilter}
            onChange={(e) => setRadioFilter(e.target.value)}
          />
        </div>
        <div className="radio-history-page__filter">
          <label className="radio-history-page__filter-label">Uitgevoerd door</label>
          <input
            type="text"
            className="radio-history-page__filter-input"
            placeholder="Gebruiker zoeken..."
            value={executedByFilter}
            onChange={(e) => setExecutedByFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="radio-history-page__table-outer">
        <div className="radio-history-page__show-hide-columns">
          <div ref={columnMenuRef} className="radio-history-page__column-menu-wrapper">
            <button
              type="button"
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              className="radio-history-page__btn-columns"
              title="Kolommen weergeven/verbergen"
            >
              {showColumnMenu ? <EyeOff size={20} /> : <Eye size={20} />}
              Kolommen
            </button>
            {showColumnMenu && (
              <div className="radio-history-page__column-menu">
                <div className="radio-history-page__column-menu-header">
                  <h4>Kolommen weergeven</h4>
                  <button
                    type="button"
                    onClick={() => setShowColumnMenu(false)}
                    className="radio-history-page__column-menu-close"
                  >
                    ×
                  </button>
                </div>
                <div className="radio-history-page__column-menu-items">
                  {(Object.keys(columnVisibility) as (keyof ColumnVisibility)[]).map((key) => (
                    <label key={key} className="radio-history-page__column-menu-item">
                      <input
                        type="checkbox"
                        checked={columnVisibility[key]}
                        onChange={() => toggleColumn(key)}
                      />
                      <span>{COLUMN_LABELS[key]}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="radio-history-page__table-wrap">
          <table className="radio-history-table">
            <thead>
              <tr>
                {columnVisibility.tijd && <th>Tijd</th>}
                {columnVisibility.radio && <th>Radio</th>}
                {columnVisibility.actie && <th>Actie</th>}
                {columnVisibility.beschrijving && <th>Beschrijving</th>}
                {columnVisibility.executed_by && <th>Uitgevoerd door</th>}
                {columnVisibility.details && <th>Details</th>}
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={Math.max(
                      1,
                      Object.values(columnVisibility).filter(Boolean).length
                    )}
                    className="radio-history-table__empty"
                  >
                    <History size={40} />
                    Geen geschiedenis gevonden
                  </td>
                </tr>
              ) : (
                paginatedItems.map((h) => (
                  <tr
                    key={h.id}
                    onClick={() => navigate(`/radio-history/${h.id}`)}
                    className="radio-history-table__row-clickable"
                  >
                    {columnVisibility.tijd && <td>{formatDate(h.timestamp)}</td>}
                    {columnVisibility.radio && (
                      <td onClick={(e) => e.stopPropagation()}>
                        <Link
                          to={`/radios/${h.radio_id}`}
                          className="radio-history-table__radio-link"
                        >
                          {h.radio_id}
                          {radioMap[h.radio_id]?.alias && (
                            <span className="radio-history-table__alias">
                              {' '}
                              ({radioMap[h.radio_id].alias})
                            </span>
                          )}
                        </Link>
                      </td>
                    )}
                    {columnVisibility.actie && (
                      <td>
                        <span className="radio-history-table__action">
                          {getActionIcon(h.action)}
                          {ACTION_LABELS[h.action] ?? h.action}
                        </span>
                      </td>
                    )}
                    {columnVisibility.beschrijving && <td>{h.description}</td>}
                    {columnVisibility.executed_by && (
                      <td>{h.executed_by || '—'}</td>
                    )}
                    {columnVisibility.details && (
                      <td className="radio-history-table__details">
                        {formatDetails(h.details) || '—'}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="radio-history-page__pagination">
              <div className="radio-history-page__pagination-info">
                Toon {startIndex + 1}-
                {Math.min(endIndex, totalItems)} van {totalItems} items
              </div>
              <div className="radio-history-page__pagination-controls">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="radio-history-page__pagination-btn radio-history-page__pagination-btn--nav"
                  title="Vorige pagina"
                >
                  ‹
                </button>
                {getPageNumbers().map((page, index) =>
                  typeof page === 'number' ? (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`radio-history-page__pagination-btn ${currentPage === page ? 'radio-history-page__pagination-btn--active' : ''}`}
                    >
                      {page}
                    </button>
                  ) : (
                    <span
                      key={index}
                      className="radio-history-page__pagination-ellipsis"
                    >
                      {page}
                    </span>
                  )
                )}
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="radio-history-page__pagination-btn radio-history-page__pagination-btn--nav"
                  title="Volgende pagina"
                >
                  ›
                </button>
              </div>
              <div className="radio-history-page__pagination-size">
                <label htmlFor="radioHistoryPageSize">Items per pagina:</label>
                <select
                  id="radioHistoryPageSize"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="radio-history-page__pagination-select"
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
