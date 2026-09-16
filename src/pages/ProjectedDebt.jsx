import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { Calendar, Loader2, PlusCircle, CheckCircle, Circle, Trash2, Edit2, AlertCircle, X, MinusCircle } from 'lucide-react';
import CustomSelect from '../components/CustomSelect';
import ScreenLoader from '../components/ScreenLoader';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

const ProjectedDebt = () => {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // In-app popup states
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [undoConfirmId, setUndoConfirmId] = useState(null);
  const [paymentModal, setPaymentModal] = useState({ show: false, debt: null, amount: '' });
  const [deductedAmount, setDeductedAmount] = useState(null);
  const [debtPaidCelebration, setDebtPaidCelebration] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  useEffect(() => {
    fetchDebts();
  }, []);

  const fetchDebts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projected_debts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDebts(data || []);
    } catch (err) {
      console.error("Fetch Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDebt = async (e) => {
    e.preventDefault();
    if (!title || !amount) return;

    try {
      setIsSubmitting(true);
      
      const payload = {
        title,
        amount: parseFloat(amount),
        month: MONTHS[new Date().getMonth()],
        year: new Date().getFullYear().toString()
      };

      if (editingId) {
        const { error } = await supabase
          .from('projected_debts')
          .update(payload)
          .eq('id', editingId);

        if (error) throw error;
        showToast('Debt updated successfully!');
      } else {
        const { error } = await supabase
          .from('projected_debts')
          .insert([{ ...payload, is_paid: false, amount_paid: 0 }]);

        if (error) throw error;
        showToast('Debt added successfully!');
        
        const amountAdded = amount;
        setDeductedAmount(amountAdded);
        setTimeout(() => setDeductedAmount(null), 2500);
      }
      
      // Clear form
      resetForm();
      
      // Refresh list
      fetchDebts();
    } catch (err) {
      console.error("Save Error:", err.message);
      showToast("Failed to save debt. Check your connection.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setEditingId(null);
  };

  const handleEdit = (debt) => {
    setTitle(debt.title);
    setAmount(debt.amount);
    setEditingId(debt.id);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePaymentClick = (debt) => {
    if (debt.is_paid) {
      setUndoConfirmId(debt.id);
    } else {
      setPaymentModal({ show: true, debt, amount: '' });
    }
  };

  const handlePaymentSubmit = async (e, isFull) => {
    e?.preventDefault();
    const { debt, amount } = paymentModal;
    
    let paymentAmount = isFull ? debt.amount : parseFloat(amount);
    if (!paymentAmount || paymentAmount <= 0) {
      showToast("Please enter a valid amount", "error");
      return;
    }

    const newAmountPaid = Number(debt.amount_paid || 0) + paymentAmount;
    const isNowPaid = newAmountPaid >= debt.amount;

    try {
      setDebts(prev => prev.map(d => d.id === debt.id ? { ...d, amount_paid: newAmountPaid, is_paid: isNowPaid } : d));
      
      const { error } = await supabase
        .from('projected_debts')
        .update({ amount_paid: newAmountPaid, is_paid: isNowPaid })
        .eq('id', debt.id);

      if (error) {
        fetchDebts();
        throw error;
      }
      showToast(isNowPaid ? 'Marked as fully paid!' : 'Partial payment recorded!');
      
      if (isNowPaid) {
        setDebtPaidCelebration(true);
        setTimeout(() => setDebtPaidCelebration(false), 3500);
      }
      
      setPaymentModal({ show: false, debt: null, amount: '' });
    } catch (err) {
      console.error("Payment Error:", err.message);
      showToast("Failed to process payment.", "error");
    }
  };

  const revertPayment = async (id) => {
    try {
      setDebts(prev => prev.map(d => d.id === id ? { ...d, amount_paid: 0, is_paid: false } : d));
      
      const { error } = await supabase
        .from('projected_debts')
        .update({ amount_paid: 0, is_paid: false })
        .eq('id', id);

      if (error) {
        fetchDebts();
        throw error;
      }
      showToast('Marked as unpaid.');
    } catch (err) {
      console.error("Revert Error:", err.message);
      showToast("Failed to undo payment.", "error");
    } finally {
      setUndoConfirmId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    
    try {
      const { error } = await supabase
        .from('projected_debts')
        .delete()
        .eq('id', deleteConfirmId);

      if (error) throw error;
      
      setDebts(prev => prev.filter(d => d.id !== deleteConfirmId));
      showToast('Debt removed successfully!');
    } catch (err) {
      console.error("Delete Error:", err.message);
      showToast("Failed to delete.", "error");
      fetchDebts();
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const totalProjected = debts.reduce((sum, d) => sum + Number(d.amount), 0);
  const totalPaid = debts.reduce((sum, d) => sum + Number(d.amount_paid || 0), 0);
  const totalRemaining = debts.reduce((sum, d) => sum + Math.max(0, Number(d.amount) - Number(d.amount_paid || 0)), 0);

  return (
    <div style={{ position: 'relative' }}>
      {debtPaidCelebration && (
        <div className="debt-paid-animation">
          <CheckCircle size={100} />
          <span>PAID</span>
        </div>
      )}

      {deductedAmount && (
        <div className="debt-deduction">
          -₹{Number(deductedAmount).toLocaleString()}
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

      {/* Delete Confirmation Modal */}
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
            <h3 style={{ marginBottom: '8px', fontSize: '1.25rem' }}>Remove Debt?</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
              Are you sure you want to permanently delete this liability? This action cannot be undone.
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

      {/* Undo Payment Modal */}
      {undoConfirmId && (
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
            <AlertCircle size={48} className="text-warning" style={{ margin: '0 auto 16px auto' }} />
            <h3 style={{ marginBottom: '8px', fontSize: '1.25rem' }}>Undo Payment?</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
              This will reset the payment progress back to 0. Are you sure you want to mark this as unpaid?
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1 }}
                onClick={() => setUndoConfirmId(null)}
              >
                Cancel
              </button>
              <button 
                className="btn" 
                style={{ flex: 1, background: 'var(--warning)', color: '#000' }}
                onClick={() => revertPayment(undoConfirmId)}
              >
                Undo Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModal.show && (
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
          <div className="glass-card" style={{ maxWidth: '450px', width: '100%' }}>
            <h3 className="subtitle mb-6">Record Payment</h3>
            <p style={{ color: 'var(--text-main)', marginBottom: '8px', fontWeight: 500 }}>{paymentModal.debt?.title}</p>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.875rem' }}>
              Total Amount: ₹{paymentModal.debt?.amount.toLocaleString()} <br/>
              Remaining: ₹{(paymentModal.debt?.amount - (paymentModal.debt?.amount_paid || 0)).toLocaleString()}
            </p>
            
            <form onSubmit={(e) => handlePaymentSubmit(e, false)}>
              <div className="input-group" style={{ marginBottom: '24px' }}>
                <label className="input-label">Payment Amount (₹)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  placeholder="0.00"
                  value={paymentModal.amount}
                  onChange={e => setPaymentModal(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  type="button"
                  className="btn btn-secondary" 
                  style={{ flex: 1 }}
                  onClick={() => setPaymentModal({ show: false, debt: null, amount: '' })}
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  className="btn" 
                  style={{ flex: 1.5, background: 'var(--secondary)' }}
                  onClick={(e) => handlePaymentSubmit(e, true)}
                >
                  Pay Full
                </button>
                <button 
                  type="submit"
                  className="btn" 
                  style={{ flex: 1.5 }}
                  disabled={!paymentModal.amount}
                >
                  Pay Partial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <h1 className="title" style={{ marginBottom: 0 }}>Projected Debt</h1>
      </div>

      <div className="stats-grid" style={{ marginBottom: '32px' }}>
        <div className="glass-card" style={{ gridColumn: '1 / -1', position: 'relative', zIndex: 20 }}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              {editingId ? <Edit2 size={24} className="text-primary" /> : <PlusCircle size={24} className="text-primary" />}
              <h3 className="subtitle" style={{ marginBottom: 0 }}>
                {editingId ? 'Edit Liability' : 'Add New Liability / EMI'}
              </h3>
            </div>
            {editingId && (
              <button onClick={resetForm} className="btn btn-secondary" style={{ padding: '4px', border: 'none' }} title="Cancel Editing">
                <X size={20} />
              </button>
            )}
          </div>
          
          <form onSubmit={handleAddDebt} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div className="input-group" style={{ flex: '2', minWidth: '200px' }}>
              <label className="input-label">Title / Description</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g. Car EMI, Credit Card Bill"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="input-group" style={{ flex: '1', minWidth: '150px' }}>
              <label className="input-label">Amount (₹)</label>
              <input 
                type="number" 
                className="input-field" 
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="input-group" style={{ display: 'flex', flexDirection: 'column' }}>
              <label className="input-label">&nbsp;</label>
              <button type="submit" className="btn" disabled={isSubmitting} style={{ height: '46px', padding: '0 24px', whiteSpace: 'nowrap' }}>
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={20} /> 
                ) : editingId ? (
                  <>Update Debt</>
                ) : (
                  <>Add Debt</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="glass-card mb-8" style={{ position: 'relative', zIndex: 10 }}>
        {/* KPIs for the all-time debts */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', background: 'var(--surface-hover)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px' }}>TOTAL PROJECTED</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--warning)' }}>₹{totalProjected.toLocaleString()}</div>
          </div>
          <div style={{ flex: '1', background: 'var(--surface-hover)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px' }}>TOTAL PAID</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--secondary)' }}>+₹{totalPaid.toLocaleString()}</div>
          </div>
          <div style={{ flex: '1', background: 'var(--surface-hover)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px' }}>REMAINING TO PAY</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--danger)' }}>-₹{totalRemaining.toLocaleString()}</div>
          </div>
        </div>

        {/* Debts Table */}
        {loading ? (
          <ScreenLoader />
        ) : debts.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Title</th>
                  <th>Month Added</th>
                  <th>Amount</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {debts.map((debt) => (
                  <tr key={debt.id} style={{ opacity: debt.is_paid ? 0.6 : 1 }}>
                    <td style={{ width: '80px' }}>
                      <button 
                        onClick={() => handlePaymentClick(debt)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                        title={debt.is_paid ? "Undo Payment" : "Record Payment"}
                      >
                        {debt.is_paid ? (
                          <CheckCircle className="text-success" size={24} />
                        ) : debt.amount_paid > 0 ? (
                          <MinusCircle className="text-warning" size={24} />
                        ) : (
                          <Circle className="text-muted" size={24} />
                        )}
                      </button>
                    </td>
                    <td style={{ textDecoration: debt.is_paid ? 'line-through' : 'none' }}>
                      {debt.title}
                      {debt.amount_paid > 0 && !debt.is_paid && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--warning)', marginTop: '4px', fontWeight: 500 }}>
                          Partially Paid: ₹{debt.amount_paid.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{debt.month} {debt.year}</td>
                    <td className={debt.is_paid ? "text-muted" : "text-danger"} style={{ fontWeight: 600, textDecoration: debt.is_paid ? 'line-through' : 'none' }}>
                      ₹{debt.amount.toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '6px', border: 'none' }}
                          onClick={() => handleEdit(debt)}
                          title="Edit"
                        >
                          <Edit2 size={16} className="text-primary" />
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '6px', border: 'none' }}
                          onClick={() => setDeleteConfirmId(debt.id)}
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
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No projected debts logged yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectedDebt;
