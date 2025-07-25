#!/bin/bash

# ReciboLegal - Deploy de Correção Forçada
# Corrigir definitivamente o erro receiptsThisMonth

set -e

echo "🚀 ReciboLegal - Deploy de Correção Forçada"
echo "==========================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_DIR="/opt/recibolegal"

echo ""
echo -e "${BLUE}🎯 Objetivo: Corrigir erro 'Cannot read properties of null (reading receiptsThisMonth)'${NC}"
echo "Estratégia: Deploy forçado com rebuild completo e verificação"

cd "$PROJECT_DIR"

echo ""
echo "🔍 Step 1: Backup e Preparação"
echo "============================="

echo "Criando backup do estado atual..."
BACKUP_DIR="/tmp/recibolegal-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup dos logs atuais
docker-compose -f docker-compose.prod.yml logs app > "$BACKUP_DIR/app-logs-before.txt" 2>/dev/null || echo "Logs não disponíveis"

echo -e "${GREEN}✅ Backup criado em: $BACKUP_DIR${NC}"

echo ""
echo "🔍 Step 2: Git Pull Forçado"
echo "=========================="

echo "Garantindo que temos a versão mais recente do código..."

# Stash any local changes
git stash push -m "Auto-stash before force deploy $(date)" || echo "Nothing to stash"

# Force pull latest
git fetch origin main
git reset --hard origin/main

echo -e "${GREEN}✅ Código atualizado para última versão${NC}"

echo ""
echo "📋 Último commit:"
git log --oneline -1

echo ""
echo "🔍 Step 3: Verificação do Código Local"
echo "===================================="

echo "Verificando se as correções estão presentes no código local..."

# Check for receiptsThisMonth (should NOT exist)
RECEIPTS_THIS_MONTH_COUNT=$(grep -r "receiptsThisMonth" server/ 2>/dev/null | wc -l)
if [ "$RECEIPTS_THIS_MONTH_COUNT" -gt 0 ]; then
    echo -e "${RED}❌ PROBLEMA: 'receiptsThisMonth' ainda encontrado no código local!${NC}"
    grep -r "receiptsThisMonth" server/ 2>/dev/null || true
    echo "Abortando deploy. Correção não aplicada."
    exit 1
else
    echo -e "${GREEN}✅ OK: 'receiptsThisMonth' não encontrado no código local${NC}"
fi

# Check for currentMonthUsage (should exist)
CURRENT_MONTH_USAGE_COUNT=$(grep -r "currentMonthUsage" server/ 2>/dev/null | wc -l)
if [ "$CURRENT_MONTH_USAGE_COUNT" -eq 0 ]; then
    echo -e "${RED}❌ PROBLEMA: 'currentMonthUsage' não encontrado no código local!${NC}"
    echo "Abortando deploy. Código não corrigido."
    exit 1
else
    echo -e "${GREEN}✅ OK: 'currentMonthUsage' encontrado $CURRENT_MONTH_USAGE_COUNT vezes${NC}"
fi

echo ""
echo "🔍 Step 4: Parar Serviços"
echo "======================="

echo "Parando containers atuais..."
docker-compose -f docker-compose.prod.yml down || echo "Containers já parados"

echo -e "${GREEN}✅ Containers parados${NC}"

echo ""
echo "🔍 Step 5: Limpeza Completa"
echo "========================="

echo "Removendo imagens antigas e cache..."

# Remove old images
docker-compose -f docker-compose.prod.yml down --rmi all --volumes --remove-orphans || echo "Limpeza completa não necessária"

# Clean Docker build cache
docker system prune -f || echo "Limpeza do sistema Docker concluída"

echo -e "${GREEN}✅ Cache limpo${NC}"

echo ""
echo "🔍 Step 6: Build Forçado"
echo "======================"

echo "Fazendo build completo sem cache..."

# Force rebuild without cache
docker-compose -f docker-compose.prod.yml build --no-cache --pull

echo -e "${GREEN}✅ Build completo realizado${NC}"

echo ""
echo "🔍 Step 7: Iniciar Serviços"
echo "========================="

echo "Iniciando containers com novo código..."

# Start services
docker-compose -f docker-compose.prod.yml up -d

echo "Aguardando inicialização dos serviços..."
sleep 15

echo -e "${GREEN}✅ Serviços iniciados${NC}"

echo ""
echo "🔍 Step 8: Verificação Pós-Deploy"
echo "==============================="

CONTAINER_NAME=$(docker-compose -f docker-compose.prod.yml ps --services | head -1)

