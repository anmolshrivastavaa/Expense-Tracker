import React, { useState, useEffect } from 'react';
import { PlusCircle, Loader2, Trash2, Edit2, X, CheckCircle, AlertCircle, Banknote, Trash, Calendar, ChevronDown, History, Wallet } from 'lucide-react';
import { supabase } from '../supabaseClient';
import CustomSelect from '../components/CustomSelect';
import ScreenLoader from '../components/ScreenLoader';

const DEFAULT_CATEGORIES = ['Salary', 'Bonus', 'Freelance', 'Dividends', 'Gift', 'Other'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const YEARS = [2025, 2026, 2027, 2028, 2029, 2030];

const InflowLogger = () => {
  const [allInflows, setAllInflows] = useState([]);
  
  // Filter States
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  
  // Category Management
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('inflowCategories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });
  
  const [loading, setLoading] = useState(true);
  
  const getMinDate = (y, m) => {
    const mo = String(m + 1).padStart(2, '0');
    return `${y}-${mo}-01`;
  };

  const getMaxDate = (y, m) => {
    const d = new Date(y, m + 1, 0); 
    const mo = String(m + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${mo}-${day}`;
  };
  
  const initialDate = new Date();
  let defaultDateString = initialDate.toISOString().split('T')[0];
  if (initialDate.getMonth() !== filterMonth || initialDate.getFullYear() !== filterYear) {
    defaultDateString = getMinDate(filterYear, filterMonth);
  }

  // Form State
  const [date, setDate] = useState(defaultDateString);
  const [category, setCategory] = useState(categories.length > 0 ? categories[0] : '');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('UPI');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // In-app popup states
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [addedInflow, setAddedInflow] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  useEffect(() => {
    const min = getMinDate(filterYear, filterMonth);
    const max = getMaxDate(filterYear, filterMonth);
    if (date < min || date > max) {
      setDate(min);
    }
  }, [filterMonth, filterYear]);

  const fetchInflows = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('type', 'income')
        .order('date', { ascending: false });

      if (error) throw error;
      setAllInflows(data || []);
    } catch (err) {
      console.error("Fetch Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInflows();
  }, []);

  const confirmDeleteCategory = () => {
    if (!categoryToDelete) return;
    
    const updated = categories.filter(c => c !== categoryToDelete);
    setCategories(updated);
    localStorage.setItem('inflowCategories', JSON.stringify(updated));
    
    if (category === categoryToDelete) {
      setCategory(updated.length > 0 ? updated[0] : '');
    }
    
    showToast('Category removed successfully.');
    setCategoryToDelete(null);
  };

  const handleCreateCustomCategory = () => {
    const newCat = newCategoryName.trim();
    if (!newCat) {
      showToast("Please enter a category name.", "error");
      return;
    }
    
    if (!categories.includes(newCat)) {
      const updated = [...categories, newCat];
      setCategories(updated);
      localStorage.setItem('inflowCategories', JSON.stringify(updated));
    }
    
    setCategory(newCat);
    setIsNewCategory(false);
    setNewCategoryName('');
    showToast(`Category "${newCat}" created!`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount)) return;
    if (!category) {
      showToast("Please select or create a category.", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        date,
        category: category,
        amount: parseFloat(amount),
        type: 'income',
        note: source
      };

      if (editingId) {
        const { error } = await supabase
          .from('transactions')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
        showToast('Inflow updated successfully!');
      } else {
        const { error } = await supabase
          .from('transactions')
          .insert([payload]);
        if (error) throw error;
        showToast('Inflow added successfully!');
        
        const amountAdded = amount;
        setAddedInflow(amountAdded);
        setTimeout(() => setAddedInflow(null), 3500);
      }
      
      resetForm();
      fetchInflows();
    } catch (err) {
      console.error("Save Error:", err.message);
      showToast("Could not save to Supabase. Check your connection.", 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', deleteConfirmId);

      if (error) throw error;
      
      setDeleteConfirmId(null);
      showToast('Inflow deleted successfully!');
      fetchInflows();
    } catch (err) {
      console.error("Delete Error:", err.message);
      showToast("Failed to delete. Check table permissions.", 'error');
      setDeleteConfirmId(null);
    }
  };

  const handleEdit = (inflow) => {
    const inflowDate = new Date(inflow.date);
    const inflowMonth = inflowDate.getMonth();
    const inflowYear = inflowDate.getFullYear();
    
    if (inflowMonth !== filterMonth || inflowYear !== filterYear) {
      setFilterMonth(inflowMonth);
      setFilterYear(inflowYear);
    }

    setDate(inflow.date);
    
    if (!categories.includes(inflow.category)) {
      const updated = [...categories, inflow.category];
      setCategories(updated);
      localStorage.setItem('inflowCategories', JSON.stringify(updated));
    }
    
    setCategory(inflow.category);
    setIsNewCategory(false);
    setNewCategoryName('');
    setAmount(inflow.amount);
    setSource(inflow.note || 'UPI');
    setEditingId(inflow.id);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    const initialDate = new Date();
    let defaultDateStr = initialDate.toISOString().split('T')[0];
    if (initialDate.getMonth() !== filterMonth || initialDate.getFullYear() !== filterYear) {
      defaultDateStr = getMinDate(filterYear, filterMonth);
    }
    
    setDate(defaultDateStr);
    setCategory(categories.length > 0 ? categories[0] : '');
    setIsNewCategory(false);
    setNewCategoryName('');
    setAmount('');
    setSource('UPI');
    setEditingId(null);
  };

  const filteredInflows = allInflows.filter(inflow => {
    const d = new Date(inflow.date);
    return d.getMonth() === filterMonth && d.getFullYear() === filterYear;
  });

  return (
    <div style={{ position: 'relative' }}>
      {addedInflow && (
        <div className="expense-animation-container">
          <Wallet size={120} className="wallet-animated-icon-inflow text-success" />
          <div className="inflow-flying-text">
            +₹{Number(addedInflow).toLocaleString()}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: toast.type === 'error' ? 'var(--danger)' : 'var(--secondary)',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          zIndex: 1000,
          animation: 'slideIn 0.3s ease'
        }}>
          {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
          <span style={{ fontWeight: 500 }}>{toast.message}</span>
        </div>
      )}

      {/* Delete Inflow Modal */}
      {deleteConfirmId && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="glass-card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
            <AlertCircle size={48} className="text-danger" style={{ margin: '0 auto 16px auto' }} />
            <h3 style={{ marginBottom: '8px', fontSize: '1.25rem' }}>Delete Record?</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
              This action cannot be undone. Are you sure you want to permanently delete this inflow record?
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1 }}
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </button>
              <button 
                className="btn" 
                style={{ flex: 1, background: 'var(--danger)' }}
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Category Modal */}
      {categoryToDelete && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="glass-card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
            <Trash size={48} className="text-danger" style={{ margin: '0 auto 16px auto' }} />
            <h3 style={{ marginBottom: '8px', fontSize: '1.25rem' }}>Remove Category?</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
              Are you sure you want to permanently remove "{categoryToDelete}" from your categories list?
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1 }}
                onClick={() => setCategoryToDelete(null)}
              >
                Cancel
              </button>
              <button 
                className="btn" 
                style={{ flex: 1, background: 'var(--danger)' }}
                onClick={confirmDeleteCategory}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between" style={{ marginBottom: '32px' }}>
        <h1 className="title" style={{ margin: 0 }}>Inflow Logger</h1>
      </div>
      
      <div className="stats-grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
        
        {/* Form Section */}
        <div className="glass-card" style={{ height: 'fit-content' }}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Banknote size={24} className="text-secondary" />
              <h3 className="subtitle" style={{ marginBottom: 0 }}>
                {editingId ? 'Edit Inflow' : 'Log New Inflow'}
              </h3>
            </div>
            {editingId && (
              <button onClick={resetForm} className="btn btn-secondary" style={{ padding: '4px', border: 'none' }}>
                <X size={20} />
              </button>
            )}
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Date (Restricted to filter)</label>
              <input 
                type="date" 
                className="input-field" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={getMinDate(filterYear, filterMonth)}
                max={getMaxDate(filterYear, filterMonth)}
                required
              />
            </div>
            
            <div className="input-group">
              <label className="input-label">Category</label>
              {!isNewCategory ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  
                  {/* Custom Dropdown */}
                  <div style={{ position: 'relative', flex: 1 }}>
                    <div 
                      className="input-field" 
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                    >
                      <span>{category || 'Select Category...'}</span>
                      <ChevronDown size={18} style={{ color: 'var(--text-muted)' }} />
                    </div>

                    {isCategoryDropdownOpen && (
                      <>
                        <div 
                          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }}
                          onClick={() => setIsCategoryDropdownOpen(false)}
                        />
                        <div 
                          className="hide-scrollbar"
                          style={{ 
                            position: 'absolute', top: '100%', left: 0, right: 0, 
                            marginTop: '8px', background: 'var(--surface)', 
                            border: '1px solid var(--border)', borderRadius: '8px', 
                            boxShadow: '0 8px 32px rgba(0,0,0,0.3)', zIndex: 11,
                            overflowY: 'auto', maxHeight: '250px'
                          }}
                        >
                          {categories.map(cat => (
                            <div 
                              key={cat} 
                              style={{ 
                                padding: '12px 16px', cursor: 'pointer', 
                                background: category === cat ? 'var(--surface-hover)' : 'transparent',
                                transition: 'background 0.2s ease'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = category === cat ? 'var(--surface-hover)' : 'transparent'}
                              onClick={() => {
                                setCategory(cat);
                                setIsCategoryDropdownOpen(false);
                              }}
                            >
                              {cat}
                            </div>
                          ))}
                          <div style={{ height: '1px', background: 'var(--border)' }} />
                          <div 
                            style={{ 
                              padding: '12px 16px', cursor: 'pointer', color: 'var(--primary)', fontWeight: 600,
                              display: 'flex', alignItems: 'center', gap: '8px',
                              transition: 'background 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            onClick={() => {
                              setIsNewCategory(true);
                              setIsCategoryDropdownOpen(false);
                            }}
                          >
                            <PlusCircle size={16} /> Add New Category
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Delete Category Button */}
                  {category && (
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => setCategoryToDelete(category)}
                      title={`Delete "${category}" category`}
                      style={{ padding: '0 12px', height: '46px' }}
                    >
                      <Trash size={16} className="text-danger" />
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '12px', 
                  background: 'var(--surface-hover)', 
                  padding: '16px', 
                  borderRadius: '8px', 
                  border: '1px solid var(--border)' 
                }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    Create Custom Category
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      className="input-field"
                      placeholder="e.g., Side Hustle"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      autoFocus
                      style={{ flex: 1, background: 'var(--surface)' }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCreateCustomCategory();
                        }
                      }}
                    />
                    <button 
                      type="button" 
                      className="btn"
                      onClick={handleCreateCustomCategory}
                      style={{ padding: '0 16px' }}
                      title="Save Category"
                    >
                      <CheckCircle size={18} />
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => {
                        setIsNewCategory(false);
                        setCategory(categories.length > 0 ? categories[0] : '');
                        setNewCategoryName('');
                      }}
                      style={{ padding: '0 16px' }}
                      title="Cancel"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="input-group">
              <label className="input-label">Amount (₹)</label>
              <input 
                type="number" 
                className="input-field" 
                placeholder="e.g., 50000" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            
            <div className="input-group">
              <label className="input-label">Source</label>
              <CustomSelect
                value={source}
                options={['UPI', 'Cash']}
                onChange={(val) => setSource(val)}
              />
            </div>
            
            <button type="submit" className="btn mt-8" style={{ width: '100%' }} disabled={isSubmitting || isNewCategory}>
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={18} />
              ) : editingId ? (
                <Edit2 size={18} />
              ) : (
                <PlusCircle size={18} />
              )}
              {isSubmitting ? 'Saving...' : editingId ? 'Update Inflow' : 'Add Inflow'}
            </button>
          </form>
        </div>

        {/* Table Section */}
        <div className="glass-card">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Calendar size={24} className="text-primary" />
              <h3 className="subtitle" style={{ marginBottom: 0 }}>All Inflows</h3>
            </div>
            
            {/* Filter Controls */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <CustomSelect
                style={{ minWidth: '130px' }}
                value={filterMonth}
                options={MONTHS.map((m, i) => ({ label: m, value: i }))}
                onChange={(val) => setFilterMonth(val)}
              />
              
              <CustomSelect
                style={{ minWidth: '100px' }}
                value={filterYear}
                options={YEARS}
                onChange={(val) => setFilterYear(val)}
              />
            </div>
          </div>
          
          {loading ? (
             <ScreenLoader />
          ) : filteredInflows.length === 0 ? (
             <div style={{ padding: '20px', color: 'var(--text-muted)' }}>No inflows logged for {MONTHS[filterMonth]} {filterYear}.</div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInflows.map((inflow) => (
                    <tr key={inflow.id}>
                      <td>{new Date(inflow.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td>
                        <span style={{ 
                          background: 'var(--surface-hover)', 
                          padding: '4px 12px', 
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                          marginRight: '8px'
                        }}>
                          {inflow.category}
                        </span>
                        {inflow.note && (
                          <span style={{ 
                            background: inflow.note === 'UPI' ? 'var(--primary)' : 'var(--tertiary)', 
                            padding: '4px 8px', 
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            color: 'white',
                            opacity: 0.9
                          }}>
                            {inflow.note}
                          </span>
                        )}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--secondary)' }}>+₹{inflow.amount}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px', border: 'none' }}
                            onClick={() => handleEdit(inflow)}
                            title="Edit"
                          >
                            <Edit2 size={16} className="text-primary" />
                          </button>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px', border: 'none' }}
                            onClick={() => setDeleteConfirmId(inflow.id)}
                            title="Delete"
                          >
                            <Trash2 size={16} className="text-danger" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InflowLogger;
