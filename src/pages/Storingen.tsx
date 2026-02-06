import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Search, Eye, Trash2, AlertTriangle, Phone, Radio, Siren } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { storingService } from '../services/storingService'
import { StoringFormData, StoringWithFeedback } from '../types'
import './Storingen.css'

export default function Storingen() {
  useLanguage()
  const { isSuperUserOrAdmin } = useAuth()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    soort_storing: '',
    betrokken_afdeling: '',
    is_afgehandeld: undefined as boolean | undefined
  })

  // Form state
  const [formData, setFormData] = useState<StoringFormData>({
    storingnummer: '',
    soort_storing: 'Radio',
    betrokken_afdeling: '',
    adres: '',
    locatie: 'Gebouw',
    aard_storing: '',
    naam_contactpersoon: '',
    telefoonnummer_contactpersoon: '',
    datum_storing_binnengekomen: new Date().toISOString().split('T')[0],
    datum_storing_begonnen: new Date().toISOString().split('T')[0],
    handeling: 'Zelf afhandelen'
  })

  // Queries
  const { data: storingen = [], isLoading } = useQuery({
    queryKey: ['storingen', filters],
    queryFn: () => storingService.getStoringen(filters)
  })

  const { data: searchResults = [] } = useQuery({
    queryKey: ['storingen-search', searchTerm],
    queryFn: () => storingService.searchStoringen(searchTerm),
    enabled: searchTerm.length > 2
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: storingService.createStoring,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storingen'] })
      setShowForm(false)
      resetForm()
    }
  })

  const deleteMutation = useMutation({
    mutationFn: storingService.deleteStoring,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storingen'] })
    }
  })

  // Get next storingnummer on component mount
  useEffect(() => {
    const getNextNumber = async () => {
      try {
        const nextNumber = await storingService.getNextStoringnummer()
        setFormData(prev => ({ ...prev, storingnummer: nextNumber }))
      } catch (error) {
        console.error('Error getting next storingnummer:', error)
      }
    }
    getNextNumber()
  }, [])

  const resetForm = () => {
    setFormData({
      storingnummer: '',
      soort_storing: 'Radio',
      betrokken_afdeling: '',
      adres: '',
      locatie: 'Gebouw',
      aard_storing: '',
      naam_contactpersoon: '',
      telefoonnummer_contactpersoon: '',
      datum_storing_binnengekomen: new Date().toISOString().split('T')[0],
      datum_storing_begonnen: new Date().toISOString().split('T')[0],
      handeling: 'Zelf afhandelen'
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Weet je zeker dat je deze storing wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.')) {
      deleteMutation.mutate(id)
    }
  }

  const getStoringIcon = (soort: string) => {
    switch (soort) {
      case 'Radio':
        return <Radio className="storing-icon" />
      case 'Telefonie':
        return <Phone className="storing-icon" />
      case 'Waarschuwingsapparatuur':
        return <Siren className="storing-icon" />
      default:
        return <AlertTriangle className="storing-icon" />
    }
  }

  const getStatusBadge = (storing: StoringWithFeedback) => {
    const hasFeedback = storing.feedback && storing.feedback.length > 0
    const isAfgehandeld = hasFeedback && storing.feedback.some(f => f.is_afgehandeld)
    
    if (isAfgehandeld) {
      return <span className="status-badge status-afgehandeld">Afgehandeld</span>
    } else if (hasFeedback) {
      return <span className="status-badge status-in-behandeling">In behandeling</span>
    } else {
      return <span className="status-badge status-open">Open</span>
    }
  }

  const displayData = searchTerm.length > 2 ? searchResults : storingen

  return (
    <div className="storingen-page">
      <div className="page-header">
        <h1>Storingen</h1>
        {isSuperUserOrAdmin() && (
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="btn-icon" />
          Nieuwe Storing
        </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="search-filters">
        <div className="search-box">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Zoek storingen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filters">
          <select
            value={filters.soort_storing}
            onChange={(e) => setFilters(prev => ({ ...prev, soort_storing: e.target.value }))}
            className="filter-select"
          >
            <option value="">Alle soorten</option>
            <option value="Radio">Radio</option>
            <option value="Telefonie">Telefonie</option>
            <option value="Waarschuwingsapparatuur">Waarschuwingsapparatuur</option>
          </select>

          <select
            value={filters.is_afgehandeld === undefined ? '' : filters.is_afgehandeld.toString()}
            onChange={(e) => setFilters(prev => ({ 
              ...prev, 
              is_afgehandeld: e.target.value === '' ? undefined : e.target.value === 'true'
            }))}
            className="filter-select"
          >
            <option value="">Alle statussen</option>
            <option value="false">Open</option>
            <option value="true">Afgehandeld</option>
          </select>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="form-container">
          <h2>Nieuwe Storing Registreren</h2>
          <form onSubmit={handleSubmit} className="storing-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="storingnummer">Storingnummer *</label>
                <input
                  type="text"
                  id="storingnummer"
                  name="storingnummer"
                  value={formData.storingnummer}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="soort_storing">Soort Storing *</label>
                <select
                  id="soort_storing"
                  name="soort_storing"
                  value={formData.soort_storing}
                  onChange={handleInputChange}
                  required
                  className="form-select"
                >
                  <option value="Radio">Radio</option>
                  <option value="Telefonie">Telefonie</option>
                  <option value="Waarschuwingsapparatuur">Waarschuwingsapparatuur</option>
                </select>
              </div>
            </div>

            {/* Conditional fields based on soort_storing */}
            {formData.soort_storing === 'Telefonie' && (
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="telefonie_type">Type Aansluiting</label>
                  <select
                    id="telefonie_type"
                    name="telefonie_type"
                    value={formData.telefonie_type || ''}
                    onChange={handleInputChange}
                    className="form-select"
                  >
                    <option value="">Selecteer type</option>
                    <option value="Glasvezel">Glasvezel</option>
                    <option value="Koper">Koper</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="aansluitnummer">Aansluitnummer</label>
                  <input
                    type="text"
                    id="aansluitnummer"
                    name="aansluitnummer"
                    value={formData.aansluitnummer || ''}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="telefoonnummer_storing">Telefoonnummer waar storing op is</label>
                  <input
                    type="text"
                    id="telefoonnummer_storing"
                    name="telefoonnummer_storing"
                    value={formData.telefoonnummer_storing || ''}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
              </div>
            )}

            {formData.soort_storing === 'Waarschuwingsapparatuur' && (
              <div className="form-group">
                <label htmlFor="waarschuwingsapparatuur_type">Type Waarschuwingsapparatuur</label>
                <select
                  id="waarschuwingsapparatuur_type"
                  name="waarschuwingsapparatuur_type"
                  value={formData.waarschuwingsapparatuur_type || ''}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="">Selecteer type</option>
                  <option value="Zwaailicht">Zwaailicht</option>
                  <option value="Sirene">Sirene</option>
                </select>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="betrokken_afdeling">Betrokken Afdeling *</label>
                <input
                  type="text"
                  id="betrokken_afdeling"
                  name="betrokken_afdeling"
                  value={formData.betrokken_afdeling}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="locatie">Locatie *</label>
                <select
                  id="locatie"
                  name="locatie"
                  value={formData.locatie}
                  onChange={handleInputChange}
                  required
                  className="form-select"
                >
                  <option value="Gebouw">Gebouw</option>
                  <option value="Voertuig">Voertuig</option>
                  <option value="Anders">Anders</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="adres">Adres *</label>
              <input
                type="text"
                id="adres"
                name="adres"
                value={formData.adres}
                onChange={handleInputChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="aard_storing">Aard van de Storing *</label>
              <textarea
                id="aard_storing"
                name="aard_storing"
                value={formData.aard_storing}
                onChange={handleInputChange}
                required
                className="form-textarea"
                rows={3}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="naam_contactpersoon">Naam Contactpersoon *</label>
                <input
                  type="text"
                  id="naam_contactpersoon"
                  name="naam_contactpersoon"
                  value={formData.naam_contactpersoon}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="telefoonnummer_contactpersoon">Telefoonnummer Contactpersoon *</label>
                <input
                  type="text"
                  id="telefoonnummer_contactpersoon"
                  name="telefoonnummer_contactpersoon"
                  value={formData.telefoonnummer_contactpersoon}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="datum_storing_binnengekomen">Datum Storing Binnengekomen *</label>
                <input
                  type="date"
                  id="datum_storing_binnengekomen"
                  name="datum_storing_binnengekomen"
                  value={formData.datum_storing_binnengekomen}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="datum_storing_begonnen">Datum Storing Begonnen *</label>
                <input
                  type="date"
                  id="datum_storing_begonnen"
                  name="datum_storing_begonnen"
                  value={formData.datum_storing_begonnen}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="handeling">Handeling *</label>
              <select
                id="handeling"
                name="handeling"
                value={formData.handeling}
                onChange={handleInputChange}
                required
                className="form-select"
              >
                <option value="Zelf afhandelen">Zelf afhandelen</option>
                <option value="Verwezen naar Telesur">Verwezen naar Telesur</option>
              </select>
            </div>

            {formData.handeling === 'Verwezen naar Telesur' && (
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="telesur_ticketnummer">Telesur Ticketnummer</label>
                  <input
                    type="text"
                    id="telesur_ticketnummer"
                    name="telesur_ticketnummer"
                    value={formData.telesur_ticketnummer || ''}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="datum_verwezen">Datum Verwezen</label>
                  <input
                    type="date"
                    id="datum_verwezen"
                    name="datum_verwezen"
                    value={formData.datum_verwezen || ''}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
              </div>
            )}

            <div className="form-actions">
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">
                Annuleren
              </button>
              <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Opslaan...' : 'Storing Opslaan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Storingen Table */}
      <div className="storingen-table-container">
        <h2>Storingen Overzicht</h2>
        {isLoading ? (
          <div className="loading">Laden...</div>
        ) : (
          <div className="table-wrapper">
            <table className="storingen-table">
              <thead>
                <tr>
                  <th>Storingnummer</th>
                  <th>Soort</th>
                  <th>Afdeling</th>
                  <th>Adres</th>
                  <th>Contactpersoon</th>
                  <th>Datum Binnengekomen</th>
                  <th>Status</th>
                  <th>Acties</th>
                </tr>
              </thead>
              <tbody>
                {displayData.map((storing) => (
                  <tr key={storing.id}>
                    <td>
                      <div className="storing-nummer">
                        {getStoringIcon(storing.soort_storing)}
                        {storing.storingnummer}
                      </div>
                    </td>
                    <td>{storing.soort_storing}</td>
                    <td>{storing.betrokken_afdeling}</td>
                    <td className="adres-cell">{storing.adres}</td>
                    <td>{storing.naam_contactpersoon}</td>
                    <td>{new Date(storing.datum_storing_binnengekomen).toLocaleDateString('nl-NL')}</td>
                    <td>{getStatusBadge(storing)}</td>
                    <td>
                      <div className="action-buttons">
                        <Link
                          to={`/storingen/${storing.id}`}
                          className="btn btn-sm btn-secondary"
                          title="Bekijk details"
                        >
                          <Eye className="btn-icon" />
                        </Link>
                        {isSuperUserOrAdmin() && (
                        <button
                          onClick={() => handleDelete(storing.id)}
                          className="btn btn-sm btn-danger"
                          title="Verwijderen"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="btn-icon" />
                        </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
