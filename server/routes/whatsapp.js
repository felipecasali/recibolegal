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

// Function to send WhatsApp message with interactive buttons
async function sendWhatsAppMessageWithButtons(to, text, buttons) {
  try {
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    
    // Check if simulation mode is enabled
    if (process.env.TWILIO_SIMULATION_MODE === 'true') {
      console.log(`🧪 SIMULATION MODE: Interactive message would be sent to ${formattedTo}`);
      console.log(`📱 Text: "${text}"`);
      console.log(`🔘 Buttons:`, buttons.map(b => `"${b.reply.title}" (${b.reply.id})`).join(', '));
      return;
    }

    const client = getTwilioClient();
    
    // Create interactive message with reply buttons
    const message = {
      from: WHATSAPP_NUMBER,
      to: formattedTo,
      contentSid: null, // We'll create the content programmatically
      body: text,
      // Interactive message structure for Twilio
      persistent_action: buttons.map(button => ({
        title: button.reply.title,
        id: button.reply.id
      }))
    };

    // For now, send as regular message with button options
    // (Twilio's interactive messages require specific setup)
    const buttonText = buttons.map((btn, index) => 
      `${index + 1}️⃣ *${btn.reply.title}*`
    ).join('\n');
    
    const fullMessage = `${text}\n\n${buttonText}\n\n💡 _Responda com o número ou texto da opção_`;
    
    await client.messages.create({
      body: fullMessage,
      from: WHATSAPP_NUMBER,
      to: formattedTo
    });
    
    console.log(`✅ Interactive message sent to ${formattedTo}`);
  } catch (error) {
    console.error('❌ Error sending interactive message:', error);
    // Fallback to regular message
    await sendWhatsAppMessage(to, text);
  }
}

// Function to send WhatsApp list message
async function sendWhatsAppListMessage(to, text, buttonText, sections) {
  try {
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    
    if (process.env.TWILIO_SIMULATION_MODE === 'true') {
      console.log(`🧪 SIMULATION MODE: List message would be sent to ${formattedTo}`);
      console.log(`📱 Text: "${text}"`);
      console.log(`📋 Sections:`, sections);
      return;
    }

    const client = getTwilioClient();
    
    // Create list options text
    let listText = text + '\n\n';
    sections.forEach((section, sIndex) => {
      if (section.title) listText += `*${section.title}*\n`;
      section.rows.forEach((row, rIndex) => {
        listText += `${sIndex + 1}.${rIndex + 1} ${row.title}\n`;
        if (row.description) listText += `   _${row.description}_\n`;
      });
      listText += '\n';
    });
    
    listText += `💡 _Responda com o número da opção_`;

    await client.messages.create({
      body: listText,
      from: WHATSAPP_NUMBER,
      to: formattedTo
    });
    
    console.log(`✅ List message sent to ${formattedTo}`);
  } catch (error) {
    console.error('❌ Error sending list message:', error);
    await sendWhatsAppMessage(to, text);
  }
}

// Bot conversation flow states
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

