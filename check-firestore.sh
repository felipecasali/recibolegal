#!/bin/bash

# ReciboLegal - Quick Firestore Connectivity Test
# Verificação básica de conectividade com Firestore Database em produção

set -e

echo "🔥 ReciboLegal - Teste de Conectividade Firestore"
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_DIR="/opt/recibolegal"

echo ""
echo "🔍 Verificação de Conectividade Firestore"
echo "========================================"

cd "$PROJECT_DIR"

# Check if .env.production exists
if [ -f ".env.production" ]; then
    echo -e "${GREEN}✅ .env.production encontrado${NC}"
    
    # Check Firebase Project ID
    PROJECT_ID=$(grep "^FIREBASE_PROJECT_ID=" .env.production | cut -d'=' -f2)
    if [ -n "$PROJECT_ID" ]; then
        echo -e "${GREEN}✅ Firebase Project ID: $PROJECT_ID${NC}"
    else
        echo -e "${RED}❌ FIREBASE_PROJECT_ID não encontrado${NC}"
    fi
else
    echo -e "${RED}❌ .env.production não encontrado${NC}"
    exit 1
fi

echo ""
echo "🐳 Container Status Check"
echo "======================="

CONTAINER_NAME=$(docker-compose -f docker-compose.prod.yml ps --services | head -1)

if [ -n "$CONTAINER_NAME" ]; then
    echo -e "${GREEN}✅ Container ativo: $CONTAINER_NAME${NC}"
    
    # Test WhatsApp status command (tests Firestore indirectly)
    echo ""
    echo "🧪 Teste do WhatsApp Bot (testa Firestore indiretamente)"
    echo "====================================================="
    
    echo "Enviando comando 'status' via webhook..."
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST https://recibolegal.com.br/api/whatsapp/webhook \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "From=whatsapp:+5511970843096&Body=status")
    
    if [ "$RESPONSE" = "200" ]; then
        echo -e "${GREEN}✅ WhatsApp webhook respondeu (HTTP 200)${NC}"
        echo "   Firestore conectividade: PROVÁVEL SUCESSO"
    else
        echo -e "${RED}❌ WhatsApp webhook falhou (HTTP $RESPONSE)${NC}"
        echo "   Firestore conectividade: PROVÁVEL PROBLEMA"
    fi
else
    echo -e "${RED}❌ Nenhum container em execução${NC}"
fi

echo ""
echo "📋 Logs Recentes"
echo "==============="

echo "Verificando logs para erros do Firebase/Firestore..."
FIREBASE_ERRORS=$(docker-compose -f docker-compose.prod.yml logs --tail=50 app | grep -i "firebase\|firestore" | grep -i "error\|failed\|offline" | wc -l)

if [ "$FIREBASE_ERRORS" -gt 0 ]; then
    echo -e "${RED}❌ Encontrados $FIREBASE_ERRORS erros do Firebase/Firestore${NC}"
    echo "Últimos erros:"
    docker-compose -f docker-compose.prod.yml logs --tail=50 app | grep -i "firebase\|firestore" | grep -i "error\|failed\|offline" | tail -3
else
    echo -e "${GREEN}✅ Nenhum erro do Firebase/Firestore encontrado${NC}"
fi

echo ""
echo "🎯 Resumo da Conectividade"
echo "========================="
echo "✅ Para monitoramento contínuo:"
echo "   docker-compose -f docker-compose.prod.yml logs -f app | grep -i firebase"
echo ""
echo "✅ Para teste manual:"
echo "   curl -X POST https://recibolegal.com.br/api/whatsapp/webhook \\"
echo "     -H \"Content-Type: application/x-www-form-urlencoded\" \\"
echo "     -d \"From=whatsapp:+5511970843096&Body=status\""
