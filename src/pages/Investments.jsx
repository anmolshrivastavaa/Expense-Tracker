import React, { useState, useEffect } from 'react';
import { TrendingUp, Award, Loader2, Activity, History, LineChart as LineChartIcon, PieChart } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import ScreenLoader from '../components/ScreenLoader';

const Investments = () => {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvestments = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('investments')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) throw error;
        setInvestments(data || []);
      } catch (err) {
        console.error("Fetch Error:", err.message);
        // Fallback for demo
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

    fetchInvestments();
  }, []);

  const totalGms = investments.reduce((acc, curr) => acc + Number(curr.gms), 0).toFixed(4);
  const totalInvested = investments.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const avgRate = totalGms > 0 ? (totalInvested / totalGms).toFixed(2) : 0;

  return (
    <div>
      <h1 className="title">D-Gold Dashboard</h1>
      
      {loading ? (
        <ScreenLoader />
      ) : (
        <>
          <div className="stats-grid">
            <div className="glass-card">
              <div className="stat-label">
                <Award size={16} className="text-warning" />
                Total Grams
              </div>
              <div className="stat-value text-warning">{totalGms} g</div>
            </div>
            
            <div className="glass-card">
              <div className="stat-label">
                <TrendingUp size={16} className="text-primary" />
                Total Invested
              </div>
              <div className="stat-value">₹{totalInvested.toLocaleString()}</div>
            </div>

            <div className="glass-card">
              <div className="stat-label">
                <PieChart size={16} className="text-secondary" />
                My Investment
              </div>
              <div className="stat-value">₹{(totalInvested / 2).toLocaleString()}</div>
            </div>

            <div className="glass-card">
              <div className="stat-label">
                <Activity size={16} className="text-muted" />
                Average Rate / gm
              </div>
              <div className="stat-value">₹{avgRate}</div>
            </div>
          </div>

          <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="glass-card">
              <div className="flex items-center gap-4 mb-8">
                <History size={24} className="text-primary" />
                <h3 className="subtitle" style={{ marginBottom: 0 }}>Purchase History</h3>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Month/Year</th>
                      <th>Amount</th>
                      <th>Grams</th>
                      <th>Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {investments.map((row) => (
                      <tr key={row.id || row.month}>
                        <td>{row.month}</td>
                        <td>₹{row.amount}</td>
                        <td className="text-warning">{row.gms}</td>
                        <td>₹{row.rate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="glass-card">
              <div className="flex items-center gap-4 mb-8">
                <LineChartIcon size={24} className="text-warning" />
                <h3 className="subtitle" style={{ marginBottom: 0 }}>Gold Rate Trend</h3>
              </div>
              <div style={{ height: 300 }}>
                {investments.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={investments} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis domain={['dataMin - 500', 'dataMax + 500']} stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
                      />
                      <Line type="monotone" dataKey="rate" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    No investments data yet.
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

export default Investments;
