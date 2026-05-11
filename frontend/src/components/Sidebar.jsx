import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  FiGrid, FiPackage, FiShoppingCart, FiBarChart2, 
  FiClipboard, FiUsers, FiLogOut, FiSun, FiMoon,
  FiGlobe, FiShoppingBag, FiX
} from 'react-icons/fi';
import './Sidebar.css';

export default function Sidebar({ isOpen, onClose }) {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'kn' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const navItems = [
    { path: '/dashboard', icon: <FiGrid />, label: t('nav.dashboard') },
    { path: '/products', icon: <FiPackage />, label: t('nav.products') },
    { path: '/billing', icon: <FiShoppingCart />, label: t('nav.billing') },
    { path: '/inventory', icon: <FiBarChart2 />, label: t('nav.inventory') },
    { path: '/orders', icon: <FiClipboard />, label: t('nav.orders') },
    { path: '/shop', icon: <FiShoppingBag />, label: t('nav.shop') },
  ];

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Mobile Close Button */}
        <button className="mobile-close" onClick={onClose}>
          <FiX />
        </button>
        
        {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">🛒</div>
        <div className="logo-text">
          <h2>RetailShop</h2>
          <span>Inventory System</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => {
              if (window.innerWidth <= 768) onClose();
            }}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="sidebar-bottom">
        <div className="sidebar-actions">
          <button className="action-btn" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? <FiSun /> : <FiMoon />}
          </button>
          <button className="action-btn" onClick={toggleLanguage} title="Toggle language">
            <FiGlobe />
            <span className="lang-label">{i18n.language === 'en' ? 'ಕನ್ನಡ' : 'ENG'}</span>
          </button>
        </div>

        {/* User Info */}
        <div className="sidebar-user">
          <div className="user-avatar">
            {user?.fullName?.charAt(0) || 'A'}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.fullName || 'Admin'}</span>
            <span className="user-role">{user?.role || 'ADMIN'}</span>
          </div>
          <button className="action-btn logout-btn" onClick={handleLogout} title={t('nav.logout')}>
            <FiLogOut />
          </button>
        </div>
      </div>
      </aside>
    </>
  );
}
