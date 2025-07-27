const express = require('express');
const axios = require('axios');
const userService = require('../services/userService');
const analyticsService = require('../services/analyticsService');
const router = express.Router();

// Meta WhatsApp Business API Configuration
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || 'v18.0';

// WhatsApp Business API Base URL
const WHATSAPP_API_URL = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}`;

// User session storage (in production, use Redis or database)
const userSessions = new Map();

// Function to send WhatsApp message with interactive buttons (Meta API)
async function sendWhatsAppMessageWithButtons(to, text, buttons) {
  try {
    const cleanTo = to.replace('whatsapp:', '').replace('+', '');
    
    const messageData = {
      messaging_product: "whatsapp",
      to: cleanTo,
      type: "interactive",
      interactive: {
        type: "button",
        body: {
          text: text
        },
        action: {
          buttons: buttons.map((button, index) => ({
            type: "reply",
            reply: {
              id: button.reply?.id || button.id || `btn_${index}`,
              title: button.reply?.title || button.title || `Option ${index + 1}`
            }
          }))
        }
      }
    };

    console.log('📤 Sending interactive message via Meta WhatsApp API to:', cleanTo);
    
    const response = await axios.post(`${WHATSAPP_API_URL}/messages`, messageData, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('✅ Interactive message sent successfully:', response.data.messages?.[0]?.id);
    return response.data;
  } catch (error) {
    console.error('❌ Error sending interactive message:', error.response?.data || error.message);
    
    // Fallback to text message if interactive fails
    return await sendWhatsAppMessage(to, text);
  }
}

// Function to send WhatsApp list message (Meta API)
async function sendWhatsAppListMessage(to, text, buttonText, sections) {
  try {
    const cleanTo = to.replace('whatsapp:', '').replace('+', '');
    
    const messageData = {
      messaging_product: "whatsapp",
      to: cleanTo,
      type: "interactive",
      interactive: {
        type: "list",
        body: {
          text: text
        },
        action: {
          button: buttonText,
          sections: sections.map(section => ({
            title: section.title,
            rows: section.rows.map(row => ({
              id: row.id,
              title: row.title,
              description: row.description || ""
            }))
          }))
        }
      }
    };

    console.log('📤 Sending list message via Meta WhatsApp API to:', cleanTo);
    
    const response = await axios.post(`${WHATSAPP_API_URL}/messages`, messageData, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('✅ List message sent successfully:', response.data.messages?.[0]?.id);
    return response.data;
  } catch (error) {
    console.error('❌ Error sending list message:', error.response?.data || error.message);
    
    // Fallback to text message
    return await sendWhatsAppMessage(to, text);
  }
}

// Function to send simple WhatsApp text message (Meta API)
async function sendWhatsAppMessage(to, message) {
  try {
    const cleanTo = to.replace('whatsapp:', '').replace('+', '');
    
    const messageData = {
      messaging_product: "whatsapp",
      to: cleanTo,
      type: "text",
      text: {
        body: message
      }
    };

    console.log('📤 Sending text message via Meta WhatsApp API to:', cleanTo);
    
    const response = await axios.post(`${WHATSAPP_API_URL}/messages`, messageData, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('✅ Text message sent successfully:', response.data.messages?.[0]?.id);
    return response.data;
  } catch (error) {
    console.error('❌ Error sending text message:', error.response?.data || error.message);
    throw error;
  }
}

// Webhook verification for Meta WhatsApp API
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('🔍 Webhook verification request:', { mode, token, challenge });

  if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
    console.log('✅ Webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Webhook verification failed');
    res.status(403).send('Forbidden');
  }
});

// Rest of your existing conversation states and bot messages...
const CONVERSATION_STATES = {
  START: 'start',
  // User profile states (for first-time users)
  COLLECTING_USER_NAME: 'collecting_user_name',
  COLLECTING_USER_DOCUMENT: 'collecting_user_document',
  PROFILE_COMPLETE: 'profile_complete',
  // Receipt generation states
  COLLECTING_CLIENT_NAME: 'collecting_client_name',
  COLLECTING_CLIENT_DOCUMENT: 'collecting_client_document',
  COLLECTING_SERVICE_NAME: 'collecting_service_name',
  COLLECTING_SERVICE_DESCRIPTION: 'collecting_service_description',
  COLLECTING_AMOUNT: 'collecting_amount',
  COLLECTING_DATE: 'collecting_date',
  CONFIRMING: 'confirming',
  COMPLETED: 'completed',
  // Profile editing states
  EDITING_PROFILE: 'editing_profile',
  EDITING_USER_NAME: 'editing_user_name',
  EDITING_USER_DOCUMENT: 'editing_user_document'
};

// Interactive button definitions (adjusted for Meta API format)
const INTERACTIVE_BUTTONS = {
  // Profile editing buttons
  profileMenu: [
    { reply: { id: 'edit_name', title: '✏️ Editar Nome' } },
    { reply: { id: 'edit_document', title: '📄 Editar CPF/CNPJ' } },
    { reply: { id: 'back_main', title: '↩️ Voltar' } }
  ],
  
  // Confirmation buttons
  confirmation: [
    { reply: { id: 'confirm_yes', title: '✅ Confirmar' } },
    { reply: { id: 'confirm_no', title: '❌ Refazer' } }
  ],
  
  // Service description buttons
  serviceDescription: [
    { reply: { id: 'skip_description', title: '⏭️ Pular descrição' } },
    { reply: { id: 'add_description', title: '📝 Adicionar descrição' } }
  ],
  
  // Date options
  dateOptions: [
    { reply: { id: 'date_today', title: '📅 Hoje' } },
    { reply: { id: 'date_custom', title: '📝 Outra data' } }
  ],
  
  // Main menu
  mainMenu: [
    { reply: { id: 'create_receipt', title: '📄 Criar Recibo' } },
    { reply: { id: 'view_profile', title: '👤 Meu Perfil' } },
    { reply: { id: 'view_history', title: '📋 Histórico' } }
  ],
  
  // After receipt creation
  afterReceipt: [
    { reply: { id: 'new_receipt', title: '📋 Novo Recibo' } },
    { reply: { id: 'edit_profile', title: '⚙️ Meu Perfil' } },
    { reply: { id: 'help', title: '❓ Ajuda' } }
  ]
};

// List menu definitions for complex menus
const LIST_MENUS = {
  mainMenu: {
    text: '🏠 *Menu Principal ReciboLegal*\n\nEscolha uma opção:',
    buttonText: 'Ver Opções',
    sections: [
      {
        title: '📄 Recibos',
        rows: [
          { id: 'create_receipt', title: 'Criar Novo Recibo', description: 'Gerar recibo profissional' },
          { id: 'view_history', title: 'Ver Histórico', description: 'Seus últimos recibos' }
        ]
      },
      {
        title: '⚙️ Configurações',
        rows: [
          { id: 'view_profile', title: 'Meu Perfil', description: 'Ver/editar dados pessoais' },
          { id: 'view_status', title: 'Status da Conta', description: 'Plano atual e uso' }
        ]
      }
    ]
  }
};

// Webhook endpoint for Meta WhatsApp Business API messages
router.post('/webhook', async (req, res) => {
  try {
    console.log('📥 Received webhook from Meta WhatsApp API:', JSON.stringify(req.body, null, 2));

    const { entry } = req.body;
    
    if (!entry || entry.length === 0) {
      return res.status(200).send('OK');
    }

    for (const entryItem of entry) {
      const { changes } = entryItem;
      
      if (!changes || changes.length === 0) continue;

      for (const change of changes) {
        const { value } = change;
        
        if (change.field !== 'messages' || !value.messages) continue;

        for (const message of value.messages) {
          await processWhatsAppMessage(message, value);
        }
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Process individual WhatsApp message
async function processWhatsAppMessage(message, value) {
  try {
    const { from, type, text, interactive } = message;
    
    let messageText = '';
    let buttonId = null;

    // Extract message content based on type
    if (type === 'text') {
      messageText = text.body;
    } else if (type === 'interactive') {
      if (interactive.type === 'button_reply') {
        buttonId = interactive.button_reply.id;
        messageText = interactive.button_reply.title;
      } else if (interactive.type === 'list_reply') {
        buttonId = interactive.list_reply.id;
        messageText = interactive.list_reply.title;
      }
    }

    console.log('📨 Processing message:', { from, type, messageText, buttonId });

    // Get or create user session
    let session = userSessions.get(from) || {
      state: CONVERSATION_STATES.START,
      data: {}
    };

    // Process message with existing logic
    const processedAction = processButtonResponse(messageText, buttonId);
    
    // Your existing conversation logic here...
    // (All the existing switch statements and conversation handling)
    
    // Send response
    if (responseMessage) {
      await sendWhatsAppMessage(`whatsapp:+${from}`, responseMessage);
    }

    // Save session
    userSessions.set(from, session);

  } catch (error) {
    console.error('❌ Error processing message:', error);
  }
}

// Rest of your existing bot logic...
// (processButtonResponse, BOT_MESSAGES, conversation handling, etc.)

module.exports = router;
