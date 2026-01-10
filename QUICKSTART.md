# 🚀 Quick Start Guide - FloraShop

Get your flower shop running in 5 minutes!

## Prerequisites

- Node.js 16+ installed
- PostgreSQL installed and running
- Stripe account (free test account)

## Step 1: Database Setup (2 minutes)

```bash
# Create database
psql -U postgres
CREATE DATABASE flowershop;
\q
```

## Step 2: Backend Setup (1 minute)

```bash
cd flower-shop/backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your details:
# - DATABASE_URL: Your PostgreSQL connection string
# - JWT_SECRET: Any random secure string
# - STRIPE_SECRET_KEY: Your Stripe test key (from dashboard.stripe.com)

# Run database migrations
npx prisma generate
npx prisma migrate dev --name init

# Start backend server
npm run dev
```

Backend should now be running on `http://localhost:5000`

## Step 3: Frontend Setup (1 minute)

Open a NEW terminal:

```bash
cd flower-shop/frontend

# Install dependencies
npm install

# Create .env file
echo 'REACT_APP_API_URL=http://localhost:5000/api' > .env
echo 'REACT_APP_STRIPE_PUBLIC_KEY=your_stripe_public_key' >> .env

# Start frontend
npm start
```

Frontend should open automatically at `http://localhost:3000`

## Step 4: Create Test Data (1 minute)

### Option 1: Using Prisma Studio (Recommended)

```bash
# In backend directory
npx prisma studio
```

This opens a GUI at `http://localhost:5555` where you can:
1. Create categories (Roses, Tulips, Bouquets)
2. Create products with prices and images
3. Create an admin user

### Option 2: Using SQL

```sql
-- Create admin user (password: admin123)
INSERT INTO users (id, email, password, "firstName", "lastName", role, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@florashop.com',
  '$2a$10$YourHashedPasswordHere',
  'Admin',
  'User',
  'ADMIN',
  NOW(),
  NOW()
);

-- Create categories
INSERT INTO categories (id, name, slug, description, "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'Roses', 'roses', 'Beautiful roses', NOW(), NOW()),
  (gen_random_uuid(), 'Tulips', 'tulips', 'Elegant tulips', NOW(), NOW());
```

## 🎉 You're Done!

### Test the Application:

1. **Homepage**: Visit `http://localhost:3000`
2. **Register**: Create a new account
3. **Browse**: Check out the products
4. **Shop**: Add items to cart
5. **Checkout**: Complete a test order

### Test Stripe Payment:

Use these test card numbers:
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- Any future expiry date, any CVC

### Access Admin Panel:

1. Login with admin credentials (from step 4)
2. Navigate to `/admin`
3. Manage products, orders, and users

## Common Issues

### Issue: "Cannot connect to database"
**Solution**: Make sure PostgreSQL is running and DATABASE_URL is correct

### Issue: "Port 3000 already in use"
**Solution**: Kill the process or use a different port:
```bash
PORT=3001 npm start
```

### Issue: "Stripe error"
**Solution**: Make sure you're using test mode keys from Stripe dashboard

## Next Steps

1. **Add Products**: Use admin panel to add real products
2. **Customize Design**: Edit React components to match your brand
3. **Configure Stripe**: Set up webhooks for production
4. **Deploy**: Follow deployment guide in main README

## Need Help?

- Check the main README.md for detailed documentation
- Review the API documentation section
- Check Stripe docs: https://stripe.com/docs
- Prisma docs: https://www.prisma.io/docs

## Project Structure Recap

```
flower-shop/
├── backend/          # Node.js API
│   ├── routes/      # API endpoints
│   ├── middleware/  # Auth & validation
│   └── prisma/      # Database schema
└── frontend/        # React app
    ├── components/  # Reusable UI
    ├── pages/       # Route pages
    └── services/    # API calls
```

Happy coding! 🌸
