#!/bin/bash

# 🔧 Script interativo para configurar chaves de produção
# Execute: bash configure-production-keys.sh

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}🚀 $1${NC}"
    echo "=============================================="
}

print_step() {
    echo -e "${CYAN}📋 $1${NC}"
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

# Função para ler input com validação
read_key() {
    local prompt="$1"
    local validation="$2"
    local key=""
    
    while true; do
        read -p "$prompt: " key
        
        if [ -z "$key" ]; then
            print_warning "Chave não pode estar vazia!"
            continue
        fi
        
        if [[ "$validation" != "" && ! "$key" =~ $validation ]]; then
            print_warning "Formato inválido! Esperado: $validation"
            continue
        fi
        
        break
    done
    
    echo "$key"
}

# Função para confirmar
confirm() {
    read -p "$1 (y/N): " -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]]
}

print_header "CONFIGURAÇÃO DE CHAVES DE PRODUÇÃO - ReciboLegal"
echo ""

# Verificar se arquivo .env.production já existe
if [ -f ".env.production" ]; then
    print_warning "Arquivo .env.production já existe!"
    if confirm "Deseja sobrescrever?"; then
        cp .env.production .env.production.backup
        print_success "Backup criado: .env.production.backup"
    else
        print_error "Operação cancelada"
        exit 1
    fi
fi

# Copiar template
cp .env.production.example .env.production
print_success "Template copiado para .env.production"

echo ""
print_header "CONFIGURANDO STRIPE (LIVE)"

print_step "📋 Instruções Stripe:"
echo "1. Acesse: https://dashboard.stripe.com"
echo "2. Vá em Settings → Account settings"
echo "3. Complete TODAS as informações (empresa, banco, documentos)"
echo "4. Vá em Developers → API keys"
echo "5. CERTIFIQUE-SE que está em 'Live data' (não 'Test data')"
echo ""

if confirm "Você já completou o setup do Stripe?"; then
    echo ""
    print_step "Digite suas chaves LIVE do Stripe:"
    
    STRIPE_PUB_KEY=$(read_key "Publishable Key (pk_live_...)" "^pk_live_")
    STRIPE_SECRET_KEY=$(read_key "Secret Key (sk_live_...)" "^sk_live_")
    
    print_step "Webhook Secret (configuraremos depois)"
    echo "ℹ️  Deixe em branco por enquanto se não configurou webhook ainda"
    read -p "Webhook Secret (whsec_... ou Enter para pular): " STRIPE_WEBHOOK_SECRET
    
    # Atualizar arquivo
    sed -i.bak "s/STRIPE_PUBLISHABLE_KEY=.*/STRIPE_PUBLISHABLE_KEY=$STRIPE_PUB_KEY/" .env.production
    sed -i.bak "s/STRIPE_SECRET_KEY=.*/STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY/" .env.production
    
    if [ ! -z "$STRIPE_WEBHOOK_SECRET" ]; then
        sed -i.bak "s/STRIPE_WEBHOOK_SECRET=.*/STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET/" .env.production
    fi
    
    rm .env.production.bak
    print_success "Chaves Stripe configuradas!"
else
    print_warning "Configure o Stripe primeiro e execute este script novamente"
fi

echo ""
print_header "CONFIGURANDO TWILIO (PRODUÇÃO)"

print_step "📋 Instruções Twilio:"
echo "1. Acesse: https://console.twilio.com/billing"
echo "2. Faça upgrade para conta paga"
echo "3. Copie Account SID e Auth Token"
echo "4. Request WhatsApp Business access (aguarde aprovação)"
echo ""

if confirm "Você já fez upgrade da conta Twilio?"; then
    echo ""
    print_step "Digite suas chaves de produção do Twilio:"
    
    TWILIO_SID=$(read_key "Account SID (AC...)" "^AC")
    TWILIO_TOKEN=$(read_key "Auth Token" "")
    
    print_step "Número WhatsApp Business"
    echo "ℹ️  Se ainda não foi aprovado, deixe em branco"
    read -p "WhatsApp Number (+5511999999999 ou Enter para pular): " TWILIO_WHATSAPP
    
    # Atualizar arquivo
    sed -i.bak "s/TWILIO_ACCOUNT_SID=.*/TWILIO_ACCOUNT_SID=$TWILIO_SID/" .env.production
    sed -i.bak "s/TWILIO_AUTH_TOKEN=.*/TWILIO_AUTH_TOKEN=$TWILIO_TOKEN/" .env.production
    
    if [ ! -z "$TWILIO_WHATSAPP" ]; then
        sed -i.bak "s|TWILIO_WHATSAPP_NUMBER=.*|TWILIO_WHATSAPP_NUMBER=whatsapp:$TWILIO_WHATSAPP|" .env.production
        sed -i.bak "s|TWILIO_WHATSAPP_FROM=.*|TWILIO_WHATSAPP_FROM=whatsapp:$TWILIO_WHATSAPP|" .env.production
    fi
    
    rm .env.production.bak
    print_success "Chaves Twilio configuradas!"
