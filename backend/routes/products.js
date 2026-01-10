const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all products (public)
router.get('/', async (req, res) => {
  try {
    const { 
      categoryId, 
      search, 
      featured, 
      page = 1, 
      limit = 12,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      isActive: true,
      ...(categoryId && { categoryId }),
      ...(featured !== undefined && { featured: featured === 'true' }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true, slug: true }
          }
        },
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: order }
      }),
      prisma.product.count({ where })
    ]);

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: { message: 'Failed to fetch products' } });
  }
});

// Get single product by slug (public)
router.get('/:slug', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
      include: {
        category: {
          select: { id: true, name: true, slug: true }
        }
      }
    });

    if (!product || !product.isActive) {
      return res.status(404).json({ error: { message: 'Product not found' } });
    }

    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: { message: 'Failed to fetch product' } });
  }
});

// Create product (admin only)
router.post('/', authenticate, authorize('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { name, slug, description, price, imageUrl, stock, categoryId, featured } = req.body;

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        price,
        imageUrl,
        stock,
        categoryId,
        featured: featured || false
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true }
        }
      }
    });

    res.status(201).json({ product });
  } catch (error) {
    console.error('Create product error:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({ error: { message: 'Product slug already exists' } });
    }
    
    res.status(500).json({ error: { message: 'Failed to create product' } });
  }
});

// Update product (admin only)
router.put('/:id', authenticate, authorize('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { name, slug, description, price, imageUrl, stock, categoryId, featured, isActive } = req.body;

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        name,
        slug,
        description,
        price,
        imageUrl,
        stock,
        categoryId,
        featured,
        isActive
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true }
        }
      }
    });

    res.json({ product });
  } catch (error) {
    console.error('Update product error:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: { message: 'Product not found' } });
    }
    
    res.status(500).json({ error: { message: 'Failed to update product' } });
  }
});

// Delete product (admin only)
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    await prisma.product.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: { message: 'Product not found' } });
    }
    
    res.status(500).json({ error: { message: 'Failed to delete product' } });
  }
});

module.exports = router;
