const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all categories (public)
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: { message: 'Failed to fetch categories' } });
  }
});

// Get single category by slug (public)
router.get('/:slug', async (req, res) => {
  try {
    const category = await prisma.category.findUnique({
      where: { slug: req.params.slug },
      include: {
        products: {
          where: { isActive: true },
          take: 20
        }
      }
    });

    if (!category) {
      return res.status(404).json({ error: { message: 'Category not found' } });
    }

    res.json({ category });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: { message: 'Failed to fetch category' } });
  }
});

// Create category (admin only)
router.post('/', authenticate, authorize('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { name, slug, description, imageUrl } = req.body;

    const category = await prisma.category.create({
      data: { name, slug, description, imageUrl }
    });

    res.status(201).json({ category });
  } catch (error) {
    console.error('Create category error:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({ error: { message: 'Category slug already exists' } });
    }
    
    res.status(500).json({ error: { message: 'Failed to create category' } });
  }
});

// Update category (admin only)
router.put('/:id', authenticate, authorize('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { name, slug, description, imageUrl } = req.body;

    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: { name, slug, description, imageUrl }
    });

    res.json({ category });
  } catch (error) {
    console.error('Update category error:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: { message: 'Category not found' } });
    }
    
    res.status(500).json({ error: { message: 'Failed to update category' } });
  }
});

// Delete category (admin only)
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    await prisma.category.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: { message: 'Category not found' } });
    }
    
    res.status(500).json({ error: { message: 'Failed to delete category' } });
  }
});

module.exports = router;
