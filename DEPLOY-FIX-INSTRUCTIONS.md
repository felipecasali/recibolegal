# 🚀 Instruções de Deploy - Correção Frontend ReciboLegal

## 🎯 **Problema Resolvido**
- ✅ Express configurado para servir assets do `dist/` (Vite build)
- ✅ JavaScript e CSS agora carregam corretamente
- ✅ Página não ficará mais branca

---

## 📋 **Execute no Terminal do Servidor**

### **1. Conectar ao servidor e navegar para o projeto**
```bash
ssh root@recibolegal.com.br
cd /opt/recibolegal
```

### **2. Fazer backup de segurança (opcional, mas recomendado)**
```bash
cp server/index.js server/index.js.backup-$(date +%Y%m%d_%H%M%S)
```

### **3. Atualizar código do repositório**
```bash
git pull origin main
```

### **4. Verificar se a correção foi aplicada**
```bash
grep -n "dist" server/index.js
# Deve mostrar as linhas com 'dist' em vez de 'public'
```

### **5. Verificar se o build do frontend existe**
```bash
ls -la dist/
# Deve mostrar: assets/, index.html, vite.svg
```

### **6. Se necessário, fazer novo build do frontend**
```bash
# Só execute se o diretório dist/ estiver vazio ou desatualizado
npm run build
```

### **7. Parar containers Docker**
```bash
docker-compose -f docker-compose.prod.yml down
```

### **8. Rebuild e restart dos containers**
```bash
docker-compose -f docker-compose.prod.yml up -d --build --force-recreate
```

### **9. Aguardar inicialização dos serviços**
```bash
sleep 30
```

### **10. Verificar status dos containers**
```bash
docker-compose -f docker-compose.prod.yml ps
```

### **11. Testar se a correção funcionou**
```bash
# Teste 1: Homepage deve retornar HTML
curl -I https://recibolegal.com.br/

# Teste 2: JavaScript deve retornar JS (não HTML)
curl -I https://recibolegal.com.br/assets/index-CZ38-PiG.js

# Teste 3: CSS deve retornar CSS (não HTML)  
curl -I https://recibolegal.com.br/assets/index-CoFfQuPx.css

# Teste 4: API deve continuar funcionando
curl -s https://recibolegal.com.br/api/health
```

---

## ✅ **Resultados Esperados**

### **Antes da correção (❌ Problema):**
```bash
curl -I https://recibolegal.com.br/assets/index-CZ38-PiG.js
# content-type: text/html; charset=utf-8  ← ERRADO
```

### **Após a correção (✅ Sucesso):**
```bash
curl -I https://recibolegal.com.br/assets/index-CZ38-PiG.js  
# content-type: application/javascript  ← CORRETO
```

---

## 🧪 **Teste Final no Browser**

Após executar os comandos acima:

1. **Abrir** https://recibolegal.com.br
2. **Verificar** se a página carrega completamente
3. **Abrir DevTools** (F12) → Console
4. **Confirmar** que não há erros de JavaScript
5. **Testar** funcionalidades do ReciboLegal

---

## 🆘 **Se algo der errado**

### **Reverter para backup:**
```bash
cp server/index.js.backup-* server/index.js
docker-compose -f docker-compose.prod.yml up -d --build --force-recreate
```

### **Logs de debug:**
```bash
# Ver logs do container
docker-compose -f docker-compose.prod.yml logs -f recibolegal

# Ver logs em tempo real
docker-compose -f docker-compose.prod.yml logs --tail=50 recibolegal
```

---

## ⏱️ **Tempo Estimado de Deploy**
- **Atualização código**: 30 segundos
- **Rebuild containers**: 2-3 minutos  
- **Inicialização**: 30 segundos
- **Total**: ~4 minutos

---

## 🎉 **Após Deploy Bem-sucedido**

✅ **ReciboLegal funcionando completamente**
✅ **Frontend React carregando**
✅ **Dashboard acessível**  
✅ **WhatsApp bot operacional**
✅ **APIs funcionando**

**URL de teste**: https://recibolegal.com.br 🚀
