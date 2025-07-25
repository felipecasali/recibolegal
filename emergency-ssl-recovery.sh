#!/bin/bash

# ReciboLegal - Emergency SSL Recovery and Frontend Fix
# Restore HTTPS functionality and ensure frontend changes are visible

set -e

echo "🚨 ReciboLegal - Emergency SSL Recovery"
echo "======================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_DIR="/opt/recibolegal"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo ""
echo "📋 Recovery Configuration:"
echo "   Project Directory: $PROJECT_DIR"
echo "   Timestamp: $TIMESTAMP"

# Check if we're in the right directory
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ Error: Project directory not found at $PROJECT_DIR${NC}"
    exit 1
fi

cd "$PROJECT_DIR"

echo ""
echo "🔍 Step 1: Diagnose Current State"
echo "================================="

echo "📂 Current directory contents:"
ls -la

echo ""
echo "🐳 Current Docker containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🔍 Checking SSL certificate status:"
if docker ps | grep -q traefik; then
    echo "✅ Traefik container is running"
else
    echo "❌ Traefik container not found"
fi

echo ""
echo "🌐 Testing current URLs:"
MAIN_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://recibolegal.com.br || echo "000")
SSL_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://recibolegal.com.br || echo "000")

echo "   HTTP response: $MAIN_RESPONSE"
echo "   HTTPS response: $SSL_RESPONSE"

echo ""
echo "🔄 Step 2: Restore SSL Configuration"
echo "==================================="

# Stop all containers first
echo "🛑 Stopping all containers..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || echo "No containers to stop"

# Check if we have the SSL docker-compose file
if [ -f "docker-compose.prod.yml" ]; then
    echo "✅ Found docker-compose.prod.yml"
    
    # Verify it has SSL configuration
    if grep -q "traefik" docker-compose.prod.yml; then
        echo "✅ SSL configuration found in docker-compose.prod.yml"
    else
        echo "⚠️  SSL configuration missing from docker-compose.prod.yml"
    fi
else
    echo "❌ docker-compose.prod.yml not found"
    
    # Look for other docker-compose files
    echo "🔍 Looking for alternative configurations..."
    find . -name "docker-compose*.yml" -type f
fi

echo ""
echo "🏗️  Step 3: Rebuild with SSL Support"
echo "===================================="

# Build containers with SSL support
echo "🔨 Building containers with SSL support..."
docker-compose -f docker-compose.prod.yml build --no-cache

echo ""
echo "🚀 Step 4: Start Services with SSL"
echo "=================================="

# Start services in the correct order
echo "🌐 Starting services with SSL configuration..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to initialize
echo "⏳ Waiting for services to initialize..."
sleep 20

echo ""
echo "🔍 Step 5: Verify SSL Recovery"
echo "============================="

# Check container status
echo "🐳 Container status:"
docker-compose -f docker-compose.prod.yml ps

# Test SSL after restart
echo ""
echo "🌐 Testing SSL recovery..."
sleep 10

HTTP_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://recibolegal.com.br || echo "000")
HTTPS_TEST=$(curl -s -o /dev/null -w "%{http_code}" https://recibolegal.com.br || echo "000")

echo "   HTTP test: $HTTP_TEST"
echo "   HTTPS test: $HTTPS_TEST"

if [ "$HTTPS_TEST" = "200" ]; then
    echo -e "${GREEN}✅ HTTPS successfully restored!${NC}"
else
    echo -e "${YELLOW}⚠️  HTTPS not yet responding (code: $HTTPS_TEST)${NC}"
    echo "   This may be normal - SSL certificates might be regenerating"
fi

echo ""
echo "🎨 Step 6: Verify Frontend Changes"
echo "================================="

# Check if dist folder exists and has recent changes
if [ -d "dist" ]; then
    echo "📂 Frontend build found:"
    ls -la dist/
    
    # Check build timestamp
    BUILD_TIME=$(stat -c %Y dist/index.html 2>/dev/null || stat -f %m dist/index.html 2>/dev/null || echo "unknown")
    if [ "$BUILD_TIME" != "unknown" ]; then
        BUILD_DATE=$(date -d @$BUILD_TIME 2>/dev/null || date -r $BUILD_TIME 2>/dev/null || echo "unknown")
        echo "   Build timestamp: $BUILD_DATE"
    fi
else
    echo "❌ Frontend build (dist) not found"
    echo "🏗️  Rebuilding frontend..."
    
    npm run build
    
    if [ $? -eq 0 ]; then
        echo "✅ Frontend rebuilt successfully"
    else
        echo "❌ Frontend build failed"
    fi
fi

echo ""
echo "🔄 Step 7: Force Frontend Refresh"
echo "================================="

# Restart just the app container to ensure fresh frontend
echo "🔄 Restarting app container to refresh frontend..."
docker-compose -f docker-compose.prod.yml restart app

# Wait a moment
sleep 5

echo ""
echo "🏥 Step 8: Final Health Check"
echo "============================="

# Comprehensive health check
echo "🔍 Final verification..."

# Test main endpoints
API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" https://recibolegal.com.br/api/health || echo "000")
FRONTEND_HTTPS=$(curl -s -o /dev/null -w "%{http_code}" https://recibolegal.com.br || echo "000")

echo "   API Health (HTTPS): $API_HEALTH"
echo "   Frontend (HTTPS): $FRONTEND_HTTPS"

# Check for redirect from HTTP to HTTPS
HTTP_REDIRECT=$(curl -s -o /dev/null -w "%{redirect_url}" http://recibolegal.com.br || echo "none")
echo "   HTTP redirect: $HTTP_REDIRECT"

echo ""
echo "📊 Step 9: Recovery Summary"
echo "=========================="

echo "🎯 Recovery completed at: $(date)"
echo ""

if [ "$FRONTEND_HTTPS" = "200" ] && [ "$API_HEALTH" = "200" ]; then
    echo -e "${GREEN}🎉 SUCCESS: SSL and Frontend fully recovered!${NC}"
    echo ""
    echo "✅ Verification:"
    echo "   • HTTPS is working: https://recibolegal.com.br"
    echo "   • API is healthy: https://recibolegal.com.br/api/health"
    echo "   • Frontend changes should now be visible"
    echo ""
    echo "🔍 Next steps:"
    echo "   1. Visit https://recibolegal.com.br to confirm your changes are visible"
    echo "   2. Test all key functionality"
    echo "   3. Clear browser cache if changes aren't visible immediately"
else
    echo -e "${YELLOW}⚠️  PARTIAL RECOVERY:${NC}"
    echo "   HTTPS status: $FRONTEND_HTTPS"
    echo "   API status: $API_HEALTH"
    echo ""
    echo "🔧 Additional steps may be needed:"
    echo "   • SSL certificates may still be generating (wait 5-10 minutes)"
    echo "   • Check Traefik logs: docker-compose -f docker-compose.prod.yml logs traefik"
    echo "   • Verify DNS is pointing to the server"
fi

echo ""
echo "🔗 Important URLs:"
echo "   • Main site: https://recibolegal.com.br"
echo "   • API health: https://recibolegal.com.br/api/health"
echo "   • Traefik dashboard: http://your-server-ip:8080 (if enabled)"
echo ""
echo "📞 If issues persist:"
echo "   • Check logs: docker-compose -f docker-compose.prod.yml logs"
echo "   • Verify DNS: nslookup recibolegal.com.br"
echo "   • Check firewall: ufw status"
echo "   • Restart all services: docker-compose -f docker-compose.prod.yml restart"
