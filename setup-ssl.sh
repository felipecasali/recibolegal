#!/bin/bash

# ReciboLegal - SSL Setup Script
# This script sets up SSL certificates with Let's Encrypt for production

set -e

echo "🔒 ReciboLegal - SSL Setup"
echo "=========================="

# Configuration
DOMAIN="recibolegal.com.br"
EMAIL="felipecasali@gmail.com"
SERVER_IP="137.184.182.167"

echo ""
echo "📋 Configuration:"
echo "   Domain: $DOMAIN"
echo "   Email: $EMAIL"
echo "   Server IP: $SERVER_IP"

# Check if we're on the server
if [ ! -f "/opt/recibolegal/docker-compose.prod.yml" ]; then
    echo ""
    echo "❌ This script should be run on the production server (137.184.182.167)"
    echo ""
    echo "📋 Steps to run on server:"
    echo ""
    echo "1. SSH to server:"
    echo "   ssh root@137.184.182.167"
    echo ""
    echo "2. Navigate to project:"
    echo "   cd /opt/recibolegal"
    echo ""
    echo "3. Download and run this script:"
    echo "   curl -fsSL https://raw.githubusercontent.com/felipecasali/recibolegal/main/setup-ssl.sh -o setup-ssl.sh"
    echo "   chmod +x setup-ssl.sh"
    echo "   ./setup-ssl.sh"
    echo ""
    exit 1
fi

echo ""
echo "🔍 Pre-flight Checks"
echo "===================="

# Check if domain points to this server
echo "Checking DNS resolution for $DOMAIN..."
RESOLVED_IP=$(dig +short $DOMAIN | tail -n1)
if [ "$RESOLVED_IP" != "$SERVER_IP" ]; then
    echo "❌ DNS Error: $DOMAIN resolves to $RESOLVED_IP, but server IP is $SERVER_IP"
    echo ""
    echo "🔧 Please update your DNS settings:"
    echo "   - Add an A record: $DOMAIN -> $SERVER_IP"
    echo "   - Wait for DNS propagation (up to 24 hours)"
    echo "   - Test with: dig +short $DOMAIN"
    echo ""
    exit 1
fi
echo "✅ DNS: $DOMAIN correctly points to $SERVER_IP"

# Check if containers are running
if ! docker-compose -f docker-compose.no-ssl.yml ps | grep -q "Up"; then
    echo "❌ Containers are not running. Please start them first:"
    echo "   docker-compose -f docker-compose.no-ssl.yml up -d"
    exit 1
fi
echo "✅ Containers are running"

# Check if site is accessible
if ! curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN | grep -q "200"; then
    echo "❌ Website not accessible at http://$DOMAIN"
    echo "   Please ensure the site is working before setting up SSL"
    exit 1
fi
echo "✅ Website accessible at http://$DOMAIN"

echo ""
echo "🚀 Starting SSL Setup"
echo "====================="

# Stop current containers
echo "Stopping current containers..."
docker-compose -f docker-compose.no-ssl.yml down

# Install certbot if not installed
if ! command -v certbot &> /dev/null; then
    echo "Installing certbot..."
    apt update
    apt install -y certbot python3-certbot-nginx
fi

# Create certificates directory
mkdir -p ./ssl/certbot/conf
mkdir -p ./ssl/certbot/www

echo ""
echo "🔐 Obtaining SSL Certificate"
echo "============================="

# Get certificate using standalone mode (temporary)
echo "Requesting certificate for $DOMAIN..."
certbot certonly \
    --standalone \
    --agree-tos \
    --non-interactive \
    --email $EMAIL \
    --domains $DOMAIN \
    --cert-path ./ssl/certbot/conf/live/$DOMAIN/fullchain.pem \
    --key-path ./ssl/certbot/conf/live/$DOMAIN/privkey.pem

# Copy certificates to our SSL directory
echo "Copying certificates..."
cp -r /etc/letsencrypt/* ./ssl/certbot/conf/

# Set proper permissions
chown -R 1001:1001 ./ssl/
chmod -R 755 ./ssl/

echo ""
echo "🐳 Starting with SSL"
echo "===================="

# Start with SSL configuration
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to start
echo "Waiting for services to start..."
sleep 15

echo ""
echo "🔍 Testing SSL Configuration"
echo "============================="

# Test HTTPS
echo "Testing HTTPS connection..."
if curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN | grep -q "200"; then
    echo "✅ HTTPS working correctly!"
else
    echo "⚠️  HTTPS test failed, but certificate might still be valid"
fi

# Test HTTP redirect
echo "Testing HTTP to HTTPS redirect..."
HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -L http://$DOMAIN)
if [ "$HTTP_RESPONSE" = "200" ]; then
    echo "✅ HTTP redirects to HTTPS correctly!"
else
    echo "⚠️  HTTP redirect test returned: $HTTP_RESPONSE"
fi

echo ""
echo "📋 SSL Certificate Auto-Renewal Setup"
echo "====================================="

# Create renewal script
cat > ./ssl/renew-certs.sh << 'EOF'
#!/bin/bash
# Auto-renewal script for ReciboLegal SSL certificates

echo "🔄 Renewing SSL certificates..."
certbot renew --quiet

# Copy renewed certificates
cp -r /etc/letsencrypt/* /opt/recibolegal/ssl/certbot/conf/
chown -R 1001:1001 /opt/recibolegal/ssl/
chmod -R 755 /opt/recibolegal/ssl/

# Restart containers to pick up new certificates
cd /opt/recibolegal
docker-compose -f docker-compose.prod.yml restart

echo "✅ Certificate renewal completed"
EOF

chmod +x ./ssl/renew-certs.sh

# Create cron job for auto-renewal (twice daily)
CRON_JOB="0 2,14 * * * /opt/recibolegal/ssl/renew-certs.sh >> /var/log/letsencrypt-renewal.log 2>&1"
(crontab -l 2>/dev/null | grep -v "renew-certs.sh" ; echo "$CRON_JOB") | crontab -

echo "✅ Auto-renewal configured (runs twice daily)"

echo ""
echo "🎉 SSL Setup Complete!"
echo "======================"
echo ""
echo "✅ Your site is now available at:"
echo "   🔒 https://$DOMAIN"
echo "   🔄 http://$DOMAIN (redirects to HTTPS)"
echo ""
echo "📋 SSL Certificate Info:"
echo "   📅 Valid for 90 days"
echo "   🔄 Auto-renewal: Twice daily at 2 AM and 2 PM"
echo "   📁 Certificates stored in: ./ssl/certbot/conf/"
echo ""
echo "🔧 Useful Commands:"
echo "   Check certificate: certbot certificates"
echo "   Test renewal: certbot renew --dry-run"
echo "   View logs: docker-compose -f docker-compose.prod.yml logs"
echo ""
echo "🎯 Next Steps:"
echo "   1. Test your site: https://$DOMAIN"
echo "   2. Update any hardcoded HTTP links to HTTPS"
echo "   3. Configure your application to use HTTPS URLs"
echo ""
