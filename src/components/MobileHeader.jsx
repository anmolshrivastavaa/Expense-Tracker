import React from 'react';

const MobileHeader = () => {
  return (
    <div className="mobile-header glass">
      <div className="flex items-center gap-3">
        <div style={{ background: 'var(--primary)', padding: '6px', borderRadius: '10px', display: 'flex' }}>
          <img src="/favicon.png" alt="Wallet" width="20" height="20" />
        </div>
        <h2 className="title" style={{ margin: 0, fontSize: '1.2rem' }}>ExpenseTracker</h2>
      </div>
    </div>
  );
};

export default MobileHeader;