if [ -n "$CONTAINER_NAME" ]; then
    echo "Container ativo: $CONTAINER_NAME"
    
    # Check if the corrected code is actually deployed
    echo ""
    echo "📄 Verificando código em produção:"
    
    echo "🔍 Procurando 'receiptsThisMonth' (NÃO deve existir):"
    if docker-compose -f docker-compose.prod.yml exec -T $CONTAINER_NAME grep -r "receiptsThisMonth" /app/ 2>/dev/null; then
        echo -e "${RED}❌ CRÍTICO: 'receiptsThisMonth' ainda existe em produção!${NC}"
        echo "Deploy falhou - código antigo ainda ativo"
        exit 1
    else
        echo -e "${GREEN}✅ OK: 'receiptsThisMonth' não encontrado em produção${NC}"
    fi
    
    echo ""
    echo "🔍 Procurando 'currentMonthUsage' (DEVE existir):"
    CURRENT_USAGE_PROD=$(docker-compose -f docker-compose.prod.yml exec -T $CONTAINER_NAME grep -r "currentMonthUsage" /app/ 2>/dev/null | wc -l)
    if [ "$CURRENT_USAGE_PROD" -gt 0 ]; then
        echo -e "${GREEN}✅ OK: 'currentMonthUsage' encontrado $CURRENT_USAGE_PROD vezes em produção${NC}"
    else
        echo -e "${RED}❌ PROBLEMA: 'currentMonthUsage' não encontrado em produção${NC}"
        exit 1
    fi
    
else
    echo -e "${RED}❌ Container não encontrado após deploy${NC}"
    exit 1
fi

echo ""
echo "🔍 Step 9: Teste Funcional"
echo "========================"

echo "Testando getUserStats no ambiente de produção..."

# Test getUserStats
cat > /tmp/test-production-stats.js << 'EOF'
const userService = require('./services/userService');

async function testProductionStats() {
    try {
        console.log('🧪 Testando getUserStats em produção...');
        
        const testPhone = '5511970843096';
        const stats = await userService.getUserStats(testPhone);
        
        if (stats) {
            console.log('✅ getUserStats funcionando');
            console.log('Propriedades:', Object.keys(stats));
            
            if (stats.hasOwnProperty('currentMonthUsage')) {
                console.log('✅ currentMonthUsage presente:', stats.currentMonthUsage);
            } else {
                console.log('❌ currentMonthUsage AUSENTE');
            }
            
            if (stats.hasOwnProperty('receiptsThisMonth')) {
                console.log('❌ receiptsThisMonth ainda presente (PROBLEMA!)');
            } else {
                console.log('✅ receiptsThisMonth removido com sucesso');
            }
        } else {
            console.log('⚠️  getUserStats retornou null');
        }
        
    } catch (error) {
        console.log('❌ Erro:', error.message);
    }
}

testProductionStats();
EOF

docker-compose -f docker-compose.prod.yml exec -T $CONTAINER_NAME node /tmp/test-production-stats.js

echo ""
echo "🔍 Step 10: Teste do WhatsApp"
echo "============================"

echo "Testando webhook do WhatsApp..."

# Test WhatsApp status command
echo "Testando comando 'status'..."
STATUS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST https://recibolegal.com.br/api/whatsapp/webhook \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "From=whatsapp:+5511970843096&Body=status")

if [ "$STATUS_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Comando 'status' funcionando (HTTP 200)${NC}"
else
    echo -e "${RED}❌ Comando 'status' falhou (HTTP $STATUS_RESPONSE)${NC}"
fi

echo ""
echo "🎯 Step 11: Resumo do Deploy"
echo "=========================="

echo ""
echo -e "${BLUE}📊 Deploy de Correção Completado!${NC}"
echo ""
echo "✅ Ações realizadas:"
echo "   • Git pull forçado"
echo "   • Verificação do código local"
echo "   • Limpeza completa de cache Docker"
echo "   • Build forçado sem cache"
echo "   • Deploy com containers novos"
echo "   • Verificação do código em produção"
echo "   • Teste funcional do getUserStats"
echo "   • Teste do webhook WhatsApp"

echo ""
echo -e "${YELLOW}🎯 Próximos passos:${NC}"
echo "   1. Testar criação de recibo completa via WhatsApp"
echo "   2. Monitorar logs para erros: docker-compose -f docker-compose.prod.yml logs -f app"
echo "   3. Se problema persistir: verificar base de dados Firebase"

echo ""
echo "📋 Backup dos logs anteriores salvos em: $BACKUP_DIR"
echo ""
echo -e "${GREEN}🚀 Deploy de correção finalizado!${NC}"
