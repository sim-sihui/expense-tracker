import { NavLink } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-container">
        <NavLink to="/" className="nav-link">
          Dashboard
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

export default Navbar;
