// ─────────────────────────────────────────────────────────────────────────────
// BUDGET PAGE — integration guide for new features
// Add these to your Budget.jsx (or wherever your budget page lives)
// ─────────────────────────────────────────────────────────────────────────────

// 1. Import SavingsGoals
import SavingsGoals from './Savingsgoals'
import Calculator from './Calculator'

// 2. Add goals state to your app-level state (or budget page state):
//    const [savingsGoals, setSavingsGoals] = useState([])
//
//    Handlers:
//    const handleAddGoal    = (goal) => setSavingsGoals(prev => [...prev, { ...goal, id: Date.now() }])
//    const handleUpdateGoal = (id, data) => setSavingsGoals(prev => prev.map(g => g.id === id ? { ...g, ...data } : g))
//    const handleDeleteGoal = (id) => setSavingsGoals(prev => prev.filter(g => g.id !== id))

// 3. Drop this into your Budget page JSX (below your budget categories section):
//
//    <SavingsGoals
//      goals={savingsGoals}
//      onAddGoal={handleAddGoal}
//      onUpdateGoal={handleUpdateGoal}
//      onDeleteGoal={handleDeleteGoal}
//      totalIncome={totalIncome}        // pass monthly income figure
//    />

// ─────────────────────────────────────────────────────────────────────────────
// BUDGET CATEGORY MANAGEMENT — custom categories reuse
// ─────────────────────────────────────────────────────────────────────────────
// Your existing customCategories array (stored in app state) is already
// passed to Transaction.jsx. To reuse the same list in Budget.jsx:
//
//  const BUDGET_CATEGORIES = [
//    ...PRESET_CATEGORIES,
//    ...customCategories,   // ← same array from app state
//  ]
//
// When the user creates a new budget item, offer a "＋ Add my own…" option
// the same way Transaction.jsx does. Call onAddCustomCategory() so both
// the budget and transactions pages share the new category name.

// ─────────────────────────────────────────────────────────────────────────────
// CALCULATOR in Budget amount fields — example usage
// ─────────────────────────────────────────────────────────────────────────────
// In any budget input form:
//
//  const [showCalc, setShowCalc] = useState(false)
//  const [budgetAmount, setBudgetAmount] = useState('')
//
//  <div className="amount-input-row">
//    <input
//      type="number"
//      value={budgetAmount}
//      onChange={e => setBudgetAmount(e.target.value)}
//    />
//    <button
//      type="button"
//      className={`calc-toggle-btn ${showCalc ? 'calc-toggle-active' : ''}`}
//      onClick={() => setShowCalc(p => !p)}
//    >🧮</button>
//  </div>
//
//  {showCalc && (
//    <div className="calc-side-panel">
//      <Calculator
//        onApply={(val) => setBudgetAmount(val)}
//        onClose={() => setShowCalc(false)}
//      />
//    </div>
//  )}
//
// Wrap the form + calc in a flex container so the calc slides out to the right:
//  <div style={{ display: 'flex', gap: 0 }}>
//    <div style={{ flex: 1 }}> ... your form ... </div>
//    {showCalc && <div className="calc-side-panel"><Calculator .../></div>}
//  </div>