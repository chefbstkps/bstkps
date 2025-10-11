import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLanguage } from '../contexts/LanguageContext'
import { RadioService } from '../services/radioService'
import { InventoryService } from '../services/inventoryService'
import { AccessoryService } from '../services/accessoryService'
import { OrganizationService } from '../services/organizationService'
import { type InventoryIssueFormData } from '../types'
import { ArrowLeft, Edit, Trash2, Battery, Wrench, Building, Tag, Hash, Upload, Car } from 'lucide-react'
import './RadioDetails.css'

export default function RadioDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const queryClient = useQueryClient()

  // Modal state management
  const [showBatteryModal, setShowBatteryModal] = useState(false)
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [showIdModal, setShowIdModal] = useState(false)
  const [showAliasModal, setShowAliasModal] = useState(false)
  const [showDepartmentModal, setShowDepartmentModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const { data: radio, isLoading, error } = useQuery({
    queryKey: ['radio', id],
    queryFn: () => RadioService.getById(id!),
    enabled: !!id,
  })

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['radio-history', id],
    queryFn: () => RadioService.getHistory(id!),
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => RadioService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['radios'] })
      navigate('/radios')
    },
  })

  const addHistoryMutation = useMutation({
    mutationFn: ({ action, description, details }: { action: string; description: string; details?: any }) =>
      RadioService.addHistoryEntry(id!, action, description, details),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['radio-history', id] })
    },
  })

  const handleDelete = () => {
    setShowDeleteModal(true)
  }

  const confirmDelete = () => {
    if (deleteConfirmText.toLowerCase() === 'confirm') {
      deleteMutation.mutate(id!)
      setShowDeleteModal(false)
      setDeleteConfirmText('')
    }
  }

  const handleBatteryReplacement = () => {
    setShowBatteryModal(true)
  }

  const handleService = () => {
    setShowServiceModal(true)
  }

  const handleDepartmentChange = () => {
    setShowDepartmentModal(true)
  }

  const handleAliasChange = () => {
    setShowAliasModal(true)
  }

  const handleIdChange = () => {
    setShowIdModal(true)
  }

  const getActionIcon = (action: string) => {
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
      default:
        return <Edit size={16} />
    }
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'battery_replaced':
        return 'Accessoir vervangen'
      case 'serviced':
        return 'Geserviced'
      case 'department_changed':
        return 'Afdeling gewijzigd'
      case 'alias_changed':
        return 'Alias gewijzigd'
      case 'id_changed':
        return 'ID gewijzigd'
      case 'issued':
        return 'Afgegeven'
      case 'installed':
        return 'Geïnstalleerd'
      default:
        return 'Gewijzigd'
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

  if (error || !radio) {
    return (
      <div className="alert alert--error">
        <p>{t('common.error')}: Radio niet gevonden</p>
        <button onClick={() => navigate('/radios')} className="btn btn--primary">
          Terug naar Radio's
        </button>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page__header">
        <button
          onClick={() => navigate('/radios')}
          className="btn btn--secondary"
        >
          <ArrowLeft size={20} />
          Terug
        </button>
        <h1 className="page__title">Radio Details</h1>
        <div className="page__actions">
          <button
            onClick={handleDelete}
            className="btn btn--danger"
            disabled={deleteMutation.isPending}
          >
            <Trash2 size={20} />
            {t('common.delete')}
          </button>
        </div>
      </div>

      <div className="radio-details">
        <div className="radio-details__main">
          <div className="card">
            <div className="card__header">
              <h3 className="card__title">Radio Informatie</h3>
            </div>
            <div className="card__body">
              <div className="info-grid">
                <div className="info-item">
                  <label className="info-label">ID</label>
                  <div className="info-value">
                    {radio.id}
                    <button
                      onClick={handleIdChange}
                      className="btn btn--icon btn--secondary"
                      title="ID wijzigen"
                    >
                      <Edit size={16} />
                    </button>
                  </div>
                </div>
                <div className="info-item">
                  <label className="info-label">Merk</label>
                  <div className="info-value">{radio.merk}</div>
                </div>
                <div className="info-item">
                  <label className="info-label">Model</label>
                  <div className="info-value">{radio.model}</div>
                </div>
                <div className="info-item">
                  <label className="info-label">Type</label>
                  <div className="info-value">
                    <span className={`type-badge type-badge--${radio.type.toLowerCase()}`}>
                      {radio.type}
                    </span>
                  </div>
                </div>
                <div className="info-item">
                  <label className="info-label">Serienummer</label>
                  <div className="info-value">{radio.serienummer}</div>
                </div>
                <div className="info-item">
                  <label className="info-label">Alias</label>
                  <div className="info-value">
                    {radio.alias}
                    <button
                      onClick={handleAliasChange}
                      className="btn btn--icon btn--secondary"
                      title="Alias wijzigen"
                    >
                      <Edit size={16} />
                    </button>
                  </div>
                </div>
                <div className="info-item">
                  <label className="info-label">Afdeling</label>
                  <div className="info-value">
                    {radio.afdeling}
                    <button
                      onClick={handleDepartmentChange}
                      className="btn btn--icon btn--secondary"
                      title="Afdeling wijzigen"
                    >
                      <Edit size={16} />
                    </button>
                  </div>
                </div>
                <div className="info-item">
                  <label className="info-label">Organisatie</label>
                  <div className="info-value">{radio.groep || '-'}</div>
                </div>
                <div className="info-item">
                  <label className="info-label">Structuur</label>
                  <div className="info-value">{radio.structuur || '-'}</div>
                </div>
                {radio.type === 'Mobile' && (
                  <div className="info-item">
                    <label className="info-label">Voertuig</label>
                    <div className="info-value">{radio.voertuig || '-'}</div>
                  </div>
                )}
                <div className="info-item">
                  <label className="info-label">Registratiedatum</label>
                  <div className="info-value">
                    {new Date(radio.registratiedatum).toLocaleDateString('nl-NL')}
                  </div>
                </div>
                <div className="info-item">
                  <label className="info-label">Status</label>
                  <div className="info-value">
                    <span className={`status-badge status-badge--${radio.status.toLowerCase()}`}>
                      {radio.status}
                    </span>
                  </div>
                </div>
                <div className="info-item">
                  <label className="info-label">Opmerking</label>
                  <div className="info-value">{radio.opmerking || '-'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="radio-details__actions">
          <div className="card">
            <div className="card__header">
              <h3 className="card__title">Snelle Acties</h3>
            </div>
            <div className="card__body">
              <div className="action-buttons">
                <button
                  onClick={handleBatteryReplacement}
                  className="btn btn--secondary"
                  disabled={addHistoryMutation.isPending}
                >
                  <Battery size={20} />
                  Accessoir Vervangen
                </button>
                <button
                  onClick={handleService}
                  className="btn btn--secondary"
                  disabled={addHistoryMutation.isPending}
                >
                  <Wrench size={20} />
                  Service
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="radio-history">
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Geschiedenis</h3>
          </div>
          <div className="card__body">
            {historyLoading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Geschiedenis laden...</p>
              </div>
            ) : history && history.length > 0 ? (
              <div className="history-list">
                {history.map((entry) => (
                  <div key={entry.id} className="history-item">
                    <div className="history-item__icon">
                      {getActionIcon(entry.action)}
                    </div>
                    <div className="history-item__content">
                      <div className="history-item__title">
                        {getActionLabel(entry.action)}
                      </div>
                      <div className="history-item__description">
                        {entry.description}
                      </div>
                      {entry.details && (
                        <div className="history-item__details">
                          {entry.details.service_date && (
                            <span className="detail-item">
                              Datum: <strong>{new Date(entry.details.service_date).toLocaleDateString('nl-NL')}</strong>
                            </span>
                          )}
                          {entry.details.naam && (
                            <span className="detail-item">
                              Naam: <strong>{entry.details.naam}</strong>
                            </span>
                          )}
                          {entry.details.voornaam && (
                            <span className="detail-item">
                              Voornaam: <strong>{entry.details.voornaam}</strong>
                            </span>
                          )}
                          {entry.details.telefoonnummer && (
                            <span className="detail-item">
                              Telefoonnummer: <strong>{entry.details.telefoonnummer}</strong>
                            </span>
                          )}
                          {entry.details.rang_functie && (
                            <span className="detail-item">
                              Rang/Functie: <strong>{entry.details.rang_functie}</strong>
                            </span>
                          )}
                          {entry.details.accessory_info && (
                            <span className="detail-item">
                              Accessoire: <strong>{entry.details.accessory_info}</strong>
                            </span>
                          )}
                          {entry.details.quantity && (
                            <span className="detail-item">
                              Aantal: <strong>{entry.details.quantity}</strong>
                            </span>
                          )}
                          {entry.details.notes && (
                            <span className="detail-item">
                              Opmerking: <strong>{entry.details.notes}</strong>
                            </span>
                          )}
                          {entry.details.old_value && (
                            <span className="detail-item">
                              Van: <strong>{entry.details.old_value}</strong>
                            </span>
                          )}
                          {entry.details.new_value && (
                            <span className="detail-item">
                              Naar: <strong>{entry.details.new_value}</strong>
                            </span>
                          )}
                          {entry.details.vehicle_info && (
                            <span className="detail-item">
                              Voertuig: <strong>{entry.details.vehicle_info.merk} {entry.details.vehicle_info.model}</strong>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="history-item__timestamp">
                      {new Date(entry.timestamp).toLocaleString('nl-NL')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted">Geen geschiedenis beschikbaar</p>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal__header">
              <h3 className="modal__title">{t('common.confirm_delete')}</h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteConfirmText('')
                }}
                className="modal__close"
              >
                ×
              </button>
            </div>
            <div className="radio-details-modal-body">
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
                  setShowDeleteModal(false)
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

      {/* Battery Replacement Modal */}
      {showBatteryModal && (
        <BatteryReplacementModal
          radioId={id!}
          onClose={() => setShowBatteryModal(false)}
          onSubmit={async (date, notes, naam, voornaam, telefoonnummer, rangFunctie, organizationId, accessoryId, quantity) => {
            // Get accessory info for history
            let accessoryInfo = ''
            if (accessoryId) {
              try {
                const accessory = await AccessoryService.getById(accessoryId)
                if (accessory) {
                  accessoryInfo = `${accessory.merk} ${accessory.model}${accessory.omschrijving ? ` (${accessory.omschrijving})` : ''}`
                }
              } catch (error) {
                console.error('Failed to fetch accessory info:', error)
              }
            }

            // First add the history entry
            await addHistoryMutation.mutateAsync({
              action: 'battery_replaced',
              description: accessoryInfo ? `${accessoryInfo} vervangen` : 'Accessoir vervangen',
              details: {
                service_date: date,
                notes: notes,
                naam: naam,
                voornaam: voornaam,
                telefoonnummer: telefoonnummer,
                rang_functie: rangFunctie,
                accessory_info: accessoryInfo,
                quantity: quantity
              }
            })

            // Then automatically register the inventory issue
            if (organizationId && accessoryId && quantity) {
              try {
                const issueData: InventoryIssueFormData = {
                  organization_id: organizationId,
                  accessory_id: accessoryId,
                  quantity: quantity,
                  transaction_date: date,
                  issued_to_type: 'radio',
                  issued_to_id: id!,
                  issue_reason: 'Accessoir vervanging',
                  notes: notes
                }
                await InventoryService.addIssue(issueData)
                
                // Invalidate dashboard stats to update recent issues section
                queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
              } catch (error) {
                console.error('Failed to register inventory issue:', error)
                // Don't fail the whole operation if inventory update fails
              }
            }

            setShowBatteryModal(false)
          }}
          isLoading={addHistoryMutation.isPending}
        />
      )}

      {/* Service Modal */}
      {showServiceModal && (
        <ServiceModal
          onClose={() => setShowServiceModal(false)}
          onSubmit={(date, notes, naam, voornaam, telefoonnummer, rangFunctie) => {
            addHistoryMutation.mutate({
              action: 'serviced',
              description: 'Radio geserviced',
              details: {
                service_date: date,
                notes: notes,
                naam: naam,
                voornaam: voornaam,
                telefoonnummer: telefoonnummer,
                rang_functie: rangFunctie
              }
            }, {
              onSuccess: () => {
                setShowServiceModal(false)
              }
            })
          }}
          isLoading={addHistoryMutation.isPending}
        />
      )}

      {/* ID Change Modal */}
      {showIdModal && (
        <IDChangeModal
          onClose={() => setShowIdModal(false)}
          onSubmit={async (newId, date, notes) => {
            try {
              // First update the radio ID in the database
              await RadioService.update(radio?.id || '', { id: newId })
              
              // Then add to history
              addHistoryMutation.mutate({
                action: 'id_changed',
                description: `ID gewijzigd van ${radio?.id} naar ${newId}`,
                details: {
                  old_value: radio?.id,
                  new_value: newId,
                  service_date: date,
                  notes: notes
                }
              })
              
              // Invalidate radio query to refresh the data
              queryClient.invalidateQueries({ queryKey: ['radio', radio?.id] })
              queryClient.invalidateQueries({ queryKey: ['radios'] })
              
              setShowIdModal(false)
              
              // Navigate to the new ID URL since the route parameter changed
              navigate(`/radios/${newId}`)
            } catch (error) {
              console.error('Failed to update radio ID:', error)
              alert('Fout bij het bijwerken van het ID. Probeer opnieuw.')
            }
          }}
          currentId={radio?.id || ''}
        />
      )}

      {/* Alias Change Modal */}
      {showAliasModal && (
        <AliasChangeModal
          onClose={() => setShowAliasModal(false)}
          onSubmit={async (newAlias, date, notes) => {
            try {
              // First update the radio alias in the database
              await RadioService.update(radio?.id || '', { alias: newAlias })
              
              // Then add to history
              addHistoryMutation.mutate({
                action: 'alias_changed',
                description: `Alias gewijzigd van ${radio?.alias} naar ${newAlias}`,
                details: {
                  old_value: radio?.alias,
                  new_value: newAlias,
                  service_date: date,
                  notes: notes
                }
              })
              
              // Invalidate radio query to refresh the data
              queryClient.invalidateQueries({ queryKey: ['radio', radio?.id] })
              queryClient.invalidateQueries({ queryKey: ['radios'] })
              
              setShowAliasModal(false)
            } catch (error) {
              console.error('Failed to update radio alias:', error)
              alert('Fout bij het bijwerken van de alias. Probeer opnieuw.')
            }
          }}
          currentAlias={radio?.alias || ''}
        />
      )}

      {/* Department Change Modal */}
      {showDepartmentModal && (
        <DepartmentChangeModal
          onClose={() => setShowDepartmentModal(false)}
          onSubmit={async (newDepartment, date, notes) => {
            try {
              // First update the radio department in the database
              await RadioService.update(radio?.id || '', { afdeling: newDepartment })
              
              // Then add to history
              addHistoryMutation.mutate({
                action: 'department_changed',
                description: `Afdeling gewijzigd van ${radio?.afdeling} naar ${newDepartment}`,
                details: {
                  old_value: radio?.afdeling,
                  new_value: newDepartment,
                  service_date: date,
                  notes: notes
                }
              })
              
              // Invalidate radio query to refresh the data
              queryClient.invalidateQueries({ queryKey: ['radio', radio?.id] })
              queryClient.invalidateQueries({ queryKey: ['radios'] })
              
              setShowDepartmentModal(false)
            } catch (error) {
              console.error('Failed to update radio department:', error)
              alert('Fout bij het bijwerken van de afdeling. Probeer opnieuw.')
            }
          }}
          currentDepartment={radio?.afdeling || ''}
        />
      )}
    </div>
  )
}

// Battery Replacement Modal Component
function BatteryReplacementModal({ 
  radioId: _radioId,
  onClose, 
  onSubmit,
  isLoading = false
}: { 
  radioId: string
  onClose: () => void
  onSubmit: (date: string, notes: string, naam: string, voornaam: string, telefoonnummer: string, rangFunctie: string, organizationId?: string, accessoryId?: string, quantity?: number) => void 
  isLoading?: boolean
}) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [naam, setNaam] = useState('')
  const [voornaam, setVoornaam] = useState('')
  const [telefoonnummer, setTelefoonnummer] = useState('')
  const [rangFunctie, setRangFunctie] = useState('')
  const [organizationId, setOrganizationId] = useState('')
  const [accessoryId, setAccessoryId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [errorMessage, setErrorMessage] = useState('')

  // Fetch organizations and accessories
  const { data: organizations } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => OrganizationService.getAllGroepen(),
  })

  const { data: accessories } = useQuery({
    queryKey: ['accessories'],
    queryFn: () => AccessoryService.getAll(),
  })

  // Set default organization to "Politie" when organizations are loaded
  useEffect(() => {
    if (organizations && organizations.length > 0 && !organizationId) {
      const politieOrg = organizations.find(org => org.name.toLowerCase() === 'politie')
      if (politieOrg) {
        setOrganizationId(politieOrg.id)
      }
    }
  }, [organizations, organizationId])

  // Fetch inventory for selected organization and accessory
  const { data: inventoryItem } = useQuery({
    queryKey: ['inventory-item', organizationId, accessoryId],
    queryFn: () => organizationId && accessoryId 
      ? InventoryService.getInventoryByAccessory(organizationId, accessoryId)
      : Promise.resolve(null),
    enabled: !!(organizationId && accessoryId),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    // Validate stock before submitting
    if (inventoryItem && inventoryItem.current_stock < quantity) {
      setErrorMessage(`Onvoldoende voorraad! Beschikbaar: ${inventoryItem.current_stock}, Gevraagd: ${quantity}`)
      return
    }

    if (organizationId && accessoryId && !inventoryItem) {
      setErrorMessage('Dit accessoire heeft geen voorraad in deze organisatie. Registreer eerst een aankoop.')
      return
    }

    onSubmit(date, notes, naam, voornaam, telefoonnummer, rangFunctie, organizationId, accessoryId, quantity)
  }

  const getStockStatus = () => {
    if (!inventoryItem) return null
    const stock = inventoryItem.current_stock
    if (stock === 0) return { type: 'danger', text: 'Niet op voorraad', stock }
    if (stock < quantity) return { type: 'danger', text: 'Onvoldoende voorraad', stock }
    if (stock <= inventoryItem.low_stock_threshold) return { type: 'warning', text: 'Lage voorraad', stock }
    return { type: 'success', text: 'Op voorraad', stock }
  }

  const stockStatus = getStockStatus()

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal__header">
          <h2>Accessoir Vervangen</h2>
          <button onClick={onClose} className="modal__close">×</button>
        </div>
        <div className="service-modal__wrapper">
          <form onSubmit={handleSubmit} className="service-modal__form">
            <div className="service-modal__content">
              <div className="service-modal__grid">
                <div className="service-modal__group">
                  <label className="service-modal__label">Datum van vervanging *</label>
                  <input
                    type="date"
                    className="service-modal__input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="service-modal__grid">
                <div className="service-modal__group">
                  <label className="service-modal__label">Organisatie (voor inventory) *</label>
                  <select
                    className="service-modal__input"
                    value={organizationId}
                    onChange={(e) => setOrganizationId(e.target.value)}
                    required
                  >
                    <option value="">Selecteer organisatie</option>
                    {organizations?.map(org => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                </div>
                <div className="service-modal__group">
                  <label className="service-modal__label">Accessoire type *</label>
                  <select
                    className="service-modal__input"
                    value={accessoryId}
                    onChange={(e) => setAccessoryId(e.target.value)}
                    required
                  >
                    <option value="">Selecteer accessoire</option>
                    {accessories?.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.merk} - {acc.model}{acc.omschrijving ? ` (${acc.omschrijving})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Stock Status Indicator */}
              {stockStatus && organizationId && accessoryId && (
                <div className={`stock-status-indicator stock-status-indicator--${stockStatus.type}`}>
                  {stockStatus.text} • Beschikbaar: <strong>{stockStatus.stock}</strong>
                </div>
              )}

              {/* Warning if no inventory record exists */}
              {organizationId && accessoryId && !inventoryItem && (
                <div className="inventory-warning">
                  Geen voorraad geregistreerd voor dit accessoire
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <div className="inventory-error">
                  {errorMessage}
                </div>
              )}

              <div className="service-modal__grid">
                <div className="service-modal__group">
                  <label className="service-modal__label">Aantal *</label>
                  <input
                    type="number"
                    min="1"
                    className="service-modal__input"
                    value={quantity}
                    onChange={(e) => {
                      setQuantity(parseInt(e.target.value))
                      setErrorMessage('') // Clear error when quantity changes
                    }}
                    required
                  />
                </div>
              </div>

              <div className="service-modal__grid">
                <div className="service-modal__group">
                  <label className="service-modal__label">Naam</label>
                  <input
                    type="text"
                    className="service-modal__input"
                    value={naam}
                    onChange={(e) => setNaam(e.target.value)}
                    placeholder="Achternaam"
                  />
                </div>
                <div className="service-modal__group">
                  <label className="service-modal__label">Voornaam</label>
                  <input
                    type="text"
                    className="service-modal__input"
                    value={voornaam}
                    onChange={(e) => setVoornaam(e.target.value)}
                    placeholder="Voornaam"
                  />
                </div>
              </div>

              <div className="service-modal__grid">
                <div className="service-modal__group">
                  <label className="service-modal__label">Telefoonnummer</label>
                  <input
                    type="tel"
                    className="service-modal__input"
                    value={telefoonnummer}
                    onChange={(e) => setTelefoonnummer(e.target.value)}
                    placeholder="Telefoonnummer"
                  />
                </div>
                <div className="service-modal__group">
                  <label className="service-modal__label">Rang/Functie</label>
                  <input
                    type="text"
                    className="service-modal__input"
                    value={rangFunctie}
                    onChange={(e) => setRangFunctie(e.target.value)}
                    placeholder="Rang of functie"
                  />
                </div>
              </div>
              
              <div className="service-modal__group service-modal__group--full">
                <label className="service-modal__label">Opmerkingen</label>
                <textarea
                  className="service-modal__textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optionele opmerkingen over de accessoir vervanging..."
                  rows={3}
                />
              </div>
            </div>
            
            <div className="service-modal__actions">
              <button
                type="button"
                onClick={onClose}
                className="btn btn--secondary"
                disabled={isLoading}
              >
                Annuleren
              </button>
              <button
                type="submit"
                className="btn btn--primary"
                disabled={isLoading}
              >
                {isLoading ? 'Bezig met opslaan...' : 'Accessoir Vervangen Registreren'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Service Modal Component
function ServiceModal({ 
  onClose, 
  onSubmit,
  isLoading = false
}: { 
  onClose: () => void
  onSubmit: (date: string, notes: string, naam: string, voornaam: string, telefoonnummer: string, rangFunctie: string) => void 
  isLoading?: boolean
}) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [naam, setNaam] = useState('')
  const [voornaam, setVoornaam] = useState('')
  const [telefoonnummer, setTelefoonnummer] = useState('')
  const [rangFunctie, setRangFunctie] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(date, notes, naam, voornaam, telefoonnummer, rangFunctie)
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal__header">
          <h2>Radio Service</h2>
          <button onClick={onClose} className="modal__close">×</button>
        </div>
        <div className="service-modal__wrapper">
          <form onSubmit={handleSubmit} className="service-modal__form">
            <div className="service-modal__content">
              <div className="service-modal__grid">
                <div className="service-modal__group">
                  <label className="service-modal__label">Datum van service *</label>
                  <input
                    type="date"
                    className="service-modal__input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="service-modal__grid">
                <div className="service-modal__group">
                  <label className="service-modal__label">Naam</label>
                  <input
                    type="text"
                    className="service-modal__input"
                    value={naam}
                    onChange={(e) => setNaam(e.target.value)}
                    placeholder="Achternaam"
                  />
                </div>
                <div className="service-modal__group">
                  <label className="service-modal__label">Voornaam</label>
                  <input
                    type="text"
                    className="service-modal__input"
                    value={voornaam}
                    onChange={(e) => setVoornaam(e.target.value)}
                    placeholder="Voornaam"
                  />
                </div>
              </div>

              <div className="service-modal__grid">
                <div className="service-modal__group">
                  <label className="service-modal__label">Telefoonnummer</label>
                  <input
                    type="tel"
                    className="service-modal__input"
                    value={telefoonnummer}
                    onChange={(e) => setTelefoonnummer(e.target.value)}
                    placeholder="Telefoonnummer"
                  />
                </div>
                <div className="service-modal__group">
                  <label className="service-modal__label">Rang/Functie</label>
                  <input
                    type="text"
                    className="service-modal__input"
                    value={rangFunctie}
                    onChange={(e) => setRangFunctie(e.target.value)}
                    placeholder="Rang of functie"
                  />
                </div>
              </div>
              
              <div className="service-modal__group service-modal__group--full">
                <label className="service-modal__label">Opmerkingen</label>
                <textarea
                  className="service-modal__textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optionele opmerkingen over de service..."
                  rows={3}
                />
              </div>
            </div>
            
            <div className="service-modal__actions">
              <button
                type="button"
                onClick={onClose}
                className="btn btn--secondary"
                disabled={isLoading}
              >
                Annuleren
              </button>
              <button
                type="submit"
                className="btn btn--primary"
                disabled={isLoading}
              >
                {isLoading ? 'Bezig met opslaan...' : 'Service Registreren'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// ID Change Modal Component
function IDChangeModal({ 
  onClose, 
  onSubmit,
  currentId
}: { 
  onClose: () => void
  onSubmit: (newId: string, date: string, notes: string) => void
  currentId: string
}) {
  const [newId, setNewId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newId && newId !== currentId) {
      onSubmit(newId, date, notes)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal__header">
          <h2>ID Wijzigen</h2>
          <button onClick={onClose} className="modal__close">×</button>
        </div>
        <div className="service-modal__wrapper">
          <form onSubmit={handleSubmit} className="service-modal__form">
            <div className="service-modal__content">
              <div className="service-modal__grid">
                <div className="service-modal__group">
                  <label className="service-modal__label">Nieuw ID *</label>
                  <input
                    type="text"
                    className="service-modal__input"
                    value={newId}
                    onChange={(e) => setNewId(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    required
                    placeholder="Bijv. 1001"
                    maxLength={4}
                  />
                </div>
                <div className="service-modal__group">
                  <label className="service-modal__label">Datum van wijziging *</label>
                  <input
                    type="date"
                    className="service-modal__input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="service-modal__group service-modal__group--full">
                <label className="service-modal__label">Opmerkingen</label>
                <textarea
                  className="service-modal__textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optionele opmerkingen over de ID wijziging..."
                  rows={3}
                />
              </div>
            </div>
            
            <div className="service-modal__actions">
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
                disabled={!newId || newId === currentId}
              >
                ID Wijzigen
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Alias Change Modal Component
function AliasChangeModal({ 
  onClose, 
  onSubmit,
  currentAlias
}: { 
  onClose: () => void
  onSubmit: (newAlias: string, date: string, notes: string) => void
  currentAlias: string
}) {
  const [newAlias, setNewAlias] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newAlias && newAlias !== currentAlias) {
      onSubmit(newAlias, date, notes)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal__header">
          <h2>Alias Wijzigen</h2>
          <button onClick={onClose} className="modal__close">×</button>
        </div>
        <div className="service-modal__wrapper">
          <form onSubmit={handleSubmit} className="service-modal__form">
            <div className="service-modal__content">
              <div className="service-modal__grid">
                <div className="service-modal__group">
                  <label className="service-modal__label">Nieuwe alias *</label>
                  <input
                    type="text"
                    className="service-modal__input"
                    value={newAlias}
                    onChange={(e) => setNewAlias(e.target.value)}
                    required
                    placeholder="Bijv. Recherche-02"
                  />
                </div>
                <div className="service-modal__group">
                  <label className="service-modal__label">Datum van wijziging *</label>
                  <input
                    type="date"
                    className="service-modal__input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="service-modal__group service-modal__group--full">
                <label className="service-modal__label">Opmerkingen</label>
                <textarea
                  className="service-modal__textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optionele opmerkingen over de alias wijziging..."
                  rows={3}
                />
              </div>
            </div>
            
            <div className="service-modal__actions">
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
                disabled={!newAlias || newAlias === currentAlias}
              >
                Alias Wijzigen
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Department Change Modal Component
function DepartmentChangeModal({ 
  onClose, 
  onSubmit,
  currentDepartment
}: { 
  onClose: () => void
  onSubmit: (newDepartment: string, date: string, notes: string) => void
  currentDepartment: string
}) {
  const [newDepartment, setNewDepartment] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newDepartment && newDepartment !== currentDepartment) {
      onSubmit(newDepartment, date, notes)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal__header">
          <h2>Afdeling Wijzigen</h2>
          <button onClick={onClose} className="modal__close">×</button>
        </div>
        <div className="service-modal__wrapper">
          <form onSubmit={handleSubmit} className="service-modal__form">
            <div className="service-modal__content">
              <div className="service-modal__grid">
                <div className="service-modal__group">
                  <label className="service-modal__label">Nieuwe afdeling *</label>
                  <input
                    type="text"
                    className="service-modal__input"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    required
                    placeholder="Bijv. Recherche Parbo"
                  />
                </div>
                <div className="service-modal__group">
                  <label className="service-modal__label">Datum van wijziging *</label>
                  <input
                    type="date"
                    className="service-modal__input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="service-modal__group service-modal__group--full">
                <label className="service-modal__label">Opmerkingen</label>
                <textarea
                  className="service-modal__textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optionele opmerkingen over de afdeling wijziging..."
                  rows={3}
                />
              </div>
            </div>
            
            <div className="service-modal__actions">
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
                disabled={!newDepartment || newDepartment === currentDepartment}
              >
                Afdeling Wijzigen
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
