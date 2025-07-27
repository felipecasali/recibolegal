# 🚨 ERRO: missing server host - GitHub Actions

## ❌ **Erro Atual:**
```
2025/07/26 11:35:31 Error: missing server host
```

## 🔍 **Causa:**
O secret `HOST` não está configurado no GitHub Actions secrets.

---

## ✅ **SOLUÇÃO IMEDIATA**

### **1. Configurar Secrets no GitHub**

**Acesse AGORA**: https://github.com/felipecasali/recibolegal/settings/secrets/actions

### **2. Adicionar os seguintes Repository Secrets:**

### **SECRET: `HOST`**
```
Name: HOST
Value: recibolegal.com.br  ✅ CONFIGURADO
```

#### **SECRET: `USERNAME`**  
```
Name: USERNAME
Value: root  ✅ CONFIGURADO
```

#### **SECRET: `SSH_KEY`**
```
Name: SSH_KEY
Value: [CHAVE SSH PRIVADA COMPLETA]  ✅ CONFIGURADO
```

---

## 🔑 **Para obter a chave SSH:**

### **No servidor:**
```bash
# Conectar ao servidor
ssh root@recibolegal.com.br

# Verificar se existe chave SSH
ls -la ~/.ssh/

# Se não existir, gerar nova chave:
ssh-keygen -t rsa -b 4096 -C "github-actions@recibolegal"
# Pressionar Enter em todas as perguntas (sem passphrase)

# Adicionar chave pública ao authorized_keys
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# COPIAR CHAVE PRIVADA (para GitHub secret SSH_KEY):
cat ~/.ssh/id_rsa
```

### **Copie EXATAMENTE assim:**
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAACFwAAAAdz...
[LINHAS DA CHAVE SSH PRIVADA]
...YNVNxHVkIbOM++5dGghwdNI+KrJsJt34wG5qfOkMUGWJBE+5
-----END OPENSSH PRIVATE KEY-----
```

---

## 📋 **CHECKLIST COMPLETO**

### **✅ Secrets que DEVEM estar configurados:**

- [ ] **HOST**: `recibolegal.com.br`
- [ ] **USERNAME**: `root` 
- [ ] **SSH_KEY**: Chave SSH privada completa
- [ ] **SLACK_WEBHOOK_URL**: (Opcional) URL do Slack

### **🔍 Como verificar se secrets estão configurados:**

1. Acesse: https://github.com/felipecasali/recibolegal/settings/secrets/actions
2. Deve mostrar os secrets (valores ficam ocultos)
3. Se não existirem, clique "New repository secret"

---

## 🧪 **TESTE LOCAL ANTES**

Antes de usar no GitHub Actions, teste SSH localmente:

```bash
# Teste básico de conexão
ssh root@recibolegal.com.br "echo 'SSH OK'"

# Teste comando específico do deploy
ssh root@recibolegal.com.br "cd /opt/recibolegal && pwd && whoami"

# Se ambos funcionarem, GitHub Actions também funcionará
```

---

## 🚀 **Após Configurar Secrets**

1. **Secrets configurados** ✅
2. **SSH testado** localmente ✅
3. **Re-executar workflow**:
   - GitHub Actions → Select workflow → "Re-run all jobs"
   - OU fazer novo push/commit

---

## ⚡ **AÇÃO IMEDIATA**

**CONFIGURE AGORA**:
1. https://github.com/felipecasali/recibolegal/settings/secrets/actions
2. Adicione: `HOST`, `USERNAME`, `SSH_KEY`
3. Re-execute o workflow

**O erro será resolvido imediatamente após configurar os secrets!** 🔑
