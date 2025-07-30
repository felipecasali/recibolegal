# ReciboLegal - WhatsApp Receipt Generator

ReciboLegal é uma plataforma que permite a freelancers e pequenos negócios gerar recibos, contratos e comprovantes de serviços via WhatsApp de forma simples e automatizada.

## 🚨 Problemas SSL Resolvidos

Se as mensagens WhatsApp não estão sendo respondidas em produção, provavelmente é um problema de SSL. **Execute no servidor:**

```bash
./check-ssl.sh    # Verificar status
./fix-ssl.sh      # Corrigir problemas
```

📖 **[Guia Completo de Correção SSL](./CORRIGIR-SSL.md)**

## 🚀 Quick Start

### Desenvolvimento Local
```bash
npm install
npm run dev
```

### Produção
```bash
./deploy-prod.sh  # Deploy completo com SSL
```

## 📋 Scripts Disponíveis

- `./check-ssl.sh` - Verificar status do certificado SSL
- `./fix-ssl.sh` - Corrigir problemas de SSL 
- `./deploy-prod.sh` - Deploy completo para produção

## 🔧 Tecnologias

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **WhatsApp:** Twilio API
- **Deployment:** Docker + Traefik + Let's Encrypt
- **SSL:** Certificados automáticos Let's Encrypt

## ⚠️ Troubleshooting

### Mensagens WhatsApp não funcionam?
1. Execute `./check-ssl.sh` no servidor
2. Se SSL estiver com problema, execute `./fix-ssl.sh`
3. Aguarde 2-3 minutos para propagação
4. Teste novamente

### Outros problemas?
- Verificar logs: `docker-compose -f docker-compose.prod.yml logs`
- Consultar: `SSL-TROUBLESHOOTING.md`
