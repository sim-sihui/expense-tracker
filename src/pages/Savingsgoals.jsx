import { useState } from 'react'
import { formatMoney } from '../utils/formatMoney'

const GOAL_ICONS = ['✈️','🏠','🚗','💍','🎓','💻','👶','🌴','🏋️','🎸','🐾','🛥️','🎯','💎','🏖️']
const PRIORITY_LABELS = ['🔴 High', '🟡 Medium', '🟢 Low']

const emptyGoal = {
  name: '',
  icon: '✈️',
  targetAmount: '',
  currentAmount: '',
  deadline: '',
  incomePercent: '',
  priority: 1,
  color: '#60a5fa',
}

const COLORS = ['#60a5fa','#4ade80','#fb923c','#f472b6','#c084fc','#34d399','#fbbf24','#f87171']

const SavingsGoals = ({ goals = [], onAddGoal, onUpdateGoal, onDeleteGoal, totalIncome = 0 }) => {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState(emptyGoal)
  const [editingId, setEditingId] = useState(null)
  const [depositingId, setDepositingId] = useState(null)
  const [depositAmount, setDepositAmount] = useState('')

  const set = (k, v) => setFormData(p => ({ ...p, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      ...formData,
      targetAmount: parseFloat(formData.targetAmount),
      currentAmount: parseFloat(formData.currentAmount) || 0,
      incomePercent: parseFloat(formData.incomePercent) || 0,
      priority: parseInt(formData.priority),
    }
    if (editingId !== null) {
      onUpdateGoal(editingId, payload)
    } else {
      onAddGoal(payload)
    }
    setFormData(emptyGoal)
    setEditingId(null)
    setShowForm(false)
  }

  const openEdit = (g) => {
    setFormData({
      name: g.name,
      icon: g.icon || '✈️',
      targetAmount: String(g.targetAmount),
      currentAmount: String(g.currentAmount || 0),
      deadline: g.deadline || '',
      incomePercent: String(g.incomePercent || ''),
      priority: g.priority ?? 1,
      color: g.color || '#60a5fa',
    })
    setEditingId(g.id)
    setShowForm(true)
  }

  const handleDeposit = (g) => {
    const amt = parseFloat(depositAmount)
    if (!amt || amt <= 0) return
    onUpdateGoal(g.id, { ...g, currentAmount: (g.currentAmount || 0) + amt })
    setDepositingId(null)
    setDepositAmount('')
  }

  const sortedGoals = [...goals].sort((a, b) => (a.priority ?? 1) - (b.priority ?? 1))

  const monthsLeft = (deadline) => {
    if (!deadline) return null
    const now = new Date()
    const d = new Date(deadline)
    const months = (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth())
    return months > 0 ? months : 0
  }

  return (
    <div className="savings-goals">
      <div className="sg-header">
        <div>
          <h3 className="sg-title">🎯 Savings Goals</h3>
          <p className="sg-subtitle">{goals.length} goal{goals.length !== 1 ? 's' : ''} tracked</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setFormData(emptyGoal); setEditingId(null); setShowForm(true) }}>
          + Add Goal
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content modal-narrow" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId !== null ? 'Edit Goal' : 'New Savings Goal'}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              {/* Icon picker */}
              <div className="form-group">
                <label>Icon</label>
                <div className="icon-picker">
                  {GOAL_ICONS.map(ic => (
                    <button key={ic} type="button"
                      className={`icon-opt ${formData.icon === ic ? 'icon-selected' : ''}`}
                      onClick={() => set('icon', ic)}>{ic}</button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div className="form-group">
                <label>Color</label>
                <div className="color-picker">
                  {COLORS.map(c => (
                    <button key={c} type="button"
                      className={`color-opt ${formData.color === c ? 'color-selected' : ''}`}
                      style={{ background: c }}
                      onClick={() => set('color', c)} />
                  ))}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group form-group-full">
                  <label>Goal Name</label>
                  <input type="text" placeholder="e.g. Japan Trip 2026"
                    value={formData.name} onChange={e => set('name', e.target.value)} required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Target Amount ($)</label>
                  <input type="number" min="0" step="0.01" placeholder="5000"
                    value={formData.targetAmount} onChange={e => set('targetAmount', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Already Saved ($)</label>
                  <input type="number" min="0" step="0.01" placeholder="0"
                    value={formData.currentAmount} onChange={e => set('currentAmount', e.target.value)} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Deadline <span className="label-optional">(optional)</span></label>
                  <input type="date" value={formData.deadline}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => set('deadline', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select value={formData.priority} onChange={e => set('priority', e.target.value)}>
                    <option value={0}>🔴 High</option>
                    <option value={1}>🟡 Medium</option>
                    <option value={2}>🟢 Low</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Auto-contribute % of income <span className="label-optional">(optional)</span></label>
                <div className="pct-input-row">
                  <input type="number" min="0" max="100" step="0.5" placeholder="e.g. 5"
                    value={formData.incomePercent} onChange={e => set('incomePercent', e.target.value)} />
                  <span className="pct-suffix">%</span>
                  {formData.incomePercent && totalIncome > 0 && (
                    <span className="pct-amount">= ${formatMoney(totalIncome * parseFloat(formData.incomePercent) / 100)}/mo</span>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editingId !== null ? 'Save Changes' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="sg-grid">
        {sortedGoals.length === 0 && (
          <div className="empty-state">
            <p>No savings goals yet. Add your first goal to get started!</p>
          </div>
        )}
        {sortedGoals.map(g => {
          const pct = Math.min(100, ((g.currentAmount || 0) / g.targetAmount) * 100)
          const remaining = g.targetAmount - (g.currentAmount || 0)
          const ml = monthsLeft(g.deadline)
          const monthlyNeeded = ml > 0 ? remaining / ml : null
          const autoContrib = g.incomePercent && totalIncome > 0
            ? totalIncome * g.incomePercent / 100 : 0

          return (
            <div key={g.id} className="sg-card" style={{ '--goal-color': g.color || '#60a5fa' }}>
              <div className="sg-card-top">
                <div className="sg-card-icon-wrap">
                  <span className="sg-card-icon">{g.icon || '🎯'}</span>
                </div>
                <div className="sg-priority-badge">
                  {g.priority === 0 ? '🔴' : g.priority === 2 ? '🟢' : '🟡'}
                </div>
                <div className="sg-card-actions">
                  <button onClick={() => openEdit(g)}>✏️</button>
                  <button onClick={() => onDeleteGoal(g.id)}>🗑️</button>
                </div>
              </div>

              <div className="sg-card-name">{g.name}</div>
              <div className="sg-card-amounts">
                <span className="sg-current">${formatMoney(g.currentAmount || 0)}</span>
                <span className="sg-sep"> / </span>
                <span className="sg-target">${formatMoney(g.targetAmount)}</span>
              </div>

              <div className="sg-bar-track">
                <div className="sg-bar-fill" style={{ width: `${pct}%`, background: g.color || '#60a5fa' }} />
              </div>
              <div className="sg-pct-label">{pct.toFixed(1)}% saved</div>

              <div className="sg-meta">
                {g.deadline && (
                  <div className="sg-meta-chip">
                    📅 {ml !== null ? (ml > 0 ? `${ml}mo left` : 'Deadline passed') : new Date(g.deadline).toLocaleDateString('en-SG', { month: 'short', year: 'numeric' })}
                  </div>
                )}
                {monthlyNeeded > 0 && (
                  <div className="sg-meta-chip">
                    💸 ${formatMoney(monthlyNeeded)}/mo needed
                  </div>
                )}
                {autoContrib > 0 && (
                  <div className="sg-meta-chip sg-auto-chip">
                    🔄 ${formatMoney(autoContrib)}/mo auto
                  </div>
                )}
              </div>

              {/* Deposit */}
              {depositingId === g.id ? (
                <div className="sg-deposit-row">
                  <input type="number" min="0" step="0.01" placeholder="Amount"
                    value={depositAmount} onChange={e => setDepositAmount(e.target.value)}
                    autoFocus />
                  <button className="sg-deposit-confirm" onClick={() => handleDeposit(g)}>✓</button>
                  <button className="sg-deposit-cancel" onClick={() => { setDepositingId(null); setDepositAmount('') }}>✕</button>
                </div>
              ) : (
                <button className="sg-deposit-btn" onClick={() => setDepositingId(g.id)}>
                  + Add Savings
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default SavingsGoals