# Guia de Correção SSL - ReciboLegal

## 🚨 PROBLEMA IDENTIFICADO

O Twilio não consegue entregar mensagens WhatsApp porque o site `recibolegal.com.br` está usando um **certificado SSL auto-assinado** ("TRAEFIK DEFAULT CERT") em vez de um certificado válido do Let's Encrypt.

## 📋 SOLUÇÃO - PASSOS A EXECUTAR NO SERVIDOR

### 1. Conectar ao Servidor de Produção
```bash
ssh root@recibolegal.com.br
cd /path/to/recibolegal  # Navegar para o diretório do projeto
```

### 2. Fazer Backup da Configuração Atual
```bash
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml ps  # Verificar que tudo parou
```

### 3. Executar Script de Correção SSL
```bash
# Dar permissão ao script
chmod +x fix-ssl.sh

# Executar correção
./fix-ssl.sh
```

### 4. Verificar se a Correção Funcionou
```bash
# Aguardar 2-3 minutos e executar
./check-ssl.sh
```

### 5. Se Ainda Houver Problemas - Debug Manual

#### Ver logs detalhados do Traefik:
```bash
docker-compose -f docker-compose.prod.yml logs traefik | grep -E "(acme|certificate|error|ERROR)"
```

#### Verificar se o acme.json foi criado:
```bash
docker-compose -f docker-compose.prod.yml exec traefik ls -la /letsencrypt/
```

#### Testar certificado manualmente:
```bash
openssl s_client -connect recibolegal.com.br:443 -servername recibolegal.com.br
```

### 6. Testar Webhook do Twilio
```bash
curl -X POST -H "User-Agent: TwilioProxy/1.1" https://recibolegal.com.br/api/whatsapp/webhook
```
**Resposta esperada:** HTTP 405 (Method Not Allowed) - isso é normal!

## 🔧 TROUBLESHOOTING

### Se Let's Encrypt Falhar:

1. **Verificar DNS:**
   ```bash
   dig recibolegal.com.br
   ```
   Deve apontar para o IP do servidor.

2. **Verificar portas abertas:**
   ```bash
   netstat -tlnp | grep :80
   netstat -tlnp | grep :443
   ```

3. **Limpar cache do Let's Encrypt:**
   ```bash
   docker volume rm recibolegal_traefik_letsencrypt
   docker-compose -f docker-compose.prod.yml up -d
   ```

4. **Verificar rate limits:**
   - Let's Encrypt permite 50 certificados por semana
   - Se atingiu o limite, aguardar 1 semana
   - Usar staging temporariamente se necessário

### Se Ainda Não Funcionar:

1. **Usar script de deployment completo:**
   ```bash
   ./deploy-prod.sh
   ```

2. **Reiniciar serviços na ordem correta:**
   ```bash
   docker-compose -f docker-compose.prod.yml down
   docker-compose -f docker-compose.prod.yml up -d traefik
   sleep 30
   docker-compose -f docker-compose.prod.yml up -d recibolegal
   ```

## ✅ COMO SABER QUE FUNCIONOU

### Sinais de Sucesso:
- ✅ `./check-ssl.sh` mostra "Let's Encrypt válido"
- ✅ `curl https://recibolegal.com.br/api/whatsapp/webhook` não mostra erro SSL
- ✅ Mensagens WhatsApp começam a funcionar novamente

### Teste Final - Webhook do Twilio:
1. Abrir console do Twilio
2. Enviar mensagem de teste
3. Verificar se chegou no WhatsApp

## 📞 SUPORTE

Se os problemas persistirem:

1. **Capturar logs completos:**
   ```bash
   docker-compose -f docker-compose.prod.yml logs > debug-logs.txt
   ```

2. **Verificar configuração do Traefik:**
   ```bash
   docker-compose -f docker-compose.prod.yml config
   ```

3. **Contactar suporte técnico com:**
   - Logs do Traefik
   - Saída do comando `./check-ssl.sh`
   - Output do `openssl s_client`

## 🔄 MANUTENÇÃO FUTURA

- **Verificação mensal:** Executar `./check-ssl.sh`
- **Renovação automática:** Let's Encrypt renova automaticamente
- **Monitoramento:** Certificado válido por 90 dias

---

**⚠️ IMPORTANTE:** Execute estes comandos no servidor de produção, não localmente!
