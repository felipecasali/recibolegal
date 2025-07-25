# 📱 Finalização da Configuração Twilio WhatsApp

## 🎯 Status Atual
✅ **Frontend atualizado e funcionando**  
✅ **SSL/HTTPS configurado** (https://recibolegal.com.br)  
✅ **Scripts do Twilio criados**  
🔄 **Próximo passo**: Configurar credenciais e testar

---

## 🚀 Passos para Finalizar (15-20 minutos)

### **1. Obter Credenciais do Twilio** (5 min)

Se ainda não tem, acesse: https://console.twilio.com
- **Account SID**: Na dashboard principal
- **Auth Token**: Na dashboard principal (clique em "Show")

### **2. Configurar Variáveis de Ambiente** (5 min)

Execute no servidor para configurar as credenciais:

```bash
# Conectar ao servidor
ssh seu-usuario@seu-servidor

# Navegar para o projeto
cd /opt/recibolegal

# Executar configuração interativa
./configure-twilio-production.sh
```

### **3. Configurar Webhook no Twilio** (5 min)

1. **Acesse**: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
2. **Configure Webhook**:
   - **URL**: `https://recibolegal.com.br/api/whatsapp/webhook`
   - **HTTP Method**: `POST`
   - **Save Configuration**

### **4. Testar no Sandbox** (5 min)

1. **Obtenha seu código de sandbox** (ex: `join abc-def`)
2. **No WhatsApp**, envie:
   - Para: `+1 415 523 8886`
   - Mensagem: `join abc-def`
3. **Teste o bot**:
   - Envie: `oi`
   - Siga o fluxo de criação de recibo

---

## 🤖 Comandos do Bot

| Comando | Função |
|---------|---------|
| `oi` / `olá` | Iniciar criação de recibo |
| `status` | Ver informações da conta |
| `planos` | Ver planos disponíveis |
| `recomeçar` | Reiniciar processo |

---

## 🔍 Verificação Rápida

### **Testar se tudo está funcionando:**

```bash
# No servidor
cd /opt/recibolegal

# Verificar saúde da API
curl https://recibolegal.com.br/api/health

# Verificar webhook
curl -X POST https://recibolegal.com.br/api/whatsapp/webhook
```

### **Logs para monitorar:**

```bash
# Ver logs da aplicação
docker-compose -f docker-compose.prod.yml logs -f app

# Ver logs do Twilio no console
# https://console.twilio.com/us1/monitor/logs/sms
```

---

## 🎯 Fluxo de Teste Completo

### **1. Configuração** (você está aqui)
- ✅ Credenciais do Twilio
- ✅ Webhook configurado
- ✅ Sandbox ativo

### **2. Teste de Sandbox** (próximo)
- 📱 Enviar mensagem de teste
- 🤖 Conversar com o bot
- 📄 Gerar recibo de teste

### **3. Solicitação de Produção** (após teste)
- 📝 Solicitar WhatsApp Business API
- ⏳ Aguardar aprovação (1-5 dias)
- 🚀 Ir para produção

---

## 🚨 Se algo der errado

### **Webhook não funciona:**
```bash
# Verificar se a aplicação está rodando
docker ps

# Testar endpoint manualmente
curl -I https://recibolegal.com.br/api/whatsapp/webhook
```

### **Bot não responde:**
```bash
# Verificar credenciais
./configure-twilio-production.sh

# Ver logs de erro
docker-compose -f docker-compose.prod.yml logs app | grep -i error
```

### **Problemas de SSL:**
```bash
# Verificar certificado
curl -I https://recibolegal.com.br
```

---

## 📞 Links Úteis

- **Twilio Console**: https://console.twilio.com
- **WhatsApp Sandbox**: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn  
- **Webhook Logs**: https://console.twilio.com/us1/monitor/logs/sms
- **Sua Aplicação**: https://recibolegal.com.br

---

## 🎉 Próximos Passos

1. **Execute**: `./configure-twilio-production.sh`
2. **Configure webhook** no Twilio Console
3. **Teste** no sandbox do WhatsApp
4. **Reporte** os resultados para ajustes finais

**Tempo estimado total**: 15-20 minutos

---

### 💡 Dica
Mantenha o Twilio Console aberto em uma aba para ver os logs em tempo real enquanto testa!
