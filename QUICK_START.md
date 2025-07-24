# 🚀 Quick Setup Guide - Twilio WhatsApp Integration

## ✅ Current Status
- ✅ Frontend running on http://localhost:5173/
- ✅ Backend running on http://localhost:3001/
- ✅ PDF generation working
- ✅ Twilio testing interface ready
- ⏳ **Next: Configure your Twilio credentials**

## 📱 Step-by-Step Twilio Setup

### 1. Get Your Twilio Credentials

1. Go to [Twilio Console](https://console.twilio.com/)
2. From your dashboard, copy:
   - **Account SID** (starts with "AC...")
   - **Auth Token** (click "Show" to reveal)

### 2. Test Your Credentials

1. In your browser, go to: http://localhost:5173/
2. Click "🚀 Começar pelo WhatsApp"
3. Click the "🧪 Testar Credenciais" tab
4. Paste your Account SID and Auth Token
5. Click "🔍 Testar Credenciais"
6. If successful, click "📋 Copiar para .env"

### 3. Update Your Environment

1. Paste the copied configuration into your `.env` file
2. Restart the server: `Ctrl+C` in the server terminal, then `npm run server`

### 4. Set Up WhatsApp Sandbox

1. In Twilio Console, go to **Messaging > Try it out > Send a WhatsApp message**
2. Follow instructions to connect your WhatsApp:
   - Send the provided code to +1 415 523 8886
   - You should receive a confirmation

### 5. Test the Integration

**Option A: Direct API Test (No webhook needed)**
1. In the WhatsApp integration page, go to "🧪 Testar Credenciais" tab
2. Enter your WhatsApp number
3. Click "📤 Enviar Teste"
4. You should receive a test message!

**Option B: Full Bot Test (Requires webhook)**
1. Set up ngrok or webhook (see TWILIO_SETUP.md)
2. Configure webhook in Twilio Console
3. Send "oi" to your Twilio sandbox number
4. The bot will guide you through creating a receipt

## 🎯 What You Can Test Now

### PDF Generation ✅
- Click "📝 Demo: Criar Recibo"
- Fill the form → PDF generated and downloaded

### WhatsApp API ✅ 
- Use the credential tester to send messages
- Validate your Twilio setup

### Full Bot Flow ⏳
- Requires webhook setup for two-way conversation
- Optional for testing the core functionality

## 🔧 Troubleshooting

**Credentials not working?**
- Double-check Account SID and Auth Token
- Make sure there are no extra spaces
- Use the credential tester first

**Server issues?**
- Check: http://localhost:3001/api/health
- Restart server if needed

**Want to skip webhook setup?**
- Use the "📤 Enviar Teste" feature
- This sends direct messages without needing webhooks

## 📞 Ready to Test!

Your ReciboLegal is ready! Start with the credential tester, then try sending a test message to your WhatsApp. The full bot conversation will work once you set up the webhook, but you can test all the core functionality right now!
