#!/bin/bash

# ReciboLegal - Diagnóstico Completo do Erro receiptsThisMonth
# Analisar exatamente onde e por que o erro está ocorrendo

set -e

echo "🔍 ReciboLegal - Diagnóstico do Erro receiptsThisMonth"
echo "===================================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_DIR="/opt/recibolegal"

echo ""
echo -e "${BLUE}📋 Análise do Erro: Cannot read properties of null (reading 'receiptsThisMonth')${NC}"
echo "Erro ocorre na linha 229 do arquivo /app/routes/whatsapp.js"
echo "Momento: Ao responder SIM para gerar recibo"

cd "$PROJECT_DIR"

echo ""
echo "🔍 Step 1: Verificar Código Atual em Produção"
echo "============================================="

echo "Verificando conteúdo atual do arquivo whatsapp.js..."

# Check if container is running
CONTAINER_NAME=$(docker-compose -f docker-compose.prod.yml ps --services | head -1)

if [ -n "$CONTAINER_NAME" ]; then
    echo -e "${GREEN}✅ Container encontrado: $CONTAINER_NAME${NC}"
    
    # Check the actual code in production container
    echo ""
    echo "📄 Código na linha 229 em produção:"
    docker-compose -f docker-compose.prod.yml exec -T $CONTAINER_NAME sed -n '225,235p' /app/routes/whatsapp.js || echo "❌ Não foi possível ler o arquivo"
    
    echo ""
    echo "🔍 Procurando por 'receiptsThisMonth' no arquivo em produção:"
    docker-compose -f docker-compose.prod.yml exec -T $CONTAINER_NAME grep -n "receiptsThisMonth" /app/routes/whatsapp.js || echo "✅ 'receiptsThisMonth' não encontrado (isso é bom)"
    
    echo ""
    echo "🔍 Procurando por 'currentMonthUsage' no arquivo em produção:"
    docker-compose -f docker-compose.prod.yml exec -T $CONTAINER_NAME grep -n "currentMonthUsage" /app/routes/whatsapp.js || echo "❌ 'currentMonthUsage' não encontrado (isso é ruim)"
    
else
    echo -e "${RED}❌ Container não encontrado${NC}"
    exit 1
fi

echo ""
echo "🔍 Step 2: Verificar UserService em Produção"
echo "=========================================="

echo "Verificando método getUserStats no userService..."

echo ""
echo "📄 Código do getUserStats em produção:"
docker-compose -f docker-compose.prod.yml exec -T $CONTAINER_NAME sed -n '289,310p' /app/services/userService.js || echo "❌ Não foi possível ler userService"

echo ""
echo "🔍 Procurando por 'receiptsThisMonth' no userService:"
docker-compose -f docker-compose.prod.yml exec -T $CONTAINER_NAME grep -n "receiptsThisMonth" /app/services/userService.js || echo "✅ 'receiptsThisMonth' não encontrado no userService"

echo ""
echo "🔍 Step 3: Análise dos Logs de Erro"
echo "================================="

echo "Analisando logs recentes para entender o contexto do erro..."

# Get recent logs with context around the error
echo ""
echo "📋 Logs recentes contendo o erro:"
docker-compose -f docker-compose.prod.yml logs --tail=200 app | grep -A 5 -B 5 "receiptsThisMonth" || echo "❌ Erro não encontrado nos logs recentes"

echo ""
echo "📋 Logs de erros gerais:"
docker-compose -f docker-compose.prod.yml logs --tail=100 app | grep -i "error\|exception\|failed" | tail -10

echo ""
echo "🔍 Step 4: Teste de Funcionamento do getUserStats"
echo "=============================================="

echo "Testando diretamente o método getUserStats..."

# Create a test script to run inside the container
cat > /tmp/test-getstats.js << 'EOF'
const userService = require('./services/userService');

