# 🚀 Deploy ReciboLegal - DigitalOcean Guide

## 📋 Pré-requisitos
- Conta no DigitalOcean
- Domínio recibolegal.com.br configurado
- Credenciais de produção (Firebase, Stripe, Twilio)

## 🎯 Passo a Passo Completo

### 1. Criar Droplet no DigitalOcean

1. **Acesse:** https://cloud.digitalocean.com/
2. **Crie conta** (ganhe $200 de crédito): https://m.do.co/c/your-referral-code
3. **Create > Droplets**

**Configuração recomendada:**
```
Distribution: Ubuntu 22.04 LTS
Plan: Basic Regular Intel
CPU: 2 vCPUs, 4GB RAM, 80GB SSD ($24/mês)
Datacenter: São Paulo (tor1) ou Nova York (nyc1)
Authentication: SSH Key (mais seguro) ou Password
Hostname: recibolegal-prod
```

### 2. Configurar DNS

**No painel do seu provedor de domínio:**
```
Tipo  Nome                    Valor
A     recibolegal.com.br      IP_DO_SEU_DROPLET
A     www.recibolegal.com.br  IP_DO_SEU_DROPLET
```

### 3. Conectar ao Servidor

```bash
# Conectar via SSH
ssh root@IP_DO_SEU_DROPLET

# Ou se usando SSH key
ssh -i ~/.ssh/your_key root@IP_DO_SEU_DROPLET
```

### 4. Instalar Dependências

```bash
# Atualizar sistema
apt update && apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose
apt install docker-compose -y

# Instalar Git
apt install git -y

# Instalar Nginx (para proxy reverso)
apt install nginx -y

# Instalar Certbot (SSL)
apt install certbot python3-certbot-nginx -y
```

### 5. Clonar e Configurar Aplicação

```bash
# Clonar repositório
git clone https://github.com/seu-usuario/recibolegal.git /opt/recibolegal
cd /opt/recibolegal

# Configurar variáveis de produção
cp .env.production.example .env.production
nano .env.production
```

**Configure essas variáveis em .env.production:**
```bash
NODE_ENV=production
PUBLIC_URL=https://recibolegal.com.br

# Firebase (production)
FIREBASE_API_KEY=sua_chave_production
FIREBASE_PROJECT_ID=seu_projeto_production
# ... outras configurações Firebase

# Stripe (live keys)
STRIPE_PUBLISHABLE_KEY=pk_live_sua_chave
STRIPE_SECRET_KEY=sk_live_sua_chave
STRIPE_WEBHOOK_SECRET=whsec_sua_chave

# Twilio (production)
TWILIO_ACCOUNT_SID=seu_account_sid_production
TWILIO_AUTH_TOKEN=seu_auth_token_production
TWILIO_WHATSAPP_NUMBER=whatsapp:+seu_numero_production

SIMULATION_MODE=false
```

### 6. Configurar Nginx

```bash
# Criar configuração do site
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
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
EOF

# Habilitar site
ln -sf /etc/nginx/sites-available/recibolegal.com.br /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Testar configuração
nginx -t

# Reiniciar Nginx
systemctl restart nginx
```

### 7. Deploy da Aplicação

```bash
cd /opt/recibolegal

# Build e start com Docker Compose
docker-compose -f docker-compose.prod.yml up -d --build

# Aguardar inicialização
sleep 30

# Verificar se está funcionando
curl http://localhost:3001/api/health
```

### 8. Configurar SSL (HTTPS)

```bash
# Gerar certificado SSL com Let's Encrypt
certbot --nginx -d recibolegal.com.br -d www.recibolegal.com.br \
  --non-interactive --agree-tos --email admin@recibolegal.com.br

# Configurar renovação automática
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
```

### 9. Configurar Monitoramento

```bash
# Copiar script de monitoramento
cp /opt/recibolegal/monitor.sh /usr/local/bin/
chmod +x /usr/local/bin/monitor.sh

# Configurar cron para monitoramento
echo "*/5 * * * * /usr/local/bin/monitor.sh" | crontab -

# Configurar backup diário
cp /opt/recibolegal/backup.sh /usr/local/bin/
chmod +x /usr/local/bin/backup.sh
echo "0 2 * * * /usr/local/bin/backup.sh" | crontab -
```

### 10. Configurar Webhooks

**Twilio:**
- URL: `https://recibolegal.com.br/api/whatsapp/webhook`

**Stripe:**
- URL: `https://recibolegal.com.br/api/subscription/webhook`

### 11. Verificações Finais

```bash
# Verificar serviços
systemctl status nginx
docker ps

# Testar endpoints
curl https://recibolegal.com.br/api/health
curl https://recibolegal.com.br/api/subscription/plans

# Verificar logs
docker-compose -f /opt/recibolegal/docker-compose.prod.yml logs -f
```

## 🔧 Comandos Úteis

```bash
# Atualizar aplicação
cd /opt/recibolegal
git pull origin main
docker-compose -f docker-compose.prod.yml up -d --build

# Ver logs
docker-compose -f /opt/recibolegal/docker-compose.prod.yml logs -f

# Reiniciar aplicação
docker-compose -f /opt/recibolegal/docker-compose.prod.yml restart

# Backup manual
/usr/local/bin/backup.sh

# Verificar saúde
/usr/local/bin/monitor.sh
```

## 💰 Custos Estimados

**DigitalOcean Droplet:** $24/mês
**Domínio:** ~$30/ano
**Total mensal:** ~$26.50

## 🎯 Resultado Final

✅ **Site:** https://recibolegal.com.br  
✅ **API:** https://recibolegal.com.br/api/health  
✅ **SSL:** Certificado válido  
✅ **Monitoring:** Ativo  
✅ **Backup:** Diário  
✅ **WhatsApp:** Funcionando  
✅ **Pagamentos:** Stripe integrado  

## 🆘 Suporte

Se precisar de ajuda:
1. Verifique logs: `docker-compose logs -f`
2. Teste conectividade: `curl localhost:3001/api/health`
3. Verifique DNS: `nslookup recibolegal.com.br`
4. Status do servidor: `systemctl status nginx docker`
