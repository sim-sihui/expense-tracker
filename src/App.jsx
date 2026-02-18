import React from "react";
import { NavLink } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-container">
        <NavLink to="/" className="nav-link">
          Home
        </NavLink>
        <NavLink to="/transactions" className="nav-link">
          Transactions
        </NavLink>
        <NavLink to="/budget" className="nav-link">
          Budget
        </NavLink>
      </div>
    </nav>
  );
}
