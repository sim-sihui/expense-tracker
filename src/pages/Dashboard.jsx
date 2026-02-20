import { useState, useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { formatMoney } from '../utils/formatMoney'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const Dashboard = ({ transactions, budgets }) => {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)

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

  // Get all unique years from transactions
  const availableYears = useMemo(() => {
    const years = new Set()
    years.add(currentYear) // always include current year
    transactions.forEach(t => {
      const d = new Date(t.date)
      if (!isNaN(d)) years.add(d.getFullYear())
    })
    return [...years].sort((a, b) => b - a)
  }, [transactions, currentYear])

  // Monthly expense + income totals for the selected year
  const monthlyData = useMemo(() => {
    const expenses = new Array(12).fill(0)
    const incomes = new Array(12).fill(0)

    transactions.forEach(t => {
      const d = new Date(t.date)
      if (isNaN(d) || d.getFullYear() !== selectedYear) return
      const m = d.getMonth()
      if (t.type === 'expense') expenses[m] += parseFloat(t.amount)
      else if (t.type === 'income') incomes[m] += parseFloat(t.amount)
    })

    return { expenses, incomes }
  }, [transactions, selectedYear])

  const annualExpense = monthlyData.expenses.reduce((a, b) => a + b, 0)
  const annualIncome = monthlyData.incomes.reduce((a, b) => a + b, 0)

  const chartData = {
    labels: MONTH_LABELS,
    datasets: [
      {
        label: 'Income',
        data: monthlyData.incomes,
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
        borderColor: '#22c55e',
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: 'Expenses',
        data: monthlyData.expenses,
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        borderColor: '#ef4444',
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: { size: 13, weight: '600', family: 'Inter' },
          color: '#94a3b8',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleFont: { size: 13, family: 'Inter' },
        bodyFont: { size: 12, family: 'Inter' },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: $${ctx.parsed.y.toFixed(2)}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(150, 150, 150, 0.1)' },
        ticks: {
          callback: (v) => `$${v}`,
          font: { size: 11, family: 'Inter' },
          color: '#94a3b8',
        },
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 12, weight: '500', family: 'Inter' }, color: '#94a3b8' },
      },
    },
  }

  const recentTransactions = [...transactions]
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

      {/* ── Monthly Spending Chart ── */}
      <div className="chart-section">
        <div className="chart-header">
          <h2>Monthly Overview</h2>
          <select
            className="year-selector"
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
          >
            {availableYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="chart-wrapper">
          <Bar data={chartData} options={chartOptions} />
        </div>
        <div className="annual-totals">
          <div className="annual-total-item income">
            <span>Annual Income</span>
            <strong>${annualIncome.toFixed(2)}</strong>
          </div>
          <div className="annual-total-item expense">
            <span>Annual Expenses</span>
            <strong>${annualExpense.toFixed(2)}</strong>
          </div>
          <div className={`annual-total-item ${annualIncome - annualExpense >= 0 ? 'positive' : 'negative'}`}>
            <span>Net</span>
            <strong>${(annualIncome - annualExpense).toFixed(2)}</strong>
          </div>
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
