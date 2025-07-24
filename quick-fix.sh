#!/bin/bash

# Quick Fix for Missing Files
# Resolve missing docker-compose files

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo "🔧 ReciboLegal - Quick Fix"
echo "=========================="

cd /opt/recibolegal || { log_error "Directory not found"; exit 1; }

log_info "Step 1: Updating code from GitHub..."
git fetch origin
git reset --hard origin/main
git clean -fd

log_info "Step 2: Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down --remove-orphans || true

log_info "Step 3: Deploy WITHOUT SSL (avoiding rate limits)..."
if [ -f "docker-compose.no-ssl.yml" ]; then
    log_info "✅ Using docker-compose.no-ssl.yml"
    docker-compose -f docker-compose.no-ssl.yml up -d
else
    log_warning "❌ docker-compose.no-ssl.yml not found, creating temporary version..."
    
    # Create temporary no-SSL version
    cat > docker-compose.temp.yml << 'EOF'
version: '3.8'

services:
  recibolegal:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
    env_file:
      - .env.production
    restart: unless-stopped
    volumes:
      - receipts_data:/app/receipts
    networks:
      - recibolegal_network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.recibolegal.rule=Host(\`recibolegal.com.br\`) || Host(\`www.recibolegal.com.br\`)"
      - "traefik.http.services.recibolegal.loadbalancer.server.port=3001"

  traefik:
    image: traefik:v3.0
    command:
      - "--api.dashboard=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--global.checkNewVersion=false"
      - "--global.sendAnonymousUsage=false"
    ports:
      - "80:80"
      - "8080:8080"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    restart: unless-stopped
    networks:
      - recibolegal_network

volumes:
  receipts_data:
    driver: local

networks:
  recibolegal_network:
    driver: bridge
EOF
    
    log_info "Using temporary configuration..."
    docker-compose -f docker-compose.temp.yml up -d
fi

log_info "Step 4: Waiting for startup..."
sleep 15

log_info "Step 5: Testing application..."
if curl -f -s http://localhost:3001 > /dev/null; then
    log_info "✅ Application is running successfully!"
    echo ""
    echo "🌐 Access URLs:"
    echo "   Direct:   http://$(curl -s ifconfig.me):3001"
    echo "   Traefik:  http://$(curl -s ifconfig.me):80"
    echo "   Dashboard: http://$(curl -s ifconfig.me):8080"
    echo ""
    echo "📊 Container status:"
    if [ -f "docker-compose.no-ssl.yml" ]; then
        docker-compose -f docker-compose.no-ssl.yml ps
    else
        docker-compose -f docker-compose.temp.yml ps
    fi
else
    log_error "❌ Application is not responding"
    echo "Checking logs..."
    if [ -f "docker-compose.no-ssl.yml" ]; then
        docker-compose -f docker-compose.no-ssl.yml logs --tail=20
    else
        docker-compose -f docker-compose.temp.yml logs --tail=20
    fi
fi

echo ""
log_info "🎯 SSL is disabled to avoid Let's Encrypt rate limits"
log_info "📝 To enable SSL later (after DNS is configured and rate limit resets):"
echo "   docker-compose -f docker-compose.prod.yml up -d"
