import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { OrganizationService } from '../services/organizationService'
import { Groep, Structuur, Afdeling, GroepFormData, StructuurFormData, AfdelingFormData } from '../types'
import { Plus, Edit, Trash2, ChevronRight, ChevronDown, FileSpreadsheet } from 'lucide-react'
import './Organizations.css'

export default function Organizations() {
  const queryClient = useQueryClient()
  const { isSuperUserOrAdmin } = useAuth()
  const [expandedGroepen, setExpandedGroepen] = useState<Set<string>>(new Set())
  const [expandedStructuren, setExpandedStructuren] = useState<Set<string>>(new Set())
  const [showGroepModal, setShowGroepModal] = useState(false)
  const [showStructuurModal, setShowStructuurModal] = useState(false)
  const [showAfdelingModal, setShowAfdelingModal] = useState(false)
  const [showCsvModal, setShowCsvModal] = useState(false)
  const [selectedGroep, setSelectedGroep] = useState<Groep | null>(null)
  const [selectedStructuur, setSelectedStructuur] = useState<Structuur | null>(null)
  const [selectedAfdeling, setSelectedAfdeling] = useState<Afdeling | null>(null)

  // Invalidate all organization queries
  const invalidateAllQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['groepen'] })
    queryClient.invalidateQueries({ queryKey: ['structuren'] })
    queryClient.invalidateQueries({ queryKey: ['afdelingen'] })
    queryClient.invalidateQueries({ queryKey: ['organization-stats'] })
  }

  // Queries
  const { data: groepen = [], isLoading: groepenLoading } = useQuery({
    queryKey: ['groepen'],
    queryFn: () => OrganizationService.getAllGroepen()
  })

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['organization-stats'],
    queryFn: () => OrganizationService.getStats()
  })

  // Mutations
  const deleteGroepMutation = useMutation({
    mutationFn: (id: string) => OrganizationService.deleteGroep(id),
    onSuccess: invalidateAllQueries
  })

  const deleteStructuurMutation = useMutation({
    mutationFn: (id: string) => OrganizationService.deleteStructuur(id),
    onSuccess: invalidateAllQueries
  })

  const deleteAfdelingMutation = useMutation({
    mutationFn: (id: string) => OrganizationService.deleteAfdeling(id),
    onSuccess: invalidateAllQueries
  })

  const handleToggleGroep = (groepId: string) => {
    const newExpanded = new Set(expandedGroepen)
    if (newExpanded.has(groepId)) {
      newExpanded.delete(groepId)
    } else {
      newExpanded.add(groepId)
    }
    setExpandedGroepen(newExpanded)
  }

  const handleToggleStructuur = (structuurId: string) => {
    const newExpanded = new Set(expandedStructuren)
    if (newExpanded.has(structuurId)) {
      newExpanded.delete(structuurId)
    } else {
      newExpanded.add(structuurId)
    }
    setExpandedStructuren(newExpanded)
  }

  const handleDeleteGroep = async (groep: Groep) => {
    if (window.confirm(`Weet je zeker dat je groep "${groep.name}" permanent wilt verwijderen? Dit zal ook alle structuren en afdelingen verwijderen.`)) {
      deleteGroepMutation.mutate(groep.id)
    }
  }

  const handleDeleteStructuur = async (structuur: Structuur) => {
    if (window.confirm(`Weet je zeker dat je structuur "${structuur.name}" permanent wilt verwijderen? Dit zal ook alle afdelingen verwijderen.`)) {
      deleteStructuurMutation.mutate(structuur.id)
    }
  }

  const handleDeleteAfdeling = async (afdeling: Afdeling) => {
    if (window.confirm(`Weet je zeker dat je afdeling "${afdeling.name}" permanent wilt verwijderen?`)) {
      deleteAfdelingMutation.mutate(afdeling.id)
    }
  }

  const isDeleting = deleteGroepMutation.isPending || deleteStructuurMutation.isPending || deleteAfdelingMutation.isPending

  if (groepenLoading || statsLoading) {
    return (
      <div className="organizations-page">
        <div className="organizations-page__loading">
          <div className="loading-spinner"></div>
          <p>Laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="organizations-page">
      <div className="organizations-page__header">
        <div className="organizations-page__title">
          <h1>Organisatie Structuur</h1>
          <p>Beheer groepen, structuren en afdelingen</p>
        </div>
        {isSuperUserOrAdmin() && (
        <div className="organizations-page__header-actions">
          <button
            onClick={() => setShowCsvModal(true)}
            className="btn btn--secondary"
          >
            <FileSpreadsheet size={20} />
            Import/Export
          </button>
          <button
            onClick={() => setShowGroepModal(true)}
            className="btn btn--primary"
          >
            <Plus size={20} />
            Organisatie Toevoegen
          </button>
        </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="organizations-page__stats">
        <div className="stat-card">
          <div className="stat-card__content">
            <h3>{stats?.total_groepen || 0}</h3>
            <p>Groepen</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__content">
            <h3>{stats?.total_structuren || 0}</h3>
            <p>Structuren</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__content">
            <h3>{stats?.total_afdelingen || 0}</h3>
            <p>Afdelingen</p>
          </div>
        </div>
      </div>

      {/* Groepen List */}
      <div className="organizations-page__content">
        <div className="groep-list">
          {groepen.map((groep) => (
            <GroepItem
              key={groep.id}
              groep={groep}
              canEdit={isSuperUserOrAdmin()}
              isExpanded={expandedGroepen.has(groep.id)}
              onToggle={handleToggleGroep}
              onEdit={() => {
                setSelectedGroep(groep)
                setShowGroepModal(true)
              }}
              onDelete={() => handleDeleteGroep(groep)}
              onAddStructuur={() => {
                setSelectedGroep(groep)
                setShowStructuurModal(true)
              }}
              expandedStructuren={expandedStructuren}
              onToggleStructuur={handleToggleStructuur}
              onEditStructuur={setSelectedStructuur}
              onDeleteStructuur={handleDeleteStructuur}
              onAddAfdeling={setSelectedStructuur}
              onEditAfdeling={setSelectedAfdeling}
              onDeleteAfdeling={handleDeleteAfdeling}
              onShowAfdelingModal={setShowAfdelingModal}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      </div>

      {/* Modals */}
      {showGroepModal && (
        <GroepModal
          groep={selectedGroep}
          onClose={() => {
            setShowGroepModal(false)
            setSelectedGroep(null)
          }}
          invalidateAllQueries={invalidateAllQueries}
        />
      )}

      {showStructuurModal && (
        <StructuurModal
          structuur={selectedStructuur}
          groep={selectedGroep}
          onClose={() => {
            setShowStructuurModal(false)
            setSelectedStructuur(null)
            setSelectedGroep(null)
          }}
          invalidateAllQueries={invalidateAllQueries}
        />
      )}

      {showAfdelingModal && (
        <AfdelingModal
          afdeling={selectedAfdeling}
          structuur={selectedStructuur}
          onClose={() => {
            setShowAfdelingModal(false)
            setSelectedAfdeling(null)
            setSelectedStructuur(null)
          }}
          invalidateAllQueries={invalidateAllQueries}
        />
      )}

      {/* CSV Import/Export Modal */}
      {showCsvModal && (
        <CSVImportExportModal
          onClose={() => setShowCsvModal(false)}
          groepen={groepen}
          onImport={async (file: File) => {
            try {
              const text = await file.text()
              const lines = text.split('\n').filter(line => line.trim())
              
              if (lines.length < 2) {
                alert('CSV bestand moet minimaal een header en één data rij bevatten.')
                return
              }
              
              const headers = lines[0].split(',').map(h => h.trim())
              const expectedHeaders = ['Groep', 'Structuur', 'Afdeling', 'Groep Beschrijving', 'Structuur Beschrijving', 'Afdeling Beschrijving']
              
              // Validate headers
              const missingHeaders = expectedHeaders.filter(h => !headers.includes(h))
              if (missingHeaders.length > 0) {
                alert(`Ontbrekende kolommen in CSV: ${missingHeaders.join(', ')}`)
                return
              }
              
              const groepenMap = new Map<string, string>() // name -> id
              const structurenMap = new Map<string, string>() // groep:structuur -> id
              const errors: string[] = []
              let groepenAdded = 0
              let structurenAdded = 0
              let afdelingenAdded = 0
              
              // Get existing data
              const existingGroepen = await OrganizationService.getAllGroepen()
              existingGroepen.forEach(g => groepenMap.set(g.name, g.id))
              
              // Process data rows
              for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim())
                
                if (values.length < 6) {
                  errors.push(`Rij ${i + 1}: Onvoldoende kolommen (${values.length}/6)`)
                  continue
                }
                
                const [groepName, structuurName, afdelingName, groepDesc, structuurDesc, afdelingDesc] = values
                
                // Validate required fields
                if (!groepName) {
                  errors.push(`Rij ${i + 1}: Groep naam is verplicht`)
                  continue
                }
                
                try {
                  // Create or get groep
                  let groepId = groepenMap.get(groepName)
                  if (!groepId) {
                    const newGroep = await OrganizationService.createGroep({
                      name: groepName,
                      description: groepDesc || undefined
                    })
                    groepId = newGroep.id
                    groepenMap.set(groepName, groepId)
                    groepenAdded++
                  }
                  
                  // Create structuur if provided
                  if (structuurName && groepId) {
                    const structuurKey = `${groepName}:${structuurName}`
                    let structuurId = structurenMap.get(structuurKey)
                    
                    if (!structuurId) {
                      // Check if it exists
                      const existingStructuren = await OrganizationService.getStructurenByGroep(groepId)
                      const existing = existingStructuren.find(s => s.name === structuurName)
                      
                      if (existing) {
                        structuurId = existing.id
                        structurenMap.set(structuurKey, structuurId)
                      } else {
                        const newStructuur = await OrganizationService.createStructuur({
                          groep_id: groepId,
                          name: structuurName,
                          description: structuurDesc || undefined
                        })
                        structuurId = newStructuur.id
                        structurenMap.set(structuurKey, structuurId)
                        structurenAdded++
                      }
                    }
                    
                    // Create afdeling if provided
                    if (afdelingName && structuurId) {
                      // Check if it exists
                      const existingAfdelingen = await OrganizationService.getAfdelingenByStructuur(structuurId)
                      const existingAfdeling = existingAfdelingen.find(a => a.name === afdelingName)
                      
                      if (!existingAfdeling) {
                        await OrganizationService.createAfdeling({
                          structuur_id: structuurId,
                          name: afdelingName,
                          description: afdelingDesc || undefined
                        })
                        afdelingenAdded++
                      }
                    }
                  }
                } catch (error) {
                  errors.push(`Rij ${i + 1}: ${error instanceof Error ? error.message : 'Onbekende fout'}`)
                }
              }
              
              // Show results
              if (errors.length > 0) {
                alert(`Import voltooid met ${errors.length} waarschuwing(en):\n\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n... en ${errors.length - 5} meer` : ''}`)
              }
              
              invalidateAllQueries()
              
              const totalAdded = groepenAdded + structurenAdded + afdelingenAdded
              alert(`Import succesvol!\n\n✅ ${groepenAdded} groepen toegevoegd\n✅ ${structurenAdded} structuren toegevoegd\n✅ ${afdelingenAdded} afdelingen toegevoegd\n\nTotaal: ${totalAdded} nieuwe items`)
              setShowCsvModal(false)
            } catch (error) {
              console.error('Import failed:', error)
              alert('Fout bij importeren. Controleer het CSV bestand.')
            }
          }}
          onExport={() => {
            try {
              if (!groepen || groepen.length === 0) {
                alert('Geen organisatie data beschikbaar voor export.')
                return
              }
              
              const headers = ['Groep', 'Structuur', 'Afdeling', 'Groep Beschrijving', 'Structuur Beschrijving', 'Afdeling Beschrijving']
              const rows: string[] = []
              
              // Export all hierarchical data
              const exportPromises = groepen.map(async (groep) => {
                const structuren = await OrganizationService.getStructurenByGroep(groep.id)
                
                if (structuren.length === 0) {
                  // Export groep without structuren
                  rows.push([
                    groep.name,
                    '',
                    '',
                    groep.description || '',
                    '',
                    ''
                  ].join(','))
                } else {
                  for (const structuur of structuren) {
                    const afdelingen = await OrganizationService.getAfdelingenByStructuur(structuur.id)
                    
                    if (afdelingen.length === 0) {
                      // Export structuur without afdelingen
                      rows.push([
                        groep.name,
                        structuur.name,
                        '',
                        groep.description || '',
                        structuur.description || '',
                        ''
                      ].join(','))
                    } else {
                      // Export with afdelingen
                      for (const afdeling of afdelingen) {
                        rows.push([
                          groep.name,
                          structuur.name,
                          afdeling.name,
                          groep.description || '',
                          structuur.description || '',
                          afdeling.description || ''
                        ].join(','))
                      }
                    }
                  }
                }
              })
              
              Promise.all(exportPromises).then(() => {
                const csvContent = [headers.join(','), ...rows].join('\n')
                
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
                const link = document.createElement('a')
                const url = URL.createObjectURL(blob)
                link.setAttribute('href', url)
                link.setAttribute('download', `organizations_export_${new Date().toISOString().split('T')[0]}.csv`)
                link.style.visibility = 'hidden'
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                
                alert('Export succesvol!')
              })
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

// Groep Item Component
function GroepItem({ 
  groep, 
  canEdit,
  isExpanded, 
  onToggle, 
  onEdit, 
  onDelete, 
  onAddStructuur,
  expandedStructuren,
  onToggleStructuur,
  onEditStructuur,
  onDeleteStructuur,
  onAddAfdeling,
  onEditAfdeling,
  onDeleteAfdeling,
  onShowAfdelingModal,
  isDeleting
}: {
  groep: Groep
  canEdit: boolean
  isExpanded: boolean
  onToggle: (id: string) => void
  onEdit: () => void
  onDelete: () => void
  onAddStructuur: () => void
  expandedStructuren: Set<string>
  onToggleStructuur: (id: string) => void
  onEditStructuur: (structuur: Structuur) => void
  onDeleteStructuur: (structuur: Structuur) => void
  onAddAfdeling: (structuur: Structuur) => void
  onEditAfdeling: (afdeling: Afdeling) => void
  onDeleteAfdeling: (afdeling: Afdeling) => void
  onShowAfdelingModal: (show: boolean) => void
  isDeleting: boolean
}) {
  const { data: structuren = [] } = useQuery({
    queryKey: ['structuren', groep.id],
    queryFn: () => OrganizationService.getStructurenByGroep(groep.id),
    enabled: isExpanded
  })

  return (
    <div className="groep-item">
      <div className="groep-item__header">
        <button
          className="groep-item__toggle"
          onClick={() => onToggle(groep.id)}
        >
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        <div className="groep-item__content">
          <h3>{groep.name}</h3>
          {groep.description && <p>{groep.description}</p>}
        </div>
        {canEdit && (
        <div className="groep-item__actions">
          <button
            onClick={onAddStructuur}
            className="btn btn--small btn--secondary"
            title="Structuur Toevoegen"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={onEdit}
            className="btn btn--small btn--secondary"
            title="Bewerken"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={onDelete}
            className="btn btn--small btn--danger"
            title="Verwijderen"
            disabled={isDeleting}
          >
            <Trash2 size={16} />
          </button>
        </div>
        )}
      </div>

      {isExpanded && (
        <div className="groep-item__structuren">
          {structuren.map((structuur) => (
            <StructuurItem
              key={structuur.id}
              structuur={structuur}
              canEdit={canEdit}
              isExpanded={expandedStructuren.has(structuur.id)}
              onToggle={onToggleStructuur}
              onEdit={onEditStructuur}
              onDelete={onDeleteStructuur}
              onAddAfdeling={(structuur) => {
                onAddAfdeling(structuur)
                onShowAfdelingModal(true)
              }}
              onEditAfdeling={onEditAfdeling}
              onDeleteAfdeling={onDeleteAfdeling}
              onShowAfdelingModal={onShowAfdelingModal}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Structuur Item Component
function StructuurItem({
  structuur,
  canEdit,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onAddAfdeling,
  onEditAfdeling,
  onDeleteAfdeling,
  onShowAfdelingModal,
  isDeleting
}: {
  structuur: Structuur
  canEdit: boolean
  isExpanded: boolean
  onToggle: (id: string) => void
  onEdit: (structuur: Structuur) => void
  onDelete: (structuur: Structuur) => void
  onAddAfdeling: (structuur: Structuur) => void
  onEditAfdeling: (afdeling: Afdeling) => void
  onDeleteAfdeling: (afdeling: Afdeling) => void
  onShowAfdelingModal: (show: boolean) => void
  isDeleting: boolean
}) {
  const { data: afdelingen = [] } = useQuery({
    queryKey: ['afdelingen', structuur.id],
    queryFn: () => OrganizationService.getAfdelingenByStructuur(structuur.id),
    enabled: isExpanded
  })

  return (
    <div className="structuur-item">
      <div className="structuur-item__header">
        <button
          className="structuur-item__toggle"
          onClick={() => onToggle(structuur.id)}
        >
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <div className="structuur-item__content">
          <h4>{structuur.name}</h4>
          {structuur.description && <p>{structuur.description}</p>}
        </div>
        {canEdit && (
        <div className="structuur-item__actions">
          <button
            onClick={() => onAddAfdeling(structuur)}
            className="btn btn--small btn--secondary"
            title="Afdeling Toevoegen"
          >
            <Plus size={14} />
          </button>
          <button
            onClick={() => onEdit(structuur)}
            className="btn btn--small btn--secondary"
            title="Bewerken"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={() => onDelete(structuur)}
            className="btn btn--small btn--danger"
            title="Verwijderen"
            disabled={isDeleting}
          >
            <Trash2 size={14} />
          </button>
        </div>
        )}
      </div>

      {isExpanded && (
        <div className="structuur-item__afdelingen">
          {afdelingen.map((afdeling) => (
            <AfdelingItem
              key={afdeling.id}
              afdeling={afdeling}
              canEdit={canEdit}
              onEdit={onEditAfdeling}
              onDelete={onDeleteAfdeling}
              onShowModal={onShowAfdelingModal}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Afdeling Item Component
function AfdelingItem({
  afdeling,
  canEdit,
  onEdit,
  onDelete,
  onShowModal,
  isDeleting
}: {
  afdeling: Afdeling
  canEdit: boolean
  onEdit: (afdeling: Afdeling) => void
  onDelete: (afdeling: Afdeling) => void
  onShowModal: (show: boolean) => void
  isDeleting: boolean
}) {
  return (
    <div className="afdeling-item">
      <div className="afdeling-item__content">
        <h5>{afdeling.name}</h5>
        {afdeling.description && <p>{afdeling.description}</p>}
      </div>
      {canEdit && (
      <div className="afdeling-item__actions">
        <button
          onClick={() => {
            onEdit(afdeling)
            onShowModal(true)
          }}
          className="btn btn--small btn--secondary"
          title="Bewerken"
        >
          <Edit size={12} />
        </button>
        <button
          onClick={() => onDelete(afdeling)}
          className="btn btn--small btn--danger"
          title="Verwijderen"
          disabled={isDeleting}
        >
          <Trash2 size={12} />
        </button>
      </div>
      )}
    </div>
  )
}

// Groep Modal Component
function GroepModal({ groep, onClose, invalidateAllQueries }: { groep: Groep | null; onClose: () => void; invalidateAllQueries: () => void }) {
  const [formData, setFormData] = useState<GroepFormData>({
    name: groep?.name || '',
    description: groep?.description || '',
  })

  const createMutation = useMutation({
    mutationFn: (data: GroepFormData) => OrganizationService.createGroep(data),
    onSuccess: () => {
      invalidateAllQueries()
      onClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<GroepFormData> }) =>
      OrganizationService.updateGroep(id, data),
    onSuccess: () => {
      invalidateAllQueries()
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (groep) {
      updateMutation.mutate({ id: groep.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal__header">
          <h2>{groep ? 'Groep Bewerken' : 'Groep Toevoegen'}</h2>
          <button onClick={onClose} className="modal__close">×</button>
        </div>
        <div className="modal__wrapper">
          <form onSubmit={handleSubmit} className="groep-modal__form">
            <div className="groep-modal__content">
              <div className="groep-modal__grid">
                <div className="groep-modal__group">
                  <label className="groep-modal__label">Naam *</label>
                  <input
                    type="text"
                    className="groep-modal__input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Bijv. Politie, Brandweer"
                  />
                </div>
                
                <div className="groep-modal__group groep-modal__group--full">
                  <label className="groep-modal__label">Beschrijving</label>
                  <textarea
                    className="groep-modal__textarea"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optionele beschrijving"
                    rows={3}
                  />
                </div>
              </div>
            </div>
            <div className="groep-modal__actions">
              <button
                type="button"
                onClick={onClose}
                className="btn btn--secondary"
              >
                Annuleren
              </button>
              <button
                type="submit"
                className="btn btn--primary"
                disabled={isLoading}
              >
                {isLoading ? 'Bezig...' : 'Opslaan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Structuur Modal Component
function StructuurModal({ structuur, groep, onClose, invalidateAllQueries }: { structuur: Structuur | null; groep: Groep | null; onClose: () => void; invalidateAllQueries: () => void }) {
  const [formData, setFormData] = useState<StructuurFormData>({
    groep_id: groep?.id || structuur?.groep_id || '',
    name: structuur?.name || '',
    description: structuur?.description || '',
  })

  const createMutation = useMutation({
    mutationFn: (data: StructuurFormData) => OrganizationService.createStructuur(data),
    onSuccess: () => {
      invalidateAllQueries()
      onClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StructuurFormData> }) =>
      OrganizationService.updateStructuur(id, data),
    onSuccess: () => {
      invalidateAllQueries()
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (structuur) {
      updateMutation.mutate({ id: structuur.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal__header">
          <h2>{structuur ? 'Structuur Bewerken' : 'Structuur Toevoegen'}</h2>
          <button onClick={onClose} className="modal__close">×</button>
        </div>
        <div className="modal__wrapper">
          <form onSubmit={handleSubmit} className="structuur-modal__form">
            <div className="structuur-modal__content">
              <div className="structuur-modal__grid">
                <div className="structuur-modal__group">
                  <label className="structuur-modal__label">Naam *</label>
                  <input
                    type="text"
                    className="structuur-modal__input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Bijv. Regio Oost, Regio West"
                  />
                </div>
                
                <div className="structuur-modal__group structuur-modal__group--full">
                  <label className="structuur-modal__label">Beschrijving</label>
                  <textarea
                    className="structuur-modal__textarea"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optionele beschrijving"
                    rows={3}
                  />
                </div>
              </div>
            </div>
            <div className="structuur-modal__actions">
              <button
                type="button"
                onClick={onClose}
                className="btn btn--secondary"
              >
                Annuleren
              </button>
              <button
                type="submit"
                className="btn btn--primary"
                disabled={isLoading}
              >
                {isLoading ? 'Bezig...' : 'Opslaan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Afdeling Modal Component
function AfdelingModal({ afdeling, structuur, onClose, invalidateAllQueries }: { afdeling: Afdeling | null; structuur: Structuur | null; onClose: () => void; invalidateAllQueries: () => void }) {
  const [formData, setFormData] = useState<AfdelingFormData>({
    structuur_id: structuur?.id || afdeling?.structuur_id || '',
    name: afdeling?.name || '',
    description: afdeling?.description || '',
  })

  const createMutation = useMutation({
    mutationFn: (data: AfdelingFormData) => OrganizationService.createAfdeling(data),
    onSuccess: () => {
      invalidateAllQueries()
      onClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AfdelingFormData> }) =>
      OrganizationService.updateAfdeling(id, data),
    onSuccess: () => {
      invalidateAllQueries()
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (afdeling) {
      updateMutation.mutate({ id: afdeling.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal__header">
          <h2>{afdeling ? 'Afdeling Bewerken' : 'Afdeling Toevoegen'}</h2>
          <button onClick={onClose} className="modal__close">×</button>
        </div>
        <div className="modal__wrapper">
          <form onSubmit={handleSubmit} className="afdeling-modal__form">
            <div className="afdeling-modal__content">
              <div className="afdeling-modal__grid">
                <div className="afdeling-modal__group">
                  <label className="afdeling-modal__label">Naam *</label>
                  <input
                    type="text"
                    className="afdeling-modal__input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Bijv. Recherche, Arrestatie Team"
                  />
                </div>
                
                <div className="afdeling-modal__group afdeling-modal__group--full">
                  <label className="afdeling-modal__label">Beschrijving</label>
                  <textarea
                    className="afdeling-modal__textarea"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optionele beschrijving"
                    rows={3}
                  />
                </div>
              </div>
            </div>
            <div className="afdeling-modal__actions">
              <button
                type="button"
                onClick={onClose}
                className="btn btn--secondary"
              >
                Annuleren
              </button>
              <button
                type="submit"
                className="btn btn--primary"
                disabled={isLoading}
              >
                {isLoading ? 'Bezig...' : 'Opslaan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// CSV Import/Export Modal Component
function CSVImportExportModal({ 
  onClose, 
  groepen,
  onImport,
  onExport
}: { 
  onClose: () => void
  groepen: Groep[]
  onImport: (file: File) => void
  onExport: () => void
}) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Download CSV template
  const downloadTemplate = () => {
    const headers = ['Groep', 'Structuur', 'Afdeling', 'Groep Beschrijving', 'Structuur Beschrijving', 'Afdeling Beschrijving']
    
    // Sample data rows
    const sampleData = [
      ['Politie', 'Regio Oost', 'Recherche', 'Politie organisatie', 'Oostelijke regio', 'Recherche afdeling'],
      ['Politie', 'Regio Oost', 'Arrestatie Team', 'Politie organisatie', 'Oostelijke regio', 'Specialistische arrestatie eenheid'],
      ['Politie', 'Regio West', 'Verkeerspolitie', 'Politie organisatie', 'Westelijke regio', 'Handhaving verkeer'],
      ['Brandweer', 'District Noord', 'Blussing', 'Brandweer diensten', 'Noordelijk district', 'Brandbestrijding'],
      ['Brandweer', 'District Zuid', 'Redding', 'Brandweer diensten', 'Zuidelijk district', 'Reddingsoperaties'],
      ['Ziekenhuis', 'Spoedeisende Hulp', 'Triage', 'Medische zorg', 'Acute zorg afdeling', 'Eerste beoordeling']
    ]
    
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'organizations_import_template.csv')
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
            <p>Download een CSV template om de juiste format te zien. <strong>De structuur is hiërarchisch: Groep → Structuur → Afdeling</strong></p>
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
            <p>Upload een CSV bestand om organisatie structuur te importeren. Het systeem:</p>
            <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', fontSize: '0.9rem', color: '#666' }}>
              <li>Maakt automatisch nieuwe groepen, structuren en afdelingen aan</li>
              <li>Slaat duplicaten over (op basis van naam)</li>
              <li>Behoudt bestaande data</li>
              <li>Ondersteunt meerdere niveaus in één bestand</li>
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
            <p>Exporteer de volledige organisatie structuur naar een CSV bestand.</p>
            <button
              onClick={onExport}
              className="btn btn--primary"
              disabled={!groepen || groepen.length === 0}
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

