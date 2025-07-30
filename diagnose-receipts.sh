#!/bin/bash

# Script para diagnosticar problemas específicos de geração de recibo
echo "=== Diagnóstico de Geração de Recibo - ReciboLegal ==="
echo "Data/Hora: $(date)"
echo ""

# Verificar se estamos no servidor ou localmente
if command -v docker >/dev/null 2>&1 && docker ps >/dev/null 2>&1; then
    echo "🔍 Executando no servidor de produção"
    
    # 1. Verificar containers
    echo ""
    echo "📦 Status dos Containers:"
    docker-compose -f docker-compose.prod.yml ps
    
    # 2. Verificar logs específicos de geração de recibo
    echo ""
    echo "📄 Logs Específicos de Geração de Recibo (últimas 30 linhas):"
    docker-compose -f docker-compose.prod.yml logs --tail=30 recibolegal | grep -E "(receipt|recibo|generate|pdf|jsPDF)" || echo "Nenhum log específico de recibo encontrado"
    
    # 3. Verificar erros relacionados a dependências
    echo ""
    echo "📚 Erros de Dependências (Node.js, jsPDF, etc.):"
    docker-compose -f docker-compose.prod.yml logs recibolegal | grep -E "(Cannot find module|Module not found|jspdf|jsPDF|Error.*require)" | tail -10 || echo "Nenhum erro de dependência encontrado"
    
    # 4. Verificar erros HTTP 500
    echo ""
    echo "🚨 Erros HTTP 500 Recentes:"
    docker-compose -f docker-compose.prod.yml logs --tail=50 recibolegal | grep -E "(500|Internal Server Error|Error.*receipt|Error.*generate)" || echo "Nenhum erro 500 recente encontrado"
    
    # 5. Verificar diretório de recibos
    echo ""
    echo "📁 Verificando Diretório de Recibos:"
    docker-compose -f docker-compose.prod.yml exec recibolegal ls -la /app/server/receipts 2>/dev/null || echo "Diretório de recibos não acessível ou não existe"
    
    # 6. Verificar dependências do Node.js
    echo ""
    echo "📦 Verificando Dependências Node.js:"
    docker-compose -f docker-compose.prod.yml exec recibolegal npm list jspdf 2>/dev/null || echo "jsPDF não encontrado ou problema com dependências"
    
    # 7. Testar endpoint de geração de recibo
    echo ""
    echo "🧪 Testando Endpoint de Geração de Recibo:"
    test_response=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d '{
            "clientName": "Teste Cliente",
            "clientDocument": "123.456.789-00",
            "serviceName": "Teste de Serviço",
            "amount": "100.00",
            "date": "2025-07-30"
        }' \
        https://recibolegal.com.br/api/receipts/generate 2>/dev/null)
    
    if [ "$test_response" = "200" ]; then
        echo "✅ Endpoint de geração respondeu com sucesso (HTTP 200)"
    elif [ "$test_response" = "500" ]; then
        echo "❌ Endpoint retornando erro interno (HTTP 500) - PROBLEMA CONFIRMADO"
    else
        echo "⚠️  Endpoint retornou: HTTP $test_response"
    fi
    
    # 8. Verificar espaço em disco
    echo ""
    echo "💾 Uso de Espaço em Disco:"
    docker-compose -f docker-compose.prod.yml exec recibolegal df -h /app 2>/dev/null || echo "Não foi possível verificar espaço em disco"
    
    # 9. Verificar memória disponível
    echo ""
    echo "🧠 Uso de Memória do Container:"
    docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}\t{{.MemPerc}}" $(docker-compose -f docker-compose.prod.yml ps -q recibolegal) 2>/dev/null || echo "Não foi possível obter estatísticas de memória"
    
    # 10. Logs de erro mais recentes com stack traces
    echo ""
    echo "🔍 Stack Traces de Erros Recentes:"
    docker-compose -f docker-compose.prod.yml logs --since=1h recibolegal | grep -A 10 -B 2 "Error.*receipt\|Error.*generate\|TypeError\|ReferenceError" | tail -20 || echo "Nenhum stack trace encontrado na última hora"
    
else
    echo "🏠 Executando localmente - Simulando teste de geração de recibo"
    echo ""
    
    # Teste local do endpoint
    echo "🧪 Testando Endpoint de Produção:"
    test_response=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d '{
            "clientName": "Teste Cliente Local",
            "clientDocument": "123.456.789-00",
            "serviceName": "Teste de Serviço Local",
            "amount": "100.00",
            "date": "2025-07-30"
        }' \
        https://recibolegal.com.br/api/receipts/generate 2>/dev/null)
    
    echo "Resposta do servidor: HTTP $test_response"
    
    if [ "$test_response" = "500" ]; then
        echo ""
        echo "❌ PROBLEMA CONFIRMADO: Servidor retornando erro 500"
        echo ""
        echo "Possíveis causas:"
        echo "1. ❌ Dependência jsPDF com problema"
        echo "2. ❌ Erro na função de geração de PDF"
        echo "3. ❌ Problema de permissões no diretório de recibos"
        echo "4. ❌ Erro de conexão com Firebase/Analytics"
        echo "5. ❌ Falta de espaço em disco"
        echo ""
        echo "Execute no servidor para diagnóstico detalhado:"
        echo "ssh root@recibolegal.com.br"
        echo "cd /path/to/recibolegal"
        echo "./diagnose-receipts.sh"
    fi
fi

echo ""
echo "=== Comandos Úteis para Correção ==="
echo ""
echo "📋 Ver logs em tempo real (receipts):"
echo "docker-compose -f docker-compose.prod.yml logs -f recibolegal | grep -i receipt"
echo ""
echo "🔄 Reiniciar apenas o container da aplicação:"
echo "docker-compose -f docker-compose.prod.yml restart recibolegal"
echo ""
echo "🔧 Reconstruir container (se problema de dependência):"
echo "docker-compose -f docker-compose.prod.yml down"
echo "docker-compose -f docker-compose.prod.yml build --no-cache recibolegal"
echo "docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo "📁 Verificar diretório de recibos:"
echo "docker-compose -f docker-compose.prod.yml exec recibolegal ls -la /app/server/receipts"
echo ""
echo "🧪 Teste manual de geração:"
echo "curl -X POST -H \"Content-Type: application/json\" \\"
echo "  -d '{\"clientName\":\"Teste\",\"clientDocument\":\"123456789\",\"serviceName\":\"Teste\",\"amount\":\"100\",\"date\":\"2025-07-30\"}' \\"
echo "  https://recibolegal.com.br/api/receipts/generate"
echo ""
echo "=== Fim do Diagnóstico ==="
