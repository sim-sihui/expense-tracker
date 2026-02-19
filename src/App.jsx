import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Budget from './pages/Budget'
import Transaction from './pages/Transaction'
import Calendar from './pages/Calendar'
import './App.css'

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

  // Save transactions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions))
  }, [transactions])

  // Save budgets to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('budgets', JSON.stringify(budgets))
  }, [budgets])

  // Save custom categories to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('customCategories', JSON.stringify(customCategories))
  }, [customCategories])

  const addTransaction = (transaction) => {
    const newTransaction = {
      ...transaction,
      id: Date.now(),
      date: new Date(transaction.date + 'T00:00:00').toISOString()  // use the date the user picked
    }
    setTransactions([...transactions, newTransaction])
  }

  const updateTransaction = (id, updatedData) => {
    setTransactions(transactions.map(t =>
      t.id === id
        ? { ...updatedData, id, date: new Date(updatedData.date + 'T00:00:00').toISOString() }
        : t
    ))
  }

  const deleteTransaction = (id) => {
    setTransactions(transactions.filter(t => t.id !== id))
  }

  const addCustomCategory = (name) => {
    if (name && !customCategories.includes(name)) {
      setCustomCategories([...customCategories, name])
    }
  }

  const addBudget = (budget) => {
    const newBudget = {
      ...budget,
      id: Date.now()
    }
    setBudgets([...budgets, newBudget])
  }

  const updateBudget = (id, updatedBudget) => {
    setBudgets(budgets.map(b => b.id === id ? { ...updatedBudget, id } : b))
  }

  const deleteBudget = (id) => {
    setBudgets(budgets.filter(b => b.id !== id))
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard transactions={transactions} budgets={budgets} />

      case 'budget':
        return (
          <Budget
            budgets={budgets}
            transactions={transactions}
            onAddBudget={addBudget}
            onUpdateBudget={updateBudget}
            onDeleteBudget={deleteBudget}
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

        return <Dashboard transactions={transactions} budgets={budgets} />
    }
  }

  return (
    <div className="App">
      <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  )
}

export default App
