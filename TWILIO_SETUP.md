# Twilio WhatsApp Setup Guide for ReciboLegal

## 🔍 Step 1: Configure Your Twilio Credentials

1. Go to your [Twilio Console Dashboard](https://console.twilio.com/)
2. Copy these values from your dashboard:
   - **Account SID** (starts with "AC...")
   - **Auth Token** (click "Show" to reveal)

Now update your `.env` file:

```bash
# Open .env file and replace these lines:
TWILIO_ACCOUNT_SID=ACcd5111778d87c880b98db0cbfc7539e5
TWILIO_AUTH_TOKEN=cf32808587b4c4514bc673d9f83fe71b
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

## 📱 Step 2: Configure WhatsApp Sandbox

1. In Twilio Console, go to **Develop > Messaging > Try it out > Send a WhatsApp message**
2. You'll see your sandbox number (usually +1 415 523 8886)
3. Follow the instructions to connect your personal WhatsApp:
   - Send the code (like "join <unique-code>") to the sandbox number
   - You should receive a confirmation message

## 🔗 Step 3: Set Up Webhook - Choose ONE Option

### Option A: Using ngrok (Recommended for testing)

1. Sign up for free ngrok account: https://dashboard.ngrok.com/signup
2. Get your authtoken: https://dashboard.ngrok.com/get-started/your-authtoken
3. Run: `ngrok config add-authtoken YOUR_AUTHTOKEN`
4. Run: `ngrok http 3001`
5. Copy the https URL (like: https://abc123.ngrok.io)

### Option B: Using localhost.run (No signup required)

Run this command:
```bash
ssh -R 80:localhost:3001 nokey@localhost.run
```

This will give you a public URL like: https://abc123.localhost.run

### Option C: Manual Testing (No webhook needed)

You can test the bot manually using the API endpoint in your React app.

## 🛠️ Step 4: Configure Webhook in Twilio

1. Go to **Messaging > Try it out > Send a WhatsApp message**
2. Scroll down to **Sandbox Configuration**
3. In "When a message comes in" field, enter:
   ```
   https://YOUR_PUBLIC_URL/api/whatsapp/webhook
   ```
   For example: `https://abc123.ngrok.io/api/whatsapp/webhook`
4. Set HTTP method to **POST**
5. Save Configuration

## 🧪 Step 5: Test Your Bot

1. Make sure your server is running: `npm run server`
2. Make sure your tunnel is active (ngrok or localhost.run)
3. Send "oi" to your Twilio WhatsApp sandbox number
4. The bot should respond with the welcome message!

## 📋 Quick Setup Commands

```bash
# 1. Start your server (if not running)
npm run server

# 2. In another terminal, start ngrok (after auth setup)
ngrok http 3001

# 3. Or use localhost.run
ssh -R 80:localhost:3001 nokey@localhost.run

# 4. Update .env with your Twilio credentials
# 5. Configure webhook URL in Twilio Console
# 6. Test by sending "oi" to your sandbox number
```

## 🐛 Troubleshooting

### Bot not responding?
1. Check server is running: `curl http://localhost:3001/api/health`
2. Check webhook URL is correct in Twilio
3. Check your .env file has correct credentials
4. Check ngrok/tunnel is still active

### Ngrok issues?
- Make sure you've added your authtoken: `ngrok config add-authtoken YOUR_TOKEN`
- Alternative: Use localhost.run (no signup needed)

### Credentials not working?
- Double-check Account SID and Auth Token in Twilio Console
- Make sure there are no extra spaces in .env file
- Restart server after updating .env

## 📞 Support

Need help? Check the Twilio Console logs:
- Go to Monitor > Logs > Errors
- Look for webhook-related errors
