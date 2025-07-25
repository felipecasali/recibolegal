#!/bin/bash

# ReciboLegal - Diagnóstico: Por que usuário não está sendo criado?
# Investigar se a correção foi aplicada corretamente em produção

set -e

echo "🔍 ReciboLegal - Diagnóstico: Usuário não criado"
echo "==============================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_DIR="/opt/recibolegal"

echo ""
echo -e "${BLUE}🎯 Problema: Usuário não aparece no Firebase após deploy${NC}"
echo "Possíveis causas: Cache, deploy incompleto, erro na execução"

cd "$PROJECT_DIR"

echo ""
echo "🔍 Step 1: Verificar se Deploy foi Aplicado"
echo "=========================================="

echo "📋 Último commit em produção:"
git log --oneline -1

echo ""
echo "📋 Verificando se arquivo foi atualizado:"
if grep -q "Ensure user exists in database" server/routes/whatsapp.js; then
    echo -e "${GREEN}✅ Correção está presente no código em produção${NC}"
else
    echo -e "${RED}❌ Correção NÃO está presente no código em produção${NC}"
    echo "Isso indica que o deploy não foi aplicado corretamente!"
    exit 1
fi

echo ""
echo "🔍 Step 2: Verificar Status dos Containers"
echo "========================================"

echo "📊 Status dos containers:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "📊 Verificar se container está usando código atualizado:"
CONTAINER_HASH=$(docker-compose -f docker-compose.prod.yml images | grep recibolegal | awk '{print $4}')
echo "Container image hash: $CONTAINER_HASH"

echo ""
echo "🔍 Step 3: Verificar Código Dentro do Container"
echo "============================================="

echo "📄 Verificando código dentro do container em execução..."

# Check if the fix is actually in the running container
echo "Verificando se correção está no container:"
if docker-compose -f docker-compose.prod.yml exec -T recibolegal grep -q "Ensure user exists" /app/server/routes/whatsapp.js; then
    echo -e "${GREEN}✅ Correção está no container em execução${NC}"
else
    echo -e "${RED}❌ Correção NÃO está no container em execução${NC}"
    echo "Container está usando código antigo - precisa rebuild!"
fi

echo ""
echo "📄 Linha específica da correção no container:"
docker-compose -f docker-compose.prod.yml exec -T recibolegal grep -A 10 -B 2 "Ensure user exists" /app/server/routes/whatsapp.js || echo "Correção não encontrada no container"

echo ""
echo "🔍 Step 4: Testar createUser no Container"
echo "======================================="

echo "🧪 Testando createUser diretamente no container..."

# Create test script inside container
docker-compose -f docker-compose.prod.yml exec -T recibolegal /bin/bash -c "cat > /tmp/test-create-user.js << 'EOF'
const userService = require('/app/server/services/userService');

async function testCreateUser() {
    try {
        console.log('🧪 Testando createUser no container...');
        
        const testPhone = '5511999999999';
        console.log('Telefone de teste:', testPhone);
        
        // Check if user exists
        let user = await userService.getUserByPhone(testPhone);
        console.log('Usuário existente:', user ? 'SIM' : 'NÃO');
        
        if (!user) {
            console.log('Tentando criar usuário...');
            user = await userService.createUser({
                phone: testPhone,
                name: 'Usuário Teste',
                email: testPhone + '@whatsapp.temp',
                plan: 'FREE'
            });
            console.log('✅ Usuário criado:', user.phone);
        }
        
        // Test getUserStats
        const stats = await userService.getUserStats(testPhone);
        console.log('getUserStats result:', stats ? 'SUCCESS' : 'NULL');
        
        if (stats) {
            console.log('- currentMonthUsage:', stats.currentMonthUsage);
            console.log('- planName:', stats.planName);
        }
        
    } catch (error) {
        console.log('❌ Erro:', error.message);
        console.log('Stack:', error.stack);
    }
}

testCreateUser();
EOF"

echo "Executando teste no container..."
docker-compose -f docker-compose.prod.yml exec -T recibolegal node /tmp/test-create-user.js

