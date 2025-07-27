#!/bin/bash

# 🔧 CORREÇÃO WHATSAPP SANDBOX - ReciboLegal

echo "🔧 CORRIGINDO CONFIGURAÇÃO WHATSAPP SANDBOX"
echo "==========================================="

echo "❌ Problema identificado:"
echo "   - Usando número SMS brasileiro: +55 11 5028-1981"
echo "   - WhatsApp precisa do sandbox americano: +1 415..."
echo ""

echo "🔍 1. Verificando sandbox WhatsApp disponível..."

# Conectar ao servidor e buscar sandbox correto
ssh root@recibolegal.com.br "cd /opt/recibolegal && docker-compose -f docker-compose.prod.yml exec -T recibolegal node -e \"
const twilio = require('twilio');
const https = require('https');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

console.log('🔍 Buscando sandbox WhatsApp...');

// Método 1: Tentar buscar via API v1
client.messaging.v1.services.list()
  .then(services => {
    console.log('📱 Serviços messaging:', services.length);
    if (services.length > 0) {
      return services[0];
    }
    throw new Error('Sem serviços');
  })
  .catch(() => {
    console.log('📞 Buscando números com capacidade WhatsApp...');
    
    // Método 2: Buscar números com capability WhatsApp
    return client.incomingPhoneNumbers.list({limit: 50});
  })
  .then(numbers => {
    console.log('📋 Números encontrados:', numbers.length);
    
    // Buscar por números com WhatsApp capability
    const whatsappNumbers = numbers.filter(n => 
      n.capabilities && (n.capabilities.sms || n.capabilities.voice) &&
      n.phoneNumber.startsWith('+1415')
    );
    
    if (whatsappNumbers.length > 0) {
      console.log('✅ Números com potencial WhatsApp:');
      whatsappNumbers.forEach(n => {
        console.log('  📞', n.phoneNumber, '| SMS:', n.smsUrl);
      });
      return whatsappNumbers[0];
    } else {
      console.log('⚠️ Nenhum sandbox WhatsApp encontrado');
      console.log('');
      console.log('🎯 VOCÊ PRECISA:');
      console.log('1. Acessar: https://console.twilio.com/us1/develop/sms/whatsapp/sandbox');
      console.log('2. Ativar o sandbox WhatsApp');
      console.log('3. Copiar o número correto (+1 415...)');
      console.log('4. Copiar o código join correto');
      console.log('');
      console.log('📱 ENTÃO USAR:');
      console.log('- Número: [do console] (ex: +1 415 523 8886)');
      console.log('- Comando: join [código do console]');
    }
  })
  .catch(err => {
    console.log('❌ Erro:', err.message);
    console.log('');
    console.log('🚨 SANDBOX WHATSAPP NÃO CONFIGURADO!');
    console.log('');
    console.log('📋 SOLUÇÃO:');
    console.log('1. Acesse: https://console.twilio.com/us1/develop/sms/whatsapp/sandbox');
    console.log('2. Configure o sandbox WhatsApp');
    console.log('3. Anote o número (+1 415...) e código join');
    console.log('4. Use esses dados corretos');
  });
\""

echo ""
echo "🎯 PRÓXIMOS PASSOS:"
echo "1. ✅ Identifique o número correto no console Twilio"
echo "2. ✅ Configure o webhook para esse número"
echo "3. ✅ Use o comando join correto"
echo "4. ✅ Teste o bot"
