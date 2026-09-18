import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const MobileHeader = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="mobile-header glass" style={{ justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img src="/myicon.png" alt="Wallet" width="44" height="44" />
        <h2 className="title" style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)' }}>ExpenseTracker</h2>
      </div>
      <button onClick={toggleTheme} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-main)', display: 'flex', padding: '8px' }}>
        {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
      </button>
    </div>
  );
};

export default MobileHeader;
