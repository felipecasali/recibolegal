# 📱 Comandos para Atualizar Twilio no Servidor

## 🎯 Objetivo
Atualizar as variáveis do Twilio no servidor de produção e reiniciar os serviços.

---

## 🚀 Comandos para Executar no Servidor

### **1. Conectar ao Servidor**
```bash
ssh seu-usuario@seu-servidor
```

### **2. Navegar para o Projeto**
```bash
cd /opt/recibolegal
```

### **3. Fazer Backup do .env Atual**
```bash
cp .env.production .env.production.backup.$(date +%Y%m%d_%H%M%S)
```

### **4. Editar as Variáveis do Twilio**
```bash
# Opção A: Usar nano (mais fácil)
nano .env.production

# Opção B: Usar sed para substituir automaticamente
sed -i 's/TWILIO_WHATSAPP_NUMBER=.*/TWILIO_WHATSAPP_NUMBER=whatsapp:+551150281981/' .env.production
sed -i 's/TWILIO_WHATSAPP_FROM=.*/TWILIO_WHATSAPP_FROM=whatsapp:+551150281981/' .env.production
```

### **5. Verificar se as Alterações foram Aplicadas**
```bash
grep -E "TWILIO_WHATSAPP_(NUMBER|FROM)" .env.production
```

**Resultado esperado:**
```
TWILIO_WHATSAPP_NUMBER=whatsapp:+551150281981
TWILIO_WHATSAPP_FROM=whatsapp:+551150281981
```

### **6. Reiniciar os Serviços Docker**
```bash
# Parar os containers
docker-compose -f docker-compose.prod.yml down

# Iniciar novamente com as novas variáveis
docker-compose -f docker-compose.prod.yml up -d

# Aguardar inicialização
sleep 15
```

### **7. Verificar se os Serviços Estão Rodando**
```bash
# Ver status dos containers
docker-compose -f docker-compose.prod.yml ps

# Verificar saúde da aplicação
curl -I https://recibolegal.com.br/api/health
```

### **8. Testar o Endpoint do WhatsApp**
```bash
curl -X POST https://recibolegal.com.br/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "connection"}'
```

### **9. Ver Logs para Confirmar**
```bash
# Ver logs em tempo real (pressione Ctrl+C para sair)
docker-compose -f docker-compose.prod.yml logs -f app

# Ver apenas as últimas 20 linhas
docker-compose -f docker-compose.prod.yml logs --tail=20 app
```

---

## 🔍 Verificação Final

### **Teste Rápido do Twilio:**
```bash
# Executar o script de verificação
./configure-twilio-production.sh
```

### **Verificar Variáveis Carregadas:**
```bash
# Ver se as variáveis estão sendo lidas corretamente
docker-compose -f docker-compose.prod.yml exec app printenv | grep TWILIO
```

---

## 📱 Teste no WhatsApp (Sandbox)

### **1. Acesse o Twilio Console:**
- URL: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn

### **2. Configure o Webhook (se ainda não fez):**
- **Webhook URL**: `https://recibolegal.com.br/api/whatsapp/webhook`
- **HTTP Method**: `POST`

### **3. Teste no WhatsApp:**
```
1. Envie para +1 415 523 8886: join <seu-codigo-sandbox>
2. Aguarde confirmação do Twilio
3. Envie: oi
4. Siga o fluxo do bot para criar um recibo
```

---

## 🚨 Se Algo Der Errado

### **Restaurar Backup:**
```bash
# Listar backups disponíveis
ls -la .env.production.backup.*

# Restaurar backup (substitua TIMESTAMP pela data/hora do backup)
cp .env.production.backup.TIMESTAMP .env.production

# Reiniciar serviços
docker-compose -f docker-compose.prod.yml restart
```

### **Verificar Logs de Erro:**
```bash
# Ver erros específicos do Twilio
docker-compose -f docker-compose.prod.yml logs app | grep -i twilio

# Ver todos os erros
docker-compose -f docker-compose.prod.yml logs app | grep -i error
```

### **Rebuild Completo (se necessário):**
```bash
# Parar tudo
docker-compose -f docker-compose.prod.yml down

# Rebuild das imagens
docker-compose -f docker-compose.prod.yml build --no-cache

# Iniciar novamente
docker-compose -f docker-compose.prod.yml up -d
```

---

## ✅ Checklist de Verificação

- [ ] Backup do .env criado
- [ ] Variáveis TWILIO_WHATSAPP_NUMBER e TWILIO_WHATSAPP_FROM atualizadas
- [ ] Containers reiniciados
- [ ] API health check funcionando
- [ ] Webhook endpoint respondendo
- [ ] Logs sem erros críticos
- [ ] Teste no sandbox do WhatsApp realizado

---

## 🎯 Próximos Passos Após Atualização

1. **Testar o bot** no sandbox do WhatsApp
2. **Solicitar aprovação** para WhatsApp Business API (se ainda não fez)
3. **Monitorar logs** por algumas horas
4. **Configurar alertas** para webhooks falhando

---

## 📞 Links Úteis

- **Twilio Console**: https://console.twilio.com
- **WhatsApp Sandbox**: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
- **Webhook Logs**: https://console.twilio.com/us1/monitor/logs/sms
- **Sua Aplicação**: https://recibolegal.com.br
- **API Health**: https://recibolegal.com.br/api/health

---

### 💡 Dica Extra
Mantenha uma aba aberta no Twilio Console > Logs para ver as mensagens em tempo real enquanto testa o bot!
