import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { PhoneNumbersService } from '../services/phoneNumbersService'
import { OrganizationService } from '../services/organizationService'
import { PhoneNumber, PhoneNumberFormData, PhoneNumberStatus } from '../types'
import { Plus, Edit, Trash2, Search, Eye, EyeOff, Upload } from 'lucide-react'
import './PhoneNumbers.css'

const PHONE_NUMBER_STATUSES: PhoneNumberStatus[] = ['actief', 'buiten werking', 'defect', 'inactief']

// Column visibility – volgorde: Organisatie, Structuur, Afdeling, Tel. Nummer, Extensie, Accountnummer, Contactpersoon, Rang, Functie, Adres, Pandnummer, Status, Tags, Opmerking
interface ColumnVisibility {
  organisatie: boolean
  structuur: boolean
  afdeling: boolean
  tel_nummer: boolean
  extensie: boolean
  accountnummer: boolean
  contactpersoon: boolean
  rang: boolean
  functie: boolean
  adres: boolean
  pand_no: boolean
  status: boolean
  tags: boolean
  opmerking: boolean
}

const COLUMN_LABELS: Record<keyof ColumnVisibility, string> = {
  organisatie: 'Organisatie',
  structuur: 'Structuur',
  afdeling: 'Afdeling',
  tel_nummer: 'Tel. Nummer',
  extensie: 'Extensie',
  accountnummer: 'Accountnummer',
  contactpersoon: 'Contactpersoon',
  rang: 'Rang',
  functie: 'Functie',
  adres: 'Adres',
  pand_no: 'Pandnummer',
  status: 'Status',
  tags: 'Tags',
  opmerking: 'Opmerking',
}

const DEFAULT_COLUMN_VISIBILITY: ColumnVisibility = {
  organisatie: true,
  structuur: true,
  afdeling: true,
  tel_nummer: true,
  extensie: true,
  accountnummer: true,
  contactpersoon: true,
  rang: false,
  functie: true,
  adres: false,
  pand_no: false,
  status: true,
  tags: true,
  opmerking: false,
}

