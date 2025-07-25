#!/bin/bash

# ReciboLegal - Fix WhatsApp Receipt Generation Bug
# Correção do erro "Cannot read properties of null (reading 'receiptsThisMonth')"

set -e

echo "🐛 ReciboLegal - Correção de Bug do WhatsApp"
echo "============================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo "🔍 Descrição do Bug:"
echo "   Error: TypeError: Cannot read properties of null (reading 'receiptsThisMonth')"
echo "   Local: /app/routes/whatsapp.js:229:22"
echo ""

echo "✅ Correções Aplicadas:"
echo "   1. Corrigido campo 'receiptsThisMonth' para 'currentMonthUsage'"
echo "   2. Adicionada verificação de null para objeto 'stats'"
echo "   3. Tratamento de erro melhorado com mensagem ao usuário"
echo "   4. URL atualizada para produção (recibolegal.com.br)"
echo ""

echo "📦 Fazendo commit das alterações..."
git add server/routes/whatsapp.js
git status

echo ""
echo "💬 Commit message:"
COMMIT_MSG="🐛 Fix WhatsApp receiptsThisMonth null error

- Fix 'receiptsThisMonth' -> 'currentMonthUsage' property mismatch
- Add null check for getUserStats() result
- Improve error handling with user-friendly messages
- Update production URL to recibolegal.com.br

Fixes production error: Cannot read properties of null (reading 'receiptsThisMonth')"

echo "$COMMIT_MSG"
echo ""

read -p "Fazer commit? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git commit -m "$COMMIT_MSG"
    echo -e "${GREEN}✅ Commit realizado com sucesso!${NC}"
else
    echo -e "${YELLOW}❌ Commit cancelado${NC}"
    exit 1
fi

echo ""
echo "🚀 Enviando para GitHub..."
git push origin main

echo ""
echo -e "${GREEN}✅ Correção enviada para GitHub!${NC}"
echo ""
echo "📋 Próximos passos:"
echo "   1. No servidor, execute:"
echo "      cd /opt/recibolegal"
echo "      git pull origin main"
echo "      docker-compose -f docker-compose.prod.yml restart"
echo ""
echo "   2. Teste no WhatsApp:"
echo "      - Envie 'oi' para iniciar"
echo "      - Complete o fluxo até a data"
echo "      - Verifique se não há mais erros"
echo ""
echo "   3. Monitorar logs:"
echo "      docker-compose -f docker-compose.prod.yml logs -f app"
echo ""

echo "🎯 Bug corrigido:"
echo "   ❌ Antes: stats.receiptsThisMonth (undefined/null)"
echo "   ✅ Agora: stats.currentMonthUsage (valor correto)"
echo "   ✅ Verificação de null adicionada"
echo "   ✅ Mensagem de erro amigável"
