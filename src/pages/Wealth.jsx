import { useState } from 'react'
import '../components/SubNav.css'

const Wealth = ({ investmentProps, assetsProps, cpfProps, Investment, Assets, CPF }) => {
    const [activeTab, setActiveTab] = useState('investments')

    const tabs = [
        { id: 'investments', label: 'Investments' },
        { id: 'cpf', label: 'CPF' },
        { id: 'assets', label: 'Assets' }
    ]

    return (
        <div className="wealth-page">
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

            {activeTab === 'investments' && <Investment {...investmentProps} />}
            {activeTab === 'cpf' && <CPF {...cpfProps} />}
            {activeTab === 'assets' && <Assets {...assetsProps} />}
        </div>
    )
}

export default Wealth
