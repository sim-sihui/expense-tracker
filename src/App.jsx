import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Budget from './pages/Budget'
import Transaction from './pages/Transaction'
import Calendar from './pages/Calendar'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [transactions, setTransactions] = useState([])
  const [budgets, setBudgets] = useState([])

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedTransactions = localStorage.getItem('transactions')
    const savedBudgets = localStorage.getItem('budgets')
    
    if (savedTransactions) {
      setTransactions(JSON.parse(savedTransactions))
    }
    
    if (savedBudgets) {
      setBudgets(JSON.parse(savedBudgets))
    }
  }, [])

  // Save transactions to localStorage whenever transactions change
  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions))
  }, [transactions])

  // Save budgets to localStorage whenever budgets change
  useEffect(() => {
    localStorage.setItem('budgets', JSON.stringify(budgets))
  }, [budgets])

  const addTransaction = (transaction) => {
    const newTransaction = {
      ...transaction,
      id: Date.now(),
      date: new Date(transaction.date + 'T00:00:00').toISOString()  // use the date the user picked
    }
    setTransactions([...transactions, newTransaction])
  }

  const deleteTransaction = (id) => {
    setTransactions(transactions.filter(t => t.id !== id))
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
            onDeleteTransaction={deleteTransaction}
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
