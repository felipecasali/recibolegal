#!/bin/bash

# ReciboLegal - Health Monitor Script
# Monitors the production system health

echo "🔍 ReciboLegal - Health Check"
echo "============================="
echo "$(date)"
echo ""

DOMAIN="recibolegal.com.br"
SERVER_IP="137.184.182.167"

# Test HTTPS
echo "🔒 SSL/HTTPS Status:"
HTTPS_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 https://$DOMAIN)
if [ "$HTTPS_CODE" = "200" ]; then
    echo "✅ HTTPS: OK ($HTTPS_CODE)"
else
    echo "❌ HTTPS: FAILED ($HTTPS_CODE)"
fi

# Test HTTP redirect
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 -L http://$DOMAIN)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ HTTP→HTTPS: OK ($HTTP_CODE)"
else
    echo "❌ HTTP→HTTPS: FAILED ($HTTP_CODE)"
fi

# Test API Health
API_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 https://$DOMAIN/api/health)
if [ "$API_CODE" = "200" ]; then
    echo "✅ API Health: OK ($API_CODE)"
else
    echo "❌ API Health: FAILED ($API_CODE)"
fi

echo ""
echo "🐳 Container Status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "💾 System Resources:"
echo "Memory: $(free -h | grep '^Mem:' | awk '{print $3 "/" $2}')"
echo "Disk: $(df -h / | tail -1 | awk '{print $3 "/" $2 " (" $5 " used)"}')"

echo ""
echo "📜 SSL Certificate Info:"
echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null || echo "❌ Could not retrieve certificate info"

echo ""
echo "🔧 Quick Actions:"
echo "   View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   Restart: docker-compose -f docker-compose.prod.yml restart"
echo "   Update: git pull && docker-compose -f docker-compose.prod.yml up -d --build"
