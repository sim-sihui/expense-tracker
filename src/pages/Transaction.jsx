import { useState, useRef } from 'react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { formatMoney } from '../utils/formatMoney'
import Calculator from './Calculator'
import SalaryBreakdown from './Salarybreakdown'
import Loans from './Loans'
import './new-features.css'

const PRESET_CATEGORIES = [
  'Food & Dining', 'Transportation', 'Shopping', 'Entertainment',
  'Bills & Utilities', 'Healthcare', 'Travel', 'Education', 'Salary',
  'Bonus', 'Freelance', 'Investment', 'Other'
]

const CATEGORY_COLORS = {
  'Salary': { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
  'Bonus': { bg: 'rgba(52,211,153,0.15)', color: '#34d399' },
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
  loans,
  onAddLoan,
  onUpdateLoan,
  onDeleteLoan,
  onAddBulkTransactions
}) => {
  const [activeTab, setActiveTab] = useState('transactions') // 'transactions' | 'loans'
  const [showForm, setShowForm] = useState(false)
  const [formMode, setFormMode] = useState('simple')
  const [formData, setFormData] = useState(emptyForm)
  const [typeFilter, setTypeFilter] = useState('all')   // all | income | expense
  const [monthFilter, setMonthFilter] = useState('all') // all | "Jan 2026" etc
  const [editingId, setEditingId] = useState(null)
  const [showCalc, setShowCalc] = useState(false)
  const [showAllocations, setShowAllocations] = useState(false)
  const [allocations, setAllocations] = useState({})

  // Import related states
  const fileInputRef = useRef(null)
  const [showImportMap, setShowImportMap] = useState(false)
  const [importedHeaders, setImportedHeaders] = useState([])
  const [importedData, setImportedData] = useState([])
  const [importMapping, setImportMapping] = useState({
    date: '', amount: '', description: '', type: '', category: ''
  })
  const [importError, setImportError] = useState('')

  const allCategories = [...PRESET_CATEGORIES]
  customCategories.forEach(c => { if (!allCategories.includes(c)) allCategories.push(c) })
  budgets.forEach(b => { if (!allCategories.includes(b.category)) allCategories.push(b.category) })

  const INCOME_PRESETS = ['Salary', 'Bonus', 'Freelance', 'Investment', 'Other']
  const EXPENSE_PRESETS = PRESET_CATEGORIES.filter(c => !['Salary', 'Bonus', 'Freelance', 'Investment'].includes(c))
  const formCategories = formData.type === 'income'
    ? Array.from(new Set([...INCOME_PRESETS, ...customCategories]))
    : Array.from(new Set([...EXPENSE_PRESETS, ...customCategories, ...budgets.map(b => b.category)]))

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

  // ── File Import Handlers ───────────────────────────────────────────────
  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setImportError('')
    const extension = file.name.split('.').pop().toLowerCase()

    if (extension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            setImportedHeaders(Object.keys(results.data[0]))
            setImportedData(results.data)
            setShowImportMap(true)
          } else {
            setImportError('The CSV file appears to be empty or invalid.')
          }
        },
        error: (err) => setImportError(`Failed to parse CSV: ${err.message}`)
      })
    } else if (['xlsx', 'xls'].includes(extension)) {
      const reader = new FileReader()
      reader.onload = (evt) => {
        try {
          const bstr = evt.target.result
          const wb = XLSX.read(bstr, { type: 'binary' })
          const wsname = wb.SheetNames[0]
          const ws = wb.Sheets[wsname]
          const data = XLSX.utils.sheet_to_json(ws)
          if (data && data.length > 0) {
            setImportedHeaders(Object.keys(data[0]))
            setImportedData(data)
            setShowImportMap(true)
          } else {
            setImportError('The Excel file appears to be empty.')
          }
        } catch (err) {
          setImportError('Failed to parse Excel file.')
        }
      }
      reader.readAsBinaryString(file)
    } else {
      setImportError('Unsupported file type. Please upload a .csv or .xlsx file.')
    }
    // reset input
    e.target.value = null
  }

  const handleImportSubmit = () => {
    // Validate mapping
    if (!importMapping.date || !importMapping.amount || !importMapping.description) {
      setImportError('Date, Amount, and Description column mappings are required.')
      return
    }

    const tData = []

    importedData.forEach((row, index) => {
      // safely extract string values first
      let rawDate = row[importMapping.date]
      let rawAmount = row[importMapping.amount]
      let rawDesc = row[importMapping.description]
      let rawType = importMapping.type ? row[importMapping.type] : ''
      let rawCat = importMapping.category ? row[importMapping.category] : ''

      if (!rawDate || !rawAmount || !rawDesc) return

      // Parse Amount safely
      let parsedAmount = parseFloat(String(rawAmount).replace(/[^0-9.-]+/g, ''))
      if (isNaN(parsedAmount)) return // Invalid amount

      // Determine type
      let finalType = 'expense'
      if (parsedAmount < 0) {
        finalType = 'expense'
        parsedAmount = Math.abs(parsedAmount)
      } else if (rawType) {
        const lrType = String(rawType).toLowerCase()
        if (lrType.includes('in') || lrType.includes('credit')) finalType = 'income'
        else finalType = 'expense'
      }

      // Try parsing date logic. Simple approach falling back to today if fails.
      let finalDate = new Date().toISOString()
      try {
        const d = new Date(rawDate)
        if (!isNaN(d)) finalDate = d.toISOString()
      } catch (e) { }

      // Try category mapping against valid presets
      let finalCat = 'Other'
      if (rawCat) {
        const match = allCategories.find(c => c.toLowerCase() === String(rawCat).toLowerCase().trim())
        if (match) finalCat = match
      }

      tData.push({
        type: finalType,
        amount: parsedAmount,
        category: finalCat,
        customCategory: '',
        description: String(rawDesc).trim(),
        date: finalDate,
        event: '',
        account: '',
        customAccount: '',
        paymentType: '',
        needWant: 'need',
        cashbackBnpl: 'None',
      })
    })

    if (tData.length > 0) {
      if (onAddBulkTransactions) onAddBulkTransactions(tData)
      setShowImportMap(false)
      setImportedData([])
      setImportedHeaders([])
      setImportMapping({ date: '', amount: '', description: '', type: '', category: '' })
    } else {
      setImportError('No valid transactions could be parsed with the current mapping.')
    }
  }

  return (
    <div className="transaction-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="master-tab-bar" style={{ display: 'flex', gap: '1rem', padding: '0.5rem 1rem', background: 'var(--glass-background)', backdropFilter: 'blur(10px)', borderRadius: '16px', border: '1px solid var(--glass-border)', width: 'fit-content', margin: '0 0 1rem 0' }}>
        <button
          onClick={() => setActiveTab('transactions')}
          style={{
            padding: '0.6rem 1.2rem',
            background: activeTab === 'transactions' ? 'var(--color-primary)' : 'transparent',
            color: activeTab === 'transactions' ? 'white' : 'var(--color-text-muted)',
            border: 'none',
            borderRadius: '10px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >Transactions</button>
        <button
          onClick={() => setActiveTab('loans')}
          style={{
            padding: '0.6rem 1.2rem',
            background: activeTab === 'loans' ? 'var(--color-primary)' : 'transparent',
            color: activeTab === 'loans' ? 'white' : 'var(--color-text-muted)',
            border: 'none',
            borderRadius: '10px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >Loans</button>
      </div>

      {activeTab === 'transactions' ? (
        <div className="transaction" style={{ marginTop: 0 }}>
          <div className="transaction-header">
            <h1>Transactions</h1>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <input
                type="file"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <button className="btn" style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} onClick={() => fileInputRef.current?.click()}>
                📄 Import CSV/Excel
              </button>
              <button className="btn btn-primary" onClick={openForm}>+ Add Transaction</button>
            </div>
          </div>

          {importError && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '1rem' }}>
              <strong>Import Error:</strong> {importError}
              <button onClick={() => setImportError('')} style={{ float: 'right', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>✕</button>
            </div>
          )}

          {/* Import Mapping Modal */}
          {showImportMap && (
            <div className="modal-overlay" onClick={() => setShowImportMap(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div className="glass-panel" style={{ width: '500px', maxWidth: '95vw', padding: '1.5rem' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Map Import Columns</h2>
                  <button className="modal-close" onClick={() => setShowImportMap(false)}>✕</button>
                </div>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                  Please map the columns from your uploaded file to the required transaction fields.
                  Found <strong>{importedData.length}</strong> rows.
                </p>

                <div className="form-row" style={{ marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label>Date Column <span style={{ color: '#ef4444' }}>*</span></label>
                    <select value={importMapping.date} onChange={e => setImportMapping({ ...importMapping, date: e.target.value })}>
                      <option value="">Select column</option>
                      {importedHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Amount Column <span style={{ color: '#ef4444' }}>*</span></label>
                    <select value={importMapping.amount} onChange={e => setImportMapping({ ...importMapping, amount: e.target.value })}>
                      <option value="">Select column</option>
                      {importedHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-row" style={{ marginBottom: '1rem' }}>
                  <div className="form-group form-group-full">
                    <label>Description / Payee Column <span style={{ color: '#ef4444' }}>*</span></label>
                    <select value={importMapping.description} onChange={e => setImportMapping({ ...importMapping, description: e.target.value })}>
                      <option value="">Select column</option>
                      {importedHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-row" style={{ marginBottom: '1.5rem' }}>
                  <div className="form-group">
                    <label>Type (Income/Expense) <span className="label-optional">(optional)</span></label>
                    <select value={importMapping.type} onChange={e => setImportMapping({ ...importMapping, type: e.target.value })}>
                      <option value="">Select column (or omit for auto-detect by amount)</option>
                      {importedHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Category <span className="label-optional">(optional)</span></label>
                    <select value={importMapping.category} onChange={e => setImportMapping({ ...importMapping, category: e.target.value })}>
                      <option value="">Select column</option>
                      {importedHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-actions" style={{ marginTop: '1rem' }}>
                  <button type="button" onClick={() => setShowImportMap(false)}>Cancel</button>
                  <button type="button" className="btn btn-primary" onClick={handleImportSubmit}>Import {importedData.length} Rows</button>
                </div>
              </div>
            </div>
          )}

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
                          {formCategories.map(c => <option key={c} value={c}>{c}</option>)}
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
      ) : (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <Loans
            loans={loans}
            onAddLoan={onAddLoan}
            onUpdateLoan={onUpdateLoan}
            onDeleteLoan={onDeleteLoan}
          />
        </div>
      )}
    </div>
  )
}

export default Transaction