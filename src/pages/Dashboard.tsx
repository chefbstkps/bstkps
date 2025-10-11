import { useQuery } from '@tanstack/react-query'
import { useLanguage } from '../contexts/LanguageContext'
import { DashboardService } from '../services/dashboardService'
import { Radio, Package, Upload, Clock, TrendingUp } from 'lucide-react'
import './Dashboard.css'

export default function Dashboard() {
  const { t } = useLanguage()

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => DashboardService.getStats(),
    refetchInterval: 30000, // Refetch every 30 seconds
  })

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

  const statCards = [
    {
      label: t('radios.total'),
      value: stats?.total_radios || 0,
      icon: Radio,
      color: 'var(--color-primary)'
    },
    {
      label: t('radios.portable'),
      value: stats?.portable_radios || 0,
      icon: Radio,
      color: 'var(--color-success)'
    },
    {
      label: t('radios.mobile'),
      value: stats?.mobile_radios || 0,
      icon: Radio,
      color: 'var(--color-warning)'
    },
    {
      label: t('radios.base'),
      value: stats?.base_radios || 0,
      icon: Radio,
      color: 'var(--color-info)'
    },
    {
      label: t('accessories.title'),
      value: stats?.total_accessories || 0,
      icon: Package,
      color: 'var(--color-secondary)'
    }
  ]

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">{t('nav.dashboard')}</h1>
        <p className="page__subtitle">
          Overzicht van alle apparatuur en recente activiteiten
        </p>
      </div>

      <div className="stats-grid">
        {statCards.map((card, index) => {
          const Icon = card.icon
          return (
            <div key={index} className="stat-card">
              <div className="stat-card__icon" style={{ color: card.color }}>
                <Icon size={32} />
              </div>
              <div className="stat-card__value">{card.value}</div>
              <div className="stat-card__label">{card.label}</div>
            </div>
          )
        })}
      </div>

      <div className="dashboard__content">
        <div className="dashboard__grid">
          <div className="dashboard__card">
            <div className="card__header">
              <h3 className="card__title">
                <Clock className="card__icon" />
                Recente Installaties
              </h3>
            </div>
            <div className="card__body">
              {stats?.recent_installations && stats.recent_installations.length > 0 ? (
                <div className="activity-list">
                  {stats.recent_installations.map((installation) => (
                    <div key={installation.id} className="activity-item">
                      <div className="activity-item__content">
                        <div className="activity-item__title">
                          {installation.item_type === 'radio' ? 'Radio' : 'Accessoire'} geïnstalleerd
                        </div>
                        <div className="activity-item__details">
                          {installation.vehicle_merk} {installation.vehicle_model} - {installation.vehicle_afdeling}
                        </div>
                      </div>
                      <div className="activity-item__time">
                        {new Date(installation.installed_at).toLocaleDateString('nl-NL')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">Geen recente installaties</p>
              )}
            </div>
          </div>

          <div className="dashboard__card">
            <div className="card__header">
              <h3 className="card__title">
                <Upload className="card__icon" />
                Recente Afgiften
              </h3>
            </div>
            <div className="card__body">
              {stats?.recent_issues && stats.recent_issues.length > 0 ? (
                <div className="activity-list">
                  {stats.recent_issues.map((issue) => (
                    <div key={issue.id} className="activity-item">
                      <div className="activity-item__content">
                        <div className="activity-item__title">
                          {issue.accessory_info || `${issue.item_type === 'radio' ? 'Radio' : 'Accessoire'} afgegeven`}
                          {issue.quantity && issue.quantity > 1 && ` (${issue.quantity}x)`}
                        </div>
                        <div className="activity-item__details">
                          Aan: {issue.issued_to} - {issue.afdeling}
                        </div>
                      </div>
                      <div className="activity-item__time">
                        {new Date(issue.issued_at).toLocaleDateString('nl-NL')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">Geen recente afgiften</p>
              )}
            </div>
          </div>

          <div className="dashboard__card">
            <div className="card__header">
              <h3 className="card__title">
                <TrendingUp className="card__icon" />
                Recente Registraties
              </h3>
            </div>
            <div className="card__body">
              {stats?.recent_registrations && stats.recent_registrations.length > 0 ? (
                <div className="activity-list">
                  {stats.recent_registrations.map((radio) => (
                    <div key={radio.id} className="activity-item">
                      <div className="activity-item__content">
                        <div className="activity-item__title">
                          {radio.merk} {radio.model} - {radio.type}
                        </div>
                        <div className="activity-item__details">
                          ID: {radio.id} - {radio.afdeling}
                        </div>
                      </div>
                      <div className="activity-item__time">
                        {new Date(radio.created_at).toLocaleDateString('nl-NL')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">Geen recente registraties</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
