import { useState } from 'react'

const Transaction = ({ transactions, onAddTransaction, onDeleteTransaction }) => {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: '',
    description: ''
  })
  const [filter, setFilter] = useState('all')

  const categories = [
    'Food & Dining', 'Transportation', 'Shopping', 'Entertainment',
    'Bills & Utilities', 'Healthcare', 'Travel', 'Education', 'Salary',
    'Freelance', 'Investment', 'Other'
  ]

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.amount || !formData.category || !formData.description) return

    onAddTransaction({
      ...formData,
      amount: parseFloat(formData.amount)
    })

    setFormData({
      type: 'expense',
      amount: '',
      category: '',
      description: ''
    })
    setShowForm(false)
  }

  const filteredTransactions = transactions
    .filter(t => filter === 'all' || t.type === filter)
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="transaction">
      <div className="transaction-header">
        <h1>Transactions</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          Add Transaction
        </button>
      </div>

      <div className="transaction-summary">
        <div className="summary-card income">
          <h3>Total Income</h3>
          <p>${totalIncome.toFixed(2)}</p>
        </div>
        <div className="summary-card expense">
          <h3>Total Expenses</h3>
          <p>${totalExpenses.toFixed(2)}</p>
        </div>
        <div className={`summary-card balance ${totalIncome - totalExpenses >= 0 ? 'positive' : 'negative'}`}>
          <h3>Net Balance</h3>
          <p>${(totalIncome - totalExpenses).toFixed(2)}</p>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Add New Transaction</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Type</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>

              <div className="form-group">
                <label>Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  required
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="transaction-filters">
        <button 
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button 
          className={filter === 'income' ? 'active' : ''}
          onClick={() => setFilter('income')}
        >
          Income
        </button>
        <button 
          className={filter === 'expense' ? 'active' : ''}
          onClick={() => setFilter('expense')}
        >
          Expenses
        </button>
      </div>

      <div className="transaction-list">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map(transaction => (
            <div key={transaction.id} className={`transaction-item ${transaction.type}`}>
              <div className="transaction-info">
                <div className="transaction-main">
                  <span className="description">{transaction.description}</span>
                  <span className="category">{transaction.category}</span>
                </div>
                <span className="date">
                  {new Date(transaction.date).toLocaleDateString()}
                </span>
              </div>
              <div className="transaction-amount">
                <span className={`amount ${transaction.type}`}>
                  {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                </span>
                <button 
                  className="delete-btn"
                  onClick={() => onDeleteTransaction(transaction.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <p>No transactions found. Add your first transaction!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Transaction
