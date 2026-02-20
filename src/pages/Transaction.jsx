import { useState } from 'react'
import { formatMoney } from '../utils/formatMoney'
import Calculator from './Calculator'
import SalaryBreakdown from './Salarybreakdown'

const PRESET_CATEGORIES = [
  'Food & Dining', 'Transportation', 'Shopping', 'Entertainment',
  'Bills & Utilities', 'Healthcare', 'Travel', 'Education', 'Salary',
  'Freelance', 'Investment', 'Other'
]

const ACCOUNTS = [
  'Cash', 'UOB One', 'OCBC 365', 'DBS Multiplier', 'Citibank',
  'Standard Chartered', 'HSBC', 'Maybank', 'Other'
]

const PAYMENT_TYPES = [
  'Cash', 'Credit Card', 'Debit Card', 'PayLah!', 'PayNow',
  'GrabPay', 'Apple Pay', 'Google Pay', 'Bank Transfer', 'Other'
]

const CASHBACK_BNPL = [
  'None', 'Cashback', 'Miles/Points', 'Atome', 'Hoolah', 'Rely',
  'Grab PayLater', 'ShopBack PayLater', 'Other'
]

const emptyForm = {
  type: 'expense',
  amount: '',
  category: '',
  customCategory: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
  event: '',
  account: '',
  customAccount: '',
  paymentType: '',
  needWant: 'need',
  cashbackBnpl: 'None',
}

// Returns "Jan 2026" style key from a date string
const toMonthKey = (dateStr) => {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-SG', { month: 'short', year: 'numeric' })
}

