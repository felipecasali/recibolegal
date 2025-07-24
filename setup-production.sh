#!/bin/bash

# 🚀 Script completo para configurar produção do ReciboLegal
# Execute: bash setup-production.sh

set -e

echo "🚀 CONFIGURAÇÃO COMPLETA PARA PRODUÇÃO - ReciboLegal"
echo "=================================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar se arquivo .env.production existe
print_step "Verificando configurações..."

if [ ! -f ".env.production" ]; then
    print_warning "Arquivo .env.production não encontrado!"
    echo "Copiando template..."
    cp .env.production.example .env.production
    print_warning "⚠️ EDITE o arquivo .env.production com suas chaves antes de continuar!"
    echo "Pressione ENTER quando terminar de editar..."
    read
fi

# Verificar se dependências estão instaladas
print_step "Verificando dependências do Node.js..."

if [ ! -d "node_modules" ]; then
    echo "Instalando dependências..."
    npm install
fi

if [ ! -d "server/node_modules" ]; then
    echo "Instalando dependências do servidor..."
    cd server && npm install && cd ..
fi

print_success "Dependências verificadas"

# Carregar variáveis de ambiente
source .env.production

# Verificar variáveis críticas
print_step "Verificando variáveis de ambiente..."

missing_vars=()

if [ -z "$STRIPE_SECRET_KEY" ]; then
    missing_vars+=("STRIPE_SECRET_KEY")
fi

if [ -z "$TWILIO_ACCOUNT_SID" ]; then
    missing_vars+=("TWILIO_ACCOUNT_SID")
fi

if [ -z "$TWILIO_AUTH_TOKEN" ]; then
    missing_vars+=("TWILIO_AUTH_TOKEN")
fi

if [ -z "$FIREBASE_PROJECT_ID" ]; then
    missing_vars+=("FIREBASE_PROJECT_ID")
fi

if [ ${#missing_vars[@]} -gt 0 ]; then
    print_error "Variáveis de ambiente faltando:"
    for var in "${missing_vars[@]}"; do
        echo "  - $var"
    done
    echo ""
    print_error "Complete o arquivo .env.production antes de continuar!"
    exit 1
fi

print_success "Variáveis de ambiente verificadas"

# Setup Stripe
print_step "Configurando produtos Stripe..."
if node setup-stripe-products.js; then
    print_success "Stripe configurado com sucesso"
else
    print_error "Erro ao configurar Stripe"
    exit 1
fi

# Setup WhatsApp Templates
print_step "Configurando templates WhatsApp..."
if node setup-whatsapp-templates.js; then
    print_success "Templates WhatsApp configurados"
    print_warning "⏳ Aguarde aprovação dos templates (24-48h)"
else
    print_error "Erro ao configurar templates WhatsApp"
    exit 1
fi

# Setup Firebase
print_step "Configurando Firebase..."
if node setup-firebase-production.js; then
    print_success "Firebase configurado"
else
    print_error "Erro ao configurar Firebase"
    exit 1
fi

# Build da aplicação
print_step "Fazendo build da aplicação..."
if npm run build; then
    print_success "Build concluído"
else
    print_error "Erro no build"
    exit 1
fi

# Verificar se Docker está instalado
print_step "Verificando Docker..."
if command -v docker &> /dev/null; then
    print_success "Docker encontrado"
    
    # Build da imagem Docker
    print_step "Fazendo build da imagem Docker..."
    if docker build -t recibolegal:latest .; then
        print_success "Imagem Docker criada"
    else
        print_error "Erro ao criar imagem Docker"
        exit 1
    fi
else
    print_warning "Docker não encontrado. Instale Docker para containerização."
fi

echo ""
echo "🎉 CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!"
echo "====================================="
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo ""
echo "1. 🏦 STRIPE:"
echo "   - Acesse: https://dashboard.stripe.com"
echo "   - Complete informações bancárias"
echo "   - Configure webhook: https://recibolegal.com.br/api/webhooks/stripe"
echo ""
echo "2. 📱 TWILIO:"
echo "   - Aguarde aprovação dos templates (24-48h)"
echo "   - Configure webhook: https://recibolegal.com.br/api/whatsapp/webhook"
echo ""
echo "3. 🔥 FIREBASE:"
echo "   - Execute: firebase login"
echo "   - Execute: firebase projects:create recibolegal-prod"
echo "   - Execute: firebase deploy --only firestore:rules,storage:rules"
echo ""
echo "4. 🌊 DIGITALOCEAN:"
echo "   - Crie droplet (2 vCPUs, 4GB RAM, 80GB SSD)"
echo "   - Configure DNS no GoDaddy"
echo "   - Execute: ./deploy.sh"
echo ""
echo "📖 Consulte PRODUCTION-CHECKLIST.md para detalhes completos"
echo ""
print_success "Setup de produção finalizado! 🚀"
