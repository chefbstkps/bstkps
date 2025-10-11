import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLanguage } from '../contexts/LanguageContext'
import { InventoryService } from '../services/inventoryService'
import { AccessoryService } from '../services/accessoryService'
import { OrganizationService } from '../services/organizationService'
import { RadioService } from '../services/radioService'
import { 
  Inventory, 
  PurchaseFormData, 
  InventoryIssueFormData,
  Accessory
} from '../types'
import { 
  Plus, 
  Minus, 
  Search, 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  ShoppingCart,
  X
} from 'lucide-react'
import './Inventory.css'

export default function InventoryPage() {
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  
  // State
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrganization, setSelectedOrganization] = useState<string>('all')
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [showIssueModal, setShowIssueModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  
  // Purchase form state
  const [purchaseForm, setPurchaseForm] = useState<Partial<PurchaseFormData>>({
    organization_id: '',
    accessory_id: '',
    quantity: 1,
    transaction_date: new Date().toISOString().split('T')[0],
    unit_price: 0,
    total_price: 0,
    supplier: '',
    invoice_number: '',
    notes: ''
  })

  // Issue form state
  const [issueForm, setIssueForm] = useState<Partial<InventoryIssueFormData>>({
    organization_id: '',
    accessory_id: '',
    quantity: 1,
    transaction_date: new Date().toISOString().split('T')[0],
    issued_to_type: 'radio',
    issued_to_id: '',
    issue_reason: '',
    notes: ''
  })

  // Queries
  const { data: inventory, isLoading: inventoryLoading } = useQuery({
    queryKey: ['inventory', selectedOrganization],
    queryFn: () => selectedOrganization === 'all' 
      ? InventoryService.getAllInventory()
      : InventoryService.getInventoryByOrganization(selectedOrganization),
  })

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['inventory-transactions', selectedOrganization],
    queryFn: () => selectedOrganization === 'all'
      ? InventoryService.getAllTransactions()
      : InventoryService.getTransactionsByOrganization(selectedOrganization),
  })

  const { data: stats } = useQuery({
    queryKey: ['inventory-stats', selectedOrganization],
    queryFn: () => selectedOrganization !== 'all'
      ? InventoryService.getInventoryStats(selectedOrganization)
      : Promise.resolve({
          total_value: 0,
          unique_products: inventory?.length || 0,
          low_stock_count: inventory?.filter(i => i.current_stock <= i.low_stock_threshold).length || 0,
          recent_transactions_count: 0,
          total_items: inventory?.reduce((sum, i) => sum + i.current_stock, 0) || 0
        }),
    enabled: !!inventory,
  })

  const { data: accessories } = useQuery({
    queryKey: ['accessories'],
    queryFn: () => AccessoryService.getAll(),
  })

  const { data: organizations } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => OrganizationService.getAllGroepen(),
  })

  const { data: radios } = useQuery({
    queryKey: ['radios'],
    queryFn: () => RadioService.getAll(),
  })

  // Mutations
  const purchaseMutation = useMutation({
    mutationFn: (data: PurchaseFormData) => InventoryService.addPurchase(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] })
      setShowPurchaseModal(false)
      resetPurchaseForm()
    },
  })

  const issueMutation = useMutation({
    mutationFn: (data: InventoryIssueFormData) => InventoryService.addIssue(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] })
      setShowIssueModal(false)
      resetIssueForm()
    },
  })

  const deleteTransactionMutation = useMutation({
    mutationFn: (id: string) => InventoryService.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] })
      setDeleteConfirm(null)
    },
  })

  // Helper functions
  const resetPurchaseForm = () => {
    setPurchaseForm({
      organization_id: '',
      accessory_id: '',
      quantity: 1,
      transaction_date: new Date().toISOString().split('T')[0],
      unit_price: 0,
      total_price: 0,
      supplier: '',
      invoice_number: '',
      notes: ''
    })
  }

  const resetIssueForm = () => {
    setIssueForm({
      organization_id: '',
      accessory_id: '',
      quantity: 1,
      transaction_date: new Date().toISOString().split('T')[0],
      issued_to_type: 'radio',
      issued_to_id: '',
      issue_reason: '',
      notes: ''
    })
  }

  const handlePurchaseSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (purchaseForm.organization_id && purchaseForm.accessory_id) {
      purchaseMutation.mutate(purchaseForm as PurchaseFormData)
    }
  }

  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (issueForm.organization_id && issueForm.accessory_id) {
      issueMutation.mutate(issueForm as InventoryIssueFormData)
    }
  }

  // Update total price when quantity or unit price changes
  useEffect(() => {
    if (purchaseForm.quantity && purchaseForm.unit_price) {
      setPurchaseForm(prev => ({
        ...prev,
        total_price: prev.quantity! * prev.unit_price!
      }))
    }
  }, [purchaseForm.quantity, purchaseForm.unit_price])

  // Filtering
  const filteredInventory = inventory?.filter(item => {
    const accessory = item.accessory as Accessory
    if (!accessory) return false

    const matchesSearch = 
      accessory.merk.toLowerCase().includes(searchTerm.toLowerCase()) ||
      accessory.model.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesLowStock = !showLowStockOnly || item.current_stock <= item.low_stock_threshold

    return matchesSearch && matchesLowStock
  }) || []

  const getStockStatus = (item: Inventory) => {
    if (item.current_stock === 0) return 'out'
    if (item.current_stock <= item.low_stock_threshold) return 'low'
    return 'good'
  }

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'out': return 'var(--color-danger)'
      case 'low': return 'var(--color-warning)'
      case 'good': return 'var(--color-success)'
      default: return 'var(--color-text)'
    }
  }

  const getStockStatusText = (status: string) => {
    switch (status) {
      case 'out': return 'Niet op voorraad'
      case 'low': return 'Lage voorraad'
      case 'good': return 'Op voorraad'
      default: return ''
    }
  }

  if (inventoryLoading || transactionsLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>{t('common.loading')}</p>
      </div>
    )
  }

  return (
    <div className="page inventory-page">
      <div className="page__header">
        <h1 className="page__title">Inventory Management</h1>
        <p className="page__subtitle">
          Beheer voorraden en transacties van accessoires
        </p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid stats-grid--4">
        <div className="stat-card">
          <div className="stat-card__icon" style={{ color: 'var(--color-primary)' }}>
            <Package size={32} />
          </div>
          <div className="stat-card__value">{stats?.total_items || 0}</div>
          <div className="stat-card__label">Totaal Items</div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon" style={{ color: 'var(--color-secondary)' }}>
            <ShoppingCart size={32} />
          </div>
          <div className="stat-card__value">{stats?.unique_products || 0}</div>
          <div className="stat-card__label">Unieke Producten</div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon" style={{ color: 'var(--color-warning)' }}>
            <AlertTriangle size={32} />
          </div>
          <div className="stat-card__value">{stats?.low_stock_count || 0}</div>
          <div className="stat-card__label">Lage Voorraad</div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon" style={{ color: 'var(--color-success)' }}>
            <TrendingUp size={32} />
          </div>
          <div className="stat-card__value">
            €{stats?.total_value.toFixed(2) || '0.00'}
          </div>
          <div className="stat-card__label">Totale Waarde</div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="inventory-controls">
        <div className="controls-left">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Zoek producten..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={selectedOrganization}
            onChange={(e) => setSelectedOrganization(e.target.value)}
            className="select"
          >
            <option value="all">Alle Organisaties</option>
            {organizations?.map(org => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </select>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showLowStockOnly}
              onChange={(e) => setShowLowStockOnly(e.target.checked)}
            />
            Alleen lage voorraad
          </label>
        </div>

        <div className="controls-right">
          <button
            onClick={() => setShowPurchaseModal(true)}
            className="btn btn--success"
          >
            <Plus size={20} />
            Aankoop Registreren
          </button>
          <button
            onClick={() => setShowIssueModal(true)}
            className="btn btn--primary"
          >
            <Minus size={20} />
            Afgifte Registreren
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="card">
        <div className="card__header">
          <h2 className="card__title">Voorraad Overzicht</h2>
        </div>
        <div className="card__body">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Merk</th>
                  <th>Model</th>
                  <th>Omschrijving</th>
                  <th>Voorraad</th>
                  <th>Status</th>
                  <th>Drempelwaarde</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center">
                      Geen voorraad gevonden
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map(item => {
                    const accessory = item.accessory as Accessory
                    const status = getStockStatus(item)
                    return (
                      <tr key={item.id}>
                        <td>{accessory?.merk || '-'}</td>
                        <td>{accessory?.model || '-'}</td>
                        <td>{accessory?.omschrijving || '-'}</td>
                        <td className="text-bold">{item.current_stock}</td>
                        <td>
                          <span 
                            className="badge"
                            style={{ backgroundColor: getStockStatusColor(status) }}
                          >
                            {getStockStatusText(status)}
                          </span>
                        </td>
                        <td>{item.low_stock_threshold}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card">
        <div className="card__header">
          <h2 className="card__title">Transactie Geschiedenis</h2>
        </div>
        <div className="card__body">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Type</th>
                  <th>Product</th>
                  <th>Aantal</th>
                  <th>Details</th>
                  <th>Prijs</th>
                  <th>Opmerking</th>
                  <th>Acties</th>
                </tr>
              </thead>
              <tbody>
                {!transactions || transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center">
                      Geen transacties gevonden
                    </td>
                  </tr>
                ) : (
                  transactions.map(transaction => {
                    const accessory = transaction.accessory as Accessory
                    return (
                      <tr key={transaction.id}>
                        <td>{new Date(transaction.transaction_date).toLocaleDateString('nl-NL')}</td>
                        <td>
                          <span 
                            className="badge"
                            style={{ 
                              backgroundColor: transaction.transaction_type === 'purchase' 
                                ? 'var(--color-success)' 
                                : 'var(--color-primary)' 
                            }}
                          >
                            {transaction.transaction_type === 'purchase' ? 'Aankoop' : 'Afgifte'}
                          </span>
                        </td>
                        <td>
                          {accessory ? (
                            <>
                              {accessory.merk} {accessory.model}
                              {accessory.omschrijving && (
                                <span className="text-muted" style={{ display: 'block', fontSize: '0.85rem' }}>
                                  {accessory.omschrijving}
                                </span>
                              )}
                            </>
                          ) : '-'}
                        </td>
                        <td className="text-bold">
                          {transaction.transaction_type === 'purchase' ? '+' : '-'}
                          {transaction.quantity}
                        </td>
                        <td>
                          {transaction.transaction_type === 'purchase' 
                            ? transaction.supplier 
                            : transaction.issue_reason}
                        </td>
                        <td>
                          {transaction.total_price 
                            ? `€${transaction.total_price.toFixed(2)}` 
                            : '-'}
                        </td>
                        <td>{transaction.notes || '-'}</td>
                        <td>
                          <button
                            onClick={() => setDeleteConfirm(transaction.id)}
                            className="btn btn--sm btn--danger"
                            title="Verwijderen"
                          >
                            <X size={16} />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="modal-overlay" onClick={() => setShowPurchaseModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Aankoop Registreren</h2>
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="modal__close"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handlePurchaseSubmit}>
              <div className="modal__body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Organisatie *</label>
                    <select
                      value={purchaseForm.organization_id}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, organization_id: e.target.value })}
                      required
                    >
                      <option value="">Selecteer organisatie</option>
                      {organizations?.map(org => (
                        <option key={org.id} value={org.id}>{org.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Product *</label>
                    <select
                      value={purchaseForm.accessory_id}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, accessory_id: e.target.value })}
                      required
                    >
                      <option value="">Selecteer product</option>
                      {accessories?.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.merk} - {acc.model}{acc.omschrijving ? ` (${acc.omschrijving})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Aantal *</label>
                    <input
                      type="number"
                      min="1"
                      value={purchaseForm.quantity}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, quantity: parseInt(e.target.value) })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Datum *</label>
                    <input
                      type="date"
                      value={purchaseForm.transaction_date}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, transaction_date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Prijs per stuk *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={purchaseForm.unit_price}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, unit_price: parseFloat(e.target.value) })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Totaalprijs</label>
                    <input
                      type="number"
                      step="0.01"
                      value={purchaseForm.total_price}
                      readOnly
                      className="readonly"
                    />
                  </div>

                  <div className="form-group">
                    <label>Leverancier *</label>
                    <input
                      type="text"
                      value={purchaseForm.supplier}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, supplier: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Factuurnummer *</label>
                    <input
                      type="text"
                      value={purchaseForm.invoice_number}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, invoice_number: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group form-group--full">
                    <label>Opmerking</label>
                    <textarea
                      value={purchaseForm.notes}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, notes: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
              </div>
              <div className="modal__footer">
                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(false)}
                  className="btn btn--secondary"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="btn btn--success"
                  disabled={purchaseMutation.isPending}
                >
                  {purchaseMutation.isPending ? 'Bezig...' : 'Opslaan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Modal */}
      {showIssueModal && (
        <div className="modal-overlay" onClick={() => setShowIssueModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Afgifte Registreren</h2>
              <button
                onClick={() => setShowIssueModal(false)}
                className="modal__close"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleIssueSubmit}>
              <div className="modal__body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Organisatie *</label>
                    <select
                      value={issueForm.organization_id}
                      onChange={(e) => setIssueForm({ ...issueForm, organization_id: e.target.value })}
                      required
                    >
                      <option value="">Selecteer organisatie</option>
                      {organizations?.map(org => (
                        <option key={org.id} value={org.id}>{org.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Product *</label>
                    <select
                      value={issueForm.accessory_id}
                      onChange={(e) => setIssueForm({ ...issueForm, accessory_id: e.target.value })}
                      required
                    >
                      <option value="">Selecteer product</option>
                      {accessories?.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.merk} - {acc.model}{acc.omschrijving ? ` (${acc.omschrijving})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Aantal *</label>
                    <input
                      type="number"
                      min="1"
                      value={issueForm.quantity}
                      onChange={(e) => setIssueForm({ ...issueForm, quantity: parseInt(e.target.value) })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Datum *</label>
                    <input
                      type="date"
                      value={issueForm.transaction_date}
                      onChange={(e) => setIssueForm({ ...issueForm, transaction_date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Afgegeven aan *</label>
                    <select
                      value={issueForm.issued_to_type}
                      onChange={(e) => setIssueForm({ ...issueForm, issued_to_type: e.target.value as any })}
                      required
                    >
                      <option value="radio">Radio</option>
                      <option value="installation">Installatie</option>
                      <option value="employee">Medewerker</option>
                    </select>
                  </div>

                  {issueForm.issued_to_type === 'radio' && (
                    <div className="form-group">
                      <label>Radio *</label>
                      <select
                        value={issueForm.issued_to_id}
                        onChange={(e) => setIssueForm({ ...issueForm, issued_to_id: e.target.value })}
                        required
                      >
                        <option value="">Selecteer radio</option>
                        {radios?.map(radio => (
                          <option key={radio.id} value={radio.id}>
                            {radio.merk} {radio.model} - {radio.serienummer}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {issueForm.issued_to_type !== 'radio' && (
                    <div className="form-group">
                      <label>ID/Naam *</label>
                      <input
                        type="text"
                        value={issueForm.issued_to_id}
                        onChange={(e) => setIssueForm({ ...issueForm, issued_to_id: e.target.value })}
                        placeholder="Voer ID of naam in"
                        required
                      />
                    </div>
                  )}

                  <div className="form-group form-group--full">
                    <label>Reden van afgifte *</label>
                    <input
                      type="text"
                      value={issueForm.issue_reason}
                      onChange={(e) => setIssueForm({ ...issueForm, issue_reason: e.target.value })}
                      placeholder="Bijv. Batterij vervanging, nieuwe uitgifte, etc."
                      required
                    />
                  </div>

                  <div className="form-group form-group--full">
                    <label>Opmerking</label>
                    <textarea
                      value={issueForm.notes}
                      onChange={(e) => setIssueForm({ ...issueForm, notes: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
              </div>
              <div className="modal__footer">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="btn btn--secondary"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={issueMutation.isPending}
                >
                  {issueMutation.isPending ? 'Bezig...' : 'Opslaan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal modal--small" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Bevestig Verwijderen</h2>
            </div>
            <div className="modal__body">
              <p>Weet u zeker dat u deze transactie permanent wilt verwijderen?</p>
              <p className="text-muted">Let op: Dit zal de voorraad niet automatisch aanpassen.</p>
            </div>
            <div className="modal__footer">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="btn btn--secondary"
              >
                Annuleren
              </button>
              <button
                onClick={() => deleteTransactionMutation.mutate(deleteConfirm)}
                className="btn btn--danger"
                disabled={deleteTransactionMutation.isPending}
              >
                {deleteTransactionMutation.isPending ? 'Bezig...' : 'Verwijderen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

