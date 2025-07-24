#!/usr/bin/env node

/**
 * Script para configurar templates WhatsApp no Twilio
 * Templates são obrigatórios para WhatsApp Business API
 */

require('dotenv').config();
const twilio = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Templates obrigatórios para WhatsApp Business
const TEMPLATES = [
  {
    friendly_name: 'recibolegal_welcome',
    language: 'pt_BR',
    variables: ['{{1}}'], // Nome do usuário
    body: `🎉 Olá {{1}}! Bem-vindo ao *ReciboLegal*!

Vou te ajudar a criar recibos válidos juridicamente em alguns passos simples.

Para começar, me diga o *nome completo do seu cliente*:`
  },
  {
    friendly_name: 'recibolegal_receipt_ready',
    language: 'pt_BR',
    variables: ['{{1}}', '{{2}}'], // Nome do cliente, Link do recibo
    body: `🎉 *Recibo criado com sucesso!*

👤 Cliente: {{1}}
📄 Seu recibo está pronto: {{2}}

💚 Obrigado por usar o ReciboLegal!`
  },
  {
    friendly_name: 'recibolegal_limit_exceeded',
    language: 'pt_BR',
    variables: ['{{1}}', '{{2}}', '{{3}}'], // Recibos usados, Limite, Link upgrade
    body: `⚠️ *Limite atingido!*

Você já usou {{1}}/{{2}} recibos este mês.

🚀 *Faça upgrade para continuar:*
{{3}}

Digite *OI* para criar um novo recibo quando fizer o upgrade.`
  }
];

async function setupWhatsAppTemplates() {
  console.log('📱 Configurando templates WhatsApp para produção...\n');

  for (const template of TEMPLATES) {
    try {
      console.log(`📝 Criando template: ${template.friendly_name}`);
      
      const contentSid = await client.content.v1.contents.create({
        friendlyName: template.friendly_name,
        language: template.language,
        variables: template.variables,
        types: {
          'twilio/text': {
            body: template.body
          }
        }
      });

      console.log(`✅ Template criado: ${contentSid.sid}`);
      console.log(`📋 Nome: ${template.friendly_name}\n`);

    } catch (error) {
      console.error(`❌ Erro ao criar template ${template.friendly_name}:`, error.message);
    }
  }

  console.log('🎉 Setup dos templates concluído!');
  console.log('\n📋 Próximos passos:');
  console.log('1. Aguarde aprovação dos templates (24-48h)');
  console.log('2. Configure webhook URL');
  console.log('3. Teste com número aprovado');
}

// Listar templates existentes
async function listTemplates() {
  console.log('📋 Templates WhatsApp existentes:\n');
  
  try {
    const contents = await client.content.v1.contents.list({ limit: 20 });
    
    contents.forEach(content => {
      console.log(`📝 ${content.friendlyName} (${content.sid})`);
      console.log(`   Status: ${content.approvalRequests?.status || 'pending'}`);
      console.log(`   Idioma: ${content.language}\n`);
    });

    if (contents.length === 0) {
      console.log('Nenhum template encontrado. Execute o setup primeiro.');
    }
  } catch (error) {
    console.error('❌ Erro ao listar templates:', error.message);
  }
}

// Verificar comando
const command = process.argv[2];

if (command === 'list') {
  listTemplates().catch(console.error);
} else {
  setupWhatsAppTemplates().catch(console.error);
}

module.exports = { setupWhatsAppTemplates, listTemplates };
