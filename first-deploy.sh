#!/bin/bash

# ReciboLegal - First Deploy Script for DigitalOcean
set -e

echo "🚀 ReciboLegal - First Production Deploy"
echo "========================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    log_error "Please run as root: sudo ./first-deploy.sh"
    exit 1
fi

log_info "Step 1: Updating system..."
apt update && apt upgrade -y

log_info "Step 2: Installing Docker and dependencies..."
apt install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
apt update
apt install -y docker-ce docker-compose git nginx certbot python3-certbot-nginx

# Start Docker
systemctl enable docker
systemctl start docker

log_info "Step 3: Creating deployment directory..."
mkdir -p /opt/recibolegal
cd /opt/recibolegal

log_info "Step 4: Cloning repository..."
# You need to replace with your actual GitHub repository
git clone https://github.com/YOUR_USERNAME/recibolegal.git .

log_info "Step 5: Setting up environment..."
if [ ! -f ".env.production" ]; then
    cp .env.production.example .env.production
    log_warning "⚠️  IMPORTANT: Edit .env.production with your credentials!"
    log_warning "Run: nano /opt/recibolegal/.env.production"
    log_warning "Then run: docker-compose -f docker-compose.prod.yml up -d"
    exit 0
fi

log_info "Step 6: Building and starting application..."
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

log_info "Step 7: Configuring firewall..."
ufw allow ssh
ufw allow 80
ufw allow 443
ufw --force enable

log_info "Step 8: Setting up SSL..."
log_warning "Configure your domain DNS first!"
log_warning "Point recibolegal.com.br to this server IP: $(curl -s ifconfig.me)"
log_warning "Then run: certbot --nginx -d recibolegal.com.br -d www.recibolegal.com.br"

log_info "✅ First deploy completed!"
log_info "Next steps:"
log_info "1. Configure DNS to point to this server"
log_info "2. Edit .env.production with your credentials"
log_info "3. Run SSL setup: certbot --nginx -d recibolegal.com.br"
log_info "4. Restart services: docker-compose -f /opt/recibolegal/docker-compose.prod.yml restart"

echo ""
log_info "Server IP: $(curl -s ifconfig.me)"
log_info "Access: http://$(curl -s ifconfig.me):3001"
