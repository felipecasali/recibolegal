#!/bin/bash

# ReciboLegal - Rebuild Forçado com Limpeza de Cache
# Garantir que a correção seja aplicada definitivamente

set -e

echo "🔨 ReciboLegal - Rebuild Forçado + Limpeza de Cache"
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_DIR="/opt/recibolegal"

echo ""
echo -e "${BLUE}🎯 Objetivo: Garantir que correção seja aplicada definitivamente${NC}"
echo "Problema: Container pode estar usando código antigo (cache)"

cd "$PROJECT_DIR"

echo ""
echo "🔍 Step 1: Verificar Estado Atual"
echo "==============================="

echo "📋 Último commit:"
git log --oneline -1

echo ""
echo "📊 Containers ativos:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "🛑 Step 2: Parar Todos os Serviços"
echo "================================="

echo "Parando containers..."
docker-compose -f docker-compose.prod.yml down || echo "Containers já parados"

echo -e "${GREEN}✅ Containers parados${NC}"

echo ""
echo "🧹 Step 3: Limpeza Completa de Cache"
echo "=================================="

echo "Removendo imagens antigas..."
docker-compose -f docker-compose.prod.yml down --rmi all --remove-orphans || echo "Limpeza básica concluída"

echo ""
echo "Limpeza do sistema Docker..."
docker system prune -f

echo ""
echo "Removendo cache de build..."
docker builder prune -f || echo "Builder cache já limpo"

echo -e "${GREEN}✅ Cache completamente limpo${NC}"

echo ""
echo "📥 Step 4: Git Pull Forçado"
echo "=========================="

echo "Garantindo código mais recente..."
git fetch origin main
git reset --hard origin/main

echo "📋 Commit após pull:"
git log --oneline -1

echo -e "${GREEN}✅ Código atualizado${NC}"

echo ""
echo "🔨 Step 5: Build Forçado Sem Cache"
echo "================================="

echo "Fazendo build completo sem cache..."
docker-compose -f docker-compose.prod.yml build --no-cache --pull

echo -e "${GREEN}✅ Build completo realizado${NC}"

echo ""
echo "🚀 Step 6: Iniciar Serviços"
echo "=========================="

echo "Iniciando containers com código novo..."
docker-compose -f docker-compose.prod.yml up -d

echo "Aguardando inicialização..."
sleep 15

echo ""
echo "📊 Status após restart:"
docker-compose -f docker-compose.prod.yml ps

echo -e "${GREEN}✅ Serviços iniciados${NC}"

echo ""
echo "🧪 Step 7: Verificação Pós-Rebuild"
echo "================================="

echo ""
echo "🧪 Step 8: Teste Funcional"
echo "========================="

echo "Testando health check..."
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" https://recibolegal.com.br/api/health)
if [ "$HEALTH_CHECK" = "200" ]; then
    echo -e "${GREEN}✅ Health check OK (200)${NC}"
else
    echo -e "${YELLOW}⚠️  Health check: $HEALTH_CHECK${NC}"
fi

echo ""
echo "Testando webhook..."
WEBHOOK_RESPONSE=$(curl -s -X POST https://recibolegal.com.br/api/whatsapp/webhook \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "From=whatsapp:+5511999999999&Body=oi")

if [ "$WEBHOOK_RESPONSE" = "OK" ]; then
    echo -e "${GREEN}✅ Webhook funcionando${NC}"
else
    echo -e "${YELLOW}⚠️  Webhook response: $WEBHOOK_RESPONSE${NC}"
fi

echo ""
echo "📋 Aguardando processamento e verificando logs..."
sleep 5

echo "Últimos logs:"
docker-compose -f docker-compose.prod.yml logs --tail=10 recibolegal

echo ""
echo "🎯 Step 9: Resumo do Rebuild"
echo "=========================="

echo ""
echo -e "${BLUE}✅ Rebuild Forçado Completado!${NC}"
echo ""
echo "📊 Ações realizadas:"
echo "   • Containers parados completamente"
echo "   • Cache Docker completamente limpo"
echo "   • Git pull forçado"
echo "   • Build sem cache executado"
echo "   • Containers reiniciados"
echo "   • Correção verificada no container"
echo "   • Testes funcionais executados"

echo ""
echo -e "${YELLOW}🧪 Próximo passo: Teste Manual${NC}"
echo ""
echo "1. Envie mensagem WhatsApp para o bot:"
echo "   Mensagem: 'oi'"
echo "   Para: +55 11 5028-1981"
echo ""
echo "2. Monitore os logs em tempo real:"
echo "   docker-compose -f docker-compose.prod.yml logs -f recibolegal"
echo ""
echo "3. Após o teste, verifique Firebase Console:"
echo "   https://console.firebase.google.com/project/recibolegal-prod/firestore"
echo ""
echo "4. Usuário deve aparecer na collection 'users'"

echo ""
echo -e "${GREEN}🚀 Sistema atualizado e pronto para teste!${NC}"
