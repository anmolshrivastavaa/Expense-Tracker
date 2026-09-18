import React, { useState, useEffect, useMemo } from 'react';
import { ArrowDown, ArrowUp, DollarSign, Filter, Loader2, Calendar, Wallet, Smartphone, Coins, PieChart as PieChartIcon, CreditCard } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { supabase } from '../supabaseClient';
import CustomSelect from '../components/CustomSelect';
import ScreenLoader from '../components/ScreenLoader';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('monthly');
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [selectedYear, setSelectedYear] = useState('All Years');
  const [transactions, setTransactions] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentMonthIndex = new Date().getMonth();
  const currentMonthName = MONTHS[currentMonthIndex];

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Note: You must add your Supabase URL and Anon Key to supabaseClient.js
        const [transRes, investRes, debtsRes] = await Promise.all([
          supabase.from('transactions').select('*').order('date', { ascending: true }),
          supabase.from('investments').select('*'),
          supabase.from('projected_debts').select('*').eq('is_paid', false)
        ]);

        if (transRes.error) throw transRes.error;
        if (investRes.error) throw investRes.error;
        if (debtsRes.error) throw debtsRes.error;
        
        setTransactions(transRes.data || []);
        setInvestments(investRes.data || []);
        setDebts(debtsRes.data || []);
      } catch (err) {
        console.error("Supabase Error:", err);
        setError(`Supabase Error: ${err.message || 'Check your keys and table permissions.'}`);
        
        // Fallback mock data for demo purposes until DB is connected
        setTransactions([
          { id: 1, type: 'income', amount: 25000, category: 'Salary', date: '2026-07-01' },
          { id: 2, type: 'income', amount: 26000, category: 'Salary', date: '2026-06-01' },
          { id: 3, type: 'expense', amount: 5000, category: 'Family', date: '2026-06-15' },
          { id: 4, type: 'expense', amount: 3076, category: 'EMI', date: '2026-06-02' },
          { id: 5, type: 'expense', amount: 1903, category: 'Amazon', date: '2026-07-03' },
          { id: 6, type: 'expense', amount: 300, category: 'Recharge', date: '2026-07-14' },
          { id: 7, type: 'expense', amount: 2100, category: 'Family', date: '2026-07-01' },
        ]);
        setInvestments([
          { id: 1, month: 'April', amount: 1000, gms: 0.0636, rate: 15263 },
          { id: 2, month: 'May', amount: 1000, gms: 0.0633, rate: 15321 },
          { id: 3, month: 'June', amount: 1000, gms: 0.0613, rate: 15823 },
          { id: 4, month: 'July', amount: 1000, gms: 0.0650, rate: 14928 },
          { id: 5, month: 'August', amount: 1000, gms: 0.0666, rate: 14556 },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Compute available years dynamically
  const availableYears = useMemo(() => {
    if (transactions.length === 0) return ['All Years', new Date().getFullYear().toString()];
    const years = new Set(transactions.map(t => new Date(t.date).getFullYear().toString()));
    const yearArray = Array.from(years).sort((a,b) => b.localeCompare(a));
    return ['All Years', ...yearArray];
  }, [transactions]);

  // Filter Data based on Tab and Selected Months/Year
  const filteredTransactions = useMemo(() => {
    if (activeTab === 'monthly') {
      return transactions.filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === currentMonthIndex && date.getFullYear() === new Date().getFullYear();
      });
    } else {
      // Overall Tab
      if (selectedMonths.length === 0 && selectedYear === 'All Years') return transactions;
      return transactions.filter(t => {
        const date = new Date(t.date);
        const monthName = MONTHS[date.getMonth()];
        const yearStr = date.getFullYear().toString();
        
        const monthMatch = selectedMonths.length === 0 || selectedMonths.includes(monthName);
        const yearMatch = selectedYear === 'All Years' || yearStr === selectedYear;
        return monthMatch && yearMatch;
      });
    }
  }, [transactions, activeTab, selectedMonths, selectedYear, currentMonthIndex]);

  // Calculate Aggregates
  const isMonthlyView = activeTab === 'monthly';
  
  // Previous Balance Logic (Opening Balance)
  let prevBalanceCash = 0;
  let prevBalanceUPI = 0;
  
  if (isMonthlyView) {
    const currentYear = new Date().getFullYear();
    const currentMonthStart = new Date(currentYear, currentMonthIndex, 1);
    const prevMonthStart = new Date(currentYear, currentMonthIndex - 1, 1);
    
    const prevTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate >= prevMonthStart && tDate < currentMonthStart;
    });
    
    const prevIncomeCash = prevTransactions.filter(t => t.type === 'income' && t.note === 'Cash').reduce((sum, t) => sum + t.amount, 0);
    const prevIncomeUPI = prevTransactions.filter(t => t.type === 'income' && t.note !== 'Cash').reduce((sum, t) => sum + t.amount, 0);
    
    const prevExpenseCash = prevTransactions.filter(t => t.type === 'expense' && t.note === 'Cash').reduce((sum, t) => sum + t.amount, 0);
    const prevExpenseUPI = prevTransactions.filter(t => t.type === 'expense' && t.note !== 'Cash').reduce((sum, t) => sum + t.amount, 0);
    
    prevBalanceCash = prevIncomeCash - prevExpenseCash;
    prevBalanceUPI = prevIncomeUPI - prevExpenseUPI;
  }

  const loggedIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const loggedIncomeCash = filteredTransactions.filter(t => t.type === 'income' && t.note === 'Cash').reduce((sum, t) => sum + t.amount, 0);
  const loggedIncomeUPI = loggedIncome - loggedIncomeCash;
  
  const incomeCash = loggedIncomeCash + prevBalanceCash;
  const incomeUPI = loggedIncomeUPI + prevBalanceUPI;
  const income = incomeCash + incomeUPI;
  
  const expenses = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const expensesCash = filteredTransactions.filter(t => t.type === 'expense' && t.note === 'Cash').reduce((sum, t) => sum + t.amount, 0);
  const expensesUPI = expenses - expensesCash;

  const balance = income - expenses;
  const balanceCash = incomeCash - expensesCash;
  const balanceUPI = incomeUPI - expensesUPI;

  // Calculate All-Time Wallet Balances
  const allTimeIncomeCash = transactions.filter(t => t.type === 'income' && t.note === 'Cash').reduce((sum, t) => sum + t.amount, 0);
  const allTimeIncomeUPI = transactions.filter(t => t.type === 'income' && t.note !== 'Cash').reduce((sum, t) => sum + t.amount, 0);
  const allTimeExpenseCash = transactions.filter(t => t.type === 'expense' && t.note === 'Cash').reduce((sum, t) => sum + t.amount, 0);
  const allTimeExpenseUPI = transactions.filter(t => t.type === 'expense' && t.note !== 'Cash').reduce((sum, t) => sum + t.amount, 0);
  
  const currentWalletCash = allTimeIncomeCash - allTimeExpenseCash;
  const currentWalletUPI = allTimeIncomeUPI - allTimeExpenseUPI;
  
  // Calculate Gold Investment
  const totalGoldInvested = investments.reduce((sum, i) => sum + Number(i.amount), 0);
  const myGoldInvestment = totalGoldInvested / 2;

  // Debt Forecasting Calculations
  const remainingDebt = debts.reduce((sum, d) => sum + Math.max(0, Number(d.amount) - Number(d.amount_paid || 0)), 0);
  const balanceAfterPayment = balance - remainingDebt;

  // Prepare Chart Data (Category Breakdown)
  const categoryData = useMemo(() => {
    const expenseData = filteredTransactions.filter(t => t.type === 'expense');
    const categories = {};
    expenseData.forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });
    return Object.keys(categories).map(key => ({ name: key, value: categories[key] })).sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  const toggleMonth = (month) => {
    setSelectedMonths(prev => 
      prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month]
    );
  };

  return (
    <div>
      <div className="dashboard-header mb-8">
        <h1 className="title" style={{ marginBottom: 0 }}>Dashboard</h1>
        
        {activeTab === 'monthly' && (
          <div className="live-month-pill">
            <div className="glowing-dot" />
            <span style={{ color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              {currentMonthName} {new Date().getFullYear()}
            </span>
          </div>
        )}
        
        {/* Tabs */}
        <div className="tabs" style={{ display: 'flex', gap: '8px', background: 'var(--surface)', padding: '4px', borderRadius: '12px' }}>
          <button 
            className={`btn ${activeTab === 'monthly' ? '' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', border: 'none' }}
            onClick={() => setActiveTab('monthly')}
          >
            Monthly View
          </button>
          <button 
            className={`btn ${activeTab === 'overall' ? '' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', border: 'none' }}
            onClick={() => setActiveTab('overall')}
          >
            Overall View
          </button>
        </div>
      </div>

      {error && <div style={{ background: 'var(--danger)', color: 'white', padding: '12px', borderRadius: '8px', marginBottom: '24px' }}>{error}</div>}

      {/* Multi-Select Filter (Only in Overall View) */}
      {activeTab === 'overall' && (
        <div className="glass-card mb-8" style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Filter size={18} className="text-primary" />
                <h3 className="subtitle" style={{ marginBottom: 0 }}>Filter by Month</h3>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <button 
                  className={`btn ${selectedMonths.length === 0 ? '' : 'btn-secondary'}`}
                  style={{ padding: '6px 12px', fontSize: '0.875rem' }}
                  onClick={() => setSelectedMonths([])}
                >
                  All Months
                </button>
                {MONTHS.map(month => (
                  <button
                    key={month}
                    className={`btn ${selectedMonths.includes(month) ? '' : 'btn-secondary'}`}
                    style={{ padding: '6px 12px', fontSize: '0.875rem' }}
                    onClick={() => toggleMonth(month)}
                  >
                    {month}
                  </button>
                ))}
              </div>
            </div>
            
            <div style={{ minWidth: '150px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Calendar size={18} className="text-primary" />
                <h3 className="subtitle" style={{ marginBottom: 0 }}>Filter by Year</h3>
              </div>
              <CustomSelect 
                options={availableYears} 
                value={selectedYear} 
                onChange={setSelectedYear} 
              />
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <ScreenLoader />
      ) : (
        <>
          {/* Wallet Balances */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '200px', display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--surface)', padding: '16px 20px', borderRadius: '16px', border: '1px solid rgba(14, 165, 233, 0.2)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(14, 165, 233, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wallet size={24} style={{ color: 'var(--tertiary)' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px' }}>CURRENT CASH</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>₹{currentWalletCash.toLocaleString()}</div>
              </div>
            </div>

            <div style={{ flex: '1', minWidth: '200px', display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--surface)', padding: '16px 20px', borderRadius: '16px', border: '1px solid rgba(99, 102, 241, 0.2)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Smartphone size={24} style={{ color: 'var(--primary)' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px' }}>CURRENT UPI</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>₹{currentWalletUPI.toLocaleString()}</div>
              </div>
            </div>

            <div style={{ flex: '1', minWidth: '200px', display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--surface)', padding: '16px 20px', borderRadius: '16px', border: '1px solid rgba(245, 158, 11, 0.2)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Coins size={24} style={{ color: 'var(--warning)' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px' }}>GOLD INVESTMENT</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>₹{myGoldInvestment.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
              <div>
                <div className="stat-label">
                  <DollarSign size={16} className="text-success" />
                  Total Received
                </div>
                <div className="stat-value text-success">
                  +₹{income.toLocaleString()}
                  {isMonthlyView && (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                      <span style={{ fontSize: '0.65rem', background: 'var(--tertiary)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontWeight: 600, letterSpacing: '0.5px' }}>
                        PREV CASH: ₹{prevBalanceCash.toLocaleString()}
                      </span>
                      <span style={{ fontSize: '0.65rem', background: 'var(--primary)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontWeight: 600, letterSpacing: '0.5px' }}>
                        PREV UPI: ₹{prevBalanceUPI.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                <div style={{ flex: 1, background: 'rgba(14, 165, 233, 0.1)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--tertiary)', marginBottom: '4px', fontWeight: 600 }}>CASH</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700 }}>₹{incomeCash.toLocaleString()}</div>
                </div>
                <div style={{ flex: 1, background: 'rgba(99, 102, 241, 0.1)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--primary)', marginBottom: '4px', fontWeight: 600 }}>UPI</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700 }}>₹{incomeUPI.toLocaleString()}</div>
                </div>
              </div>
            </div>
            
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
              <div>
                <div className="stat-label">
                  <ArrowUp size={16} className="text-danger" />
                  Total Spent
                </div>
                <div className="stat-value text-danger">-₹{expenses.toLocaleString()}</div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                <div style={{ flex: 1, background: 'rgba(14, 165, 233, 0.1)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--tertiary)', marginBottom: '4px', fontWeight: 600 }}>CASH</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700 }}>₹{expensesCash.toLocaleString()}</div>
                </div>
                <div style={{ flex: 1, background: 'rgba(99, 102, 241, 0.1)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--primary)', marginBottom: '4px', fontWeight: 600 }}>UPI</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700 }}>₹{expensesUPI.toLocaleString()}</div>
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
              <div>
                <div className="stat-label">
                  <CreditCard size={16} className="text-primary" />
                  Total Balance
                </div>
                <div className="stat-value">₹{balance.toLocaleString()}</div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                <div style={{ flex: 1, background: 'rgba(14, 165, 233, 0.1)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--tertiary)', marginBottom: '4px', fontWeight: 600 }}>CASH</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700 }}>₹{balanceCash.toLocaleString()}</div>
                </div>
                <div style={{ flex: 1, background: 'rgba(99, 102, 241, 0.1)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--primary)', marginBottom: '4px', fontWeight: 600 }}>UPI</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700 }}>₹{balanceUPI.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
            <div className="glass-card">
              <div className="flex items-center gap-4 mb-4">
                <PieChartIcon size={20} className="text-primary" />
                <h3 className="subtitle" style={{ marginBottom: 0 }}>Expenses by Category</h3>
              </div>
              <div style={{ height: 420 }}>
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        stroke="none"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
                        itemStyle={{ color: 'var(--text-main)' }}
                        formatter={(value) => `₹${value}`}
                      />
                      <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    No expenses found.
                  </div>
                )}
              </div>
            </div>

            {/* Debt Forecasting */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="flex items-center gap-4" style={{ marginBottom: '32px' }}>
                <Calendar size={20} className="text-warning" />
                <h3 className="subtitle" style={{ marginBottom: 0 }}>Debt Forecasting</h3>
              </div>
              
              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <div style={{ flex: '1', background: 'var(--surface-hover)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px' }}>REMAINING DEBT</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--danger)' }}>-₹{remainingDebt.toLocaleString()}</div>
                </div>
                <div style={{ flex: '1', background: 'var(--surface-hover)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px' }}>ESTIMATED BALANCE</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>₹{balanceAfterPayment.toLocaleString()}</div>
                </div>
              </div>

              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Liabilities</h4>
              
              <div style={{ flex: 1, overflowY: 'auto' }} className="hide-scrollbar">
                {debts.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {debts.map(debt => (
                      <div key={debt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--surface-hover)', borderRadius: '8px' }}>
                        <div>
                          <div style={{ fontWeight: 500 }}>{debt.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Added: {debt.month} {debt.year}</div>
                        </div>
                        <div style={{ fontWeight: 600, color: 'var(--danger)' }}>
                          ₹{(debt.amount - (debt.amount_paid || 0)).toLocaleString()}
                          {debt.amount_paid > 0 && <span style={{ fontSize: '0.75rem', marginLeft: '4px', color: 'var(--text-muted)', fontWeight: 'normal' }}>left</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', background: 'var(--surface-hover)', borderRadius: '8px', padding: '24px' }}>
                    No pending liabilities!
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
