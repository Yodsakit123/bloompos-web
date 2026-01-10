const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true
      }
    });

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: { message: 'Failed to fetch profile' } });
  }
});

// Update user profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { firstName, lastName, phone },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true
      }
    });

    res.json({ user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: { message: 'Failed to update profile' } });
  }
});

// Get user addresses
router.get('/addresses', authenticate, async (req, res) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.id },
      orderBy: { isDefault: 'desc' }
    });

    res.json({ addresses });
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({ error: { message: 'Failed to fetch addresses' } });
  }
});

// Add address
router.post('/addresses', authenticate, async (req, res) => {
  try {
    const { street, city, state, zipCode, country, isDefault } = req.body;

    // If this is default, unset other defaults
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.id, isDefault: true },
        data: { isDefault: false }
      });
    }

    const address = await prisma.address.create({
      data: {
        userId: req.user.id,
        street,
        city,
        state,
        zipCode,
        country: country || 'US',
        isDefault: isDefault || false
      }
    });

    res.status(201).json({ address });
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({ error: { message: 'Failed to add address' } });
  }
});

// Update address
router.put('/addresses/:id', authenticate, async (req, res) => {
  try {
    const { street, city, state, zipCode, country, isDefault } = req.body;

    // Verify address belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!existingAddress) {
      return res.status(404).json({ error: { message: 'Address not found' } });
    }

    // If this is default, unset other defaults
    if (isDefault) {
      await prisma.address.updateMany({
        where: { 
          userId: req.user.id, 
          isDefault: true,
          id: { not: req.params.id }
        },
        data: { isDefault: false }
      });
    }

    const address = await prisma.address.update({
      where: { id: req.params.id },
      data: { street, city, state, zipCode, country, isDefault }
    });

    res.json({ address });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({ error: { message: 'Failed to update address' } });
  }
});

// Delete address
router.delete('/addresses/:id', authenticate, async (req, res) => {
  try {
    // Verify address belongs to user
    const address = await prisma.address.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!address) {
      return res.status(404).json({ error: { message: 'Address not found' } });
    }

    await prisma.address.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ error: { message: 'Failed to delete address' } });
  }
});

// Get all users (admin only)
router.get('/', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          createdAt: true
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count()
    ]);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: { message: 'Failed to fetch users' } });
  }
});

module.exports = router;
