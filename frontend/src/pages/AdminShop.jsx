import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { productAPI, orderAPI, shopAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiSearch, FiShoppingCart, FiPlus, FiMinus, FiTrash2, FiSend, FiX, FiUser, FiPhone, FiMapPin, FiPrinter, FiCheck, FiPackage, FiClipboard } from 'react-icons/fi';
import OrderInvoice from '../components/OrderInvoice';
import './CustomerShop.css';

const STATUS_COLORS = {
  PENDING: 'badge-warning',
  CONFIRMED: 'badge-info',
  PROCESSING: 'badge-primary',
  COMPLETED: 'badge-success',
  DELIVERED: 'badge-success',
  CANCELLED: 'badge-danger',
};

/**
 * AdminShop — INTERNAL use only.
 * Locked to the current admin's own shop.
 * No shop selector. No public browsing. 
 * Used by admin to self-order when billing fails or for manual orders.
 * Includes full Order Tracking and Print Bill action directly inline.
 */
export default function AdminShop() {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Tab State
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'orders'

  // Products Tab States
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState('');
  const [qtyInputs, setQtyInputs] = useState({});
  const [cartItems, setCartItems] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderForm, setOrderForm] = useState({ customerName: user?.fullName || '', customerPhone: '', customerAddress: '' });
  const [submitting, setSubmitting] = useState(false);
  
  // adminShop is resolved from the shops API on mount
  const [adminShop, setAdminShop] = useState(null);

  // Orders Tab States
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersPage, setOrdersPage] = useState(0);
  const [ordersTotalPages, setOrdersTotalPages] = useState(0);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [printOrder, setPrintOrder] = useState(null);

  // On mount: resolve this admin's own shop
  useEffect(() => {
    shopAPI.getAll().then(res => {
      const shops = res.data || [];
      // Find the shop owned by the current admin
      const myShop = shops.find(s => s.owner?.username === user?.username || s.owner?.id === user?.id);
      if (myShop) {
        setAdminShop(myShop);
      } else if (shops.length > 0) {
        // Fallback: first shop (for admin/admin123 backward compat)
        setAdminShop(shops[0]);
      }
    }).catch(() => toast.error('Failed to load shop info'));
  }, [user]);

  // Load categories when shop is resolved
  useEffect(() => {
    if (adminShop) {
      productAPI.getCategories(adminShop.id)
        .then(r => setCategories(r.data || []))
        .catch(() => {});
    }
  }, [adminShop]);

  // Load products — only if on products tab
  useEffect(() => {
    if (activeTab === 'products') {
      loadProducts();
    }
  }, [page, search, selectedCat, activeTab]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      // No shopId — admin's JWT token scopes results to their own products
      const res = await productAPI.getAll(page, 20, selectedCat || search);
      setProducts(res.data?.content || []);
      setTotalPages(res.data?.totalPages || 0);
    } catch (e) {
      toast.error('Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Load orders — only if on orders tab
  useEffect(() => {
    if (activeTab === 'orders') {
      loadOrders();
    }
  }, [ordersPage, activeTab]);

  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await orderAPI.getAll(ordersPage, 20);
      setOrders(res.data?.content || []);
      setOrdersTotalPages(res.data?.totalPages || 0);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setOrdersLoading(false);
    }
  };


  const addToCart = (product) => {
    const qty = parseFloat(qtyInputs[product.id]) || 1;
    if (qty <= 0) { toast.error('Enter a valid quantity'); return; }
    setCartItems(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + qty } : i);
      }
      return [...prev, { product, quantity: qty, unit: product.unitType }];
    });
    setQtyInputs(prev => ({ ...prev, [product.id]: '' }));
    toast.success(`${product.name} — ${qty} ${product.unitType} added!`);
  };

  const removeFromCart = (productId) => setCartItems(prev => prev.filter(i => i.product.id !== productId));
  const updateQty = (productId, qty) => {
    if (qty <= 0) { removeFromCart(productId); return; }
    setCartItems(prev => prev.map(i => i.product.id === productId ? { ...i, quantity: qty } : i));
  };
  const clearCart = () => setCartItems([]);

  const cartTotal = cartItems.reduce((s, i) => s + (i.product.pricePerUnit * i.quantity), 0);
  const cartCount = cartItems.length;

  const handlePlaceOrder = async () => {
    if (!orderForm.customerName) { toast.error('Enter customer name'); return; }
    if (!adminShop) { toast.error('Shop not resolved. Please wait.'); return; }
    setSubmitting(true);
    try {
      await orderAPI.create({
        shopId: adminShop.id,
        customerName: orderForm.customerName,
        customerPhone: orderForm.customerPhone,
        customerAddress: orderForm.customerAddress,
        items: cartItems.map(i => ({ productId: i.product.id, quantity: i.quantity, unit: i.unit || i.product.unitType })),
      });
      toast.success('Internal order placed successfully!');
      clearCart();
      setShowCart(false);
      setShowOrderForm(false);
      setOrderForm({ customerName: user?.fullName || '', customerPhone: '', customerAddress: '' });
      setActiveTab('orders');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  if (printOrder) {
    return <OrderInvoice order={printOrder} onBack={() => setPrintOrder(null)} />;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>🏪 Internal Shop Order</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Create and track orders for your own shop products.&nbsp;
            {adminShop && <span className="badge badge-primary">{adminShop.name}</span>}
          </p>
        </div>
        {activeTab === 'products' && (
          <button className="btn btn-primary" onClick={() => setShowCart(true)} style={{ position: 'relative' }}>
            <FiShoppingCart /> Cart
            {cartCount > 0 && (
              <span className="cart-count">
                {cartCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="tabs-container" style={{ display: 'flex', gap: '10px', marginBottom: 'var(--space-md)', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
        <button 
          className={`btn ${activeTab === 'products' ? 'btn-primary' : 'btn-ghost'}`} 
          onClick={() => { setActiveTab('products'); setPage(0); }}
        >
          📦 Shop Products
        </button>
        <button 
          className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-ghost'}`} 
          onClick={() => { setActiveTab('orders'); setOrdersPage(0); }}
        >
          📋 Track Orders
        </button>
      </div>

      {activeTab === 'products' ? (
        <>
          {/* Category chips */}
          <div className="shop-categories" style={{ marginBottom: 'var(--space-md)', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button className={`cat-chip ${!selectedCat ? 'active' : ''}`} onClick={() => { setSelectedCat(''); setPage(0); }}>All</button>
            {categories.map(c => (
              <button key={c} className={`cat-chip ${selectedCat === c ? 'active' : ''}`} onClick={() => { setSelectedCat(c); setSearch(''); setPage(0); }}>{c}</button>
            ))}
          </div>

          {/* Search */}
          <div style={{ marginBottom: 'var(--space-md)', position: 'relative' }}>
            <div className="search-bar">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by Product Name or ID..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0); setSelectedCat(''); }}
              />
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="loading-overlay"><div className="spinner" /></div>
          ) : products.length === 0 ? (
            <div className="empty-state"><h3>No products found</h3></div>
          ) : (
            <div className="product-grid">
              {products.map(p => (
                <div key={p.id} className="product-card">
                  <div className="product-card-image">
                    <div className="product-placeholder">📦</div>
                    {p.outOfStock && <div className="out-of-stock-overlay">Out of Stock</div>}
                  </div>
                  <div className="product-card-body">
                    <span className="product-card-category">{p.category}</span>
                    <h3 className="product-card-name">{p.name}</h3>
                    {p.localName && <p className="product-card-local">{p.localName}</p>}
                    <div className="product-card-price">
                      <span className="price-main">₹{p.pricePerUnit}</span>
                      <span className="price-unit">/ {p.unitType}</span>
                    </div>
                    <div className="product-card-qty-row">
                      <input
                        type="number" step="0.01" min="0.01" inputMode="decimal"
                        className="form-input product-qty-input"
                        placeholder="1"
                        value={qtyInputs[p.id] || ''}
                        onChange={e => setQtyInputs(prev => ({ ...prev, [p.id]: e.target.value }))}
                      />
                      <span className="product-qty-unit">{p.unitType}</span>
                    </div>
                    {qtyInputs[p.id] && parseFloat(qtyInputs[p.id]) > 0 && (
                      <div className="product-card-calc">= ₹{(parseFloat(qtyInputs[p.id]) * p.pricePerUnit).toFixed(2)}</div>
                    )}
                    <button className="btn btn-primary w-full" onClick={() => addToCart(p)} disabled={p.outOfStock}>
                      <FiPlus /> Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Prev</button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                <button key={i} className={page === i ? 'active' : ''} onClick={() => setPage(i)}>{i + 1}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}>Next</button>
            </div>
          )}
        </>
      ) : (
        /* Orders Tab Content */
        <>
          {ordersLoading ? (
            <div className="loading-overlay"><div className="spinner" /><p>Loading orders...</p></div>
          ) : orders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><FiClipboard /></div>
              <h3>No orders yet</h3>
              <p>Internal shop orders will appear here</p>
            </div>
          ) : (
            <div className="table-container table-mobile-cards">
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Customer</th>
                      <th>Phone</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <React.Fragment key={order.id}>
                        <tr className="cursor-pointer hover-bg" onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}>
                          <td data-label="Order #"><strong>{order.orderNumber}</strong></td>
                          <td data-label="Customer">{order.customerName}</td>
                          <td data-label="Phone">{order.customerPhone || '—'}</td>
                          <td data-label="Items">{order.items?.length || 0} items</td>
                          <td data-label="Total"><strong>₹{Number(order.totalAmount).toFixed(2)}</strong></td>
                          <td data-label="Status">
                            <span className={`badge ${STATUS_COLORS[order.status] || 'badge-primary'}`}>
                              {order.status}
                            </span>
                          </td>
                          <td data-label="Date">{new Date(order.orderDate).toLocaleDateString('en-IN')}</td>
                          <td data-label="Actions" onClick={e => e.stopPropagation()}>
                            <div className="flex gap-sm">
                              <button className="btn btn-sm btn-outline" onClick={() => setPrintOrder(order)} title="Print Invoice">
                                <FiPrinter /> Print
                              </button>
                            </div>
                          </td>
                        </tr>
                        {expandedOrderId === order.id && order.items && order.items.length > 0 && (
                          <tr className="order-details-row" style={{ backgroundColor: 'var(--bg-lighter)' }}>
                            <td colSpan="8" style={{ padding: 'var(--space-md)' }}>
                              <div style={{ padding: 'var(--space-md)', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                                <div className="flex justify-between items-center mb-md">
                                  <h4 style={{ marginBottom: 0 }}>Order Items:</h4>
                                  <button className="btn btn-sm btn-primary" onClick={() => setPrintOrder(order)}>
                                    <FiPrinter /> Print Invoice
                                  </button>
                                </div>
                                <div className="table-wrapper">
                                  <table className="data-table" style={{ background: 'transparent' }}>
                                    <thead>
                                      <tr>
                                        <th>Product ID</th>
                                        <th>Product Name</th>
                                        <th>Qty</th>
                                        <th>Unit Price</th>
                                        <th>Total</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {order.items.map(item => (
                                        <tr key={item.id}>
                                          <td>{item.product?.productCode || '—'}</td>
                                          <td>{item.productName}</td>
                                          <td>{item.quantity} {item.unit}</td>
                                          <td>₹{Number(item.pricePerUnit).toFixed(2)}</td>
                                          <td>₹{Number(item.total).toFixed(2)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                {order.notes && (
                                  <div style={{ marginTop: 'var(--space-md)' }}>
                                    <strong>Notes: </strong> {order.notes}
                                  </div>
                                )}
                                {order.customerAddress && (
                                  <div style={{ marginTop: 'var(--space-xs)' }}>
                                    <strong>Delivery Address: </strong> {order.customerAddress}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {ordersTotalPages > 1 && (
            <div className="pagination">
              <button onClick={() => setOrdersPage(p => Math.max(0, p - 1))} disabled={ordersPage === 0}>Previous</button>
              {Array.from({ length: ordersTotalPages }, (_, i) => (
                <button key={i} className={ordersPage === i ? 'active' : ''} onClick={() => setOrdersPage(i)}>{i + 1}</button>
              ))}
              <button onClick={() => setOrdersPage(p => Math.min(ordersTotalPages - 1, p + 1))} disabled={ordersPage === ordersTotalPages - 1}>Next</button>
            </div>
          )}
        </>
      )}

      {/* Cart Drawer */}
      {showCart && (
        <div className="cart-overlay" onClick={() => setShowCart(false)}>
          <div className="cart-drawer" onClick={e => e.stopPropagation()}>
            <div className="cart-header">
              <h2><FiShoppingCart /> Cart ({cartCount})</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowCart(false)}><FiX /></button>
            </div>
            <div className="cart-items">
              {cartItems.length === 0 ? (
                <div className="empty-state" style={{ padding: 40 }}><p>Cart is empty</p></div>
              ) : (
                cartItems.map(item => (
                  <div key={item.product.id} className="cart-item">
                    <div className="cart-item-info">
                      <h4>{item.product.name}</h4>
                      <p>₹{item.product.pricePerUnit}/{item.unit}</p>
                    </div>
                    <div className="cart-item-qty">
                      <button onClick={() => updateQty(item.product.id, parseFloat((item.quantity - 0.25).toFixed(3)))}><FiMinus /></button>
                      <input
                        type="number" step="0.01" min="0.01" inputMode="decimal"
                        className="cart-qty-input"
                        value={item.quantity}
                        onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v) && v > 0) updateQty(item.product.id, parseFloat(v.toFixed(3))); }}
                      />
                      <button onClick={() => updateQty(item.product.id, parseFloat((item.quantity + 0.25).toFixed(3)))}><FiPlus /></button>
                    </div>
                    <div className="cart-item-total">₹{(item.product.pricePerUnit * item.quantity).toFixed(2)}</div>
                    <button className="btn btn-ghost btn-sm text-danger" onClick={() => removeFromCart(item.product.id)}><FiTrash2 /></button>
                  </div>
                ))
              )}
            </div>
            {cartItems.length > 0 && (
              <div className="cart-footer">
                <div className="cart-total"><span>Total:</span><span>₹{cartTotal.toFixed(2)}</span></div>
                {!showOrderForm ? (
                  <button className="btn btn-success btn-lg w-full" onClick={() => setShowOrderForm(true)}>
                    <FiSend /> Place Order
                  </button>
                ) : (
                  <div className="order-form">
                    <div className="form-group">
                      <label className="form-label"><FiUser /> Customer Name *</label>
                      <input className="form-input" value={orderForm.customerName} onChange={e => setOrderForm({ ...orderForm, customerName: e.target.value })} placeholder="Name" />
                    </div>
                    <div className="form-group">
                      <label className="form-label"><FiPhone /> Phone</label>
                      <input className="form-input" value={orderForm.customerPhone} onChange={e => setOrderForm({ ...orderForm, customerPhone: e.target.value })} placeholder="Phone" />
                    </div>
                    <div className="form-group">
                      <label className="form-label"><FiMapPin /> Address</label>
                      <input className="form-input" value={orderForm.customerAddress} onChange={e => setOrderForm({ ...orderForm, customerAddress: e.target.value })} placeholder="Address" />
                    </div>
                    <button className="btn btn-success btn-lg w-full" onClick={handlePlaceOrder} disabled={submitting}>
                      {submitting ? 'Placing...' : `Place Order — ₹${cartTotal.toFixed(2)}`}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
