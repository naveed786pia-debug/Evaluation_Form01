import { NavLink } from "react-router-dom";
import "../styles/app-header.css";

export const AppHeader = () => (
  <header className="header-bar">
    <div className="brand-group">
      <span className="brand-badge">Builder</span>
      <span className="brand-title">Project Dashboard</span>
    </div>
    <nav className="navigation-links">
      <NavLink to="/" className="navigation-link">
        Overview
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
