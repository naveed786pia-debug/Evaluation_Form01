import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppFooter } from "./components/AppFooter";
import { AppHeader } from "./components/AppHeader";
import { HomePage } from "./pages/Home/HomePage";
import "./styles/app-shell.css";

export const App = () => (
  <BrowserRouter>
    <div className="app-shell">
      <AppHeader />
      <main className="view-container">
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </main>
      <AppFooter />
    </div>
  </BrowserRouter>
);
