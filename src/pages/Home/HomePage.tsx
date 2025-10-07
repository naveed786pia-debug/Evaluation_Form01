import "./home-page.css";

import { Link } from "react-router-dom";
import "./home-page.css";

const featureHighlights = [
  {
    title: "Guided evaluations",
    description:
      "Capture ratings, comments, and weighted scores in the Evaluation Entry tool without any manual math.",
  },
  {
    title: "Insightful reports",
    description:
      "Review trends, compare evaluations, and export data as JSON or CSV for external analysis.",
  },
  {
    title: "Ready-to-run MSSQL",
    description:
      "Provision databases quickly with the bundled schema and stored procedures designed for this workflow.",
  }
];

export const HomePage = () => (
  <section className="home-hero">
    <div className="hero-card">
      <h1 className="hero-title">Question & Answer Evaluation Suite</h1>
      <p className="hero-subtitle">
        Launch web-based reviews, capture consistent ratings, and back everything with a production-ready MSSQL schema.
      </p>
      <div className="cta-row">
        <Link className="cta-primary" to="/evaluate">
          Start an evaluation
        </Link>
        <Link className="cta-secondary" to="/sql">
          View SQL schema
        </Link>
      </div>
      <div className="highlight-grid">
        {featureHighlights.map(({ title, description }) => (
          <article key={title} className="highlight-tile">
            <h2 className="highlight-title">{title}</h2>
            <p className="highlight-description">{description}</p>
          </article>
        ))}
      </div>
    </div>
  </section>
);
