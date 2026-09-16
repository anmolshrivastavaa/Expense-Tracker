import React from 'react';

const ScreenLoader = () => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px 20px' }}>
      <div className="beautiful-loader">
        <div className="loader-ring"></div>
        <div className="loader-core"></div>
      </div>
    </div>
  );
};

export default ScreenLoader;
