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
import EmergencyFund from './EmergencyFund';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const Dashboard = ({ transactions, budgets, emergencyFund }) => {
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

  // Calculate Emergency Fund Progress
  const efPercent = useMemo(() => {
    if (!emergencyFund || emergencyFund.target === 0) return 0;
    return Math.min((emergencyFund.current / emergencyFund.target) * 100, 100);
  }, [emergencyFund]);

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

  const availableYears = useMemo(() => {
    const years = new Set()
    years.add(currentYear)
    transactions.forEach(t => {
      const d = new Date(t.date)
      if (!isNaN(d)) years.add(d.getFullYear())
    })
    return [...years].sort((a, b) => b - a)
  }, [transactions, currentYear])

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
      },
      {
        label: 'Expenses',
        data: monthlyData.expenses,
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        borderColor: '#ef4444',
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#94a3b8', font: { family: 'Inter' } },
      },
    },
    scales: {
      y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(150, 150, 150, 0.1)' } },
      x: { ticks: { color: '#94a3b8' }, grid: { display: false } },
    },
  }

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)

  return (
    <div className="dashboard">
      <div className="dashboard-header-flex">
        <h1>Dashboard</h1>
      </div>

      {/* ── NEW: EMERGENCY FUND TOP SECTION ── */}
      <div className="ef-hero-section" style={{
        background: 'var(--color-bg-secondary)',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '24px',
        border: '1px solid var(--color-border)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>🛡️ Emergency Fund Progress</h3>
          <span style={{ fontWeight: '600', color: 'var(--color-primary)' }}>
            ${formatMoney(emergencyFund?.current || 0)} / ${formatMoney(emergencyFund?.target || 0)}
          </span>
        </div>

        <div className="progress-bar" style={{ height: '12px', backgroundColor: 'var(--color-border)' }}>
          <div
            className="progress-fill"
            style={{
              width: `${efPercent}%`,
              backgroundColor: 'var(--color-primary)',
              boxShadow: '0 0 10px rgba(var(--color-primary-rgb), 0.3)'
            }}
          ></div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            {efPercent.toFixed(1)}% of safety net reached
          </span>
          {efPercent < 100 && (
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              ${formatMoney(emergencyFund.target - emergencyFund.current)} remaining
            </span>
          )}
        </div>
      </div>

      {/* ── STATS GRID ── */}
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

      {/* ── CHARTS AND CONTENT ── */}
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
                </div>
              ))}
            </div>
          ) : (
            <p>No expenses yet.</p>
          )}
        </div>

        <div className="recent-transactions">
          <h2>Recent Transactions</h2>
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
        </div>
      </div>
    </div>
  )
}


export default Dashboard