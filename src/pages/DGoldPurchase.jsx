import React, { useState, useEffect } from 'react';
import { PlusCircle, Loader2, Coins, Trash2, Edit2, X, CheckCircle, AlertCircle, History, ShoppingCart } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import ScreenLoader from '../components/ScreenLoader';
import CustomSelect from '../components/CustomSelect';
import { playSuccessSound } from '../utils/sound';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const YEARS = [2025, 2026, 2027, 2028, 2029, 2030];

const DGoldPurchase = () => {
  const currentMonth = MONTHS[new Date().getMonth()];
  const currentYear = new Date().getFullYear();

  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [amount, setAmount] = useState('');
  const [gms, setGms] = useState('');
  const [rate, setRate] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // In-app popup states
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const fetchInvestments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('investments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvestments(data || []);
    } catch (err) {
      console.error("Fetch Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestments();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !gms || !rate) return;

    try {
      setIsSubmitting(true);
      const formattedMonth = `${month} ${year}`;
      const payload = {
        month: formattedMonth,
        amount: parseFloat(amount),
        gms: parseFloat(gms),
        rate: parseFloat(rate)
      };

      if (editingId) {
        // Update existing record
        const { error } = await supabase
          .from('investments')
          .update(payload)
          .eq('id', editingId);

        if (error) throw error;
        showToast('Purchase updated successfully!');
      } else {
        // Insert new record
        const { error } = await supabase
          .from('investments')
          .insert([payload]);

        if (error) throw error;
        showToast('Purchase added successfully!');
        playSuccessSound();
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
      }

      resetForm();
      fetchInvestments();
    } catch (err) {
      console.error("Save Error:", err.message);
      showToast("Could not save. Check connection or table permissions.", 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;

    try {
      const { error } = await supabase
        .from('investments')
        .delete()
        .eq('id', deleteConfirmId);

      if (error) throw error;

      setDeleteConfirmId(null);
      showToast('Purchase deleted successfully!');
      fetchInvestments();
    } catch (err) {
      console.error("Delete Error:", err.message);
      showToast("Failed to delete. Check table permissions.", 'error');
      setDeleteConfirmId(null);
    }
  };

  const handleEdit = (inv) => {
    const parts = inv.month.split(' ');
    let parsedMonth = currentMonth;
    let parsedYear = currentYear;

    if (parts.length === 2) {
      parsedMonth = parts[0];
      parsedYear = parseInt(parts[1], 10);
    } else {
      parsedMonth = inv.month;
    }

    setMonth(parsedMonth);
    setYear(parsedYear);
    setAmount(inv.amount);
    setGms(inv.gms);
    setRate(inv.rate);
    setEditingId(inv.id);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setMonth(currentMonth);
    setYear(currentYear);
    setAmount('');
    setGms('');
    setRate('');
    setEditingId(null);
  };

  return (
    <div style={{ position: 'relative' }}>
      {showCelebration && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="gold-coin"
              style={{
                left: `${Math.random() * 100}%`,
                animationDuration: `${1.5 + Math.random() * 1.5}s`,
                animationDelay: `${Math.random() * 0.3}s`
              }}
            />
          ))}
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
            <h3 style={{ marginBottom: '8px', fontSize: '1.25rem' }}>Delete Purchase?</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
              This action cannot be undone. Are you sure you want to permanently delete this record?
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

      <h1 className="title">D-Gold Management</h1>

      <div className="stats-grid" style={{ gridTemplateColumns: '1fr 2fr' }}>

        {/* Form Section */}
        <div className="glass-card" style={{ height: 'fit-content' }}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Coins size={24} className="text-warning" />
              <h3 className="subtitle" style={{ marginBottom: 0 }}>
                {editingId ? 'Edit Purchase' : 'Log New Purchase'}
              </h3>
            </div>
            {editingId && (
              <button onClick={resetForm} className="btn btn-secondary" style={{ padding: '4px', border: 'none' }}>
                <X size={20} />
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="input-group">
                <label className="input-label">Month</label>
                <CustomSelect
                  value={month}
                  options={MONTHS}
                  onChange={(val) => setMonth(val)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Year</label>
                <CustomSelect
                  value={year}
                  options={YEARS}
                  onChange={(val) => setYear(Number(val))}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Amount Spent (₹)</label>
              <input
                type="number"
                step="0.01"
                className="input-field"
                placeholder="e.g., 1000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Grams Received (g)</label>
              <input
                type="number"
                step="0.0001"
                className="input-field"
                placeholder="e.g., 0.0636"
                value={gms}
                onChange={(e) => setGms(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Rate (₹ per gm)</label>
              <input
                type="number"
                step="0.01"
                className="input-field"
                placeholder="e.g., 15263"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn mt-8" style={{ width: '100%' }} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={18} />
              ) : editingId ? (
                <Edit2 size={18} />
              ) : (
                <ShoppingCart size={18} />
              )}
              {isSubmitting ? 'Saving...' : editingId ? 'Update Purchase' : 'Add Purchase'}
            </button>
          </form>
        </div>

        {/* List Section */}
        <div className="glass-card">
          <div className="flex items-center gap-4 mb-8">
            <History size={24} className="text-primary" />
            <h3 className="subtitle" style={{ marginBottom: 0 }}>All Purchases</h3>
          </div>

          {loading ? (
            <ScreenLoader />
          ) : investments.length === 0 ? (
            <div style={{ padding: '20px', color: 'var(--text-muted)' }}>No purchases found.</div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Month/Year</th>
                    <th>Amount</th>
                    <th>Grams</th>
                    <th>Rate</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {investments.map((row) => (
                    <tr key={row.id}>
                      <td>{row.month}</td>
                      <td style={{ fontWeight: 600 }}>₹{row.amount}</td>
                      <td className="text-warning">{row.gms}</td>
                      <td>₹{row.rate}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px', border: 'none' }}
                            onClick={() => handleEdit(row)}
                            title="Edit"
                          >
                            <Edit2 size={16} className="text-primary" />
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px', border: 'none' }}
                            onClick={() => setDeleteConfirmId(row.id)}
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

export default DGoldPurchase;
