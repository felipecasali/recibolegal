#!/bin/bash

# 🧪 TESTE WHATSAPP WEBHOOK - ReciboLegal

echo "🔍 DIAGNÓSTICO WHATSAPP - $(date)"
echo "=================================="

# 1. Verificar se o webhook está respondendo
echo "📡 1. Testando webhook endpoint..."
WEBHOOK_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST https://recibolegal.com.br/api/whatsapp/webhook \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp:+5511970843096&To=whatsapp:+551150281981&Body=oi" \
  -k)

if [ "$WEBHOOK_STATUS" == "200" ]; then
  echo "✅ Webhook respondendo: HTTP $WEBHOOK_STATUS"
else
  echo "❌ Webhook com problema: HTTP $WEBHOOK_STATUS"
fi

# 2. Verificar logs do servidor
echo ""
echo "📋 2. Logs recentes do servidor:"
ssh root@recibolegal.com.br "cd /opt/recibolegal && docker-compose -f docker-compose.prod.yml logs --tail=3 recibolegal"

# 3. Verificar configuração do Twilio
echo ""
echo "⚙️ 3. Configuração do Twilio:"
ssh root@recibolegal.com.br "cd /opt/recibolegal && docker-compose -f docker-compose.prod.yml exec -T recibolegal node -e \"
const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

client.incomingPhoneNumbers.list()
  .then(numbers => {
    const whatsappNumber = numbers.find(n => n.phoneNumber.includes('1981'));
    if (whatsappNumber) {
      console.log('📞 Número WhatsApp:', whatsappNumber.phoneNumber);
      console.log('🌐 Webhook URL:', whatsappNumber.smsUrl);
      console.log('📤 Status:', whatsappNumber.statusCallback || 'Não configurado');
    }
  })
  .catch(err => console.error('❌ Erro Twilio:', err.message));
\""

echo ""
echo "📱 4. INSTRUÇÕES PARA TESTE:"
echo "   1. Envie mensagem no WhatsApp para: +55 11 5028-1981"
echo "   2. Primeiro envie: 'join grown-shine'"
echo "   3. Depois envie: 'oi'"
echo "   4. Aguarde resposta do bot"

echo ""
echo "🔧 5. Se não funcionar:"
echo "   1. Verifique se está no sandbox do Twilio"
echo "   2. Confirme que enviou o código 'join grown-shine'"
echo "   3. Verifique se o número está autorizado"