// Bot messages
const BOT_MESSAGES = {
  // First-time user setup
  firstTimeSetup: `🎉 Olá! Bem-vindo ao *ReciboLegal*!

Como é seu primeiro acesso, vou precisar de algumas informações básicas para personalizar seus recibos.

Por favor, me diga seu *nome completo*:`,

  userDocument: `Perfeito! Agora preciso do seu *CPF ou CNPJ*:

💡 Exemplo: 123.456.789-00 ou 12.345.678/0001-90

ℹ️ Essas informações aparecerão nos seus recibos como prestador do serviço.`,

  profileComplete: (name) => `✅ *Perfil configurado com sucesso!*

Olá, ${name}! Agora você pode criar recibos profissionais.

Para começar seu primeiro recibo, me diga o *nome completo do seu cliente*:`,

  // Regular welcome for returning users
  welcome: (name) => `🎉 Olá novamente, *${name}*!

Vou te ajudar a criar um novo recibo válido juridicamente.

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

Me diga o *nome completo do seu cliente*:`,

  // Profile editing messages
  profileOptions: (userData) => `⚙️ *Meu Perfil*

*Dados atuais:*
👤 Nome: ${userData.fullName || 'Não informado'}
📄 CPF/CNPJ: ${userData.cpfCnpj || 'Não informado'}

*Opções:*
1️⃣ Digite *NOME* para alterar seu nome
2️⃣ Digite *DOCUMENTO* para alterar CPF/CNPJ
3️⃣ Digite *SAIR* para voltar ao menu principal`,

  editName: `✏️ *Alterar Nome*

Digite seu novo nome completo:`,

  editDocument: `✏️ *Alterar CPF/CNPJ*

Digite seu novo CPF ou CNPJ:

💡 Exemplo: 123.456.789-00 ou 12.345.678/0001-90`,

  profileUpdated: (userData) => `✅ *Perfil atualizado com sucesso!*

*Novos dados:*
👤 Nome: ${userData.fullName}
📄 CPF/CNPJ: ${userData.cpfCnpj}

Digite *OI* para criar um recibo ou *PERFIL* para fazer mais alterações.`
};

// Interactive button definitions
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
          { id: 'view_status', title: 'Status da Conta', description: 'Plano atual e uso' },
          { id: 'upgrade_plan', title: 'Fazer Upgrade', description: 'Ver planos disponíveis' }
        ]
      }
    ]
  }
};

// Function to handle button responses and text alternatives
function processButtonResponse(message, buttonId = null) {
  // If we have a button ID, use it directly
  if (buttonId) return buttonId;
  
  // Otherwise, map common text responses to button IDs
  const textMappings = {
    // Profile menu
    '1': 'edit_name',
    'nome': 'edit_name',
    'editar nome': 'edit_name',
    '2': 'edit_document', 
    'documento': 'edit_document',
    'cpf': 'edit_document',
    'cnpj': 'edit_document',
    '3': 'back_main',
    'sair': 'back_main',
    'voltar': 'back_main',
    
    // Confirmation
    'sim': 'confirm_yes',
    's': 'confirm_yes',
    'confirmar': 'confirm_yes',
    'não': 'confirm_no',
    'nao': 'confirm_no',
    'n': 'confirm_no',
    'refazer': 'confirm_no',
    
    // Service description
    'pular': 'skip_description',
    'skip': 'skip_description',
    
    // Date
    'hoje': 'date_today',
    'outra': 'date_custom',
    'outra data': 'date_custom',
    'personalizada': 'date_custom',
    
    // Main menu
    'oi': 'create_receipt',
    'olá': 'create_receipt',
    'criar': 'create_receipt',
    'recibo': 'create_receipt',
    'perfil': 'view_profile',
    'profile': 'view_profile',
    'histórico': 'view_history',
    'historico': 'view_history',
    'history': 'view_history',
    'status': 'view_status',
    'plano': 'view_status',
    'upgrade': 'upgrade_plan',
    
    // After receipt actions
    'novo': 'new_receipt',
    'novo recibo': 'new_receipt',
    'ajuda': 'help',
    'help': 'help'
  };
  
  const normalizedMessage = message.toLowerCase().trim();
  return textMappings[normalizedMessage] || null;
}

