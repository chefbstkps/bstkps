import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { RadioService } from '../services/radioService'
import { Link } from 'react-router-dom'
import type { RadioHistory as RadioHistoryType } from '../types'
import {
  ArrowLeft,
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
} from 'lucide-react'
import './RadioHistoryDetails.css'

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

const DETAIL_LABELS: Record<string, string> = {
  old_value: 'Oude waarde',
  new_value: 'Nieuwe waarde',
  service_date: 'Servicedatum',
  notes: 'Opmerkingen',
  naam: 'Naam',
  voornaam: 'Voornaam',
  telefoonnummer: 'Telefoonnummer',
  rang_functie: 'Rang/functie',
  accessory_info: 'Accessoire informatie',
  quantity: 'Aantal',
  reden_van_inlevering: 'Reden inlevering',
  reden: 'Reden',
  reden_van_toewijzing: 'Reden toewijzing',
  previous_afdeling: 'Vorige afdeling',
  previous_groep: 'Vorige groep',
  previous_structuur: 'Vorige structuur',
  previous_voertuig: 'Vorige voertuig',
}

function getActionIcon(action: string) {
  switch (action) {
    case 'battery_replaced':
      return <Battery size={20} />
    case 'serviced':
      return <Wrench size={20} />
    case 'department_changed':
      return <Building size={20} />
    case 'alias_changed':
      return <Tag size={20} />
    case 'id_changed':
      return <Hash size={20} />
    case 'issued':
      return <Upload size={20} />
    case 'installed':
      return <Car size={20} />
    case 'inlevering':
      return <Package size={20} />
    case 'retour':
      return <RotateCcw size={20} />
    case 'toewijzing':
      return <UserPlus size={20} />
    default:
      return <History size={20} />
  }
}

export default function RadioHistoryDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: historyItem, isLoading, error } = useQuery({
    queryKey: ['radio-history-item', id],
    queryFn: () => RadioService.getHistoryById(id!),
    enabled: !!id,
  })

  const { data: radio } = useQuery({
    queryKey: ['radio', historyItem?.radio_id],
    queryFn: () => RadioService.getById(historyItem!.radio_id),
    enabled: !!historyItem?.radio_id,
  })

  const formatDate = (s: string) => {
    try {
      return new Date(s).toLocaleString('nl-NL')
    } catch {
      return s
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

  if (error || !historyItem) {
    return (
      <div className="page">
        <div className="alert alert--error">
          <p>Geschiedenisitem niet gevonden.</p>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => navigate('/radio-history')}
          >
            Terug naar Radio geschiedenis
          </button>
        </div>
      </div>
    )
  }

  const details = historyItem.details as Record<string, unknown> | undefined

  return (
    <div className="page">
      <div className="page__header">
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => navigate('/radio-history')}
        >
          <ArrowLeft size={20} />
          Terug
        </button>
        <h1 className="page__title">Geschiedenisdetails</h1>
      </div>

      <div className="radio-history-details">
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Algemene informatie</h3>
          </div>
          <div className="card__body">
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">ID</span>
                <span className="info-value info-value--mono">{historyItem.id}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Radio</span>
                <span className="info-value">
                  <Link
                    to={`/radios/${historyItem.radio_id}`}
                    className="radio-history-details__link"
                  >
                    {historyItem.radio_id}
                    {radio?.alias && (
                      <span className="radio-history-details__alias">
                        {' '}
                        ({radio.alias})
                      </span>
                    )}
                  </Link>
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Actie</span>
                <span className="info-value">
                  <span className="radio-history-details__action">
                    {getActionIcon(historyItem.action)}
                    {ACTION_LABELS[historyItem.action] ?? historyItem.action}
                  </span>
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Tijdstip</span>
                <span className="info-value">
                  {formatDate(historyItem.timestamp)}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Uitgevoerd door</span>
                <span className="info-value">
                  {historyItem.executed_by || '—'}
                </span>
              </div>
              <div className="info-item info-item--full">
                <span className="info-label">Beschrijving</span>
                <span className="info-value">{historyItem.description}</span>
              </div>
            </div>
          </div>
        </div>

        {details && Object.keys(details).length > 0 && (
          <div className="card">
            <div className="card__header">
              <h3 className="card__title">Details</h3>
            </div>
            <div className="card__body">
              <div className="info-grid">
                {details.vehicle_info && typeof details.vehicle_info === 'object' ? (
                    <>
                      <div className="info-item">
                        <span className="info-label">Voertuig merk</span>
                        <span className="info-value">
                          {(details.vehicle_info as { merk?: string }).merk || '—'}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Voertuig model</span>
                        <span className="info-value">
                          {(details.vehicle_info as { model?: string }).model || '—'}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Voertuig afdeling</span>
                        <span className="info-value">
                          {(details.vehicle_info as { afdeling?: string }).afdeling || '—'}
                        </span>
                      </div>
                    </>
                  ) : null}
                {Object.entries(details)
                  .filter(
                    ([key, value]) =>
                      key !== 'vehicle_info' &&
                      value != null &&
                      value !== '' &&
                      typeof value !== 'object'
                  )
                  .map(([key, value]) => (
                    <div key={key} className="info-item">
                      <span className="info-label">
                        {DETAIL_LABELS[key] ?? key}
                      </span>
                      <span className="info-value">{String(value)}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
