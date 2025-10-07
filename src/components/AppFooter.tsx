import "../styles/app-footer.css";

const currentYear = new Date().getFullYear();

export const AppFooter = () => (
  <footer className="footer-panel">
    <p className="footer-message">You are viewing a fresh Builder starter workspace.</p>
    <p className="footer-meta">© {currentYear} Builder Starter. All rights reserved.</p>
  </footer>
);
