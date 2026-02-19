import { useState, useEffect, useRef } from 'react'

const Calculator = ({ onApply, onClose }) => {
  const [display, setDisplay] = useState('0')
  const [expression, setExpression] = useState('')
  const [justEvaluated, setJustEvaluated] = useState(false)
  const panelRef = useRef(null)

  // ── Keyboard support ──────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      // Don't interfere with form inputs
      if (e.target.tagName === 'INPUT' && e.target.type !== 'button') return

      if (e.key >= '0' && e.key <= '9') { e.preventDefault(); handleNum(e.key) }
      else if (e.key === '.') { e.preventDefault(); handleNum('.') }
      else if (e.key === '+') { e.preventDefault(); handleOp('+') }
      else if (e.key === '-') { e.preventDefault(); handleOp('-') }
      else if (e.key === '*') { e.preventDefault(); handleOp('*') }
      else if (e.key === '/') { e.preventDefault(); handleOp('/') }
      else if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); handleEquals() }
      else if (e.key === 'Backspace') { e.preventDefault(); handleBackspace() }
      else if (e.key === 'Escape') { onClose() }
      else if (e.key === 'c' || e.key === 'C') { e.preventDefault(); handleClear() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [display, expression, justEvaluated])

  const handleNum = (val) => {
    if (justEvaluated) {
      setDisplay(val === '.' ? '0.' : val)
      setExpression(val === '.' ? '0.' : val)
      setJustEvaluated(false)
      return
    }
    if (val === '.' && display.includes('.')) return
    const next = display === '0' && val !== '.' ? val : display + val
    setDisplay(next)
    setExpression(prev => prev + val)
  }

  const handleOp = (op) => {
    setJustEvaluated(false)
    setExpression(prev => {
      const last = prev.slice(-1)
      return ['+', '-', '*', '/'].includes(last) ? prev.slice(0, -1) + op : prev + op
    })
    setDisplay('0')
  }

  const handleEquals = () => {
    if (!expression) return
    try {
      const result = Function('"use strict"; return (' + expression + ')')()
      const rounded = Math.round(result * 100) / 100
      setDisplay(String(rounded))
      setExpression(String(rounded))
      setJustEvaluated(true)
    } catch {
      setDisplay('Err')
      setExpression('')
    }
  }

  const handleClear = () => { setDisplay('0'); setExpression(''); setJustEvaluated(false) }

  const handleBackspace = () => {
    if (justEvaluated) { handleClear(); return }
    const next = display.length > 1 ? display.slice(0, -1) : '0'
    setDisplay(next)
    setExpression(prev => prev.length > 1 ? prev.slice(0, -1) : '')
  }

  const handlePercent = () => {
    try {
      const v = Math.round((parseFloat(display) / 100) * 10000) / 10000
      setDisplay(String(v))
      setExpression(prev => {
        const m = prev.match(/(.*[\+\-\*\/])?(.+)$/)
        return m ? (m[1] || '') + String(v) : String(v)
      })
    } catch {}
  }

  const handleApply = () => {
    const val = parseFloat(display)
    if (!isNaN(val) && val >= 0) { onApply(val.toFixed(2)); onClose() }
  }

  const btnStyle = (type) => ({
    background:
      type === 'eq' ? '#6366f1'
      : type === 'op' ? '#253555'
      : type === 'fn' ? '#1e2d45'
      : '#1a2640',
    border: 'none',
    padding: '0',
    height: '44px',
    fontSize: type === 'fn' ? '0.78rem' : '0.92rem',
    cursor: 'pointer',
    color:
      type === 'eq' ? '#fff'
      : type === 'op' ? '#93c5fd'
      : type === 'fn' ? '#94a3b8'
      : '#e2e8f0',
    fontWeight: type === 'eq' || type === 'op' ? 700 : 400,
    transition: 'filter 0.08s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  })

  const Btn = ({ label, onClick, type = 'num', span2 = false }) => (
    <button
      style={{ ...btnStyle(type), ...(span2 ? { gridColumn: 'span 2' } : {}) }}
      onMouseDown={e => { e.preventDefault(); onClick() }}
      onMouseOver={e => e.currentTarget.style.filter = 'brightness(1.3)'}
      onMouseOut={e => e.currentTarget.style.filter = 'brightness(1)'}
    >{label}</button>
  )

  return (
    <div
      ref={panelRef}
      style={{
        width: '210px',
        minWidth: '210px',
        maxWidth: '210px',
        background: '#151f30',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        // Fixed height so it never stretches with the detailed form
        alignSelf: 'flex-start',
        position: 'sticky',
        top: 0,
        borderLeft: '1px solid #1e293b',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#0d1626', borderBottom: '1px solid #1e293b' }}>
        <span style={{ color: '#60a5fa', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>🧮 Calc</span>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ color: '#334155', fontSize: '0.6rem' }}>ESC to close</span>
          <button onMouseDown={e => { e.preventDefault(); onClose() }} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '0.8rem', lineHeight: 1, padding: '2px 4px' }}>✕</button>
        </div>
      </div>

      {/* Display */}
      <div style={{ background: '#0d1626', padding: '10px 12px 8px', textAlign: 'right', borderBottom: '1px solid #1e293b' }}>
        <div style={{ color: '#334155', fontSize: '0.65rem', minHeight: '14px', wordBreak: 'break-all', marginBottom: '1px', fontFamily: 'monospace' }}>{expression || '·'}</div>
        <div style={{ color: '#f1f5f9', fontSize: '1.5rem', fontWeight: 300, lineHeight: 1.15, wordBreak: 'break-all', fontFamily: 'monospace' }}>{display}</div>
      </div>

      {/* Keyboard hint */}
      <div style={{ background: '#0d1626', padding: '3px 12px 5px', borderBottom: '1px solid #1e293b' }}>
        <span style={{ color: '#1e3a5f', fontSize: '0.58rem' }}>keyboard enabled</span>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: '#0d1626', flex: '0 0 auto' }}>
        <Btn label="C"  onClick={handleClear}          type="fn" />
        <Btn label="⌫" onClick={handleBackspace}       type="fn" />
        <Btn label="%"  onClick={handlePercent}         type="fn" />
        <Btn label="÷"  onClick={() => handleOp('/')}   type="op" />
        <Btn label="7"  onClick={() => handleNum('7')} />
        <Btn label="8"  onClick={() => handleNum('8')} />
        <Btn label="9"  onClick={() => handleNum('9')} />
        <Btn label="×"  onClick={() => handleOp('*')}   type="op" />
        <Btn label="4"  onClick={() => handleNum('4')} />
        <Btn label="5"  onClick={() => handleNum('5')} />
        <Btn label="6"  onClick={() => handleNum('6')} />
        <Btn label="−"  onClick={() => handleOp('-')}   type="op" />
        <Btn label="1"  onClick={() => handleNum('1')} />
        <Btn label="2"  onClick={() => handleNum('2')} />
        <Btn label="3"  onClick={() => handleNum('3')} />
        <Btn label="+"  onClick={() => handleOp('+')}   type="op" />
        <Btn label="0"  onClick={() => handleNum('0')}  span2 />
        <Btn label="."  onClick={() => handleNum('.')} />
        <Btn label="="  onClick={handleEquals}          type="eq" />
      </div>

      {/* Apply */}
      <button
        onMouseDown={e => { e.preventDefault(); handleApply() }}
        style={{ background: '#10b981', color: '#fff', border: 'none', padding: '11px', width: '100%', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.03em', flexShrink: 0 }}
        onMouseOver={e => e.currentTarget.style.background = '#059669'}
        onMouseOut={e => e.currentTarget.style.background = '#10b981'}
      >
        ✓ Apply ${display}
      </button>
    </div>
  )
}

export default Calculator