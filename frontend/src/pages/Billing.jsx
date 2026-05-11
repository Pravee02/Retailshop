import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { productAPI, saleAPI } from '../services/api';
import toast from 'react-hot-toast';
import { 
  FiSearch, FiPlus, FiTrash2, FiPrinter, FiShoppingCart,
  FiUser, FiPhone, FiFileText, FiCheck
} from 'react-icons/fi';
import './Billing.css';

const UNIT_OPTIONS = {
  KG: [{ label: '1 KG', value: 1, unit: 'KG' }, { label: '500g', value: 500, unit: 'GRAM' }, { label: '250g', value: 250, unit: 'GRAM' }, { label: '100g', value: 100, unit: 'GRAM' }],
  LITER: [{ label: '1 Liter', value: 1, unit: 'LITER' }, { label: '500ml', value: 500, unit: 'ML' }, { label: '250ml', value: 250, unit: 'ML' }],
  PIECE: [{ label: '1 Piece', value: 1, unit: 'PIECE' }],
  PACK: [{ label: '1 Pack', value: 1, unit: 'PACK' }],
  GRAM: [{ label: '1 KG', value: 1000, unit: 'GRAM' }, { label: '500g', value: 500, unit: 'GRAM' }, { label: '100g', value: 100, unit: 'GRAM' }],
  ML: [{ label: '1 Liter', value: 1000, unit: 'ML' }, { label: '500ml', value: 500, unit: 'ML' }],
};

