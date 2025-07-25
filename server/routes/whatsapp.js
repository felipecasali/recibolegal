const express = require('express');
const twilio = require('twilio');
const userService = require('../services/userService');
const analyticsService = require('../services/analyticsService');
const router = express.Router();

// Initialize Twilio client function
function getTwilioClient() {
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

// WhatsApp number from Twilio
const WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

// User session storage (in production, use Redis or database)
const userSessions = new Map();

// Bot conversation flow states
const CONVERSATION_STATES = {
  START: 'start',
  COLLECTING_CLIENT_NAME: 'collecting_client_name',
  COLLECTING_CLIENT_DOCUMENT: 'collecting_client_document',
  COLLECTING_SERVICE_NAME: 'collecting_service_name',
  COLLECTING_SERVICE_DESCRIPTION: 'collecting_service_description',
  COLLECTING_AMOUNT: 'collecting_amount',
  COLLECTING_DATE: 'collecting_date',
  CONFIRMING: 'confirming',
  COMPLETED: 'completed'
};

// Bot messages
const BOT_MESSAGES = {
  welcome: `🎉 Olá! Bem-vindo ao *ReciboLegal*! 

Vou te ajudar a criar um recibo válido juridicamente em alguns passos simples.

Para começar, me diga o *nome completo do seu cliente*:`,
  
  clientDocument: `Perfeito! Agora preciso do *CPF ou CNPJ* do cliente:

💡 Exemplo: 123.456.789-00 ou 12.345.678/0001-90`,

  serviceName: `Ótimo! Agora me conte qual foi o *nome do serviço* prestado:

💡 Exemplo: "Consultoria em Marketing Digital" ou "Desenvolvimento de Website"`,

  serviceDescription: `Excelente! Agora você pode me dar uma *descrição mais detalhada* do serviço (opcional):

💡 Você pode enviar "pular" se não quiser adicionar descrição, ou descrever o que foi feito.`,

  amount: `Perfeito! Agora me diga o *valor* do serviço:

💡 Exemplo: 1500 ou 1500.50`,

  date: `Quase terminando! Qual a *data* do serviço?

💡 Formato: DD/MM/AAAA (exemplo: 23/07/2025)
💡 Ou envie "hoje" para usar a data atual`,

  confirmation: (data) => `🔍 *Conferindo os dados do seu recibo:*

👤 *Cliente:* ${data.clientName}
📄 *CPF/CNPJ:* ${data.clientDocument}
🔧 *Serviço:* ${data.serviceName}
📝 *Descrição:* ${data.serviceDescription || 'Não informado'}
💰 *Valor:* R$ ${data.amount}
📅 *Data:* ${data.date}

Está tudo correto? Responda:
✅ *SIM* - para gerar o recibo
❌ *NÃO* - para recomeçar`,

  success: `🎉 *Recibo criado com sucesso!*

Seu documento foi gerado e assinado digitalmente. 

📄 Você receberá o link para download em instantes...

💚 Obrigado por usar o ReciboLegal!`,

  error: `😔 Ops! Algo deu errado. 

Digite *RECOMEÇAR* para tentar novamente.`,

  restart: `🔄 Vamos recomeçar! 

Me diga o *nome completo do seu cliente*:`
};

// Webhook endpoint for WhatsApp messages
router.post('/webhook', async (req, res) => {
  try {
    const { Body, From, To } = req.body;
    const userPhone = From;
    const message = Body?.trim().toLowerCase();

    console.log(`📱 Message from ${userPhone}: ${Body}`);

    // Ensure user exists in database (create if first time)
    const normalizedPhone = userService.cleanPhoneNumber(userPhone);
    let user = await userService.getUserByPhone(normalizedPhone);
    
    if (!user) {
      console.log(`👤 Creating new user for ${normalizedPhone}`);
      user = await userService.createUser({
        phone: normalizedPhone,
        name: 'Usuário WhatsApp',
        email: `${normalizedPhone.replace('+', '')}@whatsapp.temp`,
        plan: 'FREE'
      });
      console.log(`✅ User created successfully: ${user.phone}`);
    }

    // Get or create user session
    let session = userSessions.get(userPhone) || {
      state: CONVERSATION_STATES.START,
      data: {}
    };

    let responseMessage = '';

    // Handle conversation flow
    switch (session.state) {
      case CONVERSATION_STATES.START:
        if (message.includes('oi') || message.includes('olá') || message.includes('começar')) {
          responseMessage = BOT_MESSAGES.welcome;
          session.state = CONVERSATION_STATES.COLLECTING_CLIENT_NAME;
        } else if (message.includes('status') || message.includes('plano') || message.includes('assinatura')) {
          // Check user status
          try {
            const normalizedPhone = userService.cleanPhoneNumber(userPhone);
            const stats = await userService.getUserStats(normalizedPhone);
            
            if (!stats) {
              responseMessage = `📊 *Status da conta:* Plano Gratuito (5 recibos/mês)

❌ Não foi possível carregar informações detalhadas.

Digite *OI* para criar um recibo.`;
            } else {
              responseMessage = `📊 *Status da sua conta:*

📋 *Plano atual:* ${stats.planName}
📄 *Recibos este mês:* ${stats.currentMonthUsage}/${stats.monthlyLimit === -1 ? '∞' : stats.monthlyLimit}
💳 *Status:* ${stats.subscriptionStatus || 'Ativo'}

${stats.currentMonthUsage >= stats.monthlyLimit && stats.monthlyLimit !== -1 ? 
  `⚠️ *Limite atingido!* Faça upgrade: ${process.env.PUBLIC_URL || 'https://recibolegal.com.br'}/plans` : 
  '✅ Você pode gerar mais recibos!'}

Digite *OI* para criar um recibo.`;
            }
          } catch (error) {
            responseMessage = `📊 *Status da conta:* Plano Gratuito (5 recibos/mês)

Digite *OI* para criar um recibo ou *UPGRADE* para ver planos.`;
          }
        } else if (message.includes('upgrade') || message.includes('planos')) {
          responseMessage = `🚀 *Planos ReciboLegal:*

🆓 *Gratuito:* 5 recibos/mês
💰 *Básico (R$ 19,90):* 50 recibos/mês  
🚀 *Pro (R$ 39,90):* 200 recibos/mês
⭐ *Ilimitado (R$ 79,90):* Recibos ilimitados

👆 *Assine agora:*
${process.env.PUBLIC_URL || 'https://recibolegal2025.loca.lt'}/plans

Digite *OI* para criar um recibo.`;
        } else if (message.includes('dashboard') || message.includes('painel') || message.includes('resumo')) {
          // Dashboard do usuário
          try {
            const dashboard = await analyticsService.getUserDashboard(normalizedPhone);
            
            responseMessage = `📊 *Seu Dashboard ReciboLegal:*

📈 *Resumo Geral:*
• Total de recibos: ${dashboard.summary.totalReceipts}
• Valor total: R$ ${dashboard.summary.totalAmount.toFixed(2)}
• Ticket médio: R$ ${dashboard.summary.avgReceiptValue.toFixed(2)}

📅 *Este mês:*
• Recibos: ${dashboard.summary.thisMonthReceipts}
• Faturado: R$ ${dashboard.summary.thisMonthAmount.toFixed(2)}

${dashboard.charts.topServices.length > 0 ? `🏆 *Top serviços:*
${dashboard.charts.topServices.slice(0, 3).map((s, i) => 
  `${i+1}. ${s.name} (${s.count} recibos)`
).join('\n')}` : ''}

🔗 *Dashboard completo:*
${process.env.PUBLIC_URL || 'https://recibolegal.com.br'}/dashboard

Digite *HISTÓRICO* para ver seus recibos ou *OI* para criar novo.`;
          } catch (error) {
            responseMessage = `📊 *Dashboard indisponível no momento.*

Digite *OI* para criar um recibo.`;
          }
        } else if (message.includes('histórico') || message.includes('historico') || message.includes('recibos') || message.includes('lista')) {
          // Histórico de recibos
          try {
            const receipts = await userService.getUserReceipts(normalizedPhone, 5);
            
            if (receipts.length === 0) {
              responseMessage = `📄 *Você ainda não possui recibos.*

Digite *OI* para criar seu primeiro recibo!`;
            } else {
              responseMessage = `📄 *Seus últimos recibos:*

${receipts.map(receipt => 
  `• ${receipt.receiptNumber || 'N/A'} - ${receipt.clientName} - R$ ${(receipt.amount || 0).toFixed(2)}`
).join('\n')}

📊 *Total: ${receipts.length} recibos listados*

🔗 *Ver histórico completo:*
${process.env.PUBLIC_URL || 'https://recibolegal.com.br'}/receipts

Digite *DASHBOARD* para ver estatísticas ou *OI* para criar novo recibo.`;
            }
          } catch (error) {
            responseMessage = `📄 *Histórico indisponível no momento.*

Digite *OI* para criar um recibo.`;
          }
        } else if (message.includes('relatório') || message.includes('relatorio') || message.includes('financeiro')) {
          // Relatório financeiro
          try {
            const report = await analyticsService.getFinancialReport(normalizedPhone);
            
            responseMessage = `📋 *Relatório Financeiro:*

📊 *Resumo:*
• Total de recibos: ${report.summary.totalReceipts}
• Valor total: R$ ${report.summary.totalAmount.toFixed(2)}
• Ticket médio: R$ ${report.summary.avgReceiptValue.toFixed(2)}

${report.breakdown.byService.length > 0 ? `🔧 *Por serviço:*
${report.breakdown.byService.slice(0, 3).map(service => 
  `• ${service.name}: ${service.count} recibos (R$ ${service.amount.toFixed(2)})`
).join('\n')}` : ''}

🔗 *Relatório completo e exportação:*
${process.env.PUBLIC_URL || 'https://recibolegal.com.br'}/reports

Digite *DASHBOARD* para ver mais estatísticas.`;
          } catch (error) {
            responseMessage = `📋 *Relatório indisponível no momento.*

Digite *OI* para criar um recibo.`;
          }
        } else {
          responseMessage = `Olá! Digite *OI* para começar a criar seu recibo! 😊

💡 *Outros comandos:*
• *STATUS* - Ver informações da conta
• *DASHBOARD* - Ver estatísticas e resumo
• *HISTÓRICO* - Ver seus recibos anteriores
• *RELATÓRIO* - Relatório financeiro
• *UPGRADE* - Ver planos disponíveis`;
        }
        break;

      case CONVERSATION_STATES.COLLECTING_CLIENT_NAME:
        if (message === 'recomeçar') {
          session = { state: CONVERSATION_STATES.START, data: {} };
          responseMessage = BOT_MESSAGES.restart;
          session.state = CONVERSATION_STATES.COLLECTING_CLIENT_NAME;
        } else {
          session.data.clientName = Body.trim();
          session.state = CONVERSATION_STATES.COLLECTING_CLIENT_DOCUMENT;
          responseMessage = BOT_MESSAGES.clientDocument;
        }
        break;

      case CONVERSATION_STATES.COLLECTING_CLIENT_DOCUMENT:
        session.data.clientDocument = Body.trim();
        session.state = CONVERSATION_STATES.COLLECTING_SERVICE_NAME;
        responseMessage = BOT_MESSAGES.serviceName;
        break;

      case CONVERSATION_STATES.COLLECTING_SERVICE_NAME:
        session.data.serviceName = Body.trim();
        session.state = CONVERSATION_STATES.COLLECTING_SERVICE_DESCRIPTION;
        responseMessage = BOT_MESSAGES.serviceDescription;
        break;

      case CONVERSATION_STATES.COLLECTING_SERVICE_DESCRIPTION:
        if (message === 'pular') {
          session.data.serviceDescription = '';
        } else {
          session.data.serviceDescription = Body.trim();
        }
        session.state = CONVERSATION_STATES.COLLECTING_AMOUNT;
        responseMessage = BOT_MESSAGES.amount;
        break;

      case CONVERSATION_STATES.COLLECTING_AMOUNT:
        const amount = parseFloat(Body.replace(',', '.'));
        if (isNaN(amount) || amount <= 0) {
          responseMessage = `❌ Valor inválido. Por favor, digite um valor numérico válido (exemplo: 1500 ou 1500.50):`;
        } else {
          session.data.amount = amount.toFixed(2);
          session.state = CONVERSATION_STATES.COLLECTING_DATE;
          responseMessage = BOT_MESSAGES.date;
        }
        break;

      case CONVERSATION_STATES.COLLECTING_DATE:
        let date;
        if (message === 'hoje') {
          date = new Date().toLocaleDateString('pt-BR');
        } else {
          // Simple date validation
          const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
          if (dateRegex.test(Body.trim())) {
            date = Body.trim();
          } else {
            responseMessage = `❌ Data inválida. Use o formato DD/MM/AAAA (exemplo: 23/07/2025) ou digite "hoje":`;
            break;
          }
        }
        session.data.date = date;
        session.state = CONVERSATION_STATES.CONFIRMING;
        responseMessage = BOT_MESSAGES.confirmation(session.data);
        break;

      case CONVERSATION_STATES.CONFIRMING:
        if (message === 'sim' || message === 's') {
          // Check if user can generate receipt before proceeding
          try {
            const normalizedPhone = userService.cleanPhoneNumber(userPhone);
            const canGenerate = await userService.canGenerateReceipt(normalizedPhone);
            
            if (!canGenerate) {
              const stats = await userService.getUserStats(normalizedPhone);
              
              // Ensure stats object exists and has required properties
              if (!stats) {
                responseMessage = `❌ *Erro interno*
                
Não foi possível verificar seu plano. Tente novamente em alguns minutos.

Digite *OI* para tentar novamente.`;
              } else {
                responseMessage = `⚠️ *Limite atingido!*

Você já usou ${stats.currentMonthUsage}/${stats.monthlyLimit} recibos do plano ${stats.planName} este mês.

🚀 *Faça upgrade para continuar:*
${process.env.PUBLIC_URL || 'https://recibolegal.com.br'}/plans

Digite *OI* para criar um novo recibo quando fizer o upgrade.`;
              }
              
              // Reset session
              session = { state: CONVERSATION_STATES.START, data: {} };
              break;
            }
            
            // Generate receipt
            const axios = require('axios');
            const receiptResponse = await axios.post('http://localhost:3001/api/receipts/generate', {
              ...session.data,
              userPhone: normalizedPhone
            });

            if (receiptResponse.status === 200) {
              session.state = CONVERSATION_STATES.COMPLETED;
              responseMessage = BOT_MESSAGES.success;
              
              // Reset session after a delay
              setTimeout(() => {
                userSessions.delete(userPhone);
              }, 60000);
            } else {
              responseMessage = BOT_MESSAGES.error;
            }
          } catch (error) {
            console.error('Error generating receipt:', error);
            if (error.response?.status === 403) {
              // Limit exceeded
              responseMessage = `⚠️ *Limite de recibos atingido!*

Para continuar gerando recibos, faça upgrade do seu plano:
${process.env.PUBLIC_URL || 'https://recibolegal2025.loca.lt'}/plans

Digite *OI* quando fizer o upgrade para criar novos recibos.`;
              session = { state: CONVERSATION_STATES.START, data: {} };
            } else {
              responseMessage = BOT_MESSAGES.error;
            }
          }
        } else if (message === 'não' || message === 'nao' || message === 'n') {
          session = { state: CONVERSATION_STATES.START, data: {} };
          responseMessage = BOT_MESSAGES.restart;
          session.state = CONVERSATION_STATES.COLLECTING_CLIENT_NAME;
        } else {
          responseMessage = `Por favor, responda com *SIM* ou *NÃO*:`;
        }
        break;

      case CONVERSATION_STATES.COMPLETED:
        responseMessage = `Seu recibo já foi criado! Digite *OI* para criar um novo recibo.`;
        if (message.includes('oi') || message.includes('olá')) {
          session = { state: CONVERSATION_STATES.START, data: {} };
          responseMessage = BOT_MESSAGES.welcome;
          session.state = CONVERSATION_STATES.COLLECTING_CLIENT_NAME;
        }
        break;

      default:
        responseMessage = `Ops! Digite *OI* para começar.`;
        session = { state: CONVERSATION_STATES.START, data: {} };
    }

    // Save session
    userSessions.set(userPhone, session);

    // Send response via WhatsApp
    await sendWhatsAppMessage(userPhone, responseMessage);

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Function to send WhatsApp message
async function sendWhatsAppMessage(to, message) {
  try {
    // Remove extra spaces
    let formattedTo = to;
    formattedTo = formattedTo.replace(/\s+/g, '');
    
    // Normalize to whatsapp:+XXXXXXXXX format
    if (!formattedTo.startsWith('whatsapp:')) {
      // If it's just a phone number, add whatsapp: prefix
      if (formattedTo.startsWith('+')) {
        formattedTo = `whatsapp:${formattedTo}`;
      } else {
        formattedTo = `whatsapp:+${formattedTo}`;
      }
    } else {
      // Already has whatsapp: prefix, check if it has +
      const phoneNumber = formattedTo.replace('whatsapp:', '');
      if (!phoneNumber.startsWith('+')) {
        formattedTo = `whatsapp:+${phoneNumber}`;
      }
    }
    
    console.log(`📤 Attempting to send message to ${formattedTo}: "${message}"`);
    
    // Check if simulation mode is enabled
    if (process.env.SIMULATION_MODE === 'true') {
      console.log(`🧪 SIMULATION MODE: Message would be sent to ${formattedTo}`);
      console.log(`📱 Simulated message: "${message}"`);
      console.log(`✅ Simulation completed successfully`);
      return;
    }
    
    console.log(`🔑 Using credentials: SID=${process.env.TWILIO_ACCOUNT_SID?.substring(0, 10)}..., Token=${process.env.TWILIO_AUTH_TOKEN ? 'SET' : 'NOT SET'}`);
    
    const client = getTwilioClient();
    await client.messages.create({
      body: message,
      from: WHATSAPP_NUMBER,
      to: formattedTo
    });
    console.log(`✅ Message sent successfully to ${formattedTo}`);
  } catch (error) {
    console.error('❌ Error sending WhatsApp message:', error.message);
    console.error('Full error:', error);
    throw error;
  }
}

// Endpoint to send WhatsApp message (for testing)
router.post('/send', async (req, res) => {
  try {
    const { to, message } = req.body;
    
    console.log(`📨 Received send request - To: ${to}, Message: "${message}"`);
    
    if (!to || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields: to and message are required' 
      });
    }

    // Validate WhatsApp number format
    if (!to.startsWith('whatsapp:+')) {
      return res.status(400).json({ 
        error: 'Invalid WhatsApp number format. Use: whatsapp:+5511999999999' 
      });
    }

    await sendWhatsAppMessage(to, message);
    res.json({ 
      success: true, 
      message: 'Message sent successfully',
      to: to,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Send endpoint error:', error);
    res.status(500).json({ 
      error: 'Failed to send message',
      details: error.message 
    });
  }
});

// Get user sessions (for debugging)
router.get('/sessions', (req, res) => {
  const sessions = Array.from(userSessions.entries()).map(([phone, session]) => ({
    phone,
    state: session.state,
    data: session.data
  }));
  res.json(sessions);
});

// Test Twilio credentials endpoint
router.post('/test-credentials', async (req, res) => {
  try {
    const { accountSid, authToken, to, message } = req.body;
    
    if (!accountSid || !authToken) {
      return res.status(400).json({ error: 'Account SID and Auth Token are required' });
    }

    // Create a test Twilio client with provided credentials
    const testClient = twilio(accountSid, authToken);
    
    try {
      // Test by validating the account (this doesn't send a message)
      const account = await testClient.api.accounts(accountSid).fetch();
      
      res.json({ 
        success: true, 
        message: 'Credentials are valid',
        accountName: account.friendlyName,
        status: account.status
      });
    } catch (twilioError) {
      console.error('Twilio validation error:', twilioError);
      res.status(400).json({ 
        error: 'Invalid Twilio credentials',
        details: twilioError.message 
      });
    }
  } catch (error) {
    console.error('Credential test error:', error);
    res.status(500).json({ error: 'Failed to test credentials' });
  }
});

// Check sandbox status endpoint
router.get('/sandbox-status', async (req, res) => {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      return res.status(400).json({ 
        error: 'Twilio credentials not configured in environment' 
      });
    }

    // Check if we can access the account
    const account = await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
    
    res.json({
      success: true,
      accountName: account.friendlyName,
      status: account.status,
      whatsappNumber: WHATSAPP_NUMBER,
      message: 'Sandbox is configured. Make sure you\'ve joined the sandbox by sending the join code to ' + WHATSAPP_NUMBER
    });
  } catch (error) {
    console.error('Sandbox status error:', error);
    res.status(500).json({ 
      error: 'Failed to check sandbox status',
      details: error.message 
    });
  }
});

module.exports = router;
module.exports.sendWhatsAppMessage = sendWhatsAppMessage;
