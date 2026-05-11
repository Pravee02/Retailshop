import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { productAPI, dashboardAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiSearch, FiPackage, FiAlertTriangle, FiXCircle, FiCheck } from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export default function Inventory() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [dashData, setDashData] = useState(null);

  useEffect(() => {
    loadData();
  }, [page, search]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, lowRes, dashRes] = await Promise.all([
        productAPI.getAll(page, 20, search),
        productAPI.getLowStock(),
        dashboardAPI.getData(),
      ]);
      setProducts(prodRes.data.content);
      setTotalPages(prodRes.data.totalPages);
      setLowStock(lowRes.data);
      setDashData(dashRes.data);
    } catch (error) {
      toast.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const getStockBadge = (product) => {
    if (product.outOfStock) return <span className="badge badge-danger"><FiXCircle /> Out of Stock</span>;
    if (product.lowStock) return <span className="badge badge-warning"><FiAlertTriangle /> Low Stock</span>;
    return <span className="badge badge-success"><FiCheck /> In Stock</span>;
  };

  const stockChartData = products.map(p => ({
    name: p.name.substring(0, 12),
    stock: parseFloat(p.quantity),
    min: parseFloat(p.minStockLevel || 0),
  }));

  // Removed full page loading to prevent search input losing focus during real-time search

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>{t('nav.inventory')}</h1>
          <p>Monitor stock levels and alerts</p>
        </div>
      </div>

      {/* Stats */}
      {dashData && (
        <div className="stat-grid">
          <div className="stat-card" style={{ '--card-accent': '#6366f1' }}>
            <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}><FiPackage /></div>
            <div className="stat-info">
              <h3>Total Products</h3>
              <div className="stat-value">{dashData.totalProducts}</div>
            </div>
          </div>
          <div className="stat-card" style={{ '--card-accent': '#06d6a0' }}>
            <div className="stat-icon" style={{ background: 'rgba(6,214,160,0.15)', color: '#34d399' }}><FiPackage /></div>
            <div className="stat-info">
              <h3>Stock Value</h3>
              <div className="stat-value">₹{Number(dashData.totalStockValue).toLocaleString('en-IN')}</div>
            </div>
          </div>
          <div className="stat-card" style={{ '--card-accent': '#f59e0b' }}>
            <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}><FiAlertTriangle /></div>
            <div className="stat-info">
              <h3>Low Stock Items</h3>
              <div className="stat-value">{dashData.lowStockCount}</div>
            </div>
          </div>
          <div className="stat-card" style={{ '--card-accent': '#ef4444' }}>
            <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}><FiXCircle /></div>
            <div className="stat-info">
              <h3>Out of Stock</h3>
              <div className="stat-value">{dashData.outOfStockCount}</div>
            </div>
          </div>
        </div>
      )}

      {/* Stock Chart */}
      {stockChartData.length > 0 && (
        <div className="card mb-lg">
          <h3 style={{ marginBottom: 'var(--space-md)', fontWeight: 600 }}>📦 Current Stock Levels</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stockChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} angle={-20} textAnchor="end" height={50} />
              <YAxis stroke="var(--text-muted)" fontSize={12} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} />
              <Bar dataKey="stock" fill="#6366f1" name="Current Stock" radius={[4, 4, 0, 0]} />
              <Bar dataKey="min" fill="#f59e0b" name="Min Level" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Low Stock Alerts */}
      {lowStock.length > 0 && (
        <div className="card mb-lg" style={{ borderColor: 'rgba(245,158,11,0.3)' }}>
          <h3 style={{ color: 'var(--warning)', marginBottom: 'var(--space-md)' }}>
            ⚠️ Low Stock Alerts ({lowStock.length})
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
            {lowStock.map(p => (
              <div key={p.id} className="badge badge-warning" style={{ padding: '8px 14px', fontSize: 'var(--font-sm)' }}>
                {p.name}: {p.quantity} {p.unitType}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="search-bar">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by Product Name or ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="table-container" style={{ position: 'relative', minHeight: '200px' }}>
        {loading && (
          <div className="loading-overlay" style={{ position: 'absolute', background: 'rgba(0,0,0,0.1)' }}>
            <div className="spinner"></div>
          </div>
        )}
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Product</th>
              <th>Category</th>
              <th>Stock</th>
              <th>Unit</th>
              <th>Price/Unit</th>
              <th>Stock Value</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id}>
                <td>{product.productCode || `#${product.id}`}</td>
                <td>
                  <strong>{product.name}</strong>
                  {product.localName && <div className="text-muted" style={{ fontSize: 'var(--font-xs)' }}>{product.localName}</div>}
                </td>
                <td><span className="badge badge-primary">{product.category || '—'}</span></td>
                <td><strong>{product.quantity}</strong></td>
                <td>{product.unitType}</td>
                <td>₹{product.pricePerUnit}</td>
                <td>₹{(product.quantity * product.pricePerUnit).toFixed(2)}</td>
                <td>{getStockBadge(product)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Previous</button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} className={page === i ? 'active' : ''} onClick={() => setPage(i)}>{i + 1}</button>
          ))}
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}>Next</button>
        </div>
      )}
    </div>
  );
}
