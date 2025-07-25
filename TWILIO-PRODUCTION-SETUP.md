# 📱 Configuração do Twilio WhatsApp para Produção

## 🎯 Visão Geral

O ReciboLegal utiliza o Twilio WhatsApp Business API para permitir que os usuários criem recibos diretamente pelo WhatsApp através de um bot conversacional inteligente.

## 🚀 Scripts Disponíveis

### 1. `setup-twilio-whatsapp.sh`
**Função**: Configuração básica e teste das credenciais do Twilio
**Uso**: `./setup-twilio-whatsapp.sh`

### 2. `configure-twilio-production.sh` 
**Função**: Configuração completa para produção com validações abrangentes
**Uso**: `./configure-twilio-production.sh`

## 📋 Pré-requisitos

### 1. Conta Twilio
- ✅ Conta Twilio criada
- 🔑 Account SID e Auth Token obtidos
- 💳 Billing configurado (necessário para WhatsApp Business API)

### 2. Aplicação
- ✅ ReciboLegal rodando em https://recibolegal.com.br
- 🌐 Endpoint `/api/whatsapp/webhook` acessível
- ⚙️ Variáveis de ambiente configuradas

## 🔧 Configuração Passo a Passo

### Etapa 1: Verificar Credenciais
```bash
./configure-twilio-production.sh
```

Este script irá:
- ✅ Validar credenciais do Twilio
- 🌐 Testar saúde da aplicação
- 📱 Verificar endpoint do webhook
- 📋 Mostrar status da configuração

### Etapa 2: Configurar Webhook no Twilio

1. **Acesse o Console Twilio**: https://console.twilio.com
2. **Vá para WhatsApp Sandbox**: 
   - Navigate: Develop > Messaging > Try it out > Send a WhatsApp message
3. **Configure o Webhook**:
   - **URL**: `https://recibolegal.com.br/api/whatsapp/webhook`
   - **HTTP Method**: `POST`
   - **Save Configuration**

### Etapa 3: Testar no Sandbox

1. **Obtenha o código do sandbox**:
   - Acesse: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
   - Copie seu código único (ex: `join abc-def`)

2. **Teste no WhatsApp**:
   - Envie `join abc-def` para +1 415 523 8886
   - Envie `oi` para iniciar o fluxo de criação de recibo
   - Siga as instruções do bot

### Etapa 4: Solicitar WhatsApp Business API

1. **No Console Twilio**:
   - Vá para: Messaging > WhatsApp > Senders
   - Clique em "Request Access"

2. **Preencha o formulário**:
   - **Company Name**: ReciboLegal
   - **Business Description**: Plataforma para geração de recibos legais
   - **Use Case**: Transactional notifications and customer support
   - **Monthly Volume**: Comece com "Less than 1,000 messages/month"

3. **Aguarde aprovação** (1-5 dias úteis)

## 🔒 Variáveis de Ambiente

### Configuração Atual (`.env.production`):
```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid_here                 # ⚠️ Use your real Account SID
TWILIO_AUTH_TOKEN=your_auth_token_here                   # ⚠️ Use your real Auth Token
TWILIO_WHATSAPP_NUMBER=whatsapp:+YOUR_WHATSAPP_BUSINESS_NUMBER
TWILIO_WHATSAPP_FROM=whatsapp:+YOUR_WHATSAPP_BUSINESS_NUMBER
TWILIO_WHATSAPP_TO=whatsapp:+5511970843096
```

### Após aprovação, atualizar:
```bash
# Substitua YOUR_WHATSAPP_BUSINESS_NUMBER pelo número aprovado
TWILIO_WHATSAPP_NUMBER=whatsapp:+55119XXXXXXXX
TWILIO_WHATSAPP_FROM=whatsapp:+55119XXXXXXXX
```

## 🤖 Fluxo do Bot

### Comandos Disponíveis:
- `oi` / `olá` - Iniciar criação de recibo
- `status` - Ver informações da conta
- `upgrade` / `planos` - Ver planos disponíveis
- `recomeçar` - Reiniciar processo atual

### Fluxo de Criação:
1. **Nome do Cliente** - Nome completo
2. **CPF/CNPJ** - Documento do cliente
3. **Nome do Serviço** - Descrição do serviço
4. **Descrição Detalhada** - Opcional (pode pular)
5. **Valor** - Valor numérico (ex: 1500.50)
6. **Data** - DD/MM/AAAA ou "hoje"
7. **Confirmação** - SIM/NÃO
8. **Geração** - Recibo criado e enviado

## 🔍 Monitoramento e Logs

### Verificar Logs da Aplicação:
```bash
# No servidor
docker-compose -f docker-compose.prod.yml logs -f app

# Localmente
npm run dev
```

### Logs do Twilio:
- **Message Logs**: https://console.twilio.com/us1/monitor/logs/sms
- **Webhook Logs**: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming

### Endpoints de Saúde:
- **API Health**: https://recibolegal.com.br/api/health
- **Webhook Test**: https://recibolegal.com.br/api/whatsapp/webhook

## 🚨 Troubleshooting

### Problema: Webhook não recebe mensagens
**Soluções**:
1. Verificar se o webhook está configurado no Twilio Console
2. Testar se a URL está acessível: `curl https://recibolegal.com.br/api/whatsapp/webhook`
3. Verificar logs da aplicação para erros
4. Confirmar que a aplicação está rodando

### Problema: Bot não responde
**Soluções**:
1. Verificar se as credenciais estão corretas
2. Testar com `./configure-twilio-production.sh`
3. Verificar se o número está no formato correto
4. Checar logs para erros de webhook

### Problema: Erro 403 - Limite excedido
**Soluções**:
1. Usuário atingiu limite do plano
2. Bot informará sobre upgrade automático
3. Verificar sistema de billing no backend

## 📞 Suporte

### Links Úteis:
- **Twilio Console**: https://console.twilio.com
- **Twilio Support**: https://support.twilio.com
- **WhatsApp Business API Docs**: https://www.twilio.com/docs/whatsapp

### Contatos:
- **Twilio Support**: Via console (chat/ticket)
- **Meta Business Support**: https://business.facebook.com/help

## 🎯 Próximos Passos

1. ✅ **Configuração Básica** - Scripts executados
2. 🔄 **Sandbox Testing** - Testar fluxo completo
3. 📝 **Business Verification** - Verificar empresa no Meta
4. ⏳ **API Approval** - Aguardar aprovação (1-5 dias)
5. 🔧 **Production Setup** - Atualizar variáveis e testar
6. 📊 **Monitoring** - Implementar alertas e logs
7. 🚀 **Go Live** - Lançar oficialmente

## 📈 Métricas e KPIs

### Monitorar:
- **Taxa de entrega** de mensagens
- **Taxa de conversão** do funil de criação
- **Abandono** em cada etapa
- **Erros** de webhook
- **Performance** da API

### Dashboards:
- Twilio Console (mensagens)
- Logs da aplicação (conversões)
- Analytics do ReciboLegal (receitas)