async function testGetUserStats() {
    try {
        console.log('🧪 Testando getUserStats...');
        
        const testPhone = '5511970843096';
        console.log('Telefone de teste:', testPhone);
        
        const stats = await userService.getUserStats(testPhone);
        
        console.log('✅ Resultado do getUserStats:');
        console.log(JSON.stringify(stats, null, 2));
        
        if (stats) {
            console.log('\n🔍 Propriedades do objeto stats:');
            Object.keys(stats).forEach(key => {
                console.log(`  - ${key}: ${typeof stats[key]} = ${stats[key]}`);
            });
            
            // Check for the problematic property
            if (stats.hasOwnProperty('receiptsThisMonth')) {
                console.log('❌ PROBLEMA: Propriedade "receiptsThisMonth" ainda existe!');
            } else {
                console.log('✅ OK: Propriedade "receiptsThisMonth" não existe');
            }
            
            if (stats.hasOwnProperty('currentMonthUsage')) {
                console.log('✅ OK: Propriedade "currentMonthUsage" existe');
            } else {
                console.log('❌ PROBLEMA: Propriedade "currentMonthUsage" não existe!');
            }
        } else {
            console.log('⚠️  getUserStats retornou null - usuário não encontrado');
        }
        
    } catch (error) {
        console.log('❌ Erro no teste getUserStats:', error.message);
        console.log('Stack trace:', error.stack);
    }
}

testGetUserStats();
EOF

echo "Executando teste do getUserStats no container..."
docker-compose -f docker-compose.prod.yml exec -T $CONTAINER_NAME node /tmp/test-getstats.js

echo ""
echo "🔍 Step 5: Verificar Versão do Git"
echo "================================"

echo "Verificando qual commit está realmente em produção..."

echo ""
echo "📋 Último commit em produção:"
docker-compose -f docker-compose.prod.yml exec -T $CONTAINER_NAME git log --oneline -1 2>/dev/null || echo "❌ Git não disponível no container"

echo ""
echo "📋 Status do working directory:"
docker-compose -f docker-compose.prod.yml exec -T $CONTAINER_NAME git status --porcelain 2>/dev/null || echo "❌ Git status não disponível"

echo ""
echo "🔍 Step 6: Verificar Processo Node.js"
echo "==================================="

echo "Verificando se há múltiplos processos Node.js ou cache issues..."

echo ""
echo "📋 Processos Node.js no container:"
docker-compose -f docker-compose.prod.yml exec -T $CONTAINER_NAME ps aux | grep node || echo "❌ Não foi possível listar processos"

echo ""
echo "📋 Arquivos de cache Node.js:"
docker-compose -f docker-compose.prod.yml exec -T $CONTAINER_NAME ls -la /app/.npm 2>/dev/null || echo "Cache npm não encontrado"

echo ""
echo "🎯 Step 7: Diagnóstico Final"
echo "=========================="

echo ""
echo -e "${BLUE}🔍 Resumo do Diagnóstico:${NC}"
echo "1. Verificar se o código em produção tem a correção"
echo "2. Confirmar se não há cache antigo do Node.js"
echo "3. Validar se getUserStats retorna objeto com currentMonthUsage"
echo "4. Identificar se há discrepância entre código local e produção"

echo ""
echo -e "${YELLOW}💡 Próximos Passos Recomendados:${NC}"
echo "   - Se código ainda tem 'receiptsThisMonth': Deploy forçado necessário"
echo "   - Se getUserStats retorna null: Problema na base de dados"
echo "   - Se há cache: Reiniciar container com cache limpo"
echo "   - Se teste getUserStats falha: Problema no Firebase/Firestore"

echo ""
echo "🔧 Comandos úteis para correção:"
echo "   # Forçar rebuild sem cache"
echo "   docker-compose -f docker-compose.prod.yml build --no-cache app"
echo ""
echo "   # Reiniciar container"
echo "   docker-compose -f docker-compose.prod.yml restart app"
echo ""
echo "   # Limpar cache npm no container"
echo "   docker-compose -f docker-compose.prod.yml exec app npm cache clean --force"
