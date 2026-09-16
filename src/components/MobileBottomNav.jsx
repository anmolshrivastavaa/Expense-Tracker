import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, TrendingUp, PlusCircle, ShoppingCart, Calendar } from 'lucide-react';

const MobileBottomNav = () => {
  return (
    <nav className="mobile-bottom-nav glass">
      <NavLink to="/" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} end>
        <LayoutDashboard size={24} />
      </NavLink>
      
      <NavLink to="/expenses" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
        <Receipt size={24} />
      </NavLink>

      <NavLink to="/inflows" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
        <PlusCircle size={24} />
      </NavLink>

      <NavLink to="/projected-debt" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
        <Calendar size={24} />
      </NavLink>

      <NavLink to="/investments" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
        <TrendingUp size={24} />
      </NavLink>

      <NavLink to="/purchase-gold" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
        <ShoppingCart size={24} />
      </NavLink>
    </nav>
  );
};

export default MobileBottomNav;
