import { useState, useMemo } from 'react'
import { formatMoney } from '../utils/formatMoney'
import { getEmergencyStatus } from '../utils/emergencyLogic'
import SavingsGoals from './Savingsgoals'
import './Budget.css'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

// Category icons and colors for visual mapping
const CATEGORY_STYLES = {
  Food: { icon: '🍔', color: '#f97316' },
  Transport: { icon: '🚌', color: '#3b82f6' },
  Entertainment: { icon: '🎮', color: '#a855f7' },
  Shopping: { icon: '🛍️', color: '#ec4899' },
  Bills: { icon: '📄', color: '#6366f1' },
  Health: { icon: '🏥', color: '#22c55e' },
  Education: { icon: '📚', color: '#0ea5e9' },
  Groceries: { icon: '🛒', color: '#10b981' },
  Housing: { icon: '🏠', color: '#8b5cf6' },
  Utilities: { icon: '💡', color: '#eab308' },
  Insurance: { icon: '🛡️', color: '#14b8a6' },
  Savings: { icon: '🏦', color: '#06b6d4' },
  Investments: { icon: '📈', color: '#84cc16' },
  default: { icon: '📋', color: '#6366f1' }
}

const getCategoryStyle = (cat) => CATEGORY_STYLES[cat] || CATEGORY_STYLES.default

const PRESET_CATEGORIES = [
  'Food & Dining', 'Transportation', 'Shopping', 'Entertainment',
  'Bills & Utilities', 'Healthcare', 'Travel', 'Education', 'Salary',
  'Freelance', 'Investment', 'Other'
]

