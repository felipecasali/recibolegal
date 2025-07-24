# 🔄 Guia de Gerenciamento de Ambientes - ReciboLegal

## 🎯 **RESUMO DA SOLUÇÃO**

Problema resolvido: **Como alternar entre chaves de teste e produção sem perder configurações**

Solução: **3 arquivos separados + script de troca automática**

---

## 📁 **ESTRUTURA DE ARQUIVOS**

```
ReciboLegal/
├── .env                    # ← Arquivo ativo (não comitar)
├── .env.development        # ← Desenvolvimento (pode comitar)
├── .env.staging           # ← Homologação (não comitar)
├── .env.production        # ← Produção (não comitar)
├── .env.production.example # ← Template (pode comitar)
└── switch-env.sh          # ← Script de troca
```

---

## 🚀 **COMO USAR**

### **1. Desenvolvimento (padrão)**
```bash
# Alternar para desenvolvimento
npm run env:dev
# ou
bash switch-env.sh development

# Usar no dia a dia
npm run dev:full
```

### **2. Teste/Staging**
```bash
# Alternar para staging
npm run env:staging

# Usar para testes finais
npm run dev:full
```

### **3. Produção**
```bash
# Alternar para produção
npm run env:prod

# Deploy
npm run prod:up
```

### **4. Verificar ambiente atual**
```bash
npm run env:status
```

---

## 🔐 **CONFIGURAÇÃO INICIAL**

### **1. Primeira vez - Configurar produção:**
```bash
# 1. Copie o template
cp .env.production.example .env.production

# 2. Edite com suas chaves LIVE
nano .env.production

# 3. Configure Stripe para produção
npm run env:prod
npm run setup:stripe

# 4. Volte para desenvolvimento
npm run env:dev
```

### **2. No .env.production, substitua:**
```bash
# ❌ Chaves de teste (começam com pk_test_, sk_test_)
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# ✅ Chaves LIVE (começam com pk_live_, sk_live_)
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
```

---

## 🛡️ **SEGURANÇA**

### **Arquivos protegidos pelo .gitignore:**
- ✅ `.env` (arquivo ativo)
- ✅ `.env.production` (chaves live)
- ✅ `.env.staging` (configuração staging)
- ✅ `.env.backup_*` (backups)

### **Arquivos no Git (seguros):**
- ✅ `.env.development` (apenas chaves de teste)
- ✅ `.env.production.example` (template sem chaves)

---

## 🔄 **FLUXO DE TRABALHO DIÁRIO**

### **Desenvolvendo:**
```bash
npm run env:dev     # Chaves de teste
npm run dev:full    # Desenvolver
```

### **Testando antes de produção:**
```bash
npm run env:staging # Teste com webhooks reais
npm run dev:full    # Testar
```

### **Deploy para produção:**
```bash
npm run env:prod    # Chaves live
npm run prod:up     # Deploy
```

### **Voltando para desenvolvimento:**
```bash
npm run env:dev     # Volta para teste
```

---

## 🆘 **COMANDOS ÚTEIS**

### **Scripts disponíveis:**
```bash
# Ambientes
npm run env:dev      # → desenvolvimento
npm run env:staging  # → staging/teste
npm run env:prod     # → produção
npm run env:status   # → mostrar ambiente atual

# Setup (executar no ambiente certo)
npm run setup:stripe    # Configurar produtos Stripe
npm run setup:whatsapp  # Configurar templates WhatsApp
npm run setup:firebase  # Configurar Firebase

# Listas (verificar configurações)
npm run stripe:list     # Listar produtos Stripe
npm run whatsapp:list   # Listar templates WhatsApp
```

### **Verificações importantes:**
```bash
# Ver qual ambiente está ativo
grep "NODE_ENV=" .env

# Ver se é teste ou produção no Stripe
grep "STRIPE_PUBLISHABLE_KEY=" .env

# Ver modo de simulação
grep "SIMULATION_MODE=" .env
```

---

## ⚠️ **AVISOS IMPORTANTES**

### **🔴 NUNCA FAÇA:**
- Não comite arquivos `.env.production` ou `.env.staging`
- Não use chaves live em desenvolvimento
- Não deixe `SIMULATION_MODE=true` em produção

### **✅ SEMPRE FAÇA:**
- Verifique o ambiente antes de executar
- Use `npm run env:status` para confirmar
- Teste no staging antes da produção
- Mantenha backups das configurações

---

## 🧪 **EXEMPLO PRÁTICO**

```bash
# 1. Trabalhando normalmente (desenvolvimento)
npm run env:dev
npm run dev:full
# → Usa chaves de teste, modo simulação ativo

# 2. Testando webhook real (staging)
npm run env:staging
npm run dev:full
# → Usa chaves de teste, mas webhooks reais

# 3. Deploy produção
npm run env:prod
npm run prod:up
# → Usa chaves live, modo produção ativo

# 4. Voltar para desenvolvimento
npm run env:dev
npm run dev:full
# → Volta para chaves de teste
```

---

## 🎉 **VANTAGENS DESTA ABORDAGEM**

✅ **Nunca perde configurações**
✅ **Troca rápida entre ambientes**
✅ **Backups automáticos**
✅ **Segurança (arquivos sensíveis não vão pro Git)**
✅ **Scripts simples e claros**
✅ **Avisos visuais do ambiente ativo**

---

## 📞 **SUPORTE**

**Problema comum:** "Não sei qual ambiente está ativo"
**Solução:** `npm run env:status`

**Problema comum:** "Perdi a configuração anterior"
**Solução:** Use os backups `.env.backup_*`

**Problema comum:** "Acidentalmente usei chaves live em teste"
**Solução:** `npm run env:dev` (volta para teste)

---

Agora você pode **desenvolver com chaves de teste** e **fazer deploy com chaves live** sem nunca perder configurações! 🚀
