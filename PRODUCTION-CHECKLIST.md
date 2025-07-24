# 🚀 CHECKLIST COMPLETO PARA PRODUÇÃO - ReciboLegal

## ✅ **PRÉ-REQUISITOS CONFIRMADOS**
- [x] Domínio: recibolegal.com.br (GoDaddy)
- [x] Hosting: DigitalOcean
- [x] Código: Aplicação completa pronta

---

## 📋 **PASSOS PARA PRODUÇÃO**

### **ETAPA 1: Configurações de Terceiros**

#### 🏦 **1.1 Stripe (30 min)**
```bash
# 1. Ative conta live em https://dashboard.stripe.com
# 2. Complete informações bancárias
# 3. Execute setup de produtos:
node setup-stripe-products.js

# 4. Configure webhook:
# URL: https://recibolegal.com.br/api/webhooks/stripe
# Eventos: customer.subscription.created, updated, deleted, invoice.payment_succeeded, failed
```

#### 📱 **1.2 Twilio WhatsApp (2-3 dias)**
```bash
# 1. Upgrade para conta paga em https://console.twilio.com
# 2. Request WhatsApp Business access
# 3. Execute setup de templates:
node setup-whatsapp-templates.js

# 4. Aguarde aprovação (24-48h)
# 5. Configure webhook: https://recibolegal.com.br/api/whatsapp/webhook
```

#### 🔥 **1.3 Firebase (15 min)**
```bash
# 1. Execute setup:
node setup-firebase-production.js

# 2. Instale CLI e configure:
npm install -g firebase-tools
firebase login
firebase projects:create recibolegal-prod
firebase init
firebase deploy --only firestore:rules,storage:rules
```

---

### **ETAPA 2: Configuração do Servidor**

#### 🌊 **2.1 DigitalOcean Droplet**
```bash
# Configuração recomendada:
# - 2 vCPUs, 4GB RAM, 80GB SSD
# - Ubuntu 22.04 LTS
# - Região: New York 3 (melhor latência Brasil)
# - Custo: ~$24/mês
```

#### 🔧 **2.2 DNS no GoDaddy**
```bash
# Configure os seguintes registros DNS:

Tipo: A
Nome: @
Valor: [IP_DO_DROPLET]
TTL: 1 hora

Tipo: A  
Nome: www
Valor: [IP_DO_DROPLET]
TTL: 1 hora

Tipo: CNAME
Nome: api
Valor: recibolegal.com.br
TTL: 1 hora
```

---

### **ETAPA 3: Deploy da Aplicação**

#### 📦 **3.1 Preparar Variáveis de Ambiente**
```bash
# Crie arquivo .env.production com suas chaves:
cp .env.production.example .env.production

# Edite e adicione todas as chaves LIVE:
nano .env.production
```

#### 🚀 **3.2 Deploy Automatizado**
```bash
# 1. Copie arquivos para servidor:
scp -r . root@[IP_DROPLET]:/opt/recibolegal/

# 2. Execute script de deploy:
ssh root@[IP_DROPLET]
cd /opt/recibolegal
chmod +x deploy.sh
./deploy.sh

# 3. Configure SSL e domínio:
# O script já configura automaticamente
```

---

### **ETAPA 4: Testes e Validação**

#### 🧪 **4.1 Testes Críticos**
```bash
# 1. Teste acesso ao site:
curl -I https://recibolegal.com.br

# 2. Teste API:
curl https://recibolegal.com.br/api/health

# 3. Teste WhatsApp (após aprovação):
# Envie mensagem para seu número WhatsApp Business

# 4. Teste pagamento:
# Faça uma compra de teste com Stripe
```

#### 📊 **4.2 Monitoramento**
```bash
# O sistema inclui monitoramento automático:
# - Health checks a cada 5 minutos
# - Logs centralizados
# - Backup diário
# - Alertas por email
```

---

## ⏱️ **CRONOGRAMA ESTIMADO**

| Etapa | Tempo | Observações |
|-------|-------|-------------|
| Stripe setup | 30 min | Imediato |
| Twilio upgrade | 30 min | Aprovação: 1-3 dias |
| WhatsApp templates | 15 min | Aprovação: 24-48h |
| Firebase setup | 15 min | Imediato |
| DNS configuração | 10 min | Propagação: 24h |
| Deploy servidor | 45 min | Imediato |
| Testes finais | 30 min | Imediato |

**TOTAL: ~3 horas de trabalho + 2-3 dias de aprovações**

---

## 🆘 **SUPORTE E TROUBLESHOOTING**

### **Problemas Comuns:**

1. **SSL não funciona:**
   ```bash
   sudo certbot --nginx -d recibolegal.com.br -d www.recibolegal.com.br
   ```

2. **WhatsApp não responde:**
   - Verifique se templates foram aprovados
   - Confirme webhook URL
   - Teste com número autorizado

3. **Stripe webhook falha:**
   - Verifique endpoint: `/api/webhooks/stripe`
   - Confirme secret key no .env
   - Teste com Stripe CLI

4. **Site não carrega:**
   ```bash
   docker-compose -f docker-compose.prod.yml logs
   ```

---

## 📞 **CONTATOS DE EMERGÊNCIA**

- **DigitalOcean Support:** https://cloud.digitalocean.com/support
- **Stripe Support:** https://support.stripe.com
- **Twilio Support:** https://support.twilio.com
- **Firebase Support:** https://firebase.google.com/support

---

## 🎯 **PRÓXIMOS PASSOS APÓS DEPLOY**

1. **Marketing:** Configurar Google Analytics
2. **SEO:** Submeter sitemap ao Google
3. **Backup:** Testar restauração
4. **Escalabilidade:** Monitorar uso e otimizar
5. **Legal:** Termos de uso e política de privacidade
