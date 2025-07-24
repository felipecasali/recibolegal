#!/bin/bash

# Quick Deploy Update Script
# Execute este script no servidor DigitalOcean após as correções

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo "🔄 ReciboLegal - Quick Deploy Update"
echo "===================================="

cd /opt/recibolegal || { log_error "Directory /opt/recibolegal not found"; exit 1; }

log_info "1. Updating code from GitHub..."
git fetch origin
git reset --hard origin/main
git clean -fd

log_info "2. Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down || true

log_info "3. Building with latest changes..."
docker-compose -f docker-compose.prod.yml build --no-cache

log_info "4. Starting application..."
docker-compose -f docker-compose.prod.yml up -d

log_info "5. Waiting for application to start..."
sleep 10

log_info "6. Checking application health..."
if curl -f -s http://localhost:3001 > /dev/null; then
    log_info "✅ Application is running successfully!"
    echo ""
    echo "🌐 Access URLs:"
    echo "   Local:    http://localhost:3001"
    echo "   External: http://$(curl -s ifconfig.me):3001"
    echo ""
    echo "📊 Container status:"
    docker-compose -f docker-compose.prod.yml ps
else
    log_error "❌ Application is not responding"
    echo ""
    echo "📋 Debugging info:"
    echo "Container status:"
    docker-compose -f docker-compose.prod.yml ps
    echo ""
    echo "Recent logs:"
    docker-compose -f docker-compose.prod.yml logs --tail=20
fi

echo ""
log_info "🎯 Next: Run health check with: ./health-check.sh"
