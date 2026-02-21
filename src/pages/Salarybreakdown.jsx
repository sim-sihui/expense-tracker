import { useState } from 'react'
import { formatMoney } from '../utils/formatMoney'

const DEFAULT_SPLIT = { needs: 50, wants: 30, savings: 10, invest: 10 }

const BUDGETS = [
  { key: 'needs', label: 'Needs', icon: '🛒', color: '#22c55e', rgb: '34,197,94', desc: 'Rent, groceries, transport' },
  { key: 'wants', label: 'Wants', icon: '🛍️', color: '#f97316', rgb: '249,115,22', desc: 'Dining, shopping, entertainment' },
  { key: 'savings', label: 'Savings', icon: '🏦', color: '#3b82f6', rgb: '59,130,246', desc: 'Emergency fund, goals' },
  { key: 'invest', label: 'Invest', icon: '📈', color: '#a855f7', rgb: '168,85,247', desc: 'Stocks, CPF top-up, REITs' },
]

const SalaryBreakdown = ({ totalIncome }) => {
  const [split, setSplit] = useState(() => {
    try { const s = localStorage.getItem('salarySplit'); return s ? JSON.parse(s) : DEFAULT_SPLIT }
    catch { return DEFAULT_SPLIT }
  })
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({ ...DEFAULT_SPLIT })

  const total = draft.needs + draft.wants + draft.savings + draft.invest
  const isValid = total === 100

  const openEditor = () => {
    setDraft({ ...split }) // always sync draft from latest saved split
    setEditing(true)
  }

  const cancelEditor = () => setEditing(false)

  const save = () => {
    if (!isValid) return
    const saved = { ...draft }
    setSplit(saved)
    localStorage.setItem('salarySplit', JSON.stringify(saved))
    setEditing(false)
  }

  const setField = (field, val) => {
    const n = Math.max(0, Math.min(100, parseInt(val) || 0))
    setDraft(prev => ({ ...prev, [field]: n }))
  }

  if (totalIncome === 0) return null

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: '16px',
      padding: '1.25rem 1.5rem',
      marginBottom: '1.5rem',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '2px' }}>
            💰 Income Allocation
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
            Based on ${formatMoney(totalIncome)} total income
          </div>
        </div>
        {!editing ? (
          <button onClick={openEditor} className="edit-btn">⚙️ Customise</button>
        ) : (
          <button onClick={cancelEditor} className="delete-btn">✕ Cancel</button>
        )}
      </div>

      {/* Editor */}
      {editing && (
        <div style={{
          background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)',
          borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem',
        }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: '0 0 0.75rem' }}>
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
                    style={{ width: '52px', padding: '6px 8px', border: '1px solid var(--color-border)', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 600 }}
                  />
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>%</span>
                </div>
              </div>
            ))}
          </div>
          {/* Total bar */}
          <div style={{
            background: isValid ? '#dcfce7' : '#fef2f2',
            color: isValid ? '#166534' : '#991b1b',
            borderRadius: '8px', padding: '8px 12px',
            fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.75rem',
          }}>
            Total: {total}% {isValid ? '✓ Good to go!' : `— ${total < 100 ? `need ${100 - total}% more` : `${total - 100}% too much`}`}
          </div>
          <button onClick={save} disabled={!isValid} style={{
            background: isValid ? 'var(--color-primary)' : 'var(--color-border)',
            color: isValid ? '#fff' : 'var(--color-text-muted)',
            border: 'none', borderRadius: '8px',
            padding: '8px 20px', fontSize: '0.82rem', fontWeight: 700,
            cursor: isValid ? 'pointer' : 'not-allowed',
          }}>Save Split</button>
        </div>
      )}

      {/* Cards — reads from `split` (saved state), not draft */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.875rem' }}>
        {BUDGETS.map(b => {
          const amount = (totalIncome * split[b.key]) / 100
          const pct = split[b.key]
          return (
            <div key={b.key} style={{
              borderRadius: '12px',
              padding: '1rem',
              // Use rgba() with rgb values — works in all browsers
              background: `linear-gradient(135deg, rgba(${b.rgb},0.08) 0%, transparent 100%)`,
              border: `1px solid rgba(${b.rgb},0.25)`,
            }}>
              {/* Icon + badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.3rem' }}>{b.icon}</span>
                <span style={{
                  fontSize: '0.68rem', fontWeight: 800, color: b.color,
                  background: `rgba(${b.rgb},0.12)`,
                  padding: '2px 7px', borderRadius: '99px',
                }}>{pct}%</span>
              </div>
              {/* Amount */}
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '1px' }}>
                ${formatMoney(amount)}
              </div>
              {/* Label */}
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: b.color, marginBottom: '2px' }}>
                {b.label}
              </div>
              {/* Desc */}
              <div style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)', lineHeight: 1.4, marginBottom: '0.6rem' }}>
                {b.desc}
              </div>
              {/* Progress bar */}
              <div style={{ height: '4px', background: 'var(--color-border)', borderRadius: '99px', overflow: 'hidden' }}>
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