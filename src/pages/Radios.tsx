import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { RadioService } from '../services/radioService'
import { BrandService } from '../services/brandService'
import { Radio, RadioFormData } from '../types'
import { Plus, Edit, Trash2, Search, Eye, EyeOff } from 'lucide-react'
import './Radios.css'

// Column visibility configuration
interface ColumnVisibility {
  id: boolean
  merk: boolean
  model: boolean
  type: boolean
  serienummer: boolean
  alias: boolean
  afdeling: boolean
  groep: boolean
  voertuig: boolean
  opmerking: boolean
}

const DEFAULT_COLUMN_VISIBILITY: ColumnVisibility = {
  id: true,
  merk: false, // Hidden by default
  model: true,
  type: true,
  serienummer: true,
  alias: false, // Hidden by default
  afdeling: true,
  groep: false, // Hidden by default
  voertuig: true,
  opmerking: true,
}

export default function Radios() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingRadio, setEditingRadio] = useState<Radio | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [showCsvModal, setShowCsvModal] = useState(false)
  const [selectedRadios, setSelectedRadios] = useState<Set<string>>(new Set())
  const [showColumnMenu, setShowColumnMenu] = useState(false)
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(() => {
    // Load from localStorage or use defaults
    const saved = localStorage.getItem('radios-column-visibility')
    return saved ? JSON.parse(saved) : DEFAULT_COLUMN_VISIBILITY
  })

  const { data: radios, isLoading, error } = useQuery({
    queryKey: ['radios'],
    queryFn: () => RadioService.getAll(),
  })

  const { data: stats } = useQuery({
    queryKey: ['radio-stats'],
    queryFn: () => RadioService.getStats(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => RadioService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['radios'] })
      queryClient.invalidateQueries({ queryKey: ['radio-stats'] })
      setDeleteConfirm(null)
    },
  })

  const multiDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map(id => RadioService.delete(id)))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['radios'] })
      queryClient.invalidateQueries({ queryKey: ['radio-stats'] })
      setSelectedRadios(new Set())
    },
  })

  // Save column visibility to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('radios-column-visibility', JSON.stringify(columnVisibility))
  }, [columnVisibility])

  const toggleColumn = (column: keyof ColumnVisibility) => {
    setColumnVisibility(prev => ({
      ...prev,
      [column]: !prev[column]
    }))
  }

  const toggleSelectAll = () => {
    if (selectedRadios.size === filteredRadios.length) {
      setSelectedRadios(new Set())
    } else {
      setSelectedRadios(new Set(filteredRadios.map(r => r.id)))
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
    
    if (window.confirm(`Weet je zeker dat je ${selectedRadios.size} radio's permanent wilt verwijderen?`)) {
      multiDeleteMutation.mutate(Array.from(selectedRadios))
    }
  }

  const filteredRadios = radios?.filter(radio => {
    const matchesSearch = radio.merk.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         radio.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         radio.alias.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         radio.serienummer.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterType === 'all' || radio.type === filterType
    
    return matchesSearch && matchesFilter
  }) || []

  const handleEdit = (radio: Radio) => {
    setEditingRadio(radio)
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
      <div className="page__header">
        <h1 className="page__title">{t('radios.title')}</h1>
        <p className="page__subtitle">
          Beheer alle radiocommunicatie apparatuur
        </p>
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
      <div className="page__actions">
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn--primary"
          >
            <Plus size={20} />
            {t('radios.add')}
          </button>
          
          <button
            onClick={() => setShowCsvModal(true)}
            className="btn btn--secondary"
          >
            📊 Import/Export
          </button>

          {selectedRadios.size > 0 && (
            <button
              onClick={handleMultiDelete}
              className="btn btn--danger"
              disabled={multiDeleteMutation.isPending}
            >
              <Trash2 size={20} />
              Verwijder {selectedRadios.size} geselecteerd
            </button>
          )}

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              className="btn btn--secondary"
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
                      <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
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
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>
                <input
                  type="checkbox"
                  checked={selectedRadios.size === filteredRadios.length && filteredRadios.length > 0}
                  onChange={toggleSelectAll}
                  title="Selecteer alles"
                />
              </th>
              {columnVisibility.id && <th>{t('radios.id')}</th>}
              {columnVisibility.merk && <th>{t('radios.merk')}</th>}
              {columnVisibility.model && <th>{t('radios.model')}</th>}
              {columnVisibility.type && <th>{t('radios.type')}</th>}
              {columnVisibility.serienummer && <th>{t('radios.serienummer')}</th>}
              {columnVisibility.alias && <th>{t('radios.alias')}</th>}
              {columnVisibility.afdeling && <th>{t('radios.afdeling')}</th>}
              {columnVisibility.groep && <th>Groep</th>}
              {columnVisibility.voertuig && <th>Voertuig</th>}
              {columnVisibility.opmerking && <th>{t('radios.opmerking')}</th>}
              <th>{t('radios.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredRadios.map((radio) => (
              <tr 
                key={radio.id} 
                onClick={(e) => handleRowClick(radio, e)} 
                className={`table-row-clickable ${selectedRadios.has(radio.id) ? 'row-selected' : ''}`}
              >
                <td className="row-checkbox" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedRadios.has(radio.id)}
                    onChange={() => toggleSelectRadio(radio.id)}
                  />
                </td>
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
                {columnVisibility.afdeling && <td>{radio.afdeling}</td>}
                {columnVisibility.groep && <td>{radio.groep || '-'}</td>}
                {columnVisibility.voertuig && <td>{radio.type === 'Mobile' ? (radio.voertuig || '-') : '-'}</td>}
                {columnVisibility.opmerking && <td>{radio.opmerking || '-'}</td>}
                <td>
                  <div className="action-buttons" onClick={(e) => e.stopPropagation()}>
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
              </tr>
            ))}
          </tbody>
        </table>
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
                onClick={() => setDeleteConfirm(null)}
                className="modal__close"
              >
                ×
              </button>
            </div>
            <div className="modal__body">
              <p>Weet je zeker dat je deze radio permanent wilt verwijderen?</p>
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

      {/* CSV Import/Export Modal */}
      {showCsvModal && (
        <CSVImportExportModal
          onClose={() => setShowCsvModal(false)}
          onImport={async (file: File) => {
            try {
              const text = await file.text()
              const lines = text.split('\n').filter(line => line.trim()) // Remove empty lines
              
              if (lines.length < 2) {
                alert('CSV bestand moet minimaal een header en één data rij bevatten.')
                return
              }
              
              const headers = lines[0].split(',').map(h => h.trim())
              const expectedHeaders = ['ID', 'Merk', 'Model', 'Type', 'Serienummer', 'Alias', 'Afdeling', 'Groep', 'Voertuig', 'Registratiedatum', 'Opmerking']
              
              // Validate headers
              const missingHeaders = expectedHeaders.filter(h => !headers.includes(h))
              if (missingHeaders.length > 0) {
                alert(`Ontbrekende kolommen in CSV: ${missingHeaders.join(', ')}`)
                return
              }
              
              const radiosToImport = []
              const errors = []
              const existingIds = new Set<string>()
              const existingSerials = new Set<string>()
              
              // Get existing data for validation
              const existingRadios = await RadioService.getAll()
              existingRadios.forEach(radio => {
                existingIds.add(radio.id)
                existingSerials.add(radio.serienummer)
              })
              
              // Process data rows
              for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim())
                
                if (values.length < 10) {
                  errors.push(`Rij ${i + 1}: Onvoldoende kolommen (${values.length}/10)`)
                  continue
                }
                
                const [id, merk, model, type, serienummer, alias, afdeling, groep, voertuig, registratiedatum, opmerking] = values
                
                // Validate ID
                if (!id || id.length !== 4 || !/^\d{4}$/.test(id)) {
                  errors.push(`Rij ${i + 1}: ID moet 4 cijfers zijn (${id})`)
                  continue
                }
                
                if (existingIds.has(id)) {
                  errors.push(`Rij ${i + 1}: ID ${id} bestaat al`)
                  continue
                }
                
                // Validate serial number
                if (!serienummer) {
                  errors.push(`Rij ${i + 1}: Serienummer is verplicht`)
                  continue
                }
                
                if (existingSerials.has(serienummer)) {
                  errors.push(`Rij ${i + 1}: Serienummer ${serienummer} bestaat al`)
                  continue
                }
                
                // Validate type
                if (!['Portable', 'Mobile', 'Base'].includes(type)) {
                  errors.push(`Rij ${i + 1}: Type moet Portable, Mobile of Base zijn (${type})`)
                  continue
                }
                
                // Validate required fields
                if (!merk || !model || !alias || !afdeling) {
                  errors.push(`Rij ${i + 1}: Merk, Model, Alias en Afdeling zijn verplicht`)
                  continue
                }
                
                radiosToImport.push({
                  id,
                  merk,
                  model,
                  type: type as 'Portable' | 'Mobile' | 'Base',
                  serienummer,
                  alias,
                  afdeling,
                  groep: groep || '',
                  voertuig: voertuig || '',
                  registratiedatum: registratiedatum || new Date().toISOString().split('T')[0],
                  opmerking: opmerking || ''
                })
                
                // Add to existing sets to prevent duplicates within the same import
                existingIds.add(id)
                existingSerials.add(serienummer)
              }
              
              // Show errors if any
              if (errors.length > 0) {
                const errorMessage = `Import geannuleerd vanwege ${errors.length} fout(en):\n\n${errors.slice(0, 10).join('\n')}${errors.length > 10 ? `\n... en ${errors.length - 10} meer fouten` : ''}`
                alert(errorMessage)
                return
              }
              
              if (radiosToImport.length === 0) {
                alert('Geen geldige rijen gevonden om te importeren.')
                return
              }
              
              // Import radios
              for (const radio of radiosToImport) {
                await RadioService.create(radio)
              }
              
              queryClient.invalidateQueries({ queryKey: ['radios'] })
              queryClient.invalidateQueries({ queryKey: ['radio-stats'] })
              
              alert(`${radiosToImport.length} radio's succesvol geïmporteerd!`)
              setShowCsvModal(false)
            } catch (error) {
              console.error('Import failed:', error)
              alert('Fout bij importeren. Controleer het CSV bestand.')
            }
          }}
          onExport={() => {
            try {
              if (!radios) {
                alert('Geen radio data beschikbaar voor export.')
                return
              }
              
              const headers = ['ID', 'Merk', 'Model', 'Type', 'Serienummer', 'Alias', 'Afdeling', 'Groep', 'Voertuig', 'Registratiedatum', 'Opmerking']
              const csvContent = [
                headers.join(','),
                ...radios.map(radio => [
                  radio.id,
                  radio.merk,
                  radio.model,
                  radio.type,
                  radio.serienummer,
                  radio.alias,
                  radio.afdeling,
                  radio.groep || '',
                  radio.voertuig || '',
                  radio.registratiedatum,
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
  onImport,
  onExport
}: { 
  onClose: () => void
  onImport: (file: File) => void
  onExport: () => void
}) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Download CSV template
  const downloadTemplate = () => {
    const headers = ['ID', 'Merk', 'Model', 'Type', 'Serienummer', 'Alias', 'Afdeling', 'Groep', 'Voertuig', 'Registratiedatum', 'Opmerking']
    
    // Sample data rows with unique IDs
    const sampleData = [
      ['2001', 'Motorola', 'DP4400', 'Portable', '426CPB2001', 'Recherche-01', 'Recherche Parbo', 'Politie', '', '2024-01-15', 'Nieuwe radio voor recherche team'],
      ['2002', 'Motorola', 'DP4400', 'Portable', '426CPB2002', 'Recherche-02', 'Recherche Parbo', 'Politie', '', '2024-01-15', 'Reserve radio'],
      ['2003', 'Motorola', 'APX8000', 'Mobile', '426CMB2001', 'Patrouille-01', 'Patrouille', 'Politie', 'Toyota Land Cruiser - PZ-123', '2024-01-20', 'Geïnstalleerd in voertuig 123'],
      ['2004', 'Kenwood', 'NX-5200', 'Base', '426CBB2001', 'Base-01', 'Communicatie Centrum', 'Brandweer', '', '2024-01-25', 'Hoofdstation communicatie'],
      ['2005', 'Motorola', 'DP4400', 'Portable', '426CPB2003', 'Recherche-03', 'Recherche Parbo', 'Politie', '', '2024-02-01', ''],
      ['2006', 'Kenwood', 'NX-5200', 'Mobile', '426CMB2002', 'Patrouille-02', 'Patrouille', 'EMS', 'Mercedes Sprinter - PZ-456', '2024-02-05', 'Geïnstalleerd in voertuig 456'],
      ['2007', 'Motorola', 'APX8000', 'Portable', '426CPB2004', 'Recherche-04', 'Recherche Parbo', 'Politie', '', '2024-02-10', 'Nieuwe radio met GPS'],
      ['2008', 'Kenwood', 'NX-5200', 'Base', '426CBB2002', 'Base-02', 'Communicatie Centrum', 'Brandweer', '', '2024-02-15', 'Backup station']
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

  // Handle import
  const handleImport = () => {
    if (selectedFile) {
      onImport(selectedFile)
      setSelectedFile(null)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal csv-modal">
        <div className="modal__header">
          <h2>CSV Import/Export</h2>
          <button onClick={onClose} className="modal__close">×</button>
        </div>
        <div className="csv-modal__content">
          
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
              📤 Importeren
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
        </div>
        
        <div className="modal__actions">
          <button
            onClick={onClose}
            className="btn btn--secondary"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  )
}

// Radio Modal Component
function RadioModal({ radio, onClose }: { radio: Radio | null; onClose: () => void }) {
  const { t } = useLanguage()
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
    voertuig: radio?.voertuig || '',
    opmerking: radio?.opmerking || '',
    registratiedatum: radio?.registratiedatum || new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
  })
  
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
      merk: selectedBrand?.name || formData.merk
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
                  <label className="radio-modal__label">{t('radios.afdeling')} *</label>
                  <input
                    type="text"
                    className="radio-modal__input"
                    value={formData.afdeling}
                    onChange={(e) => setFormData({ ...formData, afdeling: e.target.value })}
                    required
                    placeholder="Bijv. Recherche Parbo"
                  />
                </div>
                
                <div className="radio-modal__group">
                  <label className="radio-modal__label">Groep</label>
                  <input
                    type="text"
                    className="radio-modal__input"
                    value={formData.groep}
                    onChange={(e) => setFormData({ ...formData, groep: e.target.value })}
                    placeholder="Bijv. Politie, Brandweer, EMS"
                  />
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
