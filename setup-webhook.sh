#!/bin/bash

# ReciboLegal Twilio Setup Helper

echo "🚀 ReciboLegal - Twilio WhatsApp Setup"
echo "====================================="
echo ""

# Check if server is running
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Server is running on port 3001"
else
    echo "❌ Server is not running. Please start it with: npm run server"
    exit 1
fi

echo ""
echo "🔗 Starting ngrok tunnel..."
echo "This will create a public URL for your webhook"
echo ""

# Start ngrok in background
ngrok http 3001 --log=stdout > ngrok.log 2>&1 &
NGROK_PID=$!

# Wait a moment for ngrok to start
sleep 3

# Get the public URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o "https://[^\"]*\.ngrok\.io")

if [ -z "$NGROK_URL" ]; then
    echo "❌ Failed to get ngrok URL. Check if ngrok is running."
    echo "You can manually run: ngrok http 3001"
    exit 1
fi

echo "✅ Ngrok tunnel created!"
echo ""
echo "📋 Copy this webhook URL to Twilio:"
echo "🔗 ${NGROK_URL}/api/whatsapp/webhook"
echo ""
echo "📱 Steps to complete setup:"
echo "1. Go to Twilio Console > Messaging > Try it out > Send a WhatsApp message"
echo "2. Scroll down to 'Sandbox Configuration'"
echo "3. Paste this URL in the 'When a message comes in' field:"
echo "   ${NGROK_URL}/api/whatsapp/webhook"
echo "4. Save the configuration"
echo ""
echo "🧪 Test your bot by sending 'oi' to your Twilio WhatsApp number"
echo ""
echo "⚠️  Keep this terminal open - ngrok tunnel will stay active"
echo "    To stop: kill $NGROK_PID"

# Keep script running
wait $NGROK_PID
