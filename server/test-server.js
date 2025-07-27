// Teste isolado para verificar se analytics routes funcionam
const express = require('express');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const PORT = 3002; // Porta diferente

// Middlewares básicos
app.use(express.json());

// Debug middleware
app.use((req, res, next) => {
  console.log(`🔍 TEST SERVER: ${req.method} ${req.path}`);
  next();
});

// Registrar apenas analytics routes
console.log('🧪 Registering analytics routes in test server...');
app.use('/api/analytics', analyticsRoutes);

// Endpoint de teste direto
app.get('/test', (req, res) => {
  res.json({ message: 'Test server working', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🧪 Test server running on port ${PORT}`);
  console.log(`Test analytics at: http://localhost:${PORT}/api/analytics/test`);
});
