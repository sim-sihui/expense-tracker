import { useState } from 'react'
import { formatMoney } from '../utils/formatMoney'
import './Investment.css'

const INVESTMENT_TYPES = [
    'Global Equities (ETFs)',
    'Singapore / Asia Equities',
    'ETF',
    'Robo-Advisor (StashAway, Syfe)',
    'REITs',
    'Bonds / SSB / T-Bills',
    'SSB (Singapore Savings Bond)',
    'Alternatives / Commodities',
    'Unit Trust / Fund'
]

const emptyInvestment = {
    name: '',
    type: 'Unit Trust / Fund',
    amountInvested: '',
    currentValue: '',
    platform: ''
}

const Investment = ({ investments = [], onAddInvestment, onDeleteInvestment }) => {
    const [formData, setFormData] = useState(emptyInvestment)

    const set = (field, val) => setFormData(prev => ({ ...prev, [field]: val }))

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!formData.name || !formData.type) return
        onAddInvestment({
            ...formData,
            amountInvested: parseFloat(formData.amountInvested) || 0,
            currentValue: parseFloat(formData.currentValue) || 0
        })
        setFormData(emptyInvestment)
    }

    const totalInvested = investments.reduce((sum, inv) => sum + (inv.amountInvested || 0), 0)
    const totalCurrentValue = investments.reduce((sum, inv) => sum + (inv.currentValue || 0), 0)
    const totalPnL = totalCurrentValue - totalInvested
    const totalPnLPercentage = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0
    const isPnLPositive = totalPnL >= 0

    // Group for asset allocation
    const allocationByType = investments.reduce((acc, inv) => {
        acc[inv.type] = (acc[inv.type] || 0) + (inv.currentValue || 0)
        return acc
    }, {})

    const sortedAllocations = Object.entries(allocationByType)
        .map(([type, value]) => ({ type, value, percentage: totalCurrentValue > 0 ? (value / totalCurrentValue) * 100 : 0 }))
        .sort((a, b) => b.percentage - a.percentage)

    return (
        <div className="investment-page">
            <div className="investment-content">
                <h1>Investment Portfolio</h1>

                <div className="investment-add-card">
                    <h3>Add Investment</h3>
                    <form onSubmit={handleSubmit} className="investment-form">
                        <div className="form-group name-group">
                            <label>ASSET NAME</label>
                            <input
                                type="text"
                                placeholder="e.g. STI ETF, MSCI World"
                                value={formData.name}
                                onChange={e => set('name', e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group type-group">
                            <label>TYPE</label>
                            <select value={formData.type} onChange={e => set('type', e.target.value)}>
                                {INVESTMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="form-group amount-group">
                            <label>AMOUNT INVESTED (S$)</label>
                            <input
                                type="number"
                                min="0" step="0.01"
                                placeholder="0.00"
                                value={formData.amountInvested}
                                onChange={e => set('amountInvested', e.target.value)}
                            />
                        </div>
                        <div className="form-group amount-group">
                            <label>CURRENT VALUE (S$)</label>
                            <input
                                type="number"
                                min="0" step="0.01"
                                placeholder="0.00"
                                value={formData.currentValue}
                                onChange={e => set('currentValue', e.target.value)}
                            />
                        </div>
                        <div className="form-group platform-group">
                            <label>PLATFORM</label>
                            <input
                                type="text"
                                placeholder="e.g. POEMS, FSMOne"
                                value={formData.platform}
                                onChange={e => set('platform', e.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary add-btn">Add</button>
                    </form>
                </div>

                <div className="portfolio-summary-card">
                    <span className="summary-label">TOTAL PORTFOLIO VALUE</span>
                    <h2 className="summary-value">S$ {formatMoney(totalCurrentValue)}</h2>
                    <div className={`summary-pnl ${isPnLPositive ? 'positive' : 'negative'}`}>
                        {isPnLPositive ? '+' : '-'}S$ {formatMoney(Math.abs(totalPnL))} ({totalPnLPercentage.toFixed(2)}%) total P&L
                    </div>
                </div>

                <div className="investments-table-card">
                    <div className="table-responsive">
                        <table className="investments-table">
                            <thead>
                                <tr>
                                    <th>ASSET</th>
                                    <th>TYPE</th>
                                    <th>PLATFORM</th>
                                    <th className="text-right">COST BASIS</th>
                                    <th className="text-right">CURRENT VALUE</th>
                                    <th className="text-right">P&L</th>
                                    <th className="text-right">P&L %</th>
                                    <th className="text-right">ALLOCATION</th>
                                    <th className="action-col"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {investments.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="empty-state">No investments added yet</td>
                                    </tr>
                                ) : (
                                    investments.map(inv => {
                                        const pnl = inv.currentValue - inv.amountInvested
                                        const pnlPercent = inv.amountInvested > 0 ? (pnl / inv.amountInvested) * 100 : 0
                                        const isPos = pnl >= 0
                                        const alloc = totalCurrentValue > 0 ? (inv.currentValue / totalCurrentValue) * 100 : 0

                                        return (
                                            <tr key={inv.id}>
                                                <td className="font-medium">{inv.name}</td>
                                                <td><span className="badge-type">{inv.type}</span></td>
                                                <td className="text-secondary">{inv.platform || '-'}</td>
                                                <td className="text-right">S$ {formatMoney(inv.amountInvested)}</td>
                                                <td className="text-right font-medium">S$ {formatMoney(inv.currentValue)}</td>
                                                <td className={`text-right font-medium ${isPos ? 'text-positive' : 'text-negative'}`}>
                                                    {isPos ? '+' : '-'}S$ {formatMoney(Math.abs(pnl))}
                                                </td>
                                                <td className={`text-right font-medium ${isPos ? 'text-positive' : 'text-negative'}`}>
                                                    {pnlPercent.toFixed(2)}%
                                                </td>
                                                <td className="text-right">{alloc.toFixed(1)}%</td>
                                                <td className="action-col">
                                                    <button className="btn-icon-remove" onClick={() => onDeleteInvestment(inv.id)}>✕</button>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="investment-bottom-row">
                    <div className="asset-allocation-card">
                        <h3>Asset Allocation</h3>
                        <div className="allocation-bars">
                            {sortedAllocations.length === 0 && <p className="text-secondary">No assets to display.</p>}
                            {sortedAllocations.map((alloc, idx) => {
                                const colors = ['#2dd4bf', '#a78bfa', '#f97316', '#3b82f6', '#ec4899', '#eab308']
                                const color = colors[idx % colors.length]
                                return (
                                    <div key={alloc.type} className="alloc-row">
                                        <span className="alloc-label" title={alloc.type}>{alloc.type.length > 25 ? alloc.type.substring(0, 22) + '...' : alloc.type}</span>
                                        <div className="alloc-bar-container">
                                            <div className="alloc-bar" style={{ width: `${alloc.percentage}%`, background: color }}></div>
                                        </div>
                                        <span className="alloc-percentage">{alloc.percentage.toFixed(1)}%</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="diversification-guide-card">
                        <div className="guide-header">
                            <h3>Temasek-style Diversification Guide</h3>
                            <span className="reference-badge">Reference</span>
                        </div>
                        <p className="guide-desc">Inspired by Temasek's portfolio diversification approach and MoneyOwl's evidence-based investing principles:</p>

                        <div className="guide-bars">
                            <div className="guide-row">
                                <span className="guide-label">Global Equities (ETFs)</span>
                                <div className="guide-bar-container"><div className="guide-bar" style={{ width: '40%', background: '#a78bfa' }}></div></div>
                                <span className="guide-percentage" style={{ color: '#a78bfa' }}>40%</span>
                            </div>
                            <div className="guide-row">
                                <span className="guide-label">Singapore / Asia Equities</span>
                                <div className="guide-bar-container"><div className="guide-bar" style={{ width: '20%', background: '#3b82f6' }}></div></div>
                                <span className="guide-percentage" style={{ color: '#3b82f6' }}>20%</span>
                            </div>
                            <div className="guide-row">
                                <span className="guide-label">REITs</span>
                                <div className="guide-bar-container"><div className="guide-bar" style={{ width: '15%', background: '#2dd4bf' }}></div></div>
                                <span className="guide-percentage" style={{ color: '#2dd4bf' }}>15%</span>
                            </div>
                            <div className="guide-row">
                                <span className="guide-label">Bonds / SSB / T-Bills</span>
                                <div className="guide-bar-container"><div className="guide-bar" style={{ width: '15%', background: '#2dd4bf' }}></div></div>
                                <span className="guide-percentage" style={{ color: '#2dd4bf' }}>15%</span>
                            </div>
                            <div className="guide-row">
                                <span className="guide-label">Alternatives / Commodities</span>
                                <div className="guide-bar-container"><div className="guide-bar" style={{ width: '5%', background: '#facc15' }}></div></div>
                                <span className="guide-percentage" style={{ color: '#facc15' }}>5%</span>
                            </div>
                            <div className="guide-row">
                                <span className="guide-label">Cash Reserve (6-mo expenses)</span>
                                <div className="guide-bar-container"><div className="guide-bar" style={{ width: '5%', background: '#94a3b8' }}></div></div>
                                <span className="guide-percentage" style={{ color: '#94a3b8' }}>5%</span>
                            </div>
                        </div>

                        <div className="guide-alert">
                            <span className="alert-icon">ℹ️</span>
                            Reference guide only. Adjust allocation based on your risk appetite, age, and financial goals. Always consult a licensed financial advisor.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Investment
