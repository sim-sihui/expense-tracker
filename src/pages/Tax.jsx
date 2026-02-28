import { useState, useMemo } from 'react';
import './Tax.css';

const Tax = () => {
    const [grossIncome, setGrossIncome] = useState('');
    const [reliefs, setReliefs] = useState('');

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

    return (
        <div className="tax-page">
            <div className="tax-hero">
                <div className="hero-content">
                    <h1>Income Tax <span className="highlight">Calculator</span></h1>
                    <p className="hero-subtitle">Simplified Singapore Income Tax Estimation for YA 2024</p>
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Tax;
