import { useState } from 'react'
import { formatMoney } from '../utils/formatMoney'
import './Insurance.css'

const POLICY_TYPES = [
    'Life Insurance',
    'Whole Life',
    'Term Insurance',
    'Integrated Shield Plan',
    'Health / Medishield Life',
    'Critical Illness',
    'Disability Income'
]

const emptyPolicy = {
    name: '',
    type: 'Life Insurance',
    annualPremium: '',
    coverageAmount: '',
    insurer: ''
}

const Insurance = ({ policies = [], onAddPolicy, onUpdatePolicy, onDeletePolicy }) => {
    const [formData, setFormData] = useState(emptyPolicy)

    const set = (field, val) => setFormData(prev => ({ ...prev, [field]: val }))

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!formData.name || !formData.type) return
        onAddPolicy({
            ...formData,
            annualPremium: parseFloat(formData.annualPremium) || 0,
            coverageAmount: parseFloat(formData.coverageAmount) || 0
        })
        setFormData(emptyPolicy)
    }

    // Coverages analysis
    const existingTypes = new Set(policies.map(p => p.type))
    const coveredTypes = POLICY_TYPES.filter(t => existingTypes.has(t))
    const missingTypes = POLICY_TYPES.filter(t => !existingTypes.has(t))

    const totalPremiums = policies.reduce((sum, p) => sum + (p.annualPremium || 0), 0)
    const totalCoverage = policies.reduce((sum, p) => sum + (p.coverageAmount || 0), 0)

    return (
        <div className="insurance-page">
            <div className="insurance-content">
                <h1>Insurance Portfolio</h1>

                <div className="insurance-alert">
                    <span className="alert-icon">✅</span>
                    Good insurance coverage protects your wealth. MoneyOwl recommends having life, health, disability & critical illness coverage.
                </div>

                <div className="insurance-add-card">
                    <h3>Add Insurance Policy</h3>
                    <form onSubmit={handleSubmit} className="insurance-form">
                        <div className="form-group name-group">
                            <label>POLICY NAME</label>
                            <input
                                type="text"
                                placeholder="e.g. AIA Smart Health"
                                value={formData.name}
                                onChange={e => set('name', e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group type-group">
                            <label>TYPE</label>
                            <select value={formData.type} onChange={e => set('type', e.target.value)}>
                                {POLICY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="form-group amount-group">
                            <label>ANNUAL PREMIUM (S$)</label>
                            <input
                                type="number"
                                min="0" step="0.01"
                                placeholder="0.00"
                                value={formData.annualPremium}
                                onChange={e => set('annualPremium', e.target.value)}
                            />
                        </div>
                        <div className="form-group amount-group">
                            <label>COVERAGE AMOUNT (S$)</label>
                            <input
                                type="number"
                                min="0" step="0.01"
                                placeholder="0.00"
                                value={formData.coverageAmount}
                                onChange={e => set('coverageAmount', e.target.value)}
                            />
                        </div>
                        <div className="form-group insurer-group">
                            <label>INSURER</label>
                            <input
                                type="text"
                                placeholder="e.g. AIA, Prudential"
                                value={formData.insurer}
                                onChange={e => set('insurer', e.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary add-btn">Add Policy</button>
                    </form>
                </div>

                {/* Policies List */}
                <div className="policies-grid">
                    {policies.map(policy => (
                        <div key={policy.id} className="policy-card">
                            <div className="policy-header">
                                <span className="policy-type-label">{policy.type.toUpperCase()}</span>
                                <span className="status-badge active">active</span>
                            </div>
                            <h4>{policy.name}</h4>
                            <p className="insurer-name">{policy.insurer || 'Unspecified Insurer'}</p>

                            <div className="policy-amounts">
                                <div>
                                    <span className="label">Annual Premium</span>
                                    <span className="value premium">S$ {formatMoney(policy.annualPremium)}</span>
                                </div>
                                <div>
                                    <span className="label">Coverage</span>
                                    <span className="value coverage">S${(policy.coverageAmount / 1000).toFixed(1)}K</span>
                                </div>
                            </div>

                            <button className="btn-remove" onClick={() => onDeletePolicy(policy.id)}>Remove</button>
                        </div>
                    ))}
                </div>

                <div className="insurance-bottom-row">
                    {/* Coverage Analysis */}
                    <div className="coverage-analysis-card">
                        <h3>Coverage Analysis</h3>

                        <div className="analysis-section">
                            <h4 className="covered-title">✓ Covered</h4>
                            <ul className="covered-list">
                                {coveredTypes.map(t => (
                                    <li key={t}>{t}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="analysis-section">
                            <h4 className="missing-title">⚠️ Consider Adding</h4>
                            <ul className="missing-list">
                                {missingTypes.map(t => (
                                    <li key={t}>{t}</li>
                                ))}
                            </ul>
                        </div>

                        {missingTypes.length > 0 && (
                            <div className="suggestion-box">
                                ⚠️ Consider adding {Math.min(2, missingTypes.length)} more policy type(s) for comprehensive coverage.
                            </div>
                        )}
                    </div>

                    {/* Annual Premiums Breakdown */}
                    <div className="premiums-breakdown-card">
                        <h3>Annual Premiums Breakdown</h3>

                        <div className="breakdown-bars">
                            {policies.map(policy => {
                                const percentage = totalPremiums > 0 ? (policy.annualPremium / totalPremiums) * 100 : 0;
                                return (
                                    <div key={policy.id} className="breakdown-row">
                                        <span className="breakdown-label" title={policy.type}>
                                            {policy.type.length > 18 ? policy.type.substring(0, 15) + '...' : policy.type}
                                        </span>
                                        <div className="breakdown-bar-container">
                                            <div className="breakdown-bar" style={{ width: `${percentage}%` }}></div>
                                        </div>
                                        <span className="breakdown-amount">S$ {formatMoney(policy.annualPremium)}</span>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="breakdown-totals">
                            <div className="total-row">
                                <span>Total Annual Premiums</span>
                                <span className="total-premium-val">S$ {formatMoney(totalPremiums)}</span>
                            </div>
                            <div className="total-row">
                                <span>Total Coverage</span>
                                <span className="total-coverage-val">S${(totalCoverage / 1000).toFixed(1)}K</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Insurance
