import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Edit, Plus, Trash2, CheckCircle, Clock, AlertTriangle, Radio, Phone, Siren } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { storingService } from '../services/storingService'
import { StoringFeedbackFormData } from '../types'
import './FaultDetails.css'

export default function FaultDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  useLanguage()
  const { isSuperUserOrAdmin } = useAuth()
  const queryClient = useQueryClient()
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [editingFeedback, setEditingFeedback] = useState<string | null>(null)

  // Feedback form state
  const [feedbackData, setFeedbackData] = useState<StoringFeedbackFormData>({
    is_afgehandeld: false,
    datum_afgehandeld: '',
    afgehandeld_door: '',
    hoe_afgehandeld: '',
    gebruikte_materialen: '',
    opmerkingen: ''
  })

  // Queries
  const { data: storing, isLoading, error } = useQuery({
    queryKey: ['storing', id],
    queryFn: () => storingService.getStoringById(id!),
    enabled: !!id
  })

  // Mutations
  const addFeedbackMutation = useMutation({
    mutationFn: ({ storingId, feedbackData }: { storingId: string; feedbackData: StoringFeedbackFormData }) =>
      storingService.addFeedback(storingId, feedbackData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storing', id] })
      setShowFeedbackForm(false)
      resetFeedbackForm()
    }
  })

  const updateFeedbackMutation = useMutation({
    mutationFn: ({ feedbackId, feedbackData }: { feedbackId: string; feedbackData: Partial<StoringFeedbackFormData> }) =>
      storingService.updateFeedback(feedbackId, feedbackData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storing', id] })
      setEditingFeedback(null)
    }
  })

  const deleteFeedbackMutation = useMutation({
    mutationFn: storingService.deleteFeedback,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storing', id] })
    }
  })

  const resetFeedbackForm = () => {
    setFeedbackData({
      is_afgehandeld: false,
      datum_afgehandeld: '',
      afgehandeld_door: '',
      hoe_afgehandeld: '',
      gebruikte_materialen: '',
      opmerkingen: ''
    })
  }

  const handleFeedbackInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFeedbackData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingFeedback) {
      updateFeedbackMutation.mutate({ feedbackId: editingFeedback, feedbackData })
    } else {
      addFeedbackMutation.mutate({ storingId: id!, feedbackData })
    }
  }

  const handleEditFeedback = (feedback: any) => {
    setFeedbackData({
      is_afgehandeld: feedback.is_afgehandeld,
      datum_afgehandeld: feedback.datum_afgehandeld || '',
      afgehandeld_door: feedback.afgehandeld_door || '',
      hoe_afgehandeld: feedback.hoe_afgehandeld || '',
      gebruikte_materialen: feedback.gebruikte_materialen || '',
      opmerkingen: feedback.opmerkingen || ''
    })
    setEditingFeedback(feedback.id)
    setShowFeedbackForm(true)
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

  const getStatusIcon = (isAfgehandeld: boolean) => {
    return isAfgehandeld ? (
      <CheckCircle className="status-icon status-afgehandeld" />
    ) : (
      <Clock className="status-icon status-open" />
    )
  }

  if (isLoading) return <div className="loading">Laden...</div>
  if (error || !storing) return <div className="error">Storing niet gevonden</div>

  return (
    <div className="fault-details-page">
      <div className="page-header">
        <button onClick={() => navigate('/storingen')} className="btn btn-secondary">
          <ArrowLeft className="btn-icon" />
          Terug naar Storingen
        </button>
        <h1>Storing Details</h1>
      </div>

      <div className="details-container">
        {/* Storing Information */}
        <div className="details-section">
          <div className="section-header">
            <h2>
              {getStoringIcon(storing.soort_storing)}
              Storing #{storing.storingnummer}
            </h2>
            <span className="storing-type">{storing.soort_storing}</span>
          </div>

          <div className="details-grid">
            <div className="detail-group">
              <label>Storingnummer</label>
              <span className="detail-value">{storing.storingnummer}</span>
            </div>

            <div className="detail-group">
              <label>Soort Storing</label>
              <span className="detail-value">{storing.soort_storing}</span>
            </div>

            {storing.telefonie_type && (
              <div className="detail-group">
                <label>Type Aansluiting</label>
                <span className="detail-value">{storing.telefonie_type}</span>
              </div>
            )}

            {storing.waarschuwingsapparatuur_type && (
              <div className="detail-group">
                <label>Type Waarschuwingsapparatuur</label>
                <span className="detail-value">{storing.waarschuwingsapparatuur_type}</span>
              </div>
            )}

            <div className="detail-group">
              <label>Betrokken Afdeling</label>
              <span className="detail-value">{storing.betrokken_afdeling}</span>
            </div>

            <div className="detail-group">
              <label>Adres</label>
              <span className="detail-value">{storing.adres}</span>
            </div>

            <div className="detail-group">
              <label>Locatie</label>
              <span className="detail-value">{storing.locatie}</span>
            </div>

            <div className="detail-group">
              <label>Aard van de Storing</label>
              <span className="detail-value">{storing.aard_storing}</span>
            </div>

            <div className="detail-group">
              <label>Naam Contactpersoon</label>
              <span className="detail-value">{storing.naam_contactpersoon}</span>
            </div>

            <div className="detail-group">
              <label>Telefoonnummer Contactpersoon</label>
              <span className="detail-value">{storing.telefoonnummer_contactpersoon}</span>
            </div>

            {storing.aansluitnummer && (
              <div className="detail-group">
                <label>Aansluitnummer</label>
                <span className="detail-value">{storing.aansluitnummer}</span>
              </div>
            )}

            {storing.telefoonnummer_storing && (
              <div className="detail-group">
                <label>Telefoonnummer waar storing op is</label>
                <span className="detail-value">{storing.telefoonnummer_storing}</span>
              </div>
            )}

            <div className="detail-group">
              <label>Datum Storing Binnengekomen</label>
              <span className="detail-value">
                {new Date(storing.datum_storing_binnengekomen).toLocaleDateString('nl-NL')}
              </span>
            </div>

            <div className="detail-group">
              <label>Datum Storing Begonnen</label>
              <span className="detail-value">
                {new Date(storing.datum_storing_begonnen).toLocaleDateString('nl-NL')}
              </span>
            </div>

            <div className="detail-group">
              <label>Handeling</label>
              <span className="detail-value">{storing.handeling}</span>
            </div>

            {storing.telesur_ticketnummer && (
              <div className="detail-group">
                <label>Telesur Ticketnummer</label>
                <span className="detail-value">{storing.telesur_ticketnummer}</span>
              </div>
            )}

            {storing.datum_verwezen && (
              <div className="detail-group">
                <label>Datum Verwezen</label>
                <span className="detail-value">
                  {new Date(storing.datum_verwezen).toLocaleDateString('nl-NL')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Feedback Section */}
        <div className="details-section">
          <div className="section-header">
            <h2>Feedback & Afhandeling</h2>
            {isSuperUserOrAdmin() && (
            <button
              onClick={() => {
                resetFeedbackForm()
                setEditingFeedback(null)
                setShowFeedbackForm(true)
              }}
              className="btn btn-primary"
            >
              <Plus className="btn-icon" />
              Feedback Toevoegen
            </button>
            )}
          </div>

          {/* Feedback Form */}
          {showFeedbackForm && (
            <div className="feedback-form-container">
              <h3>{editingFeedback ? 'Feedback Bewerken' : 'Nieuwe Feedback'}</h3>
              <form onSubmit={handleFeedbackSubmit} className="feedback-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        name="is_afgehandeld"
                        checked={feedbackData.is_afgehandeld}
                        onChange={handleFeedbackInputChange}
                      />
                      Storing is afgehandeld
                    </label>
                  </div>
                </div>

                {feedbackData.is_afgehandeld && (
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="datum_afgehandeld">Datum Afgehandeld</label>
                      <input
                        type="date"
                        id="datum_afgehandeld"
                        name="datum_afgehandeld"
                        value={feedbackData.datum_afgehandeld}
                        onChange={handleFeedbackInputChange}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="afgehandeld_door">Afgehandeld door</label>
                      <input
                        type="text"
                        id="afgehandeld_door"
                        name="afgehandeld_door"
                        value={feedbackData.afgehandeld_door}
                        onChange={handleFeedbackInputChange}
                        className="form-input"
                      />
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="hoe_afgehandeld">Hoe afgehandeld</label>
                  <textarea
                    id="hoe_afgehandeld"
                    name="hoe_afgehandeld"
                    value={feedbackData.hoe_afgehandeld}
                    onChange={handleFeedbackInputChange}
                    className="form-textarea"
                    rows={3}
                    placeholder="Beschrijf hoe de storing is afgehandeld..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="gebruikte_materialen">Gebruikte Materialen</label>
                  <textarea
                    id="gebruikte_materialen"
                    name="gebruikte_materialen"
                    value={feedbackData.gebruikte_materialen}
                    onChange={handleFeedbackInputChange}
                    className="form-textarea"
                    rows={2}
                    placeholder="Lijst van gebruikte materialen..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="opmerkingen">Opmerkingen</label>
                  <textarea
                    id="opmerkingen"
                    name="opmerkingen"
                    value={feedbackData.opmerkingen}
                    onChange={handleFeedbackInputChange}
                    className="form-textarea"
                    rows={2}
                    placeholder="Extra opmerkingen..."
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setShowFeedbackForm(false)
                      setEditingFeedback(null)
                      resetFeedbackForm()
                    }}
                    className="btn btn-secondary"
                  >
                    Annuleren
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={addFeedbackMutation.isPending || updateFeedbackMutation.isPending}
                  >
                    {addFeedbackMutation.isPending || updateFeedbackMutation.isPending
                      ? 'Opslaan...'
                      : editingFeedback
                      ? 'Feedback Bijwerken'
                      : 'Feedback Toevoegen'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Feedback List */}
          <div className="feedback-list">
            {storing.feedback && storing.feedback.length > 0 ? (
              storing.feedback.map((feedback, index) => (
                <div key={feedback.id} className="feedback-item">
                  <div className="feedback-header">
                    <div className="feedback-status">
                      {getStatusIcon(feedback.is_afgehandeld)}
                      <span className="feedback-title">
                        Feedback #{index + 1}
                        {feedback.is_afgehandeld && ' - Afgehandeld'}
                      </span>
                    </div>
                    {isSuperUserOrAdmin() && (
                    <div className="feedback-actions">
                      <button
                        onClick={() => handleEditFeedback(feedback)}
                        className="btn btn-sm btn-secondary"
                        title="Bewerken"
                      >
                        <Edit className="btn-icon" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Weet je zeker dat je deze feedback wilt verwijderen?')) {
                            deleteFeedbackMutation.mutate(feedback.id)
                          }
                        }}
                        className="btn btn-sm btn-danger"
                        title="Verwijderen"
                      >
                        <Trash2 className="btn-icon" />
                      </button>
                    </div>
                    )}
                  </div>

                  <div className="feedback-content">
                    {feedback.datum_afgehandeld && (
                      <div className="feedback-detail">
                        <strong>Datum afgehandeld:</strong> {new Date(feedback.datum_afgehandeld).toLocaleDateString('nl-NL')}
                      </div>
                    )}
                    {feedback.afgehandeld_door && (
                      <div className="feedback-detail">
                        <strong>Afgehandeld door:</strong> {feedback.afgehandeld_door}
                      </div>
                    )}
                    {feedback.hoe_afgehandeld && (
                      <div className="feedback-detail">
                        <strong>Hoe afgehandeld:</strong> {feedback.hoe_afgehandeld}
                      </div>
                    )}
                    {feedback.gebruikte_materialen && (
                      <div className="feedback-detail">
                        <strong>Gebruikte materialen:</strong> {feedback.gebruikte_materialen}
                      </div>
                    )}
                    {feedback.opmerkingen && (
                      <div className="feedback-detail">
                        <strong>Opmerkingen:</strong> {feedback.opmerkingen}
                      </div>
                    )}
                    <div className="feedback-detail">
                      <strong>Toegevoegd op:</strong> {new Date(feedback.created_at).toLocaleString('nl-NL')}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-feedback">
                <p>Nog geen feedback toegevoegd voor deze storing.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
