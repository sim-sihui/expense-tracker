import './Navbar.css'

const Navbar = ({ currentPage, setCurrentPage }) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Overview',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 13h8V3H3v10zM13 21h8v-6h-8v6zM13 3v6h8V3h-8zM3 21h8v-4H3v4z" />
        </svg>
      )
    },
    {
      id: 'moneyflow',
      label: 'Money Flow',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1v22M17 5H9a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z" />
        </svg>
      )
    },
    {
      id: 'wealth',
      label: 'Wealth',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      )
    },
    {
      id: 'protection',
      label: 'Tax & Insurance',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      )
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      )
    }
  ]

  return (
    <nav className="navbar-container">
      <div className="navbar-glass">
        <div className="nav-brand">
          <span className="brand-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </span>
          <h2 className="brand-text">Expense<span>Tracker</span></h2>
        </div>
        <div className="nav-links">
          {navItems.map(item => {
            const isActive =
              currentPage === item.id ||
              (item.id === 'moneyflow' && ['moneyflow', 'transaction', 'budget'].includes(currentPage)) ||
              (item.id === 'wealth' && ['wealth', 'investment', 'assets', 'cpf'].includes(currentPage)) ||
              (item.id === 'protection' && ['protection', 'insurance', 'tax'].includes(currentPage))

            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setCurrentPage(item.id)}
              >
                <div className="nav-item-content">
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </div>
                <div className="active-indicator" />
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

export default Navbar