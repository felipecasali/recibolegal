#!/bin/bash

# 🔄 Script para alternar entre ambientes
# Uso: bash switch-env.sh [development|staging|production]

set -e

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# Verificar parâmetro
ENVIRONMENT=$1

if [ -z "$ENVIRONMENT" ]; then
    echo "🔄 Alternar Ambiente ReciboLegal"
    echo "================================"
    echo ""
    echo "Uso: bash switch-env.sh [ambiente]"
    echo ""
    echo "Ambientes disponíveis:"
    echo "  development  - Ambiente local de desenvolvimento"
    echo "  staging      - Ambiente de teste/homologação"
    echo "  production   - Ambiente de produção"
    echo ""
    echo "Exemplo: bash switch-env.sh development"
    exit 1
fi

# Verificar se arquivo de ambiente existe
ENV_FILE=".env.$ENVIRONMENT"

if [ ! -f "$ENV_FILE" ]; then
    print_error "Arquivo $ENV_FILE não encontrado!"
    echo ""
    echo "Arquivos disponíveis:"
    ls -la .env.* 2>/dev/null || echo "Nenhum arquivo .env.* encontrado"
    exit 1
fi

# Fazer backup do .env atual (se existir)
if [ -f ".env" ]; then
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    cp .env ".env.backup_$TIMESTAMP"
    print_info "Backup criado: .env.backup_$TIMESTAMP"
fi

# Copiar arquivo de ambiente
cp "$ENV_FILE" ".env"

print_success "Ambiente alterado para: $ENVIRONMENT"

# Mostrar informações do ambiente
echo ""
echo "📋 Configurações do ambiente $ENVIRONMENT:"
echo "==========================================="

# Extrair informações principais
NODE_ENV=$(grep "^NODE_ENV=" .env | cut -d'=' -f2)
PUBLIC_URL=$(grep "^PUBLIC_URL=" .env | cut -d'=' -f2)
STRIPE_KEY=$(grep "^STRIPE_PUBLISHABLE_KEY=" .env | cut -d'=' -f2)
SIMULATION_MODE=$(grep "^SIMULATION_MODE=" .env | cut -d'=' -f2)

echo "🌍 NODE_ENV: $NODE_ENV"
echo "🔗 PUBLIC_URL: $PUBLIC_URL"
echo "💳 Stripe: $(echo $STRIPE_KEY | grep -q 'test' && echo 'TEST MODE' || echo 'LIVE MODE')"
echo "🧪 Simulação: $SIMULATION_MODE"

# Avisos importantes
case $ENVIRONMENT in
    "production")
        echo ""
        print_warning "AMBIENTE DE PRODUÇÃO ATIVO!"
        print_warning "- Verifique se todas as chaves são LIVE"
        print_warning "- Confirme se SIMULATION_MODE=false"
        print_warning "- Certifique-se que os webhooks estão configurados"
        ;;
    "development")
        echo ""
        print_info "Ambiente de desenvolvimento ativo"
        print_info "- Usando chaves de teste"
        print_info "- Modo simulação habilitado"
        ;;
    "staging")
        echo ""
        print_info "Ambiente de staging ativo"
        print_info "- Usando chaves de teste com webhooks reais"
        print_info "- Ideal para testes finais antes da produção"
        ;;
esac

echo ""
print_success "Pronto para usar! Execute: npm run dev:full"

# Limpar backups antigos (manter apenas os 5 mais recentes)
print_info "Limpando backups antigos..."
ls -t .env.backup_* 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true

echo ""
print_info "Para voltar ao ambiente anterior, execute:"
echo "bash switch-env.sh [ambiente] ou use um dos backups"
