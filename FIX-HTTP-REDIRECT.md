# 🔧 Correção HTTP → HTTPS Redirect - ReciboLegal

## 🎯 **Problema Identificado**
- ❌ `http://recibolegal.com.br` retorna **404 Not Found**
- ✅ `https://recibolegal.com.br` funciona perfeitamente
- **Causa**: Traefik sem configuração de redirecionamento HTTP → HTTPS

---

## 📋 **Instruções para Aplicar no Servidor**

### **1. Conectar ao servidor**
```bash
ssh root@recibolegal.com.br
cd /opt/recibolegal
```

### **2. Atualizar código com correção**
```bash
git pull origin main
```

### **3. Verificar se a correção foi aplicada**
```bash
grep -A 15 "labels:" docker-compose.prod.yml
# Deve mostrar as novas labels de redirecionamento HTTP
```

### **4. Aplicar a correção (restart do Traefik)**
```bash
# Parar serviços
docker-compose -f docker-compose.prod.yml down

# Reiniciar com nova configuração
docker-compose -f docker-compose.prod.yml up -d
```

### **5. Aguardar inicialização**
```bash
sleep 30
```

### **6. Verificar status dos containers**
```bash
docker-compose -f docker-compose.prod.yml ps
# Ambos devem estar "Up"
```

### **7. Testar redirecionamento HTTP → HTTPS**
```bash
# Teste 1: HTTP deve redirecionar para HTTPS
curl -I http://recibolegal.com.br/

# Resultado esperado:
# HTTP/1.1 301 Moved Permanently
# Location: https://recibolegal.com.br/
```

### **8. Teste completo de funcionamento**
```bash
# Teste 2: HTTPS deve continuar funcionando
curl -I https://recibolegal.com.br/
# Deve retornar: HTTP/2 200

# Teste 3: API deve continuar funcionando
curl -s https://recibolegal.com.br/api/health
# Deve retornar: {"status":"OK","message":"ReciboLegal API is running"}
```

---

## ✅ **Resultados Esperados**

### **Antes da Correção:**
```bash
curl -I http://recibolegal.com.br/
# HTTP/1.1 404 Not Found  ← PROBLEMA
```

### **Após a Correção:**
```bash
curl -I http://recibolegal.com.br/
# HTTP/1.1 301 Moved Permanently  ← CORRIGIDO
# Location: https://recibolegal.com.br/
```

---

## 🔍 **Verificação Detalhada da Configuração**

### **Labels adicionadas ao docker-compose.prod.yml:**
```yaml
# HTTPS router (existente)
- "traefik.http.routers.recibolegal.entrypoints=websecure"

# HTTP router (NOVO - para redirecionamento)
- "traefik.http.routers.recibolegal-http.rule=Host(`recibolegal.com.br`) || Host(`www.recibolegal.com.br`)"
- "traefik.http.routers.recibolegal-http.entrypoints=web"
- "traefik.http.routers.recibolegal-http.middlewares=redirect-to-https"
- "traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https"
- "traefik.http.middlewares.redirect-to-https.redirectscheme.permanent=true"
```

---

## 🆘 **Se algo der errado**

### **Logs de debug:**
```bash
# Ver logs do Traefik
docker-compose -f docker-compose.prod.yml logs traefik

# Ver logs do container principal
docker-compose -f docker-compose.prod.yml logs recibolegal
```

### **Rollback (se necessário):**
```bash
# Reverter para configuração anterior
git log --oneline -5
git revert HEAD
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

---

## ⏱️ **Tempo Estimado**
- **Atualização código**: 30 segundos
- **Restart containers**: 1 minuto
- **Propagação configuração**: 30 segundos
- **Total**: ~2 minutos

---

## 🎉 **Resultado Final**

Após aplicar a correção:

✅ **http://recibolegal.com.br** → **Redireciona para HTTPS**  
✅ **https://recibolegal.com.br** → **Continua funcionando**  
✅ **Todos os navegadores** funcionarão com HTTP ou HTTPS  
✅ **SEO melhorado** com redirecionamento 301 permanente

---

## 🔗 **URLs que funcionarão:**

- ✅ http://recibolegal.com.br → Redireciona para HTTPS
- ✅ https://recibolegal.com.br → Funciona diretamente
- ✅ http://www.recibolegal.com.br → Redireciona para HTTPS
- ✅ https://www.recibolegal.com.br → Funciona diretamente

**Execute os comandos no servidor para corrigir o redirecionamento!** 🚀
