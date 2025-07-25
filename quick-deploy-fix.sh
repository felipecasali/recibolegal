#!/bin/bash

# ReciboLegal - Deploy Rápido da Correção
# Comando correto para seu ambiente

echo "🚀 Deploy Rápido - Correção Auto-criação de Usuário"
echo "=================================================="

cd /opt/recibolegal

echo "📥 1. Git pull..."
git pull origin main

echo "🔄 2. Restart do serviço..."
docker-compose -f docker-compose.prod.yml restart

echo "⏳ 3. Aguardando restart..."
sleep 10

echo "🧪 4. Teste rápido..."
curl -s -o /dev/null -w "Status: %{http_code}\n" https://recibolegal.com.br/api/health

echo ""
echo "✅ Deploy concluído!"
echo ""
echo "📋 Para monitorar:"
echo "   docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "🧪 Para testar WhatsApp:"
echo "   Envie 'oi' para o bot e verifique se não há mais erro"
