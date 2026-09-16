import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, TrendingUp, Wallet, PlusCircle, ShoppingCart, Calendar } from 'lucide-react';
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
  return (
    <aside className="sidebar glass">
      <div className="flex items-center gap-4 mb-8">
        <div style={{ background: 'var(--primary)', padding: '8px', borderRadius: '12px' }}>
          <Wallet color="white" />
        </div>
        <h2 className="title" style={{ margin: 0, fontSize: '1.25rem' }}>ExpenseTracker</h2>
      </div>
      
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
    </aside>
  );
};

function App() {
  return (
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
  );
}

export default App;
