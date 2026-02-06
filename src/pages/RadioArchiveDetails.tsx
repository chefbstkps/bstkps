import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useLanguage } from '../contexts/LanguageContext'
import { RadioArchiveService } from '../services/radioArchiveService'
import { RadioService } from '../services/radioService'
import type { ArchivedRadio } from '../types'
import { ArrowLeft, Battery, Wrench, Building, Tag, Hash, Upload, Car, Package, RotateCcw, UserPlus, Edit } from 'lucide-react'
import './RadioDetails.css'

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
      return <Edit size={16} />
  }
}

function getActionLabel(action: string) {
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

export default function RadioArchiveDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useLanguage()

  const archiveIdOrId = id ?? ''
  const isValidId = Boolean(archiveIdOrId && archiveIdOrId !== 'undefined')

  const { data: radio, isLoading, error } = useQuery<ArchivedRadio | null, Error>({
    queryKey: ['radio-archive', archiveIdOrId],
    queryFn: () => RadioArchiveService.getById(archiveIdOrId),
    enabled: isValidId,
  })

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['radio-history', radio?.id],
    queryFn: () => RadioService.getHistory(radio!.id),
    enabled: Boolean(radio?.id),
  })

  if (!isValidId) {
    return (
      <div className="alert alert--error">
        <p>Ongeldige archieflink.</p>
        <button type="button" onClick={() => navigate('/radio-archive')} className="btn btn--primary">
          Terug naar Radio archief
        </button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>{t('common.loading')}</p>
      </div>
    )
  }

  if (error || !radio) {
    return (
      <div className="alert alert--error">
        <p>{t('common.error')}: Gearchiveerde radio niet gevonden</p>
        <button type="button" onClick={() => navigate('/radio-archive')} className="btn btn--primary">
          Terug naar Radio archief
        </button>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page__header">
        <button type="button" onClick={() => navigate('/radio-archive')} className="btn btn--secondary">
          <ArrowLeft size={20} />
          Terug
        </button>
        <h1 className="page__title">Radio archief – details</h1>
      </div>

      <div className="radio-details">
        <div className="radio-details__main">
          <div className="card">
            <div className="card__header">
              <h3 className="card__title">Radio informatie (gearchiveerd)</h3>
            </div>
            <div className="card__body">
              <div className="info-grid">
                <div className="info-item">
                  <label className="info-label">ID</label>
                  <div className="info-value">{radio.id}</div>
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
                    <span className={`type-badge type-badge--${radio.type.toLowerCase()}`}>{radio.type}</span>
                  </div>
                </div>
                <div className="info-item">
                  <label className="info-label">Serienummer</label>
                  <div className="info-value">{radio.serienummer}</div>
                </div>
                <div className="info-item">
                  <label className="info-label">Alias</label>
                  <div className="info-value">{radio.alias}</div>
                </div>
                <div className="info-item">
                  <label className="info-label">Afdeling</label>
                  <div className="info-value">{radio.afdeling}</div>
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
                    <span className={`status-badge status-badge--${radio.status.toLowerCase()}`}>{radio.status}</span>
                  </div>
                </div>
                <div className="info-item">
                  <label className="info-label">Opmerking</label>
                  <div className="info-value">{radio.opmerking || '-'}</div>
                </div>
                <div className="info-item">
                  <label className="info-label">Gearchiveerd op</label>
                  <div className="info-value">
                    {radio.archived_at ? new Date(radio.archived_at).toLocaleString('nl-NL') : '-'}
                  </div>
                </div>
                <div className="info-item">
                  <label className="info-label">Gearchiveerd door</label>
                  <div className="info-value">{radio.archived_by ?? '-'}</div>
                </div>
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
                <div className="loading-spinner" />
                <p>Geschiedenis laden...</p>
              </div>
            ) : history && history.length > 0 ? (
              <div className="history-list">
                {history.map((entry) => (
                  <div key={entry.id} className="history-item">
                    <div className="history-item__icon">{getActionIcon(entry.action)}</div>
                    <div className="history-item__content">
                      <div className="history-item__title">{getActionLabel(entry.action)}</div>
                      <div className="history-item__description">{entry.description}</div>
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
                          {entry.details.quantity != null && (
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
    </div>
  )
}
