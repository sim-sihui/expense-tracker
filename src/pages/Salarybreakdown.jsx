import { useState, useEffect } from 'react'
import { formatMoney } from '../utils/formatMoney'

const DEFAULT_SPLIT = { needs: 50, wants: 30, savings: 10, invest: 10 }

const BUDGETS = [
  { key: 'needs',   label: 'Needs',   icon: '🛒', color: '#4ade80', desc: 'Rent, groceries, transport' },
  { key: 'wants',   label: 'Wants',   icon: '🛍️', color: '#fb923c', desc: 'Dining, shopping, entertainment' },
  { key: 'savings', label: 'Savings', icon: '🏦', color: '#60a5fa', desc: 'Emergency fund, goals' },
  { key: 'invest',  label: 'Invest',  icon: '📈', color: '#c084fc', desc: 'Stocks, CPF top-up, REITs' },
]

const SalaryBreakdown = ({ totalIncome }) => {
  const [split, setSplit] = useState(() => {
    try { const s = localStorage.getItem('salarySplit'); return s ? JSON.parse(s) : DEFAULT_SPLIT }
    catch { return DEFAULT_SPLIT }
  })
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(split)

  const total = draft.needs + draft.wants + draft.savings + draft.invest
  const isValid = total === 100

  const save = () => {
    if (!isValid) return
    setSplit(draft)
    localStorage.setItem('salarySplit', JSON.stringify(draft))
    setEditing(false)
  }

  const setField = (field, val) => {
    const n = Math.max(0, Math.min(100, parseInt(val) || 0))
    setDraft(prev => ({ ...prev, [field]: n }))
  }

  if (totalIncome === 0) return null

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: '16px',
      padding: '1.25rem 1.5rem',
      marginBottom: '1.5rem',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: editing ? '1rem' : '1.25rem' }}>
        <div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', marginBottom: '2px' }}>
            💰 Income Allocation
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
            Based on ${formatMoney(totalIncome)} total income
          </div>
        </div>
        <button
          onClick={() => { setDraft(split); setEditing(!editing) }}
          style={{
            background: editing ? '#fef2f2' : '#f8fafc',
            border: `1px solid ${editing ? '#fca5a5' : '#e2e8f0'}`,
            color: editing ? '#dc2626' : '#475569',
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '0.75rem',
            cursor: 'pointer',
            fontWeight: 500,
            whiteSpace: 'nowrap',
          }}
        >
          {editing ? '✕ Cancel' : '⚙️ Customise'}
        </button>
      </div>

      {/* Editor */}
      {editing && (
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1.25rem',
        }}>
          <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 0.75rem' }}>
            Percentages must add up to 100%
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '0.75rem' }}>
            {BUDGETS.map(b => (
              <div key={b.key}>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: b.color, marginBottom: '4px' }}>
                  {b.icon} {b.label}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="number" min="0" max="100"
                    value={draft[b.key]}
                    onChange={e => setField(b.key, e.target.value)}
                    style={{
                      width: '52px', padding: '6px 8px', border: '1px solid #e2e8f0',
                      borderRadius: '6px', fontSize: '0.9rem', fontWeight: 600,
                    }}
                  />
                  <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>%</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: isValid ? '#dcfce7' : '#fef2f2',
            color: isValid ? '#166534' : '#991b1b',
            borderRadius: '8px', padding: '8px 12px',
            fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.75rem',
          }}>
            <span>Total: {total}% {isValid ? '✓ Good to go!' : `— need ${Math.abs(100 - total)}% ${total < 100 ? 'more' : 'less'}`}</span>
          </div>
          <button
            onClick={save} disabled={!isValid}
            style={{
              background: isValid ? '#6366f1' : '#e2e8f0',
              color: isValid ? '#fff' : '#94a3b8',
              border: 'none', borderRadius: '8px',
              padding: '8px 20px', fontSize: '0.82rem', fontWeight: 700,
              cursor: isValid ? 'pointer' : 'not-allowed',
            }}
          >Save Split</button>
        </div>
      )}

      {/* Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.875rem' }}>
        {BUDGETS.map(b => {
          const amount = (totalIncome * split[b.key]) / 100
          const pct = split[b.key]
          return (
            <div key={b.key} style={{
              borderRadius: '12px',
              padding: '1rem',
              background: `linear-gradient(135deg, ${b.color}10 0%, transparent 100%)`,
              border: `1px solid ${b.color}30`,
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Icon + pct badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.3rem' }}>{b.icon}</span>
                <span style={{
                  fontSize: '0.68rem', fontWeight: 800, color: b.color,
                  background: `${b.color}20`, padding: '2px 7px', borderRadius: '99px',
                }}>{pct}%</span>
              </div>

              {/* Amount */}
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', marginBottom: '1px' }}>
                ${formatMoney(amount)}
              </div>

              {/* Label */}
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: b.color, marginBottom: '2px' }}>
                {b.label}
              </div>

              {/* Desc */}
              <div style={{ fontSize: '0.62rem', color: '#94a3b8', lineHeight: 1.4, marginBottom: '0.6rem' }}>
                {b.desc}
              </div>

              {/* Bar */}
              <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: b.color, borderRadius: '99px', transition: 'width 0.5s ease' }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default SalaryBreakdown