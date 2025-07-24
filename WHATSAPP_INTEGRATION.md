# ReciboLegal - WhatsApp Integration & PDF Generation

## 🚀 Features Added

### ✅ What's Working Now

1. **PDF Generation** - Professional receipts with digital signatures
2. **WhatsApp Bot Integration** - Complete conversational flow
3. **Backend API** - Express server with endpoints for receipts and WhatsApp
4. **Frontend Integration** - React components for WhatsApp and PDF functionality
5. **File Download** - Automatic PDF downloads after generation

## 📱 WhatsApp Integration

### How It Works
1. Users send "Oi" to start the conversation
2. Bot guides them through data collection:
   - Client name
   - Client CPF/CNPJ
   - Service name
   - Service description (optional)
   - Amount
   - Date
3. Bot confirms data and generates PDF
4. PDF is automatically sent via WhatsApp

### Setup Instructions

1. **Create Twilio Account**
   - Go to [Twilio Console](https://console.twilio.com/)
   - Sign up for a free account
   - Get your Account SID and Auth Token

2. **Configure WhatsApp Sandbox**
   - Go to Messaging > Try it out > Send a WhatsApp message
   - Follow instructions to connect your WhatsApp to the sandbox
   - Note your WhatsApp number (usually +14155238886)

3. **Update Environment Variables**
   ```bash
   # Edit .env file
   TWILIO_ACCOUNT_SID=your_account_sid_here
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
   ```

4. **Set Up Webhook**
   - In Twilio Console, go to WhatsApp Sandbox Settings
   - Set webhook URL to: `https://yourdomain.com/api/whatsapp/webhook`
   - For local development, use ngrok: `ngrok http 3001`

## 📄 PDF Generation

### Features
- Professional receipt layout
- Digital signature with verification hash
- Amount in words (Brazilian Portuguese)
- Legal compliance formatting
- Automatic file naming and storage

### API Endpoints

#### Generate Receipt
```http
POST /api/receipts/generate
Content-Type: application/json

{
  "clientName": "João Silva",
  "clientDocument": "123.456.789-00",
  "serviceName": "Consultoria em Marketing",
  "serviceDescription": "Estratégia digital completa",
  "amount": "1500.00",
  "date": "23/07/2025"
}
```

#### Download Receipt
```http
GET /api/receipts/download/:receiptId
```

#### List Receipts
```http
GET /api/receipts/list
```

## 🛠️ Development

### Running the Project

1. **Start Frontend** (Terminal 1)
   ```bash
   npm run dev
   ```

2. **Start Backend** (Terminal 2)
   ```bash
   npm run server
   ```

3. **Start Both** (Alternative)
   ```bash
   npm run dev:full
   ```

### Testing

1. **Test PDF Generation**
   - Click "Demo: Criar Recibo" on the homepage
   - Fill the form and submit
   - PDF will be generated and downloaded automatically

2. **Test WhatsApp Integration**
   - Click "🚀 Começar pelo WhatsApp"
   - Enter your phone number
   - Click "💬 Abrir WhatsApp" to test the flow
   - Use "🧪 Teste API" to send a test message (requires Twilio setup)

## 📁 File Structure

```
ReciboLegal/
├── src/
│   ├── components/
│   │   ├── ReceiptForm.jsx          # PDF generation form
│   │   ├── ReceiptForm.css
│   │   ├── WhatsAppIntegration.jsx  # WhatsApp testing interface
│   │   └── WhatsAppIntegration.css
│   ├── services/
│   │   └── api.js                   # API service layer
│   └── constants/
│       └── index.js                 # App constants
├── server/
│   ├── index.js                     # Main server file
│   ├── routes/
│   │   ├── whatsapp.js             # WhatsApp bot logic
│   │   └── receipts.js             # PDF generation logic
│   └── receipts/                   # Generated PDFs storage
├── .env                            # Environment variables
└── .env.example                    # Environment template
```

## 🔧 Environment Variables

```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

## 🚀 Deployment

### Production Setup
1. Deploy backend to a cloud service (Heroku, Railway, etc.)
2. Set up environment variables in production
3. Configure Twilio webhook to production URL
4. Deploy frontend to Vercel/Netlify
5. Update CORS settings for production domains

### Recommended Services
- **Backend**: Railway, Heroku, or DigitalOcean
- **Frontend**: Vercel or Netlify
- **File Storage**: AWS S3 or Cloudinary (for production)
- **Database**: MongoDB Atlas or PostgreSQL (for user management)

## 📱 WhatsApp Commands

- `oi` or `olá` - Start conversation
- `recomeçar` - Restart the process
- `pular` - Skip service description
- `hoje` - Use current date
- `sim` / `não` - Confirm or reject data

## 🔐 Security Features

- Digital signature with SHA-256 hash
- Document verification system
- Secure file storage
- Input validation and sanitization
- CORS protection

## 📊 Monitoring

- Server health check: `GET /api/health`
- Active sessions: `GET /api/whatsapp/sessions`
- Receipt listing: `GET /api/receipts/list`

## 🐛 Troubleshooting

### Common Issues

1. **Server not starting**
   - Check Node.js version (requires 18+)
   - Verify environment variables
   - Check port availability

2. **WhatsApp not working**
   - Verify Twilio credentials
   - Check webhook configuration
   - Ensure sandbox is properly set up

3. **PDF generation failing**
   - Check write permissions
   - Verify jsPDF dependency
   - Check server logs for errors

### Logs Location
- Server logs: Console output
- Generated PDFs: `server/receipts/`
- Error details: Browser console (frontend)

## 🎯 Next Steps

### Planned Features
- User authentication
- Receipt templates
- Email integration
- Payment integration
- Analytics dashboard
- Multi-language support

### Production Enhancements
- Database integration
- Cloud file storage
- Rate limiting
- User management
- Admin panel
- Backup system
