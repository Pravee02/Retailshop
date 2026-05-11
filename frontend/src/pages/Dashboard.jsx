import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { dashboardAPI } from '../services/api';
import { 
  FiPackage, FiDollarSign, FiShoppingCart, FiTrendingUp, 
  FiAlertTriangle, FiXCircle, FiBarChart2, FiX
} from 'react-icons/fi';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import toast from 'react-hot-toast';

const CHART_COLORS = ['#6366f1', '#06d6a0', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function Dashboard() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stockModal, setStockModal] = useState({ show: false, type: '', products: [] });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await dashboardAPI.getData();
      setData(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner"></div>
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  if (!data) return null;

  const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>{t('dashboard.title')}</h1>
          <p>{t('dashboard.subtitle')}</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        <div className="stat-card" style={{ '--card-accent': '#6366f1' }}>
          <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
            <FiPackage />
          </div>
          <div className="stat-info">
            <h3>{t('dashboard.totalProducts')}</h3>
            <div className="stat-value">{data.totalProducts}</div>
          </div>
        </div>

        <div className="stat-card" style={{ '--card-accent': '#06d6a0' }}>
          <div className="stat-icon" style={{ background: 'rgba(6,214,160,0.15)', color: '#34d399' }}>
            <FiDollarSign />
          </div>
          <div className="stat-info">
            <h3>{t('dashboard.totalStock')}</h3>
            <div className="stat-value">{formatCurrency(data.totalStockValue)}</div>
          </div>
        </div>

        <div className="stat-card" style={{ '--card-accent': '#3b82f6' }}>
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>
            <FiShoppingCart />
          </div>
          <div className="stat-info">
            <h3>{t('dashboard.todaySales')}</h3>
            <div className="stat-value">{data.todaySalesCount}</div>
          </div>
        </div>

        <div className="stat-card" style={{ '--card-accent': '#f59e0b' }}>
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>
            <FiTrendingUp />
          </div>
          <div className="stat-info">
            <h3>{t('dashboard.todayRevenue')}</h3>
            <div className="stat-value">{formatCurrency(data.todayRevenue)}</div>
          </div>
        </div>

        <div className="stat-card" style={{ '--card-accent': '#8b5cf6' }}>
          <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
            <FiBarChart2 />
          </div>
          <div className="stat-info">
            <h3>{t('dashboard.monthlyRevenue')}</h3>
            <div className="stat-value">{formatCurrency(data.monthlyRevenue)}</div>
          </div>
        </div>

        <div className="stat-card" style={{ '--card-accent': '#10b981' }}>
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>
            <FiTrendingUp />
          </div>
          <div className="stat-info">
            <h3>{t('dashboard.profit')}</h3>
            <div className="stat-value">{formatCurrency(data.estimatedProfit)}</div>
          </div>
        </div>

        <div 
          className="stat-card clickable" 
          style={{ '--card-accent': '#f59e0b', cursor: 'pointer' }}
          onClick={() => setStockModal({ show: true, type: 'Low Stock', products: data.lowStockProducts || [] })}
        >
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>
            <FiAlertTriangle />
          </div>
          <div className="stat-info">
            <h3>{t('dashboard.lowStock')}</h3>
            <div className="stat-value">{data.lowStockCount}</div>
          </div>
        </div>

        <div 
          className="stat-card clickable" 
          style={{ '--card-accent': '#ef4444', cursor: 'pointer' }}
          onClick={() => setStockModal({ show: true, type: 'Out of Stock', products: data.outOfStockProducts || [] })}
        >
          <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
            <FiXCircle />
          </div>
          <div className="stat-info">
            <h3>{t('dashboard.outOfStock')}</h3>
            <div className="stat-value">{data.outOfStockCount}</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid-2" style={{ marginBottom: 'var(--space-xl)' }}>
        {/* Revenue Line Chart */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-md)', fontWeight: 600 }}>📈 Daily Revenue (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.dailyRevenue || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  background: 'var(--bg-card)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '8px',
                  color: 'var(--text-primary)'
                }} 
              />
              <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products Bar Chart */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-md)', fontWeight: 600 }}>🏆 Top Selling Products</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={(data.topProducts || []).slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} angle={-20} textAnchor="end" height={60} />
              <YAxis stroke="var(--text-muted)" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  background: 'var(--bg-card)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '8px',
                  color: 'var(--text-primary)'
                }} 
              />
              <Bar dataKey="revenue" fill="#06d6a0" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Distribution Pie Chart */}
      {data.topProducts && data.topProducts.length > 0 && (
        <div className="card" style={{ maxWidth: 500, margin: '0 auto' }}>
          <h3 style={{ marginBottom: 'var(--space-md)', fontWeight: 600, textAlign: 'center' }}>
            📊 Revenue by Product
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.topProducts.slice(0, 6)}
                dataKey="revenue"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                labelLine={false}
              >
                {data.topProducts.slice(0, 6).map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  background: 'var(--bg-card)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '8px',
                  color: 'var(--text-primary)'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
      {/* Stock Detail Modal */}
      {stockModal.show && (
        <div className="modal-overlay" onClick={() => setStockModal({ show: false, type: '', products: [] })}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%' }}>
            <div className="modal-header">
              <h2 className="flex items-center gap-sm">
                {stockModal.type === 'Low Stock' ? <FiAlertTriangle className="text-warning" /> : <FiXCircle className="text-danger" />}
                {stockModal.type} Products
              </h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setStockModal({ show: false, type: '', products: [] })}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product ID</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Quantity</th>
                      <th>Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockModal.products.length === 0 ? (
                      <tr><td colSpan="5" className="text-center">No products found</td></tr>
                    ) : (
                      stockModal.products.map(p => (
                        <tr key={p.id}>
                          <td><code>{p.productCode}</code></td>
                          <td><strong>{p.name}</strong></td>
                          <td><span className="badge badge-primary">{p.category}</span></td>
                          <td className={stockModal.type === 'Out of Stock' ? 'text-danger font-bold' : 'text-warning font-bold'}>
                            {p.quantity}
                          </td>
                          <td>{p.unitType}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setStockModal({ show: false, type: '', products: [] })}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
