# 🚀 ReciboLegal - Deploy Guide

Complete production deployment guide for ReciboLegal on `recibolegal.com.br`.

## 📋 Prerequisites

- Ubuntu 20.04+ server with root access
- Domain `recibolegal.com.br` pointing to your server
- At least 2GB RAM and 20GB disk space
- Git, Docker, and Docker Compose installed

## ⚡ Quick Deploy

### 1. One-Command Deploy

```bash
curl -fsSL https://raw.githubusercontent.com/your-username/recibolegal/main/deploy.sh | sudo bash
```

### 2. Manual Deploy

```bash
# Clone the repository
git clone https://github.com/your-username/recibolegal.git /opt/recibolegal
cd /opt/recibolegal

# Make scripts executable
chmod +x deploy.sh backup.sh monitor.sh

# Run deploy script
sudo ./deploy.sh
```

## 🔧 Configuration

### 1. Environment Variables

Copy and configure production environment:

```bash
cp .env.production.example .env.production
nano .env.production
```

**Required variables:**
- Firebase credentials (production)
- Stripe keys (live keys)
- Twilio credentials (production)
- Domain settings

### 2. DNS Configuration

Point your domain to the server:

```
A     recibolegal.com.br     -> YOUR_SERVER_IP
CNAME www.recibolegal.com.br -> recibolegal.com.br
```

### 3. Webhook URLs

Update these URLs in your services:

- **Twilio WhatsApp:** `https://recibolegal.com.br/api/whatsapp/webhook`
- **Stripe:** `https://recibolegal.com.br/api/subscription/webhook`

## 🔍 Post-Deploy Checklist

### ✅ Verify Services

```bash
# Check application health
curl https://recibolegal.com.br/api/health

# Check Docker containers
docker ps

# Check logs
docker-compose -f /opt/recibolegal/docker-compose.prod.yml logs -f
```

### ✅ Test Features

1. **Frontend:** Visit `https://recibolegal.com.br`
2. **WhatsApp:** Send message to your Twilio number
3. **Payments:** Test subscription flow
4. **SSL:** Verify HTTPS is working

## 🔄 Maintenance

### Update Application

```bash
cd /opt/recibolegal
git pull origin main
docker-compose -f docker-compose.prod.yml up -d --build
```

### Backup Data

```bash
# Manual backup
/opt/recibolegal/backup.sh

# Automated backup (runs daily at 2 AM)
crontab -e
# Add: 0 2 * * * /opt/recibolegal/backup.sh
```

### Monitor Health

```bash
# Manual health check
/opt/recibolegal/monitor.sh

# Automated monitoring (runs every 5 minutes)
crontab -e
# Add: */5 * * * * /opt/recibolegal/monitor.sh
```

## 📊 Monitoring & Logs

### Application Logs

```bash
# Real-time logs
docker-compose -f /opt/recibolegal/docker-compose.prod.yml logs -f

# Specific service logs
docker-compose -f /opt/recibolegal/docker-compose.prod.yml logs -f recibolegal
```

### System Logs

```bash
# Health check logs
tail -f /var/log/recibolegal-health.log

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Metrics Dashboard

Access Traefik dashboard at: `https://recibolegal.com.br:8080`

## 🛠 Troubleshooting

### Application Not Starting

```bash
# Check container status
docker ps -a

# Check logs for errors
docker-compose -f /opt/recibolegal/docker-compose.prod.yml logs

# Restart services
docker-compose -f /opt/recibolegal/docker-compose.prod.yml restart
```

### SSL Certificate Issues

```bash
# Renew certificate manually
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

### Database Connection Issues

```bash
# Test Firebase connection
docker exec $(docker ps -q -f name=recibolegal) node -e "
  require('dotenv').config();
  console.log('Firebase config:', {
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    hasPrivateKey: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY
  });
"
```

### High Resource Usage

```bash
# Check resource usage
docker stats

# Check disk space
df -h

# Check memory
free -h

# Clean up old images
docker system prune -a
```

## 🔐 Security

### Firewall Configuration

```bash
# Allow only necessary ports
ufw allow 22   # SSH
ufw allow 80   # HTTP
ufw allow 443  # HTTPS
ufw enable
```

### SSL/TLS

- Automatic SSL with Let's Encrypt
- Auto-renewal configured
- HTTPS redirect enabled

### Environment Variables

- Never commit `.env.production` to git
- Use strong passwords and secrets
- Rotate keys regularly

## 📞 Support

### Emergency Contacts

- **Technical Issues:** admin@recibolegal.com.br
- **Server Issues:** Check monitoring alerts

### Useful Commands

```bash
# Quick restart
docker-compose -f /opt/recibolegal/docker-compose.prod.yml restart

# Full rebuild
docker-compose -f /opt/recibolegal/docker-compose.prod.yml up -d --build

# View running processes
docker ps

# Check application health
curl https://recibolegal.com.br/api/health
```

## 🚀 Performance Optimization

### Scaling

To handle more traffic:

1. **Vertical Scaling:** Increase server resources
2. **Horizontal Scaling:** Add load balancer + multiple instances
3. **CDN:** Use CloudFlare for static assets
4. **Database:** Consider MongoDB Atlas for better performance

### Monitoring

- Set up application performance monitoring (APM)
- Configure alerts for high CPU/memory usage
- Monitor response times and error rates

## 📈 Business Continuity

### Backup Strategy

- **Daily:** Application and data backups
- **Weekly:** Full system backups
- **Monthly:** Test backup restoration

### Disaster Recovery

1. Keep recent backups in cloud storage
2. Document recovery procedures
3. Test disaster recovery regularly
4. Have emergency contact information

---

## 🎯 Success Metrics

Your deployment is successful when:

- ✅ `https://recibolegal.com.br` loads correctly
- ✅ WhatsApp bot responds to messages
- ✅ Payment flow completes successfully
- ✅ SSL certificate is valid
- ✅ All health checks pass
- ✅ Monitoring is active

**🎉 Congratulations! ReciboLegal is now live in production!**