export default function Billing() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [billItems, setBillItems] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [taxPercent, setTaxPercent] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [generatedBill, setGeneratedBill] = useState(null);
  const [processing, setProcessing] = useState(false);
  const printRef = useRef(null);
  const searchRef = useRef(null);

  // Product Search - Only search if query is not empty
  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await productAPI.getAll(0, 20, search.trim());
        setSearchResults(res.data.content || []);
      } catch (e) { 
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const addItemToBill = (product) => {
    const existing = billItems.find(i => i.productId === product.id);
    if (existing) {
      toast('Product already in bill. Update quantity instead.', { icon: '⚠️' });
      setSearch('');
      setSearchResults([]); // Explicitly clear results
      return;
    }

    const item = {
      productId: product.id,
      productCode: product.productCode,
      productName: product.name,
      localName: product.localName,
      baseUnit: product.unitType,
      pricePerBaseUnit: product.pricePerUnit,
      quantity: "1",
      unit: product.unitType,
      pricePerUnit: product.pricePerUnit.toString(),
      total: product.pricePerUnit,
      availableStock: product.quantity,
    };

    setBillItems(prev => [...prev, item]);
    setSearch('');
    setSearchResults([]); // Immediately collapse search results
    toast.success(`Added: ${product.name}`);
  };

  const updateItemQuantity = (index, value) => {
    setBillItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const qty = parseFloat(value) || 0;
      const total = qty * parseFloat(item.pricePerUnit || 0);
      return { ...item, quantity: value, total };
    }));
  };

  const updateItemUnit = (index, unit) => {
    setBillItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      // Recalculate price based on unit
      let pricePerUnit = item.pricePerBaseUnit;
      if (['GRAM'].includes(unit) && item.baseUnit === 'KG') {
        pricePerUnit = item.pricePerBaseUnit / 1000;
      } else if (['ML'].includes(unit) && item.baseUnit === 'LITER') {
        pricePerUnit = item.pricePerBaseUnit / 1000;
      } else if (['KG'].includes(unit) && item.baseUnit === 'GRAM') {
        pricePerUnit = item.pricePerBaseUnit * 1000;
      } else if (['LITER'].includes(unit) && item.baseUnit === 'ML') {
        pricePerUnit = item.pricePerBaseUnit * 1000;
      }
      const total = (parseFloat(item.quantity) || 0) * pricePerUnit;
      return { ...item, unit, pricePerUnit: pricePerUnit.toString(), total };
    }));
  };

  const updateItemPrice = (index, value) => {
    setBillItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const p = parseFloat(value) || 0;
      return { ...item, pricePerUnit: value, total: (parseFloat(item.quantity) || 0) * p };
    }));
  };

  const removeItem = (index) => {
    setBillItems(prev => prev.filter((_, i) => i !== index));
  };

  // Quick-add with preset quantity
  const quickAddQuantity = (index, preset) => {
    setBillItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const unit = preset.unit;
      let pricePerUnit = item.pricePerBaseUnit;
      if (['GRAM'].includes(unit) && item.baseUnit === 'KG') {
        pricePerUnit = item.pricePerBaseUnit / 1000;
      } else if (['ML'].includes(unit) && item.baseUnit === 'LITER') {
        pricePerUnit = item.pricePerBaseUnit / 1000;
      }
      const qty = preset.value;
      return { ...item, quantity: qty.toString(), unit, pricePerUnit: pricePerUnit.toString(), total: qty * pricePerUnit };
    }));
  };

  // Calculations
  const subtotal = billItems.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = (subtotal * taxPercent) / 100;
  const grandTotal = subtotal + taxAmount - discount;

  // Generate Bill
  const handleGenerateBill = async () => {
    if (billItems.length === 0) {
      toast.error('Add at least one product');
      return;
    }

    setProcessing(true);
    try {
      const payload = {
        customerName: customerName || 'Walk-in Customer',
        customerPhone,
        items: billItems.map(item => ({
          productId: item.productId,
          quantity: parseFloat(item.quantity) || 0,
          unit: item.unit,
          pricePerUnit: parseFloat(item.pricePerUnit) || 0,
        })),
        taxPercent,
        discount,
        paymentMethod: 'CASH',
      };

      const response = await saleAPI.create(payload);
      setGeneratedBill(response.data);
      toast.success(t('billing.billGenerated'));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate bill');
    } finally {
      setProcessing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleNewBill = () => {
    setGeneratedBill(null);
    setBillItems([]);
    setCustomerName('');
    setCustomerPhone('');
    setTaxPercent(0);
    setDiscount(0);
  };

  // Generated Bill View
  if (generatedBill) {
    return (
      <div className="page-container">
        <div className="bill-actions no-print">
          <button className="btn btn-primary btn-lg" onClick={handlePrint}>
            <FiPrinter /> {t('common.print')}
          </button>
          <button className="btn btn-success btn-lg" onClick={handleNewBill}>
            <FiPlus /> New Bill
          </button>
        </div>

        <div className="invoice-container" ref={printRef}>
          <div className="invoice-header">
            <h1>🛒 RetailShop</h1>
            <p>123 Main Street, Bengaluru, Karnataka</p>
            <p>Phone: +91 9876543210 | GSTIN: 29XXXXX1234X1ZX</p>
          </div>

          <div className="invoice-divider">TAX INVOICE</div>

          <div className="invoice-meta">
            <div>
              <strong>Bill No:</strong> {generatedBill.billNumber}<br />
              <strong>Date:</strong> {new Date(generatedBill.saleDate).toLocaleString('en-IN')}<br />
            </div>
            <div>
              <strong>Customer:</strong> {generatedBill.customerName || 'Walk-in'}<br />
              <strong>Phone:</strong> {generatedBill.customerPhone || '—'}<br />
            </div>
          </div>

          <table className="invoice-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {generatedBill.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.serialNumber}</td>
                  <td>{item.productName}</td>
                  <td>{item.quantity}</td>
                  <td>{item.unit}</td>
                  <td>₹{Number(item.pricePerUnit).toFixed(2)}</td>
                  <td>₹{Number(item.total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="invoice-totals">
            <div className="total-row">
              <span>Subtotal ({generatedBill.totalItems} items):</span>
              <span>₹{Number(generatedBill.subtotal).toFixed(2)}</span>
            </div>
            {Number(generatedBill.taxPercent) > 0 && (
              <div className="total-row">
                <span>Tax ({generatedBill.taxPercent}% GST):</span>
                <span>₹{Number(generatedBill.taxAmount).toFixed(2)}</span>
              </div>
            )}
            {Number(generatedBill.discount) > 0 && (
              <div className="total-row">
                <span>Discount:</span>
                <span>-₹{Number(generatedBill.discount).toFixed(2)}</span>
              </div>
            )}
            <div className="total-row grand-total">
              <span>Grand Total:</span>
              <span>₹{Number(generatedBill.grandTotal).toFixed(2)}</span>
            </div>
          </div>

          <div className="invoice-footer">
            <p>Payment Method: {generatedBill.paymentMethod}</p>
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
            <p className="thank-you">Thank you for shopping with us! 🙏</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>{t('billing.title')}</h1>
          <p>{t('billing.subtitle')}</p>
        </div>
      </div>

      <div className="billing-layout">
        {/* Left: Product Search & Bill Items */}
        <div className="billing-main">
          {/* Customer Info */}
          <div className="card mb-lg">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label"><FiUser /> {t('billing.customerName')}</label>
                <input
                  className="form-input"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Walk-in Customer"
                />
              </div>
              <div className="form-group">
                <label className="form-label"><FiPhone /> {t('billing.customerPhone')}</label>
                <input
                  className="form-input"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Phone number"
                />
              </div>
            </div>
          </div>

          {/* Product Search */}
          <div className="billing-search-wrapper mb-lg">
            <div className="search-bar" style={{ maxWidth: '100%' }}>
              <FiSearch className="search-icon" />
              <input
                ref={searchRef}
                id="billing-product-search"
                type="text"
                placeholder="Search by Product Name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoComplete="off"
              />
            </div>

            {searchResults.length > 0 && (
              <div className="search-dropdown" style={{ 
                position: 'absolute', 
                top: '100%', 
                left: 0, 
                right: 0, 
                zIndex: 100, 
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                background: 'var(--bg-card)',
                borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
                border: '1px solid var(--primary)',
                borderTop: 'none'
              }}>
                {searchResults.map((product) => (
                  <div
                    key={product.id}
                    className="search-result-item"
                    onClick={() => addItemToBill(product)}
                  >
                    <div className="search-result-info">
                      <span className="search-result-name">{product.name} ({product.productCode})</span>
                      {product.localName && <span className="search-result-local">{product.localName}</span>}
                    </div>
                    <div className="search-result-meta">
                      <span>₹{product.pricePerUnit}/{product.unitType}</span>
                      <span className="text-muted">Stock: {product.quantity}</span>
                    </div>
                    <FiPlus className="search-result-add" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bill Items Section (Cart-like) */}
          <div className="card bill-cart-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ 
              padding: 'var(--space-md) var(--space-lg)', 
              background: 'rgba(99, 102, 241, 0.1)', 
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', margin: 0 }}>
                <FiShoppingCart /> Selected Items
              </h3>
              <span className="badge badge-primary">{billItems.length} {billItems.length === 1 ? 'Item' : 'Items'}</span>
            </div>
            
            <div className="table-container" style={{ border: 'none', borderRadius: 0, minHeight: '400px' }}>
              <div className="table-wrapper">
                {billItems.length > 0 ? (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: '50px' }}>#</th>
                        <th style={{ width: '80px' }}>ID</th>
                        <th>Product</th>
                        <th style={{ width: '100px' }}>Qty</th>
                        <th style={{ width: '110px' }}>Unit</th>
                        <th style={{ width: '110px' }}>Price/Unit</th>
                        <th style={{ width: '120px' }}>Total</th>
                        <th style={{ width: '50px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {billItems.map((item, index) => (
                        <tr key={index}>
                          <td data-label="#">{index + 1}</td>
                          <td data-label="ID"><span className="text-muted" style={{ fontSize: '11px' }}>{item.productCode || '—'}</span></td>
                          <td data-label="Product">
                            <div className="product-name-cell">
                              <span className="product-name-main" style={{ fontWeight: 600 }}>{item.productName}</span>
                              <div className="quick-units">
                                {(UNIT_OPTIONS[item.baseUnit] || []).map((opt, j) => (
                                  <button
                                    key={j}
                                    className="quick-unit-btn"
                                    onClick={() => quickAddQuantity(index, opt)}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </td>
                          <td data-label="Quantity">
                            <input
                              type="text"
                              inputMode="decimal"
                              className="form-input billing-input"
                              value={item.quantity}
                              onChange={(e) => updateItemQuantity(index, e.target.value)}
                            />
                          </td>
                          <td data-label="Unit">
                            <select
                              className="form-select billing-select"
                              value={item.unit}
                              onChange={(e) => updateItemUnit(index, e.target.value)}
                            >
                              {(UNIT_OPTIONS[item.baseUnit] || [{ label: item.baseUnit, unit: item.baseUnit }]).map((opt, j) => (
                                <option key={j} value={opt.unit}>{opt.unit}</option>
                              ))}
                            </select>
                          </td>
                          <td data-label="Price">
                            <input
                              type="text"
                              inputMode="decimal"
                              className="form-input billing-input"
                              value={item.pricePerUnit}
                              onChange={(e) => updateItemPrice(index, e.target.value)}
                            />
                          </td>
                          <td data-label="Total"><strong>₹{item.total.toFixed(2)}</strong></td>
                          <td data-label="Action">
                            <button className="btn btn-ghost btn-sm text-danger" onClick={() => removeItem(index)}>
                              <FiTrash2 />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-state" style={{ padding: 'var(--space-2xl) 0' }}>
                    <div className="empty-icon"><FiShoppingCart /></div>
                    <h3>No items added yet</h3>
                    <p>Search and add products to create a bill</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Bill Summary */}
        <div className="billing-sidebar">
          <div className="card">
            <h3 style={{ marginBottom: 'var(--space-md)', fontWeight: 700 }}>
              <FiFileText /> Bill Summary
            </h3>

            <div className="summary-row">
              <span>Items:</span>
              <span>{billItems.length}</span>
            </div>
            <div className="summary-row">
              <span>{t('billing.subtotal')}:</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>

            <div className="form-group mt-md">
              <label className="form-label">{t('billing.tax')} (%)</label>
              <input
                type="number"
                className="form-input"
                value={taxPercent}
                onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
              />
            </div>

            {taxAmount > 0 && (
              <div className="summary-row">
                <span>Tax Amount:</span>
                <span>₹{taxAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">{t('billing.discount')} (₹)</label>
              <input
                type="number"
                className="form-input"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                min="0"
              />
            </div>

            <div className="summary-divider"></div>

            <div className="summary-row grand-total">
              <span>{t('billing.grandTotal')}:</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>

            <button
              className="btn btn-success btn-lg w-full mt-md"
              onClick={handleGenerateBill}
              disabled={billItems.length === 0 || processing}
              id="generate-bill-btn"
            >
              {processing ? 'Processing...' : (
                <><FiCheck /> {t('billing.generateBill')}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
