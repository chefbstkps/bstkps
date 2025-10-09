import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLanguage } from '../contexts/LanguageContext'
import { RadioService } from '../services/radioService'
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

  const handleDelete = async () => {
    if (window.confirm(t('common.confirm_delete'))) {
      deleteMutation.mutate(id!)
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
        return 'Batterij vervangen'
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
                  <label className="info-label">Groep</label>
                  <div className="info-value">{radio.groep || '-'}</div>
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
                  Batterij Vervangen
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

      {/* Battery Replacement Modal */}
      {showBatteryModal && (
        <BatteryReplacementModal
          onClose={() => setShowBatteryModal(false)}
          onSubmit={(date, notes) => {
            addHistoryMutation.mutate({
              action: 'battery_replaced',
              description: 'Batterij vervangen',
              details: {
                service_date: date,
                notes: notes
              }
            })
            setShowBatteryModal(false)
          }}
        />
      )}

      {/* Service Modal */}
      {showServiceModal && (
        <ServiceModal
          onClose={() => setShowServiceModal(false)}
          onSubmit={(date, notes) => {
            addHistoryMutation.mutate({
              action: 'serviced',
              description: 'Radio geserviced',
              details: {
                service_date: date,
                notes: notes
              }
            })
            setShowServiceModal(false)
          }}
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
  onClose, 
  onSubmit 
}: { 
  onClose: () => void
  onSubmit: (date: string, notes: string) => void 
}) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(date, notes)
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal__header">
          <h2>Batterij Vervangen</h2>
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
              
              <div className="service-modal__group service-modal__group--full">
                <label className="service-modal__label">Opmerkingen</label>
                <textarea
                  className="service-modal__textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optionele opmerkingen over de batterij vervanging..."
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
              >
                Batterij Vervangen Registreren
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
  onSubmit 
}: { 
  onClose: () => void
  onSubmit: (date: string, notes: string) => void 
}) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(date, notes)
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
              >
                Annuleren
              </button>
              <button
                type="submit"
                className="btn btn--primary"
              >
                Service Registreren
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
