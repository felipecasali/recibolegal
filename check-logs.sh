#!/bin/bash

# Script para verificar logs de produção e diagnosticar problemas de geração de recibo
echo "=== Diagnóstico de Logs - ReciboLegal ==="
echo "Data/Hora: $(date)"
echo ""

# Verificar se estamos no servidor ou localmente
if command -v docker >/dev/null 2>&1 && docker ps >/dev/null 2>&1; then
    echo "🔍 Executando no servidor de produção"
    
    # Verificar se os containers estão rodando
    echo ""
    echo "📦 Status dos Containers:"
    docker-compose -f docker-compose.prod.yml ps
    
    echo ""
    echo "🚨 Logs de Erro Recentes (últimas 50 linhas):"
    docker-compose -f docker-compose.prod.yml logs --tail=50 recibolegal | grep -E "(error|Error|ERROR|fail|Fail|FAIL|exception|Exception|EXCEPTION)" || echo "Nenhum erro óbvio encontrado nos logs recentes"
    
    echo ""
    echo "📊 Logs Gerais Recentes (últimas 20 linhas):"
    docker-compose -f docker-compose.prod.yml logs --tail=20 recibolegal
    
    echo ""
    echo "🔄 Status de Saúde dos Serviços:"
    # Testar endpoint de saúde se existir
    if curl -s -o /dev/null -w "%{http_code}" https://recibolegal.com.br/health 2>/dev/null | grep -q "200"; then
        echo "✅ Endpoint /health respondendo"
    else
        echo "⚠️  Endpoint /health não disponível ou com problema"
    fi
    
    # Testar endpoint principal
    response=$(curl -s -o /dev/null -w "%{http_code}" https://recibolegal.com.br/ 2>/dev/null)
    echo "📄 Página principal: HTTP $response"
    
    # Testar webhook
    webhook_response=$(curl -s -o /dev/null -w "%{http_code}" -X POST https://recibolegal.com.br/api/whatsapp/webhook 2>/dev/null)
    echo "🔗 Webhook WhatsApp: HTTP $webhook_response"
    
    echo ""
    echo "🔍 Procurando Erros Específicos de Geração de Recibo:"
    docker-compose -f docker-compose.prod.yml logs recibolegal | grep -i -E "(recibo|receipt|generate|pdf|error)" | tail -10 || echo "Nenhum log específico de recibo encontrado"
    
    echo ""
    echo "💾 Uso de Memória e CPU:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" $(docker-compose -f docker-compose.prod.yml ps -q) 2>/dev/null || echo "Não foi possível obter estatísticas de recursos"
    
    echo ""
    echo "📁 Verificando Volumes e Armazenamento:"
    docker volume ls | grep recibolegal || echo "Nenhum volume específico encontrado"
    
else
    echo "🏠 Executando localmente - conectando ao servidor remoto para verificar logs"
    echo ""
    echo "Para verificar logs remotamente, execute no servidor:"
    echo "ssh root@recibolegal.com.br"
    echo "cd /path/to/recibolegal"
    echo "./check-logs.sh"
    echo ""
    echo "Ou execute comandos diretos:"
    echo "docker-compose -f docker-compose.prod.yml logs --tail=50 recibolegal"
fi

echo ""
echo "=== Comandos Úteis para Debug ==="
echo "Ver logs em tempo real:"
echo "docker-compose -f docker-compose.prod.yml logs -f recibolegal"
echo ""
echo "Ver logs específicos por tempo:"
echo "docker-compose -f docker-compose.prod.yml logs --since=1h recibolegal"
echo ""
echo "Reiniciar apenas a aplicação:"
echo "docker-compose -f docker-compose.prod.yml restart recibolegal"
echo ""
echo "=== Fim do Diagnóstico ==="
