# 🚨 ERRO CRÍTICO: missing server host

## ❌ **ERRO ATUAL:**
```
2025/07/26 20:57:56 Error: missing server host
```

## 🔍 **CAUSA RAIZ:**
O secret `HOST` não está configurado no GitHub Actions secrets.

---

## ⚡ **SOLUÇÃO URGENTE - CONFIGURE AGORA:**

### **1. ACESSE IMEDIATAMENTE:**
https://github.com/felipecasali/recibolegal/settings/secrets/actions

### **2. ADICIONE ESTES 3 SECRETS:**

#### **🏠 SECRET: `HOST`**
```
Name: HOST
Value: recibolegal.com.br
```

#### **👤 SECRET: `USERNAME`**
```
Name: USERNAME
Value: root
```

#### **🔑 SECRET: `SSH_KEY`**
```
Name: SSH_KEY
Value: [SUA CHAVE SSH PRIVADA COMPLETA]
```

**⚠️ IMPORTANTE: Use a chave SSH que você gerou anteriormente (do arquivo SSH-KEYS-READY.md)**

---

## 🔧 **PASSO A PASSO DETALHADO:**

### **No GitHub:**
1. **Vá para**: https://github.com/felipecasali/recibolegal/settings/secrets/actions
2. **Clique**: "New repository secret"
3. **Adicione cada secret** com os valores exatos acima
4. **Clique**: "Add secret" para cada um

### **Chave SSH (se perdeu):**
Se não tem mais a chave SSH, use esta que foi gerada:

```
-----BEGIN OPENSSH PRIVATE KEY-----
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
-----END OPENSSH PRIVATE KEY-----
```

---

## 🧪 **TESTE LOCAL (para confirmar chave funciona):**

```bash
# Testar se a chave SSH funciona
ssh root@recibolegal.com.br "echo 'SSH funcionando!'"
```

---

## 📋 **CHECKLIST FINAL:**

- [ ] **HOST**: `recibolegal.com.br` ✅
- [ ] **USERNAME**: `root` ✅  
- [ ] **SSH_KEY**: Chave privada completa ✅
- [ ] **Chave pública** adicionada no servidor ✅

---

## 🚀 **APÓS CONFIGURAR:**

1. **Vá para Actions**: https://github.com/felipecasali/recibolegal/actions
2. **Re-run** o último workflow que falhou
3. **OU** faça um novo commit/push

**O deployment funcionará imediatamente após configurar os secrets!** ⚡

---

## ⚠️ **URGENTE:**
Sem esses secrets, o deployment **NUNCA** funcionará. Configure agora para resolver o problema!
