import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { productAPI, orderAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import { FiSearch, FiShoppingCart, FiPlus, FiMinus, FiTrash2, FiSend, FiSun, FiMoon, FiGlobe, FiX, FiUser, FiPhone, FiMapPin, FiMenu } from 'react-icons/fi';
import './CustomerShop.css';

export default function CustomerShop() {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartCount } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showCart, setShowCart] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderForm, setOrderForm] = useState({ customerName: user?.fullName || '', customerPhone: '', customerAddress: '' });
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState('');
  const [qtyInputs, setQtyInputs] = useState({});
  const [showMyOrders, setShowMyOrders] = useState(false);
  const [myOrders, setMyOrders] = useState([]);
  const [shopMenuOpen, setShopMenuOpen] = useState(false);


  useEffect(() => {
    if (user && !orderForm.customerName) {
      setOrderForm(prev => ({ ...prev, customerName: user.fullName || '' }));
    }
  }, [user]);

  useEffect(() => { loadProducts(); }, [page, search, selectedCat]);
  useEffect(() => { productAPI.getCategories().then(r => setCategories(r.data)).catch(() => {}); }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await productAPI.getAll(page, 20, selectedCat || search);
      setProducts(res.data?.content || []);
      setTotalPages(res.data?.totalPages || 0);
    } catch (e) { 
      console.error('Load products error:', e);
      toast.error('Failed to load products');
      setProducts([]);
    } finally { setLoading(false); }
  };

  const handleAddToCart = (p) => {
    const qty = parseFloat(qtyInputs[p.id]) || 1;
    if (qty <= 0) { toast.error('Enter a valid quantity'); return; }
    addToCart(p, qty, p.unitType);
    setQtyInputs(prev => ({ ...prev, [p.id]: '' }));
    toast.success(`${p.name} — ${qty} ${p.unitType} added!`);
  };
  const cartTotal = (cartItems || []).reduce((s, i) => s + (i.product?.pricePerUnit || 0) * i.quantity, 0);

  const handlePlaceOrder = async () => {
    if (!orderForm.customerName) { toast.error('Please enter your name'); return; }
    setSubmitting(true);
    try {
      await orderAPI.create({
        customerName: orderForm.customerName, customerPhone: orderForm.customerPhone,
        customerAddress: orderForm.customerAddress,
        items: (cartItems || []).map(i => ({ productId: i.product?.id, quantity: i.quantity, unit: i.unit || i.product?.unitType })),
      });
      toast.success(t('shop.orderPlaced'));
      clearCart(); setShowCart(false); setShowOrderForm(false);
      setOrderForm({ customerName: user?.fullName || '', customerPhone: '', customerAddress: '' });
    } catch (e) { 
      console.error('Order placement error:', e);
      toast.error(e.response?.data?.message || 'Failed to place order. Please try again.'); 
    }
    finally { setSubmitting(false); }
  };

  const handleShowMyOrders = async () => {
    try {
      const res = await orderAPI.getMyOrders();
      setMyOrders(res.data || []);
      setShowMyOrders(true);
    } catch (e) {
      console.error('My orders error:', e);
      toast.error('Failed to load your orders');
    }
  };

  const handleCancelMyOrder = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      await orderAPI.cancelMyOrder(id);
      toast.success('Order cancelled successfully');
      handleShowMyOrders(); // Refresh orders
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to cancel order');
    }
  };

  const handlePrintOrder = (order) => {
    const printWindow = window.open('', '_blank');
    const itemsHtml = (order.items || []).map(item => 
      `<tr><td>${item.productName}</td><td>${item.quantity} ${item.unit}</td></tr>`
    ).join('');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Order #${order.orderNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .header { margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>RetailShop - Order Receipt</h2>
            <p><strong>Order #:</strong> ${order.orderNumber}</p>
            <p><strong>Date:</strong> ${new Date(order.orderDate).toLocaleString()}</p>
            <p><strong>Status:</strong> ${order.status}</p>
            <p><strong>Total Amount:</strong> ₹${Number(order.totalAmount).toFixed(2)}</p>
          </div>
          <h3>Ordered Items</h3>
          <table>
            <thead><tr><th>Item</th><th>Quantity</th></tr></thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <script>window.print(); setTimeout(() => window.close(), 500);</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const toggleLang = () => { const l = i18n.language === 'en' ? 'kn' : 'en'; i18n.changeLanguage(l); localStorage.setItem('language', l); };

  return (
    <div className="shop-page">
      <header className="shop-header">
        <div className="shop-brand">
          <Link to="/" className="shop-logo">🛒</Link>
          <h1>RetailShop</h1>
        </div>

        <div className="shop-header-actions">
          {/* Desktop Actions */}
          <div className="desktop-actions">
            {!isAuthenticated() && (
              <>
                <Link to="/customer/login" className="btn btn-ghost btn-sm">
                  <FiUser /> Customer Login
                </Link>
                <Link to="/login" className="btn btn-ghost btn-sm">
                  <FiUser /> Admin Login
                </Link>
              </>
            )}
            {isAuthenticated() && user.role === 'CUSTOMER' && (
              <>
                <button className="btn btn-ghost btn-sm" onClick={handleShowMyOrders}>
                  📋 My Orders
                </button>
                <button className="btn btn-ghost btn-sm text-danger" onClick={logout}>
                  Logout
                </button>
              </>
            )}
            {isAuthenticated() && user.role === 'ADMIN' && (
              <Link to="/dashboard" className="btn btn-ghost btn-sm">
                Dashboard
              </Link>
            )}
            <button className="btn btn-ghost btn-sm" onClick={toggleTheme}>
              {theme === 'dark' ? <FiSun /> : <FiMoon />}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={toggleLang}>
              <FiGlobe /> {i18n.language === 'en' ? 'ಕನ್ನಡ' : 'ENG'}
            </button>
          </div>

          {/* Always Visible Cart */}
          <button className="cart-btn" onClick={() => setShowCart(true)}>
            <FiShoppingCart />
            {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
          </button>

          {/* Mobile Menu Toggle */}
          <button className="shop-menu-toggle" onClick={() => setShopMenuOpen(true)}>
            <FiMenu />
          </button>
        </div>
      </header>

      {/* Shop Mobile Menu */}
      {shopMenuOpen && (
        <div className="mobile-nav-overlay" onClick={() => setShopMenuOpen(false)}>
          <div className="mobile-nav-drawer" onClick={e => e.stopPropagation()}>
            <div className="mobile-nav-header">
              <div className="shop-brand">
                <span className="shop-logo">🛒</span>
                <h2 style={{ fontSize: '1.2rem', color: 'var(--primary)', fontWeight: 800 }}>RetailShop</h2>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShopMenuOpen(false)}>
                <FiX />
              </button>
            </div>
            <div className="mobile-nav-body">
              {!isAuthenticated() ? (
                <>
                  <Link to="/customer/login" className="mobile-nav-link" onClick={() => setShopMenuOpen(false)}>
                    <FiUser /> Customer Login
                  </Link>
                  <Link to="/login" className="mobile-nav-link" onClick={() => setShopMenuOpen(false)}>
                    <FiUser /> Admin Login
                  </Link>
                </>
              ) : (
                <>
                  {user.role === 'CUSTOMER' && (
                    <button className="mobile-nav-link" style={{ textAlign: 'left', background: 'none', border: 'none' }} onClick={() => { setShopMenuOpen(false); handleShowMyOrders(); }}>
                      📋 My Orders
                    </button>
                  )}
                  {user.role === 'ADMIN' && (
                    <Link to="/dashboard" className="mobile-nav-link" onClick={() => setShopMenuOpen(false)}>
                      Dashboard
                    </Link>
                  )}
                  <button className="mobile-nav-link text-danger" style={{ textAlign: 'left', background: 'none', border: 'none' }} onClick={() => { setShopMenuOpen(false); logout(); }}>
                    Logout
                  </button>
                </>
              )}
              <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '10px' }}>
                <button className="btn btn-outline flex-1" onClick={() => { setShopMenuOpen(false); toggleTheme(); }}>
                  {theme === 'dark' ? <FiSun /> : <FiMoon />} {theme === 'dark' ? 'Light' : 'Dark'}
                </button>
                <button className="btn btn-outline flex-1" onClick={() => { setShopMenuOpen(false); toggleLang(); }}>
                  <FiGlobe /> {i18n.language === 'en' ? 'ಕನ್ನಡ' : 'ENG'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      <div className="shop-hero"><h2>{t('shop.title')}</h2><p>{t('shop.subtitle')}</p>
        <div className="shop-search-bar"><FiSearch className="search-icon" />
          <input type="text" placeholder="Search by Product Name or ID..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); setSelectedCat(''); }} />
        </div>
      </div>

      <div className="shop-categories">
        <button className={`cat-chip ${!selectedCat ? 'active' : ''}`} onClick={() => { setSelectedCat(''); setPage(0); }}>All</button>
        {(categories || []).map(c => <button key={c} className={`cat-chip ${selectedCat === c ? 'active' : ''}`} onClick={() => { setSelectedCat(c); setSearch(''); setPage(0); }}>{c}</button>)}
      </div>

      <div className="shop-products">
        {loading ? <div className="loading-overlay"><div className="spinner"></div></div> : products.length === 0 ? <div className="empty-state"><h3>No products found</h3></div> : (
          <div className="product-grid">
            {products.map(p => (
              <div key={p.id} className="product-card">
                <div className="product-card-image"><div className="product-placeholder">📦</div>{p.outOfStock && <div className="out-of-stock-overlay">Out of Stock</div>}</div>
                <div className="product-card-body">
                  <span className="product-card-category">{p.category}</span>
                  <h3 className="product-card-name">{p.name}</h3>
                  {p.localName && <p className="product-card-local">{p.localName}</p>}
                  <div className="product-card-price"><span className="price-main">₹{p.pricePerUnit}</span><span className="price-unit">/ {p.unitType}</span></div>
                  <div className="product-card-qty-row">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      inputMode="decimal"
                      className="form-input product-qty-input"
                      placeholder="1"
                      value={qtyInputs[p.id] || ''}
                      onChange={e => setQtyInputs(prev => ({ ...prev, [p.id]: e.target.value }))}
                    />
                    <span className="product-qty-unit">{p.unitType}</span>
                  </div>
                  {qtyInputs[p.id] && parseFloat(qtyInputs[p.id]) > 0 && (
                    <div className="product-card-calc">
                      = ₹{(parseFloat(qtyInputs[p.id]) * p.pricePerUnit).toFixed(2)}
                    </div>
                  )}
                  <button className="btn btn-primary w-full" onClick={() => handleAddToCart(p)} disabled={p.outOfStock}><FiPlus /> {t('shop.addToCart')}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && <div className="pagination">
        <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Prev</button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => <button key={i} className={page === i ? 'active' : ''} onClick={() => setPage(i)}>{i + 1}</button>)}
        <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}>Next</button>
      </div>}

      {showCart && <div className="cart-overlay" onClick={() => setShowCart(false)}>
        <div className="cart-drawer" onClick={e => e.stopPropagation()}>
          <div className="cart-header"><h2><FiShoppingCart /> Cart ({cartCount})</h2><button className="btn btn-ghost btn-icon" onClick={() => setShowCart(false)}><FiX /></button></div>
          <div className="cart-items">
            {!cartItems || cartItems.length === 0 ? <div className="empty-state" style={{padding:40}}><p>Cart is empty</p></div> :
              cartItems.map(item => (
                <div key={`${item.product?.id}-${item.unit}`} className="cart-item">
                  <div className="cart-item-info"><h4>{item.product?.name || 'Unknown Product'}</h4><p>₹{item.product?.pricePerUnit || 0}/{item.unit}</p></div>
                  <div className="cart-item-qty">
                    <button onClick={() => item.product && updateQuantity(item.product.id, item.unit, Math.max(0.01, parseFloat((item.quantity - 0.25).toFixed(3))))}><FiMinus /></button>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      inputMode="decimal"
                      className="cart-qty-input"
                      value={item.quantity}
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val > 0 && item.product) updateQuantity(item.product.id, item.unit, parseFloat(val.toFixed(3)));
                      }}
                    />
                    <button onClick={() => item.product && updateQuantity(item.product.id, item.unit, parseFloat((item.quantity + 0.25).toFixed(3)))}><FiPlus /></button>
                  </div>
                  <div className="cart-item-total">₹{((item.product?.pricePerUnit || 0) * item.quantity).toFixed(2)}</div>
                  <button className="btn btn-ghost btn-sm text-danger" onClick={() => item.product && removeFromCart(item.product.id, item.unit)}><FiTrash2 /></button>
                </div>
              ))
            }
          </div>
          {cartItems.length > 0 && <div className="cart-footer">
            <div className="cart-total"><span>Total:</span><span>₹{cartTotal.toFixed(2)}</span></div>
            {!showOrderForm ? <button className="btn btn-success btn-lg w-full" onClick={() => setShowOrderForm(true)}><FiSend /> Place Order</button> :
              <div className="order-form">
                <div className="form-group"><label className="form-label"><FiUser /> Name *</label><input className="form-input" value={orderForm.customerName} onChange={e => setOrderForm({...orderForm, customerName: e.target.value})} placeholder="Your name" /></div>
                <div className="form-group"><label className="form-label"><FiPhone /> Phone</label><input className="form-input" value={orderForm.customerPhone} onChange={e => setOrderForm({...orderForm, customerPhone: e.target.value})} placeholder="Phone" /></div>
                <div className="form-group"><label className="form-label"><FiMapPin /> Address</label><input className="form-input" value={orderForm.customerAddress} onChange={e => setOrderForm({...orderForm, customerAddress: e.target.value})} placeholder="Address" /></div>
                <button className="btn btn-success btn-lg w-full" onClick={handlePlaceOrder} disabled={submitting}>{submitting ? 'Placing...' : `Order — ₹${cartTotal.toFixed(2)}`}</button>
              </div>
            }
          </div>}
        </div>
      </div>}

      {/* My Orders Drawer */}
      {showMyOrders && <div className="cart-overlay" onClick={() => setShowMyOrders(false)}>
        <div className="cart-drawer" onClick={e => e.stopPropagation()} style={{ width: '400px' }}>
          <div className="cart-header">
            <h2>📋 My Orders</h2>
            <button className="btn btn-ghost btn-icon" onClick={() => setShowMyOrders(false)}><FiX /></button>
          </div>
          <div className="cart-items" style={{ padding: 'var(--space-md)' }}>
            {myOrders.length === 0 ? <p>You have not placed any orders yet.</p> :
              myOrders.map(order => (
                <div key={order.id} style={{ background: 'var(--bg-card)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                    <strong>{order.orderNumber}</strong>
                    <span className={`badge ${order.status === 'PENDING' ? 'badge-warning' : order.status === 'COMPLETED' ? 'badge-success' : 'badge-primary'}`}>{order.status}</span>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 'var(--space-xs)' }}>
                    {new Date(order.orderDate).toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.9rem', marginBottom: 'var(--space-sm)' }}>
                    {order.items?.length || 0} items | <strong>₹{Number(order.totalAmount).toFixed(2)}</strong>
                  </div>
                  {order.items && order.items.length > 0 && (
                    <ul style={{ fontSize: '0.85rem', paddingLeft: '20px', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
                      {(order.items || []).map(item => (
                        <li key={item.id}>{item.productName} ({item.quantity} {item.unit})</li>
                      ))}
                    </ul>
                  )}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <button className="btn btn-outline btn-sm" onClick={() => handlePrintOrder(order)}>
                      🖨️ Print
                    </button>
                    {order.status === 'PENDING' && (
                      <button className="btn btn-ghost btn-sm text-danger" onClick={() => handleCancelMyOrder(order.id)}>
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>}
    </div>
  );
}
