# 🔧 CONFIGURAÇÃO SLACK WEBHOOK (OPCIONAL)

## 📝 **O que é SLACK_WEBHOOK_URL?**

É um URL especial que permite ao GitHub Actions enviar notificações para um canal do Slack quando o deployment é concluído (sucesso ou falha).

---

## 🔗 **Como configurar (SE QUISER notificações Slack):**

### **1. Criar Slack App (se não tiver)**
1. Acesse: https://api.slack.com/apps
2. Clique "Create New App" → "From scratch"
3. Nome: "ReciboLegal Deploy"
4. Workspace: Escolha seu workspace

### **2. Configurar Incoming Webhook**
1. Na app criada, vá em "Incoming Webhooks"
2. Ative "Activate Incoming Webhooks"
3. Clique "Add New Webhook to Workspace"
4. Escolha o canal (ex: #deploys, #general)
5. Clique "Allow"

### **3. Copiar Webhook URL**
O URL será algo como:
```
https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX
```

### **4. Adicionar ao GitHub Secrets**
1. Acesse: https://github.com/felipecasali/recibolegal/settings/secrets/actions
2. Clique "New repository secret"
3. Name: `SLACK_WEBHOOK_URL`
4. Value: Cole o webhook URL completo
5. Clique "Add secret"

---

## ✅ **SOLUÇÃO ATUAL: Removido do Workflow**

**Removi a notificação Slack do workflow** para que o deployment funcione imediatamente sem precisar configurar o Slack.

**O deployment agora deve funcionar** apenas com os secrets essenciais:
- `HOST`: recibolegal.com.br
- `USERNAME`: root  
- `SSH_KEY`: Chave SSH privada

---

## 🔄 **PRÓXIMOS PASSOS**

1. **Configure os secrets essenciais** se ainda não configurou
2. **Faça um novo commit** para disparar o workflow atualizado
3. **Opcionalmente**, configure o Slack later se quiser notificações

**O deployment não falhará mais por falta do SLACK_WEBHOOK_URL!** ✅
