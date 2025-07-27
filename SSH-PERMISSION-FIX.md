# 🔑 RESOLVER: Permission denied (publickey) - ReciboLegal

## 🚨 **Erro Atual:**
```
ssh root@recibolegal.com.br "echo 'SSH OK'"
root@recibolegal.com.br: Permission denied (publickey).
```

## 🔍 **Causa:**
Não há chave SSH configurada ou a chave pública não está no servidor.

---

## ✅ **SOLUÇÃO PASSO A PASSO**

### **1. Gerar Chave SSH Local (no seu Mac)**

```bash
# Verificar se já existe chave
ls -la ~/.ssh/

# Se não existir, gerar nova chave
ssh-keygen -t rsa -b 4096 -C "deploy@recibolegal.com.br"
# Pressione Enter para localização padrão (~/.ssh/id_rsa)
# Pressione Enter para passphrase vazia (importante para GitHub Actions)

# Verificar se foi criada
ls -la ~/.ssh/
# Deve mostrar: id_rsa (privada) e id_rsa.pub (pública)
```

### **2. Copiar Chave Pública para o Servidor**

#### **Opção A: Usando ssh-copy-id (Recomendado)**
```bash
# Copiar chave automaticamente
ssh-copy-id root@recibolegal.com.br
# Vai pedir a senha do root uma vez

# Testar conexão
ssh root@recibolegal.com.br "echo 'SSH OK'"
```

#### **Opção B: Cópia Manual**
```bash
# 1. Copiar conteúdo da chave pública
cat ~/.ssh/id_rsa.pub
# Copie a saída completa

# 2. Conectar ao servidor com senha
ssh root@recibolegal.com.br
# Digite a senha

# 3. No servidor, adicionar chave ao authorized_keys
mkdir -p ~/.ssh
echo "COLE_AQUI_O_CONTEUDO_DA_CHAVE_PUBLICA" >> ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
exit

# 4. Testar conexão sem senha
ssh root@recibolegal.com.br "echo 'SSH OK'"
```

### **3. Configurar GitHub Secrets**

Após SSH funcionar, configure os secrets:

```bash
# Copiar chave PRIVADA para GitHub Secret
cat ~/.ssh/id_rsa
```

**No GitHub** (https://github.com/felipecasali/recibolegal/settings/secrets/actions):

| Secret | Valor |
|--------|-------|
| `SSH_KEY` | Conteúdo completo de `cat ~/.ssh/id_rsa` |
| `HOST` | `recibolegal.com.br` |
| `USERNAME` | `root` |

---

## 🧪 **TESTE COMPLETO**

Execute estes comandos em sequência:

```bash
# 1. Teste SSH básico
ssh root@recibolegal.com.br "echo 'Teste 1: SSH OK'"

# 2. Teste navegação para diretório do projeto
ssh root@recibolegal.com.br "cd /opt/recibolegal && pwd"

# 3. Teste comando Git
ssh root@recibolegal.com.br "cd /opt/recibolegal && git status"

# 4. Teste Docker
ssh root@recibolegal.com.br "docker --version"

# Se todos funcionarem, GitHub Actions também funcionará!
```

---

## 🔧 **SOLUÇÃO RÁPIDA (Comando Único)**

Se você tem acesso SSH com senha, execute:

```bash
# Gerar chave e copiar automaticamente
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N "" && ssh-copy-id root@recibolegal.com.br
```

---

## ⚠️ **Problemas Comuns**

### **SSH ainda pede senha:**
```bash
# Verificar permissões no servidor
ssh root@recibolegal.com.br "ls -la ~/.ssh/ && cat ~/.ssh/authorized_keys"
```

### **"Host key verification failed":**
```bash
# Remover host conhecido e tentar novamente
ssh-keygen -R recibolegal.com.br
ssh root@recibolegal.com.br "echo 'SSH OK'"
```

### **Servidor rejeita chave:**
```bash
# Verificar configuração SSH do servidor
ssh root@recibolegal.com.br "grep -E '^(PubkeyAuthentication|AuthorizedKeysFile|PermitRootLogin)' /etc/ssh/sshd_config"
```

---

## 🎯 **PRÓXIMOS PASSOS**

1. **✅ Configurar SSH** entre seu Mac e servidor
2. **✅ Testar conexão** sem senha
3. **✅ Configurar secrets** no GitHub
4. **✅ Re-executar workflow** de deploy

---

## 📞 **Se Não Funcionar**

Execute este comando para debug detalhado:
```bash
ssh -vvv root@recibolegal.com.br
```

**Configure a chave SSH primeiro, depois o GitHub Actions funcionará!** 🔑
