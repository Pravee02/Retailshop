# 🛒 RetailShop — Inventory Management System

A complete enterprise-level **Retail Shop Inventory Management System** with modern architecture, scalable backend, responsive frontend, and clean UI.

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + React Router |
| Backend | Java 17 + Spring Boot 3.2.5 |
| Database | H2 (dev) / MySQL 8 (prod) |
| Auth | JWT + Spring Security |
| ORM | Hibernate / JPA |
| Build | Maven + npm |
| Charts | Recharts |
| i18n | react-i18next (English + Kannada) |
| API Docs | Swagger / OpenAPI |
| Docker | docker-compose |

## 📁 Project Structure

```
RetailShop/
├── backend/                    # Spring Boot API
│   ├── src/main/java/com/retailshop/
│   │   ├── config/             # Security, CORS, Data Init
│   │   ├── controller/         # REST Controllers
│   │   ├── dto/                # Request/Response DTOs
│   │   ├── entity/             # JPA Entities
│   │   ├── exception/          # Global Exception Handling
│   │   ├── repository/         # Spring Data JPA
│   │   ├── security/           # JWT Token Provider
│   │   └── service/            # Business Logic
│   └── src/main/resources/
│       ├── application.properties
│       └── data.sql            # Sample data
├── frontend/                   # React + Vite
│   └── src/
│       ├── components/         # Sidebar
│       ├── context/            # Auth, Theme, Cart
│       ├── i18n/               # Translations
│       ├── pages/              # All pages
│       └── services/           # API client
├── database/schema.sql         # Full SQL schema
├── docker-compose.yml
└── README.md
```

## ⚡ Quick Start

### Prerequisites
- Java 17+
- Node.js 18+
- Maven 3.8+

### 1. Start Backend
```bash
cd backend
mvn spring-boot:run
```
Backend runs at: http://localhost:8080
H2 Console: http://localhost:8080/h2-console
Swagger UI: http://localhost:8080/swagger-ui.html

### 2. Start Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at: http://localhost:3000

### 3. Login Credentials
| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Customer | customer | customer123 |

## 🐳 Docker Deployment
```bash
docker-compose up --build
```

## 📋 Features

### Admin Module
- ✅ Product Management (CRUD + Search + Barcode)
- ✅ Sales & Billing with Invoice Generation
- ✅ Inventory Dashboard with Charts
- ✅ Customer Order Management
- ✅ Low Stock / Out of Stock Alerts
- ✅ Revenue Analytics (Daily/Weekly/Monthly)
- ✅ Flexible Quantity Pricing (KG↔Gram, Liter↔ML)
- ✅ Printable Invoices
- ✅ Dark/Light Theme Toggle

### Customer Module
- ✅ Product Browsing with Category Filters
- ✅ Shopping Cart
- ✅ Order Placement
- ✅ Multi-language Support (English + Kannada)
- ✅ Mobile-first Responsive Design

## 🔐 API Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | /api/auth/login | Login | Public |
| POST | /api/auth/register | Register | Public |
| GET | /api/products | List products | Public |
| POST | /api/products | Create product | Admin |
| PUT | /api/products/{id} | Update product | Admin |
| DELETE | /api/products/{id} | Delete product | Admin |
| GET | /api/products/{id}/calculate-price | Price calc | Public |
| POST | /api/sales | Create sale | Admin |
| GET | /api/sales | List sales | Admin |
| GET | /api/dashboard | Analytics | Admin |
| POST | /api/orders | Place order | Public |
| GET | /api/orders | List orders | Admin |

## 🗄️ Database Schema

7 core tables: `users`, `products`, `customers`, `sales`, `sale_items`, `purchases`, `inventory_logs`, `customer_orders`, `order_items`

## 📄 License
MIT
