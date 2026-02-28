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
import './Dashboard.css'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const Dashboard = ({ transactions = [], budgets = [], emergencyFund, cpfData = {}, insurancePolicies = [], investments = [] }) => {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()

  const stats = useMemo(() => {
    let incomeThisMonth = 0
    let expenseThisMonth = 0

    transactions.forEach(t => {
      const d = new Date(t.date)
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        if (t.type === 'income') incomeThisMonth += parseFloat(t.amount)
        if (t.type === 'expense') expenseThisMonth += parseFloat(t.amount)
      }
    })

    const netSavings = incomeThisMonth - expenseThisMonth
    const savingsRate = incomeThisMonth > 0 ? (netSavings / incomeThisMonth) * 100 : 0

    const cpfTotal = (cpfData?.oa || 0) + (cpfData?.sa || 0) + (cpfData?.ma || 0)

    const investmentsTotal = investments.reduce((sum, inv) => sum + (inv.currentValue || 0), 0)

    const insuranceTotal = insurancePolicies.reduce((sum, p) => sum + (p.annualPremium || 0), 0)

    const estimatedNetWorth = cpfTotal + investmentsTotal + netSavings

    return {
      incomeThisMonth,
      expenseThisMonth,
      netSavings,
      savingsRate,
      cpfTotal,
      investmentsTotal,
      investmentsCount: investments.length,
      insuranceTotal,
      insuranceCount: insurancePolicies.length,
      estimatedNetWorth
    }
  }, [transactions, currentYear, currentMonth, cpfData, investments, insurancePolicies])

  const monthlyData = useMemo(() => {
    // Last 6 months for chart
    const expenses = new Array(6).fill(0)
    const incomes = new Array(6).fill(0)
    const labels = new Array(6).fill('')

    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1)
      labels[5 - i] = SHORT_MONTHS[d.getMonth()]
    }

    transactions.forEach(t => {
      const d = new Date(t.date)
      const diffMonths = (currentYear - d.getFullYear()) * 12 + (currentMonth - d.getMonth())
      if (diffMonths >= 0 && diffMonths <= 5) {
        const idx = 5 - diffMonths
        if (t.type === 'expense') expenses[idx] += parseFloat(t.amount)
        else if (t.type === 'income') incomes[idx] += parseFloat(t.amount)
      }
    })

    return { labels, incomes, expenses }
  }, [transactions, currentYear, currentMonth])

  const chartData = {
    labels: monthlyData.labels,
    datasets: [
      {
        label: 'Income',
        data: monthlyData.incomes,
        backgroundColor: '#2dd4bf',
        borderRadius: 4,
        barPercentage: 0.6,
        categoryPercentage: 0.8,
      },
      {
        label: 'Expenses',
        data: monthlyData.expenses,
        backgroundColor: '#fb7185',
        borderRadius: 4,
        barPercentage: 0.6,
        categoryPercentage: 0.8,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        align: 'start',
        labels: {
          color: '#94a3b8',
          font: { family: 'Inter' },
          boxWidth: 12,
          boxHeight: 12,
          usePointStyle: true,
        },
      },
    },
    scales: {
      y: {
        display: false,
      },
      x: {
        ticks: { color: '#94a3b8', font: { size: 12 } },
        grid: { display: false },
        border: { display: false }
      },
    },
  }

  // Expense breakdown for this month
  const expenseBreakdown = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense')
    const categoryTotals = {}
    let totalExMonth = 0
    expenses.forEach(t => {
      const d = new Date(t.date)
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + parseFloat(t.amount)
        totalExMonth += parseFloat(t.amount)
      }
    })

    const sorted = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4) // Top 4

    const colors = ['#fb7185', '#fb923c', '#a78bfa', '#60a5fa']

    return sorted.map(([category, amount], idx) => ({
      category,
      amount,
      percentage: totalExMonth > 0 ? (amount / totalExMonth) * 100 : 0,
      color: colors[idx % colors.length]
    }))
  }, [transactions, currentYear, currentMonth])

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5)
  }, [transactions])

  const getWealthMax = () => {
    return Math.max(stats.cpfTotal, stats.investmentsTotal, stats.netSavings, 1)
  }

  const wealthMax = getWealthMax()

  return (
    <div className="dashboard">
      <div className="dashboard-top-cards">
        <div className="dash-card income">
          <span className="dash-card-title">MONTHLY INCOME</span>
          <span className="dash-card-value income">S$ {formatMoney(stats.incomeThisMonth)}</span>
          <span className="dash-card-subtitle">This month</span>
        </div>

        <div className="dash-card expense">
          <span className="dash-card-title">MONTHLY EXPENSES</span>
          <span className="dash-card-value expense">S$ {formatMoney(stats.expenseThisMonth)}</span>
          <span className="dash-card-subtitle">This month</span>
        </div>

        <div className="dash-card savings">
          <span className="dash-card-title">NET SAVINGS</span>
          <span className="dash-card-value savings">S$ {formatMoney(stats.netSavings)}</span>
          <span className="dash-card-subtitle">{stats.savingsRate.toFixed(1)}% savings rate</span>
        </div>

        <div className="dash-card cpf">
          <span className="dash-card-title">CPF TOTAL</span>
          <span className="dash-card-value cpf">S$ {formatMoney(stats.cpfTotal)}</span>
          <span className="dash-card-subtitle">OA + SA + MA</span>
        </div>

        <div className="dash-card investments">
          <span className="dash-card-title">INVESTMENTS</span>
          <span className="dash-card-value investments">S$ {formatMoney(stats.investmentsTotal)}</span>
          <span className="dash-card-subtitle">{stats.investmentsCount} asset(s)</span>
        </div>

        <div className="dash-card insurance">
          <span className="dash-card-title">ANNUAL PREMIUMS</span>
          <span className="dash-card-value insurance">S$ {formatMoney(stats.insuranceTotal)}</span>
          <span className="dash-card-subtitle">{stats.insuranceCount} policies</span>
        </div>
      </div>

      <div className="dashboard-middle">
        <div className="dash-panel">
          <div className="dash-panel-header">
            <h2 className="dash-panel-title">Monthly Cash Flow</h2>
            <span className="dash-badge">{MONTH_LABELS[currentMonth]} {currentYear}</span>
          </div>
          <div className="chart-container">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>

        <div className="dash-panel">
          <div className="dash-panel-header">
            <h2 className="dash-panel-title">Expense Breakdown</h2>
            <span className="dash-badge">This Month</span>
          </div>
          <div className="expense-breakdown-list">
            {expenseBreakdown.length > 0 ? (
              expenseBreakdown.map((item, idx) => (
                <div key={idx} className="expense-row">
                  <div className="expense-label" title={item.category}>{item.category}</div>
                  <div className="expense-bar-container">
                    <div className="expense-bar-fill" style={{ width: `${item.percentage}%`, backgroundColor: item.color }}></div>
                  </div>
                  <div className="expense-value">S$ {formatMoney(item.amount)}</div>
                </div>
              ))
            ) : (
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No expenses this month.</p>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-bottom">
        <div className="dash-panel">
          <div className="dash-panel-header" style={{ marginBottom: '1rem' }}>
            <h2 className="dash-panel-title">Wealth Overview</h2>
          </div>

          <div className="wealth-networth-title">ESTIMATED NET WORTH</div>
          <div className="wealth-networth-value">S$ {formatMoney(stats.estimatedNetWorth)}</div>
          <div className="wealth-networth-subtitle">CPF + Investments + Monthly Net</div>

          <div className="wealth-bars">
            <div className="wealth-bar-row">
              <div className="wealth-bar-label">CPF</div>
              <div className="wealth-bar-container">
                <div className="wealth-bar-fill cpf" style={{ width: `${(stats.cpfTotal / wealthMax) * 100}%` }}></div>
              </div>
              <div className="wealth-bar-value cpf">S$ {formatMoney(stats.cpfTotal)}</div>
            </div>

            <div className="wealth-bar-row">
              <div className="wealth-bar-label">Investments</div>
              <div className="wealth-bar-container">
                <div className="wealth-bar-fill investments" style={{ width: `${(stats.investmentsTotal / wealthMax) * 100}%` }}></div>
              </div>
              <div className="wealth-bar-value investments">S$ {formatMoney(stats.investmentsTotal)}</div>
            </div>

            <div className="wealth-bar-row">
              <div className="wealth-bar-label">Monthly Net</div>
              <div className="wealth-bar-container">
                <div className="wealth-bar-fill monthly" style={{ width: `${(Math.max(stats.netSavings, 0) / wealthMax) * 100}%` }}></div>
              </div>
              <div className="wealth-bar-value monthly">S$ {formatMoney(stats.netSavings)}</div>
            </div>
          </div>
        </div>

        <div className="dash-panel">
          <div className="dash-panel-header">
            <h2 className="dash-panel-title">Recent Transactions</h2>
            <span className="dash-badge">Last 5</span>
          </div>

          <div className="recent-tx-list">
            {recentTransactions.map(tx => (
              <div key={tx.id} className="recent-tx-item">
                <div className="recent-tx-info">
                  <span className="recent-tx-title">{tx.description}</span>
                  <span className="recent-tx-meta">{tx.category} · {tx.date.substring(0, 10)}</span>
                </div>
                <span className={`recent-tx-amount ${tx.type}`}>
                  {tx.type === 'income' ? '+S$' : '-S$'} {formatMoney(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="advice-footer">
        💡 Consider CPF SA Top-Up for tax relief and higher 4% interest. Max S$8,000/yr from cash.
      </div>
    </div>
  )
}

export default Dashboard