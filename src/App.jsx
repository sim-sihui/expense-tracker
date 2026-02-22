import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Budget from './pages/Budget'
import Transaction from './pages/Transaction'
import Calendar from './pages/Calendar'
import './App.css'
import './theme.css'
import { ThemeProvider } from './context/ThemeContext'
import ThemeSwitcher from './components/ThemeSwitcher'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('transactions')
    return saved ? JSON.parse(saved) : []
  })
  const [budgets, setBudgets] = useState(() => {
    const saved = localStorage.getItem('budgets')
    return saved ? JSON.parse(saved) : []
  })
  const [customCategories, setCustomCategories] = useState(() => {
    const saved = localStorage.getItem('customCategories')
    return saved ? JSON.parse(saved) : []
  })
  const [savingsGoals, setSavingsGoals] = useState(() => {
    const saved = localStorage.getItem('savingsGoals')
    return saved ? JSON.parse(saved) : []
  })

  // UPDATED: Initialize with history array for the chart
  const [emergencyFund, setEmergencyFund] = useState(() => {
    const saved = localStorage.getItem('emergencyFund')
    const defaultData = { target: 10000, current: 0, targetMonths: 6, history: [] }
    if (!saved) return defaultData
    const parsed = JSON.parse(saved)
    return { ...defaultData, ...parsed } // Merge to ensure history exists
  })

  // Persistence Effects
  useEffect(() => { localStorage.setItem('transactions', JSON.stringify(transactions)) }, [transactions])
  useEffect(() => { localStorage.setItem('budgets', JSON.stringify(budgets)) }, [budgets])
  useEffect(() => { localStorage.setItem('customCategories', JSON.stringify(customCategories)) }, [customCategories])
  useEffect(() => { localStorage.setItem('savingsGoals', JSON.stringify(savingsGoals)) }, [savingsGoals])
  useEffect(() => { localStorage.setItem('emergencyFund', JSON.stringify(emergencyFund)) }, [emergencyFund])

  // --- Handlers ---
  const addTransaction = (transaction) => {
    const newTransaction = {
      ...transaction,
      id: Date.now(),
      date: new Date(transaction.date + 'T00:00:00').toISOString()
    }
    setTransactions([...transactions, newTransaction])
  }

  const updateTransaction = (id, updatedData) => {
    setTransactions(transactions.map(t =>
      t.id === id ? { ...updatedData, id, date: new Date(updatedData.date + 'T00:00:00').toISOString() } : t
    ))
  }

  const deleteTransaction = (id) => { setTransactions(transactions.filter(t => t.id !== id)) }

  const addCustomCategory = (name) => {
    if (name && !customCategories.includes(name)) { setCustomCategories([...customCategories, name]) }
  }

  const addBudget = (budget) => { setBudgets([...budgets, { ...budget, id: Date.now() }]) }
  const updateBudget = (id, updatedBudget) => { setBudgets(budgets.map(b => b.id === id ? { ...updatedBudget, id } : b)) }
  const deleteBudget = (id) => { setBudgets(budgets.filter(b => b.id !== id)) }

  const addSavingsGoal = (goal) => { setSavingsGoals([...savingsGoals, { ...goal, id: Date.now() }]) }
  const updateSavingsGoal = (id, updatedGoal) => { setSavingsGoals(savingsGoals.map(g => g.id === id ? { ...updatedGoal, id } : g)) }
  const deleteSavingsGoal = (id) => { setSavingsGoals(savingsGoals.filter(g => g.id !== id)) }

  // UPDATED: Emergency Fund Handler to capture Chart History
  const updateEmergencyFund = (newData) => {
    setEmergencyFund(prev => {
      const today = new Date().toLocaleDateString('en-US', { month: 'short' });
      
      // Filter out existing entries for the same month to prevent chart clutter
      const filteredHistory = (prev.history || []).filter(h => h.month !== today);
      
      const newHistory = [
        ...filteredHistory,
        { month: today, balance: newData.current }
      ].slice(-12); // Store last 12 snapshots

      return {
        ...prev,
        ...newData,
        history: newHistory
      };
    });
  }

  const renderPage = () => {
    const commonProps = { transactions, budgets, savingsGoals, emergencyFund };
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard {...commonProps} />
      case 'budget':
        return (
          <Budget
            {...commonProps}
            onAddBudget={addBudget}
            onUpdateBudget={updateBudget}
            onDeleteBudget={deleteBudget}
            onAddGoal={addSavingsGoal}
            onUpdateGoal={updateSavingsGoal}
            onDeleteGoal={deleteSavingsGoal}
            onUpdateEmergencyFund={updateEmergencyFund}
          />
        )
      case 'transaction':
        return (
          <Transaction
            transactions={transactions}
            onAddTransaction={addTransaction}
            onUpdateTransaction={updateTransaction}
            onDeleteTransaction={deleteTransaction}
            customCategories={customCategories}
            onAddCustomCategory={addCustomCategory}
          />
        )
      case 'calendar':
        return <Calendar transactions={transactions} />
      default:
        return <Dashboard {...commonProps} />
    }
  }

  return (
    <ThemeProvider>
      <ThemeSwitcher />
      <div className="App">
        <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <main className="main-content">
          {renderPage()}
        </main>
      </div>
    </ThemeProvider>
  )
}

export default App