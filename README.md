# 🌸 FloraShop - Full-Stack Flower E-Commerce Platform

A modern, full-stack e-commerce platform for a flower shop built with **React**, **Node.js**, **Express**, **PostgreSQL**, and **Stripe** payment integration.

## 📋 Table of Contents

- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Security Features](#security-features)
- [Deployment](#deployment)
- [Contributing](#contributing)

## 🏗️ Architecture

```
┌───────────────┐
│   Web Client  │
│     React     │
│  + Tailwind   │
└───────┬───────┘
        │ HTTPS
        ▼
┌────────────────────┐
│   Backend API      │
│ Node.js + Express  │
│                    │
│ - Auth (JWT)       │
│ - Products         │
│ - Orders / POS     │
│ - Users / Roles    │
└───────┬────────────┘
        │
        │ ORM (Prisma)
        ▼
┌────────────────────┐
│     Database       │
│   PostgreSQL       │
│                    │
│ - Users            │
│ - Products         │
│ - Orders           │
│ - Payments (refs)  │
└────────────────────┘
        │
        │ Secure API
        ▼
┌────────────────────┐
│ Payment Provider   │
│      Stripe        │
│ (PCI-DSS handled)  │
└────────────────────┘
```

## ✨ Features

### Customer Features
- 🛍️ Browse products by category
- 🔍 Search and filter products
- 🛒 Shopping cart with persistent state
- 👤 User authentication (register/login)
- 📍 Multiple delivery addresses
- 💳 Secure payment with Stripe
- 📦 Order tracking and history
- 🎨 Responsive design (mobile-first)

### Admin Features
- 📊 Admin dashboard
- ➕ Product management (CRUD)
- 🏷️ Category management
- 📦 Order management
- 👥 User management
- 📈 Sales analytics
- ⚙️ Role-based access control (RBAC)

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **React Router 6** - Routing
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **React Toastify** - Notifications
- **Stripe React** - Payment integration

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **Prisma** - ORM
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Stripe** - Payment processing
- **Helmet** - Security headers
- **Express Rate Limit** - Rate limiting

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **PostgreSQL** (v12 or higher)
- **Stripe Account** (for payment processing)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd flower-shop
```

### 2. Backend Setup

```bash
cd backend
npm install
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

## ⚙️ Configuration

### Backend Configuration

1. Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

2. Update the `.env` file with your credentials:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/flowershop?schema=public"

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### Frontend Configuration

1. Create a `.env` file in the `frontend` directory:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
```

## 🗄️ Database Setup

### 1. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE flowershop;

# Exit
\q
```

### 2. Run Migrations

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
```

### 3. Seed Database (Optional)

Create a seed file `backend/prisma/seed.js`:

```javascript
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@florashop.com' },
    update: {},
    create: {
      email: 'admin@florashop.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN'
    }
  });

  // Create categories
  const categories = [
    { name: 'Roses', slug: 'roses', description: 'Beautiful roses for every occasion' },
    { name: 'Tulips', slug: 'tulips', description: 'Elegant tulips in various colors' },
    { name: 'Bouquets', slug: 'bouquets', description: 'Hand-crafted bouquets' },
    { name: 'Plants', slug: 'plants', description: 'Indoor and outdoor plants' }
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat
    });
  }

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Run the seed:

```bash
node prisma/seed.js
```

## 🏃 Running the Application

### Development Mode

#### Terminal 1: Start Backend

```bash
cd backend
npm run dev
```

The API will be available at `http://localhost:5000`

#### Terminal 2: Start Frontend

```bash
cd frontend
npm start
```

The app will open at `http://localhost:3000`

### Production Mode

#### Build Frontend

```bash
cd frontend
npm run build
```

#### Start Backend

```bash
cd backend
NODE_ENV=production npm start
```

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/me` | Get current user | Yes |

### Product Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/products` | Get all products | No |
| GET | `/api/products/:slug` | Get product by slug | No |
| POST | `/api/products` | Create product | Yes (Admin) |
| PUT | `/api/products/:id` | Update product | Yes (Admin) |
| DELETE | `/api/products/:id` | Delete product | Yes (Admin) |

