import { useState } from 'react'
import '../components/SubNav.css'

const MoneyFlow = ({ transactionProps, budgetProps, loanProps, Transaction, Budget, Loans }) => {
    const [activeTab, setActiveTab] = useState('transactions')

    const tabs = [
        { id: 'transactions', label: 'Transactions' },
        { id: 'budget', label: 'Budget' },
        { id: 'loans', label: 'Loans' }
    ]

    return (
        <div className="moneyflow-page">
            <div className="subnav-wrapper">
                <div className="subnav">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`subnav-btn ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'transactions' && <Transaction {...transactionProps} />}
            {activeTab === 'budget' && <Budget {...budgetProps} />}
            {activeTab === 'loans' && <Loans {...loanProps} />}
        </div>
    )
}

export default MoneyFlow
