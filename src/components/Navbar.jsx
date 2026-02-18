import './Navbar.css'

const Navbar = ({ currentPage, setCurrentPage }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'transaction', label: 'Transactions', icon: '💰' },
    { id: 'budget', label: 'Budget', icon: '🎯' }
  ]

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <h2>💼 ExpenseTracker</h2>
      </div>
      <div className="nav-links">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-link ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => setCurrentPage(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  )
}

export default Navbar
