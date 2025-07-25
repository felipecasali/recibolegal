#!/bin/bash

# ReciboLegal - Domain and SSL Configuration Fix
# Ensure proper domain routing through Traefik

set -e

echo "🌐 ReciboLegal - Domain & SSL Configuration Fix"
echo "==============================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_DIR="/opt/recibolegal"

echo ""
echo "📋 Configuration Check:"
echo "   Project Directory: $PROJECT_DIR"
echo "   Target Domain: recibolegal.com.br"

cd "$PROJECT_DIR"

echo ""
echo "🔍 Step 1: Current Status Diagnosis"
echo "==================================="

echo "🐳 Current containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🌐 Testing current access points:"

# Test different URLs
echo "   Testing localhost:3001..."
LOCAL_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 || echo "000")
echo "      Response: $LOCAL_TEST"

echo "   Testing domain HTTP..."
DOMAIN_HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://recibolegal.com.br || echo "000")
echo "      Response: $DOMAIN_HTTP"

echo "   Testing domain HTTPS..."
DOMAIN_HTTPS=$(curl -s -o /dev/null -w "%{http_code}" https://recibolegal.com.br || echo "000")
echo "      Response: $DOMAIN_HTTPS"

echo ""
echo "🔍 Step 2: Traefik Configuration Check"
echo "======================================"

# Check if Traefik is properly configured
if docker ps | grep -q traefik; then
    echo "✅ Traefik container is running"
    
    # Check Traefik logs for domain routing
    echo "📋 Recent Traefik logs:"
    docker logs recibolegal_traefik_1 --tail=10 2>/dev/null || echo "Could not retrieve logs"
    
else
    echo "❌ Traefik container not found"
fi

echo ""
echo "🔧 Step 3: Verify Docker Compose Configuration"
echo "=============================================="

# Check which docker-compose file is being used
if [ -f "docker-compose.prod.yml" ]; then
    echo "📁 Found docker-compose.prod.yml"
    
    # Check if it has domain configuration
    if grep -q "recibolegal.com.br" docker-compose.prod.yml; then
        echo "✅ Domain configuration found in docker-compose.prod.yml"
    else
        echo "⚠️  Domain configuration missing from docker-compose.prod.yml"
    fi
    
    # Check SSL configuration
    if grep -q "certresolver" docker-compose.prod.yml; then
        echo "✅ SSL cert resolver configuration found"
    else
        echo "⚠️  SSL cert resolver configuration missing"
    fi
    
    COMPOSE_FILE="docker-compose.prod.yml"
else
    echo "❌ docker-compose.prod.yml not found"
    
    # Look for alternative files
    if [ -f "docker-compose.yml" ]; then
        echo "📁 Using docker-compose.yml instead"
        COMPOSE_FILE="docker-compose.yml"
    else
        echo "❌ No docker-compose file found"
        exit 1
    fi
fi

echo ""
echo "🔄 Step 4: Restart with Proper Domain Configuration"
echo "=================================================="

echo "🛑 Stopping current containers..."
docker-compose -f "$COMPOSE_FILE" down

echo "🚀 Starting with domain configuration..."
docker-compose -f "$COMPOSE_FILE" up -d

echo "⏳ Waiting for services to initialize..."
sleep 15

echo ""
echo "🔍 Step 5: Verify Domain Access"
echo "==============================="

echo "🌐 Testing domain access after restart..."

# Wait a bit more for SSL certificates
sleep 10

# Test domain access
FINAL_HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://recibolegal.com.br || echo "000")
FINAL_HTTPS=$(curl -s -o /dev/null -w "%{http_code}" https://recibolegal.com.br || echo "000")

echo "   HTTP (recibolegal.com.br): $FINAL_HTTP"
echo "   HTTPS (recibolegal.com.br): $FINAL_HTTPS"

# Check if HTTP redirects to HTTPS
HTTP_REDIRECT=$(curl -s -o /dev/null -w "%{redirect_url}" http://recibolegal.com.br || echo "none")
echo "   HTTP redirect: $HTTP_REDIRECT"

echo ""
echo "🏥 Step 6: Health Check"
echo "======================"

# Test API endpoint
API_TEST=$(curl -s -o /dev/null -w "%{http_code}" https://recibolegal.com.br/api/health || echo "000")
echo "   API Health: $API_TEST"

# Check container health
echo ""
echo "🐳 Final container status:"
docker-compose -f "$COMPOSE_FILE" ps

echo ""
echo "📊 Step 7: Configuration Summary"
echo "==============================="

echo "🎯 Domain configuration completed at: $(date)"
echo ""

if [ "$FINAL_HTTPS" = "200" ]; then
    echo -e "${GREEN}🎉 SUCCESS: Domain is working correctly!${NC}"
    echo ""
    echo "✅ Access points:"
    echo "   • Main site: https://recibolegal.com.br"
    echo "   • API health: https://recibolegal.com.br/api/health"
    echo ""
    echo "🔍 Your frontend changes should now be visible at:"
    echo "   https://recibolegal.com.br"
    
elif [ "$FINAL_HTTP" = "200" ]; then
    echo -e "${YELLOW}⚠️  HTTP working, HTTPS pending${NC}"
    echo ""
    echo "✅ HTTP access: http://recibolegal.com.br"
    echo "⏳ HTTPS access: Setting up SSL certificates (may take 2-5 minutes)"
    echo ""
    echo "💡 SSL certificates are being generated. Check again in a few minutes:"
    echo "   curl -I https://recibolegal.com.br"
    
else
    echo -e "${RED}❌ Domain access issues detected${NC}"
    echo ""
    echo "🔧 Troubleshooting steps:"
    echo "   1. Check DNS: nslookup recibolegal.com.br"
    echo "   2. Verify firewall: ufw status"
    echo "   3. Check Traefik logs: docker logs recibolegal_traefik_1"
    echo "   4. Restart services: docker-compose -f $COMPOSE_FILE restart"
fi

echo ""
echo "🔗 Useful commands:"
echo "   • Check logs: docker-compose -f $COMPOSE_FILE logs -f"
echo "   • Restart all: docker-compose -f $COMPOSE_FILE restart"
echo "   • Traefik dashboard: http://$(curl -s ipinfo.io/ip):8080"
echo ""
echo "📱 Frontend changes verification:"
echo "   • Clear browser cache (Ctrl+F5)"
echo "   • Check for larger statistics numbers (2rem font size)"
echo "   • Verify improved spacing and alignment"
echo "   • Test mobile responsiveness"
