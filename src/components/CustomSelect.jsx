import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const CustomSelect = ({ value, options, onChange, style }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: 'relative', ...style }}>
      <div 
        className="input-field" 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          cursor: 'pointer', 
          userSelect: 'none',
          padding: '10px 16px'
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{options.find(o => (o.value !== undefined ? o.value : o) === value)?.label || value}</span>
        <ChevronDown size={18} style={{ color: 'var(--text-muted)' }} />
      </div>

      {isOpen && (
        <>
          <div 
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }}
            onClick={() => setIsOpen(false)}
          />
          <div 
            className="hide-scrollbar"
            style={{ 
              position: 'absolute', top: '100%', left: 0, right: 0, 
              marginTop: '8px', background: 'var(--surface)', 
              border: '1px solid var(--border)', borderRadius: '8px', 
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)', zIndex: 11,
              maxHeight: '200px', overflowY: 'auto'
            }}
          >
            {options.map((opt) => {
              const val = opt.value !== undefined ? opt.value : opt;
              const label = opt.label !== undefined ? opt.label : opt;
              return (
                <div 
                  key={val} 
                  style={{ 
                    padding: '10px 16px', cursor: 'pointer', 
                    background: value === val ? 'var(--surface-hover)' : 'transparent',
                    transition: 'background 0.2s ease',
                    fontSize: '0.9rem'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = value === val ? 'var(--surface-hover)' : 'transparent'}
                  onClick={() => {
                    onChange(val);
                    setIsOpen(false);
                  }}
                >
                  {label}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default CustomSelect;
