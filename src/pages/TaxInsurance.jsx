import { useState } from 'react'
import '../components/SubNav.css'

const ProtectionObligations = ({ insuranceProps, taxProps, Insurance, Tax }) => {
    const [activeTab, setActiveTab] = useState('insurance')

    const tabs = [
        { id: 'insurance', label: 'Insurance' },
        { id: 'tax', label: 'Tax' }
    ]

    return (
        <div className="protection-page">
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

            {activeTab === 'insurance' && <Insurance {...insuranceProps} />}
            {activeTab === 'tax' && <Tax {...taxProps} />}
        </div>
    )
}

export default ProtectionObligations
