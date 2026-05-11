import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Navigation
      'nav.dashboard': 'Dashboard',
      'nav.products': 'Products',
      'nav.billing': 'Sales & Billing',
      'nav.inventory': 'Inventory',
      'nav.orders': 'Orders',
      'nav.customers': 'Customers',
      'nav.shop': 'Customer Shop',
      'nav.settings': 'Settings',
      'nav.logout': 'Logout',
      
      // Common
      'common.search': 'Search...',
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'common.add': 'Add',
      'common.loading': 'Loading...',
      'common.noData': 'No data found',
      'common.actions': 'Actions',
      'common.print': 'Print',
      'common.total': 'Total',
      'common.quantity': 'Quantity',
      'common.price': 'Price',
      'common.name': 'Name',
      'common.status': 'Status',
      
      // Dashboard
      'dashboard.title': 'Dashboard',
      'dashboard.subtitle': 'Overview of your shop performance',
      'dashboard.totalProducts': 'Total Products',
      'dashboard.totalStock': 'Stock Value',
      'dashboard.todaySales': "Today's Sales",
      'dashboard.todayRevenue': "Today's Revenue",
      'dashboard.monthlyRevenue': 'Monthly Revenue',
      'dashboard.lowStock': 'Low Stock',
      'dashboard.outOfStock': 'Out of Stock',
      'dashboard.profit': 'Est. Profit',
      
      // Products
      'products.title': 'Product Management',
      'products.subtitle': 'Manage your inventory products',
      'products.addNew': 'Add Product',
      'products.editProduct': 'Edit Product',
      'products.deleteConfirm': 'Are you sure you want to delete this product?',
      'products.name': 'Product Name',
      'products.localName': 'Local Name',
      'products.category': 'Category',
      'products.quantity': 'Quantity',
      'products.unit': 'Unit Type',
      'products.price': 'Price Per Unit',
      'products.barcode': 'Barcode',
      'products.minStock': 'Min Stock Level',
      'products.lowStockAlert': 'Low Stock',
      'products.outOfStockAlert': 'Out of Stock',
      'products.inStock': 'In Stock',
      
      // Billing
      'billing.title': 'Sales & Billing',
      'billing.subtitle': 'Create bills and manage sales',
      'billing.newBill': 'New Bill',
      'billing.searchProduct': 'Search products to add...',
      'billing.customerName': 'Customer Name',
      'billing.customerPhone': 'Phone Number',
      'billing.addToBill': 'Add to Bill',
      'billing.generateBill': 'Generate Bill',
      'billing.billGenerated': 'Bill Generated Successfully!',
      'billing.subtotal': 'Subtotal',
      'billing.tax': 'Tax (GST)',
      'billing.discount': 'Discount',
      'billing.grandTotal': 'Grand Total',
      
      // Customer Portal
      'shop.title': 'Welcome to Our Shop',
      'shop.subtitle': 'Browse and order products',
      'shop.addToCart': 'Add to Cart',
      'shop.cart': 'Cart',
      'shop.placeOrder': 'Place Order',
      'shop.orderPlaced': 'Order placed successfully!',
      
      // Auth
      'auth.login': 'Login',
      'auth.register': 'Register',
      'auth.username': 'Username',
      'auth.password': 'Password',
      'auth.welcome': 'Welcome Back',
      'auth.subtitle': 'Sign in to manage your shop',
    }
  },
  kn: {
    translation: {
      'nav.dashboard': 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
      'nav.products': 'ಉತ್ಪನ್ನಗಳು',
      'nav.billing': 'ಮಾರಾಟ ಮತ್ತು ಬಿಲ್ಲಿಂಗ್',
      'nav.inventory': 'ದಾಸ್ತಾನು',
      'nav.orders': 'ಆದೇಶಗಳು',
      'nav.customers': 'ಗ್ರಾಹಕರು',
      'nav.shop': 'ಅಂಗಡಿ',
      'nav.logout': 'ಲಾಗ್ ಔಟ್',
      
      'common.search': 'ಹುಡುಕಿ...',
      'common.save': 'ಉಳಿಸಿ',
      'common.cancel': 'ರದ್ದುಮಾಡಿ',
      'common.delete': 'ಅಳಿಸಿ',
      'common.edit': 'ತಿದ್ದಿ',
      'common.add': 'ಸೇರಿಸಿ',
      'common.loading': 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
      'common.noData': 'ಯಾವುದೇ ಡೇಟಾ ಕಂಡುಬಂದಿಲ್ಲ',
      'common.print': 'ಮುದ್ರಿಸಿ',
      'common.total': 'ಒಟ್ಟು',
      'common.quantity': 'ಪ್ರಮಾಣ',
      'common.price': 'ಬೆಲೆ',
      'common.name': 'ಹೆಸರು',
      
      'dashboard.title': 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
      'dashboard.totalProducts': 'ಒಟ್ಟು ಉತ್ಪನ್ನಗಳು',
      'dashboard.totalStock': 'ದಾಸ್ತಾನು ಮೌಲ್ಯ',
      'dashboard.todaySales': 'ಇಂದಿನ ಮಾರಾಟ',
      'dashboard.todayRevenue': 'ಇಂದಿನ ಆದಾಯ',
      'dashboard.monthlyRevenue': 'ಮಾಸಿಕ ಆದಾಯ',
      
      'products.title': 'ಉತ್ಪನ್ನ ನಿರ್ವಹಣೆ',
      'products.addNew': 'ಉತ್ಪನ್ನ ಸೇರಿಸಿ',
      
      'billing.title': 'ಮಾರಾಟ ಮತ್ತು ಬಿಲ್ಲಿಂಗ್',
      'billing.generateBill': 'ಬಿಲ್ ರಚಿಸಿ',
      
      'shop.title': 'ನಮ್ಮ ಅಂಗಡಿಗೆ ಸ್ವಾಗತ',
      'shop.addToCart': 'ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಿ',
      'shop.placeOrder': 'ಆದೇಶ ನೀಡಿ',
      
      'auth.login': 'ಲಾಗಿನ್',
      'auth.welcome': 'ಮರಳಿ ಸ್ವಾಗತ',
      'auth.username': 'ಬಳಕೆದಾರ ಹೆಸರು',
      'auth.password': 'ಗುಪ್ತಪದ',
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

export default i18n;
