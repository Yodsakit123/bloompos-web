const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Create payment intent
router.post('/create-intent', authenticate, async (req, res) => {
  try {
    const { orderId } = req.body;

    // Get order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        address: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: { message: 'Order not found' } });
    }

    // Verify order belongs to user
    if (order.userId !== req.user.id) {
      return res.status(403).json({ error: { message: 'Access denied' } });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(parseFloat(order.total) * 100), // Convert to cents
      currency: 'usd',
      customer: order.user.email,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber
      },
      description: `Flower Shop Order ${order.orderNumber}`
    });

    // Update order with payment intent ID
    await prisma.order.update({
      where: { id: orderId },
      data: { paymentIntentId: paymentIntent.id }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ error: { message: 'Failed to create payment intent' } });
  }
});

// Webhook handler for Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      
      // Update order payment status
      await prisma.order.updateMany({
        where: { paymentIntentId: paymentIntent.id },
        data: { 
          paymentStatus: 'COMPLETED',
          status: 'CONFIRMED'
        }
      });
      
      console.log(`Payment succeeded for ${paymentIntent.id}`);
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      
      await prisma.order.updateMany({
        where: { paymentIntentId: failedPayment.id },
        data: { paymentStatus: 'FAILED' }
      });
      
      console.log(`Payment failed for ${failedPayment.id}`);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// Get payment status
router.get('/status/:orderId', authenticate, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.orderId },
      select: {
        id: true,
        orderNumber: true,
        paymentStatus: true,
        paymentIntentId: true,
        total: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: { message: 'Order not found' } });
    }

    // Verify order belongs to user
    if (order.userId !== req.user.id) {
      return res.status(403).json({ error: { message: 'Access denied' } });
    }

    res.json({ order });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({ error: { message: 'Failed to get payment status' } });
  }
});

module.exports = router;
