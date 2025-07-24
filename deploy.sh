#!/bin/bash

# ReciboLegal Production Deploy Script
set -e

echo "🚀 Starting ReciboLegal Production Deploy..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/your-username/recibolegal.git"
DEPLOY_DIR="/opt/recibolegal"
BACKUP_DIR="/opt/backups/recibolegal-$(date +%Y%m%d-%H%M%S)"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    log_error "Please run as root (use sudo)"
    exit 1
fi

# Install dependencies
log_info "Installing system dependencies..."
apt-get update
apt-get install -y docker.io docker-compose git nginx certbot python3-certbot-nginx

# Enable and start Docker
systemctl enable docker
systemctl start docker

# Create deployment directory
log_info "Setting up deployment directory..."
mkdir -p $DEPLOY_DIR
mkdir -p /opt/backups

# Backup existing deployment if it exists
if [ -d "$DEPLOY_DIR/.git" ]; then
    log_info "Creating backup of existing deployment..."
    cp -r $DEPLOY_DIR $BACKUP_DIR
fi

# Clone or update repository
if [ -d "$DEPLOY_DIR/.git" ]; then
    log_info "Updating existing repository..."
    cd $DEPLOY_DIR
    git pull origin main
else
    log_info "Cloning repository..."
    git clone $REPO_URL $DEPLOY_DIR
    cd $DEPLOY_DIR
fi

# Check for environment file
if [ ! -f ".env.production" ]; then
    log_warning "Production environment file not found!"
    log_info "Please copy .env.production.example to .env.production and configure it"
    cp .env.production.example .env.production
    log_warning "Edit .env.production with your production credentials before continuing"
    log_warning "Run: nano $DEPLOY_DIR/.env.production"
    exit 1
fi

# Build and deploy
log_info "Building and starting application..."
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Wait for application to start
log_info "Waiting for application to start..."
sleep 30

# Check if application is running
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    log_info "✅ Application is running successfully!"
else
    log_error "❌ Application failed to start. Check logs with: docker-compose -f $DEPLOY_DIR/docker-compose.prod.yml logs"
    exit 1
fi

# Configure Nginx (if not using Traefik)
if [ ! -f "/etc/nginx/sites-available/recibolegal.com.br" ]; then
    log_info "Configuring Nginx..."
    cat > /etc/nginx/sites-available/recibolegal.com.br << 'EOF'
server {
    listen 80;
    server_name recibolegal.com.br www.recibolegal.com.br;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

    ln -sf /etc/nginx/sites-available/recibolegal.com.br /etc/nginx/sites-enabled/
    nginx -t && systemctl reload nginx
fi

# Setup SSL with Let's Encrypt
log_info "Setting up SSL certificate..."
certbot --nginx -d recibolegal.com.br -d www.recibolegal.com.br --non-interactive --agree-tos --email admin@recibolegal.com.br

# Setup auto-renewal
if ! crontab -l | grep -q "certbot renew"; then
    (crontab -l ; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
fi

# Setup log rotation
log_info "Setting up log rotation..."
cat > /etc/logrotate.d/recibolegal << 'EOF'
/opt/recibolegal/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        docker-compose -f /opt/recibolegal/docker-compose.prod.yml restart
    endscript
}
EOF

# Create monitoring script
log_info "Setting up monitoring..."
cat > /opt/recibolegal/monitor.sh << 'EOF'
#!/bin/bash
cd /opt/recibolegal

# Check if application is responding
if ! curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "$(date): Application not responding, restarting..." >> /var/log/recibolegal-monitor.log
    docker-compose -f docker-compose.prod.yml restart
    sleep 30
    
    # Send alert if still not working
    if ! curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        echo "$(date): CRITICAL - Application failed to restart!" >> /var/log/recibolegal-monitor.log
        # Add email/slack notification here
    fi
fi
EOF

chmod +x /opt/recibolegal/monitor.sh

# Add monitoring to crontab
if ! crontab -l | grep -q "monitor.sh"; then
    (crontab -l ; echo "*/5 * * * * /opt/recibolegal/monitor.sh") | crontab -
fi

# Final checks
log_info "Performing final checks..."
sleep 10

# Check HTTPS
if curl -f https://recibolegal.com.br/api/health > /dev/null 2>&1; then
    log_info "✅ HTTPS is working!"
else
    log_warning "⚠️ HTTPS might not be working yet. DNS propagation can take time."
fi

log_info "🎉 Deploy completed successfully!"
log_info ""
log_info "📋 Next steps:"
log_info "1. Update your DNS to point recibolegal.com.br to this server's IP"
log_info "2. Configure your production environment variables in .env.production"
log_info "3. Update Twilio webhook URL to: https://recibolegal.com.br/api/whatsapp/webhook"
log_info "4. Update Stripe webhook URL to: https://recibolegal.com.br/api/subscription/webhook"
log_info ""
log_info "🔧 Useful commands:"
log_info "  - View logs: docker-compose -f $DEPLOY_DIR/docker-compose.prod.yml logs -f"
log_info "  - Restart app: docker-compose -f $DEPLOY_DIR/docker-compose.prod.yml restart"
log_info "  - Update app: cd $DEPLOY_DIR && git pull && docker-compose -f docker-compose.prod.yml up -d --build"
log_info ""
log_info "🌐 Your application should be available at: https://recibolegal.com.br"
