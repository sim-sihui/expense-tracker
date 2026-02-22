import { useState, useMemo } from 'react'
import { formatMoney } from '../utils/formatMoney'
import { getEmergencyStatus } from '../utils/emergencyLogic'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'

const Budget = ({ 
  budgets, 
  transactions, 
  onAddBudget, 
  onUpdateBudget, 
  onDeleteBudget,
  savingsGoals = [], 
  onAddGoal, 
  onUpdateGoal, 
  onDeleteGoal,
  emergencyFund,
  onUpdateEmergencyFund
}) => {
  // Modal/Form States
  const [showForm, setShowForm] = useState(false)
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [showEFForm, setShowEFForm] = useState(false)
  const [editingBudget, setEditingBudget] = useState(null)
  const [editingGoal, setEditingGoal] = useState(null)

  // Form Data States
  const [formData, setFormData] = useState({ category: '', amount: '', period: 'monthly' })
  const [goalData, setGoalData] = useState({ title: '', targetAmount: '', savedAmount: 0 })

  // --- Emergency Fund Strategy State ---
  const [isCrisisMode, setIsCrisisMode] = useState(false)
  const [efStrategy, setEfStrategy] = useState({
    liquidSavings: emergencyFund?.current || 0,
    housing: 1200,
    food: 400,
    transport: 300,
    customMonths: emergencyFund?.targetMonths || 6
  })

  // --- Real History Logic ---
  const chartData = useMemo(() => {
    // If we have history, use it. Otherwise, show a 2-point line (Start -> Current)
    if (emergencyFund.history && emergencyFund.history.length > 1) {
      return emergencyFund.history;
    }
    return [
      { month: 'Start', balance: 0 },
      { month: new Date().toLocaleDateString('en-US', { month: 'short' }), balance: emergencyFund.current }
    ];
  }, [emergencyFund.history, emergencyFund.current]);

  // --- Logic for Strategy (Calculated live in Modal) ---
  const monthlySurvival = useMemo(() => {
    const total = (parseFloat(efStrategy.housing) || 0) + 
                  (parseFloat(efStrategy.food) || 0) + 
                  (parseFloat(efStrategy.transport) || 0)
    return isCrisisMode ? total * 0.8 : total
  }, [efStrategy, isCrisisMode])

  const monthsCovered = (parseFloat(efStrategy.liquidSavings) || 0) / (monthlySurvival || 1)
  const targetAmount = monthlySurvival * (parseFloat(efStrategy.customMonths) || 1)
  const statusInfo = getEmergencyStatus(monthsCovered, parseFloat(efStrategy.customMonths))

  // --- Handlers ---
  const openEFEditor = () => {
    setEfStrategy({
      ...efStrategy,
      liquidSavings: emergencyFund.current,
      customMonths: emergencyFund.targetMonths || 6
    })
    setShowEFForm(true)
  }

  const handleEFSave = (e) => {
    e.preventDefault()
    onUpdateEmergencyFund({
      current: parseFloat(efStrategy.liquidSavings),
      target: targetAmount,
      targetMonths: parseFloat(efStrategy.customMonths),
      lastUpdated: new Date().toISOString()
    })
    setShowEFForm(false)
  }

  const calculateSpent = (cat) => transactions
    .filter(t => t.type === 'expense' && t.category === cat)
    .reduce((s, t) => s + parseFloat(t.amount), 0)

  const efPercent = Math.min(((emergencyFund?.current || 0) / (emergencyFund?.target || 1)) * 100, 100)

  return (
    <div className="budget">
      
      {/* ── SAFETY NET VIEW (Main Card & Chart) ── */}
      <div className="budget-header">
        <h1>Safety Net</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          {emergencyFund.lastUpdated && (
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', alignSelf: 'center' }}>
              Last Sync: {new Date(emergencyFund.lastUpdated).toLocaleDateString()}
            </span>
          )}
          <button className="btn btn-primary" onClick={openEFEditor}>Update Fund</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        {/* Main Stats Card */}
        <div className="budget-card">
          <div className="budget-card-header">
            <h3>🏦 Emergency Fund</h3>
            <span className="period-badge" style={{ background: 'var(--color-primary)', color: 'white' }}>
              {emergencyFund?.targetMonths || 6} Months Goal
            </span>
          </div>
          
          <div className="budget-amounts">
            <div className="amount-row">
              <span>Current Progress:</span>
              <strong>${formatMoney(emergencyFund.current)} / ${formatMoney(emergencyFund.target)}</strong>
            </div>
          </div>

          <div className="progress-container">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${efPercent}%`, background: 'var(--color-primary)' }}></div>
            </div>
            <span className="percentage">{efPercent.toFixed(1)}%</span>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '10px' }}>
            {efPercent >= 100 
              ? "✅ Fully Funded! You're financially bulletproof." 
              : `Gap: $${formatMoney(emergencyFund.target - emergencyFund.current)} remaining.`}
          </p>
        </div>

        {/* Real Growth Chart Card */}
        <div className="budget-card" style={{ height: '260px' }}>
          <h4 style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '15px', letterSpacing: '0.5px' }}>
            FUND GROWTH HISTORY
          </h4>
          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorProg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
              <YAxis hide domain={[0, 'auto']} />
              <Tooltip formatter={(value) => [`$${formatMoney(value)}`, 'Balance']} />
              <Area 
                type="monotone" 
                dataKey="balance" 
                stroke="var(--color-primary)" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorProg)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── STRATEGY MODAL ── */}
      {showEFForm && (
        <div className="modal-overlay" onClick={() => setShowEFForm(false)}>
          <div className="modal-content" style={{ maxWidth: '950px', width: '95%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Strategize Safety Net</h2>
              <button onClick={() => setShowEFForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 300px', gap: '25px' }}>
              {/* TIPS COLUMN */}
              <div style={{ background: '#f1f5f9', padding: '20px', borderRadius: '12px', fontSize: '0.8rem' }}>
                <h4 style={{ color: 'var(--color-primary)', marginBottom: '12px' }}>💡 STRATEGY TIPS</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', color: '#475569' }}>
                  <p><strong>1. Starter Fund:</strong> Aim for $1k first to cover immediate minor repairs.</p>
                  <p><strong>2. Bare Essentials:</strong> Only include "must-pays" in Part B. Luxury can wait during a crisis.</p>
                  <p><strong>3. Risk Level:</strong> Set higher months (9-12) if you are self-employed or have dependents.</p>
                </div>
              </div>

              {/* INPUTS COLUMN */}
              <div style={{ borderRight: '1px solid #eee', paddingRight: '15px' }}>
                <section style={{ marginBottom: '20px' }}>
                  <h4 style={{ color: 'var(--color-primary)', fontSize: '0.75rem', marginBottom: '10px' }}>PART A: LIQUID SAVINGS</h4>
                  <input type="number" className="form-input" value={efStrategy.liquidSavings} onChange={e => setEfStrategy({...efStrategy, liquidSavings: e.target.value})} />
                </section>

                <section style={{ marginBottom: '20px' }}>
                  <h4 style={{ color: 'var(--color-primary)', fontSize: '0.75rem', marginBottom: '10px' }}>PART B: SURVIVAL BUDGET</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ fontSize: '0.7rem' }}>Housing/Utilities</label>
                    <input type="number" className="form-input" value={efStrategy.housing} onChange={e => setEfStrategy({...efStrategy, housing: e.target.value})} />
                    <label style={{ fontSize: '0.7rem' }}>Food/Groceries</label>
                    <input type="number" className="form-input" value={efStrategy.food} onChange={e => setEfStrategy({...efStrategy, food: e.target.value})} />
                    <label style={{ fontSize: '0.7rem' }}>Bills/Transport</label>
                    <input type="number" className="form-input" value={efStrategy.transport} onChange={e => setEfStrategy({...efStrategy, transport: e.target.value})} />
                  </div>
                </section>

                <section>
                  <h4 style={{ color: 'var(--color-primary)', fontSize: '0.75rem', marginBottom: '10px' }}>PART C: COVERAGE GOAL</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input type="number" className="form-input" style={{ width: '70px' }} value={efStrategy.customMonths} onChange={e => setEfStrategy({...efStrategy, customMonths: e.target.value})} />
                    <span>Months</span>
                  </div>
                </section>
              </div>

              {/* RESULTS COLUMN */}
              <div style={{ background: '#f8fafc', padding: '25px', borderRadius: '12px', borderLeft: `6px solid ${statusInfo.color}` }}>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '3rem' }}>{statusInfo.icon}</span>
                  <h3 style={{ color: statusInfo.color }}>{statusInfo.status}</h3>
                  <p><strong>{monthsCovered.toFixed(1)} months</strong> covered</p>
                </div>
                <div className="progress-bar" style={{ margin: '15px 0' }}>
                   <div className="progress-fill" style={{ width: `${Math.min((monthsCovered / (efStrategy.customMonths || 1)) * 100, 100)}%`, background: statusInfo.color }}></div>
                </div>
                <div style={{ fontSize: '0.8rem', background: 'white', padding: '10px', borderRadius: '8px' }}>
                  <strong>Goal: ${formatMoney(targetAmount)}</strong><br/>
                  <small>{statusInfo.advice}</small>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '15px', fontSize: '0.8rem' }}>
                  <input type="checkbox" checked={isCrisisMode} onChange={() => setIsCrisisMode(!isCrisisMode)} />
                  Crisis Mode (-20%)
                </label>
              </div>
            </div>

            <div className="form-actions" style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
              <button type="button" onClick={() => setShowEFForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" onClick={handleEFSave}>Lock In Strategy</button>
            </div>
          </div>
        </div>
      )}

      {/* ── BUDGET MANAGEMENT SECTION ── */}
      <div className="budget-header" style={{ marginTop: '40px' }}>
        <h1>Monthly Budgets</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>Add Category</button>
      </div>

      <div className="budget-list">
        {budgets?.map(budget => {
          const spent = calculateSpent(budget.category);
          const rem = budget.amount - spent;
          const perc = (spent / budget.amount) * 100;
          return (
            <div key={budget.id} className="budget-card">
              <div className="budget-card-header">
                <h3>{budget.category}</h3>
                <div className="budget-actions">
                  <button onClick={() => { 
                    setEditingBudget(budget); 
                    setFormData({ category: budget.category, amount: budget.amount.toString(), period: budget.period }); 
                    setShowForm(true) 
                  }} className="edit-btn">Edit</button>
                  <button onClick={() => onDeleteBudget(budget.id)} className="delete-btn">Delete</button>
                </div>
              </div>
              <div className="budget-amounts">
                <div className="amount-row"><span>Budget:</span><span>${formatMoney(budget.amount)}</span></div>
                <div className="amount-row"><span>Spent:</span><span className={spent > budget.amount ? 'over-budget' : ''}>${formatMoney(spent)}</span></div>
                <div className="amount-row"><span>Rem:</span><span className={rem < 0 ? 'over-budget' : 'remaining'}>${formatMoney(rem)}</span></div>
              </div>
              <div className="progress-container">
                <div className="progress-bar">
                  <div className={`progress-fill ${perc > 100 ? 'over-budget' : ''}`} style={{ width: `${Math.min(perc, 100)}%` }}></div>
                </div>
                <span className="percentage">{perc.toFixed(1)}%</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── SAVINGS GOALS SECTION ── */}
      <div className="budget-header" style={{ marginTop: '40px' }}>
        <h1>Savings Goals</h1>
        <button className="btn btn-primary" onClick={() => setShowGoalForm(true)}>Add Goal</button>
      </div>

      <div className="budget-list">
        {savingsGoals?.map(goal => {
          const goalPerc = Math.min((goal.savedAmount / goal.targetAmount) * 100, 100)
          return (
            <div key={goal.id} className="budget-card">
              <div className="budget-card-header">
                <h3>{goal.title}</h3>
                <div className="budget-actions">
                  <button onClick={() => { 
                    setEditingGoal(goal); 
                    setGoalData({ title: goal.title, targetAmount: goal.targetAmount.toString(), savedAmount: goal.savedAmount.toString() }); 
                    setShowGoalForm(true) 
                  }} className="edit-btn">Edit</button>
                  <button onClick={() => onDeleteGoal(goal.id)} className="delete-btn">Delete</button>
                </div>
              </div>
              <div className="budget-amounts">
                <div className="amount-row"><span>Target:</span><span>${formatMoney(goal.targetAmount)}</span></div>
                <div className="amount-row"><span>Saved:</span><span className="remaining">${formatMoney(goal.savedAmount)}</span></div>
              </div>
              <div className="progress-container">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${goalPerc}%` }}></div>
                </div>
                <span className="percentage">{goalPerc.toFixed(1)}%</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Budget