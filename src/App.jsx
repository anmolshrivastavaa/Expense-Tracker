import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, TrendingUp, Wallet, PlusCircle, ShoppingCart, Calendar, Sun, Moon } from 'lucide-react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Dashboard from './pages/Dashboard';
import ExpenseLogger from './pages/ExpenseLogger';
import ProjectedDebt from './pages/ProjectedDebt';
import InflowLogger from './pages/InflowLogger';
import Investments from './pages/Investments';
import DGoldPurchase from './pages/DGoldPurchase';
import MobileHeader from './components/MobileHeader';
import MobileBottomNav from './components/MobileBottomNav';
import './index.css';

const Sidebar = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <aside className="sidebar glass">
      <div className="flex items-center gap-4 mb-8">
        <div style={{ display: 'flex' }}>
          <img src="/myicon.png" alt="Wallet" width="48" height="48" />
        </div>
        <h2 className="title" style={{ margin: 0, fontSize: '1.25rem' }}>ExpenseTracker</h2>
      </div>
      
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        <NavLink 
          to="/" 
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        
        <NavLink 
          to="/expenses" 
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
        >
          <Receipt size={20} />
          <span>Expense Logger</span>
        </NavLink>

        <NavLink 
          to="/inflows" 
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
        >
          <PlusCircle size={20} />
          <span>Inflow Logger</span>
        </NavLink>

        <NavLink 
          to="/projected-debt" 
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
        >
          <Calendar size={20} />
          <span>Projected Debt</span>
        </NavLink>

        <NavLink 
          to="/investments" 
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
        >
          <TrendingUp size={20} />
          <span>D-Gold Dashboard</span>
        </NavLink>

        <NavLink 
          to="/purchase-gold" 
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
        >
          <ShoppingCart size={20} />
          <span>D-Gold Purchase</span>
        </NavLink>
      </nav>
      
      <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
        <button onClick={toggleTheme} className="nav-link" style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center' }}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </div>
    </aside>
  );
};

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="app-container">
          <MobileHeader />
          <Sidebar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/expenses" element={<ExpenseLogger />} />
              <Route path="/inflows" element={<InflowLogger />} />
              <Route path="/projected-debt" element={<ProjectedDebt />} />
              <Route path="/investments" element={<Investments />} />
              <Route path="/purchase-gold" element={<DGoldPurchase />} />
            </Routes>
          </main>
          <MobileBottomNav />
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
