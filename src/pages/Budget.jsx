import { useState } from 'react'
import { formatMoney } from '../utils/formatMoney'

const Budget = ({ budgets, transactions, onAddBudget, onUpdateBudget, onDeleteBudget }) => {
  const [showForm, setShowForm] = useState(false)
  const [editingBudget, setEditingBudget] = useState(null)
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    period: 'monthly'
  })

  const categories = [
    'Food & Dining', 'Transportation', 'Shopping', 'Entertainment',
    'Bills & Utilities', 'Healthcare', 'Travel', 'Education', 'Other'
  ]

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.category || !formData.amount) return

    const budgetData = {
      ...formData,
      amount: parseFloat(formData.amount)
    }

    if (editingBudget) {
      onUpdateBudget(editingBudget.id, budgetData)
      setEditingBudget(null)
    } else {
      onAddBudget(budgetData)
    }

    setFormData({ category: '', amount: '', period: 'monthly' })
    setShowForm(false)
  }

  const handleEdit = (budget) => {
    setEditingBudget(budget)
    setFormData({
      category: budget.category,
      amount: budget.amount.toString(),
      period: budget.period
    })
    setShowForm(true)
  }

  const calculateSpent = (category) => {
    return transactions
      .filter(t => t.type === 'expense' && t.category === category)
      .reduce((sum, t) => sum + parseFloat(t.amount), 0)
  }

  return (
    <div className="budget">
      <div className="budget-header">
        <h1>Budget Management</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          Add Budget
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{editingBudget ? 'Edit Budget' : 'Add New Budget'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Budget Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Period</label>
                <select
                  value={formData.period}
                  onChange={e => setFormData({ ...formData, period: e.target.value })}
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => {
                  setShowForm(false)
                  setEditingBudget(null)
                  setFormData({ category: '', amount: '', period: 'monthly' })
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingBudget ? 'Update Budget' : 'Add Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="budget-list">
        {budgets.length > 0 ? (
          budgets.map(budget => {
            const spent = calculateSpent(budget.category)
            const remaining = budget.amount - spent
            const percentage = (spent / budget.amount) * 100

            return (
              <div key={budget.id} className="budget-card">
                <div className="budget-card-header">
                  <h3>{budget.category}</h3>
                  <div className="budget-actions">
                    <button onClick={() => handleEdit(budget)}>Edit</button>
                    <button
                      onClick={() => onDeleteBudget(budget.id)}
                      className="delete-btn"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="budget-amounts">
                  <div className="amount-row">
                    <span>Budget:</span>
                    <span>${formatMoney(budget.amount)}</span>
                  </div>
                  <div className="amount-row">
                    <span>Spent:</span>
                    <span className={spent > budget.amount ? 'over-budget' : ''}>
                      ${formatMoney(spent)}
                    </span>
                  </div>
                  <div className="amount-row">
                    <span>Remaining:</span>
                    <span className={remaining < 0 ? 'over-budget' : 'remaining'}>
                      ${formatMoney(remaining)}
                    </span>
                  </div>
                </div>

                <div className="progress-container">
                  <div className="progress-bar">
                    <div
                      className={`progress-fill ${percentage > 100 ? 'over-budget' : ''}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                  </div>
                  <span className="percentage">{percentage.toFixed(1)}%</span>
                </div>

                <div className="period-info">
                  <span className="period-badge">{budget.period}</span>
                  {percentage > 100 && (
                    <span className="over-budget-warning">
                      Over budget by ${formatMoney(spent - budget.amount)}
                    </span>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          <div className="empty-state">
            <p>No budgets set yet. Create your first budget to start tracking your spending!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Budget
