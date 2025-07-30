#!/bin/bash

# Script para capturar logs de produção via SSH
echo "=== Análise de Logs de Produção - ReciboLegal ==="
echo "Data/Hora: $(date)"
echo ""

SERVER="recibolegal.com.br"
USER="root"
PROJECT_PATH="/opt/recibolegal"

echo "🔍 Conectando ao servidor de produção via SSH..."
echo "Servidor: $SERVER"
echo "Usuário: $USER"
echo ""

# Capturar logs do container recibolegal
echo "📋 Capturando últimas 250 linhas dos logs do container..."
echo "Comando: ssh $USER@$SERVER 'cd $PROJECT_PATH && docker-compose -f docker-compose.prod.yml logs --tail=250 recibolegal'"
echo ""
echo "====== INÍCIO DOS LOGS ======"

ssh $USER@$SERVER "cd $PROJECT_PATH && docker-compose -f docker-compose.prod.yml logs --tail=250 recibolegal" 2>/dev/null

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Erro ao conectar via SSH ou executar comando"
    echo ""
    echo "Tentativas alternativas:"
    echo ""
    
    # Tentar diferentes caminhos
    echo "🔄 Tentando caminho alternativo /app/recibolegal..."
    ssh $USER@$SERVER "cd /app/recibolegal && docker-compose -f docker-compose.prod.yml logs --tail=250 recibolegal" 2>/dev/null
    
    if [ $? -ne 0 ]; then
        echo "🔄 Tentando caminho alternativo /home/recibolegal..."
        ssh $USER@$SERVER "cd /home/recibolegal && docker-compose -f docker-compose.prod.yml logs --tail=250 recibolegal" 2>/dev/null
        
        if [ $? -ne 0 ]; then
            echo ""
            echo "❌ Não foi possível encontrar o projeto nos caminhos testados"
            echo ""
            echo "Para executar manualmente:"
            echo "1. ssh $USER@$SERVER"
            echo "2. find / -name 'docker-compose.prod.yml' 2>/dev/null"
            echo "3. cd [caminho_encontrado]"
            echo "4. docker-compose -f docker-compose.prod.yml logs --tail=250 recibolegal"
        fi
    fi
fi

echo ""
echo "====== FIM DOS LOGS ======"
echo ""

echo "🔍 Verificando também status dos containers..."
ssh $USER@$SERVER "cd $PROJECT_PATH && docker-compose -f docker-compose.prod.yml ps" 2>/dev/null || \
ssh $USER@$SERVER "cd /app/recibolegal && docker-compose -f docker-compose.prod.yml ps" 2>/dev/null || \
ssh $USER@$SERVER "cd /home/recibolegal && docker-compose -f docker-compose.prod.yml ps" 2>/dev/null

echo ""
echo "🧪 Testando endpoint de geração de recibo em tempo real..."
test_response=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d '{
        "clientName": "Teste SSH Debug",
        "clientDocument": "123.456.789-00",
        "serviceName": "Teste via SSH",
        "amount": "99.99",
        "date": "2025-07-30"
    }' \
    https://recibolegal.com.br/api/receipts/generate 2>/dev/null)

echo "Resposta do endpoint: HTTP $test_response"

if [ "$test_response" = "500" ]; then
    echo ""
    echo "❌ ERRO 500 CONFIRMADO - Capturando logs em tempo real..."
    echo "Executando teste e capturando logs simultaneamente..."
    
    # Capturar logs em tempo real durante o teste
    ssh $USER@$SERVER "cd $PROJECT_PATH && timeout 10 docker-compose -f docker-compose.prod.yml logs -f recibolegal" 2>/dev/null &
    
    sleep 2
    
    # Fazer nova requisição para gerar logs
    curl -X POST \
        -H "Content-Type: application/json" \
        -d '{
            "clientName": "Debug Erro 500",
            "clientDocument": "000.000.000-00",
            "serviceName": "Debug Test",
            "amount": "1.00",
            "date": "2025-07-30"
        }' \
        https://recibolegal.com.br/api/receipts/generate 2>/dev/null
    
    sleep 3
fi

echo ""
echo "=== Comandos para execução manual ==="
echo "ssh $USER@$SERVER"
echo "cd $PROJECT_PATH  # ou o caminho correto"
echo "docker-compose -f docker-compose.prod.yml logs --tail=50 recibolegal"
echo "docker-compose -f docker-compose.prod.yml logs -f recibolegal  # tempo real"
echo ""
echo "=== Análise Concluída ==="
