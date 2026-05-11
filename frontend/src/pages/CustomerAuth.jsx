import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiUser, FiLock, FiLogIn, FiEye, FiEyeOff, FiPhone, FiArrowLeft, FiCheckCircle, FiBox, FiTrendingUp, FiShoppingBag, FiTruck, FiMenu, FiX } from 'react-icons/fi';
import './Login.css';

import './Landing.css';

export default function CustomerAuth() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState('LANDING'); // 'LANDING', 'LOGIN', 'REGISTER'
  const [formData, setFormData] = useState({ name: '', password: '', phone: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      <div className="landing-page">
        {/* HEADER */}
        <header className="landing-header">
          <div className="landing-brand">
            <span style={{ fontSize: '2rem' }}>🛒</span>
            <h1 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary)', fontWeight: 800 }}>RetailShop</h1>
          </div>
          
          <nav className="landing-nav">
            <a href="#" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>Home</a>
            <a href="#features" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>Features</a>
            <a href="#about" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>About</a>
            <a href="#contact" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>Contact</a>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/login')}>Admin Login</button>
          </nav>

          <button className="hamburger-btn" onClick={() => setMobileMenuOpen(true)}>
            <FiMenu />
          </button>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="mobile-nav-overlay" onClick={() => setMobileMenuOpen(false)}>
            <div className="mobile-nav-drawer" onClick={e => e.stopPropagation()}>
              <div className="mobile-nav-header">
                <div className="landing-brand">
                  <span style={{ fontSize: '1.5rem' }}>🛒</span>
                  <h2 style={{ fontSize: '1.2rem', color: 'var(--primary)', fontWeight: 800 }}>RetailShop</h2>
                </div>
                <button className="btn btn-ghost btn-icon" onClick={() => setMobileMenuOpen(false)}>
                  <FiX />
                </button>
              </div>
              <div className="mobile-nav-body">
                <a href="#" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Home</a>
                <a href="#features" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Features</a>
                <a href="#about" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>About</a>
                <a href="#contact" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Contact</a>
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                  <button className="btn btn-primary w-full" onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}>
                    Admin Login
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HERO SECTION */}
        <main style={{ flex: 1 }}>
          <section className="landing-hero">
            <h1>
              Modern Inventory & <br/><span>Sales Management</span>
            </h1>
            <p>
              The complete solution for small businesses and shops. Manage products, track orders, generate instant bills, and provide a seamless customer portal.
            </p>
            <div className="landing-hero-actions">
              <button className="btn btn-primary btn-lg" onClick={() => setView('LOGIN')}>Customer Login</button>
              <button className="btn btn-outline btn-lg" onClick={() => setView('REGISTER')}>Create Account</button>
              <button className="btn btn-ghost btn-lg" onClick={() => navigate('/shop')}>Browse Products →</button>
            </div>
          </section>

          {/* FEATURES SECTION */}
          <section id="features" className="features-section">
            <h2>Powerful Features</h2>
            <div className="features-grid">
              
              <div className="feature-card">
                <FiBox style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: '1rem' }} />
                <h3>Inventory Management</h3>
                <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>Track stock levels in real-time and manage your entire product catalog effortlessly.</p>
              </div>

              <div className="feature-card">
                <FiCheckCircle style={{ fontSize: '3rem', color: 'var(--success)', marginBottom: '1rem' }} />
                <h3>Fast Billing</h3>
                <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>Generate invoices and process sales rapidly with our optimized billing interface.</p>
              </div>

              <div className="feature-card">
                <FiShoppingBag style={{ fontSize: '3rem', color: 'var(--warning)', marginBottom: '1rem' }} />
                <h3>Customer Portal</h3>
                <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>Allow customers to browse products, place orders, and track history independently.</p>
              </div>

              <div className="feature-card">
                <FiTrendingUp style={{ fontSize: '3rem', color: 'var(--info)', marginBottom: '1rem' }} />
                <h3>Analytics</h3>
                <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>Gain insights into your business performance with dynamic dashboard metrics.</p>
              </div>

            </div>
          </section>
        </main>

        {/* FOOTER */}
        <footer className="landing-footer">
          <div className="footer-links">
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
