# SSL Troubleshooting - ReciboLegal

## Problema Identificado

O site `recibolegal.com.br` estava usando um certificado SSL auto-assinado do Traefik ("TRAEFIK DEFAULT CERT"), o que impedia o Twilio de entregar mensagens WhatsApp devido a problemas de verificação SSL.

## Causa Raiz

- Traefik não conseguiu obter certificado Let's Encrypt
- Sistema falling back para certificado padrão auto-assinado
- Twilio rejeita webhooks com certificados não confiáveis

## Solução Implementada

### 1. Scripts de Correção

- **`fix-ssl.sh`**: Script para corrigir problemas SSL existentes
- **`deploy-prod.sh`**: Script de deployment com correção SSL integrada
- **`check-ssl.sh`**: Script para monitorar status do SSL

### 2. Melhorias na Configuração

- Adicionado servidor ACME explícito para Let's Encrypt
- Habilitado logs detalhados no Traefik
- Configuração de access logs
- Ordem correta de inicialização dos containers

### 3. Como Usar

#### Correção Imediata
```bash
./fix-ssl.sh
```

#### Deployment Completo
```bash
./deploy-prod.sh
```

#### Verificação de Status
```bash
./check-ssl.sh
```

## Verificação Manual

### Testar Certificado SSL
```bash
openssl s_client -connect recibolegal.com.br:443 -servername recibolegal.com.br
```

### Verificar Logs do Traefik
```bash
docker-compose -f docker-compose.prod.yml logs traefik | grep -E "(acme|certificate|error)"
```

### Testar Webhook
```bash
curl -I https://recibolegal.com.br/api/whatsapp/webhook
```

## Configuração Let's Encrypt

O Traefik está configurado para:
- Usar TLS Challenge do Let's Encrypt
- Email: felipecasali@gmail.com
- Storage em volume persistente
- Renovação automática de certificados

## Monitoramento

### Sinais de Sucesso
- Certificado emitido por "Let's Encrypt Authority"
- Comando curl retorna status HTTP sem erros SSL
- Webhook do Twilio funciona corretamente

### Sinais de Problemas
- Certificado "TRAEFIK DEFAULT CERT"
- Erros SSL em curl
- Mensagens WhatsApp não sendo entregues

## Troubleshooting Avançado

### Se Let's Encrypt Falhar
1. Verificar se as portas 80 e 443 estão acessíveis
2. Confirmar que o DNS aponta para o servidor correto
3. Verificar rate limits do Let's Encrypt
4. Checar logs detalhados do Traefik

### Rate Limits Let's Encrypt
- 50 certificados por domínio registrado por semana
- 5 certificados duplicate por semana
- Aguardar 1 hora entre tentativas falhadas

### Comandos de Debug
```bash
# Ver configuração atual do acme.json
docker-compose -f docker-compose.prod.yml exec traefik cat /letsencrypt/acme.json

# Logs em tempo real
docker-compose -f docker-compose.prod.yml logs -f traefik

# Forçar renovação de certificado
docker-compose -f docker-compose.prod.yml restart traefik
```

## Integração com Twilio

Com SSL funcionando corretamente:
1. Twilio consegue verificar o certificado
2. Webhooks são entregues sem erro
3. Mensagens WhatsApp funcionam normalmente

## Manutenção

- Certificados Let's Encrypt são renovados automaticamente
- Verificar status mensalmente com `./check-ssl.sh`
- Monitorar logs em caso de problemas
