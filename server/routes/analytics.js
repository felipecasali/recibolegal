const express = require('express');
const analyticsService = require('../services/analyticsService');
const userService = require('../services/userService');
const router = express.Router();

// Middleware para validar telefone
function validatePhone(req, res, next) {
  const phone = req.params.phone || req.body.phone;
  
  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }
  
  // Normalizar telefone
  const normalizedPhone = userService.cleanPhoneNumber(phone);
  req.normalizedPhone = normalizedPhone;
  
  next();
}

// GET /api/analytics/dashboard/:phone - Dashboard do usuário
router.get('/dashboard/:phone', validatePhone, async (req, res) => {
  try {
    const dashboard = await analyticsService.getUserDashboard(req.normalizedPhone);
    
    res.json({
      success: true,
      data: dashboard,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ 
      error: 'Failed to get dashboard data',
      details: error.message 
    });
  }
});

// GET /api/analytics/report/:phone - Relatório financeiro
router.get('/report/:phone', validatePhone, async (req, res) => {
  try {
    const { start, end, format = 'json' } = req.query;
    
    // Validar datas se fornecidas
    let startDate = null;
    let endDate = null;
    
    if (start) {
      startDate = new Date(start);
      if (isNaN(startDate.getTime())) {
        return res.status(400).json({ error: 'Invalid start date format. Use YYYY-MM-DD' });
      }
    }
    
    if (end) {
      endDate = new Date(end);
      if (isNaN(endDate.getTime())) {
        return res.status(400).json({ error: 'Invalid end date format. Use YYYY-MM-DD' });
      }
    }
    
    const report = await analyticsService.getFinancialReport(
      req.normalizedPhone, 
      startDate?.toISOString().split('T')[0], 
      endDate?.toISOString().split('T')[0]
    );
    
    if (format === 'csv') {
      // Retornar CSV
      let csv = 'Recibo,Cliente,Serviço,Valor,Data\\n';
      report.receipts.forEach(receipt => {
        csv += `${receipt.receiptNumber || receipt.id},${receipt.clientName},${receipt.serviceName},${receipt.amount},${receipt.serviceDate || receipt.createdAt}\\n`;
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="relatorio_${req.normalizedPhone.replace('+', '')}_${Date.now()}.csv"`);
      return res.send(csv);
    }
    
    res.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ 
      error: 'Failed to generate report',
      details: error.message 
    });
  }
});

// GET /api/analytics/receipts/:phone - Lista de recibos com filtros
router.get('/receipts/:phone', validatePhone, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      status, 
      startDate, 
      endDate,
      search
    } = req.query;
    
    const filters = {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100), // Máximo 100 por página
      category,
      status,
      startDate,
      endDate,
      search
    };
    
    const result = await analyticsService.getReceiptsFiltered(req.normalizedPhone, filters);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Receipts filter error:', error);
    res.status(500).json({ 
      error: 'Failed to get filtered receipts',
      details: error.message 
    });
  }
});

// GET /api/analytics/stats/:phone - Estatísticas básicas
router.get('/stats/:phone', validatePhone, async (req, res) => {
  try {
    const stats = await userService.getUserStats(req.normalizedPhone);
    
    if (!stats) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Adicionar informações extras
    const recentReceipts = await userService.getUserReceipts(req.normalizedPhone, 5);
    
    const enhancedStats = {
      ...stats,
      recentReceipts: recentReceipts.length,
      lastReceiptDate: recentReceipts.length > 0 ? recentReceipts[0].createdAt : null,
      avgReceiptValue: recentReceipts.length > 0 
        ? recentReceipts.reduce((sum, r) => sum + (r.amount || 0), 0) / recentReceipts.length 
        : 0
    };
    
    res.json({
      success: true,
      data: enhancedStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ 
      error: 'Failed to get user stats',
      details: error.message 
    });
  }
});

// GET /api/analytics/categories - Lista de categorias disponíveis
router.get('/categories', (req, res) => {
  const categories = [
    { id: 'consultoria', name: 'Consultoria', icon: '💼' },
    { id: 'desenvolvimento', name: 'Desenvolvimento', icon: '💻' },
    { id: 'design', name: 'Design', icon: '🎨' },
    { id: 'marketing', name: 'Marketing', icon: '📢' },
    { id: 'educacao', name: 'Educação', icon: '📚' },
    { id: 'juridico', name: 'Jurídico', icon: '⚖️' },
    { id: 'contabilidade', name: 'Contabilidade', icon: '📊' },
    { id: 'saude', name: 'Saúde', icon: '🏥' },
    { id: 'beleza', name: 'Beleza', icon: '💅' },
    { id: 'construcao', name: 'Construção', icon: '🏗️' },
    { id: 'transporte', name: 'Transporte', icon: '🚛' },
    { id: 'manutencao', name: 'Manutenção', icon: '🔧' },
    { id: 'outros', name: 'Outros', icon: '📝' }
  ];
  
  res.json({
    success: true,
    data: categories,
    timestamp: new Date().toISOString()
  });
});

// POST /api/analytics/receipt - Salvar recibo com analytics (usado internamente)
router.post('/receipt', async (req, res) => {
  try {
    const { phone, ...receiptData } = req.body;
    
    if (!phone || !receiptData.clientName || !receiptData.serviceName || !receiptData.amount) {
      return res.status(400).json({ 
        error: 'Missing required fields: phone, clientName, serviceName, amount' 
      });
    }
    
    const normalizedPhone = userService.cleanPhoneNumber(phone);
    const receiptId = await analyticsService.saveReceiptAdvanced(normalizedPhone, receiptData);
    
    res.json({
      success: true,
      data: {
        receiptId,
        message: 'Receipt saved with analytics'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Save receipt error:', error);
    res.status(500).json({ 
      error: 'Failed to save receipt',
      details: error.message 
    });
  }
});

// GET /api/analytics/summary/:phone - Resumo executivo
router.get('/summary/:phone', validatePhone, async (req, res) => {
  try {
    const { period = 'month' } = req.query; // month, quarter, year
    
    const dashboard = await analyticsService.getUserDashboard(req.normalizedPhone);
    const stats = await userService.getUserStats(req.normalizedPhone);
    
    // Calcular crescimento (mock por enquanto)
    const growth = {
      receipts: 0,
      amount: 0,
      clients: 0
    };
    
    const summary = {
      period,
      metrics: {
        totalReceipts: dashboard.summary.totalReceipts,
        totalAmount: dashboard.summary.totalAmount,
        avgReceiptValue: dashboard.summary.avgReceiptValue,
        currentPlan: stats?.planName || 'FREE',
        receiptsThisMonth: dashboard.summary.thisMonthReceipts,
        amountThisMonth: dashboard.summary.thisMonthAmount
      },
      growth,
      topCategories: dashboard.charts.topServices.slice(0, 3),
      recentActivity: dashboard.recentActivity.slice(0, 3),
      insights: [
        `Você gerou ${dashboard.summary.thisMonthReceipts} recibos este mês`,
        `Seu ticket médio é R$ ${dashboard.summary.avgReceiptValue.toFixed(2)}`,
        dashboard.charts.topServices.length > 0 
          ? `Seu serviço mais popular é "${dashboard.charts.topServices[0].name}"` 
          : 'Comece criando mais recibos para ver insights'
      ]
    };
    
    res.json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Summary error:', error);
    res.status(500).json({ 
      error: 'Failed to get summary',
      details: error.message 
    });
  }
});

// GET /api/analytics/export/:phone - Exportar dados
router.get('/export/:phone', validatePhone, async (req, res) => {
  try {
    const { format = 'json', type = 'receipts' } = req.query;
    
    let data;
    let filename;
    
    switch (type) {
      case 'receipts':
        const report = await analyticsService.getFinancialReport(req.normalizedPhone);
        data = report.receipts;
        filename = `recibos_${req.normalizedPhone.replace('+', '')}_${Date.now()}`;
        break;
        
      case 'dashboard':
        data = await analyticsService.getUserDashboard(req.normalizedPhone);
        filename = `dashboard_${req.normalizedPhone.replace('+', '')}_${Date.now()}`;
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid export type. Use: receipts, dashboard' });
    }
    
    if (format === 'csv' && type === 'receipts') {
      let csv = 'Número,Cliente,Documento,Serviço,Categoria,Valor,Data,Status\\n';
      data.forEach(receipt => {
        csv += `"${receipt.receiptNumber || receipt.id}","${receipt.clientName}","${receipt.clientDocument}","${receipt.serviceName}","${receipt.serviceCategory || 'outros'}",${receipt.amount},"${receipt.serviceDate || receipt.createdAt}","${receipt.status || 'active'}"\\n`;
      });
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      return res.send('\\uFEFF' + csv); // BOM para UTF-8
    }
    
    // Default: JSON
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
    res.json({
      exportDate: new Date().toISOString(),
      userPhone: req.normalizedPhone,
      type,
      data
    });
    
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ 
      error: 'Failed to export data',
      details: error.message 
    });
  }
});

module.exports = router;
