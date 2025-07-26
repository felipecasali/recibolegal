// Load environment variables FIRST
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const whatsappRoutes = require('./routes/whatsapp');
const receiptRoutes = require('./routes/receipts');
const subscriptionRoutes = require('./routes/subscription');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());

// Debug logging
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  next();
});

// For other routes, use JSON parsing (except webhook)
app.use((req, res, next) => {
  if (req.path === '/api/subscription/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

app.use(express.urlencoded({ extended: true }));

// For Stripe webhooks, we need raw body
app.use('/api/subscription/webhook', express.raw({ type: 'application/json' }));

// Routes
console.log('🔧 Registering routes...');
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/analytics', analyticsRoutes);
console.log('✅ Routes registered successfully');

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'ReciboLegal API is running' });
});

// Serve static files from the React build (Vite generates in 'dist')
app.use(express.static(path.join(__dirname, 'dist')));

// Dashboard específico (ainda usa public)
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/reports', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html')); // Por enquanto usar o mesmo
});

app.get('/receipts', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html')); // Por enquanto usar o mesmo
});

// Catch-all for other frontend routes (excluding API)
app.use((req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // Serve React app for any other route
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 ReciboLegal API server running on port ${PORT}`);
  console.log(`📱 WhatsApp webhook: http://localhost:${PORT}/api/whatsapp/webhook`);
  console.log(`📄 Receipt API: http://localhost:${PORT}/api/receipts`);
});

module.exports = app;
