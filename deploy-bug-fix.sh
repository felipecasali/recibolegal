#!/bin/bash

# ReciboLegal - Deploy Bug Fix to Production
# Aplicar correção do bug receiptsThisMonth no servidor

set -e

echo "🚀 ReciboLegal - Deploy da Correção do Bug"
echo "=========================================="

PROJECT_DIR="/opt/recibolegal"

echo ""
echo "📋 Aplicando correção do bug receiptsThisMonth..."
echo "   Problema: Cannot read properties of null (reading 'receiptsThisMonth')"
echo "   Correção: Verificação de null + campo correto (currentMonthUsage)"

cd "$PROJECT_DIR"

echo ""
echo "⬇️ Baixando correção do GitHub..."
git pull origin main

echo ""
echo "🔄 Reiniciando aplicação..."
docker-compose -f docker-compose.prod.yml restart

echo ""
echo "⏳ Aguardando aplicação inicializar..."
sleep 15

echo ""
echo "🏥 Verificando saúde da aplicação..."
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://recibolegal.com.br/api/health || echo "000")

if [ "$HEALTH_STATUS" = "200" ]; then
    echo "✅ Aplicação rodando corretamente!"
else
    echo "❌ Problema na aplicação (status: $HEALTH_STATUS)"
fi

echo ""
echo "📊 Status dos containers:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "✅ Deploy da correção concluído!"
echo ""
echo "🧪 Para testar:"
echo "   1. Envie 'oi' no WhatsApp para o bot"
echo "   2. Complete o fluxo até a data"
echo "   3. Verifique se não há mais erros de receiptsThisMonth"
echo ""
echo "📋 Para monitorar:"
echo "   docker-compose -f docker-compose.prod.yml logs -f app"
