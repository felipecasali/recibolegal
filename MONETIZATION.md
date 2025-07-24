# 📄 ReciboLegal - Sistema de Monetização

Sistema completo de geração de recibos com integração WhatsApp, pagamentos Stripe e gestão de usuários Firebase.

## 🚀 Novidades v2.0

### ✅ Implementado
- **Firebase Authentication & Database** - Gestão completa de usuários
- **Stripe Integration** - Pagamentos e assinaturas recorrentes
- **User Dashboard** - Interface para gerenciar conta e histórico
- **Usage Tracking** - Controle de limites e cotas por plano
- **Subscription Plans** - 4 planos com diferentes funcionalidades
- **Rate Limiting** - Controle de uso por usuário

### 📋 Planos Disponíveis

| Plano | Preço | Recibos/mês | Recursos |
|-------|-------|-------------|----------|
| **Gratuito** | R$ 0 | 5 | WhatsApp, PDF, Suporte básico |
| **Básico** | R$ 19,90 | 50 | + Dashboard, Histórico, Suporte prioritário |
| **Profissional** | R$ 39,90 | 200 | + Contratos, API access, Suporte premium |
| **Ilimitado** | R$ 79,90 | ∞ | + Webhooks, Suporte 24/7 |

## 🔧 Configuração

### 1. Firebase Setup

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Crie um novo projeto: `recibolegal-prod`
3. Ative **Authentication** e **Firestore Database**
4. Copie as credenciais para o `.env`:

```env
# Firebase Configuration
FIREBASE_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxx
FIREBASE_AUTH_DOMAIN=recibolegal-prod.firebaseapp.com
FIREBASE_PROJECT_ID=recibolegal-prod
FIREBASE_STORAGE_BUCKET=recibolegal-prod.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789012
FIREBASE_APP_ID=1:123456789012:web:xxxxxxxxxxxxx
```

### 2. Stripe Setup

1. Acesse [Stripe Dashboard](https://dashboard.stripe.com/)
2. Crie os produtos e preços:
   - **Básico**: R$ 19,90/mês
   - **Profissional**: R$ 39,90/mês
   - **Ilimitado**: R$ 79,90/mês
3. Configure webhook endpoint: `{sua_url}/api/subscription/webhook`
4. Adicione as credenciais ao `.env`:

```env
# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxx

# Stripe Price IDs
STRIPE_BASIC_PRICE_ID=price_xxxxxxxxxxxxxxxxxx
STRIPE_PRO_PRICE_ID=price_xxxxxxxxxxxxxxxxxx
STRIPE_UNLIMITED_PRICE_ID=price_xxxxxxxxxxxxxxxxxx
```

### 3. Firestore Collections

O sistema criará automaticamente as coleções:

```
📁 users/
  └── {phone_number}
      ├── name: string
      ├── email: string
      ├── plan: string
      ├── receiptsUsed: number
      ├── stripeCustomerId: string
      ├── stripeSubscriptionId: string
      └── subscriptionStatus: string

📁 receipts/
  └── {receipt_id}
      ├── userPhone: string
      ├── clientName: string
      ├── serviceName: string
      ├── amount: number
      └── createdAt: timestamp

📁 usage/
  └── {usage_id}
      ├── userPhone: string
      ├── type: string
      ├── receiptId: string
      └── createdAt: timestamp
```

## 📱 Novas Funcionalidades

### Dashboard do Usuário
```jsx
import UserDashboard from './components/UserDashboard.jsx'

// Uso no App
<UserDashboard userPhone="+5511999999999" />
```

### Planos de Assinatura
```jsx
import SubscriptionPlans from './components/SubscriptionPlans.jsx'

// Página de planos
<SubscriptionPlans />
```

### Verificação de Limites
```javascript
// Antes de gerar recibo
const canGenerate = await userService.canGenerateReceipt(userPhone)
if (!canGenerate) {
  return res.status(403).json({
    error: 'Receipt limit exceeded',
    message: 'Limite mensal atingido. Faça upgrade.',
    upgradeUrl: '/plans'
  })
}
```

## 🔄 Fluxo de Pagamento

1. **Usuário seleciona plano** → `SubscriptionPlans.jsx`
2. **Cria sessão Stripe** → `POST /api/subscription/create-checkout-session`
3. **Redireciona para Stripe** → Checkout hospedado
4. **Webhook confirma pagamento** → `POST /api/subscription/webhook`
5. **Atualiza banco Firebase** → Upgrade automático

## 📊 Controle de Uso

### Verificação Automática
```javascript
// A cada geração de recibo
await userService.recordReceiptGeneration(userPhone, receiptData)

// Verificação de limite
const stats = await userService.getUserStats(userPhone)
console.log({
  currentMonthUsage: stats.currentMonthUsage,
  monthlyLimit: stats.monthlyLimit,
  remainingReceipts: stats.remainingReceipts
})
```

### Rate Limiting
```javascript
// Implementado em todas as rotas críticas
const rateLimit = require('express-rate-limit')

const receiptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})
```

## 🌐 APIs Disponíveis

### Subscription Management
```
GET    /api/subscription/plans
POST   /api/subscription/create-checkout-session
POST   /api/subscription/create-portal-session
GET    /api/subscription/status/:userPhone
POST   /api/subscription/webhook
```

### Enhanced Receipt Generation
```
POST   /api/receipts/generate
# Agora inclui verificação de limites e tracking
```

## 🚀 Deploy

### Variáveis Obrigatórias
```env
# Existing
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# New Required
FIREBASE_PROJECT_ID=recibolegal-prod
FIREBASE_API_KEY=AIzaSyBxxxxxxx
STRIPE_SECRET_KEY=sk_live_xxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxx
STRIPE_BASIC_PRICE_ID=price_xxxxxxx
STRIPE_PRO_PRICE_ID=price_xxxxxxx
STRIPE_UNLIMITED_PRICE_ID=price_xxxxxxx
```

### Checklist de Deploy
- [ ] Firebase projeto criado e configurado
- [ ] Stripe produtos e preços criados
- [ ] Webhook Stripe configurado
- [ ] Variáveis de ambiente configuradas
- [ ] Domínio personalizado configurado
- [ ] SSL/HTTPS ativo

## 🔍 Monitoramento

### Logs Importantes
```javascript
// Geração de recibo
console.log('📄 RECIBO GERADO COM SUCESSO!')
console.log(`🔗 Link de Download: ${downloadUrl}`)

// Pagamento confirmado
console.log('💰 Payment succeeded:', invoice.id)

// Limite atingido
console.log('🚫 Limite mensal atingido para:', userPhone)
```

### Métricas Stripe Dashboard
- Receita mensal recorrente (MRR)
- Taxa de conversão por plano
- Churn rate mensal
- Lifetime value (LTV)

## 🛡️ Segurança

- ✅ **Webhook validation** - Stripe signature verification
- ✅ **Rate limiting** - Proteção contra abuse
- ✅ **Input validation** - Sanitização de dados
- ✅ **Firebase rules** - Controle de acesso granular
- ✅ **Environment variables** - Credenciais seguras

## 📈 Próximos Passos

1. **Analytics Dashboard** - Métricas para admin
2. **Email Marketing** - Integração com Mailchimp
3. **Multi-tenant** - Suporte a múltiplos negócios
4. **Mobile App** - React Native
5. **Integração Contábil** - API para contadores

---

🎉 **ReciboLegal v2.0** - Sistema completo de monetização implementado com sucesso!
