import { createContext, useContext, useState, useEffect } from 'react'

export const ACCENTS = {
  purple: {
    label: 'Purple',
    swatch: '#7c3aed',
    '--nav-from': '#667eea',
    '--nav-to': '#764ba2',
    '--color-primary': '#7c3aed',
    '--color-primary-light': '#ede9fe',
    '--color-primary-dark': '#5b21b6',
    '--color-primary-rgb': '124,58,237',
    '--color-primary-hover': '#6d28d9',
    '--color-focus': 'rgba(124,58,237,0.25)',
    '--dark-primary-light': 'rgba(124,58,237,0.2)',
    // Light — original clean white/light
    '--color-bg': '#f1f5f9',
    '--color-surface': '#ffffff',
    '--color-surface-alt': '#f8f6ff',   // very pale lavender
    '--color-border': '#e2e8f0',
    // Dark — deep purple
    '--dark-bg': '#1a0f2e',
    '--dark-surface': '#241b3f',
    '--dark-surface-alt': '#2e2350',
    '--dark-border': '#3d2e6b',
  },
  blue: {
    label: 'Blue',
    swatch: '#60a5fa',
    '--nav-from': '#93c5fd',
    '--nav-to': '#2563eb',
    '--color-primary': '#3b82f6',
    '--color-primary-light': '#dbeafe',
    '--color-primary-dark': '#1d4ed8',
    '--color-primary-rgb': '59,130,246',
    '--color-primary-hover': '#2563eb',
    '--color-focus': 'rgba(59,130,246,0.25)',
    '--dark-primary-light': 'rgba(59,130,246,0.2)',
    // Light — pale sky blue
    '--color-bg': '#eff6ff',
    '--color-surface': '#ffffff',
    '--color-surface-alt': '#f5f9ff',   // near-white barely blue
    '--color-border': '#bfdbfe',
    // Dark — deep navy blue
    '--dark-bg': '#0a1628',
    '--dark-surface': '#0f2040',
    '--dark-surface-alt': '#162a52',
    '--dark-border': '#1e3a6e',
  },
  pink: {
    label: 'Pink',
    swatch: '#f472b6',
    '--nav-from': '#f9a8d4',
    '--nav-to': '#9f1239',
    '--color-primary': '#ec4899',
    '--color-primary-light': '#fce7f3',
    '--color-primary-dark': '#9f1239',
    '--color-primary-rgb': '236,72,153',
    '--color-primary-hover': '#db2777',
    '--color-focus': 'rgba(236,72,153,0.25)',
    '--dark-primary-light': 'rgba(236,72,153,0.2)',
    // Light — soft blush pink
    '--color-bg': '#fff0f6',
    '--color-surface': '#ffffff',
    '--color-surface-alt': '#fff7fb',   // near-white barely pink
    '--color-border': '#fbcfe8',
    // Dark — deep maroon
    '--dark-bg': '#200010',
    '--dark-surface': '#30001a',
    '--dark-surface-alt': '#420024',
    '--dark-border': '#6b0030',
  },
  yellow: {
    label: 'Yellow',
    swatch: '#fbbf24',
    '--nav-from': '#fde68a',
    '--nav-to': '#b45309',
    '--color-primary': '#d97706',
    '--color-primary-light': '#fef9c3',
    '--color-primary-dark': '#92400e',
    '--color-primary-rgb': '217,119,6',
    '--color-primary-hover': '#b45309',
    '--color-focus': 'rgba(217,119,6,0.25)',
    '--dark-primary-light': 'rgba(218,165,32,0.2)',
    // Light — pale butter yellow
    '--color-bg': '#fffdf0',
    '--color-surface': '#ffffff',
    '--color-surface-alt': '#fffef7',   // near-white barely yellow
    '--color-border': '#fde68a',
    // Dark — deep gold/amber
    '--dark-bg': '#1c1200',
    '--dark-surface': '#2a1c00',
    '--dark-surface-alt': '#3a2600',
    '--dark-border': '#6b4400',
  },
}

const SHARED_LIGHT = {
  '--color-text': '#1e293b',
  '--color-text-secondary': '#64748b',
  '--color-text-muted': '#94a3b8',
  '--color-shadow': 'rgba(0,0,0,0.07)',
  '--color-overlay': 'rgba(0,0,0,0.35)',
  '--color-nav-text': 'rgba(255,255,255,0.88)',
  '--color-nav-active': '#ffffff',
  '--color-input-bg': '#ffffff',
  '--color-income-bg': '#f0fdf4',
  '--color-expense-bg': '#fef2f2',
}

const SHARED_DARK = {
  '--color-text': '#e2e8f0',
  '--color-text-secondary': '#94a3b8',
  '--color-text-muted': '#64748b',
  '--color-shadow': 'rgba(0,0,0,0.4)',
  '--color-overlay': 'rgba(0,0,0,0.6)',
  '--color-nav-text': 'rgba(255,255,255,0.75)',
  '--color-nav-active': '#ffffff',
  '--color-income-bg': '#052e16',
  '--color-expense-bg': '#1c0a0a',
}

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [accent, setAccent] = useState(() => localStorage.getItem('themeAccent') || 'purple')
  const [dark, setDark] = useState(() => localStorage.getItem('themeDark') === 'true')

  useEffect(() => {
    const root = document.documentElement
    const a = ACCENTS[accent] || ACCENTS.purple
    const shared = dark ? SHARED_DARK : SHARED_LIGHT

    Object.entries(shared).forEach(([k, v]) => root.style.setProperty(k, v))

      // Accent colour tokens
      ;['--color-primary', '--color-primary-light', '--color-primary-dark',
        '--color-primary-rgb', '--color-primary-hover', '--color-focus']
        .forEach(k => {
          let val = a[k]
          if (dark && k === '--color-primary-light' && a['--dark-primary-light']) {
            val = a['--dark-primary-light']
          }
          root.style.setProperty(k, val)
        })

    // Nav gradient
    root.style.setProperty('--nav-from', a['--nav-from'])
    root.style.setProperty('--nav-to', a['--nav-to'])

    // Page palette
    if (dark) {
      root.style.setProperty('--color-bg', a['--dark-bg'])
      root.style.setProperty('--color-surface', a['--dark-surface'])
      root.style.setProperty('--color-surface-alt', a['--dark-surface-alt'])
      root.style.setProperty('--color-border', a['--dark-border'])
      root.style.setProperty('--color-input-bg', a['--dark-surface'])
      root.style.setProperty('--color-input-border', a['--dark-border'])
    } else {
      root.style.setProperty('--color-bg', a['--color-bg'])
      root.style.setProperty('--color-surface', a['--color-surface'])
      root.style.setProperty('--color-surface-alt', a['--color-surface-alt'])
      root.style.setProperty('--color-border', a['--color-border'])
      root.style.setProperty('--color-input-bg', '#ffffff')
      root.style.setProperty('--color-input-border', a['--color-border'])
    }

    root.setAttribute('data-theme', dark ? 'dark' : 'light')
    root.setAttribute('data-accent', accent)

    localStorage.setItem('themeAccent', accent)
    localStorage.setItem('themeDark', String(dark))
  }, [accent, dark])

  return (
    <ThemeContext.Provider value={{ accent, setAccent, dark, toggleDark: () => setDark(d => !d) }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)