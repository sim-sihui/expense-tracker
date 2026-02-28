import { useState } from 'react'
import { formatMoney } from '../utils/formatMoney'
import './Assets.css'

const TYPE_CONFIG = {
  debit: { label: 'Debit & Savings', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', icon: '🏦' },
  credit: { label: 'Credit Cards', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: '💳' },
  investment: { label: 'Investments', color: '#22c55e', bg: 'rgba(34,197,94,0.12)', icon: '📈' },
}

const CARD_COLORS = [
  '#6366f1', '#3b82f6', '#22c55e', '#f97316',
  '#a855f7', '#ec4899', '#eab308', '#14b8a6',
  '#ef4444', '#84cc16', '#0ea5e9', '#f43f5e'
]

const emptyCard = {
  name: '', type: 'debit', balance: '',
  bank: '', lastFour: '', color: '#6366f1', note: ''
}

const EyeOpen = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const EyeOff = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

const Assets = ({ cards = [], onAddCard, onUpdateCard, onDeleteCard }) => {
  const [privacyMode, setPrivacyMode] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingCard, setEditingCard] = useState(null)
  const [formData, setFormData] = useState(emptyCard)

  const set = (field, val) => setFormData(prev => ({ ...prev, [field]: val }))

  // ── Net worth ──
  const totalAssets = cards
    .filter(c => c.type !== 'credit')
    .reduce((s, c) => s + (parseFloat(c.balance) || 0), 0)

  const totalLiabilities = cards
    .filter(c => c.type === 'credit')
    .reduce((s, c) => s + (parseFloat(c.balance) || 0), 0)

  const netWorth = totalAssets - totalLiabilities

  const mask = (val) => privacyMode ? '••••••' : `$${formatMoney(val)}`

  // ── Handlers ──
  const openAdd = () => { setEditingCard(null); setFormData(emptyCard); setShowForm(true) }
  const openEdit = (card) => {
    setEditingCard(card)
    setFormData({
      name: card.name, type: card.type, balance: String(card.balance),
      bank: card.bank || '', lastFour: card.lastFour || '',
      color: card.color || '#6366f1', note: card.note || ''
    })
    setShowForm(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name || formData.balance === '') return
    const payload = { ...formData, balance: parseFloat(formData.balance) || 0 }
    if (editingCard) {
      onUpdateCard(editingCard.id, payload)
    } else {
      onAddCard(payload)
    }
    setShowForm(false); setEditingCard(null)
  }

  // ── Section renderer ──
  const renderSection = (type) => {
    const config = TYPE_CONFIG[type]
    const sectionCards = cards.filter(c => c.type === type)
    const sectionTotal = sectionCards.reduce((s, c) => s + (parseFloat(c.balance) || 0), 0)
    const isCredit = type === 'credit'

    if (sectionCards.length === 0 && type !== 'debit') return null

    return (
      <div className="assets-section" key={type}>
        <div className="assets-section-header">
          <div className="assets-section-left">
            <span className="assets-section-icon" style={{ background: config.bg, color: config.color }}>
              {config.icon}
            </span>
            <span className="assets-section-label">{config.label}</span>
          </div>
          <div className="assets-section-total" style={{ color: isCredit ? '#ef4444' : 'var(--color-text-secondary)' }}>
            {isCredit ? 'Owed ' : ''}{mask(sectionTotal)}
          </div>
        </div>

        {sectionCards.length === 0 && (
          <div className="assets-empty-section">
            No {config.label.toLowerCase()} added. Tap "+" to add one.
          </div>
        )}

        {sectionCards.map(card => {
          const cardColor = card.color || config.color
          return (
            <div key={card.id} className="assets-card-row" onClick={() => openEdit(card)}>
              <div className="assets-card-badge" style={{ background: `${cardColor}1a`, color: cardColor }}>
                {card.name.charAt(0).toUpperCase()}
              </div>
              <div className="assets-card-info">
                <div className="assets-card-name">
                  {card.name}
                  {card.lastFour && <span className="assets-card-last4">···· {card.lastFour}</span>}
                </div>
                {(card.bank || card.note) && (
                  <div className="assets-card-sub">{card.bank || card.note}</div>
                )}
              </div>
              <div className="assets-card-balance" style={{ color: isCredit ? '#ef4444' : 'var(--color-text)' }}>
                {isCredit ? '−' : ''}{privacyMode ? '••••••' : `$${formatMoney(card.balance)}`}
              </div>
              <div className="assets-card-chevron">›</div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="assets-page">
      {/* Header */}
      <div className="assets-header">
        <h1>Assets</h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            className={`privacy-toggle ${privacyMode ? 'active' : ''}`}
            onClick={() => setPrivacyMode(p => !p)}
            title={privacyMode ? 'Show values' : 'Hide values'}
          >
            {privacyMode ? <EyeOff /> : <EyeOpen />}
            {privacyMode ? 'Show' : 'Hide'}
          </button>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Account</button>
        </div>
      </div>

      {/* Net Worth Hero */}
      <div className="assets-networth-hero">
        <div className="assets-nw-top">
          <span className="assets-nw-label">Net Worth</span>
          <button
            className="assets-nw-eye"
            onClick={() => setPrivacyMode(p => !p)}
            title={privacyMode ? 'Show' : 'Hide'}
          >
            {privacyMode ? <EyeOff /> : <EyeOpen />}
          </button>
        </div>
        <div className="assets-nw-value">
          {privacyMode ? '••••••••' : `$${formatMoney(netWorth)}`}
        </div>
        <div className="assets-nw-split">
          <div className="assets-nw-item">
            <span className="assets-nw-item-label">Assets</span>
            <span className="assets-nw-item-value">{mask(totalAssets)}</span>
          </div>
          <div className="assets-nw-divider" />
          <div className="assets-nw-item">
            <span className="assets-nw-item-label">Liabilities</span>
            <span className="assets-nw-item-value" style={{ color: 'rgba(255,255,255,0.7)' }}>{mask(totalLiabilities)}</span>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {cards.length === 0 && (
        <div className="assets-empty-page">
          <div className="assets-empty-icon">💳</div>
          <h3>No accounts yet</h3>
          <p>Add your bank accounts, credit cards, and investments to track your net worth in one place.</p>
          <button className="btn btn-primary" onClick={openAdd}>+ Add First Account</button>
        </div>
      )}

      {/* Sections */}
      {cards.length > 0 && (
        <div className="assets-sections">
          {renderSection('debit')}
          {renderSection('credit')}
          {renderSection('investment')}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content modal-narrow" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCard ? 'Edit Account' : 'Add Account'}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Type */}
              <div className="form-group">
                <label>Account Type</label>
                <div className="assets-type-toggle">
                  {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                    <button
                      key={key}
                      type="button"
                      className={`assets-type-btn ${formData.type === key ? 'active' : ''}`}
                      style={formData.type === key ? { background: cfg.color, borderColor: cfg.color } : {}}
                      onClick={() => set('type', key)}
                    >
                      {cfg.icon} {key === 'debit' ? 'Debit/Savings' : key === 'credit' ? 'Credit' : 'Investment'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-row" style={{ marginTop: '1rem' }}>
                <div className="form-group">
                  <label>Account Name</label>
                  <input
                    type="text" placeholder="e.g. UOB One, OCBC 365"
                    value={formData.name}
                    onChange={e => set('name', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Bank <span className="label-optional">(optional)</span></label>
                  <input
                    type="text" placeholder="e.g. UOB, DBS"
                    value={formData.bank}
                    onChange={e => set('bank', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row" style={{ marginTop: '1rem' }}>
                <div className="form-group">
                  <label>{formData.type === 'credit' ? 'Amount Owed ($)' : 'Balance ($)'}</label>
                  <input
                    type="number" min="0" step="0.01" placeholder="0.00"
                    value={formData.balance}
                    onChange={e => set('balance', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last 4 Digits <span className="label-optional">(optional)</span></label>
                  <input
                    type="text" maxLength="4" placeholder="1234"
                    value={formData.lastFour}
                    onChange={e => set('lastFour', e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>Note <span className="label-optional">(optional)</span></label>
                <input
                  type="text" placeholder="e.g. Primary savings card"
                  value={formData.note}
                  onChange={e => set('note', e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>Colour</label>
                <div className="color-picker-row">
                  {CARD_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      className={`color-swatch ${formData.color === c ? 'selected' : ''}`}
                      style={{ background: c }}
                      onClick={() => set('color', c)}
                    />
                  ))}
                </div>
              </div>

              <div className="form-actions" style={{ marginTop: '1.5rem' }}>
                {editingCard && (
                  <button
                    type="button"
                    className="btn-delete"
                    onClick={() => { onDeleteCard(editingCard.id); setShowForm(false) }}
                  >
                    Delete
                  </button>
                )}
                <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editingCard ? 'Save Changes' : 'Add Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Assets
