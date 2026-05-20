import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiUser, FiLock, FiLogIn, FiEye, FiEyeOff, FiUserPlus, FiArrowLeft } from 'react-icons/fi';
import './Login.css';

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState('LOGIN'); // 'LOGIN' | 'REGISTER'
  const [formData, setFormData] = useState({ username: '', password: '', fullName: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.login({ username: formData.username, password: formData.password });
      const { token, username, fullName, role } = response.data;

      if (role !== 'ADMIN') {
        throw new Error('Access denied. Please use the Customer Login portal.');
      }

      login({ username, fullName, role }, token);
      toast.success(`Welcome back, ${fullName || username}!`);
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || error.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password || !formData.fullName) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.registerAdmin({
        username: formData.username,
        password: formData.password,
        fullName: formData.fullName,
        role: 'ADMIN'
      });
      const { token, username, fullName, role } = response.data;

      login({ username, fullName, role }, token);
      toast.success(`Shop account created! Welcome, ${fullName || username}!`);
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (view === 'REGISTER') {
    return (
      <div className="login-page">
        <div className="login-bg-pattern"></div>

        <div className="login-container">
          <button
            className="btn btn-ghost"
            style={{ position: 'absolute', top: '20px', left: '20px' }}
            onClick={() => setView('LOGIN')}
          >
            <FiArrowLeft /> Back to Login
          </button>

          <div className="login-card">
            <div className="login-header">
              <div className="login-logo">🏪</div>
              <h1>Create Shop Account</h1>
              <p>Register your shop to get started</p>
            </div>

            <form onSubmit={handleRegister} className="login-form">
              <div className="login-field">
                <FiUser className="field-icon" />
                <input
                  id="register-fullname"
                  type="text"
                  placeholder="Shop / Owner Name *"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  autoComplete="name"
                />
              </div>

              <div className="login-field">
                <FiUser className="field-icon" />
                <input
                  id="register-username"
                  type="text"
                  placeholder="Username (for login) *"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  autoComplete="username"
                />
              </div>

              <div className="login-field">
                <FiLock className="field-icon" />
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password (min 6 chars) *"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>

              <div className="login-field">
                <FiLock className="field-icon" />
                <input
                  id="register-confirm-password"
                  type="password"
                  placeholder="Confirm Password *"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  autoComplete="new-password"
                />
              </div>

              <button
                id="register-submit"
                type="submit"
                className="login-btn"
                disabled={loading}
              >
                {loading ? (
                  <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></div>
                ) : (
                  <>
                    <FiUserPlus />
                    Create Shop Account
                  </>
                )}
              </button>
            </form>

            <div className="login-footer">
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', marginBottom: '8px' }}>
                Each shop account has its own isolated inventory, products, sales & billing data.
              </p>
              <button className="btn btn-ghost" onClick={() => setView('LOGIN')}>
                Already have an account? Login →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-bg-pattern"></div>

      <div className="login-container">
        <div className="login-card">
          {/* Header */}
          <div className="login-header">
            <div className="login-logo">🛡️</div>
            <h1>Admin Login</h1>
            <p>Sign in to manage your shop</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="login-form">
            <div className="login-field">
              <FiUser className="field-icon" />
              <input
                id="login-username"
                type="text"
                placeholder={t('auth.username')}
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                autoComplete="username"
              />
            </div>

            <div className="login-field">
              <FiLock className="field-icon" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder={t('auth.password')}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            <button
              id="login-submit"
              type="submit"
              className="login-btn"
              disabled={loading}
            >
              {loading ? (
                <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></div>
              ) : (
                <>
                  <FiLogIn />
                  {t('auth.login')}
                </>
              )}
            </button>
          </form>

          {/* Register & Customer links */}
          <div className="login-footer" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              className="btn btn-outline"
              style={{ width: '100%' }}
              onClick={() => setView('REGISTER')}
            >
              <FiUserPlus />
              New Shop? Create Admin Account
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => navigate('/shop')}
            >
              Browse shop without login →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
