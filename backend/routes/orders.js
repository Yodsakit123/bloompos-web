const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Generate unique order number
const generateOrderNumber = () => {
  const prefix = 'FS';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
};

// Create order (authenticated users)
router.post('/', authenticate, async (req, res) => {
  try {
    const { items, addressId, deliveryDate, notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: { message: 'Order must contain at least one item' } });
    }

    // Verify address belongs to user
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId: req.user.id }
    });

    if (!address) {
      return res.status(404).json({ error: { message: 'Address not found' } });
    }

    // Fetch product details and calculate totals
    const productIds = items.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true }
    });

    if (products.length !== items.length) {
      return res.status(400).json({ error: { message: 'Some products are unavailable' } });
    }

    // Check stock availability
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          error: { message: `Insufficient stock for ${product.name}` } 
        });
      }
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = items.map(item => {
      const product = products.find(p => p.id === item.productId);
      const itemTotal = parseFloat(product.price) * item.quantity;
      subtotal += itemTotal;
      
      return {
        productId: item.productId,
        quantity: item.quantity,
        price: product.price
      };
    });

    const tax = subtotal * 0.1; // 10% tax
    const deliveryFee = subtotal > 50 ? 0 : 5.99; // Free delivery over $50
    const total = subtotal + tax + deliveryFee;

    // Create order with items
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: req.user.id,
        addressId,
        subtotal,
        tax,
        deliveryFee,
        total,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        notes,
        items: {
          create: orderItems
        }
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                slug: true
              }
            }
          }
        },
        address: true
      }
    });

    // Update product stock
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity
          }
        }
      });
    }

    res.status(201).json({ order });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: { message: 'Failed to create order' } });
  }
});

// Get user's orders
router.get('/my-orders', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId: req.user.id },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                  slug: true
                }
              }
            }
          },
          address: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.order.count({ where: { userId: req.user.id } })
    ]);

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({ error: { message: 'Failed to fetch orders' } });
  }
});

// Get single order
router.get('/:orderNumber', authenticate, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber: req.params.orderNumber },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                slug: true
              }
            }
          }
        },
        address: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: { message: 'Order not found' } });
    }

    // Only allow user to see their own order, or admin to see any
    if (order.userId !== req.user.id && !['ADMIN', 'MANAGER'].includes(req.user.role)) {
      return res.status(403).json({ error: { message: 'Access denied' } });
    }

    res.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: { message: 'Failed to fetch order' } });
  }
});

// Get all orders (admin only)
router.get('/', authenticate, authorize('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = status ? { status } : {};

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true
                }
              }
            }
          },
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          },
          address: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.order.count({ where })
    ]);

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ error: { message: 'Failed to fetch orders' } });
  }
});

// Update order status (admin only)
router.patch('/:orderNumber/status', authenticate, authorize('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { status } = req.body;

    const order = await prisma.order.update({
      where: { orderNumber: req.params.orderNumber },
      data: { status },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    res.json({ order });
  } catch (error) {
    console.error('Update order status error:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: { message: 'Order not found' } });
    }
    
    res.status(500).json({ error: { message: 'Failed to update order status' } });
  }
});

// Cancel order
router.patch('/:orderNumber/cancel', authenticate, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber: req.params.orderNumber },
      include: { items: true }
    });

    if (!order) {
      return res.status(404).json({ error: { message: 'Order not found' } });
    }

    // Only allow user to cancel their own order, or admin to cancel any
    if (order.userId !== req.user.id && !['ADMIN', 'MANAGER'].includes(req.user.role)) {
      return res.status(403).json({ error: { message: 'Access denied' } });
    }

    // Can only cancel if not already delivered
    if (order.status === 'DELIVERED') {
      return res.status(400).json({ error: { message: 'Cannot cancel delivered order' } });
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { orderNumber: req.params.orderNumber },
      data: { status: 'CANCELLED' }
    });

    // Restore product stock
    for (const item of order.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: item.quantity
          }
        }
      });
    }

    res.json({ order: updatedOrder });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: { message: 'Failed to cancel order' } });
  }
});

module.exports = router;
