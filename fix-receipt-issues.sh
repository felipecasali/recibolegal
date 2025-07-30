#!/bin/bash

# Script para corrigir problemas de geração de recibo identificados nos logs
echo "=== Correção de Problemas de Geração de Recibo ==="
echo "Data/Hora: $(date)"
echo ""

echo "🔧 Problemas identificados nos logs:"
echo "1. ❌ cleanPhone is not defined (receipts.js:233)"
echo "2. ❌ TypeError: Cannot read properties of undefined (reading 'toLowerCase') (whatsapp.js:365)"
echo "3. ❌ TypeError: Cannot destructure property 'Body' of 'req.body' as it is undefined (whatsapp.js:372)"
echo ""

echo "✅ Correções aplicadas no código local:"
echo "1. ✅ Movido declaração de cleanPhone para escopo correto"
echo "2. ✅ Adicionado verificação de message em processButtonResponse"
echo "3. ✅ Adicionado fallback para req.body undefined"
echo ""

# Verificar se estamos no servidor
if command -v docker >/dev/null 2>&1 && docker ps >/dev/null 2>&1; then
    echo "🚀 Aplicando correções no servidor de produção..."
    
    # 1. Fazer backup do container atual
    echo ""
    echo "1. Fazendo backup dos logs atuais..."
    docker-compose -f docker-compose.prod.yml logs --tail=100 recibolegal > backup-logs-$(date +%Y%m%d-%H%M%S).log
    
    # 2. Reconstruir e reiniciar o container
    echo ""
    echo "2. Reconstruindo container com correções..."
    docker-compose -f docker-compose.prod.yml down
    docker-compose -f docker-compose.prod.yml build --no-cache recibolegal
    docker-compose -f docker-compose.prod.yml up -d
    
    # 3. Aguardar inicialização
    echo ""
    echo "3. Aguardando inicialização..."
    sleep 20
    
    # 4. Verificar status
    echo ""
    echo "4. Verificando status dos containers:"
    docker-compose -f docker-compose.prod.yml ps
    
    # 5. Verificar logs iniciais
    echo ""
    echo "5. Verificando logs de inicialização:"
    docker-compose -f docker-compose.prod.yml logs --tail=10 recibolegal
    
    # 6. Testar geração de recibo
    echo ""
    echo "6. Testando geração de recibo após correções..."
    sleep 5
    
    test_response=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d '{
            "clientName": "Teste Correção",
            "clientDocument": "123.456.789-00",
            "serviceName": "Teste Pós-Correção",
            "amount": "99.99",
            "date": "2025-07-30",
            "userPhone": "+5511999999999"
        }' \
        https://recibolegal.com.br/api/receipts/generate 2>/dev/null)
    
    if [ "$test_response" = "200" ]; then
        echo "✅ Geração de recibo funcionando! (HTTP 200)"
        echo ""
        echo "Verificando logs da geração:"
        sleep 2
        docker-compose -f docker-compose.prod.yml logs --tail=5 recibolegal | grep -E "(Receipt generated|PDF Download|RECIBO GERADO)"
        
    else
        echo "❌ Ainda há problemas: HTTP $test_response"
        echo ""
        echo "Verificando logs de erro:"
        docker-compose -f docker-compose.prod.yml logs --tail=10 recibolegal | grep -E "(error|Error|ERROR)"
    fi
    
    # 7. Testar webhook do WhatsApp
    echo ""
    echo "7. Testando webhook do WhatsApp..."
    webhook_response=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d '{"Body":"teste","From":"+5511999999999"}' \
        https://recibolegal.com.br/api/whatsapp/webhook 2>/dev/null)
    
    echo "Webhook WhatsApp: HTTP $webhook_response"
    
    if [ "$webhook_response" = "200" ]; then
        echo "✅ Webhook funcionando corretamente!"
    else
        echo "⚠️  Webhook pode ter outros problemas (expected: 200)"
    fi
    
else
    echo "🏠 Executando localmente"
    echo ""
    echo "Para aplicar no servidor, execute:"
    echo "1. Copie os arquivos corrigidos para o servidor:"
    echo "   scp server/routes/receipts.js root@recibolegal.com.br:/opt/recibolegal/server/routes/"
    echo "   scp server/routes/whatsapp.js root@recibolegal.com.br:/opt/recibolegal/server/routes/"
    echo ""
    echo "2. Execute no servidor:"
    echo "   ssh root@recibolegal.com.br"
    echo "   cd /opt/recibolegal"
    echo "   ./fix-receipt-issues.sh"
fi

echo ""
echo "=== Monitoramento Recomendado ==="
echo "docker-compose -f docker-compose.prod.yml logs -f recibolegal | grep -E '(receipt|error|Error)'"
echo ""
echo "=== Teste Manual ==="
echo "curl -X POST -H 'Content-Type: application/json' \\"
echo "  -d '{\"clientName\":\"Teste\",\"clientDocument\":\"123456789\",\"serviceName\":\"Teste\",\"amount\":\"100\",\"date\":\"2025-07-30\"}' \\"
echo "  https://recibolegal.com.br/api/receipts/generate"
echo ""
echo "=== Correção Concluída ==="
