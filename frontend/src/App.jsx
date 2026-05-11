import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { FiMenu } from 'react-icons/fi';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Billing from './pages/Billing';
import Inventory from './pages/Inventory';
import Orders from './pages/Orders';
import CustomerShop from './pages/CustomerShop';
import CustomerAuth from './pages/CustomerAuth';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }
  
  if (!user) return <Navigate to="/auth" replace />;
  if (adminOnly && user.role !== 'ADMIN') return <Navigate to="/auth" replace />;
  
  return children;
}

export default function App() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      {user && isAdmin && (
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}
      
      <main className={`app-content ${!user || !isAdmin ? 'no-sidebar' : ''}`} 
            style={!user || !isAdmin ? { marginLeft: 0 } : {}}>
        
        {user && isAdmin && (
          <header className="mobile-header">
            <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
              <FiMenu />
            </button>
            <div className="mobile-logo-text">
              <h2>RetailShop</h2>
            </div>
            <div style={{ width: '40px' }} /> {/* Spacer */}
          </header>
        )}
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/auth" element={<CustomerAuth />} />
          <Route path="/customer/login" element={<Navigate to="/auth" replace />} />
          <Route path="/shop" element={<CustomerShop />} />
          
          {/* Admin Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute adminOnly><Dashboard /></ProtectedRoute>
          } />
          <Route path="/products" element={
            <ProtectedRoute adminOnly><Products /></ProtectedRoute>
          } />
          <Route path="/billing" element={
            <ProtectedRoute adminOnly><Billing /></ProtectedRoute>
          } />
          <Route path="/inventory" element={
            <ProtectedRoute adminOnly><Inventory /></ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute adminOnly><Orders /></ProtectedRoute>
          } />
          
          {/* Default redirect */}
          <Route path="/" element={
            <Navigate to={user ? (user.role === 'ADMIN' ? "/dashboard" : "/shop") : "/auth"} replace />
          } />
          <Route path="*" element={
            <Navigate to={user ? (user.role === 'ADMIN' ? "/dashboard" : "/shop") : "/auth"} replace />
          } />
        </Routes>
      </main>
    </div>
  );
}
