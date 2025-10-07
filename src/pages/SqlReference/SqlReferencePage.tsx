import { useMemo } from "react";
import { Link } from "react-router-dom";
import schemaSql from "../../../sql/evaluation-platform.sql?raw";
import "./sql-reference-page.css";

const formatSection = (sql: string, title: string) => {
  const pattern = new RegExp(`(^|\n)(-- ${title}.*?)(?=\n-- |$)`, "is");
  const match = sql.match(pattern);
  if (!match) {
    return "Section not found in script.";
  }
  return match[0].trim();
};

export const SqlReferencePage = () => {
  const creationScript = useMemo(() => schemaSql.trim(), []);

  const handleDownload = () => {
    const blob = new Blob([creationScript], { type: "application/sql" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "evaluation-platform.sql";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="sql-reference">
      <div className="sql-card">
        <header className="sql-header">
          <div>
            <h1 className="sql-title">MSSQL Schema Reference</h1>
            <p className="sql-subtitle">
              Ready-to-run T-SQL for database provisioning, including tables and stored procedures tailored for the
              evaluation workflow.
            </p>
          </div>
          <button className="sql-download" type="button" onClick={handleDownload}>
            Download .sql
          </button>
        </header>

        <section className="sql-description">
          <h2 className="section-heading">How to use</h2>
          <ol className="instruction-list">
            <li>Connect to your Microsoft SQL Server instance using SQL Server Management Studio or Azure Data Studio.</li>
            <li>Run the script below to create the <strong>EvaluationPlatform</strong> database with required tables.</li>
            <li>Execute the stored procedure section to enable evaluation capture and reporting routines.</li>
            <li>
              Update your application connection string to point to the new database and map API endpoints to the
              stored procedures.
            </li>
          </ol>
          <p className="integration-note">
            Planning API integration? Consider documenting endpoints inside Builder CMS for authoring or connect workflow
            tooling via Zapier when you are ready. MSSQL hosting is external—configure credentials manually after database
            provisioning.
          </p>
        </section>

        <section className="sql-section">
          <h2 className="section-heading">Full schema and procedures</h2>
          <div className="code-container">
            <pre className="code-block">
              <code>{creationScript}</code>
            </pre>
          </div>
        </section>

        <footer className="sql-footer">
          <p className="footer-text">
            Need to populate evaluation data? Use the <Link to="/evaluate">evaluation form</Link> and review outcomes in
            <Link to="/reports"> reports</Link>.
          </p>
        </footer>
      </div>
    </section>
  );
};
