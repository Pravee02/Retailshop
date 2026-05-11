import React from 'react';
import { FiArrowLeft, FiPrinter } from 'react-icons/fi';
import './OrderInvoice.css';

const OrderInvoice = ({ order, onBack }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="page-container">
      <div className="page-header no-print">
        <button className="btn btn-outline" onClick={onBack}>
          <FiArrowLeft /> Back to Orders
        </button>
        <button className="btn btn-primary" onClick={handlePrint}>
          <FiPrinter /> Print Invoice
        </button>
      </div>

      <div className="invoice-container">
        <div className="invoice-header">
          <h1>🛒 RetailShop</h1>
          <p>123 Main Street, Bengaluru, Karnataka</p>
          <p>Phone: +91 9876543210 | GSTIN: 29XXXXX1234X1ZX</p>
        </div>

        <div className="invoice-divider">TAX INVOICE / ORDER SHEET</div>

        <div className="invoice-meta">
          <div>
            <strong>Order No:</strong> {order.orderNumber}<br />
            <strong>Date:</strong> {new Date(order.orderDate).toLocaleString('en-IN')}<br />
            <strong>Status:</strong> {order.status}
          </div>
          <div>
            <strong>Customer:</strong> {order.customerName}<br />
            <strong>Phone:</strong> {order.customerPhone || '—'}<br />
            {order.customerAddress && (
              <>
                <strong>Address:</strong> {order.customerAddress}
              </>
            )}
          </div>
        </div>

        <table className="invoice-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Product</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {(order.items || []).map((item) => (
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

        <div className="invoice-totals">
          <div className="total-row">
            <span>Total Items:</span>
            <span>{order.items.length}</span>
          </div>
          <div className="total-row grand-total">
            <span>Grand Total:</span>
            <span>₹{Number(order.totalAmount).toFixed(2)}</span>
          </div>
        </div>

        {order.notes && (
          <div style={{ marginTop: '20px', fontSize: '12px', borderTop: '1px dashed #ccc', paddingTop: '10px' }}>
            <strong>Notes:</strong> {order.notes}
          </div>
        )}

        <div className="invoice-footer">
          <p className="thank-you">Thank you for your order! 🙏</p>
          <div className="invoice-signature">
            <div>
              <div className="sig-line"></div>
              <p>Customer Signature</p>
            </div>
            <div>
              <div className="sig-line"></div>
              <p>Authorized Signature</p>
            </div>
          </div>
          <p style={{ fontSize: '10px', marginTop: '15px', opacity: 0.7 }}>
            Generated on: {new Date().toLocaleString('en-IN')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderInvoice;