const Transaction = ({
  transactions,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  customCategories = [],
  onAddCustomCategory,
}) => {
  const [showForm, setShowForm] = useState(false)
  const [formMode, setFormMode] = useState('simple')
  const [formData, setFormData] = useState(emptyForm)
  const [typeFilter, setTypeFilter] = useState('all')   // all | income | expense
  const [monthFilter, setMonthFilter] = useState('all') // all | "Jan 2026" etc
  const [expandedId, setExpandedId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [showCalc, setShowCalc] = useState(false)

  const allCategories = [...PRESET_CATEGORIES]
  customCategories.forEach(c => { if (!allCategories.includes(c)) allCategories.push(c) })

  const isDetailed = formMode === 'detailed'
  const isCustomCategory = formData.category === '__custom__'
  const isCustomAccount = formData.account === '__custom__'

  const set = (field, value) => setFormData(prev => ({ ...prev, [field]: value }))

  // ── Derive sorted unique months from all transactions ──────────────────
  const availableMonths = Array.from(
    new Set(transactions.map(t => toMonthKey(t.date)))
  ).sort((a, b) => new Date(b) - new Date(a)) // newest first

  // ── Filtering ──────────────────────────────────────────────────────────
  const filteredTransactions = transactions
    .filter(t => typeFilter === 'all' || t.type === typeFilter)
    .filter(t => monthFilter === 'all' || toMonthKey(t.date) === monthFilter)
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  // Summary based on currently filtered month (or all)
  const summaryBase = monthFilter === 'all' ? transactions : transactions.filter(t => toMonthKey(t.date) === monthFilter)
  const totalIncome = summaryBase.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpenses = summaryBase.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  // Always use all income for the salary breakdown
  const allTimeIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)

  // ── Form helpers ───────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault()
    const finalCategory = isCustomCategory ? formData.customCategory : formData.category
    const finalAccount = isCustomAccount ? formData.customAccount : formData.account
    if (!formData.amount || !finalCategory || !formData.description || !formData.date) return

    if (isCustomCategory && formData.customCategory.trim()) {
      onAddCustomCategory(formData.customCategory.trim())
    }

    const payload = { ...formData, category: finalCategory, account: finalAccount, amount: parseFloat(formData.amount) }
    editingId !== null ? onUpdateTransaction(editingId, payload) : onAddTransaction(payload)

    setFormData({ ...emptyForm, date: new Date().toISOString().split('T')[0] })
    setEditingId(null); setShowForm(false); setShowCalc(false)
  }

  const openForm = () => {
    setEditingId(null)
    setFormData({ ...emptyForm, date: new Date().toISOString().split('T')[0] })
    setShowCalc(false); setShowForm(true)
  }

  const openEditForm = (t) => {
    const categoryInList = allCategories.includes(t.category)
    setEditingId(t.id)
    setFormData({
      type: t.type || 'expense',
      amount: String(t.amount),
      category: categoryInList ? t.category : '__custom__',
      customCategory: categoryInList ? '' : t.category,
      description: t.description || '',
      date: t.date ? new Date(t.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      event: t.event || '',
      account: ACCOUNTS.includes(t.account) ? (t.account || '') : (t.account ? '__custom__' : ''),
      customAccount: ACCOUNTS.includes(t.account) ? '' : (t.account || ''),
      paymentType: t.paymentType || '',
      needWant: t.needWant || 'need',
      cashbackBnpl: t.cashbackBnpl || 'None',
    })
    setFormMode(t.event || t.account || t.paymentType || (t.cashbackBnpl && t.cashbackBnpl !== 'None') ? 'detailed' : 'simple')
    setShowCalc(false); setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false); setEditingId(null); setShowCalc(false)
    setFormData({ ...emptyForm, date: new Date().toISOString().split('T')[0] })
  }

  return (
    <div className="transaction">
      <div className="transaction-header">
        <h1>Transactions</h1>
        <button className="btn btn-primary" onClick={openForm}>+ Add Transaction</button>
      </div>

      {/* Summary cards — reflect selected month */}
      <div className="transaction-summary">
        <div className="summary-card income">
          <h3>Total Income {monthFilter !== 'all' && <span style={{ fontWeight: 400, fontSize: '0.75rem', opacity: 0.7 }}>({monthFilter})</span>}</h3>
          <p>${formatMoney(totalIncome)}</p>
        </div>
        <div className="summary-card expense">
          <h3>Total Expenses {monthFilter !== 'all' && <span style={{ fontWeight: 400, fontSize: '0.75rem', opacity: 0.7 }}>({monthFilter})</span>}</h3>
          <p>${formatMoney(totalExpenses)}</p>
        </div>
        <div className={`summary-card balance ${totalIncome - totalExpenses >= 0 ? 'positive' : 'negative'}`}>
          <h3>Net Balance</h3>
          <p>${formatMoney(totalIncome - totalExpenses)}</p>
        </div>
      </div>

      {/* Income allocation — always based on all-time income */}
      <SalaryBreakdown totalIncome={allTimeIncome} />

      {/* ── Modal ── */}
      {showForm && (
        <div className="modal-overlay" onClick={closeForm} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            className="glass-panel"
            style={{
              display: 'flex',
              alignItems: 'stretch',
              overflow: 'hidden',
              maxHeight: '90vh',
              width: showCalc ? '680px' : '460px',
              maxWidth: '95vw',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Form panel */}
            <div style={{ background: 'transparent', flex: 1, minWidth: 0, overflowY: 'auto', padding: '1.5rem' }}>
              <div className="modal-header">
                <h2>{editingId !== null ? 'Edit Transaction' : 'Add New Transaction'}</h2>
                <button className="modal-close" onClick={closeForm}>✕</button>
              </div>

              <div className="mode-toggle">
                <button className={`mode-btn ${formMode === 'simple' ? 'mode-active' : ''}`} onClick={() => setFormMode('simple')}>⚡ Simple</button>
                <button className={`mode-btn ${formMode === 'detailed' ? 'mode-active' : ''}`} onClick={() => setFormMode('detailed')}>🗂️ Detailed</button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Type</label>
                    <select value={formData.type} onChange={e => set('type', e.target.value)}>
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Date</label>
                    <input type="date" value={formData.date}
                      max={new Date().toISOString().split('T')[0]}
                      onChange={e => set('date', e.target.value)} required />
                  </div>
                </div>

                {/* Amount + calc toggle */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Amount ($)</label>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <input
                        type="number" step="0.01" min="0" placeholder="0.00"
                        value={formData.amount}
                        onChange={e => set('amount', e.target.value)}
                        required style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        title="Open calculator (or type with keyboard)"
                        onClick={() => setShowCalc(p => !p)}
                        style={{
                          height: '38px', padding: '0 10px',
                          border: `1px solid ${showCalc ? 'var(--color-primary)' : 'var(--color-input-border)'}`,
                          borderRadius: '8px',
                          background: showCalc ? 'var(--color-primary)' : 'var(--color-input-bg)',
                          color: showCalc ? '#fff' : 'inherit',
                          fontSize: '1rem', cursor: 'pointer', flexShrink: 0,
                        }}
                      >🧮</button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Category</label>
                    <select value={formData.category} onChange={e => set('category', e.target.value)} required>
                      <option value="">Select category</option>
                      {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                      <option value="__custom__">＋ Add my own…</option>
                    </select>
                  </div>

                  {isCustomCategory && (
                    <div className="form-group">
                      <label>Custom Category</label>
                      <input type="text" placeholder="e.g. Pet Care"
                        value={formData.customCategory}
                        onChange={e => set('customCategory', e.target.value)} required />
                    </div>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group form-group-full">
                    <label>Description</label>
                    <input type="text" placeholder="e.g. Lunch at Maxwell"
                      value={formData.description}
                      onChange={e => set('description', e.target.value)} required />
                  </div>
                </div>

                {isDetailed && (
                  <div className="detailed-fields">
                    <div className="form-section-title">Event</div>
                    <div className="form-row">
                      <div className="form-group form-group-full">
                        <label>Event <span className="label-optional">(optional)</span></label>
                        <input type="text" placeholder="e.g. Birthday dinner, NDP, Company retreat"
                          value={formData.event} onChange={e => set('event', e.target.value)} />
                      </div>
                    </div>

                    <div className="form-section-title">Payment</div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Account / Card</label>
                        <select value={formData.account} onChange={e => set('account', e.target.value)}>
                          <option value="">Select account</option>
                          {ACCOUNTS.map(a => <option key={a} value={a}>{a}</option>)}
                          <option value="__custom__">＋ Add my own…</option>
                        </select>
                      </div>
                      {isCustomAccount && (
                        <div className="form-group">
                          <label>Custom Account</label>
                          <input type="text" placeholder="e.g. Revolut"
                            value={formData.customAccount} onChange={e => set('customAccount', e.target.value)} />
                        </div>
                      )}
                      <div className="form-group">
                        <label>Payment Type</label>
                        <select value={formData.paymentType} onChange={e => set('paymentType', e.target.value)}>
                          <option value="">Select type</option>
                          {PAYMENT_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                    </div>

                    {formData.type === 'expense' && (
                      <>
                        <div className="form-section-title">Classification</div>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Need / Want</label>
                            <div className="toggle-group">
                              <button type="button" className={`toggle-btn ${formData.needWant === 'need' ? 'active-need' : ''}`} onClick={() => set('needWant', 'need')}>🛒 Need</button>
                              <button type="button" className={`toggle-btn ${formData.needWant === 'want' ? 'active-want' : ''}`} onClick={() => set('needWant', 'want')}>🛍️ Want</button>
                            </div>
                          </div>
                          <div className="form-group">
                            <label>Cashback / BNPL</label>
                            <select value={formData.cashbackBnpl} onChange={e => set('cashbackBnpl', e.target.value)}>
                              {CASHBACK_BNPL.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div className="form-actions">
                  <button type="button" onClick={closeForm}>Cancel</button>
                  <button type="submit" className="btn btn-primary">
                    {editingId !== null ? 'Save Changes' : 'Add Transaction'}
                  </button>
                </div>
              </form>
            </div>

            {/* Calculator — fixed width, never stretches */}
            {showCalc && (
              <Calculator
                onApply={(val) => set('amount', val)}
                onClose={() => setShowCalc(false)}
              />
            )}
          </div>
        </div>
      )}

      {/* ── Filters row ── */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>

        {/* Type filter */}
        <div className="transaction-filters" style={{ margin: 0 }}>
          {['all', 'income', 'expense'].map(f => (
            <button key={f} className={typeFilter === f ? 'active' : ''} onClick={() => setTypeFilter(f)}>
              {f === 'all' ? 'All' : f === 'income' ? 'Income' : 'Expenses'}
            </button>
          ))}
        </div>

        {/* Month filter */}
        {availableMonths.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>📅 Month:</span>
            <button
              onClick={() => setMonthFilter('all')}
              style={{
                padding: '5px 12px',
                borderRadius: '99px',
                border: `1px solid ${monthFilter === 'all' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                background: monthFilter === 'all' ? 'var(--color-primary)' : 'var(--color-surface-alt)',
                color: monthFilter === 'all' ? '#fff' : 'var(--color-text)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >All</button>
            {availableMonths.map(m => (
              <button
                key={m}
                onClick={() => setMonthFilter(m)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '99px',
                  border: `1px solid ${monthFilter === m ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: monthFilter === m ? 'var(--color-primary)' : 'var(--color-surface-alt)',
                  color: monthFilter === m ? '#fff' : 'var(--color-text)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                }}
              >{m}</button>
            ))}
          </div>
        )}
      </div>

      {/* Count label */}
      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
        {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
        {monthFilter !== 'all' ? ` in ${monthFilter}` : ''}
        {typeFilter !== 'all' ? ` · ${typeFilter}` : ''}
      </div>

      {/* ── List ── */}
      <div className="transaction-list">
        {filteredTransactions.length > 0 ? filteredTransactions.map(t => (
          <div key={t.id} className={`transaction-item ${t.type}`}>
            <div className="transaction-info" style={{ cursor: 'pointer' }}
              onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}>
              <div className="transaction-main">
                <span className="description">{t.description}</span>
                <div className="transaction-tags">
                  <span className="tag tag-category">{t.category}</span>
                  {t.needWant && t.type === 'expense' && (
                    <span className={`tag tag-needwant-${t.needWant}`}>
                      {t.needWant === 'need' ? '🛒 Need' : '🛍️ Want'}
                    </span>
                  )}
                  {t.event && <span className="tag tag-event">📅 {t.event}</span>}
                </div>
              </div>
              <span className="date">
                {new Date(t.date).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>

            <div className="transaction-amount">
              <span className={`amount ${t.type}`}>
                {t.type === 'income' ? '+' : '-'}${formatMoney(t.amount)}
              </span>
              <div className="transaction-btns">
                <button className="edit-btn" onClick={() => openEditForm(t)}>Edit</button>
                <button className="delete-btn" onClick={() => onDeleteTransaction(t.id)}>Delete</button>
              </div>
            </div>

            {expandedId === t.id && (
              <div className="transaction-detail">
                {t.account && <div className="detail-chip">💳 {t.account}</div>}
                {t.paymentType && <div className="detail-chip">📲 {t.paymentType}</div>}
                {t.cashbackBnpl && t.cashbackBnpl !== 'None' && <div className="detail-chip">🎁 {t.cashbackBnpl}</div>}
                {t.event && <div className="detail-chip">🗓️ {t.event}</div>}
                {!t.account && !t.paymentType && !t.event && !(t.cashbackBnpl && t.cashbackBnpl !== 'None') && (
                  <span className="detail-empty">No extra details recorded.</span>
                )}
              </div>
            )}
          </div>
        )) : (
          <div className="empty-state">
            <p>
              {monthFilter !== 'all'
                ? `No ${typeFilter === 'all' ? '' : typeFilter + ' '}transactions in ${monthFilter}.`
                : 'No transactions found. Add your first transaction!'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Transaction