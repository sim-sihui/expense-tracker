import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Budget from './pages/Budget'
import Transaction from './pages/Transaction'
import Calendar from './pages/Calendar'
import CPF from './pages/cpf'
import Assets from './pages/Assets'
import Tax from './pages/Tax'
import Insurance from './pages/Insurance'
import Investment from './pages/Investment'
import MoneyFlow from './pages/MoneyFlow'
import Wealth from './pages/Wealth'
import ProtectionObligations from './pages/TaxInsurance'
import Loans from './pages/Loans'
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
  const [cpfData, setCpfData] = useState(() => {
    const saved = localStorage.getItem('cpfData')
    return saved ? JSON.parse(saved) : { oa: 0, sa: 0, ma: 0, salary: 0, age: 30 }
  })
  const [cards, setCards] = useState(() => {
    const saved = localStorage.getItem('cards')
    return saved ? JSON.parse(saved) : []
  })
  const [loans, setLoans] = useState(() => {
    const saved = localStorage.getItem('loans')
    return saved ? JSON.parse(saved) : []
  })
  const [insurancePolicies, setInsurancePolicies] = useState(() => {
    const saved = localStorage.getItem('insurancePolicies')
    return saved ? JSON.parse(saved) : []
  })
  const [investments, setInvestments] = useState(() => {
    const saved = localStorage.getItem('investments')
    return saved ? JSON.parse(saved) : []
  })

  // UPDATED: Initialize with history array for the chart
  const [emergencyFund, setEmergencyFund] = useState(() => {
    const saved = localStorage.getItem('emergencyFund')
    const defaultData = { target: 10000, current: 0, targetMonths: 6, history: [] }
    if (!saved) return defaultData
    const parsed = JSON.parse(saved)
    return { ...defaultData, ...parsed }
  })

  // Persistence Effects
  useEffect(() => { localStorage.setItem('transactions', JSON.stringify(transactions)) }, [transactions])
  useEffect(() => { localStorage.setItem('budgets', JSON.stringify(budgets)) }, [budgets])
  useEffect(() => { localStorage.setItem('customCategories', JSON.stringify(customCategories)) }, [customCategories])
  useEffect(() => { localStorage.setItem('savingsGoals', JSON.stringify(savingsGoals)) }, [savingsGoals])
  useEffect(() => { localStorage.setItem('emergencyFund', JSON.stringify(emergencyFund)) }, [emergencyFund])
  useEffect(() => { localStorage.setItem('cpfData', JSON.stringify(cpfData)) }, [cpfData])
  useEffect(() => { localStorage.setItem('cards', JSON.stringify(cards)) }, [cards])
  useEffect(() => { localStorage.setItem('loans', JSON.stringify(loans)) }, [loans])
  useEffect(() => { localStorage.setItem('insurancePolicies', JSON.stringify(insurancePolicies)) }, [insurancePolicies])
  useEffect(() => { localStorage.setItem('investments', JSON.stringify(investments)) }, [investments])

  // --- Handlers ---
  const addTransaction = (transaction) => {
    const newTransaction = {
      ...transaction,
      id: Date.now(),
      date: new Date(transaction.date + 'T00:00:00').toISOString()
    }
    setTransactions([...transactions, newTransaction])
  }

  const addBulkTransactions = (newTxs) => {
    let currentId = Date.now()
    const processedTxs = newTxs.map(tx => {
      currentId++
      return {
        ...tx,
        id: currentId,
        date: new Date(tx.date + 'T00:00:00').toISOString()
      }
    })
    setTransactions([...transactions, ...processedTxs])
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

  const addBudget = (budget) => { setBudgets([...budgets, { ...budget, id: Date.now(), createdAt: new Date().toISOString() }]) }
  const updateBudget = (id, updatedBudget) => { setBudgets(budgets.map(b => b.id === id ? { ...updatedBudget, id, createdAt: b.createdAt } : b)) }
  const deleteBudget = (id) => { setBudgets(budgets.filter(b => b.id !== id)) }

  const addSavingsGoal = (goal) => { setSavingsGoals([...savingsGoals, { ...goal, id: Date.now() }]) }
  const updateSavingsGoal = (id, updatedGoal) => { setSavingsGoals(savingsGoals.map(g => g.id === id ? { ...updatedGoal, id } : g)) }
  const deleteSavingsGoal = (id) => { setSavingsGoals(savingsGoals.filter(g => g.id !== id)) }

  const updateCPF = (newData) => { setCpfData(prev => ({ ...prev, ...newData })) }

  const addCard = (card) => { setCards([...cards, { ...card, id: Date.now() }]) }
  const updateCard = (id, updated) => { setCards(cards.map(c => c.id === id ? { ...updated, id } : c)) }
  const deleteCard = (id) => { setCards(cards.filter(c => c.id !== id)) }

  const addLoan = (loan) => { setLoans([...loans, { ...loan, id: Date.now() }]) }
  const updateLoan = (id, updated) => { setLoans(loans.map(l => l.id === id ? { ...updated, id } : l)) }
  const deleteLoan = (id) => { setLoans(loans.filter(l => l.id !== id)) }

  const addInsurancePolicy = (policy) => { setInsurancePolicies([...insurancePolicies, { ...policy, id: Date.now() }]) }
  const updateInsurancePolicy = (id, updated) => { setInsurancePolicies(insurancePolicies.map(p => p.id === id ? { ...updated, id } : p)) }
  const deleteInsurancePolicy = (id) => { setInsurancePolicies(insurancePolicies.filter(p => p.id !== id)) }

  const addInvestment = (investment) => { setInvestments([...investments, { ...investment, id: Date.now() }]) }
  const deleteInvestment = (id) => { setInvestments(investments.filter(i => i.id !== id)) }

  // UPDATED: Emergency Fund Handler to capture Chart History
  const updateEmergencyFund = (newData) => {
    setEmergencyFund(prev => {
      const today = new Date().toLocaleDateString('en-US', { month: 'short' });
      const filteredHistory = (prev.history || []).filter(h => h.month !== today);
      const newHistory = [
        ...filteredHistory,
        { month: today, balance: newData.current }
      ].slice(-12);

      return {
        ...prev,
        ...newData,
        history: newHistory
      };
    });
  }

  const renderPage = () => {
    const commonProps = { transactions, budgets, savingsGoals, emergencyFund, cpfData, insurancePolicies, investments };
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard {...commonProps} />
      case 'moneyflow':
        return (
          <MoneyFlow
            Transaction={Transaction}
            Budget={Budget}
            Loans={Loans}
            transactionProps={{
              transactions,
              budgets,
              savingsGoals,
              emergencyFund,
              onAddTransaction: addTransaction,
              onAddBulkTransactions: addBulkTransactions,
              onUpdateTransaction: updateTransaction,
              onDeleteTransaction: deleteTransaction,
              customCategories,
              onAddCustomCategory: addCustomCategory,
              onUpdateSavingsGoal: updateSavingsGoal,
              onUpdateEmergencyFund: updateEmergencyFund
            }}
            budgetProps={{
              ...commonProps,
              customCategories,
              onAddCustomCategory: addCustomCategory,
              onAddBudget: addBudget,
              onUpdateBudget: updateBudget,
              onDeleteBudget: deleteBudget,
              onAddGoal: addSavingsGoal,
              onUpdateGoal: updateSavingsGoal,
              onDeleteGoal: deleteSavingsGoal,
              onUpdateEmergencyFund: updateEmergencyFund
            }}
            loanProps={{
              loans,
              onAddLoan: addLoan,
              onUpdateLoan: updateLoan,
              onDeleteLoan: deleteLoan
            }}
          />
        )
      case 'wealth':
        return (
          <Wealth
            Investment={Investment}
            Assets={Assets}
            CPF={CPF}
            investmentProps={{
              investments,
              onAddInvestment: addInvestment,
              onDeleteInvestment: deleteInvestment
            }}
            assetsProps={{
              cards,
              onAddCard: addCard,
              onUpdateCard: updateCard,
              onDeleteCard: deleteCard
            }}
            cpfProps={{
              cpfData,
              onUpdateCPF: updateCPF,
              transactions
            }}
          />
        )
      case 'protection':
        return (
          <ProtectionObligations
            Insurance={Insurance}
            Tax={Tax}
            insuranceProps={{
              policies: insurancePolicies,
              onAddPolicy: addInsurancePolicy,
              onUpdatePolicy: updateInsurancePolicy,
              onDeletePolicy: deleteInsurancePolicy
            }}
            taxProps={{
              transactions,
              cpfData
            }}
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