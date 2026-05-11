import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { orderAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiClipboard, FiCheck, FiX, FiClock, FiPackage, FiPrinter } from 'react-icons/fi';
import OrderInvoice from '../components/OrderInvoice';

const STATUS_COLORS = {
  PENDING: 'badge-warning',
  CONFIRMED: 'badge-info',
  PROCESSING: 'badge-primary',
  COMPLETED: 'badge-success',
  CANCELLED: 'badge-danger',
};

export default function Orders() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [printOrder, setPrintOrder] = useState(null);

  useEffect(() => {
    loadOrders();
  }, [page]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await orderAPI.getAll(page, 20);
      setOrders(response.data?.content || []);
      setTotalPages(response.data?.totalPages || 0);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await orderAPI.updateStatus(id, status);
      toast.success(`Order updated to ${status}`);
      loadOrders();
    } catch (error) {
      toast.error('Failed to update order');
    }
  };

  if (loading) {
    return <div className="loading-overlay"><div className="spinner"></div><p>{t('common.loading')}</p></div>;
  }

  if (printOrder) {
    return <OrderInvoice order={printOrder} onBack={() => setPrintOrder(null)} />;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>{t('nav.orders')}</h1>
          <p>Manage customer orders</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><FiClipboard /></div>
          <h3>No orders yet</h3>
          <p>Customer orders will appear here</p>
        </div>
      ) : (
        <div className="table-container">
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
                            <FiPrinter />
                          </button>
                          {order.status === 'PENDING' && (
                            <>
                              <button className="btn btn-sm btn-success" onClick={() => updateStatus(order.id, 'CONFIRMED')}>
                                <FiCheck /> Accept
                              </button>
                              <button className="btn btn-sm btn-danger" onClick={() => updateStatus(order.id, 'CANCELLED')}>
                                <FiX /> Cancel
                              </button>
                            </>
                          )}
                          {order.status === 'CONFIRMED' && (
                            <button className="btn btn-sm btn-primary" onClick={() => updateStatus(order.id, 'PROCESSING')}>
                              <FiPackage /> Process
                            </button>
                          )}
                          {order.status === 'PROCESSING' && (
                            <button className="btn btn-sm btn-success" onClick={() => updateStatus(order.id, 'COMPLETED')}>
                              <FiCheck /> Complete
                            </button>
                          )}
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
