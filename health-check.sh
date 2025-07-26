#!/bin/bash

# ReciboLegal - Health Check Script
# Verifica se a aplicação está funcionando corretamente

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }
log_check() { echo -e "${BLUE}[?]${NC} $1"; }

echo "🏥 ReciboLegal - Health Check"
echo "============================="

# 1. Check if Docker containers are running
log_check "Checking Docker containers..."
cd /opt/recibolegal

if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    log_info "Docker containers are running"
    docker-compose -f docker-compose.prod.yml ps
else
    log_error "Docker containers are not running"
    echo "Try: docker-compose -f /opt/recibolegal/docker-compose.prod.yml up -d"
fi

echo ""

# 2. Check application port
log_check "Checking application port 3001..."
if netstat -tuln | grep -q ":3001"; then
    log_info "Application is listening on port 3001"
else
    log_error "Application is not listening on port 3001"
fi

echo ""

# 3. Check HTTP response
log_check "Testing HTTP connection..."
SERVER_IP=$(curl -s ifconfig.me)
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/ || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
    log_info "HTTP connection successful (Status: $HTTP_STATUS)"
    log_info "Application URL: http://$SERVER_IP:3001"
elif [ "$HTTP_STATUS" = "000" ]; then
    log_error "Cannot connect to application"
else
    log_warning "HTTP connection returned status: $HTTP_STATUS"
fi

echo ""

# 4. Check Docker logs for errors
log_check "Checking recent logs for errors..."
ERRORS=$(docker-compose -f docker-compose.prod.yml logs --tail=50 2>&1 | grep -i "error\|failed\|exception" | wc -l)

if [ "$ERRORS" -eq 0 ]; then
    log_info "No recent errors found in logs"
else
    log_warning "Found $ERRORS potential errors in logs"
    echo "Check logs with: docker-compose -f /opt/recibolegal/docker-compose.prod.yml logs -f"
fi

echo ""

# 5. Check disk space
log_check "Checking disk space..."
DISK_USAGE=$(df /opt/recibolegal | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    log_info "Disk usage: ${DISK_USAGE}% (OK)"
else
    log_warning "Disk usage: ${DISK_USAGE}% (High)"
fi

echo ""

# 6. Check memory usage
log_check "Checking memory usage..."
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.1f", $3*100/$2}')
log_info "Memory usage: ${MEMORY_USAGE}%"

echo ""

# 7. Check firewall status
log_check "Checking firewall rules..."
if ufw status | grep -q "80/tcp.*ALLOW"; then
    log_info "Firewall allows HTTP traffic (port 80)"
else
    log_warning "Firewall may be blocking HTTP traffic"
fi

if ufw status | grep -q "443/tcp.*ALLOW"; then
    log_info "Firewall allows HTTPS traffic (port 443)"
else
    log_warning "Firewall may be blocking HTTPS traffic"
fi

echo ""

# 8. Summary and recommendations
echo "📋 SUMMARY & RECOMMENDATIONS"
echo "============================"

if [ "$HTTP_STATUS" = "200" ]; then
    log_info "✅ Application is HEALTHY and accessible"
    echo ""
    echo "🌐 Access your application:"
    echo "   Local:    http://localhost:3001"
    echo "   External: http://$SERVER_IP:3001"
    echo ""
    echo "🔧 Useful commands:"
    echo "   • View logs: docker-compose -f /opt/recibolegal/docker-compose.prod.yml logs -f"
    echo "   • Restart:   docker-compose -f /opt/recibolegal/docker-compose.prod.yml restart"
    echo "   • Stop:      docker-compose -f /opt/recibolegal/docker-compose.prod.yml down"
    echo "   • Update:    cd /opt/recibolegal && git pull && docker-compose -f docker-compose.prod.yml build --no-cache"
else
    log_error "❌ Application has ISSUES"
    echo ""
    echo "🔧 Troubleshooting steps:"
    echo "   1. Check logs: docker-compose -f /opt/recibolegal/docker-compose.prod.yml logs -f"
    echo "   2. Restart containers: docker-compose -f /opt/recibolegal/docker-compose.prod.yml restart"
    echo "   3. Check environment: cat /opt/recibolegal/.env.production"
    echo "   4. Update code: cd /opt/recibolegal && git pull"
    echo "   5. Rebuild containers: docker-compose -f /opt/recibolegal/docker-compose.prod.yml build --no-cache"
    echo "   6. Check build logs: docker-compose -f /opt/recibolegal/docker-compose.prod.yml build"
fi

echo ""
echo "📞 Need help? Check the logs above or contact support."
