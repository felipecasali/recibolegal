# Correção Twilio Error 63031 - Bot Messaging Itself

## 🚨 **Problema Identificado**

**Erro:** `RestException [Error]: Message cannot have the same To and From for account`
**Código:** `63031`
**URL de Referência:** https://www.twilio.com/docs/errors/63031

### **Causa Raiz**
O bot WhatsApp estava tentando enviar mensagens para seu próprio número, causando o erro 63031 do Twilio.

### **Logs do Erro**
```
recibolegal_1  | Full error: RestException [Error]: Message cannot have the same To and From for account [ACCOUNT_SID]
recibolegal_1  |   status: 400,
recibolegal_1  |   code: 63031,
recibolegal_1  |   moreInfo: 'https://www.twilio.com/docs/errors/63031',
```

## 🔧 **Correções Aplicadas**

### **1. Verificação no Webhook (Entrada)**
```javascript
// Webhook endpoint - Adiciona verificação inicial
router.post('/webhook', async (req, res) => {
  try {
    const { Body, From, To, ButtonPayload } = req.body || {};
    const userPhone = From;
    
    // ⚠️ CRITICAL CHECK: Ignore messages from bot's own number
    if (userPhone === WHATSAPP_NUMBER) {
      console.log(`🚫 IGNORED: Message from bot's own number (${WHATSAPP_NUMBER})`);
      console.log(`❌ This prevents infinite loops and Twilio error 63031`);
      return res.status(200).send('OK'); // Return success but don't process
    }
    
    // ... resto do código
  }
});
```

### **2. Verificação na Função de Envio (Saída)**
```javascript
// Function to send WhatsApp message - Adiciona verificação antes do envio
async function sendWhatsAppMessage(to, message) {
  try {
    // ... formatação do número ...
    
    // ⚠️ CRITICAL CHECK: Prevent bot from messaging itself
    if (formattedTo === WHATSAPP_NUMBER) {
      console.log(`🚫 BLOCKED: Attempted to send message to bot's own number (${WHATSAPP_NUMBER})`);
      console.log(`❌ This would cause Twilio error 63031: Message cannot have the same To and From`);
      return; // Exit early without sending message
    }
    
    // ... envio da mensagem ...
  }
}
```

## 🛡️ **Proteções Implementadas**

### **Dupla Verificação**
1. **No Webhook:** Ignora mensagens recebidas do próprio bot
2. **No Envio:** Bloqueia tentativas de envio para o próprio número

### **Logs Informativos**
- ✅ Logs claros quando uma mensagem é bloqueada
- ✅ Referência explícita ao erro 63031
- ✅ Explicação do motivo do bloqueio

## 🧪 **Como Testar a Correção**

### **Teste 1: Monitorar Logs**
```bash
# Verificar se erro 63031 ainda aparece
docker-compose -f docker-compose.prod.yml logs -f recibolegal | grep "63031"
```

### **Teste 2: Contar Ocorrências**
```bash
# Contar quantas vezes o erro apareceu
docker-compose -f docker-compose.prod.yml logs recibolegal | grep -c "63031"
```

### **Teste 3: Verificar Funcionamento Normal**
```bash
# Testar geração de recibo (deve funcionar normalmente)
curl -X POST -H "Content-Type: application/json" \
  -d '{"clientName":"Teste","clientDocument":"123456789","serviceName":"Teste","amount":"100","date":"2025-07-30"}' \
  https://recibolegal.com.br/api/receipts/generate
```

## 🚀 **Como Aplicar a Correção**

### **Opção 1: Git Pull (Recomendada)**
```bash
cd /opt/recibolegal
git pull origin main
docker-compose -f docker-compose.prod.yml restart recibolegal
```

### **Opção 2: Script Automatizado**
```bash
cd /opt/recibolegal
chmod +x fix-twilio-63031.sh
./fix-twilio-63031.sh
```

### **Opção 3: Manual**
```bash
cd /opt/recibolegal
docker-compose -f docker-compose.prod.yml restart recibolegal
```

## 📊 **Resultados Esperados**

### **Antes da Correção**
- ❌ Múltiplas ocorrências do erro 63031
- ❌ Bot tentando responder para si mesmo
- ❌ Logs de erro constantes

### **Após a Correção**
- ✅ Zero ocorrências do erro 63031
- ✅ Bot ignora mensagens do próprio número
- ✅ Funcionamento normal preservado
- ✅ Logs informativos sobre bloqueios

## 🔍 **Cenários que Causavam o Problema**

1. **Loop de Mensagens:** Bot processando suas próprias mensagens
2. **Configuração Incorreta:** Número de origem igual ao destino
3. **Teste Manual:** Tentativa de enviar mensagem para o próprio bot

## ✅ **Validação da Correção**

### **Indicadores de Sucesso**
- ✅ Logs não mostram mais erro 63031
- ✅ Mensagens são enviadas normalmente para usuários
- ✅ Geração de recibo funciona sem erros
- ✅ Bot não processa mensagens do próprio número

### **Comandos de Monitoramento**
```bash
# Ver logs em tempo real
docker-compose -f docker-compose.prod.yml logs -f recibolegal

# Buscar erros específicos
docker-compose -f docker-compose.prod.yml logs recibolegal | grep -E "(63031|RestException|Error.*same.*To.*From)"

# Verificar mensagens bloqueadas (esperado)
docker-compose -f docker-compose.prod.yml logs recibolegal | grep "BLOCKED\|IGNORED"
```

---

**Status:** 🟢 Correção aplicada e testada  
**Impacto:** 🔴 Alto (eliminação de erro crítico)  
**Tempo de aplicação:** 2-3 minutos  
**Risk:** 🟢 Baixo (apenas adiciona verificações de segurança)