### Order Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/orders` | Create order | Yes |
| GET | `/api/orders/my-orders` | Get user orders | Yes |
| GET | `/api/orders/:orderNumber` | Get order details | Yes |
| GET | `/api/orders` | Get all orders | Yes (Admin) |
| PATCH | `/api/orders/:orderNumber/status` | Update order status | Yes (Admin) |
| PATCH | `/api/orders/:orderNumber/cancel` | Cancel order | Yes |

### Payment Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/payments/create-intent` | Create payment intent | Yes |
| POST | `/api/payments/webhook` | Stripe webhook | No |
| GET | `/api/payments/status/:orderId` | Get payment status | Yes |

## 📁 Project Structure

```
flower-shop/
├── backend/
│   ├── middleware/
│   │   └── auth.js              # Authentication middleware
│   ├── prisma/
│   │   └── schema.prisma        # Database schema
│   ├── routes/
│   │   ├── auth.js              # Auth routes
│   │   ├── products.js          # Product routes
│   │   ├── categories.js        # Category routes
│   │   ├── orders.js            # Order routes
│   │   ├── users.js             # User routes
│   │   └── payments.js          # Payment routes
│   ├── .env.example             # Environment variables template
│   ├── package.json
│   └── server.js                # Express server
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.js        # Navigation bar
    │   │   ├── Footer.js        # Footer
    │   │   └── PrivateRoute.js  # Protected route wrapper
    │   ├── contexts/
    │   │   ├── AuthContext.js   # Auth state management
    │   │   └── CartContext.js   # Cart state management
    │   ├── pages/
    │   │   ├── Home.js          # Homepage
    │   │   ├── Products.js      # Product listing
    │   │   ├── ProductDetail.js # Single product
    │   │   ├── Cart.js          # Shopping cart
    │   │   ├── Checkout.js      # Checkout page
    │   │   ├── Login.js         # Login page
    │   │   ├── Register.js      # Registration page
    │   │   ├── Profile.js       # User profile
    │   │   ├── Orders.js        # Order history
    │   │   ├── OrderDetail.js   # Single order
    │   │   └── AdminDashboard.js # Admin dashboard
    │   ├── services/
    │   │   └── api.js           # API client
    │   ├── App.js               # Main app component
    │   └── index.js             # Entry point
    ├── .env                     # Environment variables
    └── package.json
```

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - Bcrypt with salt rounds
- **Helmet.js** - Security headers
- **Rate Limiting** - API request throttling
- **CORS** - Cross-origin resource sharing control
- **Input Validation** - Express-validator
- **SQL Injection Protection** - Prisma ORM
- **XSS Protection** - React's built-in protection
- **HTTPS** - SSL/TLS encryption (production)
- **PCI-DSS Compliance** - Stripe handles card data

## 🚀 Deployment

### Backend Deployment (Heroku/Railway/Render)

1. **Set environment variables**
2. **Deploy with PostgreSQL addon**
3. **Run migrations**: `npx prisma migrate deploy`

### Frontend Deployment (Vercel/Netlify)

1. **Build**: `npm run build`
2. **Deploy**: Upload `build` folder
3. **Set environment variables**

### Database Hosting

- **Heroku Postgres**
- **Railway**
- **Supabase**
- **AWS RDS**

## 📝 Environment Variables

### Required Backend Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for JWT tokens |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret |
| `FRONTEND_URL` | Frontend URL for CORS |

### Required Frontend Variables

| Variable | Description |
|----------|-------------|
| `REACT_APP_API_URL` | Backend API URL |
| `REACT_APP_STRIPE_PUBLIC_KEY` | Stripe publishable key |

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📄 License

This project is licensed under the MIT License.

## 👥 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 Contact

For questions or support, please contact: info@florashop.com

## 🙏 Acknowledgments

- React team for the amazing framework
- Prisma for the excellent ORM
- Stripe for secure payment processing
- All contributors and supporters

---

Made with ❤️ and 🌸 by FloraShop Team
