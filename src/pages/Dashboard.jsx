import { useState, useEffect } from "react";
import React from "react";
import { Pie } from "react-chartjs-2";
import "chart.js/auto";

function Dashboard() {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("transactions"));
    if (saved) setTransactions(saved);
  }, []);

  const income = transactions
    .filter(t => t.type === "Income")
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = transactions
    .filter(t => t.type === "Expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = income - expense;

  const categories = [...new Set(transactions.map(t => t.category))];

  const categoryTotals = categories.map(cat =>
    transactions
      .filter(t => t.category === cat && t.type === "Expense")
      .reduce((sum, t) => sum + t.amount, 0)
  );

  const pieData = {
    labels: categories,
    datasets: [{ data: categoryTotals }]
  };

  return (
    <div className={ "grid-3" }>
      <h2>Dashboard</h2>
      <h3>Total Income: ${income.toFixed(2)}</h3>
      <h3>Total Expense: ${expense.toFixed(2)}</h3>
      <h3>Net Balance: ${balance.toFixed(2)}</h3>

      <Pie data={pieData} />
    </div>
  );
  
}



export default Dashboard;
