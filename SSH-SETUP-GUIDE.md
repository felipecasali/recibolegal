# 🔑 Configuração SSH para GitHub Actions - ReciboLegal

## 🚨 **Erro Atual**
```
Error: can't connect without a private SSH key or password
```

## 🔧 **Solução: Configurar SSH Keys**

### **1. No Servidor - Gerar/Obter Chave SSH**

```bash
# Conectar ao servidor
ssh root@recibolegal.com.br

# Gerar nova chave SSH (se não existir)
ssh-keygen -t rsa -b 4096 -C "github-actions@recibolegal.com.br"
# Pressione Enter para todas as perguntas (sem passphrase)

# Ou usar chave existente
ls ~/.ssh/
# Procure por: id_rsa (privada) e id_rsa.pub (pública)

# Copiar chave PRIVADA (para GitHub Secrets)
cat ~/.ssh/id_rsa
# Copie TODO o conteúdo (incluindo -----BEGIN/END-----)

# Copiar chave PÚBLICA (para authorized_keys)
cat ~/.ssh/id_rsa.pub

# Adicionar chave pública ao authorized_keys
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### **2. No GitHub - Configurar Secrets**

1. **Acesse**: https://github.com/felipecasali/recibolegal/settings/secrets/actions

2. **Adicione estes secrets**:

   **SSH_KEY** (Repository secret):
   ```
   -----BEGIN OPENSSH PRIVATE KEY-----
   [CONTEÚDO DA CHAVE PRIVADA - cat ~/.ssh/id_rsa]
   -----END OPENSSH PRIVATE KEY-----
   ```

   **HOST** (Repository secret):
   ```
   recibolegal.com.br
   ```
   
   **USERNAME** (Repository secret):
   ```
   root
   ```

### **3. Testar Conexão SSH**

```bash
# Do seu computador local, teste:
ssh -i ~/.ssh/id_rsa root@recibolegal.com.br "echo 'SSH funcionando'"

# Se funcionar, o GitHub Actions também funcionará
```

### **4. Configurações Adicionais do Servidor**

```bash
# No servidor, verificar configuração SSH
sudo nano /etc/ssh/sshd_config

# Certificar que estão habilitados:
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
PermitRootLogin yes

# Reiniciar SSH (se mudou algo)
sudo systemctl restart ssh
```

---

## 🔄 **Workflow Atualizado para Debug**

Vou atualizar o workflow para melhor tratamento de erros SSH:

```yaml
- name: Deploy to server
  uses: appleboy/ssh-action@v1.0.3  # Versão mais recente
  with:
    host: ${{ secrets.HOST }}
    username: ${{ secrets.USERNAME }}
    key: ${{ secrets.SSH_KEY }}
    port: 22
    timeout: 60s
    command_timeout: 30m
    script: |
      # Debug info
      echo "🔍 SSH connection successful!"
      echo "📁 Current directory: $(pwd)"
      echo "👤 User: $(whoami)"
      
      # Navigate to project
      cd /opt/recibolegal || { echo "❌ Directory not found"; exit 1; }
      
      # Update code
      echo "📥 Pulling latest code..."
      git pull origin main || { echo "❌ Git pull failed"; exit 1; }
      
      # Build and deploy
      echo "🐳 Building containers..."
      docker-compose -f docker-compose.prod.yml build || { echo "❌ Build failed"; exit 1; }
      
      echo "🚀 Starting containers..."
      docker-compose -f docker-compose.prod.yml up -d || { echo "❌ Container start failed"; exit 1; }
      
      # Wait and health check
      echo "⏳ Waiting for services..."
      sleep 45
      
      echo "🏥 Health check..."
      if curl -f http://localhost:3001/api/health; then
        echo "✅ Deploy successful!"
      else
        echo "❌ Health check failed!"
        docker-compose -f docker-compose.prod.yml logs --tail=20
        exit 1
      fi
```

---

## 🧪 **Teste Rápido SSH**

Para testar se as configurações estão corretas:

```bash
# Teste de conexão
ssh -o ConnectTimeout=10 root@recibolegal.com.br "echo 'Teste SSH OK'"

# Se der erro, debug:
ssh -v root@recibolegal.com.br
```

---

## ⚠️ **Secrets Necessários no GitHub**

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `SSH_KEY` | Conteúdo de `~/.ssh/id_rsa` | Chave SSH privada |
| `HOST` | `recibolegal.com.br` | Hostname do servidor |
| `USERNAME` | `root` | Usuário SSH |
| `SLACK_WEBHOOK_URL` | URL do Slack (opcional) | Para notificações |

---

## 🎯 **Próximos Passos**

1. **Configurar SSH Keys** no servidor e GitHub
2. **Atualizar secrets** no repositório
3. **Testar conexão SSH** manualmente
4. **Re-executar workflow** (ou fazer novo push)

**Configure as chaves SSH e os secrets para resolver o erro de conexão!** 🔑
