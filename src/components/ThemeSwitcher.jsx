import { useState, useRef, useEffect } from 'react'
import { useTheme, ACCENTS } from '../context/ThemeContext'

export default function ThemeSwitcher() {
  const { accent, setAccent, dark, toggleDark } = useTheme()
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)
  const btnRef   = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        btnRef.current   && !btnRef.current.contains(e.target)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const currentSwatch = ACCENTS[accent]?.swatch || '#7c3aed'

  return (
    <>
      {/* ── Floating trigger — tiny circle ── */}
      <button
        ref={btnRef}
        onClick={() => setOpen(o => !o)}
        title="Theme"
        style={{
          position: 'fixed',
          top: '14px',
          right: '14px',
          zIndex: 1100,
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          border: `2px solid rgba(255,255,255,0.5)`,
          background: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          transition: 'transform 0.15s, box-shadow 0.15s',
          transform: open ? 'scale(1.1)' : 'scale(1)',
        }}
        onMouseOver={e => e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.3)'}
        onMouseOut={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)'}
      >
        <div style={{
          width: '14px',
          height: '14px',
          borderRadius: '50%',
          background: currentSwatch,
          border: '1.5px solid rgba(255,255,255,0.6)',
        }} />
      </button>

      {/* ── Panel ── */}
      {open && (
        <div
          ref={panelRef}
          style={{
            position: 'fixed',
            top: '52px',
            right: '14px',
            zIndex: 1099,
            background: dark ? '#1e1b2e' : '#ffffff',
            border: `1px solid ${dark ? '#3d2e6b' : '#e2e8f0'}`,
            borderRadius: '14px',
            boxShadow: dark
              ? '0 8px 32px rgba(0,0,0,0.5)'
              : '0 8px 32px rgba(0,0,0,0.12)',
            padding: '14px 16px',
            minWidth: '170px',
            animation: 'themePop 0.16s ease',
          }}
        >
          <style>{`
            @keyframes themePop {
              from { opacity: 0; transform: translateY(-6px) scale(0.96); }
              to   { opacity: 1; transform: translateY(0)   scale(1);    }
            }
          `}</style>

          {/* Label */}
          <div style={{
            fontSize: '0.62rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: dark ? '#64748b' : '#94a3b8',
            marginBottom: '10px',
          }}>Colour</div>

          {/* Swatches — single row */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
            {Object.entries(ACCENTS).map(([key, val]) => {
              const isActive = accent === key
              return (
                <button
                  key={key}
                  onClick={() => setAccent(key)}
                  title={val.label}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${val['--nav-from']}, ${val['--nav-to']})`,
                    border: isActive
                      ? `3px solid ${dark ? '#f1f5f9' : '#1e293b'}`
                      : `2px solid ${dark ? '#475569' : '#d1d5db'}`,
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'transform 0.12s, box-shadow 0.12s',
                    transform: isActive ? 'scale(1.2)' : 'scale(1)',
                    boxShadow: isActive
                      ? `0 0 0 3px ${val.swatch}55`
                      : 'none',
                    flexShrink: 0,
                  }}
                  onMouseOver={e => { if (!isActive) e.currentTarget.style.transform = 'scale(1.1)' }}
                  onMouseOut={e => { if (!isActive) e.currentTarget.style.transform = 'scale(1)' }}
                />
              )
            })}
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: dark ? '#2e2250' : '#f1f5f9', marginBottom: '12px' }} />

          {/* Dark / Light toggle */}
          <button
            onClick={toggleDark}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              background: dark ? '#2e2250' : '#f8fafc',
              border: `1px solid ${dark ? '#3d2e6b' : '#e2e8f0'}`,
              borderRadius: '8px',
              padding: '8px 10px',
              cursor: 'pointer',
            }}
            onMouseOver={e => e.currentTarget.style.background = dark ? '#3d2e6b' : '#f1f5f9'}
            onMouseOut={e => e.currentTarget.style.background = dark ? '#2e2250' : '#f8fafc'}
          >
            {dark ? (
              /* Sun icon */
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1"  x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22"   x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1"  y1="12" x2="3"  y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              /* Moon icon */
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
            <span style={{
              fontSize: '0.78rem',
              fontWeight: 600,
              color: dark ? '#94a3b8' : '#64748b',
            }}>
              {dark ? 'Light mode' : 'Dark mode'}
            </span>
          </button>
        </div>
      )}
    </>
  )
}