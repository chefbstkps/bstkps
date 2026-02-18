import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { RadioService } from '../services/radioService'
import { InventoryService } from '../services/inventoryService'
import { AccessoryService } from '../services/accessoryService'
import { OrganizationService } from '../services/organizationService'
import { type InventoryIssueFormData, type Radio } from '../types'
import { ArrowLeft, Edit, Trash2, Battery, Wrench, Building, Tag, Hash, Upload, Car, Package, RotateCcw, UserPlus, FileDown } from 'lucide-react'
import { jsPDF } from 'jspdf'
import './RadioDetails.css'

export default function RadioDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { isSuperUserOrAdmin, user } = useAuth()
  const queryClient = useQueryClient()

  // Modal state management
  const [showBatteryModal, setShowBatteryModal] = useState(false)
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [showInleveringModal, setShowInleveringModal] = useState(false)
  const [showRetourModal, setShowRetourModal] = useState(false)
  const [showToewijzingModal, setShowToewijzingModal] = useState(false)
  const [showIdModal, setShowIdModal] = useState(false)
  const [showAliasModal, setShowAliasModal] = useState(false)
  const [showDepartmentModal, setShowDepartmentModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [lastPdfGenerated, setLastPdfGenerated] = useState<{ by: string; at: string } | null>(null)

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
    mutationFn: (id: string) => RadioService.delete(id, user?.username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['radios'] })
      queryClient.invalidateQueries({ queryKey: ['radios-archive'] })
      navigate('/radios')
    },
  })

  const addHistoryMutation = useMutation({
    mutationFn: ({ action, description, details, executed_by }: { action: string; description: string; details?: any; executed_by?: string | null }) =>
      RadioService.addHistoryEntry(id!, action, description, details, executed_by),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['radio-history', id] })
    },
  })

  const executedBy = user?.username ?? 'Admin'

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

  const handleInlevering = () => {
    setShowInleveringModal(true)
  }

  const handleRetour = () => {
    setShowRetourModal(true)
  }

  const handleToewijzing = () => {
    setShowToewijzingModal(true)
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
      case 'inlevering':
        return <Package size={16} />
      case 'retour':
        return <RotateCcw size={16} />
      case 'toewijzing':
        return <UserPlus size={16} />
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
      case 'inlevering':
        return 'Ingeleverd'
      case 'retour':
        return 'Retour'
      case 'toewijzing':
        return 'Toewijzing'
      default:
        return 'Gewijzigd'
    }
  }

  const getHistoryActionLabel = (action: string) => {
    return getActionLabel(action)
  }

  const handleGeneratePdf = () => {
    if (!radio) return
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 15
    const maxWidth = pageWidth - 2 * margin
    let y = 20
    const lineHeight = 6

    const addText = (text: string, fontSize = 10, isBold = false) => {
      doc.setFontSize(fontSize)
      doc.setFont('helvetica', isBold ? 'bold' : 'normal')
      const lines = doc.splitTextToSize(text, maxWidth)
      for (const line of lines) {
        if (y > 277) {
          doc.addPage()
          y = 20
        }
        doc.text(line, margin, y)
        y += lineHeight
      }
    }

    const addSpacing = (mm = 4) => {
      y += mm
    }

    // Header: Korps Politie Suriname
    addText('Korps Politie Suriname', 14, true)
    addText('Structuur: Bedrijfsvoering', 10)
    addText('Afdeling: Bureau Systeem Techniek', 10)
    addSpacing(8)

    // Radio Details
    addText('Radio Details', 12, true)
    addSpacing(4)
    addText(`ID: ${radio.id}`)
    addText(`Merk: ${radio.merk}`)
    addText(`Model: ${radio.model}`)
    addText(`Type: ${radio.type}`)
    addText(`Serienummer: ${radio.serienummer}`)
    addText(`Alias: ${radio.alias}`)
    addText(`Afdeling: ${radio.afdeling}`)
    addText(`Organisatie: ${radio.groep || '-'}`)
    addText(`Structuur: ${radio.structuur || '-'}`)
    if (radio.type === 'Mobile') {
      addText(`Voertuig: ${radio.voertuig || '-'}`)
    }
    addText(`Registratiedatum: ${new Date(radio.registratiedatum).toLocaleDateString('nl-NL')}`)
    addText(`Status: ${radio.status}`)
    addText(`Opmerking: ${radio.opmerking || '-'}`)
    addText(`Toegevoegd door: ${radio.added_by ?? '-'}`)
    addSpacing(8)

    // Geschiedenis
    addText('Geschiedenis', 12, true)
    addSpacing(4)
    if (history && history.length > 0) {
      for (const entry of history) {
        addText(`${getHistoryActionLabel(entry.action)} - ${new Date(entry.timestamp).toLocaleString('nl-NL')}${entry.executed_by ? ` (door ${entry.executed_by})` : ''}`)
        addText(entry.description)
        if (entry.details) {
          const detailParts: string[] = []
          if (entry.details.service_date) detailParts.push(`Datum: ${new Date(entry.details.service_date).toLocaleDateString('nl-NL')}`)
          if (entry.details.naam) detailParts.push(`Naam: ${entry.details.naam}`)
          if (entry.details.voornaam) detailParts.push(`Voornaam: ${entry.details.voornaam}`)
          if (entry.details.telefoonnummer) detailParts.push(`Telefoonnummer: ${entry.details.telefoonnummer}`)
          if (entry.details.rang_functie) detailParts.push(`Rang/Functie: ${entry.details.rang_functie}`)
          if (entry.details.accessory_info) detailParts.push(`Accessoire: ${entry.details.accessory_info}`)
          if (entry.details.quantity != null) detailParts.push(`Aantal: ${entry.details.quantity}`)
          if (entry.details.notes) detailParts.push(`Opmerking: ${entry.details.notes}`)
          if (entry.details.old_value) detailParts.push(`Van: ${entry.details.old_value}`)
          if (entry.details.new_value) detailParts.push(`Naar: ${entry.details.new_value}`)
          if (entry.details.vehicle_info) detailParts.push(`Voertuig: ${entry.details.vehicle_info.merk} ${entry.details.vehicle_info.model}`)
          if (entry.details.reden_van_inlevering) detailParts.push(`Reden: ${entry.details.reden_van_inlevering}`)
          if (entry.details.reden) detailParts.push(`Reden: ${entry.details.reden}`)
          if (entry.details.reden_van_toewijzing) detailParts.push(`Reden: ${entry.details.reden_van_toewijzing}`)
          if ('previous_afdeling' in entry.details && entry.details.previous_afdeling) detailParts.push(`Vorige afdeling: ${entry.details.previous_afdeling}`)
          if ('previous_groep' in entry.details && entry.details.previous_groep) detailParts.push(`Vorige organisatie: ${entry.details.previous_groep}`)
          if ('previous_structuur' in entry.details && entry.details.previous_structuur) detailParts.push(`Vorige structuur: ${entry.details.previous_structuur}`)
          if ('previous_voertuig' in entry.details && entry.details.previous_voertuig) detailParts.push(`Vorige voertuig: ${entry.details.previous_voertuig}`)
          if (detailParts.length > 0) {
            addText(detailParts.join(' | '))
          }
        }
        addSpacing(4)
      }
    } else {
      addText('Geen geschiedenis beschikbaar')
    }

    addSpacing(12)
    // Footer: gegenereerd door en datum
    const generatedBy = user?.username ?? 'Onbekend'
    const generatedAt = new Date().toLocaleString('nl-NL')
    addText(`PDF gegenereerd door: ${generatedBy}`, 9)
    addText(`Datum: ${generatedAt}`, 9)

    doc.save(`Radio-${radio.id}-${new Date().toISOString().slice(0, 10)}.pdf`)
    setLastPdfGenerated({ by: generatedBy, at: generatedAt })
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
            onClick={handleGeneratePdf}
            className="btn btn--secondary"
            title="PDF genereren"
          >
            <FileDown size={20} />
            PDF
          </button>
          {isSuperUserOrAdmin() && (
          <button
            onClick={handleDelete}
            className="btn btn--danger"
            disabled={deleteMutation.isPending}
          >
            <Trash2 size={20} />
            {t('common.delete')}
          </button>
          )}
        </div>
      </div>

      {lastPdfGenerated && (
        <div className="radio-details__pdf-info">
          PDF gegenereerd door <strong>{lastPdfGenerated.by}</strong> op {lastPdfGenerated.at}
        </div>
      )}

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
                    {isSuperUserOrAdmin() && (
                    <button
                      onClick={handleIdChange}
                      className="btn btn--icon btn--secondary"
                      title="ID wijzigen"
                    >
                      <Edit size={16} />
                    </button>
                    )}
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
                    {isSuperUserOrAdmin() && (
                    <button
                      onClick={handleAliasChange}
                      className="btn btn--icon btn--secondary"
                      title="Alias wijzigen"
                    >
                      <Edit size={16} />
                    </button>
                    )}
                  </div>
                </div>
                <div className="info-item">
                  <label className="info-label">Afdeling</label>
                  <div className="info-value">
                    {radio.afdeling}
                    {isSuperUserOrAdmin() && (
                    <button
                      onClick={handleDepartmentChange}
                      className="btn btn--icon btn--secondary"
                      title="Afdeling wijzigen"
                    >
                      <Edit size={16} />
                    </button>
                    )}
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
                <div className="info-item">
                  <label className="info-label">Toegevoegd door</label>
                  <div className="info-value">{radio.added_by ?? '-'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {isSuperUserOrAdmin() && (
        <div className="radio-details__actions">
          <div className="radio-details__card">
            <div className="card__header">
              <h3 className="card__title">Snelle Acties</h3>
            </div>
            <div className="action-card__body">
              <div className="radio-details__action-buttons">
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
                <button
                  onClick={handleInlevering}
                  className="btn btn--secondary"
                  disabled={addHistoryMutation.isPending}
                >
                  <Package size={20} />
                  Inlevering
                </button>
                <button
                  onClick={handleRetour}
                  className="btn btn--secondary"
                  disabled={addHistoryMutation.isPending || radio?.status === 'Actief'}
                  title={radio?.status === 'Actief' ? 'Retour is alleen mogelijk als de status niet Actief is' : undefined}
                >
                  <RotateCcw size={20} />
                  Retour
                </button>
                <button
                  onClick={handleToewijzing}
                  className="btn btn--secondary"
                  disabled={addHistoryMutation.isPending}
                >
                  <UserPlus size={20} />
                  Toewijzing
                </button>
              </div>
            </div>
          </div>
        </div>
        )}
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
                          {entry.details.reden_van_inlevering && (
                            <span className="detail-item">
                              Reden: <strong>{entry.details.reden_van_inlevering}</strong>
                            </span>
                          )}
                          {entry.details.reden && (
                            <span className="detail-item">
                              Reden: <strong>{entry.details.reden}</strong>
                            </span>
                          )}
                          {entry.details.reden_van_toewijzing && (
                            <span className="detail-item">
                              Reden: <strong>{entry.details.reden_van_toewijzing}</strong>
                            </span>
                          )}
                          {'previous_afdeling' in entry.details && entry.details.previous_afdeling != null && entry.details.previous_afdeling !== '' && (
                            <span className="detail-item">
                              Vorige afdeling: <strong>{String(entry.details.previous_afdeling)}</strong>
                            </span>
                          )}
                          {'previous_groep' in entry.details && entry.details.previous_groep != null && entry.details.previous_groep !== '' && (
                            <span className="detail-item">
                              Vorige organisatie: <strong>{String(entry.details.previous_groep)}</strong>
                            </span>
                          )}
                          {'previous_structuur' in entry.details && entry.details.previous_structuur != null && entry.details.previous_structuur !== '' && (
                            <span className="detail-item">
                              Vorige structuur: <strong>{String(entry.details.previous_structuur)}</strong>
                            </span>
                          )}
                          {'previous_voertuig' in entry.details && entry.details.previous_voertuig != null && entry.details.previous_voertuig !== '' && (
                            <span className="detail-item">
                              Vorige voertuig: <strong>{String(entry.details.previous_voertuig)}</strong>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="history-item__meta">
                      <span className="history-item__timestamp">
                        {new Date(entry.timestamp).toLocaleString('nl-NL')}
                      </span>
                      {entry.executed_by && (
                        <span className="history-item__executed-by">
                          · door {entry.executed_by}
                        </span>
                      )}
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
              },
              executed_by: executedBy
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
              },
              executed_by: executedBy
            }, {
              onSuccess: () => {
                setShowServiceModal(false)
              }
            })
          }}
          isLoading={addHistoryMutation.isPending}
        />
      )}

      {/* Inlevering Modal */}
      {showInleveringModal && (
        <InleveringModal
          onClose={() => setShowInleveringModal(false)}
          onSubmit={async (date, notes, naam, voornaam, telefoonnummer, rangFunctie, redenVanInlevering) => {
            const status = redenVanInlevering as 'Defect' | 'Ingetrokken'
            await addHistoryMutation.mutateAsync({
              action: 'inlevering',
              description: `Radio ingeleverd (${status})`,
              details: {
                service_date: date,
                notes: notes,
                naam: naam,
                voornaam: voornaam,
                telefoonnummer: telefoonnummer,
                rang_functie: rangFunctie,
                reden_van_inlevering: status
              },
              executed_by: executedBy
            })
            await RadioService.update(id!, { status })
            queryClient.invalidateQueries({ queryKey: ['radio', id] })
            queryClient.invalidateQueries({ queryKey: ['radios'] })
            setShowInleveringModal(false)
          }}
          isLoading={addHistoryMutation.isPending}
        />
      )}

      {/* Retour Modal */}
      {showRetourModal && (
        <RetourModal
          onClose={() => setShowRetourModal(false)}
          onSubmit={async (date, notes, naam, voornaam, telefoonnummer, rangFunctie) => {
            await addHistoryMutation.mutateAsync({
              action: 'retour',
              description: 'Retour na reparatie',
              details: {
                service_date: date,
                notes: notes,
                naam: naam,
                voornaam: voornaam,
                telefoonnummer: telefoonnummer,
                rang_functie: rangFunctie,
                reden: 'Retour na reparatie'
              },
              executed_by: executedBy
            })
            await RadioService.update(id!, { status: 'Actief' })
            queryClient.invalidateQueries({ queryKey: ['radio', id] })
            queryClient.invalidateQueries({ queryKey: ['radios'] })
            setShowRetourModal(false)
          }}
          isLoading={addHistoryMutation.isPending}
        />
      )}

      {/* Toewijzing Modal */}
      {showToewijzingModal && radio && (
        <ToewijzingModal
          radio={radio}
          onClose={() => setShowToewijzingModal(false)}
          onSubmit={async (data) => {
            await addHistoryMutation.mutateAsync({
              action: 'toewijzing',
              description: `Toewijzing: ${data.redenVanToewijzing}`,
              details: {
                service_date: data.date,
                reden_van_toewijzing: data.redenVanToewijzing,
                previous_afdeling: radio.afdeling,
                previous_groep: radio.groep ?? '',
                previous_structuur: radio.structuur ?? '',
                ...(radio.type === 'Mobile' && { previous_voertuig: radio.voertuig ?? '' }),
                alias: data.alias,
                afdeling: data.afdeling,
                groep: data.groep,
                structuur: data.structuur,
                voertuig: data.voertuig,
                naam: data.naam,
                voornaam: data.voornaam,
                telefoonnummer: data.telefoonnummer,
                rang_functie: data.rangFunctie,
                notes: data.notes
              },
              executed_by: executedBy
            })
            const updatePayload: Parameters<typeof RadioService.update>[1] = {
              alias: data.alias,
              afdeling: data.afdeling,
              groep: data.groep,
              structuur: data.structuur,
              status: 'Actief'
            }
            if (radio.type === 'Mobile') {
              updatePayload.voertuig = data.voertuig ?? ''
            }
            await RadioService.update(id!, updatePayload)
            queryClient.invalidateQueries({ queryKey: ['radio', id] })
            queryClient.invalidateQueries({ queryKey: ['radios'] })
            setShowToewijzingModal(false)
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
                },
                executed_by: executedBy
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
                },
                executed_by: executedBy
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
                },
                executed_by: executedBy
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
                <div className="service-modal__group" />
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
                <div className="service-modal__group" />
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
                <div className="service-modal__group" />
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

// Retour Modal Component (same fields as Service; saves "Reden: Retour na reparatie", sets status to Actief)
function RetourModal({
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
          <h2>Retour</h2>
          <button onClick={onClose} className="modal__close">×</button>
        </div>
        <div className="service-modal__wrapper">
          <form onSubmit={handleSubmit} className="service-modal__form">
            <div className="service-modal__content">
              <div className="service-modal__grid">
                <div className="service-modal__group">
                  <label className="service-modal__label">Datum van retour *</label>
                  <input
                    type="date"
                    className="service-modal__input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
                <div className="service-modal__group" />
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
                  placeholder="Optionele opmerkingen over de retour..."
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
                {isLoading ? 'Bezig met opslaan...' : 'Retour Registreren'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Toewijzing Modal: reden, alias, organisatie/structuur/afdeling (dropdowns), voertuig if Mobile, naam/voornaam/telefoon/rang/opmerkingen
function ToewijzingModal({
  radio,
  onClose,
  onSubmit,
  isLoading = false
}: {
  radio: Radio
  onClose: () => void
  onSubmit: (data: {
    date: string
    redenVanToewijzing: string
    alias: string
    groep: string
    structuur: string
    afdeling: string
    voertuig?: string
    naam: string
    voornaam: string
    telefoonnummer: string
    rangFunctie: string
    notes: string
  }) => void
  isLoading?: boolean
}) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [redenVanToewijzing, setRedenVanToewijzing] = useState('')
  const [alias, setAlias] = useState(radio.alias || '')
  const [groep, setGroep] = useState(radio.groep || '')
  const [structuur, setStructuur] = useState(radio.structuur || '')
  const [afdeling, setAfdeling] = useState(radio.afdeling || '')
  const [voertuig, setVoertuig] = useState(radio.voertuig || '')
  const [naam, setNaam] = useState('')
  const [voornaam, setVoornaam] = useState('')
  const [telefoonnummer, setTelefoonnummer] = useState('')
  const [rangFunctie, setRangFunctie] = useState('')
  const [notes, setNotes] = useState('')

  const [groepen, setGroepen] = useState<{ id: string; name: string }[]>([])
  const [structuren, setStructuren] = useState<{ id: string; name: string }[]>([])
  const [afdelingen, setAfdelingen] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    setAlias(radio.alias || '')
    setGroep(radio.groep || '')
    setStructuur(radio.structuur || '')
    setAfdeling(radio.afdeling || '')
    setVoertuig(radio.voertuig || '')
  }, [radio])

  useEffect(() => {
    OrganizationService.getAllGroepen().then(setGroepen).catch(console.error)
  }, [])

  useEffect(() => {
    if (!groep) {
      setStructuren([])
      setStructuur('')
      setAfdeling('')
      return
    }
    const selectedGroep = groepen.find(g => g.name === groep)
    if (selectedGroep) {
      OrganizationService.getStructurenByGroep(selectedGroep.id)
        .then(setStructuren)
        .catch(console.error)
    } else {
      setStructuren([])
    }
  }, [groep, groepen])

  useEffect(() => {
    if (!structuur) {
      setAfdelingen([])
      setAfdeling('')
      return
    }
    const selectedStructuur = structuren.find(s => s.name === structuur)
    if (selectedStructuur) {
      OrganizationService.getAfdelingenByStructuur(selectedStructuur.id)
        .then(setAfdelingen)
        .catch(console.error)
    } else {
      setAfdelingen([])
    }
  }, [structuur, structuren])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (redenVanToewijzing && afdeling) {
      onSubmit({
        date,
        redenVanToewijzing,
        alias,
        groep,
        structuur,
        afdeling,
        voertuig: radio.type === 'Mobile' ? voertuig : undefined,
        naam,
        voornaam,
        telefoonnummer,
        rangFunctie,
        notes
      })
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal__header">
          <h2>Toewijzing</h2>
          <button onClick={onClose} className="modal__close">×</button>
        </div>
        <div className="service-modal__wrapper">
          <form onSubmit={handleSubmit} className="service-modal__form">
            <div className="service-modal__content">
              <div className="service-modal__grid">
                <div className="service-modal__group">
                  <label className="service-modal__label">Datum van toewijzing *</label>
                  <input
                    type="date"
                    className="service-modal__input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
                <div className="service-modal__group">
                  <label className="service-modal__label">Reden van toewijzing *</label>
                  <select
                    className="service-modal__input"
                    value={redenVanToewijzing}
                    onChange={(e) => setRedenVanToewijzing(e.target.value)}
                    required
                  >
                    <option value="">Selecteer reden</option>
                    <option value="Nieuwe radio">Nieuwe radio</option>
                    <option value="Andere afdeling">Andere afdeling</option>
                    <option value="Retour na reparatie">Retour na reparatie</option>
                  </select>
                </div>
              </div>

              <div className="service-modal__grid">
                <div className="service-modal__group">
                  <label className="service-modal__label">Alias *</label>
                  <input
                    type="text"
                    className="service-modal__input"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    required
                    placeholder="Bijv. Recherche-02"
                  />
                </div>
                <div className="service-modal__group">
                  <label className="service-modal__label">Organisatie</label>
                  <select
                    className="service-modal__input"
                    value={groep}
                    onChange={(e) => {
                      setGroep(e.target.value)
                      setStructuur('')
                      setAfdeling('')
                    }}
                  >
                    <option value="">Selecteer organisatie</option>
                    {groepen.map(g => (
                      <option key={g.id} value={g.name}>{g.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="service-modal__grid">
                <div className="service-modal__group">
                  <label className="service-modal__label">Structuur</label>
                  <select
                    className="service-modal__input"
                    value={structuur}
                    onChange={(e) => {
                      setStructuur(e.target.value)
                      setAfdeling('')
                    }}
                    disabled={!groep}
                  >
                    <option value="">Selecteer structuur</option>
                    {structuren.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="service-modal__group">
                  <label className="service-modal__label">Afdeling *</label>
                  <select
                    className="service-modal__input"
                    value={afdeling}
                    onChange={(e) => setAfdeling(e.target.value)}
                    disabled={!structuur}
                    required
                  >
                    <option value="">Selecteer afdeling</option>
                    {afdelingen.map(a => (
                      <option key={a.id} value={a.name}>{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {radio.type === 'Mobile' && (
                <div className="service-modal__grid">
                  <div className="service-modal__group">
                    <label className="service-modal__label">Voertuig</label>
                    <input
                      type="text"
                      className="service-modal__input"
                      value={voertuig}
                      onChange={(e) => setVoertuig(e.target.value)}
                      placeholder="Bijv. Isuzu D-max - 12-34 HV"
                    />
                  </div>
                  <div className="service-modal__group" />
                </div>
              )}

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
                  placeholder="Optionele opmerkingen..."
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
                disabled={isLoading || !redenVanToewijzing || !afdeling}
              >
                {isLoading ? 'Bezig met opslaan...' : 'Toewijzing Registreren'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Inlevering Modal Component (same fields as Service + Reden van inlevering dropdown)
function InleveringModal({
  onClose,
  onSubmit,
  isLoading = false
}: {
  onClose: () => void
  onSubmit: (date: string, notes: string, naam: string, voornaam: string, telefoonnummer: string, rangFunctie: string, redenVanInlevering: 'Defect' | 'Ingetrokken') => void
  isLoading?: boolean
}) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [naam, setNaam] = useState('')
  const [voornaam, setVoornaam] = useState('')
  const [telefoonnummer, setTelefoonnummer] = useState('')
  const [rangFunctie, setRangFunctie] = useState('')
  const [redenVanInlevering, setRedenVanInlevering] = useState<'Defect' | 'Ingetrokken' | ''>('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (redenVanInlevering) {
      onSubmit(date, notes, naam, voornaam, telefoonnummer, rangFunctie, redenVanInlevering)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal__header">
          <h2>Inlevering</h2>
          <button onClick={onClose} className="modal__close">×</button>
        </div>
        <div className="service-modal__wrapper">
          <form onSubmit={handleSubmit} className="service-modal__form">
            <div className="service-modal__content">
              <div className="service-modal__grid">
                <div className="service-modal__group">
                  <label className="service-modal__label">Datum van inlevering *</label>
                  <input
                    type="date"
                    className="service-modal__input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
                <div className="service-modal__group">
                  <label className="service-modal__label">Reden van inlevering *</label>
                  <select
                    className="service-modal__input"
                    value={redenVanInlevering}
                    onChange={(e) => setRedenVanInlevering(e.target.value as 'Defect' | 'Ingetrokken' | '')}
                    required
                  >
                    <option value="">Selecteer reden</option>
                    <option value="Defect">Defect</option>
                    <option value="Ingetrokken">Ingetrokken</option>
                  </select>
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
                  placeholder="Optionele opmerkingen over de inlevering..."
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
                disabled={isLoading || !redenVanInlevering}
              >
                {isLoading ? 'Bezig met opslaan...' : 'Inlevering Registreren'}
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
