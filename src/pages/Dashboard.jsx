import { useMemo } from 'react'
import { formatMoney } from '../utils/formatMoney'

const Dashboard = ({ transactions, budgets }) => {
  const stats = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0)

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0)

    const balance = totalIncome - totalExpenses

    return { totalIncome, totalExpenses, balance }
  }, [transactions])

  const categoryExpenses = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense')
    const categoryTotals = {}

    expenses.forEach(expense => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + parseFloat(expense.amount)
    })

    return Object.entries(categoryTotals).map(([category, amount]) => ({
      category,
      amount,
      budget: budgets.find(b => b.category === category)?.amount || 0
    }))
  }, [transactions, budgets])

  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card income">
          <h3>Total Income</h3>
          <p className="amount">${formatMoney(stats.totalIncome)}</p>
        </div>

        <div className="stat-card expense">
          <h3>Total Expenses</h3>
          <p className="amount">${formatMoney(stats.totalExpenses)}</p>
        </div>

        <div className={`stat-card balance ${stats.balance >= 0 ? 'positive' : 'negative'}`}>
          <h3>Balance</h3>
          <p className="amount">${formatMoney(stats.balance)}</p>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="budget-overview">
          <h2>Budget Overview</h2>
          {categoryExpenses.length > 0 ? (
            <div className="budget-list">
              {categoryExpenses.map(({ category, amount, budget }) => (
                <div key={category} className="budget-item">
                  <div className="budget-header">
                    <span className="category">{category}</span>
                    <span className="amounts">
                      ${formatMoney(amount)} / ${formatMoney(budget)}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className={`progress-fill ${amount > budget ? 'over-budget' : ''}`}
                      style={{ width: `${Math.min((amount / budget) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="budget-status">
                    {amount > budget && (
                      <span className="over-budget-text">Over budget by ${formatMoney(amount - budget)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No expenses yet. Start adding transactions!</p>
          )}
        </div>

        <div className="recent-transactions">
          <h2>Recent Transactions</h2>
          {recentTransactions.length > 0 ? (
            <div className="transaction-list">
              {recentTransactions.map(transaction => (
                <div key={transaction.id} className={`transaction-item ${transaction.type}`}>
                  <div className="transaction-info">
                    <span className="description">{transaction.description}</span>
                    <span className="category">{transaction.category}</span>
                  </div>
                  <span className={`amount ${transaction.type}`}>
                    {transaction.type === 'income' ? '+' : '-'}${formatMoney(transaction.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p>No transactions yet. Add your first transaction!</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
