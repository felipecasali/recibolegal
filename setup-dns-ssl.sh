#!/bin/bash

# DNS and SSL Setup Script
# Fix Let's Encrypt rate limit issues

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

echo "🌐 ReciboLegal - DNS & SSL Setup"
echo "================================"

# Get server IP
SERVER_IP=$(curl -s ifconfig.me)
log_info "Server IP: $SERVER_IP"

echo ""
log_step "Step 1: Check DNS configuration"
echo "Checking if recibolegal.com.br points to this server..."

DNS_IP=$(dig +short recibolegal.com.br @8.8.8.8 | tail -n1)
WWW_DNS_IP=$(dig +short www.recibolegal.com.br @8.8.8.8 | tail -n1)

if [ "$DNS_IP" = "$SERVER_IP" ]; then
    log_info "✅ recibolegal.com.br points to $SERVER_IP"
    DNS_OK=true
else
    log_warning "❌ recibolegal.com.br points to $DNS_IP (should be $SERVER_IP)"
    DNS_OK=false
fi

if [ "$WWW_DNS_IP" = "$SERVER_IP" ]; then
    log_info "✅ www.recibolegal.com.br points to $SERVER_IP"
    WWW_DNS_OK=true
else
    log_warning "❌ www.recibolegal.com.br points to $WWW_DNS_IP (should be $SERVER_IP)"
    WWW_DNS_OK=false
fi

echo ""
log_step "Step 2: Choose deployment strategy"

if [ "$DNS_OK" = true ] && [ "$WWW_DNS_OK" = true ]; then
    log_info "DNS is configured correctly!"
    echo "Choose SSL option:"
    echo "1. Wait for Let's Encrypt rate limit to reset (recommended)"
    echo "2. Deploy without SSL for now"
    echo "3. Deploy with SSL (may hit rate limits again)"
    echo ""
    read -p "Select option (1-3): " -n 1 -r
    echo
    
    case $REPLY in
        1)
            log_info "Let's Encrypt rate limit resets at: 2025-07-24 13:24:12 UTC"
            log_info "Current time: $(date -u)"
            log_warning "Deploy WITHOUT SSL for now, enable SSL after rate limit resets"
            USE_SSL=false
            ;;
        2)
            USE_SSL=false
            ;;
        3)
            USE_SSL=true
            ;;
        *)
            log_warning "Invalid option, deploying without SSL"
            USE_SSL=false
            ;;
    esac
else
    log_error "DNS is not configured correctly!"
    echo ""
    echo "🔧 To fix DNS, configure these records in your domain provider:"
    echo "   A record:    recibolegal.com.br     → $SERVER_IP"
    echo "   A record:    www.recibolegal.com.br → $SERVER_IP"
    echo ""
    echo "Popular domain providers:"
    echo "   • Registro.br: https://registro.br"
    echo "   • Cloudflare: https://dash.cloudflare.com"
    echo "   • GoDaddy: https://godaddy.com"
    echo ""
    read -p "Deploy without SSL while DNS is fixed? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        USE_SSL=false
    else
        log_error "Deployment cancelled. Fix DNS first."
        exit 1
    fi
fi

echo ""
log_step "Step 3: Deploy application"

cd /opt/recibolegal

# Stop existing containers
log_info "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down --remove-orphans || true
docker-compose -f docker-compose.no-ssl.yml down --remove-orphans || true

if [ "$USE_SSL" = true ]; then
    log_info "Deploying WITH SSL..."
    COMPOSE_FILE="docker-compose.prod.yml"
else
    log_info "Deploying WITHOUT SSL..."
    COMPOSE_FILE="docker-compose.no-ssl.yml"
fi

# Start application
docker-compose -f $COMPOSE_FILE up -d

echo ""
log_step "Step 4: Verify deployment"

sleep 10

if curl -f -s http://localhost:3001 > /dev/null; then
    log_info "✅ Application is running!"
    echo ""
    echo "🌐 Access URLs:"
    echo "   Direct:   http://$SERVER_IP:3001"
    if [ "$DNS_OK" = true ]; then
        echo "   Domain:   http://recibolegal.com.br"
        if [ "$USE_SSL" = true ]; then
            echo "   HTTPS:    https://recibolegal.com.br (if SSL works)"
        fi
    fi
    echo "   Traefik:  http://$SERVER_IP:8080 (dashboard)"
else
    log_error "❌ Application is not responding"
fi

echo ""
if [ "$USE_SSL" = false ]; then
    log_warning "📝 TO ENABLE SSL LATER:"
    echo "1. Wait for rate limit to reset: 2025-07-24 13:24:12 UTC"
    echo "2. Ensure DNS is pointing correctly"
    echo "3. Run: docker-compose -f docker-compose.prod.yml up -d"
fi

echo ""
log_info "Container status:"
docker-compose -f $COMPOSE_FILE ps
