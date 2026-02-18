import { useState, useEffect } from "react";

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState(["Salary", "Food", "Transport"]);
  const [newCategory, setNewCategory] = useState("");

  const [form, setForm] = useState({
    date: "",
    type: "Income",
    category: "Salary",
    description: "",
    amount: ""
  });

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("transactions"));
    if (saved) setTransactions(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  }, [transactions]);

  const addTransaction = (e) => {
    e.preventDefault();
    setTransactions([...transactions, { ...form, amount: Number(form.amount) }]);
  };

  const deleteTransaction = (index) => {
    const updated = [...transactions];
    updated.splice(index, 1);
    setTransactions(updated);
  };

  const addCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
      setNewCategory("");
    }
  };

  return (
    <div style={{ padding: 30 }}>
      <h2>Transactions</h2>

      <form onSubmit={addTransaction}>
        <input type="date" required
          onChange={(e) => setForm({ ...form, date: e.target.value })} />

        <select onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option>Income</option>
          <option>Expense</option>
        </select>

        <select onChange={(e) => setForm({ ...form, category: e.target.value })}>
          {categories.map(cat => <option key={cat}>{cat}</option>)}
        </select>

        <input type="text" placeholder="Description"
          onChange={(e) => setForm({ ...form, description: e.target.value })} />

        <input type="number" placeholder="Amount" required
          onChange={(e) => setForm({ ...form, amount: e.target.value })} />

        <button type="submit">Add</button>
      </form>

      <h3>Add Custom Category</h3>
      <input
        value={newCategory}
        onChange={(e) => setNewCategory(e.target.value)}
      />
      <button onClick={addCategory}>Add Category</button>

      <h3>All Transactions</h3>
      {transactions.map((t, index) => (
        <div key={index}>
          {t.date} | {t.type} | {t.category} | ${t.amount}
          <button onClick={() => deleteTransaction(index)}>Delete</button>
        </div>
      ))}
    </div>
  );
}

export default Transactions;