else
    print_warning "Configure o Twilio primeiro e execute este script novamente"
fi

echo ""
print_header "CONFIGURANDO FIREBASE (PRODUÇÃO)"

print_step "📋 Instruções Firebase:"
echo "1. Acesse: https://console.firebase.google.com"
echo "2. Crie novo projeto: 'recibolegal-production'"
echo "3. Configure Authentication e Firestore"
echo "4. Vá em Project Settings → Your apps → Web app"
echo "5. Copie as configurações"
echo ""

if confirm "Você já criou o projeto Firebase de produção?"; then
    echo ""
    print_step "Digite as configurações do Firebase:"
    
    FIREBASE_API_KEY=$(read_key "API Key" "")
    FIREBASE_PROJECT_ID=$(read_key "Project ID (recibolegal-production)" "")
    FIREBASE_SENDER_ID=$(read_key "Messaging Sender ID" "")
    FIREBASE_APP_ID=$(read_key "App ID" "")
    
    read -p "Measurement ID (G-... ou Enter para pular): " FIREBASE_MEASUREMENT_ID
    
    # Atualizar arquivo
    sed -i.bak "s/FIREBASE_API_KEY=.*/FIREBASE_API_KEY=$FIREBASE_API_KEY/" .env.production
    sed -i.bak "s/FIREBASE_PROJECT_ID=.*/FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID/" .env.production
    sed -i.bak "s/FIREBASE_AUTH_DOMAIN=.*/FIREBASE_AUTH_DOMAIN=$FIREBASE_PROJECT_ID.firebaseapp.com/" .env.production
    sed -i.bak "s/FIREBASE_STORAGE_BUCKET=.*/FIREBASE_STORAGE_BUCKET=$FIREBASE_PROJECT_ID.firebasestorage.app/" .env.production
    sed -i.bak "s/FIREBASE_MESSAGING_SENDER_ID=.*/FIREBASE_MESSAGING_SENDER_ID=$FIREBASE_SENDER_ID/" .env.production
    sed -i.bak "s/FIREBASE_APP_ID=.*/FIREBASE_APP_ID=$FIREBASE_APP_ID/" .env.production
    
    if [ ! -z "$FIREBASE_MEASUREMENT_ID" ]; then
        sed -i.bak "s/FIREBASE_MEASUREMENT_ID=.*/FIREBASE_MEASUREMENT_ID=$FIREBASE_MEASUREMENT_ID/" .env.production
    fi
    
    rm .env.production.bak
    print_success "Configurações Firebase aplicadas!"
else
    print_warning "Configure o Firebase primeiro e execute este script novamente"
fi

echo ""
print_header "CONFIGURANDO SEGURANÇA"

print_step "Gerando JWT Secret seguro..."
JWT_SECRET=$(openssl rand -hex 32)
sed -i.bak "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env.production
rm .env.production.bak
print_success "JWT Secret gerado e configurado!"

echo ""
print_header "RESUMO DA CONFIGURAÇÃO"

echo "📁 Arquivo .env.production criado com:"
echo ""

if grep -q "pk_live_" .env.production; then
    print_success "✅ Stripe Live Keys configuradas"
else
    print_warning "⚠️  Stripe: Precisa configurar chaves live"
fi

if grep -q "^TWILIO_ACCOUNT_SID=AC" .env.production; then
    print_success "✅ Twilio configurado"
else
    print_warning "⚠️  Twilio: Precisa configurar chaves de produção"
fi

if ! grep -q "YOUR_PRODUCTION_FIREBASE_API_KEY" .env.production; then
    print_success "✅ Firebase configurado"
else
    print_warning "⚠️  Firebase: Precisa configurar projeto de produção"
fi

print_success "✅ JWT Secret gerado"

echo ""
print_header "PRÓXIMOS PASSOS"

echo "1. 🏦 Configure produtos Stripe:"
echo "   npm run env:prod"
echo "   npm run setup:stripe"
echo ""

echo "2. 📱 Configure templates WhatsApp:"
echo "   npm run setup:whatsapp"
echo ""

echo "3. 🔥 Configure Firebase:"
echo "   npm run setup:firebase"
echo ""

echo "4. 🚀 Teste a configuração:"
echo "   npm run env:prod"
echo "   npm run env:status"
echo ""

print_success "Configuração de chaves concluída!"
print_warning "IMPORTANTE: Não comite o arquivo .env.production no Git!"

echo ""
echo "Para usar as chaves de produção: npm run env:prod"
echo "Para voltar ao desenvolvimento: npm run env:dev"