export default function PhoneNumbers() {
  const navigate = useNavigate()
  const { isSuperUserOrAdmin } = useAuth()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState<PhoneNumber | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12
  const [showColumnMenu, setShowColumnMenu] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const columnMenuRef = useRef<HTMLDivElement>(null)
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(() => {
    const saved = localStorage.getItem('phone-numbers-column-visibility')
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

  const { data: phoneNumbers, isLoading, error } = useQuery({
    queryKey: ['phone-numbers'],
    queryFn: () => PhoneNumbersService.getAll(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => PhoneNumbersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phone-numbers'] })
      setDeleteConfirm(null)
    },
  })

  const allFilteredItems =
    phoneNumbers
      ?.filter((item) => {
        const term = searchTerm.toLowerCase()
        return (
          item.contactpersoon.toLowerCase().includes(term) ||
          (item.structuur && item.structuur.toLowerCase().includes(term)) ||
          (item.afdeling && item.afdeling.toLowerCase().includes(term)) ||
          item.tel_nummer.toLowerCase().includes(term) ||
          (item.tags && item.tags.toLowerCase().includes(term))
        )
      })
      .sort((a, b) => {
        const afdA = a.afdeling || ''
        const afdB = b.afdeling || ''
        if (!afdA && !afdB) return 0
        if (!afdA) return 1
        if (!afdB) return -1
        return afdA.localeCompare(afdB, 'nl')
      }) || []

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  useEffect(() => {
    localStorage.setItem('phone-numbers-column-visibility', JSON.stringify(columnVisibility))
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

  const totalPages = Math.ceil(allFilteredItems.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const filteredItems = allFilteredItems.slice(startIndex, startIndex + itemsPerPage)

  const handleEdit = (item: PhoneNumber) => {
    setEditingItem(item)
    setShowAddModal(true)
  }

  const handleDelete = (id: string) => setDeleteConfirm(id)

  const handleRowClick = (item: PhoneNumber, e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('.action-buttons')) return
    navigate(`/phone-numbers/${item.id}`)
  }

  const confirmDelete = () => {
    if (deleteConfirm && deleteConfirmText.toLowerCase() === 'confirm') {
      deleteMutation.mutate(deleteConfirm)
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

  if (error) {
    return (
      <div className="alert alert--error">
        <p>Fout: {(error as Error).message}</p>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="phone-numbers-page-header">
        <div>
          <h1 className="page__title">Telefoonnummers</h1>
          <p className="page__subtitle">Beheer telefoonnummers met contactpersonen en organisatiegegevens</p>
        </div>
        {isSuperUserOrAdmin() && (
          <div className="phone-numbers-header-actions">
            <button
              onClick={() => setShowImportModal(true)}
              className="btn btn--secondary"
              title="CSV importeren"
            >
              <Upload size={20} />
              Import
            </button>
            <button onClick={() => setShowAddModal(true)} className="btn btn--primary">
              <Plus size={20} />
              Telefoonnummer toevoegen
            </button>
          </div>
        )}
      </div>

      <div className="phone-numbers-filters">
        <div className="search-controls">
          <div className="search-input">
            <Search size={20} />
            <input
              type="text"
              placeholder="Zoeken op contactpersoon, structuur, afdeling, tel. nummer of tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="phone-numbers-table-outer">
        <div className="phone-numbers-show-hide-columns">
          <div ref={columnMenuRef} className="phone-numbers-column-menu-wrapper">
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
                {columnVisibility.organisatie && <th>Organisatie</th>}
                {columnVisibility.structuur && <th>Structuur</th>}
                {columnVisibility.afdeling && <th>Afdeling</th>}
                {columnVisibility.tel_nummer && <th>Tel. Nummer</th>}
                {columnVisibility.extensie && <th>Extensie</th>}
                {columnVisibility.accountnummer && <th>Accountnummer</th>}
                {columnVisibility.contactpersoon && <th>Contactpersoon</th>}
                {columnVisibility.rang && <th>Rang</th>}
                {columnVisibility.functie && <th>Functie</th>}
                {columnVisibility.adres && <th>Adres</th>}
                {columnVisibility.pand_no && <th>Pandnummer</th>}
                {columnVisibility.status && <th>Status</th>}
                {columnVisibility.tags && <th>Tags</th>}
                {columnVisibility.opmerking && <th>Opmerking</th>}
                {isSuperUserOrAdmin() && <th>Acties</th>}
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={
                      Object.values(columnVisibility).filter(Boolean).length + (isSuperUserOrAdmin() ? 1 : 0)
                    }
                    className="table-empty"
                  >
                    Geen telefoonnummers gevonden.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    onClick={(e) => handleRowClick(item, e)}
                    className="table-row-clickable"
                  >
                    {columnVisibility.organisatie && <td>{item.organisatie || '—'}</td>}
                    {columnVisibility.structuur && <td>{item.structuur || '—'}</td>}
                    {columnVisibility.afdeling && <td>{item.afdeling || '—'}</td>}
                    {columnVisibility.tel_nummer && <td>{item.tel_nummer}</td>}
                    {columnVisibility.extensie && <td>{item.extensie || '—'}</td>}
                    {columnVisibility.accountnummer && <td>{item.accountnummer || '—'}</td>}
                    {columnVisibility.contactpersoon && <td>{item.contactpersoon}</td>}
                    {columnVisibility.rang && <td>{item.rang || '—'}</td>}
                    {columnVisibility.functie && <td>{item.functie || '—'}</td>}
                    {columnVisibility.adres && <td>{item.adres || '—'}</td>}
                    {columnVisibility.pand_no && <td>{item.pand_no || '—'}</td>}
                    {columnVisibility.status && (
                      <td>
                        <span className={`status-badge status-badge--${item.status.replace(/\s+/g, '-')}`}>
                          {item.status}
                        </span>
                      </td>
                    )}
                    {columnVisibility.tags && <td>{item.tags || '—'}</td>}
                    {columnVisibility.opmerking && <td>{item.opmerking || '—'}</td>}
                    {isSuperUserOrAdmin() && (
                      <td className="action-buttons">
                        <button
                          type="button"
                          className="btn-icon"
                          title="Bewerken"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon btn-icon--danger"
                          title="Verwijderen"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
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
        <PhoneNumberModal
          item={editingItem}
          onClose={() => {
            setShowAddModal(false)
            setEditingItem(null)
          }}
        />
      )}

      {showImportModal && (
        <PhoneNumbersCSVImportModal
          onClose={() => setShowImportModal(false)}
          onImportComplete={() => {
            queryClient.invalidateQueries({ queryKey: ['phone-numbers'] })
            setShowImportModal(false)
          }}
        />
      )}

      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal__header">
              <h3 className="modal__title">Telefoonnummer verwijderen</h3>
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

function PhoneNumbersCSVImportModal({
  onClose,
  onImportComplete,
}: {
  onClose: () => void
  onImportComplete: () => void
}) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [parsedData, setParsedData] = useState<{
    valid: PhoneNumberFormData[]
    errors: { row: number; message: string }[]
    warnings: { row: number; message: string }[]
  } | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  const PHONE_NUMBER_CSV_HEADERS = [
    'Contactpersoon',
    'Organisatie',
    'Structuur',
    'Afdeling',
    'Tel. Nummer',
    'Extensie',
    'Accountnummer',
    'Rang',
    'Functie',
    'Adres',
    'Pandnummer',
    'Status',
    'Tags',
    'Opmerking',
  ]

  const parseCSVFile = async (file: File) => {
    try {
      const text = await file.text()
      const lines = text.split(/\r?\n/).filter((line) => line.trim())

      if (lines.length < 2) {
        alert('CSV bestand moet minimaal een header en één data rij bevatten.')
        return
      }

      const detectDelimiter = (line: string): string => {
        if (line.split(';').length >= 12) return ';'
        return ','
      }

      const parseLine = (line: string, delim: string): string[] =>
        line.split(delim).map((v) => v.trim().replace(/^"|"$/g, ''))

      const delimiter = detectDelimiter(lines[0])
      const headers = parseLine(lines[0], delimiter)
      const requiredHeaders = PHONE_NUMBER_CSV_HEADERS.filter((h) => h !== 'Tags')
      const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h))
      if (missingHeaders.length > 0) {
        alert(`Ontbrekende kolommen in CSV: ${missingHeaders.join(', ')}`)
        return
      }

      const validItems: PhoneNumberFormData[] = []
      const errors: { row: number; message: string }[] = []
      const warnings: { row: number; message: string }[] = []
      const validStatuses: PhoneNumberStatus[] = ['actief', 'buiten werking', 'defect', 'inactief']

      for (let i = 1; i < lines.length; i++) {
        const values = parseLine(lines[i], delimiter)
        const rowNumber = i + 1

        if (values.length < 12) {
          errors.push({ row: rowNumber, message: `Onvoldoende kolommen (${values.length}/14 verwacht)` })
          continue
        }

        const [
          contactpersoon,
          organisatie,
          structuur,
          afdeling,
          tel_nummer,
          extensie,
          accountnummer,
          rang,
          functie,
          adres,
          pand_no,
          status,
          tags,
          opmerking,
        ] = values.length >= 14 ? values : [...values.slice(0, 12), '', values[12] ?? '']

        let hasError = false

        if (!contactpersoon) {
          errors.push({ row: rowNumber, message: 'Contactpersoon is verplicht' })
          hasError = true
        }
        if (!tel_nummer) {
          errors.push({ row: rowNumber, message: 'Tel. Nummer is verplicht' })
          hasError = true
        }
        if (!status || !validStatuses.includes(status as PhoneNumberStatus)) {
          errors.push({
            row: rowNumber,
            message: `Status moet een van zijn: ${validStatuses.join(', ')} (huidige waarde: "${status}")`,
          })
          hasError = true
        }

        if (!organisatie) warnings.push({ row: rowNumber, message: 'Organisatie is leeg' })
        if (!structuur) warnings.push({ row: rowNumber, message: 'Structuur is leeg' })
        if (!afdeling) warnings.push({ row: rowNumber, message: 'Afdeling is leeg' })

        if (!hasError) {
          validItems.push({
            contactpersoon,
            organisatie: organisatie || undefined,
            structuur: structuur || undefined,
            afdeling: afdeling || undefined,
            tel_nummer,
            extensie: extensie || undefined,
            accountnummer: accountnummer || undefined,
            rang: rang || undefined,
            functie: functie || undefined,
            adres: adres || undefined,
            pand_no: pand_no || undefined,
            status: status as PhoneNumberStatus,
            tags: tags || undefined,
            opmerking: opmerking || undefined,
          })
        }
      }

      setParsedData({ valid: validItems, errors, warnings })
      setShowPreview(true)
    } catch (error) {
      console.error('Parse failed:', error)
      alert('Fout bij het lezen van het CSV bestand.')
    }
  }

  const performImport = async () => {
    if (!parsedData || parsedData.valid.length === 0) return
    
    setIsImporting(true)
    try {
      for (const item of parsedData.valid) {
        await PhoneNumbersService.create(item)
      }
      alert(`✅ ${parsedData.valid.length} telefoonnummers succesvol geïmporteerd!`)
      onImportComplete()
    } catch (error) {
      console.error('Import failed:', error)
      alert('Er is een fout opgetreden tijdens het importeren.')
    } finally {
      setIsImporting(false)
    }
  }

  const downloadTemplate = () => {
    const sampleData = [
      ['Jan de Vries', 'Politie', 'Bedrijfsvoering', 'BST', '1234567', '101', 'ACC001', 'Agent', 'Technicus', 'Paramaribo', 'P1', 'actief', 'techniek,urgent', ''],
      ['Maria Santos', 'Politie', 'Regio Oost', 'Recherche', '7654321', '102', '', 'Hoofdagent', 'Rechercheur', '', '', 'actief', 'recherche', ''],
    ]
    const csvContent = [
      PHONE_NUMBER_CSV_HEADERS.join(','),
      ...sampleData.map((row) => row.join(',')),
    ].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.setAttribute('href', URL.createObjectURL(blob))
    link.setAttribute('download', 'telefoonnummers_import_template.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(e.type === 'dragenter' || e.type === 'dragover')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
      setSelectedFile(file)
    } else {
      alert('Alleen CSV bestanden zijn toegestaan.')
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
      setSelectedFile(file)
    } else {
      alert('Alleen CSV bestanden zijn toegestaan.')
    }
  }

  const handleBack = () => {
    setShowPreview(false)
    setParsedData(null)
    setSelectedFile(null)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal phone-numbers-csv-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">{showPreview ? 'Import Preview' : 'CSV Import'}</h2>
          <button type="button" className="modal__close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="phone-numbers-csv-modal__content">
          {showPreview && parsedData ? (
            <>
              <div className="phone-numbers-csv-modal__section">
                <h3>📊 Samenvatting</h3>
                <div className="phone-numbers-csv-modal__stats">
                  <div className="phone-numbers-csv-modal__stat phone-numbers-csv-modal__stat--valid">
                    <div className="phone-numbers-csv-modal__stat-value">{parsedData.valid.length}</div>
                    <div className="phone-numbers-csv-modal__stat-label">Geldige rijen</div>
                  </div>
                  <div className="phone-numbers-csv-modal__stat phone-numbers-csv-modal__stat--error">
                    <div className="phone-numbers-csv-modal__stat-value">{parsedData.errors.length}</div>
                    <div className="phone-numbers-csv-modal__stat-label">Fouten</div>
                  </div>
                  <div className="phone-numbers-csv-modal__stat phone-numbers-csv-modal__stat--warning">
                    <div className="phone-numbers-csv-modal__stat-value">{parsedData.warnings.length}</div>
                    <div className="phone-numbers-csv-modal__stat-label">Waarschuwingen</div>
                  </div>
                </div>
              </div>

              {parsedData.errors.length > 0 && (
                <div className="phone-numbers-csv-modal__section phone-numbers-csv-modal__section--error">
                  <h3>❌ Fouten ({parsedData.errors.length})</h3>
                  <p>De volgende rijen bevatten fouten en zullen niet worden geïmporteerd:</p>
                  <div className="phone-numbers-csv-modal__error-list">
                    {parsedData.errors.map((err, idx) => (
                      <div key={idx}>
                        <strong>Rij {err.row}:</strong> {err.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {parsedData.warnings.length > 0 && (
                <div className="phone-numbers-csv-modal__section phone-numbers-csv-modal__section--warning">
                  <h3>⚠️ Waarschuwingen ({parsedData.warnings.length})</h3>
                  <p>De volgende rijen bevatten waarschuwingen maar worden wel geïmporteerd:</p>
                  <div className="phone-numbers-csv-modal__warning-list">
                    {parsedData.warnings.slice(0, 10).map((w, idx) => (
                      <div key={idx}>
                        <strong>Rij {w.row}:</strong> {w.message}
                      </div>
                    ))}
                    {parsedData.warnings.length > 10 && (
                      <span>... en {parsedData.warnings.length - 10} meer</span>
                    )}
                  </div>
                </div>
              )}

              {parsedData.valid.length > 0 && (
                <div className="phone-numbers-csv-modal__section">
                  <h3>👁️ Preview (eerste 5 rijen)</h3>
                  <div className="phone-numbers-csv-modal__preview-table-wrap">
                    <table className="phone-numbers-csv-modal__preview-table">
                      <thead>
                        <tr>
                          <th>Contactpersoon</th>
                          <th>Organisatie</th>
                          <th>Tel. Nummer</th>
                          <th>Status</th>
                          <th>Tags</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedData.valid.slice(0, 5).map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.contactpersoon}</td>
                            <td>{item.organisatie || '—'}</td>
                            <td>{item.tel_nummer}</td>
                            <td>{item.status}</td>
                            <td>{item.tags || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parsedData.valid.length > 5 && (
                      <div className="phone-numbers-csv-modal__more">
                        ... en {parsedData.valid.length - 5} meer rijen
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="modal__actions phone-numbers-csv-modal__actions">
                <button type="button" className="btn btn--secondary" onClick={handleBack} disabled={isImporting}>
                  ← Terug
                </button>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="button" className="btn btn--secondary" onClick={onClose} disabled={isImporting}>
                    Annuleren
                  </button>
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={performImport}
                    disabled={parsedData.valid.length === 0 || isImporting}
                  >
                    {isImporting ? 'Bezig met importeren...' : `✅ Importeer ${parsedData.valid.length} telefoonnummers`}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="phone-numbers-csv-modal__section">
                <h3>📄 Template Downloaden</h3>
                <p>Download een CSV template om het juiste formaat te zien.</p>
                <button type="button" className="btn btn--secondary" onClick={downloadTemplate}>
                  📥 Template Downloaden
                </button>
              </div>

              <div className="phone-numbers-csv-modal__section">
                <h3>📤 CSV Importeren</h3>
                <p>Upload een CSV bestand. Verplichte kolommen: Contactpersoon, Tel. Nummer, Status. Tags (optioneel) vergemakkelijken het zoeken.</p>
                <div
                  className={`phone-numbers-csv-modal__dropzone ${dragActive ? 'phone-numbers-csv-modal__dropzone--active' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="phone-numbers-csv-modal__dropzone-content">
                    <div className="phone-numbers-csv-modal__dropzone-icon">📁</div>
                    <p>Sleep hier een CSV bestand naartoe</p>
                    <p className="phone-numbers-csv-modal__dropzone-subtitle">of klik om een bestand te selecteren</p>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileInput}
                      className="phone-numbers-csv-modal__file-input"
                    />
                  </div>
                </div>

                {selectedFile && (
                  <div className="phone-numbers-csv-modal__selected-file">
                    <div className="phone-numbers-csv-modal__file-info">
                      <span className="phone-numbers-csv-modal__file-icon">📄</span>
                      <span className="phone-numbers-csv-modal__file-name">{selectedFile.name}</span>
                      <span className="phone-numbers-csv-modal__file-size">
                        ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      className="phone-numbers-csv-modal__remove-file"
                      onClick={() => setSelectedFile(null)}
                    >
                      ✕
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => selectedFile && parseCSVFile(selectedFile)}
                  disabled={!selectedFile}
                >
                  📋 Valideren & Preview
                </button>
              </div>

              <div className="modal__actions">
                <button type="button" className="btn btn--secondary" onClick={onClose}>
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

function PhoneNumberModal({ item, onClose }: { item: PhoneNumber | null; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState<PhoneNumberFormData>({
    contactpersoon: item?.contactpersoon ?? '',
    organisatie: item?.organisatie ?? 'Politie',
    structuur: item?.structuur ?? '',
    afdeling: item?.afdeling ?? '',
    tel_nummer: item?.tel_nummer ?? '',
    status: item?.status ?? 'actief',
    opmerking: item?.opmerking ?? '',
    tags: item?.tags ?? '',
    accountnummer: item?.accountnummer ?? '',
    rang: item?.rang ?? '',
    functie: item?.functie ?? '',
    adres: item?.adres ?? '',
    pand_no: item?.pand_no ?? '',
    extensie: item?.extensie ?? '',
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
    } else {
      setStructuren([])
    }
  }, [formData.organisatie, groepen])

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
    mutationFn: (data: PhoneNumberFormData) => PhoneNumbersService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phone-numbers'] })
      onClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PhoneNumberFormData> }) =>
      PhoneNumbersService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phone-numbers'] })
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const submissionData: PhoneNumberFormData = {
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
    if (item) {
      updateMutation.mutate({ id: item.id, data: submissionData })
    } else {
      createMutation.mutate(submissionData)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal phone-numbers-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h3 className="modal__title">{item ? 'Telefoonnummer bewerken' : 'Telefoonnummer toevoegen'}</h3>
          <button type="button" className="modal__close" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal__body phone-numbers-modal__body">
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
                  placeholder="Telefoonnummer"
                />
              </div>
              <div className="phone-numbers-modal__group">
                <label className="phone-numbers-modal__label">Extensie</label>
                <input
                  type="text"
                  className="phone-numbers-modal__input"
                  value={formData.extensie ?? ''}
                  onChange={(e) => setFormData({ ...formData, extensie: e.target.value })}
                  placeholder="Extensie"
                />
              </div>
              <div className="phone-numbers-modal__group">
                <label className="phone-numbers-modal__label">Accountnummer</label>
                <input
                  type="text"
                  className="phone-numbers-modal__input"
                  value={formData.accountnummer ?? ''}
                  onChange={(e) => setFormData({ ...formData, accountnummer: e.target.value })}
                  placeholder="Accountnummer"
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
                  placeholder="Naam contactpersoon"
                />
              </div>
              <div className="phone-numbers-modal__group">
                <label className="phone-numbers-modal__label">Rang</label>
                <input
                  type="text"
                  className="phone-numbers-modal__input"
                  value={formData.rang ?? ''}
                  onChange={(e) => setFormData({ ...formData, rang: e.target.value })}
                  placeholder="Rang"
                />
              </div>
              <div className="phone-numbers-modal__group">
                <label className="phone-numbers-modal__label">Functie</label>
                <input
                  type="text"
                  className="phone-numbers-modal__input"
                  value={formData.functie ?? ''}
                  onChange={(e) => setFormData({ ...formData, functie: e.target.value })}
                  placeholder="Functie"
                />
              </div>
              <div className="phone-numbers-modal__group phone-numbers-modal__group--full">
                <label className="phone-numbers-modal__label">Adres</label>
                <input
                  type="text"
                  className="phone-numbers-modal__input"
                  value={formData.adres ?? ''}
                  onChange={(e) => setFormData({ ...formData, adres: e.target.value })}
                  placeholder="Adres"
                />
              </div>
              <div className="phone-numbers-modal__group">
                <label className="phone-numbers-modal__label">Pandnummer</label>
                <input
                  type="text"
                  className="phone-numbers-modal__input"
                  value={formData.pand_no ?? ''}
                  onChange={(e) => setFormData({ ...formData, pand_no: e.target.value })}
                  placeholder="Pandnummer"
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
                  placeholder="Tags gescheiden door komma's (bijv. politie, urgent, techniek)"
                />
              </div>
              <div className="phone-numbers-modal__group phone-numbers-modal__group--full">
                <label className="phone-numbers-modal__label">Opmerking</label>
                <textarea
                  className="phone-numbers-modal__textarea"
                  value={formData.opmerking ?? ''}
                  onChange={(e) => setFormData({ ...formData, opmerking: e.target.value })}
                  rows={3}
                  placeholder="Optionele opmerkingen..."
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
