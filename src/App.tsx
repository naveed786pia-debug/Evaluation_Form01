import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppFooter } from "./components/AppFooter";
import { AppHeader } from "./components/AppHeader";
import { HomePage } from "./pages/Home/HomePage";
import { EvaluationFormPage } from "./pages/EvaluationForm/EvaluationFormPage";
import { ReportsPage } from "./pages/Reports/ReportsPage";
import { SqlReferencePage } from "./pages/SqlReference/SqlReferencePage";
import { EvaluationProvider } from "./state/EvaluationContext";
import "./styles/app-shell.css";

export const App = () => (
  <BrowserRouter>
    <EvaluationProvider>
      <div className="app-shell">
        <AppHeader />
        <main className="view-container">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/evaluate" element={<EvaluationFormPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/sql" element={<SqlReferencePage />} />
          </Routes>
        </main>
        <AppFooter />
      </div>
    </EvaluationProvider>
  </BrowserRouter>
);
