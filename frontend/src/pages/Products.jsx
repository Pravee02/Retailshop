import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { productAPI } from '../services/api';
import toast from 'react-hot-toast';
import { 
  FiPlus, FiEdit2, FiTrash2, FiSearch, FiPackage, 
  FiAlertTriangle, FiXCircle, FiCheck, FiX
} from 'react-icons/fi';
import './Products.css';

const UNIT_TYPES = ['KG', 'GRAM', 'LITER', 'ML', 'PACK', 'PIECE', 'CUSTOM'];

const emptyProduct = {
  name: '', localName: '', category: '', quantity: '', unitType: 'KG',
  customUnit: '', pricePerUnit: '', productCode: '', imageUrl: '', description: '', minStockLevel: '10'
};

export default function Products() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({ ...emptyProduct });
  const [categories, setCategories] = useState(['Grains', 'Pulses', 'Oils', 'Essentials', 'Dairy', 'Beverages', 'Spices', 'Personal Care', 'Snacks', 'Household']);
  const [saving, setSaving] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await productAPI.getAll(page, 20, search);
      setProducts(response.data.content);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    productAPI.getCategories()
      .then(res => {
        const backendCats = res.data.filter(c => c && c.trim() !== '');
        setCategories(prev => {
          const combined = [...new Set([...prev, ...backendCats])];
          return combined.sort();
        });
      })
      .catch(() => {});
  }, []);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(0);
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({ ...emptyProduct });
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      localName: product.localName || '',
      category: product.category || '',
      quantity: product.quantity?.toString() || '',
      unitType: product.unitType || 'KG',
      customUnit: product.customUnit || '',
      pricePerUnit: product.pricePerUnit?.toString() || '',
      productCode: product.productCode || '',
      imageUrl: product.imageUrl || '',
      description: product.description || '',
      minStockLevel: product.minStockLevel?.toString() || '10',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.productCode || !formData.name || !formData.quantity || !formData.pricePerUnit) {
      toast.error('Please fill required fields (Product ID, Name, Quantity, Price)');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        quantity: parseFloat(formData.quantity),
        pricePerUnit: parseFloat(formData.pricePerUnit),
        minStockLevel: parseFloat(formData.minStockLevel || '10'),
      };

      if (editingProduct) {
        await productAPI.update(editingProduct.id, payload);
        toast.success('Product updated successfully!');
      } else {
        await productAPI.create(payload);
        toast.success('Product added successfully!');
      }

      setShowModal(false);
      loadProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    try {
      await productAPI.delete(product.id);
      toast.success('Product deleted');
      loadProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const getStockBadge = (product) => {
    if (product.outOfStock) return <span className="badge badge-danger"><FiXCircle /> Out of Stock</span>;
    if (product.lowStock) return <span className="badge badge-warning"><FiAlertTriangle /> Low Stock</span>;
    return <span className="badge badge-success"><FiCheck /> In Stock</span>;
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>{t('products.title')}</h1>
          <p>{t('products.subtitle')}</p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={openAddModal} id="add-product-btn">
          <FiPlus /> {t('products.addNew')}
        </button>
      </div>

      {/* Search & Filters */}
      <div className="product-toolbar">
        <div className="search-bar">
          <FiSearch className="search-icon" />
          <input
            id="product-search"
            type="text"
            placeholder="Search by Product Name or ID..."
            value={search}
            onChange={handleSearch}
          />
        </div>
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>{t('common.loading')}</p>
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><FiPackage /></div>
          <h3>{t('common.noData')}</h3>
          <p>Add your first product to get started</p>
        </div>
      ) : (
        <div className="table-container">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>{t('products.name')}</th>
                  <th>{t('products.category')}</th>
                  <th>{t('products.quantity')}</th>
                  <th>{t('products.unit')}</th>
                  <th>{t('products.price')}</th>
                  <th>{t('common.status')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td><span className="text-muted">{product.productCode || `#${product.id}`}</span></td>
                    <td>
                      <div className="product-name-cell">
                        <span className="product-name-main">{product.name}</span>
                        {product.localName && (
                          <span className="product-name-local">{product.localName}</span>
                        )}
                      </div>
                    </td>
                    <td><span className="badge badge-primary">{product.category || '—'}</span></td>
                    <td><strong>{product.quantity}</strong></td>
                    <td>{product.unitType}</td>
                    <td><strong>₹{product.pricePerUnit}</strong></td>
                    <td>{getStockBadge(product)}</td>
                    <td>
                      <div className="flex gap-sm">
                        <button 
                          className="btn btn-ghost btn-sm" 
                          onClick={() => openEditModal(product)}
                          title={t('common.edit')}
                        >
                          <FiEdit2 />
                        </button>
                        <button 
                          className="btn btn-ghost btn-sm text-danger" 
                          onClick={() => handleDelete(product)}
                          title={t('common.delete')}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} className={page === i ? 'active' : ''} onClick={() => setPage(i)}>
              {i + 1}
            </button>
          ))}
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}>
            Next
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h2>{editingProduct ? t('products.editProduct') : t('products.addNew')}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{t('products.name')} *</label>
                    <input
                      className="form-input"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Product name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('products.localName')}</label>
                    <input
                      className="form-input"
                      value={formData.localName}
                      onChange={(e) => setFormData({ ...formData, localName: e.target.value })}
                      placeholder="ಸ್ಥಳೀಯ ಹೆಸರು"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{t('products.category')}</label>
                    <div className="category-input-group">
                      <select
                        className="form-input"
                        value={categories.includes(formData.category) ? formData.category : (formData.category ? 'OTHER' : '')}
                        onChange={(e) => {
                          if (e.target.value === 'OTHER') {
                            setFormData({ ...formData, category: '' });
                          } else {
                            setFormData({ ...formData, category: e.target.value });
                          }
                        }}
                      >
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                        <option value="OTHER">+ Add New Category</option>
                      </select>
                      {(formData.category === '' || !categories.includes(formData.category)) && (
                        <input
                          className="form-input mt-2"
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          placeholder="Type new category name"
                          autoFocus
                        />
                      )}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Product ID *</label>
                    <input
                      className="form-input"
                      value={formData.productCode}
                      onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
                      placeholder="e.g., 1, 101, P1001, SOAP01"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{t('products.quantity')} *</label>
                    <input
                      className="form-input"
                      type="number"
                      step="0.001"
                      min="0"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      placeholder="0"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('products.unit')} *</label>
                    <select
                      className="form-select"
                      value={formData.unitType}
                      onChange={(e) => setFormData({ ...formData, unitType: e.target.value })}
                    >
                      {UNIT_TYPES.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>

                {formData.unitType === 'CUSTOM' && (
                  <div className="form-group">
                    <label className="form-label">Custom Unit Name</label>
                    <input
                      className="form-input"
                      value={formData.customUnit}
                      onChange={(e) => setFormData({ ...formData, customUnit: e.target.value })}
                      placeholder="e.g., Dozen, Bundle"
                    />
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{t('products.price')} (₹) *</label>
                    <input
                      className="form-input"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.pricePerUnit}
                      onChange={(e) => setFormData({ ...formData, pricePerUnit: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('products.minStock')}</label>
                    <input
                      className="form-input"
                      type="number"
                      step="0.001"
                      min="0"
                      value={formData.minStockLevel}
                      onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
                      placeholder="10"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Product description..."
                    rows={3}
                    style={{ minHeight: 80 }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
