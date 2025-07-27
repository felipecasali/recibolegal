# 🔧 Soluções Chrome - ERR_SOCKET_NOT_CONNECTED

## ✅ Servidor OK
O diagnóstico confirmou que o servidor está funcionando perfeitamente:
- SSL válido (Let's Encrypt até outubro/2025)
- Porta 443 aberta e respondendo
- DNS resolvendo corretamente para 137.184.182.167

## 🚨 Problema identificado: Chrome específico

### 1. **Teste Modo Incógnito** (MAIS PROVÁVEL)
```
Cmd+Shift+N → https://recibolegal.com.br/
```

### 2. **Limpar Cache Chrome**
```
1. Chrome → Configurações → Privacidade e segurança
2. Limpar dados de navegação
3. Selecionar "Todos os períodos"
4. Marcar: Cookies, Cache, Dados de sites
5. Limpar dados
```

### 3. **Desativar Extensões**
```
1. Chrome → Mais ferramentas → Extensões
2. Desativar todas temporariamente
3. Testar o site
```

### 4. **Resetar Configurações de Rede Chrome**
```
1. Fechar Chrome completamente
2. Abrir Terminal:
   rm -rf ~/Library/Application\ Support/Google/Chrome/Default/Network*
3. Reabrir Chrome
```

### 5. **DNS Público** (Se problema persistir)
```
1. Configurações Sistema → Rede
2. WiFi → Avançado → DNS
3. Adicionar: 8.8.8.8 e 1.1.1.1
4. Aplicar
```

### 6. **Última opção - Reset Chrome**
```
Chrome → Configurações → Avançado → Redefinir e limpar
→ Restaurar configurações padrão
```

## 🧪 Como testar
1. Tente modo incógnito primeiro
2. Se funcionar = problema de cache/extensões
3. Se não funcionar = teste outro navegador
4. Safari/Firefox funcionando = confirma problema Chrome

## 📞 Suporte
Se nenhuma solução funcionar, o problema pode ser:
- Antivírus bloqueando Chrome especificamente
- Proxy corporativo/escola
- Configuração específica do macOS