const Budget = ({
  budgets,
  transactions,
  customCategories = [],
  onAddCustomCategory,
  onAddBudget,
  onUpdateBudget,
  onDeleteBudget,
  savingsGoals = [],
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  emergencyFund,
  onUpdateEmergencyFund
}) => {
  // Tab state
  const [activeTab, setActiveTab] = useState('overview')

  // Period filter state
  const [periodFilter, setPeriodFilter] = useState('monthly') // 'all' | 'monthly' | 'weekly' | 'daily'
  const [periodDate, setPeriodDate] = useState(new Date())

  // Modal/Form States
  const [showForm, setShowForm] = useState(false)
  const [showEFForm, setShowEFForm] = useState(false)
  const [editingBudget, setEditingBudget] = useState(null)

  // Form Data
  const [formData, setFormData] = useState({ category: '', customCategory: '', amount: '', period: 'monthly' })

  // Categories list
  const allCategories = [...PRESET_CATEGORIES]
  customCategories.forEach(c => { if (!allCategories.includes(c)) allCategories.push(c) })
  transactions.forEach(t => { if (t.type === 'expense' && !allCategories.includes(t.category)) allCategories.push(t.category) })

  const isCustomCategory = formData.category === '__custom__'

  // Emergency Fund Strategy State
  const [isCrisisMode, setIsCrisisMode] = useState(false)
  const [efStrategy, setEfStrategy] = useState({
    liquidSavings: emergencyFund?.current || 0,
    housing: 1200,
    food: 400,
    transport: 300,
    customMonths: emergencyFund?.targetMonths || 6
  })

  // ── Period Helpers ──
  const getPeriodRange = (date, period) => {
    const d = new Date(date)
    if (period === 'daily') {
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate())
      const end = new Date(start); end.setDate(end.getDate() + 1)
      return { start, end }
    }
    if (period === 'weekly') {
      const day = d.getDay()
      const start = new Date(d); start.setDate(d.getDate() - day); start.setHours(0, 0, 0, 0)
      const end = new Date(start); end.setDate(end.getDate() + 7)
      return { start, end }
    }
    if (period === 'monthly') {
      const start = new Date(d.getFullYear(), d.getMonth(), 1)
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1)
      return { start, end }
    }
    return null // 'all'
  }

  const shiftPeriod = (dir) => {
    const d = new Date(periodDate)
    if (periodFilter === 'daily') d.setDate(d.getDate() + dir)
    else if (periodFilter === 'weekly') d.setDate(d.getDate() + (dir * 7))
    else if (periodFilter === 'monthly') d.setMonth(d.getMonth() + dir)
    setPeriodDate(d)
  }

  const getPeriodLabel = () => {
    const d = periodDate
    if (periodFilter === 'all') return 'All Time'
    if (periodFilter === 'daily') return d.toLocaleDateString('en-SG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    if (periodFilter === 'weekly') {
      const range = getPeriodRange(d, 'weekly')
      const fmt = { day: 'numeric', month: 'short' }
      return `${range.start.toLocaleDateString('en-SG', fmt)} – ${new Date(range.end - 1).toLocaleDateString('en-SG', fmt)}`
    }
    if (periodFilter === 'monthly') return d.toLocaleDateString('en-SG', { month: 'long', year: 'numeric' })
    return ''
  }

  const filteredTransactions = useMemo(() => {
    if (periodFilter === 'all') return transactions
    const range = getPeriodRange(periodDate, periodFilter)
    if (!range) return transactions
    return transactions.filter(t => {
      const td = new Date(t.date)
      return td >= range.start && td < range.end
    })
  }, [transactions, periodFilter, periodDate])

  // ── Computed Values ──
  const totalIncome = useMemo(() =>
    transactions.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0),
    [transactions]
  )

  const totalExpenses = useMemo(() =>
    transactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0),
    [transactions]
  )

  const totalBudget = useMemo(() =>
    budgets.reduce((s, b) => s + parseFloat(b.amount), 0),
    [budgets]
  )

  const calculateSpent = (cat) => filteredTransactions
    .filter(t => t.type === 'expense' && t.category === cat)
    .reduce((s, t) => s + parseFloat(t.amount), 0)

  const totalSpent = useMemo(() =>
    budgets.reduce((s, b) => s + calculateSpent(b.category), 0),
    [budgets, filteredTransactions]
  )

  const spentPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  // ── Emergency Fund Calculations ──
  const chartData = useMemo(() => {
    if (emergencyFund.history && emergencyFund.history.length > 1) {
      return emergencyFund.history
    }
    return [
      { month: 'Start', balance: 0 },
      { month: new Date().toLocaleDateString('en-US', { month: 'short' }), balance: emergencyFund.current }
    ]
  }, [emergencyFund.history, emergencyFund.current])

  const monthlySurvival = useMemo(() => {
    const total = (parseFloat(efStrategy.housing) || 0) +
      (parseFloat(efStrategy.food) || 0) +
      (parseFloat(efStrategy.transport) || 0)
    return isCrisisMode ? total * 0.8 : total
  }, [efStrategy, isCrisisMode])

  const monthsCovered = (parseFloat(efStrategy.liquidSavings) || 0) / (monthlySurvival || 1)
  const targetAmount = monthlySurvival * (parseFloat(efStrategy.customMonths) || 1)
  const statusInfo = getEmergencyStatus(monthsCovered, parseFloat(efStrategy.customMonths))
  const efPercent = Math.min(((emergencyFund?.current || 0) / (emergencyFund?.target || 1)) * 100, 100)

  // ── Financial Health Score ──
  const healthScore = useMemo(() => {
    const criteria = []

    // 1. Positive monthly savings
    const savingsPositive = totalIncome > totalExpenses
    criteria.push({ label: 'Positive monthly savings', pass: savingsPositive })

    // 2. Savings rate ≥ 30%
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0
    criteria.push({ label: 'Savings rate ≥ 30%', pass: savingsRate >= 30 })

    // 3. Emergency fund ≥ 3 months
    const efMonths = emergencyFund?.target > 0
      ? (emergencyFund.current / (emergencyFund.target / (emergencyFund.targetMonths || 6)))
      : 0
    criteria.push({ label: 'Emergency fund (3mo+)', pass: efMonths >= 3 })

    // 4. Has active savings goals
    criteria.push({ label: 'Active savings goals', pass: savingsGoals.length > 0 })

    // 5. Budget adherence
    const overBudgetCount = budgets.filter(b => calculateSpent(b.category) > b.amount).length
    criteria.push({ label: 'Budget adherence', pass: budgets.length > 0 && overBudgetCount === 0 })

    const score = criteria.filter(c => c.pass).length
    const total = criteria.length

    let level = 'poor'
    if (score >= 5) level = 'excellent'
    else if (score >= 4) level = 'good'
    else if (score >= 2) level = 'fair'

    const levelLabels = {
      excellent: 'Excellent',
      good: 'Good',
      fair: 'Fair',
      poor: 'Needs Work'
    }

    return { score, total, criteria, level, levelLabel: levelLabels[level] }
  }, [totalIncome, totalExpenses, emergencyFund, savingsGoals, budgets, transactions])

  // ── Handlers ──
  const openEFEditor = () => {
    setEfStrategy({
      ...efStrategy,
      liquidSavings: emergencyFund.current,
      customMonths: emergencyFund.targetMonths || 6
    })
    setShowEFForm(true)
  }

  const handleEFSave = (e) => {
    e.preventDefault()
    onUpdateEmergencyFund({
      current: parseFloat(efStrategy.liquidSavings),
      target: targetAmount,
      targetMonths: parseFloat(efStrategy.customMonths),
      lastUpdated: new Date().toISOString()
    })
    setShowEFForm(false)
  }

  const handleBudgetSubmit = (e) => {
    e.preventDefault()
    const finalCategory = isCustomCategory ? formData.customCategory : formData.category
    if (!finalCategory || !formData.amount) return

    if (isCustomCategory && formData.customCategory.trim()) {
      if (onAddCustomCategory) onAddCustomCategory(formData.customCategory.trim())
    }

    const payload = {
      category: finalCategory,
      amount: parseFloat(formData.amount),
      period: formData.period
    }
    if (editingBudget) {
      onUpdateBudget(editingBudget.id, payload)
    } else {
      onAddBudget(payload)
    }
    setFormData({ category: '', customCategory: '', amount: '', period: 'monthly' })
    setEditingBudget(null)
    setShowForm(false)
  }

  // ── TAB: Overview ──
  const renderOverview = () => (
    <>
      {/* Period Filter Bar */}
      <div className="period-filter-bar">
        <div className="period-pills">
          {['all', 'monthly', 'weekly', 'daily'].map(p => (
            <button
              key={p}
              className={`period-pill ${periodFilter === p ? 'active' : ''}`}
              onClick={() => { setPeriodFilter(p); setPeriodDate(new Date()) }}
            >
              {p === 'all' ? '📅 All Time' : p === 'monthly' ? '📆 Monthly' : p === 'weekly' ? '📋 Weekly' : '📌 Daily'}
            </button>
          ))}
        </div>
        {periodFilter !== 'all' && (
          <div className="period-nav">
            <button className="period-nav-btn" onClick={() => shiftPeriod(-1)}>◀</button>
            <span className="period-label">{getPeriodLabel()}</span>
            <button className="period-nav-btn" onClick={() => shiftPeriod(1)}>▶</button>
          </div>
        )}
        {periodFilter === 'all' && (
          <span className="period-label" style={{ fontSize: '0.85rem' }}>{getPeriodLabel()}</span>
        )}
      </div>

      {/* Budget Summary Hero */}
      <div className="budget-hero">
        <div className="hero-card total-budget">
          <div className="hero-label"><span>📊</span> Total Budget</div>
          <div className="hero-amount">${formatMoney(totalBudget)}</div>
          <div className="hero-bar">
            <div className="hero-bar-fill safe" style={{ width: '100%' }} />
          </div>
          <div className="hero-pct">{budgets.length} categories</div>
        </div>

        <div className="hero-card total-spent">
          <div className="hero-label"><span>💸</span> Spent ({getPeriodLabel()})</div>
          <div className="hero-amount">${formatMoney(totalSpent)}</div>
          <div className="hero-bar">
            <div
              className={`hero-bar-fill ${spentPct > 100 ? 'danger' : spentPct > 75 ? 'warning' : 'safe'}`}
              style={{ width: `${Math.min(spentPct, 100)}%` }}
            />
          </div>
          <div className="hero-pct">{spentPct.toFixed(1)}% of budget</div>
        </div>

        <div className="hero-card remaining">
          <div className="hero-label"><span>💰</span> Remaining</div>
          <div className={`hero-amount ${(totalBudget - totalSpent) >= 0 ? 'positive' : 'negative'}`}>
            ${formatMoney(Math.abs(totalBudget - totalSpent))}
            {(totalBudget - totalSpent) < 0 && ' over'}
          </div>
          <div className="hero-bar">
            <div
              className={`hero-bar-fill ${(totalBudget - totalSpent) >= 0 ? 'safe' : 'danger'}`}
              style={{ width: `${Math.min(Math.max(100 - spentPct, 0), 100)}%` }}
            />
          </div>
          <div className="hero-pct">
            {(totalBudget - totalSpent) >= 0 ? 'Under budget ✓' : 'Over budget ⚠'}
          </div>
        </div>
      </div>

      {/* Category Budgets */}
      <div className="section-header">
        <h2><span className="section-icon">📂</span> Category Budgets</h2>
        <button className="btn btn-primary" onClick={() => { setEditingBudget(null); setFormData({ category: '', customCategory: '', amount: '', period: 'monthly' }); setShowForm(true) }}>
          + Add Category
        </button>
      </div>

      {budgets.length === 0 ? (
        <div className="budget-empty">
          <div className="budget-empty-icon">📂</div>
          <p>No budget categories yet. Add your first to start tracking spending.</p>
        </div>
      ) : (
        <div className="category-grid">
          {budgets.map(budget => {
            const spent = calculateSpent(budget.category)
            const rem = budget.amount - spent
            const perc = (spent / budget.amount) * 100
            const style = getCategoryStyle(budget.category)
            return (
              <div key={budget.id} className="cat-card" style={{ '--cat-color': style.color }}>
                <div className="cat-card-header">
                  <div className="cat-card-title">
                    <div className="cat-icon">{style.icon}</div>
                    <div>
                      <span className="cat-name">{budget.category}</span>
                      {budget.createdAt && (
                        <div className="cat-created">Created {new Date(budget.createdAt).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      )}
                    </div>
                  </div>
                  <div className="cat-card-actions">
                    <button onClick={() => {
                      const categoryInList = allCategories.includes(budget.category)
                      setEditingBudget(budget)
                      setFormData({
                        category: categoryInList ? budget.category : '__custom__',
                        customCategory: categoryInList ? '' : budget.category,
                        amount: budget.amount.toString(),
                        period: budget.period || 'monthly'
                      })
                      setShowForm(true)
                    }} title="Edit">✏️</button>
                    <button onClick={() => onDeleteBudget(budget.id)} title="Delete">🗑️</button>
                  </div>
                </div>
                <div className="cat-amounts">
                  <div className="cat-amt-item">
                    <span className="cat-amt-label">Budget</span>
                    <span className="cat-amt-value">${formatMoney(budget.amount)}</span>
                  </div>
                  <div className="cat-amt-item">
                    <span className="cat-amt-label">Spent ({periodFilter === 'all' ? 'total' : getPeriodLabel()})</span>
                    <span className={`cat-amt-value ${spent > budget.amount ? 'over' : ''}`}>${formatMoney(spent)}</span>
                  </div>
                </div>
                <div className="cat-progress">
                  <div className="cat-bar">
                    <div className={`cat-bar-fill ${perc > 100 ? 'over' : ''}`} style={{ width: `${Math.min(perc, 100)}%` }} />
                  </div>
                  <span className={`cat-pct ${perc > 100 ? 'over' : ''}`}>{perc.toFixed(0)}%</span>
                </div>
                {rem < 0 && (
                  <div style={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: 600, marginTop: '8px' }}>
                    ⚠ Over by ${formatMoney(Math.abs(rem))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )
      }
    </>
  )

  // ── TAB: Goals ──
  const renderGoals = () => (
    <>
      {/* Savings Goals (rich component) */}
      <SavingsGoals
        goals={savingsGoals}
        onAddGoal={onAddGoal}
        onUpdateGoal={onUpdateGoal}
        onDeleteGoal={onDeleteGoal}
        totalIncome={totalIncome}
      />

      {/* Financial Health Score */}
      <div className="health-score-section">
        <div className="section-header" style={{ marginBottom: '0.75rem' }}>
          <h2><span className="section-icon">❤️</span> Financial Health Score</h2>
        </div>

        <div className="health-score-header">
          <div className="health-score-display">
            <span className="health-score-num" style={{
              color: healthScore.level === 'excellent' ? '#22c55e' :
                healthScore.level === 'good' ? '#3b82f6' :
                  healthScore.level === 'fair' ? '#d97706' : '#ef4444'
            }}>
              {healthScore.score}
            </span>
            <span className="health-score-den">/{healthScore.total}</span>
          </div>
          <span className={`health-label ${healthScore.level}`}>{healthScore.levelLabel}</span>
        </div>

        <div className="health-bar">
          <div
            className={`health-bar-fill ${healthScore.level}`}
            style={{ width: `${(healthScore.score / healthScore.total) * 100}%` }}
          />
        </div>

        <div className="health-criteria">
          {healthScore.criteria.map((c, i) => (
            <div key={i} className="health-criterion">
              <div className={`health-dot ${c.pass ? 'pass' : 'fail'}`} />
              <span>{c.label}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )

  // ── TAB: Safety Net ──
  const renderSafetyNet = () => (
    <>
      <div className="section-header">
        <h2><span className="section-icon">🏦</span> Emergency Fund</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {emergencyFund.lastUpdated && (
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
              Last Sync: {new Date(emergencyFund.lastUpdated).toLocaleDateString()}
            </span>
          )}
          <button className="btn btn-primary" onClick={openEFEditor}>Update Fund</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {/* Main Stats Card */}
        <div className="budget-card">
          <div className="budget-card-header">
            <h3>🛡️ Safety Net</h3>
            <span className="period-badge" style={{ background: 'var(--color-primary)', color: 'white' }}>
              {emergencyFund?.targetMonths || 6} Months Goal
            </span>
          </div>

          <div className="budget-amounts">
            <div className="amount-row">
              <span>Current Progress:</span>
              <strong>${formatMoney(emergencyFund.current)} / ${formatMoney(emergencyFund.target)}</strong>
            </div>
          </div>

          <div className="progress-container">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${efPercent}%`, background: 'var(--color-primary)' }} />
            </div>
            <span className="percentage">{efPercent.toFixed(1)}%</span>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '10px' }}>
            {efPercent >= 100
              ? "✅ Fully Funded! You're financially bulletproof."
              : `Gap: $${formatMoney(emergencyFund.target - emergencyFund.current)} remaining.`}
          </p>
        </div>

        {/* Growth Chart */}
        <div className="budget-card" style={{ height: '260px' }}>
          <h4 style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '15px', letterSpacing: '0.5px' }}>
            FUND GROWTH HISTORY
          </h4>
          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorProg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <YAxis hide domain={[0, 'auto']} />
              <Tooltip formatter={(value) => [`$${formatMoney(value)}`, 'Balance']} />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="var(--color-primary)"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorProg)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  )

  return (
    <div className="budget">
      {/* Page Header + Tabs */}
      <div className="budget-page-header">
        <h1>Budget & Goals</h1>
        <div className="budget-tabs">
          <button className={`budget-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            <span className="tab-icon">📊</span> Overview
          </button>
          <button className={`budget-tab ${activeTab === 'goals' ? 'active' : ''}`} onClick={() => setActiveTab('goals')}>
            <span className="tab-icon">🎯</span> Goals
          </button>
          <button className={`budget-tab ${activeTab === 'safety' ? 'active' : ''}`} onClick={() => setActiveTab('safety')}>
            <span className="tab-icon">🛡️</span> Safety Net
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'goals' && renderGoals()}
      {activeTab === 'safety' && renderSafetyNet()}

      {/* ── BUDGET FORM MODAL ── */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content modal-narrow" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingBudget ? 'Edit Budget' : 'New Budget Category'}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleBudgetSubmit}>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  required
                  disabled={!!editingBudget}
                >
                  <option value="">Select category</option>
                  {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="__custom__">＋ Add my own…</option>
                </select>
              </div>

              {isCustomCategory && (
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label>Custom Category</label>
                  <input type="text" placeholder="e.g. Pet Care"
                    value={formData.customCategory}
                    disabled={!!editingBudget}
                    onChange={e => setFormData({ ...formData, customCategory: e.target.value })} required />
                </div>
              )}
              <div className="form-row" style={{ marginTop: '1rem' }}>
                <div className="form-group">
                  <label>Monthly Budget ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="500"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Period</label>
                  <select value={formData.period} onChange={e => setFormData({ ...formData, period: e.target.value })}>
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editingBudget ? 'Save Changes' : 'Create Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EMERGENCY FUND STRATEGY MODAL ── */}
      {showEFForm && (
        <div className="modal-overlay" onClick={() => setShowEFForm(false)}>
          <div className="modal-content" style={{ maxWidth: '950px', width: '95%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Strategize Safety Net</h2>
              <button className="modal-close" onClick={() => setShowEFForm(false)}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 300px', gap: '25px' }}>
              {/* TIPS COLUMN */}
              <div style={{ background: 'var(--color-surface-alt)', padding: '20px', borderRadius: '12px', fontSize: '0.8rem', border: '1px solid var(--color-border)' }}>
                <h4 style={{ color: 'var(--color-primary)', marginBottom: '12px' }}>💡 STRATEGY TIPS</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', color: 'var(--color-text-secondary)' }}>
                  <p><strong>1. Starter Fund:</strong> Aim for $1k first to cover immediate minor repairs.</p>
                  <p><strong>2. Bare Essentials:</strong> Only include "must-pays" in Part B. Luxury can wait during a crisis.</p>
                  <p><strong>3. Risk Level:</strong> Set higher months (9-12) if you are self-employed or have dependents.</p>
                </div>
              </div>

              {/* INPUTS COLUMN */}
              <div style={{ borderRight: '1px solid var(--color-border)', paddingRight: '15px' }}>
                <section style={{ marginBottom: '20px' }}>
                  <h4 style={{ color: 'var(--color-primary)', fontSize: '0.75rem', marginBottom: '10px' }}>PART A: LIQUID SAVINGS</h4>
                  <input type="number" className="form-input" value={efStrategy.liquidSavings} onChange={e => setEfStrategy({ ...efStrategy, liquidSavings: e.target.value })} />
                </section>

                <section style={{ marginBottom: '20px' }}>
                  <h4 style={{ color: 'var(--color-primary)', fontSize: '0.75rem', marginBottom: '10px' }}>PART B: SURVIVAL BUDGET</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ fontSize: '0.7rem' }}>Housing/Utilities</label>
                    <input type="number" className="form-input" value={efStrategy.housing} onChange={e => setEfStrategy({ ...efStrategy, housing: e.target.value })} />
                    <label style={{ fontSize: '0.7rem' }}>Food/Groceries</label>
                    <input type="number" className="form-input" value={efStrategy.food} onChange={e => setEfStrategy({ ...efStrategy, food: e.target.value })} />
                    <label style={{ fontSize: '0.7rem' }}>Bills/Transport</label>
                    <input type="number" className="form-input" value={efStrategy.transport} onChange={e => setEfStrategy({ ...efStrategy, transport: e.target.value })} />
                  </div>
                </section>

                <section>
                  <h4 style={{ color: 'var(--color-primary)', fontSize: '0.75rem', marginBottom: '10px' }}>PART C: COVERAGE GOAL</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input type="number" className="form-input" style={{ width: '70px' }} value={efStrategy.customMonths} onChange={e => setEfStrategy({ ...efStrategy, customMonths: e.target.value })} />
                    <span>Months</span>
                  </div>
                </section>
              </div>

              {/* RESULTS COLUMN */}
              <div style={{ background: 'var(--color-surface-alt)', padding: '25px', borderRadius: '12px', borderLeft: `6px solid ${statusInfo.color}`, border: '1px solid var(--color-border)' }}>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '3rem' }}>{statusInfo.icon}</span>
                  <h3 style={{ color: statusInfo.color }}>{statusInfo.status}</h3>
                  <p><strong>{monthsCovered.toFixed(1)} months</strong> covered</p>
                </div>
                <div className="progress-bar" style={{ margin: '15px 0' }}>
                  <div className="progress-fill" style={{ width: `${Math.min((monthsCovered / (efStrategy.customMonths || 1)) * 100, 100)}%`, background: statusInfo.color }} />
                </div>
                <div style={{ fontSize: '0.8rem', background: 'var(--color-surface)', padding: '10px', borderRadius: '8px' }}>
                  <strong>Goal: ${formatMoney(targetAmount)}</strong><br />
                  <small>{statusInfo.advice}</small>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '15px', fontSize: '0.8rem' }}>
                  <input type="checkbox" checked={isCrisisMode} onChange={() => setIsCrisisMode(!isCrisisMode)} />
                  Crisis Mode (-20%)
                </label>
              </div>
            </div>

            <div className="form-actions" style={{ marginTop: '20px', borderTop: '1px solid var(--color-border)', paddingTop: '15px' }}>
              <button type="button" onClick={() => setShowEFForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" onClick={handleEFSave}>Lock In Strategy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Budget