import React, { useState, useMemo } from 'react';
import { formatMoney } from '../utils/formatMoney';
import { getEmergencyStatus } from '../utils/emergencyLogic';

const EmergencyFund = () => {
  const [liquidSavings, setLiquidSavings] = useState(15000);
  const [expenses, setExpenses] = useState({ housing: 1200, food: 400, transport: 300 });
  const [targetMonths, setTargetMonths] = useState(6);
  const [isCrisisMode, setIsCrisisMode] = useState(false);

  const monthlySurvival = useMemo(() => {
    const total = expenses.housing + expenses.food + expenses.transport;
    return isCrisisMode ? total * 0.8 : total;
  }, [expenses, isCrisisMode]);

  const monthsCovered = liquidSavings / monthlySurvival;
  const targetAmount = monthlySurvival * targetMonths;
  const progress = Math.min((liquidSavings / targetAmount) * 100, 100);
  const surplus = Math.max(liquidSavings - targetAmount, 0);
  const statusInfo = getEmergencyStatus(monthsCovered);

  return (
    <div className="card" style={{ marginBottom: '30px' }}>
      <div className="budget-card-header" style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.2rem' }}>🛡️ Safety Net Planner</h3>
        <span className="period-badge" style={{ background: statusInfo.color, color: 'white' }}>
          {statusInfo.status}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
        
        {/* LEFT: INPUTS */}
        <div className="ef-inputs">
          <div className="form-group">
            <label style={{ fontSize: '0.8rem', color: '#666' }}>LIQUID SAVINGS (CASH/FD)</label>
            <input type="number" value={liquidSavings} onChange={(e) => setLiquidSavings(Number(e.target.value))} className="form-input" style={{ border: '1px solid #eee', borderRadius: '8px', padding: '8px', width: '100%', marginTop: '5px' }} />
          </div>

          <div className="form-group" style={{ marginTop: '15px' }}>
            <label style={{ fontSize: '0.8rem', color: '#666' }}>MONTHLY SURVIVAL BUDGET</label>
            <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
              <input type="number" placeholder="Rent" value={expenses.housing} onChange={(e) => setExpenses({...expenses, housing: Number(e.target.value)})} style={{ width: '33%', padding: '8px', border: '1px solid #eee', borderRadius: '8px' }} />
              <input type="number" placeholder="Food" value={expenses.food} onChange={(e) => setExpenses({...expenses, food: Number(e.target.value)})} style={{ width: '33%', padding: '8px', border: '1px solid #eee', borderRadius: '8px' }} />
              <input type="number" placeholder="Other" value={expenses.transport} onChange={(e) => setExpenses({...expenses, transport: Number(e.target.value)})} style={{ width: '33%', padding: '8px', border: '1px solid #eee', borderRadius: '8px' }} />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '15px' }}>
            <label style={{ fontSize: '0.8rem', color: '#666' }}>COVERAGE GOAL</label>
            <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
              {[3, 6, 12].map(m => (
                <label key={m} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                  <input type="radio" checked={targetMonths === m} onChange={() => setTargetMonths(m)} /> {m}m
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: OUTPUTS */}
        <div className="ef-results" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: '0.9rem', color: '#666' }}>Covers {monthsCovered.toFixed(1)} months</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>${formatMoney(liquidSavings)} / ${formatMoney(targetAmount)}</span>
          </div>

          <div className="progress-container" style={{ margin: '15px 0' }}>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%`, background: statusInfo.color }}
              ></div>
            </div>
          </div>

          <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '15px' }}>
            {surplus > 0 
              ? `✅ Goal met! You have $${formatMoney(surplus)} "lazy cash" to invest.` 
              : `Keep going! You need $${formatMoney(targetAmount - liquidSavings)} more for your ${targetMonths}-month safety net.`}
          </p>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: '#f9f9f9', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
            <input type="checkbox" checked={isCrisisMode} onChange={() => setIsCrisisMode(!isCrisisMode)} />
            <strong>Apply "Crisis Mode" (-20% expenses)</strong>
          </label>
        </div>
      </div>
    </div>
  );
};

export default EmergencyFund;