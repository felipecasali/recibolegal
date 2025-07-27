#!/bin/bash

# 🔄 MIGRAÇÃO: Twilio → Meta WhatsApp Business API

echo "🔄 MIGRANDO DE TWILIO PARA META WHATSAPP BUSINESS API"
echo "=================================================="

echo "✅ Situação identificada:"
echo "   - Você tem WhatsApp Business API (Meta) configurado"
echo "   - Código atual usa Twilio SDK (incompatível)"
echo "   - Precisa migrar para Meta WhatsApp Business API"
echo ""

echo "📋 Informações do seu WhatsApp Business:"
echo "   - Número: +55 11 5028-1981"
echo "   - Business Account ID: 749496544108699"
echo "   - Meta Business Manager ID: 290875680325828"
echo "   - Status: Online ✅"
echo ""

echo "🔧 1. Adicionando variáveis de ambiente Meta WhatsApp..."

# Backup do .env atual
ssh root@recibolegal.com.br "cd /opt/recibolegal && cp .env.production .env.production.backup.$(date +%Y%m%d_%H%M%S)"

# Adicionar variáveis Meta WhatsApp
ssh root@recibolegal.com.br "cd /opt/recibolegal && cat >> .env.production << 'EOF'

# Meta WhatsApp Business API Configuration
WHATSAPP_ACCESS_TOKEN=your_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_BUSINESS_ACCOUNT_ID=749496544108699
META_BUSINESS_MANAGER_ID=290875680325828
WHATSAPP_VERIFY_TOKEN=recibolegal_webhook_verify_token
WHATSAPP_API_VERSION=v18.0

# WhatsApp Number (production)
WHATSAPP_FROM_NUMBER=5511502081981
EOF"

echo "✅ Variáveis adicionadas ao .env.production"

echo ""
echo "🎯 PRÓXIMOS PASSOS MANUAIS:"
echo ""
echo "1. 🔑 OBTER ACCESS TOKEN:"
echo "   - Acesse: https://developers.facebook.com/apps"
echo "   - Selecione seu app WhatsApp Business"
echo "   - Configure WhatsApp → Getting Started"
echo "   - Copie o Access Token permanente"
echo ""
echo "2. 🔢 OBTER PHONE NUMBER ID:"
echo "   - No mesmo painel do Facebook Developers"
echo "   - WhatsApp → Getting Started"
echo "   - Copie o Phone Number ID do +55 11 5028-1981"
echo ""
echo "3. 🌐 CONFIGURAR WEBHOOK:"
echo "   - Meta Business Manager → WhatsApp Manager"
echo "   - Webhook URL: https://recibolegal.com.br/api/whatsapp/webhook"
echo "   - Verify Token: recibolegal_webhook_verify_token"
echo "   - Eventos: messages, messaging_postbacks"
echo ""
echo "4. 🔄 ATUALIZAR CÓDIGO:"
echo "   - Migrar de Twilio SDK para Meta WhatsApp Business API"
echo "   - Usar axios para chamadas HTTP"
echo "   - Atualizar formato das mensagens"
echo ""

echo "📋 Quer que eu crie o código atualizado para Meta WhatsApp API?"
