import { useState } from 'react'
import { formatMoney } from '../utils/formatMoney'
import Calculator from './Calculator'
import SalaryBreakdown from './Salarybreakdown'
import './new-features.css'

const PRESET_CATEGORIES = [
  'Food & Dining', 'Transportation', 'Shopping', 'Entertainment',
  'Bills & Utilities', 'Healthcare', 'Travel', 'Education', 'Salary',
  'Freelance', 'Investment', 'Other'
]

const CATEGORY_COLORS = {
  'Salary': { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
  'Freelance': { bg: 'rgba(20,184,166,0.15)', color: '#14b8a6' },
  'Investment': { bg: 'rgba(34,197,94,0.15)', color: '#22c55e' },
  'Food & Dining': { bg: 'rgba(234,179,8,0.15)', color: '#eab308' },
  'Food & Groceries': { bg: 'rgba(234,179,8,0.15)', color: '#eab308' },
  'Transportation': { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
  'Transport': { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
  'Shopping': { bg: 'rgba(236,72,153,0.15)', color: '#ec4899' },
  'Entertainment': { bg: 'rgba(139,92,246,0.15)', color: '#8b5cf6' },
  'Bills & Utilities': { bg: 'rgba(168,85,247,0.15)', color: '#a855f7' },
  'Utilities': { bg: 'rgba(168,85,247,0.15)', color: '#a855f7' },
  'Housing (Rent/Mortgage)': { bg: 'rgba(249,115,22,0.15)', color: '#f97316' },
  'Healthcare': { bg: 'rgba(6,182,212,0.15)', color: '#06b6d4' },
  'Travel': { bg: 'rgba(99,102,241,0.15)', color: '#6366f1' },
  'Education': { bg: 'rgba(99,102,241,0.15)', color: '#818cf8' },
  'Other': { bg: 'rgba(100,116,139,0.15)', color: '#64748b' },
}

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
  budgets = [],
  savingsGoals = [],
  emergencyFund,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  customCategories = [],
  onAddCustomCategory,
  onUpdateSavingsGoal,
  onUpdateEmergencyFund,
}) => {
  const [showForm, setShowForm] = useState(false)
  const [formMode, setFormMode] = useState('simple')
  const [formData, setFormData] = useState(emptyForm)
  const [typeFilter, setTypeFilter] = useState('all')   // all | income | expense
  const [monthFilter, setMonthFilter] = useState('all') // all | "Jan 2026" etc
  const [editingId, setEditingId] = useState(null)
  const [showCalc, setShowCalc] = useState(false)
  const [showAllocations, setShowAllocations] = useState(false)
  const [allocations, setAllocations] = useState({})

  const allCategories = [...PRESET_CATEGORIES]
  customCategories.forEach(c => { if (!allCategories.includes(c)) allCategories.push(c) })
  budgets.forEach(b => { if (!allCategories.includes(b.category)) allCategories.push(b.category) })

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

  // ── Form helpers ───────────────────────────────────────────────────────
  const totalAllocated = Object.values(allocations).reduce((s, v) => s + (parseFloat(v) || 0), 0)

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

    // Apply savings/investment allocations (new transactions only)
    if (editingId === null) {
      Object.entries(allocations).forEach(([key, amtStr]) => {
        const amt = parseFloat(amtStr)
        if (!(amt > 0)) return
        if (key === '__ef__') {
          // Emergency fund allocation
          if (onUpdateEmergencyFund && emergencyFund) {
            onUpdateEmergencyFund({
              ...emergencyFund,
              current: (emergencyFund.current || 0) + amt,
              lastUpdated: new Date().toISOString()
            })
          }
        } else if (onUpdateSavingsGoal) {
          const goal = savingsGoals.find(g => g.id === parseInt(key))
          if (goal) onUpdateSavingsGoal(parseInt(key), { ...goal, currentAmount: (goal.currentAmount || 0) + amt })
        }
      })
    }

    setFormData({ ...emptyForm, date: new Date().toISOString().split('T')[0] })
    setAllocations({}); setShowAllocations(false)
    setEditingId(null); setShowForm(false); setShowCalc(false)
  }

  const openForm = () => {
    setEditingId(null)
    setFormData({ ...emptyForm, date: new Date().toISOString().split('T')[0] })
    setAllocations({}); setShowAllocations(false)
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
    setAllocations({}); setShowAllocations(false)
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

      {/* Income allocation — based on currently filtered month (or all) */}
      <SalaryBreakdown totalIncome={totalIncome} transactions={summaryBase} />

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
                    <div className="amount-input-row">
                      <input
                        type="number" step="0.01" min="0" placeholder="0.00"
                        value={formData.amount}
                        onChange={e => set('amount', e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        title="Open calculator"
                        onClick={() => setShowCalc(p => !p)}
                        className={`calc-toggle-btn${showCalc ? ' calc-toggle-active' : ''}`}
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

                {/* Classify as Need / Want / Savings / Invest — always shown for expenses */}
                {formData.type === 'expense' && (
                  <div className="form-row">
                    <div className="form-group form-group-full">
                      <label>Classify as</label>
                      <div className="toggle-group">
                        <button type="button" className={`toggle-btn ${formData.needWant === 'need' ? 'active-need' : ''}`} onClick={() => set('needWant', 'need')}>🛒 Need</button>
                        <button type="button" className={`toggle-btn ${formData.needWant === 'want' ? 'active-want' : ''}`} onClick={() => set('needWant', 'want')}>🛍️ Want</button>
                        <button type="button" className={`toggle-btn ${formData.needWant === 'savings' ? 'active-savings' : ''}`} onClick={() => set('needWant', 'savings')}>🏦 Savings</button>
                        <button type="button" className={`toggle-btn ${formData.needWant === 'invest' ? 'active-invest' : ''}`} onClick={() => set('needWant', 'invest')}>📈 Invest</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Savings / Emergency Fund / Investment allocation — new transactions only */}
                {editingId === null && (savingsGoals.length > 0 || emergencyFund) && (
                  <div className="allocate-section">
                    <button
                      type="button"
                      className="allocate-toggle-btn"
                      onClick={() => setShowAllocations(p => !p)}
                    >
                      <span className="allocate-toggle-arrow">{showAllocations ? '▼' : '▶'}</span>
                      Allocate to Savings / Emergency Fund
                      <span className="label-optional" style={{ marginLeft: 6 }}>(optional)</span>
                    </button>

                    {showAllocations && (
                      <div className="allocate-goals">
                        {/* Emergency Fund row */}
                        {emergencyFund && (
                          <div className="allocate-row allocate-ef-row">
                            <span className="allocate-icon">🛡️</span>
                            <div className="allocate-info">
                              <span className="allocate-name">Emergency Fund</span>
                              <span className="allocate-progress">
                                ${formatMoney(emergencyFund.current || 0)} / ${formatMoney(emergencyFund.target || 0)}
                              </span>
                            </div>
                            <input
                              type="number" min="0" step="0.01" placeholder="0.00"
                              className="allocate-input"
                              value={allocations['__ef__'] || ''}
                              onChange={e => setAllocations(prev => ({ ...prev, '__ef__': e.target.value }))}
                            />
                          </div>
                        )}

                        {/* Savings goals */}
                        {savingsGoals.map(g => (
                          <div key={g.id} className="allocate-row">
                            <span className="allocate-icon">{g.icon || '🎯'}</span>
                            <div className="allocate-info">
                              <span className="allocate-name">{g.name}</span>
                              <span className="allocate-progress">
                                ${formatMoney(g.currentAmount || 0)} / ${formatMoney(g.targetAmount)}
                              </span>
                            </div>
                            <input
                              type="number" min="0" step="0.01" placeholder="0.00"
                              className="allocate-input"
                              value={allocations[g.id] || ''}
                              onChange={e => setAllocations(prev => ({ ...prev, [g.id]: e.target.value }))}
                            />
                          </div>
                        ))}

                        {formData.amount && (
                          <div className={`allocate-summary ${totalAllocated > parseFloat(formData.amount) ? 'allocate-over' : ''}`}>
                            <span>Allocating <strong>${formatMoney(totalAllocated)}</strong></span>
                            <span> of <strong>${formatMoney(parseFloat(formData.amount) || 0)}</strong></span>
                            {totalAllocated > parseFloat(formData.amount) && (
                              <span className="allocate-warning"> — exceeds transaction amount</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

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

      {/* Month filter */}
      {availableMonths.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>📅 Month:</span>
          <button
            onClick={() => setMonthFilter('all')}
            style={{
              padding: '5px 12px', borderRadius: '99px',
              border: `1px solid ${monthFilter === 'all' ? 'var(--color-primary)' : 'var(--color-border)'}`,
              background: monthFilter === 'all' ? 'var(--color-primary)' : 'var(--color-surface-alt)',
              color: monthFilter === 'all' ? '#fff' : 'var(--color-text)',
              fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >All</button>
          {availableMonths.map(m => (
            <button
              key={m}
              onClick={() => setMonthFilter(m)}
              style={{
                padding: '5px 12px', borderRadius: '99px',
                border: `1px solid ${monthFilter === m ? 'var(--color-primary)' : 'var(--color-border)'}`,
                background: monthFilter === m ? 'var(--color-primary)' : 'var(--color-surface-alt)',
                color: monthFilter === m ? '#fff' : 'var(--color-text)',
                fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
              }}
            >{m}</button>
          ))}
        </div>
      )}

      {/* Type filter tabs */}
      <div className="tx-tab-bar">
        {[
          { key: 'all', label: 'All' },
          { key: 'income', label: 'Income' },
          { key: 'expense', label: 'Expenses' },
        ].map(({ key, label }) => (
          <button
            key={key}
            className={`tx-tab${typeFilter === key ? ' active' : ''}`}
            onClick={() => setTypeFilter(key)}
          >{label}</button>
        ))}
      </div>

      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
        {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
        {monthFilter !== 'all' ? ` in ${monthFilter}` : ''}
        {typeFilter !== 'all' ? ` · ${typeFilter}` : ''}
      </div>

      {/* ── Transaction Table ── */}
      {filteredTransactions.length > 0 ? (
        <div className="tx-table-wrap">
          <div className="tx-table">
            <div className="tx-table-head">
              <div>DATE</div>
              <div>EXPENSE/INCOME</div>
              <div>CATEGORY</div>
              <div>DESCRIPTION</div>
              <div className="tx-th-amount">AMOUNT ($)</div>
              <div>CASHBACK/BNPL</div>
              <div>CARD USED</div>
              <div>PAYMENT TYPE</div>
              <div>WANT/NEED</div>
              <div />
            </div>

            {filteredTransactions.map(t => {
              const catStyle = CATEGORY_COLORS[t.category] || { bg: 'rgba(100,116,139,0.15)', color: '#64748b' }

              return (
                <div key={t.id} className="tx-table-row" onClick={() => openEditForm(t)}>
                  <div className="tx-cell-date">
                    {new Date(t.date).toLocaleDateString('en-SG', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                  </div>

                  <div className="tx-cell-type">
                    <span className={`tx-type-badge tx-type-${t.type}`}>{t.type === 'expense' ? 'Expense' : 'Income'}</span>
                  </div>

                  <div className="tx-cell-category">
                    <span className="tx-cat-badge" style={{ background: catStyle.bg, color: catStyle.color }}>
                      {t.category}
                    </span>
                  </div>

                  <div className="tx-cell-desc">
                    <div className="tx-desc-name">{t.description}</div>
                    <div className="tx-desc-chips">
                      {t.event && (
                        <span className="tx-desc-chip">📅 {t.event}</span>
                      )}
                    </div>
                  </div>

                  <div className="tx-cell-amount">
                    <span className={`tx-amount-val ${t.type}`}>
                      {t.type === 'income' ? '+' : '-'}S$ {formatMoney(t.amount)}
                    </span>
                  </div>

                  <div className="tx-cell-cashback">
                    {t.cashbackBnpl && t.cashbackBnpl !== 'None' ? (
                      <span className="tx-desc-chip tx-chip-cashback">🎁 {t.cashbackBnpl}</span>
                    ) : (
                      <span className="tx-muted">—</span>
                    )}
                  </div>

                  <div className="tx-cell-card">
                    {t.account ? t.account : <span className="tx-muted">—</span>}
                  </div>

                  <div className="tx-cell-payment-type">
                    {t.paymentType ? t.paymentType : <span className="tx-muted">—</span>}
                  </div>

                  <div className="tx-cell-want-need">
                    {t.needWant && t.type === 'expense' ? (
                      <span className="tx-desc-chip">
                        {t.needWant === 'need' ? '🛒 Need'
                          : t.needWant === 'want' ? '🛍️ Want'
                            : t.needWant === 'savings' ? '🏦 Savings'
                              : '📈 Invest'}
                      </span>
                    ) : (
                      <span className="tx-muted">—</span>
                    )}
                  </div>

                  <div className="tx-cell-action" onClick={e => { e.stopPropagation(); onDeleteTransaction(t.id) }}>
                    <button className="tx-delete-x" title="Delete">✕</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <p>
            {monthFilter !== 'all'
              ? `No ${typeFilter === 'all' ? '' : typeFilter + ' '}transactions in ${monthFilter}.`
              : 'No transactions found. Add your first transaction!'}
          </p>
        </div>
      )}
    </div>
  )
}

export default Transaction