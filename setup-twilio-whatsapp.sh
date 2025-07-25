#!/bin/bash

# ReciboLegal - Twilio WhatsApp Setup Script
# Configures Twilio WhatsApp webhook for production

set -e

echo "📱 ReciboLegal - Twilio WhatsApp Setup"
echo "====================================="

# Check if we're on the server or local machine
if [ -f "/opt/recibolegal/.env.production" ]; then
    echo "   Environment: Production Server"
    ENV_FILE="/opt/recibolegal/.env.production"
else
    echo "   Environment: Local Development"
    ENV_FILE=".env.production"
fi

# Check if .env.production exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: .env.production file not found at $ENV_FILE"
    echo "   Please make sure the environment file exists"
    exit 1
fi

# Load configuration from .env.production
echo "📋 Loading configuration from $ENV_FILE..."
source "$ENV_FILE"

# Validate required environment variables
if [ -z "$TWILIO_ACCOUNT_SID" ] || [ -z "$TWILIO_AUTH_TOKEN" ]; then
    echo "❌ Error: Missing Twilio credentials in $ENV_FILE"
    echo "   Please ensure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are set"
    exit 1
fi

WEBHOOK_URL="https://recibolegal.com.br/api/whatsapp/webhook"

echo ""
echo "📋 Configuration:"
echo "   Account SID: ${TWILIO_ACCOUNT_SID:0:10}...${TWILIO_ACCOUNT_SID: -4}"
echo "   Webhook URL: $WEBHOOK_URL"

echo ""
echo "🔍 Step 1: Testing Twilio Credentials"
echo "====================================="

# Test Twilio credentials
echo "Testing Twilio API connection..."
ACCOUNT_INFO=$(curl -s -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN" \
    "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID.json")

if echo "$ACCOUNT_INFO" | grep -q "friendly_name"; then
    ACCOUNT_NAME=$(echo "$ACCOUNT_INFO" | grep -o '"friendly_name":"[^"]*"' | cut -d'"' -f4)
    echo "✅ Twilio credentials valid"
    echo "   Account: $ACCOUNT_NAME"
else
    echo "❌ Invalid Twilio credentials"
    echo "   Check your TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN"
    exit 1
fi

echo ""
echo "📱 Step 2: WhatsApp Sandbox Configuration"
echo "========================================"

echo "Setting up WhatsApp Sandbox webhook..."

# Configure WhatsApp Sandbox webhook
SANDBOX_RESPONSE=$(curl -s -X POST \
    "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json" \
    -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN" \
    -d "StatusCallback=$WEBHOOK_URL" \
    -d "From=whatsapp:+14155238886" \
    -d "To=$TWILIO_WHATSAPP_TO" \
    -d "Body=ReciboLegal webhook test message" 2>/dev/null || echo "Error")

if echo "$SANDBOX_RESPONSE" | grep -q "sid"; then
    echo "✅ Webhook configured successfully"
    echo "   Test message sent to sandbox"
else
    echo "⚠️  Webhook configuration may need manual setup"
    echo "   This is normal if WhatsApp Business API is not yet approved"
fi

echo ""
echo "🔧 Step 3: Environment Configuration"
echo "==================================="

# Check current WhatsApp number configuration
CURRENT_NUMBER=$(grep "TWILIO_WHATSAPP_NUMBER=" "$ENV_FILE" | cut -d'=' -f2)
echo "Current WhatsApp number: $CURRENT_NUMBER"

if [[ "$CURRENT_NUMBER" == *"YOUR_WHATSAPP_BUSINESS_NUMBER"* ]]; then
    echo ""
    echo "⚠️  WhatsApp Business number not configured yet"
    echo ""
    echo "📋 Manual Configuration Required:"
    echo "1. Wait for Twilio WhatsApp Business API approval"
    echo "2. Get your approved WhatsApp Business number"
    echo "3. Update .env.production with your number:"
    echo ""
    echo "   TWILIO_WHATSAPP_NUMBER=whatsapp:+55119XXXXXXXX"
    echo "   TWILIO_WHATSAPP_FROM=whatsapp:+55119XXXXXXXX"
    echo ""
    echo "4. Redeploy the application"
else
    echo "✅ WhatsApp Business number configured: $CURRENT_NUMBER"
fi

echo ""
echo "🌐 Step 4: Webhook URL Verification"
echo "=================================="

echo "Testing webhook endpoint..."
WEBHOOK_TEST=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$WEBHOOK_URL" || echo "000")

if [ "$WEBHOOK_TEST" = "405" ] || [ "$WEBHOOK_TEST" = "200" ]; then
    echo "✅ Webhook endpoint accessible"
    echo "   Response code: $WEBHOOK_TEST (Expected: 200 or 405)"
else
    echo "❌ Webhook endpoint not accessible"
    echo "   Response code: $WEBHOOK_TEST"
    echo "   Make sure your application is running and HTTPS is working"
fi

echo ""
echo "📱 Step 5: WhatsApp Sandbox Testing"
echo "=================================="

echo "WhatsApp Sandbox Information:"
echo "• Sandbox Number: +1 415 523 8886"
echo "• Join Code: join [your-sandbox-code]"
echo ""
echo "To test WhatsApp integration:"
echo "1. Send 'join [code]' to +1 415 523 8886 on WhatsApp"
echo "2. Your sandbox code is available at:"
echo "   https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn"
echo ""
echo "3. Test sending a message from your app"
echo "4. Check if you receive the message on WhatsApp"

echo ""
echo "📋 Step 6: Production Checklist"
echo "==============================="

echo "Before going live with WhatsApp Business API:"
echo ""
echo "✅ Required Steps:"
echo "   □ Business verification completed"
echo "   □ WhatsApp Business API approved by Twilio"
echo "   □ Assigned WhatsApp Business number"
echo "   □ Updated .env.production with real number"
echo "   □ Webhook URL configured in Twilio Console"
echo "   □ Message templates created (if needed)"
echo "   □ Tested in sandbox environment"
echo ""
echo "⚠️  Important Notes:"
echo "   • WhatsApp Business API approval can take 1-5 business days"
echo "   • You'll need to verify your business with Facebook/Meta"
echo "   • Templates are required for marketing messages"
echo "   • Transactional messages (like receipts) don't need templates"

echo ""
echo "🔗 Useful Links:"
echo "==============="
echo "• Twilio Console: https://console.twilio.com"
echo "• WhatsApp Setup: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn"
echo "• Business Verification: https://business.facebook.com"
echo "• Webhook Logs: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming"

echo ""
echo "🎯 Next Steps:"
echo "=============="
echo "1. Complete business verification with Meta/Facebook"
echo "2. Wait for WhatsApp Business API approval"
echo "3. Update environment variables with approved number"
echo "4. Test webhook integration"
echo "5. Deploy to production"

echo ""
echo "📞 Need Help?"
echo "============"
echo "• Twilio Support: https://support.twilio.com"
echo "• ReciboLegal: Check your application logs for webhook events"
