// Initialize Stripe only if secret key is provided
let stripe = null;
let isStripeEnabled = false;

if (process.env.STRIPE_SECRET_KEY) {
  try {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    isStripeEnabled = true;
    console.log('💳 Stripe initialized successfully');
  } catch (error) {
    console.error('❌ Stripe initialization failed:', error.message);
    console.log('💡 Running without Stripe integration');
  }
} else {
  console.log('⚠️ Stripe credentials not configured - running in local mode');
  console.log('💡 Configure STRIPE_SECRET_KEY to enable payment processing');
}

// Subscription plans configuration
const SUBSCRIPTION_PLANS = {
  FREE: {
    id: 'free',
    name: 'Plano Gratuito',
    price: 0,
    receiptsPerMonth: 5,
    features: [
      '5 recibos por mês',
      'Geração via WhatsApp',
      'PDF com assinatura digital',
      'Suporte básico'
    ]
  },
  BASIC: {
    id: 'basic',
    name: 'Plano Básico',
    price: 1990, // R$ 19.90 in cents
    stripePriceId: process.env.STRIPE_BASIC_PRICE_ID,
    receiptsPerMonth: 50,
    features: [
      '50 recibos por mês',
      'Geração via WhatsApp',
      'PDF com assinatura digital',
      'Dashboard web',
      'Histórico completo',
      'Suporte prioritário'
    ]
  },
  PRO: {
    id: 'pro',
    name: 'Plano Profissional',
    price: 3990, // R$ 39.90 in cents
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
    receiptsPerMonth: 200,
    features: [
      '200 recibos por mês',
      'Geração via WhatsApp',
      'PDF com assinatura digital',
      'Dashboard web avançado',
      'Histórico completo',
      'Contratos simples',
      'API access',
      'Suporte premium'
    ]
  },
  UNLIMITED: {
    id: 'unlimited',
    name: 'Plano Ilimitado',
    price: 7990, // R$ 79.90 in cents
    stripePriceId: process.env.STRIPE_UNLIMITED_PRICE_ID,
    receiptsPerMonth: -1, // Unlimited
    features: [
      'Recibos ilimitados',
      'Geração via WhatsApp',
      'PDF com assinatura digital',
      'Dashboard web avançado',
      'Histórico completo',
      'Contratos avançados',
      'API access',
      'Webhook customizado',
      'Suporte premium 24/7'
    ]
  }
};

// Create a customer in Stripe
async function createCustomer(email, name, phone) {
  if (!isStripeEnabled) {
    throw new Error('Stripe not configured - payments disabled');
  }
  
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      phone,
      metadata: {
        source: 'recibolegal'
      }
    });
    return customer;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw error;
  }
}

// Create a subscription
async function createSubscription(customerId, priceId) {
  if (!isStripeEnabled) {
    throw new Error('Stripe not configured - payments disabled');
  }
  
  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });
    return subscription;
  } catch (error) {
    console.error('Error creating Stripe subscription:', error);
    throw error;
  }
}

// Create a checkout session for subscription
async function createCheckoutSession(customerId, priceId, successUrl, cancelUrl) {
  if (!isStripeEnabled) {
    throw new Error('Stripe not configured - payments disabled');
  }
  
  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      locale: 'pt-BR',
    });
    return session;
  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);
    throw error;
  }
}

// Get subscription details
async function getSubscription(subscriptionId) {
  if (!isStripeEnabled) {
    throw new Error('Stripe not configured - payments disabled');
  }
  
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error getting Stripe subscription:', error);
    throw error;
  }
}

// Cancel subscription
async function cancelSubscription(subscriptionId) {
  if (!isStripeEnabled) {
    throw new Error('Stripe not configured - payments disabled');
  }
  
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
    return subscription;
  } catch (error) {
    console.error('Error canceling Stripe subscription:', error);
    throw error;
  }
}

// Get customer portal session
async function createPortalSession(customerId, returnUrl) {
  if (!isStripeEnabled) {
    throw new Error('Stripe not configured - payments disabled');
  }
  
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return session;
  } catch (error) {
    console.error('Error creating Stripe portal session:', error);
    throw error;
  }
}

module.exports = {
  stripe,
  isStripeEnabled,
  SUBSCRIPTION_PLANS,
  createCustomer,
  createSubscription,
  createCheckoutSession,
  getSubscription,
  cancelSubscription,
  createPortalSession
};
