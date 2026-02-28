import { useState, useMemo, useEffect } from 'react';
import './Tax.css';

const Tax = ({ transactions = [], cpfData = {} }) => {
    const [grossIncome, setGrossIncome] = useState('');
    const [reliefs, setReliefs] = useState('');

    const { autoGrossIncome, autoReliefs } = useMemo(() => {
        const currentYear = new Date().getFullYear();

        const salaryTxs = transactions.filter(t => t.type === 'income' && t.category === 'Salary' && new Date(t.date).getFullYear() === currentYear);
        const latestSalary = salaryTxs.sort((a, b) => new Date(b.date) - new Date(a.date))[0]?.amount || 0;

        const totalBonus = transactions
            .filter(t => t.type === 'income' && t.category === 'Bonus' && new Date(t.date).getFullYear() === currentYear)
            .reduce((sum, t) => sum + t.amount, 0);

        const projectedIncome = (latestSalary * 12) + totalBonus;

        // Compute CPF Reliefs based on MOM rules (mirrors CPF logic)
        const owSubject = Math.min(latestSalary, 8000);
        const awCeiling = Math.max(0, 102000 - (owSubject * 12));
        const awSubject = Math.min(totalBonus, awCeiling);

        const age = Number(cpfData.age) || 30;
        let empRate = 0.20;
        if (age >= 55 && age < 60) empRate = 0.15;
        else if (age >= 60 && age < 65) empRate = 0.095;
        else if (age >= 65 && age < 70) empRate = 0.07;
        else if (age >= 70) empRate = 0.05;

        const employeeCpf = ((owSubject * 12) + awSubject) * empRate;

        let eir = 1000;
        if (age >= 55 && age < 60) eir = 6000;
        if (age >= 60) eir = 8000;

        return {
            autoGrossIncome: projectedIncome,
            autoReliefs: employeeCpf + eir
        };
    }, [transactions, cpfData.age]);

    useEffect(() => {
        if (!grossIncome && autoGrossIncome > 0) setGrossIncome(autoGrossIncome);
        if (!reliefs && autoReliefs > 0) setReliefs(autoReliefs);
    }, [autoGrossIncome, autoReliefs]);

    const handleSyncTaxData = () => {
        if (autoGrossIncome > 0) setGrossIncome(autoGrossIncome);
        if (autoReliefs > 0) setReliefs(autoReliefs);
    };
    const [taxRecords, setTaxRecords] = useState(() => {
        const saved = localStorage.getItem('taxRecords');
        return saved ? JSON.parse(saved) : [];
    });

    const currentYear = new Date().getFullYear();

    // Singapore Income Tax Brackets (YA 2024 onwards)
    const taxBrackets = [
        { limit: 20000, rate: 0, base: 0 },
        { limit: 30000, rate: 0.02, base: 0 },
        { limit: 40000, rate: 0.035, base: 200 },
        { limit: 80000, rate: 0.07, base: 550 },
        { limit: 120000, rate: 0.115, base: 3350 },
        { limit: 160000, rate: 0.15, base: 7950 },
        { limit: 200000, rate: 0.18, base: 13950 },
        { limit: 240000, rate: 0.19, base: 21150 },
        { limit: 280000, rate: 0.195, base: 28750 },
        { limit: 320000, rate: 0.20, base: 36550 },
        { limit: 500000, rate: 0.22, base: 44550 },
        { limit: 1000000, rate: 0.23, base: 84150 },
        { limit: Infinity, rate: 0.24, base: 199150 }
    ];

    const chargeableIncome = useMemo(() => {
        const income = parseFloat(grossIncome) || 0;
        const deductions = parseFloat(reliefs) || 0;
        return Math.max(0, income - deductions);
    }, [grossIncome, reliefs]);

    const { calculatedTax, highestBracketRate } = useMemo(() => {
        if (chargeableIncome <= 20000) return { calculatedTax: 0, highestBracketRate: 0 };

        let tax = 0;
        let rate = 0;
        for (let i = 1; i < taxBrackets.length; i++) {
            if (chargeableIncome <= taxBrackets[i].limit) {
                const excess = chargeableIncome - taxBrackets[i - 1].limit;
                tax = taxBrackets[i].base + (excess * taxBrackets[i].rate);
                rate = taxBrackets[i].rate * 100;
                break;
            }
        }
        return { calculatedTax: tax, highestBracketRate: rate };
    }, [chargeableIncome]);

    const effectiveTaxRate = useMemo(() => {
        const income = parseFloat(grossIncome) || 0;
        if (income === 0) return 0;
        return ((calculatedTax / income) * 100).toFixed(2);
    }, [calculatedTax, grossIncome]);

    const handleSaveRecord = () => {
        if (!grossIncome || (chargeableIncome <= 0 && parseFloat(grossIncome) === 0)) return;
        const newRecord = {
            id: Date.now(),
            year: currentYear,
            date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
            grossIncome: parseFloat(grossIncome) || 0,
            reliefs: parseFloat(reliefs) || 0,
            chargeableIncome,
            calculatedTax,
            effectiveTaxRate
        };
        const updatedRecords = [newRecord, ...taxRecords];
        setTaxRecords(updatedRecords);
        localStorage.setItem('taxRecords', JSON.stringify(updatedRecords));
        // Reset inputs when saving
        setGrossIncome('');
        setReliefs('');
    };

    const handleDeleteRecord = (id) => {
        const updatedRecords = taxRecords.filter(record => record.id !== id);
        setTaxRecords(updatedRecords);
        localStorage.setItem('taxRecords', JSON.stringify(updatedRecords));
    };

    return (
        <div className="tax-page">
            <div className="tax-hero">
                <div className="hero-content">
                    <h1>Income Tax <span className="highlight">Calculator</span></h1>
                    <p className="hero-subtitle">Simplified Singapore Income Tax Estimation for YA {currentYear}</p>
                    <button
                        onClick={handleSyncTaxData}
                        style={{ marginTop: '1rem', padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                        title="Auto-fill Gross Income and CPF Reliefs based on your latest Salary and Bonus from Transactions"
                    >
                        🔄 Auto-Fill from Transactions
                    </button>
                </div>
            </div>

            <div className="tax-main-grid">
                {/* Left Column: Inputs */}
                <div className="input-sidebar">
                    <div className="glass-card input-section">
                        <div className="section-header">
                            <div className="icon-circle income">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 1v22M17 5H9a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z" />
                                </svg>
                            </div>
                            <h3>Step 1: Annual Income</h3>
                        </div>
                        <p className="description-text">Enter your total earnings for the year (Salary + Bonus).</p>
                        <div className="input-wrapper">
                            <span className="prefix">$</span>
                            <input
                                type="number"
                                value={grossIncome}
                                onChange={(e) => setGrossIncome(e.target.value)}
                                placeholder="e.g. 80000"
                            />
                        </div>
                    </div>

                    <div className="glass-card input-section">
                        <div className="section-header">
                            <div className="icon-circle reliefs">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.72-8.72 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                </svg>
                            </div>
                            <h3>Step 2: Total Reliefs</h3>
                        </div>
                        <p className="description-text">Sum of CPF contributions, earned income relief, and other deductions.</p>
                        <div className="input-wrapper">
                            <span className="prefix">$</span>
                            <input
                                type="number"
                                value={reliefs}
                                onChange={(e) => setReliefs(e.target.value)}
                                placeholder="e.g. 15000"
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column: Visual Breakdown & Results */}
                <div className="results-display">
                    <div className="glass-card info-summary">
                        <div className="summary-row">
                            <div className="summary-item">
                                <label>Gross Income</label>
                                <div className="val">${(parseFloat(grossIncome) || 0).toLocaleString()}</div>
                            </div>
                            <div className="summary-op">−</div>
                            <div className="summary-item">
                                <label>Total Reliefs</label>
                                <div className="val">(${(parseFloat(reliefs) || 0).toLocaleString()})</div>
                            </div>
                        </div>
                        <div className="summary-divider"></div>
                        <div className="summary-result">
                            <label>Chargeable Income</label>
                            <div className="val-large">${chargeableIncome.toLocaleString()}</div>
                        </div>
                        <p className="education-note">
                            This is the final amount that IRAs uses to calculate your tax based on progressive tax brackets.
                        </p>
                    </div>

                    <div className="tax-outcome-cards">
                        <div className="glass-card outcome-card primary-tax">
                            <div className="outcome-header">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2v20M17 5H9a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z" />
                                </svg>
                                <h4>Estimated Tax Payable</h4>
                            </div>
                            <div className="outcome-amount">
                                ${calculatedTax.toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            {calculatedTax === 0 && chargeableIncome > 0 ? (
                                <div className="status-badge success">Tax Free! 🎉</div>
                            ) : (
                                <div className="tax-insight">
                                    Top Bracket: <strong>{highestBracketRate}%</strong>
                                </div>
                            )}
                        </div>

                        <div className="glass-card outcome-card secondary-stats">
                            <div className="stat-unit">
                                <label>Effective Tax Rate</label>
                                <div className="stat-val">{effectiveTaxRate}%</div>
                            </div>
                            <div className="stat-unit">
                                <label>Monthly Provision</label>
                                <div className="stat-val">${(calculatedTax / 12).toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            </div>
                            <button className="save-tax-btn" onClick={handleSaveRecord}>
                                Save Record
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {taxRecords.length > 0 && (
                <div className="tax-history-section">
                    <div className="history-header">
                        <h2>Past Tax Records</h2>
                    </div>
                    <div className="history-grid">
                        {taxRecords.map(record => (
                            <div key={record.id} className="glass-card history-card">
                                <button className="delete-record-btn" onClick={() => handleDeleteRecord(record.id)} title="Delete Record">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                </button>
                                <div className="history-card-header">
                                    <h3>YA {record.year}</h3>
                                    <span className="record-date">{record.date}</span>
                                </div>
                                <div className="history-card-body">
                                    <div className="history-row">
                                        <span className="history-label">Gross Income</span>
                                        <span className="history-val">${record.grossIncome.toLocaleString()}</span>
                                    </div>
                                    <div className="history-row">
                                        <span className="history-label">Reliefs</span>
                                        <span className="history-val">${record.reliefs.toLocaleString()}</span>
                                    </div>
                                    <div className="history-divider"></div>
                                    <div className="history-row total">
                                        <span className="history-label">Tax Payable</span>
                                        <span className="history-val">${record.calculatedTax.toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tax;
