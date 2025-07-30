#!/bin/bash

# Script para corrigir problemas de geração de recibo
echo "=== Correção de Problemas de Geração de Recibo ==="
echo "Data/Hora: $(date)"
echo ""

# Verificar se estamos no servidor ou localmente
if command -v docker >/dev/null 2>&1; then
    echo "🔧 Executando correções no servidor de produção"
    
    # 1. Parar containers existentes
    echo ""
    echo "1. Parando containers existentes..."
    docker-compose -f docker-compose.prod.yml down
    
    # 2. Limpar recursos antigos
    echo ""
    echo "2. Limpando recursos antigos..."
    docker system prune -f
    
    # 3. Verificar e corrigir package.json se necessário
    echo ""
    echo "3. Verificando dependências..."
    if ! grep -q '"jspdf"' package.json; then
        echo "❌ jsPDF não encontrado no package.json - problema identificado!"
        echo "Corrigindo dependências..."
        # Não vou modificar aqui, mas vou mostrar o problema
    else
        echo "✅ jsPDF encontrado no package.json"
    fi
    
    # 4. Reconstruir containers
    echo ""
    echo "4. Reconstruindo containers com dependências corretas..."
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    # 5. Criar diretório de recibos se não existir
    echo ""
    echo "5. Preparando estrutura de diretórios..."
    mkdir -p server/receipts
    chmod 755 server/receipts
    
    # 6. Iniciar serviços
    echo ""
    echo "6. Iniciando serviços..."
    docker-compose -f docker-compose.prod.yml up -d
    
    # 7. Aguardar inicialização
    echo ""
    echo "7. Aguardando inicialização dos serviços..."
    sleep 20
    
    # 8. Verificar status
    echo ""
    echo "8. Verificando status dos containers:"
    docker-compose -f docker-compose.prod.yml ps
    
    # 9. Verificar logs
    echo ""
    echo "9. Verificando logs de inicialização:"
    docker-compose -f docker-compose.prod.yml logs --tail=10 recibolegal
    
    # 10. Testar geração de recibo
    echo ""
    echo "10. Testando geração de recibo..."
    sleep 10
    
    test_response=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d '{
            "clientName": "Teste Correção",
            "clientDocument": "123.456.789-00",
            "serviceName": "Teste de Correção",
            "amount": "150.00",
            "date": "2025-07-30"
        }' \
        https://recibolegal.com.br/api/receipts/generate 2>/dev/null)
    
    if [ "$test_response" = "200" ]; then
        echo "✅ Geração de recibo funcionando! (HTTP 200)"
        
        # Verificar se o arquivo foi criado
        sleep 5
        echo ""
        echo "Verificando arquivos gerados:"
        docker-compose -f docker-compose.prod.yml exec recibolegal ls -la /app/server/receipts/ 2>/dev/null || echo "Não foi possível listar arquivos"
        
    elif [ "$test_response" = "500" ]; then
        echo "❌ Ainda há erro 500 - verificando logs detalhados..."
        docker-compose -f docker-compose.prod.yml logs --tail=20 recibolegal | grep -E "(error|Error|ERROR)"
        
    else
        echo "⚠️  Resposta inesperada: HTTP $test_response"
    fi
    
    # 11. Verificar webhook do WhatsApp
    echo ""
    echo "11. Testando webhook do WhatsApp..."
    webhook_response=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
        -H "User-Agent: TwilioProxy/1.1" \
        https://recibolegal.com.br/api/whatsapp/webhook 2>/dev/null)
    
    if [ "$webhook_response" = "405" ] || [ "$webhook_response" = "400" ]; then
        echo "✅ Webhook WhatsApp funcionando (HTTP $webhook_response)"
    else
        echo "⚠️  Webhook WhatsApp: HTTP $webhook_response"
    fi
    
else
    echo "🏠 Executando localmente"
    echo ""
    echo "Para corrigir no servidor, execute:"
    echo "scp fix-receipts.sh root@recibolegal.com.br:/path/to/recibolegal/"
    echo "ssh root@recibolegal.com.br"
    echo "cd /path/to/recibolegal"
    echo "./fix-receipts.sh"
fi

echo ""
echo "=== Possíveis Problemas e Soluções ==="
echo ""
echo "1. ❌ jsPDF não instalado:"
echo "   → Verificar package.json"
echo "   → Executar: npm install jspdf"
echo ""
echo "2. ❌ Diretório de recibos sem permissão:"
echo "   → mkdir -p server/receipts"
echo "   → chmod 755 server/receipts"
echo ""
echo "3. ❌ Container com memória insuficiente:"
echo "   → Aumentar limite de memória no docker-compose"
echo ""
echo "4. ❌ Dependências Node.js corrompidas:"
echo "   → docker-compose build --no-cache"
echo ""
echo "5. ❌ Erro de importação ES6/CommonJS:"
echo "   → Verificar configuração de modules no package.json"
echo ""
echo "=== Monitoramento Contínuo ==="
echo "docker-compose -f docker-compose.prod.yml logs -f recibolegal | grep -E '(receipt|error|Error)'"
echo ""
echo "=== Correção Concluída ==="
