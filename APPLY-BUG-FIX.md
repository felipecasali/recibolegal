# 🚀 Comandos para Aplicar Correção do Bug no Servidor

## Situação Atual
O servidor já tem o código mais recente (`Already up to date`), o que significa que a correção do bug já foi baixada. Agora só precisa reiniciar os serviços.

---

## ⚡ Comandos para Executar (Copy/Paste)

### **1. Verificar se a correção está no código:**
```bash
grep -n "currentMonthUsage" server/routes/whatsapp.js
```
**Resultado esperado**: Deve mostrar linha com `currentMonthUsage` em vez de `receiptsThisMonth`

### **2. Reiniciar os serviços:**
```bash
docker-compose -f docker-compose.prod.yml restart
```

### **3. Aguardar inicialização:**
```bash
sleep 15
```

### **4. Verificar se está funcionando:**
```bash
curl -I https://recibolegal.com.br/api/health
docker-compose -f docker-compose.prod.yml ps
```

### **5. Monitorar logs em tempo real:**
```bash
docker-compose -f docker-compose.prod.yml logs -f app
```
*(Pressione Ctrl+C para sair)*

---

## 🧪 Teste da Correção

### **WhatsApp Bot:**
1. Envie `oi` para o bot
2. Complete o fluxo: Nome → CPF → Serviço → Valor → **Data**
3. A etapa da data não deve mais dar erro `receiptsThisMonth`

### **Verificar logs de erro:**
```bash
# Ver se ainda há erros relacionados ao bug
docker-compose -f docker-compose.prod.yml logs app | grep -i "receiptsThisMonth"
docker-compose -f docker-compose.prod.yml logs app | grep -i "Cannot read properties"
```

---

## ✅ Resultado Esperado

**Antes (com bug):**
```
Error: Cannot read properties of null (reading 'receiptsThisMonth')
```

**Depois (corrigido):**
- ✅ Fluxo completa sem erros
- ✅ Mensagem de limite adequada se necessário
- ✅ Geração de recibo funciona normalmente

---

## 🎯 Resumo dos Comandos (Sequência Completa)

```bash
# Verificar correção
grep -n "currentMonthUsage" server/routes/whatsapp.js

# Reiniciar serviços
docker-compose -f docker-compose.prod.yml restart

# Aguardar
sleep 15

# Verificar status
curl -I https://recibolegal.com.br/api/health
docker-compose -f docker-compose.prod.yml ps

# Monitorar (opcional)
docker-compose -f docker-compose.prod.yml logs --tail=20 app
```