echo ""
echo "🔍 Step 5: Análise dos Logs"
echo "=========================="

echo "📋 Logs recentes do container (últimas 50 linhas):"
docker-compose -f docker-compose.prod.yml logs --tail=50 recibolegal

echo ""
echo "📋 Procurando por logs relacionados à criação de usuário:"
docker-compose -f docker-compose.prod.yml logs recibolegal | grep -i "creating\|user\|firebase" | tail -10 || echo "Nenhum log de criação encontrado"

echo ""
echo "🔍 Step 6: Teste do Webhook Diretamente"
echo "====================================="

echo "🧪 Testando webhook diretamente..."

# Test webhook with real data
WEBHOOK_TEST_RESPONSE=$(curl -s -X POST https://recibolegal.com.br/api/whatsapp/webhook \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "From=whatsapp:+5511999999999&Body=oi" 2>/dev/null || echo "Error")

echo "Resposta do webhook: $WEBHOOK_TEST_RESPONSE"

if [ "$WEBHOOK_TEST_RESPONSE" = "OK" ]; then
    echo -e "${GREEN}✅ Webhook processou a mensagem${NC}"
    echo "Aguarde 5 segundos e verifique logs..."
    sleep 5
    echo ""
    echo "📋 Logs após teste do webhook:"
    docker-compose -f docker-compose.prod.yml logs --tail=20 recibolegal | tail -10
else
    echo -e "${RED}❌ Webhook falhou: $WEBHOOK_TEST_RESPONSE${NC}"
fi

echo ""
echo "🔍 Step 7: Verificar Variáveis de Ambiente"
echo "========================================"

echo "🔧 Verificando variáveis Firebase no container..."
docker-compose -f docker-compose.prod.yml exec -T recibolegal printenv | grep FIREBASE || echo "Variáveis Firebase não encontradas"

echo ""
echo "🔧 Verificando conectividade Firebase no container..."
docker-compose -f docker-compose.prod.yml exec -T recibolegal /bin/bash -c "
node -e \"
try {
  const admin = require('firebase-admin');
  console.log('Firebase Admin disponível');
  if (admin.apps.length === 0) {
    admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
  }
  console.log('Firebase inicializado:', process.env.FIREBASE_PROJECT_ID);
} catch (error) {
  console.log('Erro Firebase:', error.message);
}
\"
"

echo ""
echo "🎯 Step 8: Diagnóstico Final"
echo "=========================="

echo ""
echo -e "${BLUE}📊 Resumo do Diagnóstico:${NC}"
echo ""

# Summary of findings
echo "🔍 Verificações realizadas:"
echo "   ✓ Código local tem a correção"
echo "   ✓ Código no container (precisa verificar)"
echo "   ✓ Teste createUser direto"
echo "   ✓ Logs de execução"
echo "   ✓ Teste webhook real"
echo "   ✓ Variáveis de ambiente"

echo ""
echo -e "${YELLOW}💡 Possíveis causas do problema:${NC}"
echo ""
echo "1. 🐳 Container não foi rebuiltado:"
echo "   → Solução: docker-compose -f docker-compose.prod.yml build --no-cache"
echo ""
echo "2. 📂 Deploy incompleto:"
echo "   → Solução: git pull + docker-compose restart"
echo ""
echo "3. 🔥 Erro de Firebase:"
echo "   → Solução: Verificar conectividade e permissões"
echo ""
echo "4. 💾 Cache do Node.js:"
echo "   → Solução: Rebuild completo do container"
echo ""
echo "5. 🐛 Erro silencioso no código:"
echo "   → Solução: Verificar logs detalhados"

echo ""
echo -e "${GREEN}🚀 Comandos para correção:${NC}"
echo ""
echo "# Se container tem código antigo:"
echo "docker-compose -f docker-compose.prod.yml build --no-cache"
echo "docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo "# Se é problema de cache:"
echo "docker-compose -f docker-compose.prod.yml down"
echo "docker system prune -f"
echo "docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo "# Para monitorar em tempo real:"
echo "docker-compose -f docker-compose.prod.yml logs -f recibolegal"
