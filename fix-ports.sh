#!/bin/bash

# Port Check and Fix Script
# Resolve conflitos de porta no servidor

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo "🔍 ReciboLegal - Port Conflict Resolver"
echo "======================================"

log_info "Checking what's using port 80..."
echo "Services using port 80:"
netstat -tulpn | grep :80 || echo "No services found on port 80"

echo ""
log_info "Checking what's using port 443..."
echo "Services using port 443:"
netstat -tulpn | grep :443 || echo "No services found on port 443"

echo ""
log_info "Checking if Nginx is running..."
if systemctl is-active --quiet nginx; then
    log_warning "Nginx is running - this conflicts with Traefik"
    echo "Options to resolve:"
    echo "1. Stop Nginx: sudo systemctl stop nginx && sudo systemctl disable nginx"
    echo "2. Use different ports for Traefik"
    echo ""
    read -p "Stop Nginx now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Stopping Nginx..."
        systemctl stop nginx
        systemctl disable nginx
        log_info "✅ Nginx stopped and disabled"
    else
        log_warning "Keeping Nginx - will configure alternative ports"
        exit 1
    fi
else
    log_info "✅ Nginx is not running"
fi

echo ""
log_info "Checking if Apache is running..."
if systemctl is-active --quiet apache2; then
    log_warning "Apache2 is running - this conflicts with Traefik"
    echo "Stopping Apache2..."
    systemctl stop apache2
    systemctl disable apache2
    log_info "✅ Apache2 stopped and disabled"
else
    log_info "✅ Apache2 is not running"
fi

echo ""
log_info "Cleaning up any existing containers..."
cd /opt/recibolegal
docker-compose -f docker-compose.prod.yml down --remove-orphans || true

echo ""
log_info "Checking for orphaned containers..."
docker ps -a | grep traefik && docker rm -f $(docker ps -aq --filter "name=traefik") || echo "No traefik containers to remove"

echo ""
log_info "Choose deployment option:"
echo "1. Standard ports (80, 443) - requires stopping conflicting services"
echo "2. Alternative ports (8080, 8443) - works alongside existing services"
echo ""
read -p "Select option (1 or 2): " -n 1 -r
echo

if [[ $REPLY == "2" ]]; then
    log_info "Using alternative ports configuration..."
    COMPOSE_FILE="docker-compose.alt-ports.yml"
    ACCESS_PORT="8080"
else
    log_info "Using standard ports configuration..."
    COMPOSE_FILE="docker-compose.prod.yml"
    ACCESS_PORT="80"
fi

echo ""
log_info "Starting application with $COMPOSE_FILE..."
docker-compose -f $COMPOSE_FILE up -d

echo ""
log_info "Waiting 10 seconds for startup..."
sleep 10

echo ""
log_info "Checking application status..."
if curl -f -s http://localhost:3001 > /dev/null; then
    log_info "✅ Application is running on port 3001!"
    echo ""
    echo "🌐 Access URLs:"
    echo "   Direct:   http://$(curl -s ifconfig.me):3001"
    if [[ $ACCESS_PORT == "8080" ]]; then
        echo "   Traefik:  http://$(curl -s ifconfig.me):8080 (alternative ports)"
        echo "   HTTPS:    https://$(curl -s ifconfig.me):8443 (when SSL configured)"
    else
        echo "   Traefik:  http://$(curl -s ifconfig.me):80 (when domain configured)"
        echo "   HTTPS:    https://$(curl -s ifconfig.me):443 (when SSL configured)"
    fi
else
    log_error "❌ Application is not responding"
fi

echo ""
log_info "Container status:"
docker-compose -f $COMPOSE_FILE ps
