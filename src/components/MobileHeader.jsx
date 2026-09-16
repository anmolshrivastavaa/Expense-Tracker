import React from 'react';

const MobileHeader = () => {
  return (
    <div className="mobile-header glass" style={{ justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
      <div style={{ display: 'flex' }}>
        <img src="/myicon.png" alt="Wallet" width="44" height="44" />
      </div>
      <h2 className="title" style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)' }}>ExpenseTracker</h2>
    </div>
  );
};

export default MobileHeader;
