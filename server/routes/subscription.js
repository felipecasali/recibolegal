const express = require('express');
const router = express.Router();
const { 
  SUBSCRIPTION_PLANS, 
  createCustomer, 
  createCheckoutSession, 
  createPortalSession,
  getSubscription,
  cancelSubscription,
  stripe,
  isStripeEnabled
} = require('../config/stripe');
const userService = require('../services/userService');

// Get all subscription plans
router.get('/plans', (req, res) => {
  res.json({
    success: true,
    plans: Object.values(SUBSCRIPTION_PLANS)
  });
});

// Get plans page URL with pre-filled phone
router.get('/plans-url/:phone', (req, res) => {
  const { phone } = req.params;
  const cleanPhone = phone.replace(/\D/g, ''); // Remove non-digits
  const formattedPhone = `+${cleanPhone}`;
  
  const baseUrl = process.env.PUBLIC_URL || 'https://recibolegal2025.loca.lt';
  const plansUrl = `${baseUrl}/plans?phone=${encodeURIComponent(formattedPhone)}`;
  
  res.json({
    success: true,
    url: plansUrl,
    phone: formattedPhone
  });
});

// Create checkout session for subscription
router.post('/create-checkout-session', async (req, res) => {
  try {
    if (!isStripeEnabled) {
      return res.status(503).json({
        error: 'Payment processing not available',
        message: 'Stripe not configured - running in demo mode'
      });
    }

    const { planId, userPhone, userEmail, userName } = req.body;

    if (!planId || !userPhone) {
      return res.status(400).json({
        error: 'Plan ID and user phone are required'
      });
    }

    const plan = SUBSCRIPTION_PLANS[planId.toUpperCase()];
    if (!plan || plan.id === 'free') {
      return res.status(400).json({
        error: 'Invalid plan selected'
      });
    }

    // Clean phone number
    const cleanPhone = userService.cleanPhoneNumber(userPhone);

    // Get or create user
    let user = await userService.getUserByPhone(cleanPhone);
    if (!user) {
      user = await userService.createUser({
        phone: cleanPhone,
        email: userEmail,
        name: userName
      });
    }

    // Create or get Stripe customer
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await createCustomer(
        userEmail || `${cleanPhone}@recibolegal.com.br`,
        userName || 'Usuário ReciboLegal',
        cleanPhone
      );
      stripeCustomerId = customer.id;

      // Update user with Stripe customer ID
      await userService.updateUserSubscription(cleanPhone, {
        stripeCustomerId: stripeCustomerId,
        email: userEmail,
        name: userName
      });
    }

    // Create checkout session
    const baseUrl = process.env.PUBLIC_URL || 'https://recibolegal2025.loca.lt';
    const session = await createCheckoutSession(
      stripeCustomerId,
      plan.stripePriceId,
      `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      `${baseUrl}/subscription/cancel`
    );

    res.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({
      error: 'Failed to create checkout session',
      details: error.message
    });
  }
});

// Create customer portal session
router.post('/create-portal-session', async (req, res) => {
  try {
    if (!isStripeEnabled) {
      return res.status(503).json({
        error: 'Portal not available',
        message: 'Stripe not configured - running in demo mode'
      });
    }

    const { userPhone } = req.body;

    if (!userPhone) {
      return res.status(400).json({
        error: 'User phone is required'
      });
    }

    const cleanPhone = userService.cleanPhoneNumber(userPhone);
    const user = await userService.getUserByPhone(cleanPhone);

    if (!user || !user.stripeCustomerId) {
      return res.status(404).json({
        error: 'User not found or no subscription'
      });
    }

    const baseUrl = process.env.PUBLIC_URL || 'https://recibolegal2025.loca.lt';
    const session = await createPortalSession(
      user.stripeCustomerId,
      `${baseUrl}/dashboard`
    );

    res.json({
      success: true,
      portalUrl: session.url
    });
  } catch (error) {
    console.error('Error creating portal session:', error);
    res.status(500).json({
      error: 'Failed to create portal session',
      details: error.message
    });
  }
});

// Handle Stripe webhooks
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!isStripeEnabled) {
    return res.status(503).json({
      error: 'Webhook not available',
      message: 'Stripe not configured'
    });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Webhook handling failed' });
  }
});

// Handle checkout completion
async function handleCheckoutCompleted(session) {
  try {
    console.log('🎉 Checkout completed:', session.id);
    
    // Check if session has a subscription
    if (session.subscription) {
      // Get subscription details
      const subscription = await getSubscription(session.subscription);
      const customerId = session.customer;

      // Find user by Stripe customer ID
      // This is a simplified approach - in production, use proper indexing
      console.log('✅ Subscription activated for customer:', customerId);
      console.log('📋 Subscription details:', subscription.id, subscription.status);
    } else {
      console.log('⚠️ No subscription found in session (might be a one-time payment)');
      console.log('🛒 Payment completed for customer:', session.customer);
    }
  } catch (error) {
    console.error('Error handling checkout completion:', error);
  }
}

// Handle subscription updates
async function handleSubscriptionUpdated(subscription) {
  try {
    console.log('📝 Subscription updated:', subscription.id);
    
    const customerId = subscription.customer;
    const status = subscription.status;
    const priceId = subscription.items.data[0]?.price?.id;

    // Find the plan by price ID
    const plan = Object.values(SUBSCRIPTION_PLANS).find(p => p.stripePriceId === priceId);
    
    if (plan) {
      console.log(`🔄 User subscription updated to: ${plan.name} (${status})`);
      
      // Update user in database
      // Note: You'll need to implement a way to find user by Stripe customer ID
      // For now, this logs the event
    }
  } catch (error) {
    console.error('Error handling subscription update:', error);
  }
}

// Handle subscription deletion
async function handleSubscriptionDeleted(subscription) {
  try {
    console.log('❌ Subscription cancelled:', subscription.id);
    
    // Downgrade user to free plan
    // Implementation depends on your user lookup strategy
  } catch (error) {
    console.error('Error handling subscription deletion:', error);
  }
}

// Handle successful payment
async function handlePaymentSucceeded(invoice) {
  try {
    console.log('💰 Payment succeeded:', invoice.id);
    
    // Log successful payment
    // Send confirmation email/WhatsApp if needed
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

// Handle failed payment
async function handlePaymentFailed(invoice) {
  try {
    console.log('💳 Payment failed:', invoice.id);
    
    // Notify user about payment failure
    // Implement retry logic if needed
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

// Get user subscription status
router.get('/status/:userPhone', async (req, res) => {
  try {
    const { userPhone } = req.params;
    const cleanPhone = userService.cleanPhoneNumber(userPhone);
    
    const user = await userService.getUserByPhone(cleanPhone);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const stats = await userService.getUserStats(cleanPhone);
    
    res.json({
      success: true,
      user: {
        phone: user.phone,
        email: user.email,
        name: user.name,
        plan: user.plan,
        subscriptionStatus: user.subscriptionStatus,
        hasActiveSubscription: user.stripeSubscriptionId && user.subscriptionStatus === 'active'
      },
      stats
    });
  } catch (error) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({
      error: 'Failed to get subscription status',
      details: error.message
    });
  }
});

module.exports = router;
