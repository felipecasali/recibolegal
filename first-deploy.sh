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
# Check if repository is already cloned
if [ -d ".git" ]; then
    log_info "Repository already exists, updating..."
    git fetch origin
    git reset --hard origin/main
    git clean -fd
else
    log_info "Cloning fresh repository..."
    # Remove any existing files first
    rm -rf /opt/recibolegal/*
    rm -rf /opt/recibolegal/.[^.]*
    # Clone the ReciboLegal repository
    git clone https://github.com/felipecasali/recibolegal.git .
fi

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

log_info "Step 8: Creating deployment user..."
# Create a dedicated user for the application
if ! id "recibolegal" &>/dev/null; then
    useradd -m -s /bin/bash recibolegal
    usermod -aG docker recibolegal
    # Set ownership of deployment directory
    chown -R recibolegal:recibolegal /opt/recibolegal
    log_info "Created user 'recibolegal' for application management"
else
    log_info "User 'recibolegal' already exists"
fi

log_info "Step 9: Setting up SSL..."
log_warning "Configure your domain DNS first!"
log_warning "Point recibolegal.com.br to this server IP: $(curl -s ifconfig.me)"
log_warning "Then run: certbot --nginx -d recibolegal.com.br -d www.recibolegal.com.br"

log_info "✅ First deploy completed!"
log_info ""
log_info "=== IMPORTANT INFORMATION ==="
log_info "Server IP: $(curl -s ifconfig.me)"
log_info "Application URL: http://$(curl -s ifconfig.me):3001"
log_info ""
log_info "=== NEXT STEPS ==="
log_info "1. Configure DNS: Point recibolegal.com.br to $(curl -s ifconfig.me)"
log_info "2. Edit environment: nano /opt/recibolegal/.env.production"
log_info "3. Setup SSL: certbot --nginx -d recibolegal.com.br -d www.recibolegal.com.br"
log_info "4. Restart app: su - recibolegal -c 'cd /opt/recibolegal && docker-compose -f docker-compose.prod.yml restart'"
log_info ""
log_info "=== USER MANAGEMENT ==="
log_info "• Root user: For system administration"
log_info "• recibolegal user: For application management"
log_info "• Switch to app user: su - recibolegal"
log_info ""
log_info "=== USEFUL COMMANDS ==="
log_info "• View logs: docker-compose -f /opt/recibolegal/docker-compose.prod.yml logs -f"
log_info "• Restart app: docker-compose -f /opt/recibolegal/docker-compose.prod.yml restart"
log_info "• Update app: cd /opt/recibolegal && git pull && docker-compose -f docker-compose.prod.yml build --no-cache"
