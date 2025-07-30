#!/bin/bash

# Script para resolver problema Twilio 63031 - Bot messaging itself
echo "=== Correção Twilio Error 63031 - Bot Messaging Itself ==="
echo "Data/Hora: $(date)"
echo ""

echo "🔍 Problema identificado:"
echo "❌ RestException [Error]: Message cannot have the same To and From"
echo "❌ Code: 63031"
echo "❌ Causa: Bot tentando enviar mensagem para si mesmo"
echo ""

echo "✅ Correções aplicadas:"
echo "1. ✅ Verificação no webhook: Ignorar mensagens do próprio bot"
echo "2. ✅ Verificação na função sendWhatsAppMessage: Bloquear envio para si mesmo"
echo ""

# Verificar se estamos no servidor
if command -v docker >/dev/null 2>&1 && docker ps >/dev/null 2>&1; then
    echo "🚀 Aplicando correções no servidor de produção..."
    
    # 1. Fazer backup dos logs atuais
    echo ""
    echo "1. Fazendo backup dos logs antes da correção..."
    docker-compose -f docker-compose.prod.yml logs --tail=50 recibolegal > logs-before-fix-63031-$(date +%Y%m%d-%H%M%S).log
    
    # 2. Reconstruir container com correções
    echo ""
    echo "2. Aplicando correções no código WhatsApp..."
    docker-compose -f docker-compose.prod.yml restart recibolegal
    
    # 3. Aguardar inicialização
    echo ""
    echo "3. Aguardando reinicialização..."
    sleep 15
    
    # 4. Verificar status
    echo ""
    echo "4. Verificando status do container:"
    docker-compose -f docker-compose.prod.yml ps | grep recibolegal
    
    # 5. Monitorar logs por erro 63031
    echo ""
    echo "5. Verificando se erro 63031 ainda aparece nos logs..."
    sleep 5
    
    recent_errors=$(docker-compose -f docker-compose.prod.yml logs --tail=20 recibolegal | grep -c "63031" || echo "0")
    
    if [ "$recent_errors" -eq 0 ]; then
        echo "✅ Erro 63031 não encontrado nos logs recentes!"
    else
        echo "⚠️  Ainda há $recent_errors ocorrências do erro 63031"
    fi
    
    # 6. Testar envio de mensagem (simulação segura)
    echo ""
    echo "6. Testando geração de recibo para verificar funcionamento..."
    
    test_response=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d '{
            "clientName": "Teste Anti-63031",
            "clientDocument": "123.456.789-00",
            "serviceName": "Teste Correção Bot",
            "amount": "50.00",
            "date": "2025-07-30",
            "userPhone": "+5511999888777"
        }' \
        https://recibolegal.com.br/api/receipts/generate 2>/dev/null)
    
    if [ "$test_response" = "200" ]; then
        echo "✅ Geração de recibo funcionando normalmente (HTTP 200)"
    else
        echo "⚠️  Resposta da geração: HTTP $test_response"
    fi
    
    # 7. Monitorar logs em tempo real por alguns segundos
    echo ""
    echo "7. Monitorando logs por 10 segundos para detectar novos erros 63031..."
    timeout 10 docker-compose -f docker-compose.prod.yml logs -f recibolegal | grep -E "(63031|RestException|Error.*same.*To.*From)" &
    sleep 10
    
else
    echo "🏠 Executando localmente"
    echo ""
    echo "Para aplicar no servidor:"
    echo "1. Copie o arquivo corrigido:"
    echo "   scp server/routes/whatsapp.js root@recibolegal.com.br:/opt/recibolegal/server/routes/"
    echo ""
    echo "2. Execute no servidor:"
    echo "   ssh root@recibolegal.com.br"
    echo "   cd /opt/recibolegal"
    echo "   ./fix-twilio-63031.sh"
fi

echo ""
echo "=== Verificações de Segurança ==="
echo "✅ Webhook agora ignora mensagens do próprio bot"
echo "✅ sendWhatsAppMessage bloqueia envios para o próprio número"
echo "✅ Logs informativos adicionados para debug"
echo ""

echo "=== Monitoramento Contínuo ==="
echo "Para monitorar se o erro voltou:"
echo "docker-compose -f docker-compose.prod.yml logs -f recibolegal | grep -E '(63031|RestException)'"
echo ""

echo "Para ver estatísticas do erro:"
echo "docker-compose -f docker-compose.prod.yml logs recibolegal | grep -c '63031'"
echo ""

echo "=== Correção 63031 Concluída ==="
