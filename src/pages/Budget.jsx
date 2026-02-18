import { useState, useEffect } from "react";

function Budget() {
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState({});

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("transactions"));
    const savedBudgets = JSON.parse(localStorage.getItem("budgets"));
    if (saved) setTransactions(saved);
    if (savedBudgets) setBudgets(savedBudgets);
  }, []);

  useEffect(() => {
    localStorage.setItem("budgets", JSON.stringify(budgets));
  }, [budgets]);

  const categories = [...new Set(transactions.map(t => t.category))];

  const annualIncome = transactions
    .filter(t => t.type === "Income")
    .reduce((sum, t) => sum + t.amount, 0);

  const annualExpense = transactions
    .filter(t => t.type === "Expense")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div style={{ padding: 30 }}>
      <h2>Monthly Budget</h2>

      {categories.map(cat => {
        const spent = transactions
          .filter(t => t.category === cat && t.type === "Expense")
          .reduce((sum, t) => sum + t.amount, 0);

        const budget = budgets[cat] || 0;

        return (
          <div key={cat}>
            {cat} |
            Budget:
            <input
              type="number"
              value={budget}
              onChange={(e) =>
                setBudgets({ ...budgets, [cat]: Number(e.target.value) })
              }
            />
            | Spent: ${spent.toFixed(2)}
          </div>
        );
      })}

      <h2>Annual Overview</h2>
      <p>Total Income: ${annualIncome.toFixed(2)}</p>
      <p>Total Expense: ${annualExpense.toFixed(2)}</p>
      <p>Savings: ${(annualIncome - annualExpense).toFixed(2)}</p>
    </div>
  );
}

export default Budget;
