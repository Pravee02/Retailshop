import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiUser, FiLock, FiLogIn, FiEye, FiEyeOff, FiPhone, FiArrowLeft, FiCheckCircle, FiBox, FiTrendingUp, FiShoppingBag, FiTruck } from 'react-icons/fi';
import './Login.css';

export default function CustomerAuth() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState('LANDING'); // 'LANDING', 'LOGIN', 'REGISTER'
  const [formData, setFormData] = useState({ name: '', password: '', phone: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.password || (view === 'REGISTER' && !formData.phone)) {
      toast.error('Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      if (view === 'LOGIN') {
        const response = await authAPI.login({ username: formData.name, password: formData.password });
        const { token, username, fullName, role } = response.data;
        login({ username, fullName, role }, token);
        toast.success(`Welcome back, ${fullName}!`);
      } else {
        const payload = {
          username: formData.name,
          fullName: formData.name,
          password: formData.password,
          phone: formData.phone,
          role: 'CUSTOMER'
        };
        const response = await authAPI.register(payload);
        const { token, username, fullName, role } = response.data;
        login({ username, fullName, role }, token);
        toast.success(`Registered successfully! Welcome, ${fullName}!`);
      }
      navigate('/shop');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  if (view === 'LANDING') {
    return (
      <div className="landing-page" style={{ background: 'var(--bg-main)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* HEADER */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 5%', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '2rem' }}>🛒</span>
            <h1 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary-color)', fontWeight: 800 }}>RetailShop</h1>
          </div>
          <nav style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <a href="#" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>Home</a>
            <a href="#features" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>Features</a>
            <a href="#about" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>About</a>
            <a href="#contact" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>Contact</a>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/login')}>Admin Login</button>
          </nav>
        </header>

        {/* HERO SECTION */}
        <main style={{ flex: 1 }}>
          <section style={{ padding: '6rem 5%', textAlign: 'center', background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-main) 100%)' }}>
            <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', color: 'var(--text-primary)', fontWeight: 800, lineHeight: 1.2 }}>
              Modern Inventory & <br/><span style={{ color: 'var(--primary-color)' }}>Sales Management</span>
            </h1>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 2rem auto', lineHeight: 1.6 }}>
              The complete solution for small businesses and shops. Manage products, track orders, generate instant bills, and provide a seamless customer portal.
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary btn-lg" onClick={() => setView('LOGIN')}>Customer Login</button>
              <button className="btn btn-outline btn-lg" onClick={() => setView('REGISTER')}>Create Account</button>
              <button className="btn btn-ghost btn-lg" onClick={() => navigate('/shop')}>Browse Products →</button>
            </div>
          </section>

          {/* FEATURES SECTION */}
          <section id="features" style={{ padding: '5rem 5%', background: 'var(--bg-card)' }}>
            <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '3rem', color: 'var(--text-primary)' }}>Powerful Features</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px', maxWidth: '1200px', margin: '0 auto' }}>
              
              <div style={{ padding: '2rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-lg)', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                <FiBox style={{ fontSize: '3rem', color: 'var(--primary-color)', marginBottom: '1rem' }} />
                <h3>Inventory Management</h3>
                <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>Track stock levels in real-time and manage your entire product catalog effortlessly.</p>
              </div>

              <div style={{ padding: '2rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-lg)', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                <FiCheckCircle style={{ fontSize: '3rem', color: 'var(--success-color)', marginBottom: '1rem' }} />
                <h3>Fast Billing</h3>
                <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>Generate invoices and process sales rapidly with our optimized billing interface.</p>
              </div>

              <div style={{ padding: '2rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-lg)', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                <FiShoppingBag style={{ fontSize: '3rem', color: 'var(--warning-color)', marginBottom: '1rem' }} />
                <h3>Customer Portal</h3>
                <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>Allow customers to browse products, place orders, and track history independently.</p>
              </div>

              <div style={{ padding: '2rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-lg)', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                <FiTrendingUp style={{ fontSize: '3rem', color: 'var(--info-color)', marginBottom: '1rem' }} />
                <h3>Analytics</h3>
                <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>Gain insights into your business performance with dynamic dashboard metrics.</p>
              </div>

            </div>
          </section>
        </main>

        {/* FOOTER */}
        <footer style={{ background: 'var(--bg-card)', padding: '3rem 5%', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginBottom: '2rem' }}>
            <a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Privacy Policy</a>
            <a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Terms & Conditions</a>
            <a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Contact Info</a>
          </div>
          <p style={{ color: 'var(--text-muted)' }}>&copy; {new Date().getFullYear()} RetailShop Management System. All rights reserved.</p>
        </footer>
      </div>
    );
  }

  // AUTH VIEW (LOGIN / REGISTER)
  return (
    <div className="login-page">
      <div className="login-bg-pattern"></div>
      
      <div className="login-container">
        <button 
          className="btn btn-ghost" 
          style={{ position: 'absolute', top: '20px', left: '20px' }}
          onClick={() => setView('LANDING')}
        >
          <FiArrowLeft /> Back to Home
        </button>

        <div className="login-card">
          {/* Header */}
          <div className="login-header">
            <div className="login-logo">🛒</div>
            <h1>{view === 'LOGIN' ? 'Customer Login' : 'Create Account'}</h1>
            <p>{view === 'LOGIN' ? 'Sign in to place orders faster' : 'Join our shop to track your orders'}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <FiUser className="field-icon" />
              <input
                type="text"
                placeholder="Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="login-field">
              <FiLock className="field-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={t('auth.password') + ' *'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            {view === 'REGISTER' && (
              <div className="login-field">
                <FiPhone className="field-icon" />
                <input
                  type="tel"
                  placeholder="Phone Number *"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  pattern="[0-9]{10}"
                  title="10 digit phone number"
                />
              </div>
            )}

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></div>
              ) : (
                <>{view === 'LOGIN' ? <FiLogIn /> : null} {view === 'LOGIN' ? 'Login' : 'Register'}</>
              )}
            </button>
          </form>

          {/* Customer Portal Link */}
          <div className="login-footer" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button className="btn btn-ghost" type="button" onClick={() => setView(view === 'LOGIN' ? 'REGISTER' : 'LOGIN')}>
              {view === 'LOGIN' ? "Don't have an account? Register →" : "Already have an account? Login →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
