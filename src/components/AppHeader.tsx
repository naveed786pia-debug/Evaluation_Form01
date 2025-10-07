import { NavLink } from "react-router-dom";
import "../styles/app-header.css";

export const AppHeader = () => (
  <header className="header-bar">
    <div className="brand-group">
      <span className="brand-badge">Builder</span>
      <span className="brand-title">Evaluation Workspace</span>
    </div>
    <nav className="navigation-links">
      <NavLink to="/" className="navigation-link">
        Overview
      </NavLink>
      <NavLink to="/evaluate" className="navigation-link">
        New Evaluation
      </NavLink>
      <NavLink to="/reports" className="navigation-link">
        Reports
      </NavLink>
      <a
        className="navigation-link"
        href="https://www.builder.io/c/docs/projects"
        target="_blank"
        rel="noreferrer"
      >
        Docs
      </a>
    </nav>
  </header>
);