// Webhook endpoint for WhatsApp messages
router.post('/webhook', async (req, res) => {
  try {
    const { Body, From, To, ButtonPayload } = req.body;
    const userPhone = From;
    const message = Body?.trim().toLowerCase();
    
    // Check if this is a button response
    const buttonId = ButtonPayload || null;
    const processedAction = processButtonResponse(message, buttonId);

    console.log(`📱 Message from ${userPhone}: ${Body}`);
    if (buttonId) console.log(`🔘 Button pressed: ${buttonId}`);
    if (processedAction) console.log(`⚡ Action: ${processedAction}`);

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

    // Check if user profile is complete for first-time users
    const isProfileComplete = await userService.isProfileComplete(normalizedPhone);
    
    // If user doesn't have complete profile and isn't in profile setup flow, redirect to profile setup
    if (!isProfileComplete && 
        session.state !== CONVERSATION_STATES.COLLECTING_USER_NAME && 
        session.state !== CONVERSATION_STATES.COLLECTING_USER_DOCUMENT &&
        !message.includes('perfil') && !message.includes('profile') &&
        !message.includes('editar') && !message.includes('edit')) {
      
      if (session.state === CONVERSATION_STATES.START && 
          (message.includes('oi') || message.includes('olá') || message.includes('começar'))) {
        responseMessage = BOT_MESSAGES.firstTimeSetup;
        session.state = CONVERSATION_STATES.COLLECTING_USER_NAME;
      } else if (session.state === CONVERSATION_STATES.START) {
        responseMessage = `🎉 Olá! Para começar, preciso que você complete seu perfil.

${BOT_MESSAGES.firstTimeSetup}`;
        session.state = CONVERSATION_STATES.COLLECTING_USER_NAME;
      }
    }

    // Handle conversation flow
    switch (session.state) {
      // Profile setup states for first-time users
      case CONVERSATION_STATES.COLLECTING_USER_NAME:
        if (Body && Body.trim()) {
          session.data.userFullName = Body.trim();
          session.state = CONVERSATION_STATES.COLLECTING_USER_DOCUMENT;
          responseMessage = BOT_MESSAGES.userDocument;
        } else {
          responseMessage = `Por favor, digite seu nome completo:`;
        }
        break;

      case CONVERSATION_STATES.COLLECTING_USER_DOCUMENT:
        if (Body && Body.trim()) {
          session.data.userCpfCnpj = Body.trim();
          
          // Update user profile in database
          try {
            await userService.updateUserProfile(normalizedPhone, {
              fullName: session.data.userFullName,
              cpfCnpj: session.data.userCpfCnpj
            });
            
            responseMessage = BOT_MESSAGES.profileComplete(session.data.userFullName);
            session.state = CONVERSATION_STATES.COLLECTING_CLIENT_NAME;
            session.data = {}; // Clear profile data, keep session for receipt creation
          } catch (error) {
            console.error('Error updating user profile:', error);
            responseMessage = `❌ Erro ao salvar perfil. Tente novamente.

Digite seu CPF ou CNPJ:`;
          }
        } else {
          responseMessage = `Por favor, digite seu CPF ou CNPJ:`;
        }
        break;

      case CONVERSATION_STATES.START:
        // Handle button responses first
        if (processedAction === 'create_receipt' || processedAction === 'new_receipt' || message.includes('oi') || message.includes('olá') || message.includes('começar')) {
          const userName = user.fullName || 'Usuário';
          responseMessage = BOT_MESSAGES.welcome(userName);
          session.state = CONVERSATION_STATES.COLLECTING_CLIENT_NAME;
        } else if (processedAction === 'view_profile' || processedAction === 'edit_profile' || message.includes('perfil') || message.includes('profile') || message.includes('editar')) {
          // Show profile editing options with buttons
          const profileText = `⚙️ *Meu Perfil*

*Dados atuais:*
👤 Nome: ${user.fullName || 'Não informado'}
📄 CPF/CNPJ: ${user.cpfCnpj || 'Não informado'}

Escolha uma opção:`;

          await sendWhatsAppMessageWithButtons(userPhone, profileText, INTERACTIVE_BUTTONS.profileMenu);
          session.state = CONVERSATION_STATES.EDITING_PROFILE;
          
          // Save session and return early since we already sent the message
          userSessions.set(userPhone, session);
          return res.status(200).send('OK');
        } else if (processedAction === 'view_status' || message.includes('status') || message.includes('plano') || message.includes('assinatura')) {
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
        } else if (processedAction === 'help' || message.includes('ajuda') || message.includes('help')) {
          responseMessage = `❓ *Ajuda - ReciboLegal*

🤔 *Como funciona:*
1. Digite *OI* para começar
2. Informe os dados do cliente
3. Descreva o serviço prestado
4. Confirme o valor e data
5. Seu recibo será gerado!

📋 *Comandos úteis:*
• *OI* - Criar novo recibo
• *PERFIL* - Ver/editar seus dados
• *STATUS* - Ver uso do plano
• *HISTÓRICO* - Seus recibos anteriores

💬 *Dúvidas frequentes:*
• O recibo é válido legalmente? Sim!
• Posso editar meus dados? Sim, digite PERFIL
• Como fazer upgrade? Digite UPGRADE

📞 *Suporte:* contato@recibolegal.com.br

Digite *OI* para criar um recibo agora!`;
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

Digite *HISTÓRICO* para ver seus recibos, *PERFIL* para editar dados ou *OI* para criar novo.`;
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

      // Profile editing states
      case CONVERSATION_STATES.EDITING_PROFILE:
        if (processedAction === 'edit_name' || message.includes('nome') || message === '1') {
          session.state = CONVERSATION_STATES.EDITING_USER_NAME;
          responseMessage = BOT_MESSAGES.editName;
        } else if (processedAction === 'edit_document' || message.includes('documento') || message === '2') {
          session.state = CONVERSATION_STATES.EDITING_USER_DOCUMENT;
          responseMessage = BOT_MESSAGES.editDocument;
        } else if (processedAction === 'back_main' || message.includes('sair') || message === '3') {
          session = { state: CONVERSATION_STATES.START, data: {} };
          
          // Show main menu with buttons
          await sendWhatsAppListMessage(
            userPhone, 
            LIST_MENUS.mainMenu.text,
            LIST_MENUS.mainMenu.buttonText,
            LIST_MENUS.mainMenu.sections
          );
          
          // Save session and return early
          userSessions.set(userPhone, session);
          return res.status(200).send('OK');
        } else {
          // Re-show profile options with buttons
          const profileText = `⚙️ *Meu Perfil*

*Dados atuais:*
👤 Nome: ${user.fullName || 'Não informado'}
📄 CPF/CNPJ: ${user.cpfCnpj || 'Não informado'}

Escolha uma opção:`;

          await sendWhatsAppMessageWithButtons(userPhone, profileText, INTERACTIVE_BUTTONS.profileMenu);
          
          // Save session and return early
          userSessions.set(userPhone, session);
          return res.status(200).send('OK');
        }
        break;

      case CONVERSATION_STATES.EDITING_USER_NAME:
        if (Body && Body.trim()) {
          try {
            const updatedUser = await userService.updateUserProfile(normalizedPhone, {
              fullName: Body.trim(),
              cpfCnpj: user.cpfCnpj
            });
            
            session = { state: CONVERSATION_STATES.START, data: {} };
            responseMessage = BOT_MESSAGES.profileUpdated(updatedUser);
          } catch (error) {
            console.error('Error updating user name:', error);
            responseMessage = `❌ Erro ao atualizar nome. Tente novamente.

Digite seu novo nome completo:`;
          }
        } else {
          responseMessage = `Por favor, digite seu novo nome completo:`;
        }
        break;

      case CONVERSATION_STATES.EDITING_USER_DOCUMENT:
        if (Body && Body.trim()) {
          try {
            const updatedUser = await userService.updateUserProfile(normalizedPhone, {
              fullName: user.fullName,
              cpfCnpj: Body.trim()
            });
            
            session = { state: CONVERSATION_STATES.START, data: {} };
            responseMessage = BOT_MESSAGES.profileUpdated(updatedUser);
          } catch (error) {
            console.error('Error updating user document:', error);
            responseMessage = `❌ Erro ao atualizar documento. Tente novamente.

Digite seu novo CPF ou CNPJ:`;
          }
        } else {
          responseMessage = `Por favor, digite seu novo CPF ou CNPJ:`;
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
        if (processedAction === 'skip_description' || message === 'pular' || message === '2') {
          session.data.serviceDescription = '';
        } else if (processedAction === 'add_description' || message === '1' || (message.trim().length > 5 && !message.includes('pular'))) {
          // If user selected "add description" but hasn't provided it yet, ask for it
          if (processedAction === 'add_description' || message === '1') {
            responseMessage = '📝 *Descreva detalhes do serviço:*\n\nExemplo: "Consultoria em marketing digital com estratégias personalizadas"';
            // Stay in same state waiting for actual description
            break;
          } else {
            // User provided actual description
            session.data.serviceDescription = Body.trim();
          }
        } else {
          // Show description options with buttons
          const descriptionText = `📝 *Deseja adicionar uma descrição detalhada do serviço?*

Uma descrição pode incluir:
• Detalhes técnicos do trabalho
• Metodologia utilizada  
• Resultados esperados
• Especificações do projeto`;

          await sendWhatsAppMessageWithButtons(userPhone, descriptionText, INTERACTIVE_BUTTONS.serviceDescription);
          
          // Save session and return early
          userSessions.set(userPhone, session);
          return res.status(200).send('OK');
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
        if (processedAction === 'date_today' || message === 'hoje' || message === '1') {
          date = new Date().toLocaleDateString('pt-BR');
        } else if (processedAction === 'date_custom' || message === '2' || message.includes('/')) {
          // Handle custom date input
          if (message === '2' || processedAction === 'date_custom') {
            // User selected custom date option, ask for input
            responseMessage = '📅 *Digite a data do serviço:*\n\nUse o formato DD/MM/AAAA\nExemplo: 23/07/2025';
            // Stay in same state waiting for actual date input
            break;
          } else {
            // Simple date validation for custom input
            const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
            if (dateRegex.test(Body.trim())) {
              date = Body.trim();
            } else {
              responseMessage = `❌ Data inválida. Use o formato DD/MM/AAAA (exemplo: 23/07/2025):`;
              break;
            }
          }
        } else {
          // Show date options with buttons
          const dateText = '📅 *Qual a data do serviço prestado?*';
          await sendWhatsAppMessageWithButtons(userPhone, dateText, INTERACTIVE_BUTTONS.dateOptions);
          
          // Save session and return early
          userSessions.set(userPhone, session);
          return res.status(200).send('OK');
        }
        
        session.data.date = date;
        session.state = CONVERSATION_STATES.CONFIRMING;
        
        // Send confirmation with buttons
        const confirmText = BOT_MESSAGES.confirmation(session.data);
        await sendWhatsAppMessageWithButtons(userPhone, confirmText, INTERACTIVE_BUTTONS.confirmation);
        
        // Save session and return early
        userSessions.set(userPhone, session);
        return res.status(200).send('OK');
        break;

      case CONVERSATION_STATES.CONFIRMING:
        if (processedAction === 'confirm_yes' || message === 'sim' || message === 's' || message === '1') {
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
              
              // Show completion options with buttons
              await sendWhatsAppMessage(userPhone, responseMessage);
              await sendWhatsAppMessageWithButtons(userPhone, 
                "O que você gostaria de fazer agora?", 
                INTERACTIVE_BUTTONS.afterReceipt
              );
              
              // Reset session
              session = { state: CONVERSATION_STATES.START, data: {} };
              userSessions.set(userPhone, session);
              return res.status(200).send('OK');
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
        } else if (processedAction === 'confirm_no' || message === 'não' || message === 'nao' || message === 'n' || message === '2') {
          session = { state: CONVERSATION_STATES.START, data: {} };
          responseMessage = BOT_MESSAGES.restart;
          session.state = CONVERSATION_STATES.COLLECTING_CLIENT_NAME;
        } else {
          // Re-show confirmation with buttons
          const confirmText = BOT_MESSAGES.confirmation(session.data);
          await sendWhatsAppMessageWithButtons(userPhone, confirmText, INTERACTIVE_BUTTONS.confirmation);
          
          // Save session and return early
          userSessions.set(userPhone, session);
          return res.status(200).send('OK');
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
