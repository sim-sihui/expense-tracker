import { useState, useMemo } from 'react'
import { formatMoney } from '../utils/formatMoney'
import './cpf.css'

const CPF_RATES = [
    { label: 'Below 55', emp: 0.20, er: 0.17, oa: 0.6217, sa: 0.1621, ma: 0.2162 },
    { label: '55 – 60', emp: 0.15, er: 0.145, oa: 0.3696, sa: 0.3043, ma: 0.3261 },
    { label: '60 – 65', emp: 0.095, er: 0.11, oa: 0.188, sa: 0.188, ma: 0.624 },
    { label: '65 – 70', emp: 0.07, er: 0.085, oa: 0.0806, sa: 0.0806, ma: 0.8388 },
    { label: 'Above 70', emp: 0.05, er: 0.075, oa: 0.0806, sa: 0.0806, ma: 0.8388 },
]

function getRates(age) {
    if (age < 55) return CPF_RATES[0]
    if (age < 60) return CPF_RATES[1]
    if (age < 65) return CPF_RATES[2]
    if (age < 70) return CPF_RATES[3]
    return CPF_RATES[4]
}

const CPF = ({ cpfData, onUpdateCPF }) => {
    const [showTopUpModal, setShowTopUpModal] = useState(false)
    const [topUpAmount, setTopUpAmount] = useState('')
    const [topUpAccount, setTopUpAccount] = useState('sa')
    const [housingUsed, setHousingUsed] = useState(() => {
        const saved = localStorage.getItem('cpfHousingUsed')
        return saved ? parseFloat(saved) : 0
    })

    // Inline form state
    const [form, setForm] = useState({
        oa: cpfData.oa || 0,
        sa: cpfData.sa || 0,
        ma: cpfData.ma || 0,
        salary: cpfData.salary || 0,
        age: cpfData.age || 30,
    })

    const rates = useMemo(() => getRates(Number(cpfData.age) || 30), [cpfData.age])

    const monthlyContrib = (cpfData.salary || 0) * (rates.emp + rates.er)
    const oaMonthly = monthlyContrib * rates.oa
    const saMonthly = monthlyContrib * rates.sa
    const maMonthly = monthlyContrib * rates.ma

    // 10-year projection
    const projection = useMemo(() => {
        let oa = cpfData.oa || 0
        let sa = cpfData.sa || 0
        let ma = cpfData.ma || 0
        return Array.from({ length: 10 }, (_, i) => {
            oa = (oa + oaMonthly * 12) * 1.025
            sa = (sa + saMonthly * 12) * 1.04
            ma = (ma + maMonthly * 12) * 1.04
            return { year: i + 1, age: (cpfData.age || 30) + i + 1, oa, sa, ma, total: oa + sa + ma }
        })
    }, [cpfData, oaMonthly, saMonthly, maMonthly])

    const maxProjected = projection[9]?.total || 1

    // CPF LIFE rough estimate
    const yearsToRetire = Math.max(0, 55 - (cpfData.age || 30))
    const sa55 = (cpfData.sa || 0) * Math.pow(1.04, yearsToRetire) + saMonthly * 12 * ((Math.pow(1.04, yearsToRetire) - 1) / 0.04)
    const yearsTo65 = Math.max(0, 65 - (cpfData.age || 30))
    const sa65 = (cpfData.sa || 0) * Math.pow(1.04, yearsTo65) + saMonthly * 12 * ((Math.pow(1.04, yearsTo65) - 1) / 0.04)
    const cpfLifeMonthly = Math.max(300, sa65 * 0.006)

    const handleSave = (e) => {
        e.preventDefault()
        onUpdateCPF({
            oa: parseFloat(form.oa) || 0,
            sa: parseFloat(form.sa) || 0,
            ma: parseFloat(form.ma) || 0,
            salary: parseFloat(form.salary) || 0,
            age: parseInt(form.age) || 30,
            lastUpdated: new Date().toISOString(),
        })
    }

    const handleTopUp = (e) => {
        e.preventDefault()
        const amt = parseFloat(topUpAmount) || 0
        if (!amt) return
        onUpdateCPF({
            ...cpfData,
            [topUpAccount]: (cpfData[topUpAccount] || 0) + amt,
            lastUpdated: new Date().toISOString(),
        })
        setTopUpAmount('')
        setShowTopUpModal(false)
    }

    const handleHousingChange = (value) => {
        const v = parseFloat(value) || 0
        setHousingUsed(v)
        localStorage.setItem('cpfHousingUsed', v)
    }

    const accounts = [
        {
            key: 'oa', label: 'Ordinary Account', short: 'OA',
            balance: cpfData.oa || 0, rate: '2.5%',
            interest: (cpfData.oa || 0) * 0.025,
            uses: 'Housing · Education · Investment',
        },
        {
            key: 'sa', label: 'Special Account', short: 'SA',
            balance: cpfData.sa || 0, rate: '4%',
            interest: (cpfData.sa || 0) * 0.04,
            uses: 'Retirement · CPF LIFE',
        },
        {
            key: 'ma', label: 'MediSave Account', short: 'MA',
            balance: cpfData.ma || 0, rate: '4%',
            interest: (cpfData.ma || 0) * 0.04,
            uses: 'Healthcare · MediShield Life',
        },
    ]

    return (
        <div className="cpf-page">

            {/* ── HEADER ── */}
            <div className="cpf-header">
                <h1>CPF Overview</h1>
                <div className="cpf-header-actions">
                    {cpfData.lastUpdated && (
                        <span className="cpf-last-sync">
                            Last Sync: {new Date(cpfData.lastUpdated).toLocaleDateString()}
                        </span>
                    )}
                    <button className="btn btn-primary" onClick={() => setShowTopUpModal(true)}>Top-Up</button>
                </div>
            </div>

            {/* ── INFO BANNER ── */}
            <div className="cpf-info-banner">
                <span className="info-icon">ℹ️</span>
                <span>
                    CPF contributions are computed based on Singapore MOM guidelines.
                    OA earns 2.5% p.a., SA earns 4% p.a., MedSave earns 4% p.a. (up to 5% for 55+).
                </span>
            </div>

            {/* ── THREE ACCOUNT CARDS ── */}
            <div className="cpf-accounts-grid">
                {accounts.map(acc => (
                    <div key={acc.key} className={`cpf-account-card ${acc.key}`}>
                        <div className="cpf-account-label">{acc.label} ({acc.short})</div>
                        <div className="cpf-account-balance">S$ {formatMoney(acc.balance)}</div>
                        <div className="cpf-account-rate">{acc.rate} p.a. interest</div>
                        <div className="cpf-account-interest">+S$ {formatMoney(acc.interest)} interest/yr</div>
                        <div className="cpf-account-uses">{acc.uses}</div>
                    </div>
                ))}
            </div>

            {/* ── UPDATE FORM + RATES TABLE ── */}
            <div className="cpf-two-col">
                {/* Inline Update Form */}
                <div className="cpf-card cpf-update-form">
                    <div className="cpf-card-title">Update CPF Balances</div>
                    <form onSubmit={handleSave}>
                        <div className="cpf-form-grid">
                            <div className="cpf-form-group">
                                <label>OA Balance (S$)</label>
                                <input type="number" min="0" step="0.01" placeholder="0.00"
                                    value={form.oa}
                                    onChange={e => setForm({ ...form, oa: e.target.value })} />
                            </div>
                            <div className="cpf-form-group">
                                <label>SA Balance (S$)</label>
                                <input type="number" min="0" step="0.01" placeholder="0.00"
                                    value={form.sa}
                                    onChange={e => setForm({ ...form, sa: e.target.value })} />
                            </div>
                            <div className="cpf-form-group">
                                <label>MedSave Balance (S$)</label>
                                <input type="number" min="0" step="0.01" placeholder="0.00"
                                    value={form.ma}
                                    onChange={e => setForm({ ...form, ma: e.target.value })} />
                            </div>
                        </div>
                        <div className="cpf-form-row">
                            <div className="cpf-form-group">
                                <label>Monthly Salary (S$)</label>
                                <input type="number" min="0" step="0.01" placeholder="e.g. 5000"
                                    value={form.salary}
                                    onChange={e => setForm({ ...form, salary: e.target.value })} />
                            </div>
                            <div className="cpf-form-group">
                                <label>Age</label>
                                <input type="number" min="16" max="80" placeholder="e.g. 30"
                                    value={form.age}
                                    onChange={e => setForm({ ...form, age: e.target.value })} />
                            </div>
                        </div>
                        <button type="submit" className="cpf-update-btn">Update CPF</button>
                    </form>
                </div>

                {/* Contribution Rates Table */}
                <div className="cpf-card">
                    <div className="cpf-rates-header">
                        <div className="cpf-card-title" style={{ marginBottom: 0 }}>CPF Contribution Rates (MOM)</div>
                    </div>
                    <table className="cpf-rates-table">
                        <thead>
                            <tr>
                                <th>Age</th>
                                <th>Employee</th>
                                <th>Employer</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {CPF_RATES.map(r => {
                                const isActive = r.label === getRates(cpfData.age || 30).label
                                return (
                                    <tr key={r.label} className={isActive ? 'active-tier' : ''}>
                                        <td>{r.label}</td>
                                        <td>{(r.emp * 100).toFixed(0)}%</td>
                                        <td>{(r.er * 100).toFixed(1)}%</td>
                                        <td className="rate-total">{((r.emp + r.er) * 100).toFixed(1)}%</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── 10-YEAR PROJECTION ── */}
            <div className="cpf-card">
                <div className="cpf-projection-title">CPF Projection — 10 Year Growth</div>
                {projection.map(row => {
                    const pct = (row.total / maxProjected * 100).toFixed(1)
                    return (
                        <div key={row.year} className="cpf-projection-row">
                            <span className="cpf-projection-label">Year {row.year} (Age {row.age})</span>
                            <div className="cpf-projection-bar-wrap">
                                <div className="cpf-projection-bar" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="cpf-projection-value">S${formatMoney(row.total)}</span>
                        </div>
                    )
                })}
            </div>

            {/* ── CPF LIFE + USAGE TRACKER ── */}
            <div className="cpf-two-col">
                {/* CPF LIFE Estimate */}
                <div className="cpf-card cpf-life-card">
                    <div className="cpf-card-title">CPF LIFE Estimate</div>
                    <span className="cpf-life-badge">Retirement</span>

                    <div className="cpf-life-subtitle">Estimated SA at 55</div>
                    <div className="cpf-life-amount">S$ {formatMoney(sa55)}</div>

                    <div className="cpf-life-subtitle">Projected CPF LIFE Monthly Payout</div>
                    <div className="cpf-life-payout">
                        S$ {formatMoney(cpfLifeMonthly)}
                        <span className="cpf-life-payout-unit">/mo from 65</span>
                    </div>

                    <div className="cpf-life-note">
                        ℹ️ Estimate based on Standard Plan. Actual payout depends on FRS/ERS at 55. Consult CPF Board for personalised estimates.
                    </div>
                </div>

                {/* CPF Usage Tracker */}
                <div className="cpf-card cpf-usage-card">
                    <div className="cpf-card-title">CPF Usage Tracker</div>

                    <div className="cpf-usage-row">
                        <span className="usage-label">OA — Housing Budget Used</span>
                        <span className="usage-action">—</span>
                    </div>
                    <input
                        type="number"
                        className="cpf-usage-input"
                        placeholder="Track HDB / private property OA withdrawals here"
                        value={housingUsed || ''}
                        onChange={e => handleHousingChange(e.target.value)}
                    />

                    <div className="cpf-monthly-contrib-title">Monthly Contribution (Est.)</div>
                    <div className="cpf-monthly-contrib-grid">
                        <div className="cpf-contrib-box oa">
                            <div className="cpf-contrib-box-label">To OA</div>
                            <div className="cpf-contrib-box-value">S$ {formatMoney(oaMonthly)}</div>
                        </div>
                        <div className="cpf-contrib-box sa">
                            <div className="cpf-contrib-box-label">To SA</div>
                            <div className="cpf-contrib-box-value">S$ {formatMoney(saMonthly)}</div>
                        </div>
                        <div className="cpf-contrib-box ma">
                            <div className="cpf-contrib-box-label">To MA</div>
                            <div className="cpf-contrib-box-value">S$ {formatMoney(maMonthly)}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── TOP-UP MODAL ── */}
            {showTopUpModal && (
                <div className="modal-overlay" onClick={() => setShowTopUpModal(false)}>
                    <div className="modal-content" style={{ maxWidth: '420px', width: '95%' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2>Record CPF Top-Up</h2>
                            <button onClick={() => setShowTopUpModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--color-text)' }}>✕</button>
                        </div>
                        <form onSubmit={handleTopUp}>
                            <div style={{ marginBottom: '14px' }}>
                                <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '0.82rem', fontWeight: 600 }}>Top-Up Account</label>
                                <select className="form-input" value={topUpAccount} onChange={e => setTopUpAccount(e.target.value)} style={{ width: '100%' }}>
                                    <option value="oa">OA — Ordinary Account</option>
                                    <option value="sa">SA — Special Account</option>
                                    <option value="ma">MA — MediSave Account</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: '14px' }}>
                                <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '0.82rem', fontWeight: 600 }}>Amount (S$)</label>
                                <input type="number" className="form-input" min="0" step="0.01" placeholder="0.00"
                                    value={topUpAmount} onChange={e => setTopUpAmount(e.target.value)} style={{ width: '100%' }} />
                            </div>
                            <div style={{ background: 'rgba(var(--color-primary-rgb), 0.06)', borderRadius: '10px', padding: '12px', fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                                💡 SA cash top-ups qualify for up to <strong>S$8,000 tax relief</strong> per year under the Retirement Sum Topping-Up (RSTU) scheme.
                            </div>
                            <div className="form-actions" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                                <button type="button" onClick={() => setShowTopUpModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Record Top-Up</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    )
}

export default CPF