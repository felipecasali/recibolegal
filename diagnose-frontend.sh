#!/bin/bash

# Frontend Diagnostic Script
# Diagnose why frontend is not accessible in browser

set -e

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

echo "🔍 ReciboLegal - Frontend Diagnostic"
echo "==================================="

# Get server IP
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "IP_DETECTION_FAILED")
log_info "Server IP: $SERVER_IP"

echo ""
log_check "1. Container Status Check"
echo "------------------------"
cd /opt/recibolegal

# Check what compose file is running
if docker ps | grep -q "recibolegal.*3001"; then
    log_info "✅ ReciboLegal container is running"
    CONTAINER_NAME=$(docker ps --format "table {{.Names}}" | grep recibolegal | head -1)
    echo "   Container: $CONTAINER_NAME"
else
    log_error "❌ ReciboLegal container is NOT running"
    echo "Available containers:"
    docker ps --format "table {{.Names}}\t{{.Status}}"
fi

if docker ps | grep -q traefik; then
    log_info "✅ Traefik container is running"
else
    log_warning "⚠️  Traefik container is NOT running"
fi

echo ""
log_check "2. Port Accessibility Check"
echo "-------------------------"

# Test local port 3001
if curl -s -m 5 http://localhost:3001 >/dev/null 2>&1; then
    log_info "✅ Port 3001 responds locally"
else
    log_error "❌ Port 3001 NOT responding locally"
fi

# Test external port 3001
if curl -s -m 5 http://$SERVER_IP:3001 >/dev/null 2>&1; then
    log_info "✅ Port 3001 accessible externally"
else
    log_error "❌ Port 3001 NOT accessible externally"
fi

# Test port 80
if curl -s -m 5 http://localhost:80 >/dev/null 2>&1; then
    log_info "✅ Port 80 responds locally"
else
    log_error "❌ Port 80 NOT responding locally"
fi

# Test external port 80
if curl -s -m 5 http://$SERVER_IP:80 >/dev/null 2>&1; then
    log_info "✅ Port 80 accessible externally"
else
    log_error "❌ Port 80 NOT accessible externally"
fi

echo ""
log_check "3. Application Response Check"
echo "---------------------------"

# Test what the application returns
echo "Testing HTTP response from port 3001:"
RESPONSE=$(curl -s -m 10 http://localhost:3001 2>/dev/null || echo "NO_RESPONSE")

if [[ "$RESPONSE" == "NO_RESPONSE" ]]; then
    log_error "❌ No response from application"
elif [[ "$RESPONSE" =~ "<!DOCTYPE html>" ]] || [[ "$RESPONSE" =~ "<html" ]]; then
    log_info "✅ Application returns HTML (frontend working)"
    echo "   Response length: $(echo "$RESPONSE" | wc -c) characters"
    echo "   Contains: $(echo "$RESPONSE" | grep -o '<title[^>]*>[^<]*</title>' | head -1 || echo 'No title found')"
elif [[ "$RESPONSE" =~ "Cannot GET" ]] || [[ "$RESPONSE" =~ "404" ]]; then
    log_warning "⚠️  Application responds but no frontend route"
    echo "   Response: $(echo "$RESPONSE" | head -1)"
else
    log_warning "⚠️  Application responds with unexpected content"
    echo "   First 200 chars: $(echo "$RESPONSE" | head -c 200)"
fi

echo ""
log_check "4. Firewall Check"
echo "---------------"

# Check if UFW is active
if command -v ufw >/dev/null && ufw status | grep -q "Status: active"; then
    log_info "UFW firewall is active"
    echo "   Rules for relevant ports:"
    ufw status | grep -E "(80|3001|443)" || echo "   No specific rules for web ports"
else
    log_info "UFW firewall is inactive or not installed"
fi

# Check iptables
if iptables -L INPUT -n | grep -q "DROP\|REJECT" 2>/dev/null; then
    log_warning "⚠️  iptables may be blocking traffic"
    echo "   Restrictive rules found in INPUT chain"
else
    log_info "✅ iptables appears to allow traffic"
fi

echo ""
log_check "5. Network Configuration"
echo "----------------------"

# Check listening ports
echo "Ports listening on all interfaces (0.0.0.0):"
netstat -tuln 2>/dev/null | grep "0.0.0.0:" | grep -E "(80|3001|443)" || echo "   No web ports listening on all interfaces"

echo ""
echo "Ports listening on localhost (127.0.0.1):"
netstat -tuln 2>/dev/null | grep "127.0.0.1:" | grep -E "(80|3001|443)" || echo "   No web ports listening on localhost only"

echo ""
echo "Docker port mappings:"
docker port $(docker ps --format "{{.Names}}" | grep recibolegal | head -1) 2>/dev/null || echo "   No port mappings found"

echo ""
log_check "6. Application Logs Check"
echo "-----------------------"

echo "Recent application logs (last 10 lines):"
if [ -f "docker-compose.no-ssl.yml" ]; then
    docker-compose -f docker-compose.no-ssl.yml logs --tail=10 recibolegal 2>/dev/null
elif [ -f "docker-compose.temp.yml" ]; then
    docker-compose -f docker-compose.temp.yml logs --tail=10 recibolegal 2>/dev/null
else
    docker-compose -f docker-compose.prod.yml logs --tail=10 recibolegal 2>/dev/null
fi

echo ""
log_check "7. Diagnosis Summary"
echo "==================="

echo ""
echo "🌐 URLs to test in your browser:"
echo "   Direct Application: http://$SERVER_IP:3001"
echo "   Via Traefik:       http://$SERVER_IP:80"
echo "   Traefik Dashboard: http://$SERVER_IP:8080"
echo ""

# Provide specific troubleshooting steps
echo "🔧 Troubleshooting Steps:"
echo ""

if ! curl -s -m 5 http://localhost:3001 >/dev/null 2>&1; then
    echo "1. ❌ Application not responding locally:"
    echo "   • Check logs: docker-compose logs recibolegal"
    echo "   • Restart: docker-compose restart recibolegal"
    echo ""
fi

if curl -s -m 5 http://localhost:3001 >/dev/null 2>&1 && ! curl -s -m 5 http://$SERVER_IP:3001 >/dev/null 2>&1; then
    echo "2. ❌ Application works locally but not externally:"
    echo "   • Check firewall: ufw status"
    echo "   • Check cloud provider security groups"
    echo "   • Verify Docker port binding: docker ps"
    echo ""
fi

if ! docker ps | grep -q "recibolegal.*3001"; then
    echo "3. ❌ Container not running:"
    echo "   • Start: docker-compose up -d"
    echo "   • Check build: docker-compose build"
    echo ""
fi

echo "4. 🔍 Quick manual tests:"
echo "   • curl http://localhost:3001"
echo "   • curl http://$SERVER_IP:3001"
echo "   • docker ps"
echo "   • docker logs \$(docker ps -q --filter 'name=recibolegal')"
