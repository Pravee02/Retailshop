import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiUser, FiLock, FiLogIn, FiEye, FiEyeOff } from 'react-icons/fi';
import './Login.css';

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.login(formData);
      const { token, username, fullName, role } = response.data;
      
      if (role !== 'ADMIN') {
        throw new Error('Access denied. Please use the Customer Login portal.');
      }
      
      login({ username, fullName, role }, token);
      toast.success(`Welcome back, ${fullName}!`);
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || error.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

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
          <form onSubmit={handleSubmit} className="login-form">
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

          {/* Admin Credentials Removed for Security */}

          {/* Customer Portal Link */}
          <div className="login-footer">
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
