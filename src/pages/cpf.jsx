import { useState, useMemo, useEffect, useRef } from 'react'
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

const CPF = ({ cpfData, onUpdateCPF, transactions = [] }) => {
    const [showTopUpModal, setShowTopUpModal] = useState(false)
    const [topUpAmount, setTopUpAmount] = useState('')
    const [topUpAccount, setTopUpAccount] = useState('sa')
    const [housingUsed, setHousingUsed] = useState(() => {
        const saved = localStorage.getItem('cpfHousingUsed')
        return saved ? parseFloat(saved) : 0
    })
    const fileInputRef = useRef(null)

    // Inline form state
    const [form, setForm] = useState({
        oa: cpfData.oa || 0,
        sa: cpfData.sa || 0,
        ma: cpfData.ma || 0,
        salary: cpfData.salary || 0,
        age: cpfData.age || 30,
    })

    // OW/AW Calculator state
    const [calcYear, setCalcYear] = useState('2025')
    const [calcSalary, setCalcSalary] = useState(cpfData.salary || '')
    const [calcBonus, setCalcBonus] = useState('')

    const { latestSalary, annualBonus } = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const salaryTxs = transactions.filter(t => t.type === 'income' && t.category === 'Salary');
        salaryTxs.sort((a, b) => new Date(b.date) - new Date(a.date));
        const latest = salaryTxs.length > 0 ? salaryTxs[0].amount : 0;

        const bonus = transactions
            .filter(t => t.type === 'income' && t.category === 'Bonus' && new Date(t.date).getFullYear() === currentYear)
            .reduce((sum, t) => sum + t.amount, 0);

        return { latestSalary: latest, annualBonus: bonus };
    }, [transactions]);

    useEffect(() => {
        if (!calcSalary && latestSalary > 0) setCalcSalary(latestSalary);
        if (!calcBonus && annualBonus > 0) setCalcBonus(annualBonus);
    }, [latestSalary, annualBonus]);

    const handleSyncOWAW = () => {
        setCalcSalary(latestSalary || calcSalary);
        setCalcBonus(annualBonus || calcBonus);
    };

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

    // -- OW/AW Calculator Logic --
    const owCeiling = calcYear === '2024' ? 6800 : calcYear === '2025' ? 7400 : 8000;
    const owSubject = Math.min(Number(calcSalary) || 0, owCeiling);
    const awCeiling = Math.max(0, 102000 - (owSubject * 12));
    const awSubject = Math.min(Number(calcBonus) || 0, awCeiling);

    const calcRates = getRates(Number(cpfData.age) || 30);
    const annualGross = ((Number(calcSalary) || 0) * 12) + (Number(calcBonus) || 0);
    const totalSubjectToCPF = (owSubject * 12) + awSubject;
    const annualEmployeeCPF = totalSubjectToCPF * calcRates.emp;
    const annualEmployerCPF = totalSubjectToCPF * calcRates.er;
    const netTakeHome = annualGross - annualEmployeeCPF;

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

    const handleFileUpload = (e) => {
        const file = e.target.files[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            const text = event.target.result
            parseCPFCSV(text)
        }
        reader.readAsText(file)
        e.target.value = null // reset
    }

    const parseCPFCSV = (text) => {
        const lines = text.split(/\r?\n/)
        let newOa = form.oa
        let newSa = form.sa
        let newMa = form.ma
        let updated = false

        // Match amounts like 1,234.56 or S$ 1234.56 or 1234.56 or 123,456.78
        const amountRegex = /(?:S\$)?\s?([\d,]+\.\d{2})/

        for (const line of lines) {
            const lower = line.toLowerCase()
            const match = line.match(amountRegex)
            if (match) {
                const amount = parseFloat(match[1].replace(/,/g, ''))
                // Specifically look for account names in the same line
                if (lower.includes('ordinary account') || lower.includes('oa contribution')) {
                    newOa = amount
                    updated = true
                } else if (lower.includes('special account') || lower.includes('sa contribution')) {
                    newSa = amount
                    updated = true
                } else if (lower.includes('medisave account') || lower.includes('ma contribution')) {
                    newMa = amount
                    updated = true
                }
            }
        }

        if (updated) {
            setForm(prev => ({ ...prev, oa: newOa, sa: newSa, ma: newMa }))
            onUpdateCPF({
                ...cpfData,
                oa: newOa,
                sa: newSa,
                ma: newMa,
                lastUpdated: new Date().toISOString(),
            })
            alert("CPF balances successfully imported from CSV!")
        } else {
            alert("We couldn't detect any of the standard CPF account balances in this file. Please ensure it's a valid CPF statement CSV.")
        }
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
                    <input
                        type="file"
                        accept=".csv"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleFileUpload}
                        title="Upload CPF Statement CSV"
                    />
                    <button
                        className="btn btn-outline"
                        onClick={() => fileInputRef.current.click()}
                        style={{ marginRight: '8px', border: '1px solid var(--color-primary)', background: 'transparent', color: 'var(--color-primary)' }}
                    >
                        Import CSV
                    </button>
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

            <div className="form-section-title" style={{ marginTop: '10px' }}>Input & Calculation</div>

            {/* ── TOOLS SECTION: UPDATE FORM + OW/AW CALCULATOR ── */}
            <div className="cpf-two-col">
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

                    <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--color-border)' }}>
                        <div className="cpf-card-title" style={{ marginBottom: '12px', fontSize: '0.85rem' }}>OW Ceiling Reference</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                            <div style={{ background: 'rgba(var(--color-primary-rgb), 0.04)', padding: '10px', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>2024</div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>$6,800</div>
                            </div>
                            <div style={{ background: 'rgba(var(--color-primary-rgb), 0.04)', padding: '10px', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>2025</div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>$7,400</div>
                            </div>
                            <div style={{ background: 'rgba(var(--color-primary-rgb), 0.04)', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-primary)' }}>
                                <div style={{ fontSize: '0.65rem', color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '4px' }}>2026+</div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-primary)' }}>$8,000</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="cpf-card ow-aw-calc" style={{ marginTop: 0 }}>
                    <div className="cpf-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        OW & AW Annual Calculator
                        <button
                            type="button"
                            onClick={handleSyncOWAW}
                            style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--color-primary)', background: 'transparent', color: 'var(--color-primary)', cursor: 'pointer' }}
                            title="Pull latest Salary and Year's Bonus from Transactions"
                        >
                            🔄 Sync from Transactions
                        </button>
                    </div>
                    <div className="ow-aw-calc-grid">
                        <div className="calc-inputs">
                            <div className="cpf-form-group">
                                <label>Year (for OW Ceiling)</label>
                                <select value={calcYear} onChange={e => setCalcYear(e.target.value)} className="cpf-usage-input" style={{ marginBottom: 0 }}>
                                    <option value="2024">2024 (Ceiling: $6,800)</option>
                                    <option value="2025">2025 (Ceiling: $7,400)</option>
                                    <option value="2026">2026+ (Ceiling: $8,000)</option>
                                </select>
                            </div>
                            <div className="cpf-form-group">
                                <label>Monthly Salary (OW)</label>
                                <input type="number" min="0" step="0.01" placeholder="e.g. 5000"
                                    value={calcSalary}
                                    onChange={e => setCalcSalary(e.target.value)} />
                                <div style={{ fontSize: '0.7rem', color: 'var(--color-primary)', marginTop: '4px' }}>
                                    Subject to CPF: S$ {formatMoney(owSubject)} / mo
                                </div>
                            </div>
                            <div className="cpf-form-group">
                                <label>Annual Bonus (AW)</label>
                                <input type="number" min="0" step="0.01" placeholder="e.g. 15000"
                                    value={calcBonus}
                                    onChange={e => setCalcBonus(e.target.value)} />
                                <div style={{ fontSize: '0.7rem', color: 'var(--color-primary)', marginTop: '4px' }}>
                                    Subject to CPF: S$ {formatMoney(awSubject)} / yr (Max: S$ {formatMoney(awCeiling)})
                                </div>
                            </div>
                        </div>

                        <div className="calc-results">
                            <div className="calc-res-row">
                                <span className="calc-res-label">Annual Gross Pay</span>
                                <span className="calc-res-val">S$ {formatMoney(annualGross)}</span>
                            </div>
                            <div className="calc-res-row">
                                <span className="calc-res-label">Your Contribution (Employee)</span>
                                <span className="calc-res-val">- S$ {formatMoney(annualEmployeeCPF)}</span>
                            </div>
                            <div className="calc-res-row">
                                <span className="calc-res-label">Employer Contribution (Extra)</span>
                                <span className="calc-res-val highlight-brand">+ S$ {formatMoney(annualEmployerCPF)}</span>
                            </div>
                            <div className="calc-res-row" style={{ background: 'transparent', border: '1px solid var(--color-border)' }}>
                                <span className="calc-res-label">Annual Take-Home Pay</span>
                                <span className="calc-res-val highlight-green">S$ {formatMoney(netTakeHome)}</span>
                            </div>

                            <div style={{ marginTop: '16px', padding: '16px', borderRadius: '10px', background: 'rgba(var(--color-primary-rgb), 0.04)', border: '1px solid rgba(var(--color-primary-rgb), 0.1)' }}>
                                <h4 style={{ fontSize: '0.85rem', color: 'var(--color-primary)', marginBottom: '8px', fontWeight: 700 }}>How is this calculated?</h4>
                                <ul style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0, paddingLeft: '16px', lineHeight: '1.6' }}>
                                    <li><strong>OW (Ordinary Wage):</strong> Monthly salary up to the cap.</li>
                                    <li><strong>AW (Additional Wage):</strong> Bonuses, leave pay, etc.</li>
                                    <li><strong>Annual Total Wage (TW):</strong> (OW × 12) + AW.</li>
                                    <li><strong>Annual TW Ceiling:</strong> S$ 102,000 (Universal cap for all ages).</li>
                                    <li><strong>OW Cap:</strong> S$ {formatMoney(owCeiling)} / month (for {calcYear}).</li>
                                    <li><strong>AW Cap:</strong> $102,000 - (Total Annual OW subject to CPF).</li>
                                    <li><strong>Note on Age:</strong> Your <strong>Age</strong> determines the <em>percentage rate</em> (currently {(calcRates.emp * 100).toFixed(1)}%), but the <strong>Caps</strong> are fixed for all employees.</li>
                                </ul>
                                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '8px', fontStyle: 'italic' }}>* Note: The Employee Rate ({(calcRates.emp * 100).toFixed(1)}%) and Employer Rate ({(calcRates.er * 100).toFixed(1)}%) are based on your inputted Age ({form.age}) from the section above.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="form-section-title">Insights & Rates</div>

            <div className="cpf-two-col">
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

            <div className="form-section-title">Retirement & Usage</div>

            <div className="cpf-two-col">
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
                        ℹ️ Estimate based on Standard Plan. Actual payout depends on FRS/ERS at 55.
                    </div>
                </div>

                <div className="cpf-card cpf-usage-card">
                    <div className="cpf-card-title">CPF Usage Tracker</div>
                    <div className="cpf-usage-row">
                        <span className="usage-label">OA — Housing Budget Used</span>
                        <span className="usage-action">—</span>
                    </div>
                    <input
                        type="number"
                        className="cpf-usage-input"
                        placeholder="Track HDB withdrawals here"
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

            <div className="form-section-title">Knowledge Base</div>

            <div className="cpf-edu-section">
                <div className="cpf-card">
                    <div className="cpf-card-title">Understanding CPF Accounts & Benefits</div>
                    <div className="cpf-edu-grid">
                        <div className="cpf-edu-block">
                            <h4>Account Breakdowns</h4>
                            <ul>
                                <li><strong>Ordinary Account (OA):</strong> For housing, insurance, and investment.</li>
                                <li><strong>Special Account (SA):</strong> For old age and retirement savings.</li>
                                <li><strong>Retirement Account (RA):</strong> Formed at 55 for lifelong payouts.</li>
                                <li><strong>MediSave Account (MA):</strong> For healthcare and medical insurance.</li>
                            </ul>
                        </div>
                        <div className="cpf-edu-block">
                            <h4>Core Benefits</h4>
                            <div className="cpf-benefits-grid" style={{ margin: 0 }}>
                                <div className="benefit-item" style={{ padding: '12px' }}>
                                    <span className="benefit-icon">📈</span>
                                    <div><strong>Risk-Free Interest</strong></div>
                                </div>
                                <div className="benefit-item" style={{ padding: '12px' }}>
                                    <span className="benefit-icon">🏖️</span>
                                    <div><strong>Lifetime Payouts</strong></div>
                                </div>
                            </div>
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