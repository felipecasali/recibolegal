#!/bin/bash

# Script para testar webhook do Twilio após correção SSL
echo "=== Teste do Webhook Twilio ==="

WEBHOOK_URL="https://recibolegal.com.br/api/whatsapp/webhook"

echo "Testando conectividade SSL do webhook..."

# Teste 1: Verificar se HTTPS funciona
echo -n "1. HTTPS acessível: "
if curl -s -o /dev/null -w "%{http_code}" "$WEBHOOK_URL" 2>/dev/null | grep -q "405\|400\|200"; then
    echo "✅ OK"
else
    echo "❌ FALHOU - SSL ainda com problemas"
    exit 1
fi

# Teste 2: Verificar certificado
echo -n "2. Certificado válido: "
cert_info=$(openssl s_client -connect "recibolegal.com.br:443" -servername "recibolegal.com.br" </dev/null 2>/dev/null | openssl x509 -noout -issuer 2>/dev/null)
if echo "$cert_info" | grep -q "Let's Encrypt"; then
    echo "✅ Let's Encrypt válido"
else
    echo "❌ Certificado ainda não é Let's Encrypt"
    echo "Certificado atual: $cert_info"
fi

# Teste 3: Simular request do Twilio
echo -n "3. Webhook Twilio: "
response=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "User-Agent: TwilioProxy/1.1" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -X POST \
    "$WEBHOOK_URL" \
    2>/dev/null)

if [ "$response" = "405" ] || [ "$response" = "400" ]; then
    echo "✅ Respondendo corretamente (HTTP $response)"
    echo ""
    echo "🎉 WEBHOOK FUNCIONANDO!"
    echo "O Twilio agora consegue se comunicar com o servidor."
    echo ""
    echo "Próximos passos:"
    echo "1. Testar envio de mensagem WhatsApp"
    echo "2. Verificar logs: docker-compose -f docker-compose.prod.yml logs -f"
else
    echo "⚠️  Resposta inesperada: HTTP $response"
fi

echo ""
echo "=== Teste Concluído ==="
